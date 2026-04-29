const prisma = require('../config/prisma');
const { emitirEstadoCompleto, rodarDistribuicao } = require('./distribuicao');

// Tempos profissionais: mais agressivos que o antigo (30 min → muito lento)
const HEARTBEAT_TIMEOUT_MS  = 3  * 60 * 1000; // 3 min sem heartbeat → AUSENTE
const AUSENTE_TIMEOUT_MS    = 10 * 60 * 1000; // 10 min ausente → OFFLINE
const INTERVALO_MONITOR_MS  = 30 * 1000;       // Checa a cada 30 s

function iniciarMonitorPresenca(io) {
  setInterval(async () => {
    const agora = new Date();

    try {
      // ── 1. ONLINE sem heartbeat por +3 min → AUSENTE ──────────────────
      // EXCEÇÃO: funcionárias na fila nunca são marcadas ausentes por falta de heartbeat
      const limiteHeartbeat = new Date(agora - HEARTBEAT_TIMEOUT_MS);

      const onlineSemBatimento = await prisma.funcionaria.findMany({
        where: {
          status: 'ONLINE',
          ultimoBatimento: { not: null, lt: limiteHeartbeat },
          filaEntradas: { none: {} }, // Não está na fila = pode ser marcada ausente
        },
        select: { id: true, salaoId: true },
      });

      for (const f of onlineSemBatimento) {
        await prisma.funcionaria.update({
          where: { id: f.id },
          data: { status: 'AUSENTE', ausenteDesde: new Date() },
        });
        console.log(`[presença] Funcionária ${f.id} → AUSENTE (sem heartbeat há +3 min, fora da fila)`);

        if (io) {
          io.to(`funcionaria:${f.id}`).emit('aviso_presenca', {
            tipo: 'sem_heartbeat',
            mensagem: 'Você apareceu como ausente. Abra o app para voltar ao online.',
          });
          await emitirEstadoCompleto(f.salaoId, io);
        }
      }

      // ── 2. AUSENTE por +10 min → OFFLINE ──────────────────────────────
      const limiteAusente = new Date(agora - AUSENTE_TIMEOUT_MS);

      const ausenteHaMuito = await prisma.funcionaria.findMany({
        where: {
          status: 'AUSENTE',
          ausenteDesde: { not: null, lt: limiteAusente },
        },
        select: { id: true, salaoId: true },
      });

      for (const f of ausenteHaMuito) {
        await prisma.$transaction([
          prisma.funcionaria.update({
            where: { id: f.id },
            data: { status: 'OFFLINE', ausenteDesde: null, ultimoBatimento: null },
          }),
          prisma.filaEntrada.deleteMany({ where: { funcionariaId: f.id } }),
        ]);
        console.log(`[presença] Funcionária ${f.id} → OFFLINE (ausente há +10 min)`);

        if (io) {
          io.to(`funcionaria:${f.id}`).emit('virou_offline', {
            motivo: 'inatividade',
            mensagem: 'Você ficou offline por mais de 10 minutos sem atividade.',
          });
          await rodarDistribuicao(f.salaoId, io);
          await emitirEstadoCompleto(f.salaoId, io);
        }
      }
    } catch (err) {
      console.error('[presença] Erro no monitor:', err.message);
    }
  }, INTERVALO_MONITOR_MS);
}

module.exports = { iniciarMonitorPresenca };
