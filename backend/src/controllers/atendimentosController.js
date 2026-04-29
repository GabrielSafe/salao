const prisma = require('../config/prisma');
const { rodarDistribuicao, emitirEstadoCompleto, aceitarProposta, recusarProposta, proporParaFuncionaria } = require('../services/distribuicao');

async function proximoNumeroComanda(salaoId, tx) {
  const contador = await tx.contadorComanda.update({
    where: { salaoId },
    data: { contador: { increment: 1 } },
  });
  return contador.contador;
}

async function criarComanda(req, res) {
  // servicos: [{ tipoServico, servicoNome, servicoPreco }]
  const { clienteId, servicos } = req.body; // cadeiraId removido — atribuição automática
  const salaoId = req.salaoId;

  if (!clienteId || !servicos?.length) {
    return res.status(400).json({ erro: 'Cliente e pelo menos um serviço são obrigatórios' });
  }

  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, salaoId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrada' });

  // Recepcionista que criou a comanda (null para ADMIN/SUPERADMIN)
  const recepcionistaId = req.usuario.role === 'RECEPCIONISTA' ? req.usuario.id : null;

  // Atribuição automática de cadeira (menor número disponível)
  // Sem escolha manual — impede preferências por cadeira
  const ocupadasIds = (await prisma.atendimento.findMany({
    where: { salaoId, status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] }, cadeiraId: { not: null } },
    select: { cadeiraId: true },
    distinct: ['cadeiraId'],
  })).map(a => a.cadeiraId);

  const cadeiraLivre = await prisma.cadeira.findFirst({
    where: {
      salaoId,
      ativo: true,
      ...(ocupadasIds.length > 0 && { id: { notIn: ocupadasIds } }),
    },
    orderBy: { numero: 'asc' },
  });

  const cadeiraIdAtribuida = cadeiraLivre?.id || null;

  // Deduplica por servicoNome (ou tipoServico se sem nome)
  const vistos = new Set();
  const servicosUnicos = servicos.filter(s => {
    const chave = s.servicoNome || s.tipoServico;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  const atendimentos = await prisma.$transaction(async (tx) => {
    const numero = await proximoNumeroComanda(salaoId, tx);
    const criados = [];

    for (const { tipoServico, servicoNome, servicoPreco } of servicosUnicos) {
      const jaExiste = await tx.atendimento.findFirst({
        where: {
          clienteId,
          salaoId,
          ...(servicoNome ? { servicoNome } : { tipoServico }),
          status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] },
        },
      });
      if (jaExiste) continue;

      const a = await tx.atendimento.create({
        data: { clienteId, salaoId, tipoServico, servicoNome, servicoPreco, numeroComanda: numero, cadeiraId: cadeiraIdAtribuida, recepcionistaId },
        include: { cliente: true, cadeira: true, recepcionista: { select: { id: true, nome: true, role: true } } },
      });
      criados.push(a);
    }

    return criados;
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.status(201).json(atendimentos);
}

async function adicionarServico(req, res) {
  const { clienteId, tipoServico, servicoNome, servicoPreco } = req.body;
  const salaoId = req.salaoId;

  const jaExiste = await prisma.atendimento.findFirst({
    where: {
      clienteId,
      salaoId,
      ...(servicoNome ? { servicoNome } : { tipoServico }),
      status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] },
    },
  });
  if (jaExiste) return res.status(409).json({ erro: 'Serviço já está em andamento para esta cliente' });

  const ultimaComanda = await prisma.atendimento.findFirst({
    where: { clienteId, salaoId },
    orderBy: { createdAt: 'desc' },
  });

  const atendimento = await prisma.atendimento.create({
    data: {
      clienteId,
      salaoId,
      tipoServico,
      servicoNome,
      servicoPreco,
      numeroComanda: ultimaComanda?.numeroComanda ?? 0,
    },
    include: { cliente: true },
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.status(201).json(atendimento);
}

async function finalizar(req, res) {
  const { id } = req.params;
  const funcionaria = req.usuario.funcionaria;
  const salaoId = req.usuario.salaoId;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: 'EM_ATENDIMENTO', funcionariaId: funcionaria?.id },
  });

  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado ou não pertence a você' });

  // Verifica se há outros serviços ativos para essa funcionária (grupo)
  const outrosAtivos = await prisma.atendimento.count({
    where: { funcionariaId: funcionaria.id, salaoId, status: 'EM_ATENDIMENTO', id: { not: id } },
  });

  const ops = [
    prisma.atendimento.update({
      where: { id },
      data: { status: 'FINALIZADO', finalizadoEm: new Date() },
    }),
  ];

  // Só volta para ONLINE quando não há mais serviços ativos
  if (outrosAtivos === 0) {
    ops.push(prisma.funcionaria.update({
      where: { id: funcionaria.id },
      data: { status: 'ONLINE' },
    }));
  }

  await prisma.$transaction(ops);

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Atendimento finalizado com sucesso' });
}

