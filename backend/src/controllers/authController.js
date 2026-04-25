const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

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
    // Remove da fila e coloca offline
    await prisma.filaEntrada.deleteMany({ where: { funcionariaId: funcionaria.id } });
    await prisma.funcionaria.update({
      where: { id: funcionaria.id },
      data: { status: 'OFFLINE' },
    });
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

module.exports = { login, logout, perfil };
