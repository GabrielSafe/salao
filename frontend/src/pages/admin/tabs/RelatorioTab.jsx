import { useState, useEffect } from 'react';
import api from '../../../services/api';

const SERVICO_INFO = { CABELO: { label: 'Cabelo', icon: '✂️' }, MAQUIAGEM: { label: 'Maquiagem', icon: '💄' }, MAO: { label: 'Mão', icon: '💅' }, PE: { label: 'Pé', icon: '🦶' } };

function dataHoje() {
  return new Date().toISOString().split('T')[0];
}

export default function RelatorioTab() {
  const [filtro, setFiltro] = useState({ inicio: dataHoje(), fim: dataHoje() });
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const { data } = await api.get(`/atendimentos/relatorio?inicio=${filtro.inicio}T00:00:00&fim=${filtro.fim}T23:59:59`);
      setDados(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatório</h1>
          <p className="page-subtitle">Visão geral dos atendimentos</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">De</label>
          <input className="input" type="date" value={filtro.inicio} onChange={(e) => setFiltro({ ...filtro, inicio: e.target.value })} style={{ width: 160 }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Até</label>
          <input className="input" type="date" value={filtro.fim} onChange={(e) => setFiltro({ ...filtro, fim: e.target.value })} style={{ width: 160 }} />
        </div>
        <button className="btn btn-primary" onClick={carregar} disabled={loading}>{loading ? 'Carregando...' : 'Filtrar'}</button>
      </div>

      {dados && (
        <>
          {/* KPIs */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total de atendimentos', valor: dados.total, cor: 'var(--azul)' },
              { label: 'Finalizados', valor: dados.finalizados, cor: 'var(--verde)' },
              { label: 'Cancelados', valor: dados.cancelados, cor: 'var(--vermelho)' },
            ].map((k) => (
              <div key={k.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.cor }}>{k.valor}</div>
                <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Por serviço */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Por serviço</h3>
            <div className="grid-4">
              {Object.entries(dados.por_servico).map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--cinza-bg)', borderRadius: 8 }}>
                  <div style={{ fontSize: 28 }}>{SERVICO_INFO[k]?.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{SERVICO_INFO[k]?.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de atendimentos */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Atendimentos</h3>
            {dados.atendimentos.length === 0 ? (
              <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Nenhum atendimento no período.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--cinza-borda)', color: 'var(--texto-suave)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Cliente</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Serviço</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Funcionária</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.atendimentos.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--cinza-borda)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>#{a.numeroComanda}</td>
                        <td style={{ padding: '8px 10px' }}>{a.cliente?.nome}</td>
                        <td style={{ padding: '8px 10px' }}>{SERVICO_INFO[a.tipoServico]?.icon} {SERVICO_INFO[a.tipoServico]?.label}</td>
                        <td style={{ padding: '8px 10px' }}>{a.funcionaria?.usuario?.nome || '—'}</td>
                        <td style={{ padding: '8px 10px' }}><span className={`badge badge-${a.status.toLowerCase()}`} style={{ fontSize: 11 }}>{a.status}</span></td>
                        <td style={{ padding: '8px 10px', color: 'var(--texto-suave)' }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
