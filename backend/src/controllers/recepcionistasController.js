const bcrypt = require('bcryptjs');
const prisma  = require('../config/prisma');

async function listar(req, res) {
  const salaoId = req.salaoId;
  const usuarios = await prisma.usuario.findMany({
    where: { salaoId, role: 'RECEPCIONISTA' },
    select: { id: true, nome: true, email: true, ativo: true, createdAt: true },
    orderBy: { nome: 'asc' },
  });
  return res.json(usuarios);
}

async function criar(req, res) {
  const { nome, email, senha } = req.body;
  const salaoId = req.salaoId;

  if (!nome?.trim() || !email?.trim() || !senha)
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });

  const existe = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existe) return res.status(409).json({ erro: 'E-mail já está em uso' });

  const hash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome: nome.trim(), email: email.trim().toLowerCase(), senha: hash, role: 'RECEPCIONISTA', salaoId },
    select: { id: true, nome: true, email: true, ativo: true, createdAt: true },
  });
  return res.status(201).json(usuario);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, email, novaSenha, ativo } = req.body;
  const salaoId = req.salaoId;

  const usuario = await prisma.usuario.findFirst({ where: { id, salaoId, role: 'RECEPCIONISTA' } });
  if (!usuario) return res.status(404).json({ erro: 'Recepcionista não encontrada' });

  if (email && email !== usuario.email) {
    const existe = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existe) return res.status(409).json({ erro: 'E-mail já está em uso' });
  }

  const dados = {
    ...(nome     && { nome: nome.trim() }),
    ...(email    && { email: email.trim().toLowerCase() }),
    ...(ativo    !== undefined && { ativo }),
    ...(novaSenha && { senha: await bcrypt.hash(novaSenha, 10) }),
  };

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: dados,
    select: { id: true, nome: true, email: true, ativo: true, createdAt: true },
  });
  return res.json(atualizado);
}

async function relatorio(req, res) {
  const salaoId = req.salaoId;
  const { inicio, fim, recepcionistaId } = req.query;

  const dataInicio = inicio ? new Date(inicio) : new Date(new Date().setHours(0, 0, 0, 0));
  const dataFim    = fim    ? new Date(fim)    : new Date(new Date().setHours(23, 59, 59, 999));

  // Lista todas as recepcionistas do salão
  const recepcionistas = await prisma.usuario.findMany({
    where: {
      salaoId,
      role: 'RECEPCIONISTA',
      ...(recepcionistaId && { id: recepcionistaId }),
    },
    select: { id: true, nome: true, ativo: true },
    orderBy: { nome: 'asc' },
  });

  const resultado = await Promise.all(recepcionistas.map(async (r) => {
    // Comandas únicas criadas por ela no período
    const atendimentos = await prisma.atendimento.findMany({
      where: {
        salaoId,
        recepcionistaId: r.id,
        createdAt: { gte: dataInicio, lte: dataFim },
      },
      select: { numeroComanda: true, servicoPreco: true, status: true, createdAt: true },
    });

    const comandasUnicas = new Set(atendimentos.map(a => a.numeroComanda)).size;
    const faturamento    = atendimentos.filter(a => a.status === 'FINALIZADO').reduce((s, a) => s + (a.servicoPreco || 0), 0);
    const servicos       = atendimentos.filter(a => a.status === 'FINALIZADO').length;

    return {
      recepcionista: { id: r.id, nome: r.nome, ativo: r.ativo },
      comandasCriadas: comandasUnicas,
      servicosFinalizados: servicos,
      faturamento,
    };
  }));

  return res.json(resultado);
}

module.exports = { listar, criar, atualizar, relatorio };
