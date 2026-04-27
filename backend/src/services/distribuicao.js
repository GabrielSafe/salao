const prisma = require('../config/prisma');

const TIMEOUT_PROPOSTA_MS = 10_000; // 10 segundos
const timeoutsPendentes = new Map();

/**
 * Roda a distribuição para todos os atendimentos AGUARDANDO.
 */
async function rodarDistribuicao(salaoId, io) {
  const atendimentos = await prisma.atendimento.findMany({
    where: { salaoId, status: 'AGUARDANDO' },
    orderBy: { createdAt: 'asc' },
    include: { cliente: true },
  });

  for (const atendimento of atendimentos) {
    await tentarProporAtendimento(atendimento, salaoId, io);
  }
}

/**
 * Encontra a 1ª funcionária disponível na fila e envia uma proposta.
 */
async function tentarProporAtendimento(atendimento, salaoId, io) {
  try {
    let funcionariaId = null;
    let atendimentoComDados = null;

    await prisma.$transaction(async (tx) => {
      const atual = await tx.atendimento.findUnique({ where: { id: atendimento.id } });
      if (!atual || atual.status !== 'AGUARDANDO') return;

      const entradaFila = await tx.filaEntrada.findFirst({
        where: { salaoId, especialidade: atendimento.tipoServico },
        orderBy: { entradaEm: 'asc' },
        include: { funcionaria: true },
      });

      if (!entradaFila) return;
      if (!['ONLINE', 'AUSENTE'].includes(entradaFila.funcionaria.status)) return;

      funcionariaId = entradaFila.funcionariaId;

      // Muda para PENDENTE_ACEITE para bloquear nova proposta simultânea
      atendimentoComDados = await tx.atendimento.update({
        where: { id: atendimento.id },
        data: { status: 'PENDENTE_ACEITE', propostaParaId: funcionariaId },
        include: { cliente: true },
      });
    });

    if (!funcionariaId || !atendimentoComDados) return;

    // Emite proposta para a funcionária
    setImmediate(() => {
      if (io) {
        io.to(`funcionaria:${funcionariaId}`).emit('proposta_atendimento', atendimentoComDados);
      }
    });

    // Timeout: se não responder em 10s → recusa automática
    const timer = setTimeout(() => {
      recusarProposta(atendimentoComDados.id, funcionariaId, salaoId, io, true);
    }, TIMEOUT_PROPOSTA_MS);

    timeoutsPendentes.set(atendimentoComDados.id, timer);

  } catch (err) {
    console.error('[distribuicao] Erro ao propor atendimento:', err.message);
  }
}

/**
 * Funcionária ACEITA a proposta.
 */
async function aceitarProposta(atendimentoId, funcionariaId, salaoId, io) {
  // Cancela o timeout
  const timer = timeoutsPendentes.get(atendimentoId);
  if (timer) { clearTimeout(timer); timeoutsPendentes.delete(atendimentoId); }

  try {
    let atendimentoAtualizado = null;

    await prisma.$transaction(async (tx) => {
      const atend = await tx.atendimento.findUnique({ where: { id: atendimentoId } });
      if (!atend || atend.status !== 'PENDENTE_ACEITE') return;
      if (atend.propostaParaId !== funcionariaId) return;

      // Atualiza status da funcionária atomicamente
      const { count } = await tx.funcionaria.updateMany({
        where: { id: funcionariaId, status: { in: ['ONLINE', 'AUSENTE'] } },
        data: { status: 'EM_ATENDIMENTO' },
      });
      if (count === 0) return;

      // Remove de todas as filas
      await tx.filaEntrada.deleteMany({ where: { funcionariaId } });

      // Confirma o atendimento
      atendimentoAtualizado = await tx.atendimento.update({
        where: { id: atendimentoId },
        data: {
          funcionariaId,
          status: 'EM_ATENDIMENTO',
          iniciadoEm: new Date(),
          propostaParaId: null,
        },
        include: {
          cliente: true,
          funcionaria: { include: { usuario: true } },
        },
      });
    });

    if (atendimentoAtualizado) {
      setImmediate(() => {
        if (!io) return;
        io.to(`salao:${salaoId}`).emit('atendimento_atualizado', atendimentoAtualizado);
        io.to(`funcionaria:${funcionariaId}`).emit('novo_atendimento', atendimentoAtualizado);
        emitirEstadoCompleto(salaoId, io);
      });
    }
  } catch (err) {
    console.error('[distribuicao] Erro ao aceitar proposta:', err.message);
  }
}

/**
 * Funcionária RECUSA a proposta (ou timeout).
 */
async function recusarProposta(atendimentoId, funcionariaId, salaoId, io, automatico = false) {
  // Cancela o timeout se chamado manualmente
  const timer = timeoutsPendentes.get(atendimentoId);
  if (timer) { clearTimeout(timer); timeoutsPendentes.delete(atendimentoId); }

  try {
    let especialidade = null;

    await prisma.$transaction(async (tx) => {
      const atend = await tx.atendimento.findUnique({ where: { id: atendimentoId } });
      if (!atend || atend.status !== 'PENDENTE_ACEITE') return;
      if (atend.propostaParaId !== funcionariaId) return;

      especialidade = atend.tipoServico;

      // Volta o atendimento para a fila
      await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { status: 'AGUARDANDO', propostaParaId: null },
      });

      // Move funcionária para o final de todas as suas filas
      const entradas = await tx.filaEntrada.findMany({ where: { funcionariaId } });
      await tx.filaEntrada.deleteMany({ where: { funcionariaId } });
      // Re-insere com timestamp atual (vai para o final do FIFO)
      if (entradas.length > 0) {
        await tx.filaEntrada.createMany({
          data: entradas.map(e => ({
            funcionariaId: e.funcionariaId,
            salaoId: e.salaoId,
            especialidade: e.especialidade,
          })),
        });
      }
    });

    console.log(`[distribuicao] Proposta ${automatico ? 'expirada' : 'recusada'} — atendimento ${atendimentoId}`);

    // Redistribui para a próxima funcionária
    await rodarDistribuicao(salaoId, io);
    await emitirEstadoCompleto(salaoId, io);

  } catch (err) {
    console.error('[distribuicao] Erro ao recusar proposta:', err.message);
  }
}

async function emitirEstadoCompleto(salaoId, io) {
  if (!io) return;
  try {
    const [atendimentos, filas, funcionarias] = await Promise.all([
      prisma.atendimento.findMany({
        where: { salaoId, status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] } },
        include: {
          cliente: true,
          funcionaria: { include: { usuario: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.filaEntrada.findMany({
        where: { salaoId },
        include: { funcionaria: { include: { usuario: true } } },
        orderBy: { entradaEm: 'asc' },
      }),
      prisma.funcionaria.findMany({
        where: { salaoId },
        include: { usuario: true },
      }),
    ]);

    io.to(`salao:${salaoId}`).emit('estado_completo', { atendimentos, filas, funcionarias });
  } catch (err) {
    console.error('[distribuicao] Erro ao emitir estado:', err.message);
  }
}

module.exports = { rodarDistribuicao, emitirEstadoCompleto, aceitarProposta, recusarProposta };
