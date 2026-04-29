import { useState, useEffect, useCallback } from 'react';
import { BarChart3, CheckCircle2, XCircle, Loader2, Scissors, Sparkles, Hand, Leaf, Eye, ClipboardPlus, Shield, DollarSign, Timer } from 'lucide-react';
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

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
function dataHoje() { return new Date().toISOString().split('T')[0]; }

export default function RelatorioTab() {
  const { usuario } = useAuth();
  const isRecepcionista = usuario?.role === 'RECEPCIONISTA';

  const [filtro, setFiltro]           = useState({ inicio: dataHoje(), fim: dataHoje() });
  const [dados, setDados]             = useState(null);
  const [dadosRecep, setDadosRecep]   = useState(null); // stats por recepcionista (admin)
  const [loading, setLoading]         = useState(false);

  const carregar = useCallback(async (f) => {
    const ft = f || filtro;
    setLoading(true);
    try {
      // Relatório de atendimentos (recepcionista vê apenas os seus — filtrado no backend)
      const { data } = await api.get(`/atendimentos/relatorio?inicio=${ft.inicio}T00:00:00&fim=${ft.fim}T23:59:59`);
      setDados(data);

      // Admin também carrega relatório por recepcionista
      if (!isRecepcionista) {
        const { data: dr } = await api.get(`/recepcionistas/relatorio?inicio=${ft.inicio}T00:00:00&fim=${ft.fim}T23:59:59`);
        setDadosRecep(dr);
      }
    } catch {}
    setLoading(false);
  }, [filtro, isRecepcionista]);

  useEffect(() => { carregar(); }, []);
  useSocket(usuario?.salaoId, { onEstadoCompleto: () => carregar() });

  // Comandas únicas criadas pela recepcionista no período (para o card extra)
  const comandasCriadas = dados
    ? new Set(dados.atendimentos.filter(a => a.recepcionista?.id === usuario?.id).map(a => a.numeroComanda)).size
    : 0;

  return (
    <div className="admin-tab">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isRecepcionista ? 'Meu Relatório' : 'Relatórios'}</h1>
          <p className="page-subtitle">
            {isRecepcionista ? `Suas comandas e atendimentos — ${usuario?.nome}` : 'Visão geral dos atendimentos do salão'}
          </p>
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
        <button className="btn btn-primary" onClick={() => carregar(filtro)} disabled={loading}>
          {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Filtrando...</> : 'Filtrar'}
        </button>
      </div>

      {dados && (
        <>
          {/* ── KPIs ── */}
          <div className="grid-3" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total de atendimentos', valor: dados.total,       Icon: BarChart3,    color: 'var(--blue)',    bg: 'var(--blue-dim)' },
              { label: 'Finalizados',           valor: dados.finalizados,  Icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-dim)' },
              { label: 'Cancelados',            valor: dados.cancelados,   Icon: XCircle,      color: 'var(--error)',   bg: 'var(--error-dim)' },
            ].map(({ label, valor, Icon, color, bg }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
                <div className="kpi-value" style={{ color }}>{valor}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Card extra: Comandas criadas (Recepcionista) ── */}
          {isRecepcionista && (
            <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', border: '1.5px solid rgba(245,158,11,.25)', background: 'rgba(245,158,11,.04)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardPlus size={22} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{comandasCriadas}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>Comandas criadas por você neste período</div>
              </div>
            </div>
          )}

          {/* ── Por serviço ── */}
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

          {/* ── Desempenho por recepcionista (ADMIN only) ── */}
          {!isRecepcionista && dadosRecep && dadosRecep.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={14} color="var(--accent)" /> Por recepcionista
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dadosRecep.map(r => (
                  <div key={r.recepcionista.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                      {r.recepcionista.nome[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.recepcionista.nome}</div>
                      {!r.recepcionista.ativo && <span style={{ fontSize: 10, color: 'var(--error)', fontWeight: 600 }}>Inativa</span>}
                    </div>
                    {[
                      { label: 'Comandas', valor: r.comandasCriadas,       Icon: ClipboardPlus, color: '#f59e0b' },
                      { label: 'Serviços', valor: r.servicosFinalizados,    Icon: CheckCircle2,  color: '#10b981' },
                      { label: 'Faturado', valor: fmt(r.faturamento),       Icon: DollarSign,    color: '#8b5cf6' },
                    ].map(({ label, valor, Icon, color }) => (
                      <div key={label} style={{ textAlign: 'center', minWidth: 80, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Icon size={12} color={color} />
                          <span style={{ fontSize: 15, fontWeight: 800, color }}>{valor}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tabela de detalhamento ── */}
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
                      {!isRecepcionista && <th>Criado por</th>}
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.atendimentos.map((a) => {
                      const info = SERVICE_INFO[a.tipoServico];
                      const criadorNome = a.recepcionista?.nome || (a.recepcionista === null ? 'Gerente/Admin' : '—');
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
                          {!isRecepcionista && (
                            <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                              {a.recepcionista?.nome
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,.1)', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                                    <Shield size={10} /> {a.recepcionista.nome}
                                  </span>
                                : <span style={{ color: 'var(--text-3)' }}>Gerente</span>
                              }
                            </td>
                          )}
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
