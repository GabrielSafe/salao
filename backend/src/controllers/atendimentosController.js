const prisma = require('../config/prisma');
const { rodarDistribuicao, emitirEstadoCompleto } = require('../services/distribuicao');

async function proximoNumeroComanda(salaoId, tx) {
  const contador = await tx.contadorComanda.update({
    where: { salaoId },
    data: { contador: { increment: 1 } },
  });
  return contador.contador;
}

async function criarComanda(req, res) {
  const { clienteId, servicos } = req.body;
  const salaoId = req.salaoId;

  if (!clienteId || !servicos?.length) {
    return res.status(400).json({ erro: 'Cliente e pelo menos um serviço são obrigatórios' });
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, salaoId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrada' });

  const atendimentos = await prisma.$transaction(async (tx) => {
    const numero = await proximoNumeroComanda(salaoId, tx);

    const servicosUnicos = [...new Set(servicos)];
    const criados = [];

    for (const tipoServico of servicosUnicos) {
      const jaExiste = await tx.atendimento.findFirst({
        where: {
          clienteId,
          salaoId,
          tipoServico,
          status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] },
        },
      });
      if (jaExiste) continue;

      const a = await tx.atendimento.create({
        data: { clienteId, salaoId, tipoServico, numeroComanda: numero },
        include: { cliente: true },
      });
      criados.push(a);
    }

    return criados;
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.status(201).json(atendimentos);
}

async function adicionarServico(req, res) {
  const { clienteId, tipoServico } = req.body;
  const salaoId = req.salaoId;

  const jaExiste = await prisma.atendimento.findFirst({
    where: { clienteId, salaoId, tipoServico, status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
  });
  if (jaExiste) return res.status(409).json({ erro: 'Serviço já está em andamento para esta cliente' });

  const ultimaComanda = await prisma.atendimento.findFirst({
    where: { clienteId, salaoId },
    orderBy: { createdAt: 'desc' },
  });

  const atendimento = await prisma.atendimento.create({
    data: {
      clienteId,
      salaoId,
      tipoServico,
      numeroComanda: ultimaComanda?.numeroComanda ?? 0,
    },
    include: { cliente: true },
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.status(201).json(atendimento);
}

async function finalizar(req, res) {
  const { id } = req.params;
  const funcionaria = req.usuario.funcionaria;
  const salaoId = req.usuario.salaoId;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: 'EM_ATENDIMENTO', funcionariaId: funcionaria?.id },
  });

  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado ou não pertence a você' });

  await prisma.$transaction([
    prisma.atendimento.update({
      where: { id },
      data: { status: 'FINALIZADO', finalizadoEm: new Date() },
    }),
    prisma.funcionaria.update({
      where: { id: funcionaria.id },
      data: { status: 'ONLINE' },
    }),
  ]);

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Atendimento finalizado com sucesso' });
}

async function cancelar(req, res) {
  const { id } = req.params;
  const salaoId = req.salaoId;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
  });
  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

  await prisma.$transaction(async (tx) => {
    await tx.atendimento.update({ where: { id }, data: { status: 'CANCELADO' } });
    if (atendimento.funcionariaId) {
      await tx.funcionaria.update({
        where: { id: atendimento.funcionariaId },
        data: { status: 'ONLINE' },
      });
    }
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Atendimento cancelado' });
}

async function listarPorComanda(req, res) {
  const { numero } = req.params;
  const salaoId = req.salaoId;

  const atendimentos = await prisma.atendimento.findMany({
    where: { salaoId, numeroComanda: Number(numero) },
    include: {
      cliente: true,
      funcionaria: { include: { usuario: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!atendimentos.length) return res.status(404).json({ erro: 'Comanda não encontrada' });
  return res.json(atendimentos);
}

async function relatorio(req, res) {
  const salaoId = req.salaoId;
  const { inicio, fim } = req.query;

  const where = {
    salaoId,
    ...(inicio && fim
      ? { createdAt: { gte: new Date(inicio), lte: new Date(fim) } }
      : { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  };

  const atendimentos = await prisma.atendimento.findMany({
    where,
    include: {
      cliente: true,
      funcionaria: { include: { usuario: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const por_servico = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'].reduce((acc, s) => {
    acc[s] = atendimentos.filter((a) => a.tipoServico === s).length;
    return acc;
  }, {});

  return res.json({
    total: atendimentos.length,
    finalizados: atendimentos.filter((a) => a.status === 'FINALIZADO').length,
    cancelados: atendimentos.filter((a) => a.status === 'CANCELADO').length,
    por_servico,
    atendimentos,
  });
}

module.exports = { criarComanda, adicionarServico, finalizar, cancelar, listarPorComanda, relatorio };
