const prisma = require('../config/prisma');

async function listar(req, res) {
  const saloes = await prisma.salao.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { funcionarias: true, clientes: true, atendimentos: true } },
    },
  });
  return res.json(saloes);
}

async function buscarPorId(req, res) {
  const { id } = req.params;
  const salao = await prisma.salao.findUnique({
    where: { id },
    include: {
      _count: { select: { funcionarias: true, clientes: true, atendimentos: true } },
    },
  });
  if (!salao) return res.status(404).json({ erro: 'Salão não encontrado' });
  return res.json(salao);
}

async function criar(req, res) {
  const { nome, slug } = req.body;
  if (!nome || !slug) return res.status(400).json({ erro: 'Nome e slug são obrigatórios' });

  const existe = await prisma.salao.findUnique({ where: { slug } });
  if (existe) return res.status(409).json({ erro: 'Slug já utilizado' });

  const salao = await prisma.$transaction(async (tx) => {
    const s = await tx.salao.create({ data: { nome, slug } });
    await tx.contadorComanda.create({ data: { salaoId: s.id, contador: 0 } });
    return s;
  });

  return res.status(201).json(salao);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, ativo } = req.body;
  const salao = await prisma.salao.update({
    where: { id },
    data: { nome, ativo },
  });
  return res.json(salao);
}

async function dashboard(req, res) {
  const salaoId = req.usuario.role === 'SUPERADMIN' ? req.params.id : req.salaoId;

  const [totalFuncionarias, online, atendimentosHoje, filas] = await Promise.all([
    prisma.funcionaria.count({ where: { salaoId } }),
    prisma.funcionaria.count({ where: { salaoId, status: { in: ['ONLINE', 'EM_ATENDIMENTO'] } } }),
    prisma.atendimento.findMany({
      where: {
        salaoId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: { cliente: true, funcionaria: { include: { usuario: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.filaEntrada.findMany({
      where: { salaoId },
      include: { funcionaria: { include: { usuario: true } } },
      orderBy: { entradaEm: 'asc' },
    }),
  ]);

  return res.json({ totalFuncionarias, online, atendimentosHoje, filas });
}

module.exports = { listar, buscarPorId, criar, atualizar, dashboard };
