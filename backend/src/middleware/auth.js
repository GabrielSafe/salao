const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      include: { funcionaria: true },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário inválido ou inativo' });
    }

    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function exigirRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: 'Acesso não autorizado' });
    }
    next();
  };
}

function exigirSalao(req, res, next) {
  if (req.usuario.role === 'SUPERADMIN') return next();
  if (!req.usuario.salaoId) {
    return res.status(403).json({ erro: 'Usuário sem salão associado' });
  }
  req.salaoId = req.usuario.salaoId;
  next();
}

module.exports = { autenticar, exigirRole, exigirSalao };
