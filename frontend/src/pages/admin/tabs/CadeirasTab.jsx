import { useState, useEffect, useCallback } from 'react';
import { Armchair, Users, DollarSign, Timer, TrendingUp, Edit2, Check, X, Loader2, BarChart3, Calendar } from 'lucide-react';
import api from '../../../services/api';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtMin = (m) => m == null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}min` : ''}`;

function useT() {
  const { isDark } = useThemeCtx();
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    hover: '#333', shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    hover: '#f9fafb', shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
  };
}

// ── Card de cadeira ────────────────────────────────────────────────────────
function CadeiraCard({ cadeira, onRename }) {
  const T = useT();
  const { isDark } = useThemeCtx();
  const [editando, setEditando] = useState(false);
  const [nome, setNome]         = useState(cadeira.nome || `Cadeira ${cadeira.numero}`);
  const [saving, setSaving]     = useState(false);

  const livre = !cadeira.ocupada && cadeira.ativo;
  const cor   = !cadeira.ativo ? '#6b7280' : livre ? '#10b981' : '#f59e0b';
  const bgCor = !cadeira.ativo ? 'rgba(107,114,128,.1)' : livre ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)';
  const bCor  = !cadeira.ativo ? 'rgba(107,114,128,.2)' : livre ? 'rgba(16,185,129,.25)' : 'rgba(245,158,11,.25)';
  const label = !cadeira.ativo ? 'Inativa' : livre ? 'Livre' : 'Ocupada';

  async function salvar() {
    setSaving(true);
    try { await onRename(cadeira.id, nome); setEditando(false); }
    catch {}
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: T.card, border: `2px solid ${bCor}`, borderRadius: '0.5rem', padding: '16px', boxShadow: T.shadow, transition: 'all .2s', position: 'relative' }}>
      {/* Número */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: bgCor, border: `2px solid ${cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: cor }}>
          {cadeira.numero}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: bgCor, padding: '2px 8px', borderRadius: 20 }}>
          {label}
        </span>
      </div>

      {/* Nome editável */}
      {editando ? (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <input value={nome} onChange={e => setNome(e.target.value)} autoFocus
            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: `1.5px solid #f59e0b`, background: isDark ? '#1f1f1f' : '#f9fafb', color: T.fg, fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif' }}
            onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false); }}
          />
          <button onClick={salvar} disabled={saving} style={{ padding: '4px 8px', borderRadius: 5, background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 11 }}>
            {saving ? <Loader2 size={11} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={11} />}
          </button>
          <button onClick={() => setEditando(false)} style={{ padding: '4px 6px', borderRadius: 5, background: T.bg2, color: T.muted, border: 'none', cursor: 'pointer' }}>
            <X size={11} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.fg, flex: 1 }}>{cadeira.nome || `Cadeira ${cadeira.numero}`}</span>
          <button onClick={() => setEditando(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, padding: 2, display: 'flex' }}>
            <Edit2 size={12} />
          </button>
        </div>
      )}

      {/* Info ocupação */}
      {cadeira.ocupada && cadeira.ocupacao ? (
        <div style={{ padding: '8px', background: 'rgba(245,158,11,.08)', borderRadius: 6, border: '1px solid rgba(245,158,11,.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#d97706', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cadeira.ocupacao.clienteNome}
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
            Comanda #{cadeira.ocupacao.numeroComanda}
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px', background: T.bg2, borderRadius: 6, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: T.sub }}>
            {cadeira.ativo ? 'Disponível' : 'Fora de uso'}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Tab principal ──────────────────────────────────────────────────────────
export default function CadeirasTab() {
  const T = useT();
  const { isDark } = useThemeCtx();
  const [cadeiras, setCadeiras]   = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingRel, setLoadingRel] = useState(false);
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim]       = useState(() => new Date().toISOString().split('T')[0]);
  const [abaAtiva, setAbaAtiva]     = useState('visao'); // visao | relatorio

  const carregarCadeiras = useCallback(async () => {
    try {
      const { data } = await api.get('/cadeiras');
      setCadeiras(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const carregarRelatorio = useCallback(async () => {
    setLoadingRel(true);
    try {
      const { data } = await api.get(`/cadeiras/relatorio?inicio=${dataInicio}&fim=${dataFim}T23:59:59`);
      setRelatorio(data);
    } catch {}
    finally { setLoadingRel(false); }
  }, [dataInicio, dataFim]);

  useEffect(() => { carregarCadeiras(); }, [carregarCadeiras]);
  useEffect(() => { if (abaAtiva === 'relatorio') carregarRelatorio(); }, [abaAtiva, carregarRelatorio]);

  // Recarga periódica da visão geral
  useEffect(() => {
    if (abaAtiva !== 'visao') return;
    const t = setInterval(carregarCadeiras, 15000);
    return () => clearInterval(t);
  }, [abaAtiva, carregarCadeiras]);

  async function handleRename(id, nome) {
    const { data } = await api.patch(`/cadeiras/${id}`, { nome });
    setCadeiras(prev => prev.map(c => c.id === id ? { ...c, nome: data.nome } : c));
  }

  const livres   = cadeiras.filter(c => c.ativo && !c.ocupada).length;
  const ocupadas = cadeiras.filter(c => c.ocupada).length;
  const inativas = cadeiras.filter(c => !c.ativo).length;
  const total    = cadeiras.length;
  const taxaOcup = total > 0 ? Math.round((ocupadas / cadeiras.filter(c => c.ativo).length) * 100) : 0;

  const inputStyle = {
    padding: '7px 10px', borderRadius: '0.375rem', border: `1px solid ${T.border}`,
    background: T.card, color: T.fg, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: T.muted, fontFamily: 'Inter, sans-serif' }}>
      <Loader2 size={22} style={{ animation: 'spin .7s linear infinite', marginRight: 10 }} /> Carregando cadeiras...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.fg, letterSpacing: '-0.3px' }}>Cadeiras</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>
            {livres} livre{livres !== 1 ? 's' : ''} · {ocupadas} ocupada{ocupadas !== 1 ? 's' : ''} · {inativas} inativa{inativas !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: '0.375rem', padding: 4 }}>
          {[
            { key: 'visao',    label: 'Visão Geral', Icon: Armchair },
            { key: 'relatorio', label: 'Relatórios',  Icon: BarChart3 },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setAbaAtiva(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: abaAtiva === key ? 600 : 400, border: 'none', cursor: 'pointer', background: abaAtiva === key ? T.card : 'transparent', color: abaAtiva === key ? T.fg : T.muted, boxShadow: abaAtiva === key ? T.shadow : 'none', transition: 'all .15s' }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── VISÃO GERAL ── */}
      {abaAtiva === 'visao' && (
        <>
          {/* KPIs resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Cadeiras livres',   valor: livres,                 cor: '#10b981', bg: 'rgba(16,185,129,.1)',   Icon: Armchair   },
              { label: 'Ocupadas agora',    valor: ocupadas,               cor: '#f59e0b', bg: 'rgba(245,158,11,.1)',   Icon: Users      },
              { label: 'Taxa de ocupação',  valor: `${isNaN(taxaOcup) ? 0 : taxaOcup}%`, cor: '#8b5cf6', bg: 'rgba(139,92,246,.1)', Icon: TrendingUp },
              { label: 'Total de cadeiras', valor: total,                  cor: '#38bdf8', bg: 'rgba(56,189,248,.1)',   Icon: BarChart3  },
            ].map(k => (
              <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <k.Icon size={18} color={k.cor} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: k.cor, lineHeight: 1, letterSpacing: '-0.02em' }}>{k.valor}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Grade de cadeiras */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.fg, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Armchair size={16} color="#f59e0b" /> Mapa das Cadeiras
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11, color: T.muted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Livre</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Ocupada</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} /> Inativa</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {cadeiras.map(c => (
                <CadeiraCard key={c.id} cadeira={c} onRename={handleRename} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── RELATÓRIOS ── */}
      {abaAtiva === 'relatorio' && (
        <>
          {/* Filtro de data */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, padding: '14px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Calendar size={15} color={T.muted} />
            <span style={{ fontSize: 13, color: T.fg, fontWeight: 500 }}>Período:</span>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
            <span style={{ color: T.muted, fontSize: 13 }}>até</span>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
            <button onClick={carregarRelatorio} disabled={loadingRel}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: '0.375rem', background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
              {loadingRel ? <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> : <BarChart3 size={14} />}
              Gerar
            </button>
          </div>

          {loadingRel ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: T.muted }}>
              <Loader2 size={20} style={{ animation: 'spin .7s linear infinite', marginRight: 8 }} /> Carregando relatório...
            </div>
          ) : (
            <>
              {/* KPIs do relatório */}
              {relatorio.length > 0 && (() => {
                const totFat  = relatorio.reduce((s, r) => s + r.faturamento, 0);
                const totAt   = relatorio.reduce((s, r) => s + r.atendimentos, 0);
                const melhor  = [...relatorio].sort((a, b) => b.faturamento - a.faturamento)[0];
                const maisAt  = [...relatorio].sort((a, b) => b.atendimentos - a.atendimentos)[0];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Faturamento total',        valor: fmt(totFat),                    cor: '#f59e0b', Icon: DollarSign },
                      { label: 'Total de atendimentos',    valor: String(totAt),                  cor: '#8b5cf6', Icon: Users      },
                      { label: 'Cadeira mais lucrativa',   valor: melhor?.cadeira.nome || '—',    cor: '#10b981', Icon: TrendingUp },
                      { label: 'Mais atendimentos',        valor: maisAt?.cadeira.nome || '—',    cor: '#38bdf8', Icon: BarChart3  },
                    ].map(k => (
                      <div key={k.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${k.cor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <k.Icon size={16} color={k.cor} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: k.cor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.valor}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{k.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Tabela detalhada */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 14, fontWeight: 700, color: T.fg }}>
                  Detalhamento por Cadeira
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
                  <thead>
                    <tr style={{ background: T.bg2 }}>
                      {['Cadeira', 'Atendimentos', 'Faturamento', 'Tempo Médio', 'Ticket Médio'].map(h => (
                        <th key={h} style={{ padding: '9px 18px', textAlign: h === 'Cadeira' ? 'left' : 'right', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhum dado no período selecionado</td></tr>
                    ) : (
                      [...relatorio].sort((a, b) => b.faturamento - a.faturamento).map((r, i) => {
                        const ticket = r.atendimentos > 0 ? r.faturamento / r.atendimentos : 0;
                        const maxFat = Math.max(...relatorio.map(x => x.faturamento), 1);
                        return (
                          <tr key={r.cadeira.id} style={{ borderBottom: `1px solid ${T.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = T.hover}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: i === 0 ? 'rgba(245,158,11,.15)' : T.bg2, border: `2px solid ${i === 0 ? '#f59e0b' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i === 0 ? '#f59e0b' : T.muted, flexShrink: 0 }}>
                                  {r.cadeira.numero}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{r.cadeira.nome}</div>
                                  {/* Barra de faturamento relativo */}
                                  <div style={{ width: 80, height: 3, background: T.bg2, borderRadius: 2, marginTop: 4 }}>
                                    <div style={{ height: '100%', borderRadius: 2, background: '#f59e0b', width: `${(r.faturamento / maxFat) * 100}%`, transition: 'width .4s' }} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: T.fg }}>{r.atendimentos}</td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(r.faturamento)}</td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 13, color: T.muted }}>{fmtMin(r.tempoMedioMinutos)}</td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 13, color: T.fg }}>{ticket > 0 ? fmt(ticket) : '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
