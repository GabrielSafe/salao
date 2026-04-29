const prisma = require('../config/prisma');
const { enviarPushParaFuncionaria } = require('./pushService');

const TIMEOUT_PROPOSTA_MS = 60_000; // 60 segundos
const timeoutsPendentes   = new Map(); // atendimentoId → timer
const propostaParaFunc    = new Map(); // atendimentoId → funcionariaId (rastreia a quem foi proposto)

// Rastreia quem já rejeitou manualmente cada atendimento
// atendimentoId → Set<funcionariaId>
const rejeicoesPorAtendimento = new Map();

/**
 * Roda a distribuição para todos os atendimentos AGUARDANDO.
 * Agrupa por cliente+comanda+tipoServico para evitar propostas duplicadas do mesmo grupo.
 */
async function rodarDistribuicao(salaoId, io) {
  const atendimentos = await prisma.atendimento.findMany({
    where: { salaoId, status: 'AGUARDANDO' },
    orderBy: { createdAt: 'asc' },
    include: { cliente: true },
  });

  const funcionariasEmProposta = new Set();
  // Evita processar o mesmo grupo (comanda+tipoServico) mais de uma vez por rodada
  const gruposProcessados = new Set();

  for (const atendimento of atendimentos) {
    const chave = `${atendimento.clienteId}_${atendimento.numeroComanda}_${atendimento.tipoServico}`;
    if (gruposProcessados.has(chave)) continue;
    gruposProcessados.add(chave);
    await tentarProporAtendimento(atendimento, salaoId, io, funcionariasEmProposta);
  }
}

/**
 * Encontra a 1ª funcionária disponível e envia uma proposta agrupada.
 * Todos os serviços da mesma comanda+categoria vão na mesma proposta.
 */
