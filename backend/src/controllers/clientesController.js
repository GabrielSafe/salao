const prisma = require('../config/prisma');

async function buscar(req, res) {
  const { q } = req.query;
  const salaoId = req.salaoId;

  if (!q || q.length < 2) return res.json([]);

  const clientes = await prisma.cliente.findMany({
    where: {
      salaoId,
      OR: [
        { nome:     { contains: q, mode: 'insensitive' } },
        { cpf:      { contains: q } },
        { telefone: { contains: q } },
        { email:    { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
    orderBy: { nome: 'asc' },
  });

  return res.json(clientes);
}

async function listar(req, res) {
  const salaoId = req.salaoId;
  const { q } = req.query;

  const where = { salaoId };
  if (q && q.length >= 2) {
    where.OR = [
      { nome:     { contains: q, mode: 'insensitive' } },
      { cpf:      { contains: q } },
      { telefone: { contains: q } },
      { email:    { contains: q, mode: 'insensitive' } },
    ];
  }

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { atendimentos: true } },
    },
  });

  return res.json(clientes);
}

async function criar(req, res) {
  const { nome, telefone, cpf, email, genero, nascimento, redesSociais, comoConheceu, observacoes } = req.body;
  const salaoId = req.salaoId;

  if (!nome?.trim())     return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!telefone?.trim()) return res.status(400).json({ erro: 'Telefone é obrigatório' });

  if (cpf) {
    const existe = await prisma.cliente.findUnique({ where: { cpf_salaoId: { cpf, salaoId } } });
    if (existe) return res.status(409).json({ erro: 'CPF já cadastrado para outro cliente' });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nome, telefone, cpf: cpf || null,
      email: email || null,
      genero: genero || null,
      nascimento: nascimento ? new Date(nascimento) : null,
      redesSociais: redesSociais || null,
      comoConheceu: comoConheceu || null,
      observacoes: observacoes || null,
      salaoId,
    },
  });

  return res.status(201).json(cliente);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, telefone, cpf, email, genero, nascimento, redesSociais, comoConheceu, observacoes } = req.body;
  const salaoId = req.salaoId;

  const cliente = await prisma.cliente.findFirst({ where: { id, salaoId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrada' });

  const atualizado = await prisma.cliente.update({
    where: { id },
    data: {
      nome:        nome        ?? undefined,
      telefone:    telefone    ?? undefined,
      cpf:         cpf         ?? undefined,
      email:       email       ?? undefined,
      genero:      genero      ?? undefined,
      nascimento:  nascimento  ? new Date(nascimento) : undefined,
      redesSociais: redesSociais ?? undefined,
      comoConheceu: comoConheceu ?? undefined,
      observacoes:  observacoes  ?? undefined,
    },
  });

  return res.json(atualizado);
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

module.exports = { buscar, listar, criar, atualizar, buscarOuCriar, historico };
