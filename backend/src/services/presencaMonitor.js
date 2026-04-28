const prisma = require('../config/prisma');
const { emitirEstadoCompleto, rodarDistribuicao } = require('./distribuicao');

const TIMEOUT_AUSENTE_MS = 30 * 60 * 1000; // 30 minutos

function iniciarMonitorPresenca(io) {
  setInterval(async () => {
    try {
      const limite = new Date(Date.now() - TIMEOUT_AUSENTE_MS);

      const funcionarias = await prisma.funcionaria.findMany({
        where: {
          status: 'AUSENTE',
          ausenteDesde: { not: null, lt: limite },
        },
        select: { id: true, salaoId: true },
      });

      if (funcionarias.length === 0) return;

      for (const f of funcionarias) {
        await prisma.$transaction([
          prisma.funcionaria.update({
            where: { id: f.id },
            data: { status: 'OFFLINE', ausenteDesde: null },
          }),
          prisma.filaEntrada.deleteMany({ where: { funcionariaId: f.id } }),
        ]);

        console.log(`[presença] Funcionária ${f.id} virou OFFLINE por inatividade (+30 min ausente)`);

        if (io) {
          io.to(`funcionaria:${f.id}`).emit('virou_offline', {
            motivo: 'inatividade',
            mensagem: 'Você ficou offline por mais de 30 minutos sem atividade.',
          });
          await rodarDistribuicao(f.salaoId, io);
          await emitirEstadoCompleto(f.salaoId, io);
        }
      }
    } catch (err) {
      console.error('[presença] Erro no monitor:', err.message);
    }
  }, 60_000); // roda a cada 1 minuto
}

module.exports = { iniciarMonitorPresenca };
