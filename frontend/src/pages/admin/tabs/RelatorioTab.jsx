import { useState, useEffect, useCallback } from 'react';
import { BarChart3, CheckCircle2, XCircle, Loader2, Scissors, Sparkles, Hand, Leaf, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.12)' },
};

function dataHoje() { return new Date().toISOString().split('T')[0]; }

export default function RelatorioTab() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState({ inicio: dataHoje(), fim: dataHoje() });
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async (f) => {
    const filtroAtual = f || filtro;
    setLoading(true);
    try {
      const { data } = await api.get(`/atendimentos/relatorio?inicio=${filtroAtual.inicio}T00:00:00&fim=${filtroAtual.fim}T23:59:59`);
      setDados(data);
    } catch {}
    setLoading(false);
  }, [filtro]);

  useEffect(() => { carregar(); }, []);

  // Atualiza automaticamente quando qualquer atendimento muda
  useSocket(usuario?.salaoId, { onEstadoCompleto: () => carregar() });

  return (
    <div className="admin-tab">
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
        <button className="btn btn-primary" onClick={carregar} disabled={loading}>
          {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Filtrando...</> : 'Filtrar'}
        </button>
      </div>

      {dados && (
        <>
          {/* KPIs */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total de atendimentos', valor: dados.total,      Icon: BarChart3,    color: 'var(--blue)',    bg: 'var(--blue-dim)' },
              { label: 'Finalizados',           valor: dados.finalizados, Icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-dim)' },
              { label: 'Cancelados',            valor: dados.cancelados,  Icon: XCircle,      color: 'var(--error)',   bg: 'var(--error-dim)' },
            ].map(({ label, valor, Icon, color, bg }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-icon" style={{ background: bg }}>
                  <Icon size={18} color={color} />
                </div>
                <div className="kpi-value" style={{ color }}>{valor}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Por serviço */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Por serviço</h3>
            <div className="grid-4">
              {Object.entries(dados.por_servico).map(([key, val]) => {
                const info = SERVICE_INFO[key];
                if (!info) return null;
                return (
                  <div key={key} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <info.Icon size={18} color={info.color} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: info.color }}>{val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{info.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalhamento</h3>
            {dados.atendimentos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nenhum atendimento no período.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Funcionária</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.atendimentos.map((a) => {
                      const info = SERVICE_INFO[a.tipoServico];
                      return (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{a.numeroComanda}</td>
                          <td>{a.cliente?.nome}</td>
                          <td>
                            {info && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: info.bg, color: info.color }}>
                                <info.Icon size={11} /> {a.servicoNome || info.label}
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-2)' }}>{a.funcionaria?.usuario?.nome || '—'}</td>
                          <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                          <td style={{ color: 'var(--text-2)' }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      );
                    })}
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
