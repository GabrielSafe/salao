const prisma = require('../config/prisma');

async function buscar(req, res) {
  const { q } = req.query;
  const salaoId = req.salaoId;

  if (!q || q.length < 2) return res.json([]);

  const clientes = await prisma.cliente.findMany({
    where: {
      salaoId,
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { cpf: { contains: q } },
      ],
    },
    take: 10,
    orderBy: { nome: 'asc' },
  });

  return res.json(clientes);
}

async function buscarOuCriar(req, res) {
  const { nome, cpf, telefone } = req.body;
  const salaoId = req.salaoId;

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

  let cliente;
  if (cpf) {
    cliente = await prisma.cliente.findUnique({ where: { cpf_salaoId: { cpf, salaoId } } });
  }

  if (!cliente) {
    cliente = await prisma.cliente.create({ data: { nome, cpf, telefone, salaoId } });
  }

  return res.json(cliente);
}

async function historico(req, res) {
  const { id } = req.params;
  const salaoId = req.salaoId;

  const cliente = await prisma.cliente.findFirst({
    where: { id, salaoId },
    include: {
      atendimentos: {
        include: { funcionaria: { include: { usuario: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrada' });
  return res.json(cliente);
}

module.exports = { buscar, buscarOuCriar, historico };
