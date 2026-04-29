import { useState, useEffect } from 'react';
import api from '../services/api';

export function buildCatalog(items) {
  const catalog = {};
  items
    .filter(i => i.ativo)
    .forEach(item => {
      if (!catalog[item.categoria]) catalog[item.categoria] = { grupos: [] };
      let grupo = catalog[item.categoria].grupos.find(g => g.nome === item.grupo);
      if (!grupo) {
        grupo = { nome: item.grupo, itens: [] };
        catalog[item.categoria].grupos.push(grupo);
      }
      grupo.itens.push({ nome: item.nome, preco: item.preco });
    });
  return catalog;
}

export function useServicos() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/servicos')
      .then(r => setCatalog(buildCatalog(r.data)))
      .catch(() => setCatalog({}))
      .finally(() => setLoading(false));
  }, []);

  return { catalog, loading };
}
