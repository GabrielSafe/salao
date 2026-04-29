const prisma = require('../config/prisma');

// Carrega web-push dinamicamente — se não estiver instalado, push fica desabilitado
let webpush = null;
try {
  webpush = require('web-push');
} catch {
  console.warn('[push] web-push não encontrado — notificações push desabilitadas. Execute: npm install');
}

let configured = false;

function configurar() {
  if (configured) return;
  if (!webpush) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@rapidobeauty.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  configured = true;
}

/**
 * Envia Web Push para todos os dispositivos registrados de uma funcionária.
 * Funciona mesmo com o app completamente fechado no celular.
 */
async function enviarPushParaFuncionaria(funcionariaId, payload) {
  configurar();
  if (!configured) return; // VAPID não configurado — silencia

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { usuario: { funcionaria: { id: funcionariaId } } },
    });
    if (subscriptions.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
            body,
          );
        } catch (err) {
          // 410 Gone = subscription expirada → remove do banco
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }),
    );
  } catch (err) {
    console.error('[push] Erro ao enviar:', err.message);
  }
}

module.exports = { enviarPushParaFuncionaria };
