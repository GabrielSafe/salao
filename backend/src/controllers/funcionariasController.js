const bcrypt = require('bcryptjs');
const { Especialidade } = require('@prisma/client');
const prisma = require('../config/prisma');
const { rodarDistribuicao, emitirEstadoCompleto, limparRejeicoesParaFuncionaria } = require('../services/distribuicao');

const TODAS_ESPECIALIDADES = Object.values(Especialidade);

async function listar(req, res) {
  const salaoId = req.salaoId;
  const funcionarias = await prisma.funcionaria.findMany({
    where: { salaoId },
    include: {
      usuario: { select: { id: true, nome: true, email: true, ativo: true } },
      filaEntradas: true,
      atendimentos: {
        where: { status: 'EM_ATENDIMENTO' },
        include: { cliente: true },
      },
    },
    orderBy: { usuario: { nome: 'asc' } },
  });
  return res.json(funcionarias);
}

async function criar(req, res) {
  const { nome, email, senha, especialidades, multiTarefas } = req.body;
  const salaoId = req.salaoId;

  if (!nome || !email || !senha || (!multiTarefas && !especialidades?.length)) {
    return res.status(400).json({ erro: 'Nome, email, senha e especialidades são obrigatórios' });
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'Email já cadastrado' });

  const senhaHash = await bcrypt.hash(senha, 10);

  const funcionaria = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: { nome, email, senha: senhaHash, role: 'FUNCIONARIA', salaoId },
    });
    return tx.funcionaria.create({
      data: {
        usuarioId: usuario.id,
        salaoId,
        especialidades: multiTarefas ? TODAS_ESPECIALIDADES : especialidades,
        multiTarefas: multiTarefas ?? false,
      },
      include: { usuario: true },
    });
  });

  return res.status(201).json(funcionaria);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, especialidades, multiTarefas, ativo, senha } = req.body;
  const salaoId = req.salaoId;

  const funcionaria = await prisma.funcionaria.findFirst({ where: { id, salaoId } });
  if (!funcionaria) return res.status(404).json({ erro: 'Funcionária não encontrada' });

  const esp = multiTarefas ? TODAS_ESPECIALIDADES : especialidades;

  const dadosUsuario = {};
  if (nome     !== undefined) dadosUsuario.nome  = nome;
  if (ativo    !== undefined) dadosUsuario.ativo = ativo;
  if (senha?.trim()) dadosUsuario.senha = await bcrypt.hash(senha, 10);

  const [func] = await prisma.$transaction([
    prisma.funcionaria.update({
      where: { id },
      data: { especialidades: esp ?? undefined, multiTarefas: multiTarefas ?? undefined },
      include: { usuario: true },
    }),
    ...(Object.keys(dadosUsuario).length > 0
      ? [prisma.usuario.update({ where: { id: funcionaria.usuarioId }, data: dadosUsuario })]
      : []),
  ]);

  return res.json(func);
}

