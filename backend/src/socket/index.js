const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { emitirEstadoCompleto } = require('../services/distribuicao');

function iniciarSocket(io) {
  // Middleware de autenticação opcional para sockets identificados
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const usuario = await prisma.usuario.findUnique({
          where: { id: payload.id },
          include: { funcionaria: true },
        });
        if (usuario) socket.usuario = usuario;
      } catch {
        // token inválido — socket continua como anônimo (cliente público)
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // Cliente público entra na sala do salão para acompanhar comanda
    socket.on('entrar_sala_salao', async ({ salaoId, clienteId }) => {
      socket.join(`salao:${salaoId}`);
      if (clienteId) socket.join(`cliente:${clienteId}`);
      await emitirEstadoCompleto(salaoId, io);
    });

    // Funcionária/Admin entra na sala do salão
    socket.on('entrar_sala_usuario', async ({ salaoId }) => {
      socket.join(`salao:${salaoId}`);
      if (socket.usuario?.funcionaria) {
        socket.join(`funcionaria:${socket.usuario.funcionaria.id}`);
      }
      await emitirEstadoCompleto(salaoId, io);
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { iniciarSocket };
