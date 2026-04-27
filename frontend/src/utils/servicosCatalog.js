// Catálogo completo de serviços do salão — fonte única da verdade para frontend
export const CATALOG = {
  CABELO: {
    grupos: [
      {
        nome: 'Escovas & Finalizações',
        itens: [
          { nome: 'Fast Escova - Lisa',              preco: 89  },
          { nome: 'Fast Escova - Modelada',           preco: 109 },
          { nome: 'Fast Escova Mega Hair - Lisa',     preco: 119 },
          { nome: 'Fast Escova Mega Hair - Modelada', preco: 139 },
          { nome: 'Aplicação Fresh Mint',             preco: 40  },
          { nome: 'Fast Aplicação',                   preco: 35  },
          { nome: 'Fast Lavagem',                     preco: 45  },
          { nome: 'Fast Pontas',                      preco: 99  },
          { nome: 'Adicional Escova Modelada',        preco: 20  },
          { nome: 'Fast Babyliss',                    preco: 89  },
          { nome: 'Fast Chapinha',                    preco: 89  },
          { nome: 'Fast Difusor',                     preco: 89  },
          { nome: 'Fast Escova + Babyliss',           preco: 109 },
          { nome: 'Fast Escova + Chapinha',           preco: 109 },
        ],
      },
      {
        nome: 'Penteados',
        itens: [
          { nome: 'Adicional Fitas',  preco: 25  },
          { nome: 'Fast Penteados',   preco: 129 },
          { nome: 'Fast Tranças',     preco: 89  },
        ],
      },
      {
        nome: 'Tratamentos',
        itens: [
          { nome: 'Fast Hidratação',               preco: 89  },
          { nome: 'Fast LED Terapia',              preco: 79  },
          { nome: 'Fast Nutrição',                 preco: 89  },
          { nome: 'Fast Umectação',                preco: 89  },
          { nome: 'Fast Reconstrução',             preco: 140 },
          { nome: 'Fast Reconstrução Mega Hair',   preco: 160 },
          { nome: 'Ozonioterapia',                 preco: 79  },
        ],
      },
    ],
  },
  MAQUIAGEM: {
    grupos: [
      {
        nome: 'Makes',
        itens: [
          { nome: 'Fast Make Casual',           preco: 109 },
          { nome: 'Fast Make VIP',              preco: 139 },
          { nome: 'Adicional Cílios (cliente)', preco: 25  },
          { nome: 'Adicional Cílios (unidade)', preco: 35  },
          { nome: 'Adicional de Make',          preco: 35  },
        ],
      },
    ],
  },
  MAO: {
    grupos: [
      {
        nome: 'Unhas & Cuidados',
        itens: [
          { nome: 'Esmaltação',  preco: 35 },
          { nome: 'Francesinha', preco: 5  },
          { nome: 'Mãos',        preco: 47 },
          { nome: 'Pés e Mãos',  preco: 83 },
        ],
      },
    ],
  },
  PE: {
    grupos: [
      {
        nome: 'Unhas & Cuidados',
        itens: [
          { nome: 'Pés',                  preco: 47  },
          { nome: 'Plástica dos Pés',     preco: 89  },
          { nome: 'Plástica dos Pés VIP', preco: 119 },
        ],
      },
    ],
  },
  SOBRANCELHA: {
    grupos: [
      {
        nome: 'Sobrancelhas & Rosto',
        itens: [
          { nome: 'Design de Sobrancelhas',  preco: 70 },
          { nome: 'Pintura de Sobrancelhas', preco: 40 },
          { nome: 'Buço',                    preco: 40 },
          { nome: 'Epilação Facial',         preco: 60 },
        ],
      },
    ],
  },
};

export const CATEGORIAS_ORDEM = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];
