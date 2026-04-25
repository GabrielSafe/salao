const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const superadmin = await prisma.usuario.upsert({
    where: { email: 'super@salao.com' },
    update: {},
    create: {
      nome: 'Super Admin',
      email: 'super@salao.com',
      senha: senhaHash,
      role: 'SUPERADMIN',
    },
  });

  const salao = await prisma.salao.upsert({
    where: { slug: 'salao-demo' },
    update: {},
    create: {
      nome: 'Salão Demo',
      slug: 'salao-demo',
    },
  });

  await prisma.contadorComanda.upsert({
    where: { salaoId: salao.id },
    update: {},
    create: { salaoId: salao.id, contador: 0 },
  });

  const adminUsuario = await prisma.usuario.upsert({
    where: { email: 'admin@salaodemo.com' },
    update: {},
    create: {
      nome: 'Gerente Demo',
      email: 'admin@salaodemo.com',
      senha: senhaHash,
      role: 'ADMIN',
      salaoId: salao.id,
    },
  });

  console.log('Seed concluído:');
  console.log('  Superadmin:', superadmin.email);
  console.log('  Salão:', salao.nome, '| slug:', salao.slug);
  console.log('  Admin do salão:', adminUsuario.email);
  console.log('\nSenha padrão de todos: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
