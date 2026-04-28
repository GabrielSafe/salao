const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { emitirEstadoCompleto } = require('../services/distribuicao');

function iniciarSocket(io) {
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
        // token inválido — socket anônimo
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    socket.on('entrar_sala_salao', async ({ salaoId, clienteId }) => {
      socket.join(`salao:${salaoId}`);
      if (clienteId) socket.join(`cliente:${clienteId}`);
      await emitirEstadoCompleto(salaoId, io);
    });

    socket.on('entrar_sala_usuario', async ({ salaoId }) => {
      socket.join(`salao:${salaoId}`);

      const funcionaria = socket.usuario?.funcionaria;
      if (funcionaria) {
        socket.join(`funcionaria:${funcionaria.id}`);

        // Se estava AUSENTE (saída temporária), volta para ONLINE ao reconectar
        const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
        if (atual?.status === 'AUSENTE') {
          await prisma.funcionaria.update({
            where: { id: funcionaria.id },
            data: { status: 'ONLINE', ausenteDesde: null },
          });
          console.log(`[socket] Funcionária ${funcionaria.id} reconectou → ONLINE`);
        }
      }

      await emitirEstadoCompleto(salaoId, io);
    });

    socket.on('disconnect', async () => {
      const funcionaria = socket.usuario?.funcionaria;
      if (!funcionaria) return;

      try {
        const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
        if (!atual) return;
        // Não interfere em quem está atendendo ou já offline
        if (atual.status === 'EM_ATENDIMENTO' || atual.status === 'OFFLINE') return;

        await prisma.funcionaria.update({
          where: { id: funcionaria.id },
          data: {
            status: 'AUSENTE',
            // Preserva ausenteDesde original para não reiniciar o timer
            ausenteDesde: atual.ausenteDesde ?? new Date(),
          },
        });

        const salaoId = socket.usuario.salaoId;
        if (salaoId) await emitirEstadoCompleto(salaoId, io);
        console.log(`[socket] Funcionária ${funcionaria.id} desconectou → AUSENTE`);
      } catch (err) {
        console.error('[socket] Erro no disconnect:', err.message);
      }
    });
  });
}

module.exports = { iniciarSocket };