async function finalizarAdmin(req, res) {
  const { id } = req.params;
  const salaoId = req.salaoId;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] } },
  });

  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

  // Verifica se há outros serviços ativos para essa funcionária antes de voltar para ONLINE
  let outrosAtivos = 0;
  if (atendimento.funcionariaId) {
    outrosAtivos = await prisma.atendimento.count({
      where: { funcionariaId: atendimento.funcionariaId, salaoId, status: 'EM_ATENDIMENTO', id: { not: id } },
    });
  }

  const ops = [
    prisma.atendimento.update({
      where: { id },
      data: { status: 'FINALIZADO', finalizadoEm: new Date(), finalizadoPorAdm: true },
    }),
  ];

  // Só volta para ONLINE quando não há mais serviços ativos
  if (atendimento.funcionariaId && outrosAtivos === 0) {
    ops.push(
      prisma.funcionaria.update({
        where: { id: atendimento.funcionariaId },
        data: { status: 'ONLINE' },
      })
    );
  }

  // Limpa proposta pendente se houver
  if (atendimento.status === 'PENDENTE_ACEITE') {
    const { limparRejeicoes } = require('../services/distribuicao');
    limparRejeicoes(id);
  }

  await prisma.$transaction(ops);

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Atendimento finalizado pelo administrador' });
}

async function cancelar(req, res) {
  const { id } = req.params;
  const salaoId = req.salaoId;

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: { in: ['AGUARDANDO', 'EM_ATENDIMENTO'] } },
  });
  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' });

  await prisma.$transaction(async (tx) => {
    await tx.atendimento.update({ where: { id }, data: { status: 'CANCELADO' } });
    if (atendimento.funcionariaId) {
      await tx.funcionaria.update({
        where: { id: atendimento.funcionariaId },
        data: { status: 'ONLINE' },
      });
    }
  });

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Atendimento cancelado' });
}

async function listarPorComanda(req, res) {
  const { numero } = req.params;
  const salaoId = req.salaoId;

  const atendimentos = await prisma.atendimento.findMany({
    where: { salaoId, numeroComanda: Number(numero) },
    include: {
      cliente: true,
      funcionaria: { include: { usuario: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!atendimentos.length) return res.status(404).json({ erro: 'Comanda não encontrada' });
  return res.json(atendimentos);
}

async function relatorio(req, res) {
  const salaoId = req.salaoId;
  const { inicio, fim } = req.query;

  const where = {
    salaoId,
    ...(inicio && fim
      ? { createdAt: { gte: new Date(inicio), lte: new Date(fim) } }
      : { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
  };

  // Recepcionista vê apenas seus próprios atendimentos no relatório
  if (req.usuario.role === 'RECEPCIONISTA') {
    where.recepcionistaId = req.usuario.id;
  }

  const atendimentos = await prisma.atendimento.findMany({
    where,
    include: {
      cliente: true,
      funcionaria: { include: { usuario: true } },
      recepcionista: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const por_servico = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'].reduce((acc, s) => {
    acc[s] = atendimentos.filter((a) => a.tipoServico === s).length;
    return acc;
  }, {});

  return res.json({
    total: atendimentos.length,
    finalizados: atendimentos.filter((a) => a.status === 'FINALIZADO').length,
    cancelados: atendimentos.filter((a) => a.status === 'CANCELADO').length,
    por_servico,
    atendimentos,
  });
}

async function aceitar(req, res) {
  const { id } = req.params;
  const funcionaria = req.usuario.funcionaria;
  if (!funcionaria) return res.status(403).json({ erro: 'Acesso negado' });

  const io = req.app.get('io');
  await aceitarProposta(id, funcionaria.id, req.usuario.salaoId, io);
  return res.json({ mensagem: 'Atendimento aceito' });
}

async function recusar(req, res) {
  const { id } = req.params;
  const funcionaria = req.usuario.funcionaria;
  if (!funcionaria) return res.status(403).json({ erro: 'Acesso negado' });

  const io = req.app.get('io');
  await recusarProposta(id, funcionaria.id, req.usuario.salaoId, io, false);
  return res.json({ mensagem: 'Proposta recusada' });
}

async function atribuirManual(req, res) {
  const { id } = req.params;
  const { funcionariaId } = req.body;
  const salaoId = req.salaoId;

  if (!funcionariaId) return res.status(400).json({ erro: 'Informe a funcionariaId' });

  const atendimento = await prisma.atendimento.findFirst({
    where: { id, salaoId, status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE'] } },
  });
  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado ou não está aguardando' });

  const funcionaria = await prisma.funcionaria.findFirst({ where: { id: funcionariaId, salaoId } });
  if (!funcionaria) return res.status(404).json({ erro: 'Funcionária não encontrada' });

  const io = req.app.get('io');
  await proporParaFuncionaria(id, funcionariaId, salaoId, io);

  return res.json({ mensagem: 'Atendimento atribuído com sucesso' });
}

async function fecharComanda(req, res) {
  const { numero } = req.params;
  const salaoId = req.salaoId;

  const count = await prisma.atendimento.updateMany({
    where: {
      salaoId,
      numeroComanda: Number(numero),
      status: 'FINALIZADO',
      fechadaEm: null,
    },
    data: { fechadaEm: new Date() },
  });

  if (count.count === 0) {
    return res.status(400).json({ erro: 'Comanda não encontrada ou ainda tem serviços em aberto' });
  }

  const io = req.app.get('io');
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Comanda fechada com sucesso' });
}

module.exports = { criarComanda, adicionarServico, finalizar, finalizarAdmin, cancelar, listarPorComanda, relatorio, aceitar, recusar, fecharComanda, atribuirManual };
