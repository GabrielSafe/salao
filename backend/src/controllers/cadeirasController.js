const prisma = require('../config/prisma');

async function seedCadeiras(salaoId) {
  await prisma.cadeira.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      numero: i + 1,
      nome: `Cadeira ${i + 1}`,
      salaoId,
    })),
    skipDuplicates: true,
  });
}

async function listar(req, res) {
  const salaoId = req.salaoId;

  let cadeiras = await prisma.cadeira.findMany({
    where: { salaoId },
    orderBy: { numero: 'asc' },
  });

  // Auto-seed na primeira vez
  if (cadeiras.length === 0) {
    await seedCadeiras(salaoId);
    cadeiras = await prisma.cadeira.findMany({
      where: { salaoId },
      orderBy: { numero: 'asc' },
    });
  }

  // Busca atendimentos ativos por cadeira
  const atendimentosAtivos = await prisma.atendimento.findMany({
    where: {
      salaoId,
      cadeiraId: { not: null },
      status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] },
    },
    include: { cliente: { select: { nome: true } } },
    orderBy: { createdAt: 'asc' },
    distinct: ['cadeiraId'],
  });

  const ocupacaoMap = {};
  atendimentosAtivos.forEach(a => {
    if (a.cadeiraId) {
      ocupacaoMap[a.cadeiraId] = {
        clienteNome: a.cliente?.nome,
        numeroComanda: a.numeroComanda,
        desde: a.createdAt,
      };
    }
  });

  const resultado = cadeiras.map(c => ({
    ...c,
    ocupada: !!ocupacaoMap[c.id],
    ocupacao: ocupacaoMap[c.id] || null,
  }));

  return res.json(resultado);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  const salaoId = req.salaoId;

  const cadeira = await prisma.cadeira.findFirst({ where: { id, salaoId } });
  if (!cadeira) return res.status(404).json({ erro: 'Cadeira não encontrada' });

  // Não pode desativar se está ocupada
  if (ativo === false) {
    const ativa = await prisma.atendimento.count({
      where: {
        salaoId,
        cadeiraId: id,
        status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] },
      },
    });
    if (ativa > 0) {
      return res.status(409).json({ erro: `Cadeira ${cadeira.numero} está ocupada no momento.` });
    }
  }

  const updated = await prisma.cadeira.update({
    where: { id },
    data: {
      ...(nome  !== undefined && { nome }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  return res.json(updated);
}

async function relatorio(req, res) {
  const salaoId = req.salaoId;
  const { inicio, fim } = req.query;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataInicio = inicio ? new Date(inicio) : hoje;
  const dataFim    = fim    ? new Date(fim)    : new Date();

  const cadeiras = await prisma.cadeira.findMany({
    where: { salaoId },
    orderBy: { numero: 'asc' },
  });

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      salaoId,
      cadeiraId: { not: null },
      status: 'FINALIZADO',
      createdAt: { gte: dataInicio, lte: dataFim },
    },
    select: {
      cadeiraId: true,
      servicoPreco: true,
      iniciadoEm: true,
      finalizadoEm: true,
      tipoServico: true,
    },
  });

  const stats = cadeiras.map(c => {
    const da_cadeira = atendimentos.filter(a => a.cadeiraId === c.id);
    const faturamento = da_cadeira.reduce((s, a) => s + (a.servicoPreco || 0), 0);
    const comTempos   = da_cadeira.filter(a => a.iniciadoEm && a.finalizadoEm);
    const tempoMedio  = comTempos.length
      ? Math.round(comTempos.reduce((s, a) => s + (new Date(a.finalizadoEm) - new Date(a.iniciadoEm)) / 60000, 0) / comTempos.length)
      : null;

    return {
      cadeira: { id: c.id, numero: c.numero, nome: c.nome, ativo: c.ativo },
      atendimentos: da_cadeira.length,
      faturamento,
      tempoMedioMinutos: tempoMedio,
    };
  });

  return res.json(stats);
}

module.exports = { listar, atualizar, relatorio };