async function tentarProporAtendimento(atendimento, salaoId, io, funcionariasEmProposta = new Set()) {
  try {
    let funcionariaId = null;
    let propostaAgrupada = null;

    await prisma.$transaction(async (tx) => {
      const atual = await tx.atendimento.findUnique({ where: { id: atendimento.id } });
      if (!atual || atual.status !== 'AGUARDANDO') return;

      const jáRejeitaram = [...(rejeicoesPorAtendimento.get(atendimento.id) || [])];
      const excluir = [...new Set([...jáRejeitaram, ...funcionariasEmProposta])];

      const entradaFila = await tx.filaEntrada.findFirst({
        where: {
          salaoId,
          especialidade: atendimento.tipoServico,
          ...(excluir.length > 0 && { funcionariaId: { notIn: excluir } }),
        },
        orderBy: { entradaEm: 'asc' },
        include: { funcionaria: true },
      });

      if (!entradaFila) return;
      if (!['ONLINE', 'AUSENTE'].includes(entradaFila.funcionaria.status)) return;

      funcionariaId = entradaFila.funcionariaId;

      // Busca TODOS os AGUARDANDO da mesma comanda+tipoServico (mesma cliente)
      const grupo = await tx.atendimento.findMany({
        where: {
          salaoId,
          clienteId: atual.clienteId,
          numeroComanda: atual.numeroComanda,
          tipoServico: atual.tipoServico,
          status: 'AGUARDANDO',
        },
        include: { cliente: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!grupo.length) return;

      // Define todos como PENDENTE_ACEITE com a mesma funcionária
      await tx.atendimento.updateMany({
        where: { id: { in: grupo.map(a => a.id) } },
        data: { status: 'PENDENTE_ACEITE', propostaParaId: funcionariaId },
      });

      // Proposta agrupa todos; primary = mais antigo (usado para timeout/rejeições)
      propostaAgrupada = { ...grupo[0], servicosAgrupados: grupo };
    });

    if (!funcionariaId || !propostaAgrupada) return;

    funcionariasEmProposta.add(funcionariaId);
    propostaParaFunc.set(propostaAgrupada.id, funcionariaId);

    setImmediate(async () => {
      if (io) {
        io.to(`funcionaria:${funcionariaId}`).emit('proposta_atendimento', propostaAgrupada);
      }

      // Web Push — chega mesmo com app fechado/minimizado
      const nomes   = propostaAgrupada.servicosAgrupados?.map(s => s.servicoNome || s.tipoServico).join(', ') || propostaAgrupada.servicoNome || propostaAgrupada.tipoServico;
      const cliente = propostaAgrupada.cliente?.nome || 'Cliente';
      await enviarPushParaFuncionaria(funcionariaId, {
        title: '🔔 Nova solicitação!',
        body:  `${cliente} • ${nomes}`,
        url:   '/funcionaria',
      });
    });

    // Timeout rastreado pelo primary ID
    const timer = setTimeout(() => {
      propostaParaFunc.delete(propostaAgrupada.id);
      recusarProposta(propostaAgrupada.id, funcionariaId, salaoId, io, true);
    }, TIMEOUT_PROPOSTA_MS);

    timeoutsPendentes.set(propostaAgrupada.id, timer);

  } catch (err) {
    console.error('[distribuicao] Erro ao propor atendimento:', err.message);
  }
}

/**
 * Funcionária ACEITA a proposta — aceita TODOS os atendimentos do grupo.
 */
async function aceitarProposta(atendimentoId, funcionariaId, salaoId, io) {
  const timer = timeoutsPendentes.get(atendimentoId);
  if (timer) { clearTimeout(timer); timeoutsPendentes.delete(atendimentoId); }

  try {
    let atendimentoAtualizado = null;
    let idsGrupo = [];

    await prisma.$transaction(async (tx) => {
      const atend = await tx.atendimento.findUnique({ where: { id: atendimentoId } });
      if (!atend || atend.status !== 'PENDENTE_ACEITE') return;
      if (atend.propostaParaId !== funcionariaId) return;

      const { count } = await tx.funcionaria.updateMany({
        where: { id: funcionariaId, status: { in: ['ONLINE', 'AUSENTE'] } },
        data: { status: 'EM_ATENDIMENTO' },
      });
      if (count === 0) return;

      await tx.filaEntrada.deleteMany({ where: { funcionariaId } });

      // Busca todos do grupo (mesma comanda+tipoServico com proposta para esta funcionária)
      const grupo = await tx.atendimento.findMany({
        where: {
          salaoId,
          clienteId: atend.clienteId,
          numeroComanda: atend.numeroComanda,
          tipoServico: atend.tipoServico,
          status: 'PENDENTE_ACEITE',
          propostaParaId: funcionariaId,
        },
      });
      idsGrupo = grupo.map(a => a.id);

      // Confirma TODOS
      await tx.atendimento.updateMany({
        where: { id: { in: idsGrupo } },
        data: { funcionariaId, status: 'EM_ATENDIMENTO', iniciadoEm: new Date(), propostaParaId: null },
      });

      atendimentoAtualizado = await tx.atendimento.findUnique({
        where: { id: atendimentoId },
        include: { cliente: true, funcionaria: { include: { usuario: true } } },
      });
    });

    if (atendimentoAtualizado) {
      idsGrupo.forEach(id => rejeicoesPorAtendimento.delete(id));

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
 * Funcionária RECUSA a proposta — recusa TODOS os atendimentos do grupo.
 */
async function recusarProposta(atendimentoId, funcionariaId, salaoId, io, automatico = false) {
  const timer = timeoutsPendentes.get(atendimentoId);
  if (timer) { clearTimeout(timer); timeoutsPendentes.delete(atendimentoId); }

  try {
    await prisma.$transaction(async (tx) => {
      const atend = await tx.atendimento.findUnique({ where: { id: atendimentoId } });
      if (!atend || atend.status !== 'PENDENTE_ACEITE') return;
      if (atend.propostaParaId !== funcionariaId) return;

      // Só blacklista em rejeições MANUAIS (funcionária clicou "Recusar")
      // Timeouts automáticos (celular em background) NÃO blacklistam — ela pode receber de novo
      if (!automatico) {
        const rejeitados = rejeicoesPorAtendimento.get(atendimentoId) || new Set();
        rejeitados.add(funcionariaId);
        rejeicoesPorAtendimento.set(atendimentoId, rejeitados);
      }

      // Volta TODO o grupo para AGUARDANDO
      await tx.atendimento.updateMany({
        where: {
          salaoId,
          clienteId: atend.clienteId,
          numeroComanda: atend.numeroComanda,
          tipoServico: atend.tipoServico,
          status: 'PENDENTE_ACEITE',
          propostaParaId: funcionariaId,
        },
        data: { status: 'AGUARDANDO', propostaParaId: null },
      });

      // Move funcionária para o final da fila
      const entradas = await tx.filaEntrada.findMany({ where: { funcionariaId } });
      await tx.filaEntrada.deleteMany({ where: { funcionariaId } });
      if (entradas.length > 0) {
        await tx.filaEntrada.createMany({
          data: entradas.map(e => ({ funcionariaId: e.funcionariaId, salaoId: e.salaoId, especialidade: e.especialidade })),
        });
      }
    });

    console.log(`[distribuicao] Proposta ${automatico ? 'expirada' : 'recusada'} — grupo do atendimento ${atendimentoId}`);

    await rodarDistribuicao(salaoId, io);
    await emitirEstadoCompleto(salaoId, io);

  } catch (err) {
    console.error('[distribuicao] Erro ao recusar proposta:', err.message);
  }
}

async function emitirEstadoCompleto(salaoId, io) {
  if (!io) return;
  try {
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);

    const [atendimentos, filas, funcionarias] = await Promise.all([
      prisma.atendimento.findMany({
        where: {
          salaoId,
          OR: [
            { status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] } },
            { status: 'FINALIZADO', fechadaEm: null, createdAt: { gte: inicioHoje } },
          ],
        },
        include: {
          cliente: true,
          funcionaria: { include: { usuario: true } },
          cadeira: true,
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

// Limpa rejeições de um atendimento finalizado/cancelado
function limparRejeicoes(atendimentoId) {
  rejeicoesPorAtendimento.delete(atendimentoId);
}

// Remove uma funcionária de todas as listas de rejeição
function limparRejeicoesParaFuncionaria(funcionariaId) {
  for (const rejeitados of rejeicoesPorAtendimento.values()) {
    rejeitados.delete(funcionariaId);
  }
}

/**
 * Cancela propostas PENDENTE_ACEITE que estão aguardando esta funcionária
 * e as devolve para AGUARDANDO com novos timers zerados.
 *
 * Situação: socket desconectou → proposta foi enviada → nunca recebida →
 * funcionária volta/reentra na fila → precisa receber proposta fresca.
 */
async function cancelarPropostasParaFuncionaria(funcionariaId, salaoId) {
  // Cancela timers server-side de propostas destinadas a ela
  for (const [atendimentoId, fId] of propostaParaFunc) {
    if (fId === funcionariaId) {
      const timer = timeoutsPendentes.get(atendimentoId);
      if (timer) { clearTimeout(timer); timeoutsPendentes.delete(atendimentoId); }
      propostaParaFunc.delete(atendimentoId);
    }
  }

  // Volta atendimentos PENDENTE_ACEITE dela para AGUARDANDO
  await prisma.atendimento.updateMany({
    where: { salaoId, status: 'PENDENTE_ACEITE', propostaParaId: funcionariaId },
    data:  { status: 'AGUARDANDO', propostaParaId: null },
  });
}

/**
 * Admin atribui manualmente um atendimento a uma funcionária específica.
 * Comporta-se igual à distribuição automática: emite proposta + inicia timeout de 60s.
 */
async function proporParaFuncionaria(atendimentoId, funcionariaId, salaoId, io) {
  try {
    const timerAnterior = timeoutsPendentes.get(atendimentoId);
    if (timerAnterior) { clearTimeout(timerAnterior); timeoutsPendentes.delete(atendimentoId); }

    let propostaAgrupada = null;

    await prisma.$transaction(async (tx) => {
      const atual = await tx.atendimento.findUnique({ where: { id: atendimentoId } });
      if (!atual || !['AGUARDANDO', 'PENDENTE_ACEITE'].includes(atual.status)) return;

      // Busca todo o grupo
      const grupo = await tx.atendimento.findMany({
        where: {
          salaoId,
          clienteId: atual.clienteId,
          numeroComanda: atual.numeroComanda,
          tipoServico: atual.tipoServico,
          status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE'] },
        },
        include: { cliente: true },
        orderBy: { createdAt: 'asc' },
      });

      // Cancela timeouts anteriores de outros membros do grupo
      grupo.forEach(a => {
        const t = timeoutsPendentes.get(a.id);
        if (t) { clearTimeout(t); timeoutsPendentes.delete(a.id); }
      });

      await tx.atendimento.updateMany({
        where: { id: { in: grupo.map(a => a.id) } },
        data: { status: 'PENDENTE_ACEITE', propostaParaId: funcionariaId },
      });

      propostaAgrupada = { ...grupo[0], servicosAgrupados: grupo };
    });

    if (!propostaAgrupada) return;

    if (io) {
      io.to(`funcionaria:${funcionariaId}`).emit('proposta_atendimento', propostaAgrupada);
    }

    // Web Push para atribuição manual
    const nomes   = propostaAgrupada.servicosAgrupados?.map(s => s.servicoNome || s.tipoServico).join(', ') || propostaAgrupada.servicoNome || propostaAgrupada.tipoServico;
    await enviarPushParaFuncionaria(funcionariaId, {
      title: '🔔 Atribuição manual!',
      body:  `${propostaAgrupada.cliente?.nome || 'Cliente'} • ${nomes}`,
      url:   '/funcionaria',
    });

    const timer = setTimeout(() => {
      recusarProposta(propostaAgrupada.id, funcionariaId, salaoId, io, true);
    }, TIMEOUT_PROPOSTA_MS);
    timeoutsPendentes.set(propostaAgrupada.id, timer);

    await emitirEstadoCompleto(salaoId, io);
  } catch (err) {
    console.error('[distribuicao] Erro ao propor manualmente:', err.message);
  }
}

module.exports = { rodarDistribuicao, emitirEstadoCompleto, aceitarProposta, recusarProposta, limparRejeicoes, limparRejeicoesParaFuncionaria, cancelarPropostasParaFuncionaria, proporParaFuncionaria };
