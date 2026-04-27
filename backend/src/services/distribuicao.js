const prisma = require('../config/prisma');

/**
 * Motor de distribuição automática.
 * Para cada atendimento AGUARDANDO no salão, tenta encontrar
 * a primeira funcionária disponível na fila para aquele serviço.
 * Usa transação para evitar condição de corrida.
 */
async function rodarDistribuicao(salaoId, io) {
  const atendimentosAguardando = await prisma.atendimento.findMany({
    where: { salaoId, status: 'AGUARDANDO' },
    orderBy: { createdAt: 'asc' },
    include: { cliente: true },
  });

  for (const atendimento of atendimentosAguardando) {
    await tentarAtribuir(atendimento, salaoId, io);
  }
}

async function tentarAtribuir(atendimento, salaoId, io) {
  try {
    await prisma.$transaction(async (tx) => {
      // Revalida status dentro da transação para evitar race condition
      const atual = await tx.atendimento.findUnique({
        where: { id: atendimento.id },
      });
      if (!atual || atual.status !== 'AGUARDANDO') return;

      // Pega a primeira entrada na fila para este serviço (FIFO)
      // Sem filtro aninhado na relação — verifica o status explicitamente abaixo
      const entradaFila = await tx.filaEntrada.findFirst({
        where: { salaoId, especialidade: atendimento.tipoServico },
        orderBy: { entradaEm: 'asc' },
        include: { funcionaria: true },
      });

      if (!entradaFila) return;
      // Aceita ONLINE e AUSENTE — ausente está na fila mas pode estar longe da tela
      if (!['ONLINE', 'AUSENTE'].includes(entradaFila.funcionaria.status)) return;

      const funcionariaId = entradaFila.funcionariaId;

      // Atualiza status atomicamente — só avança se ONLINE ou AUSENTE.
      // Evita dupla atribuição em chamadas concorrentes ao motor.
      const { count } = await tx.funcionaria.updateMany({
        where: { id: funcionariaId, status: { in: ['ONLINE', 'AUSENTE'] } },
        data: { status: 'EM_ATENDIMENTO' },
      });
      if (count === 0) return;

      // Remove a funcionária de TODAS as filas após garantir a atribuição
      await tx.filaEntrada.deleteMany({ where: { funcionariaId } });

      // Atribui o atendimento
      const atendimentoAtualizado = await tx.atendimento.update({
        where: { id: atendimento.id },
        data: {
          funcionariaId,
          status: 'EM_ATENDIMENTO',
          iniciadoEm: new Date(),
        },
        include: {
          cliente: true,
          funcionaria: { include: { usuario: true } },
        },
      });

      // Emite evento em tempo real após a transação comprometer
      setImmediate(() => {
        if (!io) return;
        io.to(`salao:${salaoId}`).emit('atendimento_atualizado', atendimentoAtualizado);
        io.to(`funcionaria:${funcionariaId}`).emit('novo_atendimento', atendimentoAtualizado);
        emitirEstadoCompleto(salaoId, io);
      });
    });
  } catch (err) {
    console.error('[distribuicao] Erro ao atribuir atendimento:', err.message);
  }
}

async function emitirEstadoCompleto(salaoId, io) {
  if (!io) return;
  try {
    const [atendimentos, filas, funcionarias] = await Promise.all([
      prisma.atendimento.findMany({
        where: { salaoId, status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
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

    io.to(`salao:${salaoId}`).emit('estado_completo', {
      atendimentos,
      filas,
      funcionarias,
    });
  } catch (err) {
    console.error('[distribuicao] Erro ao emitir estado:', err.message);
  }
}

module.exports = { rodarDistribuicao, emitirEstadoCompleto };