async function entrarFila(req, res) {
  const funcionaria = req.usuario.funcionaria;
  if (!funcionaria) return res.status(403).json({ erro: 'Apenas funcionárias podem entrar na fila' });

  // Bloqueia somente OFFLINE e EM_ATENDIMENTO — AUSENTE é aceita e restaurada para ONLINE
  const statusAtual = await prisma.funcionaria.findUnique({
    where: { id: funcionaria.id },
    select: { status: true },
  });
  if (statusAtual?.status === 'OFFLINE') {
    return res.status(400).json({ erro: 'Você está offline. Recarregue o aplicativo.' });
  }
  if (statusAtual?.status === 'EM_ATENDIMENTO') {
    return res.status(400).json({ erro: 'Você já está em atendimento.' });
  }

  const salaoId = req.usuario.salaoId;

  const jaEstaNaFila = await prisma.filaEntrada.findFirst({
    where: { funcionariaId: funcionaria.id },
  });
  if (jaEstaNaFila) {
    return res.status(400).json({ erro: 'Você já está na fila' });
  }

  // Se estava AUSENTE, restaura para ONLINE ao entrar na fila
  if (statusAtual?.status === 'AUSENTE') {
    await prisma.funcionaria.update({
      where: { id: funcionaria.id },
      data: { status: 'ONLINE', ausenteDesde: null, ultimoBatimento: new Date() },
    });
  }

  const especialidades = funcionaria.multiTarefas
    ? TODAS_ESPECIALIDADES
    : funcionaria.especialidades;

  await prisma.filaEntrada.createMany({
    data: especialidades.map((esp) => ({
      funcionariaId: funcionaria.id,
      salaoId,
      especialidade: esp,
    })),
  });

  // Limpa qualquer blacklist de rejeição anterior para esta funcionária
  // Garante que ela receba propostas mesmo que tenha ignorado/perdido propostas antes
  limparRejeicoesParaFuncionaria(funcionaria.id);

  const io = req.app.get('io');
  await rodarDistribuicao(salaoId, io);
  await emitirEstadoCompleto(salaoId, io);

  return res.json({ mensagem: 'Entrou na fila com sucesso' });
}

async function sairFila(req, res) {
  const funcionaria = req.usuario.funcionaria;
  if (!funcionaria) return res.status(403).json({ erro: 'Apenas funcionárias podem sair da fila' });

  await prisma.filaEntrada.deleteMany({ where: { funcionariaId: funcionaria.id } });

  const io = req.app.get('io');
  await emitirEstadoCompleto(req.usuario.salaoId, io);

  return res.json({ mensagem: 'Saiu da fila com sucesso' });
}

async function historico(req, res) {
  const { id } = req.params;
  const salaoId = req.salaoId;

  const funcionaria = await prisma.funcionaria.findFirst({
    where: { id, salaoId },
    include: {
      usuario: { select: { id: true, nome: true, email: true } },
      atendimentos: {
        include: { cliente: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!funcionaria) return res.status(404).json({ erro: 'Funcionária não encontrada' });

  const totalAtendimentos = funcionaria.atendimentos.length;
  const finalizados = funcionaria.atendimentos.filter((a) => a.status === 'FINALIZADO');
  const tempoMedioMs =
    finalizados.length > 0
      ? finalizados.reduce((acc, a) => {
          if (a.iniciadoEm && a.finalizadoEm) {
            return acc + (new Date(a.finalizadoEm) - new Date(a.iniciadoEm));
          }
          return acc;
        }, 0) / finalizados.length
      : 0;

  return res.json({
    funcionaria,
    estatisticas: {
      totalAtendimentos,
      finalizados: finalizados.length,
      tempoMedioMinutos: Math.round(tempoMedioMs / 60000),
    },
  });
}

async function atualizarPresenca(req, res) {
  const funcionaria = req.usuario.funcionaria;
  if (!funcionaria) return res.status(403).json({ erro: 'Acesso negado' });

  const { ausente } = req.body;

  // Só altera se estiver ONLINE ou AUSENTE — não interfere em EM_ATENDIMENTO
  const atual = await prisma.funcionaria.findUnique({ where: { id: funcionaria.id } });
  if (!atual || atual.status === 'EM_ATENDIMENTO' || atual.status === 'OFFLINE') {
    return res.json({ status: atual?.status });
  }

  const novoStatus = ausente ? 'AUSENTE' : 'ONLINE';
  await prisma.funcionaria.update({
    where: { id: funcionaria.id },
    data: {
      status: novoStatus,
      // Inicia timer de ausência; preserva se já estava ausente; limpa ao voltar
      ausenteDesde: ausente
        ? (atual.ausenteDesde ?? new Date())
        : null,
    },
  });

  const io = req.app.get('io');
  if (req.usuario.salaoId) emitirEstadoCompleto(req.usuario.salaoId, io);

  return res.json({ status: novoStatus });
}

module.exports = { listar, criar, atualizar, entrarFila, sairFila, historico, atualizarPresenca };
