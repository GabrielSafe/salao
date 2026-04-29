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
    // ── Sala do salão (admin/público) ────────────────────────────────────
    socket.on('entrar_sala_salao', async ({ salaoId, clienteId }) => {
      socket.join(`salao:${salaoId}`);
      if (clienteId) socket.join(`cliente:${clienteId}`);
      await emitirEstadoCompleto(salaoId, io);
    });

    // ── Sala da funcionária ──────────────────────────────────────────────
    socket.on('entrar_sala_usuario', async ({ salaoId }) => {
      socket.join(`salao:${salaoId}`);

      const funcionaria = socket.usuario?.funcionaria;
      if (funcionaria) {
        socket.join(`funcionaria:${funcionaria.id}`);

        const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
        if (atual) {
          const atualizacao = { ultimoBatimento: new Date() };

          // Volta para ONLINE se estava AUSENTE (reconexão)
          if (atual.status === 'AUSENTE') {
            atualizacao.status = 'ONLINE';
            atualizacao.ausenteDesde = null;
            console.log(`[socket] Funcionária ${funcionaria.id} reconectou → ONLINE`);
          }

          await prisma.funcionaria.update({ where: { id: funcionaria.id }, data: atualizacao });
        }
      }

      await emitirEstadoCompleto(salaoId, io);
    });

    // ── Heartbeat — prova de vida a cada 30 s ────────────────────────────
    socket.on('heartbeat', async () => {
      const funcionaria = socket.usuario?.funcionaria;
      if (!funcionaria) return;
      try {
        await prisma.funcionaria.update({
          where: { id: funcionaria.id },
          data: { ultimoBatimento: new Date() },
        });
      } catch {}
    });

    // ── Visibilidade da página (tela bloqueada / app em background) ──────
    socket.on('visibilidade_alterada', async ({ oculta }) => {
      const funcionaria = socket.usuario?.funcionaria;
      if (!funcionaria) return;
      try {
        const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
        if (!atual || atual.status === 'EM_ATENDIMENTO' || atual.status === 'OFFLINE') return;

        const novoStatus = oculta ? 'AUSENTE' : 'ONLINE';
        await prisma.funcionaria.update({
          where: { id: funcionaria.id },
          data: {
            status: novoStatus,
            ausenteDesde: oculta ? (atual.ausenteDesde ?? new Date()) : null,
            ultimoBatimento: oculta ? atual.ultimoBatimento : new Date(),
          },
        });

        const salaoId = socket.usuario.salaoId;
        if (salaoId) await emitirEstadoCompleto(salaoId, io);
        console.log(`[socket] Funcionária ${funcionaria.id} visibilidade → ${oculta ? 'AUSENTE' : 'ONLINE'}`);
      } catch (err) {
        console.error('[socket] Erro em visibilidade_alterada:', err.message);
      }
    });

    // ── Desconexão ───────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const funcionaria = socket.usuario?.funcionaria;
      if (!funcionaria) return;

      try {
        const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
        if (!atual) return;
        if (atual.status === 'EM_ATENDIMENTO' || atual.status === 'OFFLINE') return;

        await prisma.funcionaria.update({
          where: { id: funcionaria.id },
          data: {
            status: 'AUSENTE',
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
