const express = require('express');
const router = express.Router();

const { autenticar, exigirRole, exigirSalao } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const saloesCtrl = require('../controllers/saloesController');
const funcionariasCtrl = require('../controllers/funcionariasController');
const clientesCtrl = require('../controllers/clientesController');
const atendimentosCtrl = require('../controllers/atendimentosController');
const servicosCtrl     = require('../controllers/servicosController');
const cadeirasCtrl     = require('../controllers/cadeirasController');

// Auth
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', autenticar, authCtrl.logout);
router.get('/auth/perfil', autenticar, authCtrl.perfil);

// Salões (superadmin)
router.get('/saloes', autenticar, exigirRole('SUPERADMIN'), saloesCtrl.listar);
router.post('/saloes', autenticar, exigirRole('SUPERADMIN'), saloesCtrl.criar);
router.put('/saloes/:id', autenticar, exigirRole('SUPERADMIN'), saloesCtrl.atualizar);
router.get('/saloes/:id/dashboard', autenticar, exigirRole('SUPERADMIN'), saloesCtrl.dashboard);

// Dashboard do salão atual (admin)
router.get('/dashboard', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, saloesCtrl.dashboard);

// Funcionárias
router.get('/funcionarias', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, funcionariasCtrl.listar);
router.post('/funcionarias', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, funcionariasCtrl.criar);
router.put('/funcionarias/:id', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, funcionariasCtrl.atualizar);
router.get('/funcionarias/:id/historico', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, funcionariasCtrl.historico);

// Fila (funcionária controla a própria fila)
router.post('/fila/entrar', autenticar, exigirRole('FUNCIONARIA'), funcionariasCtrl.entrarFila);
router.post('/fila/sair',   autenticar, exigirRole('FUNCIONARIA'), funcionariasCtrl.sairFila);

// Status de presença (ausente / online)
router.patch('/status/presenca', autenticar, exigirRole('FUNCIONARIA'), funcionariasCtrl.atualizarPresenca);

// Clientes
router.get('/clientes', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, clientesCtrl.listar);
router.get('/clientes/buscar', autenticar, exigirRole('ADMIN', 'SUPERADMIN', 'FUNCIONARIA'), exigirSalao, clientesCtrl.buscar);
router.post('/clientes', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, clientesCtrl.criar);
router.put('/clientes/:id', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, clientesCtrl.atualizar);
router.get('/clientes/:id/historico', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, clientesCtrl.historico);

// Serviços (catálogo)
router.get('/servicos',      autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, servicosCtrl.listar);
router.post('/servicos',     autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, servicosCtrl.criar);
router.patch('/servicos/:id',autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, servicosCtrl.atualizar);

// Cadeiras
router.get('/cadeiras',              autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, cadeirasCtrl.listar);
router.patch('/cadeiras/:id',        autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, cadeirasCtrl.atualizar);
router.get('/cadeiras/relatorio',    autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, cadeirasCtrl.relatorio);

// Atendimentos
router.post('/atendimentos/comanda', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.criarComanda);
router.post('/atendimentos/adicionar', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.adicionarServico);
router.patch('/atendimentos/:id/finalizar',       autenticar, exigirRole('FUNCIONARIA'),          atendimentosCtrl.finalizar);
router.patch('/atendimentos/:id/finalizar-admin', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.finalizarAdmin);
router.post('/atendimentos/:id/aceitar',   autenticar, exigirRole('FUNCIONARIA'), atendimentosCtrl.aceitar);
router.post('/atendimentos/:id/recusar',   autenticar, exigirRole('FUNCIONARIA'), atendimentosCtrl.recusar);
router.patch('/atendimentos/:id/cancelar', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.cancelar);
router.get('/atendimentos/comanda/:numero', autenticar, exigirSalao, atendimentosCtrl.listarPorComanda);
router.get('/atendimentos/relatorio', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.relatorio);
router.patch('/atendimentos/comanda/:numero/fechar', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.fecharComanda);
router.patch('/atendimentos/:id/atribuir', autenticar, exigirRole('ADMIN', 'SUPERADMIN'), exigirSalao, atendimentosCtrl.atribuirManual);

// Rota pública para cliente acompanhar comanda (sem auth)
router.get('/publico/:salaoSlug/comanda/:numero', async (req, res) => {
  const { salaoSlug, numero } = req.params;
  const prisma = require('../config/prisma');

  const salao = await prisma.salao.findUnique({ where: { slug: salaoSlug } });
  if (!salao) return res.status(404).json({ erro: 'Salão não encontrado' });

  const atendimentos = await prisma.atendimento.findMany({
    where: { salaoId: salao.id, numeroComanda: Number(numero) },
    include: {
      cliente: true,
      funcionaria: { include: { usuario: { select: { nome: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ salao: { id: salao.id, nome: salao.nome }, atendimentos });
});

// Rota pública: cliente solicita serviços
router.post('/publico/:salaoSlug/solicitar', async (req, res) => {
  const { salaoSlug } = req.params;
  const { nome, cpf, telefone, servicos } = req.body;
  const prisma = require('../config/prisma');
  const { rodarDistribuicao, emitirEstadoCompleto } = require('../services/distribuicao');

  if (!nome || !servicos?.length) {
    return res.status(400).json({ erro: 'Nome e serviços são obrigatórios' });
  }

  const salao = await prisma.salao.findUnique({ where: { slug: salaoSlug } });
  if (!salao || !salao.ativo) return res.status(404).json({ erro: 'Salão não encontrado' });

  const salaoId = salao.id;

  const resultado = await prisma.$transaction(async (tx) => {
    let cliente;
    if (cpf) {
      cliente = await tx.cliente.findUnique({ where: { cpf_salaoId: { cpf, salaoId } } });
    }
    if (!cliente) {
      cliente = await tx.cliente.create({ data: { nome, cpf, telefone, salaoId } });
    } else {
      cliente = await tx.cliente.update({ where: { id: cliente.id }, data: { nome, telefone } });
    }

    const contador = await tx.contadorComanda.update({
      where: { salaoId },
      data: { contador: { increment: 1 } },
    });

    const servicosUnicos = [...new Set(servicos)];
    const atendimentos = [];
    for (const tipoServico of servicosUnicos) {
      const a = await tx.atendimento.create({
        data: { clienteId: cliente.id, salaoId, tipoServico, numeroComanda: contador.contador },
        include: { cliente: true },
      });
      atendimentos.push(a);
    }

    return { cliente, atendimentos, numeroComanda: contador.contador };
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.status(201).json(resultado);
});

module.exports = router;
