const prisma = require('../config/prisma');

// Catálogo padrão — igual ao servicosCatalog.js do frontend
const CATALOGO_PADRAO = [
  // CABELO — Escovas & Finalizações
  { nome: 'Fast Escova - Lisa',              grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Escova - Modelada',           grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 109 },
  { nome: 'Fast Escova Mega Hair - Lisa',     grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 119 },
  { nome: 'Fast Escova Mega Hair - Modelada', grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 139 },
  { nome: 'Aplicação Fresh Mint',             grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 40  },
  { nome: 'Fast Aplicação',                   grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 35  },
  { nome: 'Fast Lavagem',                     grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 45  },
  { nome: 'Fast Pontas',                      grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 99  },
  { nome: 'Adicional Escova Modelada',        grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 20  },
  { nome: 'Fast Babyliss',                    grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Chapinha',                    grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Difusor',                     grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Escova + Babyliss',           grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 109 },
  { nome: 'Fast Escova + Chapinha',           grupo: 'Escovas & Finalizações', categoria: 'CABELO', preco: 109 },
  // CABELO — Penteados
  { nome: 'Adicional Fitas',  grupo: 'Penteados', categoria: 'CABELO', preco: 25  },
  { nome: 'Fast Penteados',   grupo: 'Penteados', categoria: 'CABELO', preco: 129 },
  { nome: 'Fast Tranças',     grupo: 'Penteados', categoria: 'CABELO', preco: 89  },
  // CABELO — Tratamentos
  { nome: 'Fast Hidratação',              grupo: 'Tratamentos', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast LED Terapia',             grupo: 'Tratamentos', categoria: 'CABELO', preco: 79  },
  { nome: 'Fast Nutrição',                grupo: 'Tratamentos', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Umectação',               grupo: 'Tratamentos', categoria: 'CABELO', preco: 89  },
  { nome: 'Fast Reconstrução',            grupo: 'Tratamentos', categoria: 'CABELO', preco: 140 },
  { nome: 'Fast Reconstrução Mega Hair',  grupo: 'Tratamentos', categoria: 'CABELO', preco: 160 },
  { nome: 'Ozonioterapia',                grupo: 'Tratamentos', categoria: 'CABELO', preco: 79  },
  // MAQUIAGEM — Makes
  { nome: 'Fast Make Casual',           grupo: 'Makes', categoria: 'MAQUIAGEM', preco: 109 },
  { nome: 'Fast Make VIP',              grupo: 'Makes', categoria: 'MAQUIAGEM', preco: 139 },
  { nome: 'Adicional Cílios (cliente)', grupo: 'Makes', categoria: 'MAQUIAGEM', preco: 25  },
  { nome: 'Adicional Cílios (unidade)', grupo: 'Makes', categoria: 'MAQUIAGEM', preco: 35  },
  { nome: 'Adicional de Make',          grupo: 'Makes', categoria: 'MAQUIAGEM', preco: 35  },
  // MAO — Unhas & Cuidados
  { nome: 'Esmaltação',  grupo: 'Unhas & Cuidados', categoria: 'MAO', preco: 35 },
  { nome: 'Francesinha', grupo: 'Unhas & Cuidados', categoria: 'MAO', preco: 5  },
  { nome: 'Mãos',        grupo: 'Unhas & Cuidados', categoria: 'MAO', preco: 47 },
  { nome: 'Pés e Mãos',  grupo: 'Unhas & Cuidados', categoria: 'MAO', preco: 83 },
  // PE — Unhas & Cuidados
  { nome: 'Pés',                  grupo: 'Unhas & Cuidados', categoria: 'PE', preco: 47  },
  { nome: 'Plástica dos Pés',     grupo: 'Unhas & Cuidados', categoria: 'PE', preco: 89  },
  { nome: 'Plástica dos Pés VIP', grupo: 'Unhas & Cuidados', categoria: 'PE', preco: 119 },
  // SOBRANCELHA
  { nome: 'Design de Sobrancelhas',  grupo: 'Sobrancelhas & Rosto', categoria: 'SOBRANCELHA', preco: 70 },
  { nome: 'Pintura de Sobrancelhas', grupo: 'Sobrancelhas & Rosto', categoria: 'SOBRANCELHA', preco: 40 },
  { nome: 'Buço',                    grupo: 'Sobrancelhas & Rosto', categoria: 'SOBRANCELHA', preco: 40 },
  { nome: 'Epilação Facial',         grupo: 'Sobrancelhas & Rosto', categoria: 'SOBRANCELHA', preco: 60 },
];

async function seedServicos(salaoId) {
  await prisma.servicoItem.createMany({
    data: CATALOGO_PADRAO.map(s => ({ ...s, salaoId })),
    skipDuplicates: true,
  });
}

async function listar(req, res) {
  const salaoId = req.salaoId;
  let items = await prisma.servicoItem.findMany({
    where: { salaoId },
    orderBy: [{ categoria: 'asc' }, { grupo: 'asc' }, { nome: 'asc' }],
  });

  // Auto-seed na primeira vez
  if (items.length === 0) {
    await seedServicos(salaoId);
    items = await prisma.servicoItem.findMany({
      where: { salaoId },
      orderBy: [{ categoria: 'asc' }, { grupo: 'asc' }, { nome: 'asc' }],
    });
  }

  return res.json(items);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, preco, ativo } = req.body;
  const salaoId = req.salaoId;

  const item = await prisma.servicoItem.findFirst({ where: { id, salaoId } });
  if (!item) return res.status(404).json({ erro: 'Serviço não encontrado' });

  // Verifica atendimentos ativos para qualquer alteração
  const ativos = await prisma.atendimento.count({
    where: {
      salaoId,
      servicoNome: item.nome,
      status: { in: ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'] },
    },
  });

  if (ativos > 0) {
    return res.status(409).json({
      erro: `"${item.nome}" está em ${ativos} atendimento${ativos > 1 ? 's' : ''} ativo${ativos > 1 ? 's' : ''}. Finalize-o${ativos > 1 ? 's' : ''} antes de editar.`,
      atendimentosAtivos: ativos,
    });
  }

  const updated = await prisma.servicoItem.update({
    where: { id },
    data: {
      ...(nome  !== undefined && { nome }),
      ...(preco !== undefined && { preco: Number(preco) }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  return res.json(updated);
}

async function criar(req, res) {
  const { nome, grupo, categoria, preco } = req.body;
  const salaoId = req.salaoId;

  if (!nome || !grupo || !categoria || preco == null) {
    return res.status(400).json({ erro: 'Nome, grupo, categoria e preço são obrigatórios' });
  }

  const item = await prisma.servicoItem.create({
    data: { nome, grupo, categoria, preco: Number(preco), salaoId },
  });

  return res.status(201).json(item);
}

module.exports = { listar, atualizar, criar };
