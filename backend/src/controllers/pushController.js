const prisma = require('../config/prisma');

async function getPublicKey(req, res) {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
}

async function subscribe(req, res) {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ erro: 'Subscription inválida' });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dhKey: keys.p256dh, authKey: keys.auth, usuarioId: req.usuario.id },
    create: { endpoint, p256dhKey: keys.p256dh, authKey: keys.auth, usuarioId: req.usuario.id },
  });

  return res.json({ ok: true });
}

async function unsubscribe(req, res) {
  const { endpoint } = req.body;
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } }).catch(() => {});
  }
  return res.json({ ok: true });
}

module.exports = { getPublicKey, subscribe, unsubscribe };
