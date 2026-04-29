const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { emitirEstadoCompleto } = require('../services/distribuicao');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, role: usuario.role, salaoId: usuario.salaoId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { funcionaria: true, salao: true },
  });

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  if (usuario.role === 'FUNCIONARIA' && usuario.funcionaria) {
    await prisma.funcionaria.update({
      where: { id: usuario.funcionaria.id },
      data: { status: 'ONLINE' },
    });
    const io = req.app.get('io');
    if (usuario.salaoId) emitirEstadoCompleto(usuario.salaoId, io);
  }

  const token = gerarToken(usuario);
  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      salaoId: usuario.salaoId,
      salao: usuario.salao,
      funcionaria: usuario.funcionaria,
    },
  });
}

async function logout(req, res) {
  if (req.usuario.role === 'FUNCIONARIA' && req.usuario.funcionaria) {
    const funcionaria = req.usuario.funcionaria;
    await prisma.filaEntrada.deleteMany({ where: { funcionariaId: funcionaria.id } });
    await prisma.funcionaria.update({
      where: { id: funcionaria.id },
      data: { status: 'OFFLINE' },
    });
    const io = req.app.get('io');
    if (req.usuario.salaoId) emitirEstadoCompleto(req.usuario.salaoId, io);
  }
  return res.json({ mensagem: 'Logout realizado com sucesso' });
}

async function perfil(req, res) {
  return res.json({
    id: req.usuario.id,
    nome: req.usuario.nome,
    email: req.usuario.email,
    role: req.usuario.role,
    salaoId: req.usuario.salaoId,
    funcionaria: req.usuario.funcionaria,
  });
}

async function atualizarPerfil(req, res) {
  const { nome, email, senhaAtual, novaSenha } = req.body;

  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (!email?.trim()) return res.status(400).json({ erro: 'E-mail é obrigatório' });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });

  if (novaSenha) {
    if (!senhaAtual) return res.status(400).json({ erro: 'Informe a senha atual para alterar a senha' });
    const valida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!valida) return res.status(400).json({ erro: 'Senha atual incorreta' });
    if (novaSenha.length < 6) return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres' });
  }

  const emailNormalizado = email.trim().toLowerCase();
  if (emailNormalizado !== usuario.email) {
    const existente = await prisma.usuario.findUnique({ where: { email: emailNormalizado } });
    if (existente) return res.status(400).json({ erro: 'Este e-mail já está em uso' });
  }

  const atualizado = await prisma.usuario.update({
    where: { id: req.usuario.id },
    data: {
      nome: nome.trim(),
      email: emailNormalizado,
      ...(novaSenha ? { senha: await bcrypt.hash(novaSenha, 10) } : {}),
    },
    include: { salao: true },
  });

  return res.json({
    id: atualizado.id,
    nome: atualizado.nome,
    email: atualizado.email,
    role: atualizado.role,
    salaoId: atualizado.salaoId,
    salao: atualizado.salao,
  });
}

module.exports = { login, logout, perfil, atualizarPerfil };
