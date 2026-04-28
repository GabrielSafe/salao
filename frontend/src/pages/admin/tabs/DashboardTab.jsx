import { useState, useCallback } from 'react';
import {
  Clock, Zap, UserCheck, UserX, Scissors, Sparkles, Hand, Leaf, Eye,
  ChevronDown, ChevronUp, Plus, Check, X, Loader2, ArrowRight,
  TrendingUp, ShieldCheck, UserCheck2, Users, Coffee, Wifi,
  CheckCircle2, FileText, User
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';
import api from '../../../services/api';
import { CATALOG, CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

function buildT(isDark) {
  return isDark ? {
    card:    '#1e1e1e',
    border:  '#2a2a2a',
    bg:      '#161616',
    fg:      '#e5e5e5',
    muted:   '#a3a3a3',
    primary: '#f59e0b',
    shadow:  '0px 4px 8px -1px rgba(0,0,0,.4)',
    radius:  '0.375rem',
    font:    "'Inter', sans-serif",
  } : {
    card:    '#ffffff',
    border:  '#e5e7eb',
    bg:      '#f9fafb',
    fg:      '#262626',
    muted:   '#6b7280',
    primary: '#f59e0b',
    shadow:  '0px 4px 8px -1px rgba(0,0,0,.1)',
    radius:  '0.375rem',
    font:    "'Inter', sans-serif",
  };
}

// Hook usado por todos os sub-componentes para pegar o tema atual
function useT() {
  const { isDark } = useThemeCtx();
  return buildT(isDark);
}

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.1)', darkBg: 'rgba(168,85,247,.08)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.1)', darkBg: 'rgba(236,72,153,.08)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.1)',  darkBg: 'rgba(251,146,60,.08)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.1)',   darkBg: 'rgba(34,197,94,.08)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.1)',  darkBg: 'rgba(56,189,248,.08)'  },
};

const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];

function fmt(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function tempoEspera(d) { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m <= 0 ? '1 min' : `${m} min`; }
function tempoAtend(d)  { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m <= 0 ? '1 min' : `${m} min`; }

// ── Card base ──────────────────────────────────────────────────────────────
function Card({ children, style = {}, className }) {
  const T = useT();
  return (
    <div className={className} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, fontFamily: T.font, ...style }}>
      {children}
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#f59e0b', height = 70 }) {
  const W = 300;
  if (!data || data.length < 2) return <div style={{ height }} />;
  const temDados = data.some(v => v > 0);
  if (!temDados) {
    const y = height * 0.65;
    const pts = data.map((_, i) => [6 + (i / (data.length - 1)) * (W - 12), y]);
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.3" strokeLinecap="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color} fillOpacity="0.25" />)}
      </svg>
    );
  }
  const max = Math.max(...data);
  const pad = 8;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (W - pad * 2), pad + ((max - v) / max) * (height - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color = '#f59e0b', height = 140 }) {
  if (!data || !data.length) return <div style={{ height }} />;
  const max = Math.max(...data.map(d => d.valor), 1);
  const W = 600; const pad = 20; const barW = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${height + 24}`} preserveAspectRatio="none" style={{ width: '100%', height: height + 24 }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = (d.valor / max) * height;
        const x = pad + i * barW + barW * 0.15;
        const w = barW * 0.7;
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={bh} rx="3" fill={d.destaque ? color : `${color}40`} />
            <text x={x + w / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Botão finalizar admin ──────────────────────────────────────────────────
function FinalizarAdminBtn({ atendimentoId, onFinalizado }) {
  const T = useT();
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  async function handleFinalizar() {
    if (!confirmando) { setConfirmando(true); return; }
    setLoading(true);
    try { await api.patch(`/atendimentos/${atendimentoId}/finalizar-admin`); if (onFinalizado) onFinalizado(); }
    catch {} finally { setLoading(false); setConfirmando(false); }
  }
  return confirmando ? (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={handleFinalizar} disabled={loading} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
        {loading ? <Loader2 size={10} style={{ animation: 'spin .7s linear infinite' }} /> : 'Confirmar'}
      </button>
      <button onClick={() => setConfirmando(false)} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>Não</button>
    </div>
  ) : (
    <button onClick={handleFinalizar} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
      <ShieldCheck size={10} /> Finalizar
    </button>
  );
}

// ── Botão atribuir manualmente ─────────────────────────────────────────────
function AtribuirBtn({ atendimentoId, tipoServico, funcionarias }) {
  const T = useT();
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(null);
  const statusColor = { ONLINE: '#10B981', AUSENTE: '#F59E0B', EM_ATENDIMENTO: '#D4178A' };
  const candidatas = funcionarias.filter(f => (f.especialidades?.includes(tipoServico) || f.multiTarefas) && ['ONLINE', 'AUSENTE', 'EM_ATENDIMENTO'].includes(f.status));
  async function atribuir(funcionariaId) {
    setLoading(funcionariaId);
    try { await api.patch(`/atendimentos/${atendimentoId}/atribuir`, { funcionariaId }); setAberto(false); }
    catch {} finally { setLoading(null); }
  }
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setAberto(!aberto)} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(96,165,250,.08)', color: '#60A5FA', border: '1px solid rgba(96,165,250,.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        <UserCheck size={10} /> Atribuir
      </button>
      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, zIndex: 50, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.12)', minWidth: 170 }}>
          <div style={{ padding: '7px 10px 4px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>Escolha a funcionária</div>
          {candidatas.length === 0 ? <div style={{ padding: '10px', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>Nenhuma disponível</div>
            : candidatas.map(f => (
              <button key={f.id} onClick={() => atribuir(f.id)} disabled={!!loading} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${statusColor[f.status] || '#9ca3af'}20`, border: `1.5px solid ${statusColor[f.status] || '#9ca3af'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: statusColor[f.status] || '#9ca3af', flexShrink: 0 }}>
                  {f.usuario?.nome?.[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.usuario?.nome}</span>
                {loading === f.id && <Loader2 size={11} style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }} />}
              </button>
            ))
          }
          <button onClick={() => setAberto(false)} style={{ width: '100%', padding: '6px', background: T.bg, border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af' }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

// ── ComandaRow expandida ───────────────────────────────────────────────────
function ComandaRow({ grupo, estado }) {
  const T = useT();
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [catAtiva, setCatAtiva] = useState('CABELO');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const ativos = grupo.itens.filter(i => i.status === 'EM_ATENDIMENTO').length;
  const nomesJa = grupo.itens.map(i => i.servicoNome).filter(Boolean);
  const noSelecionados = (n) => selecionados.some(s => s.servicoNome === n);

  function toggleSel(tipo, nome, preco) {
    if (noSelecionados(nome)) setSelecionados(p => p.filter(s => s.servicoNome !== nome));
    else setSelecionados(p => [...p, { tipoServico: tipo, servicoNome: nome, servicoPreco: preco }]);
  }

  async function handleAdicionar() {
    if (!selecionados.length) return;
    setLoading(true);
    try {
      await Promise.all(selecionados.map(s => api.post('/atendimentos/adicionar', { clienteId: grupo.clienteId, ...s })));
      setMsg('Adicionado!'); setSelecionados([]); setAdicionando(false);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) { setMsg(err.response?.data?.erro || 'Erro'); }
    finally { setLoading(false); }
  }

  const statusColor = { AGUARDANDO: '#d97706', PENDENTE_ACEITE: '#d97706', EM_ATENDIMENTO: '#16a34a', FINALIZADO: '#9ca3af' };
  const statusLabel = { AGUARDANDO: 'Aguardando', PENDENTE_ACEITE: 'Proposta', EM_ATENDIMENTO: 'Ativo', FINALIZADO: 'Concluído' };

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', marginBottom: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 120px 80px 130px', gap: 12, alignItems: 'center', padding: '11px 20px', background: T.card, cursor: 'pointer', transition: 'background .12s', borderBottom: `1px solid ${T.border}` }}
        onClick={() => setAberto(!aberto)}
        onMouseEnter={e => e.currentTarget.style.background = T.bg}
        onMouseLeave={e => e.currentTarget.style.background = T.card}
      >
        {/* Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
            {grupo.cliente?.nome?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>#{grupo.numero}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grupo.cliente?.nome}</span>
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>{grupo.itens.length} serviço{grupo.itens.length > 1 ? 's' : ''} · {new Date(grupo.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* Serviços */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {grupo.itens.map(item => {
            const info = SERVICE_INFO[item.tipoServico];
            return info ? (
              <span key={item.id} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: item.status === 'EM_ATENDIMENTO' ? info.bg : '#f3f4f6', color: item.status === 'EM_ATENDIMENTO' ? info.color : '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {item.servicoNome || info.label}
              </span>
            ) : null;
          })}
        </div>

        {/* Tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color={T.muted} />
          <span style={{ fontSize: 12, color: T.muted }}>{tempoEspera(grupo.criadoEm)}</span>
        </div>

        {/* Total */}
        <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>
          {fmt(grupo.itens.reduce((s, i) => s + (i.servicoPreco || 0), 0))}
        </span>

        {/* Status + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: ativos > 0 ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: ativos > 0 ? '#10B981' : '#d97706', whiteSpace: 'nowrap' }}>
            {ativos > 0 ? 'Em andamento' : 'Aguardando'}
          </span>
          {aberto ? <ChevronUp size={13} color={T.muted} /> : <ChevronDown size={13} color={T.muted} />}
        </div>
      </div>

      {aberto && (
        <div style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: '12px 16px' }}>
          {grupo.itens.map(item => {
            const info = SERVICE_INFO[item.tipoServico];
            const isAtivo = item.status === 'EM_ATENDIMENTO';
            return info ? (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#fff', borderRadius: T.radius, marginBottom: 5, border: `1px solid ${T.border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <info.Icon size={13} color={info.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{item.servicoNome || info.label}</div>
                  {item.funcionaria && <div style={{ fontSize: 11, color: T.muted }}>com {item.funcionaria.usuario?.nome}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {item.servicoPreco != null && <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>R$ {Number(item.servicoPreco).toFixed(2).replace('.', ',')}</span>}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: isAtivo ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: isAtivo ? '#10B981' : '#d97706' }}>
                    {statusLabel[item.status] || item.status}
                  </span>
                  {['AGUARDANDO', 'PENDENTE_ACEITE'].includes(item.status) && <AtribuirBtn atendimentoId={item.id} tipoServico={item.tipoServico} funcionarias={estado.funcionarias} />}
                  {['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(item.status) && <FinalizarAdminBtn atendimentoId={item.id} onFinalizado={() => setMsg('Finalizado.')} />}
                </div>
              </div>
            ) : null;
          })}

          {msg && <div style={{ fontSize: 12, color: msg.includes('Err') ? '#ef4444' : '#10B981', marginBottom: 8 }}>{msg}</div>}

          {adicionando ? (
            <div style={{ marginTop: 8, padding: '10px', background: '#fff', borderRadius: T.radius, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 8, scrollbarWidth: 'none' }}>
                {CATEGORIAS_ORDEM.map(cat => {
                  const info = SERVICE_INFO[cat];
                  const ativo = cat === catAtiva;
                  return (
                    <button key={cat} onClick={() => setCatAtiva(cat)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 14, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, background: ativo ? info.darkBg : 'transparent', border: `1.5px solid ${ativo ? info.color + '60' : T.border}`, color: ativo ? info.color : T.muted }}>
                      <info.Icon size={10} /> {info.label}
                      {selecionados.filter(s => s.tipoServico === cat).length > 0 && <span style={{ fontSize: 8, fontWeight: 800, background: info.color, color: '#fff', width: 12, height: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selecionados.filter(s => s.tipoServico === cat).length}</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 8 }}>
                {CATALOG[catAtiva].grupos.map(grupo => (
                  <div key={grupo.nome}>
                    <div style={{ padding: '4px 8px 2px', fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', background: T.bg }}>{grupo.nome}</div>
                    {grupo.itens.map(item => {
                      const ja = nomesJa.includes(item.nome);
                      const sel = noSelecionados(item.nome);
                      const ci = SERVICE_INFO[catAtiva];
                      return (
                        <button key={item.nome} onClick={() => !ja && toggleSel(catAtiva, item.nome, item.preco)} disabled={ja} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', background: sel ? ci.darkBg : 'transparent', border: 'none', cursor: ja ? 'not-allowed' : 'pointer', opacity: ja ? 0.4 : 1 }}>
                          <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${sel ? ci.color : T.border}`, background: sel ? ci.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <Check size={8} color="#fff" />}
                          </div>
                          <span style={{ flex: 1, fontSize: 11, color: sel ? ci.color : T.fg }}>{item.nome}</span>
                          <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>R$ {item.preco}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleAdicionar} disabled={loading || !selecionados.length} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, background: selecionados.length ? T.primary : T.bg, color: selecionados.length ? '#000' : T.muted, fontSize: 12, fontWeight: 600, border: 'none', cursor: selecionados.length ? 'pointer' : 'not-allowed' }}>
                  {loading ? <Loader2 size={11} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={11} />} Confirmar {selecionados.length > 0 && `(${selecionados.length})`}
                </button>
                <button onClick={() => { setAdicionando(false); setSelecionados([]); }} style={{ padding: '5px 10px', borderRadius: 6, background: T.bg, color: T.muted, fontSize: 12, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdicionando(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontWeight: 500 }}>
              <Plus size={13} /> Adicionar serviço
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Filas Ativas expandível ────────────────────────────────────────────────
function FilasAtivasCard({ atendimentos, totalAguardando, totalAtendendo }) {
  const T = useT();
  const [expandido, setExpandido] = useState({});
  const toggle = (s) => setExpandido(p => ({ ...p, [s]: !p[s] }));

  return (
    <Card style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>Filas Ativas</div>
        <span style={{ fontSize: 11, color: T.primary, background: 'rgba(245,158,11,.1)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
          {totalAguardando + totalAtendendo} total
        </span>
      </div>
      <div>
        {SERVICES.map(s => {
          const info  = SERVICE_INFO[s];
          const itens = atendimentos.filter(a => a.tipoServico === s && ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(a.status));
          if (!itens.length) return null;
          const isExp = expandido[s];

          // Agrupa por cliente
          const porCliente = new Map();
          itens.forEach(a => {
            if (!porCliente.has(a.clienteId)) porCliente.set(a.clienteId, { ...a, qtd: 1 });
            else porCliente.get(a.clienteId).qtd++;
          });
          const clientes = [...porCliente.values()];
          const nEsp = itens.filter(i => ['AGUARDANDO', 'PENDENTE_ACEITE'].includes(i.status)).length;
          const nAt  = itens.filter(i => i.status === 'EM_ATENDIMENTO').length;

          return (
            <div key={s}>
              {/* Linha de serviço clicável */}
              <div onClick={() => toggle(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', cursor: 'pointer', background: isExp ? T.bg : 'transparent', borderBottom: `1px solid ${T.border}`, transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <info.Icon size={14} color={info.color} />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.fg }}>{info.label}</span>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {nEsp > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: 'rgba(217,119,6,.1)', padding: '2px 8px', borderRadius: 10 }}>{nEsp} esp.</span>}
                  {nAt  > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.1)', padding: '2px 8px', borderRadius: 10 }}>{nAt} at.</span>}
                  {isExp ? <ChevronUp size={13} color={T.muted} /> : <ChevronDown size={13} color={T.muted} />}
                </div>
              </div>

              {/* Clientes expandidos */}
              {isExp && (
                <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {clientes.map((a, idx) => {
                    const isAtivo = a.status === 'EM_ATENDIMENTO';
                    const func    = a.funcionaria;
                    return (
                      <div key={a.clienteId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px 8px 32px', borderBottom: idx < clientes.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        {/* Posição */}
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: isAtivo ? 'rgba(16,185,129,.15)' : 'rgba(217,119,6,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: isAtivo ? '#10B981' : '#d97706', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        {/* Avatar */}
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${info.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: info.color, flexShrink: 0 }}>
                          {a.cliente?.nome?.[0]?.toUpperCase()}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.cliente?.nome}
                            {a.qtd > 1 && <span style={{ fontSize: 10, color: info.color, marginLeft: 6 }}>{a.qtd} serviços</span>}
                          </div>
                          <div style={{ fontSize: 10, color: T.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.servicoNome || info.label}
                            {func && <span style={{ color: '#10B981' }}> · {func.usuario?.nome}</span>}
                          </div>
                        </div>
                        {/* Status + tempo */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: isAtivo ? 'rgba(16,185,129,.1)' : 'rgba(217,119,6,.1)', color: isAtivo ? '#10B981' : '#d97706' }}>
                            {isAtivo ? 'Atendendo' : 'Aguardando'}
                          </span>
                          <span style={{ fontSize: 10, color: T.muted }}>{tempoEspera(isAtivo ? (a.iniciadoEm || a.createdAt) : a.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {totalAguardando + totalAtendendo === 0 && (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma fila ativa no momento</div>
        )}
      </div>
    </Card>
  );
}

// ── Equipe com lista individual ────────────────────────────────────────────
function EquipeCard({ funcionarias, atendimentos }) {
  const T = useT();
  const atendendo   = funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const disponiveis = funcionarias.filter(f => f.status === 'ONLINE');
  const ausentes    = funcionarias.filter(f => f.status === 'AUSENTE');
  const offline     = funcionarias.filter(f => f.status === 'OFFLINE');

  const SC = { ONLINE: '#10B981', EM_ATENDIMENTO: '#f59e0b', AUSENTE: '#d97706', OFFLINE: '#9ca3af' };

  function FuncRow({ f }) {
    const atend   = atendimentos.find(a => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
    const svcInfo = atend ? SERVICE_INFO[atend.tipoServico] : null;
    const sc      = SC[f.status] || '#9ca3af';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', transition: 'background .12s' }}
        onMouseEnter={e => e.currentTarget.style.background = T.bg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${sc}18`, border: `2px solid ${sc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: sc }}>
            {f.usuario?.nome?.[0]?.toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: sc, border: '1.5px solid #fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: f.status === 'OFFLINE' ? T.muted : T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.usuario?.nome}
          </div>
          <div style={{ fontSize: 10, color: svcInfo?.color || sc, marginTop: 1 }}>
            {svcInfo ? svcInfo.label : (f.status === 'ONLINE' ? 'Disponível' : f.status === 'AUSENTE' ? 'Ausente' : f.status === 'EM_ATENDIMENTO' ? 'Em atendimento' : 'Offline')}
          </div>
        </div>
        {atend && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,.1)', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
            {tempoAtend(atend.iniciadoEm || atend.createdAt)}
          </span>
        )}
      </div>
    );
  }

  const secoes = [
    { label: 'ATENDENDO AGORA', list: atendendo,   color: '#f59e0b' },
    { label: 'DISPONÍVEIS',     list: disponiveis, color: '#10B981' },
    { label: 'AUSENTES',        list: ausentes,    color: '#d97706' },
    { label: 'OFFLINE',         list: offline,     color: '#9ca3af' },
  ].filter(s => s.list.length > 0);

  return (
    <Card style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>Equipe</div>
        <span style={{ fontSize: 11, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, padding: '2px 8px', borderRadius: 10 }}>{funcionarias.length} funcionárias</span>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 310, scrollbarWidth: 'thin' }}>
        {secoes.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma funcionária cadastrada</div>
        ) : (
          secoes.map(({ label, list, color }) => (
            <div key={label}>
              <div style={{ padding: '6px 16px 4px', fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.8px', background: `${color}08`, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                {label} · {list.length}
              </div>
              {list.map(f => <FuncRow key={f.id} f={f} />)}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function agruparComandas(atendimentos) {
  const g = {};
  atendimentos.filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO', 'PENDENTE_ACEITE'].includes(a.status)).forEach(a => {
    if (!g[a.numeroComanda]) g[a.numeroComanda] = { numero: a.numeroComanda, cliente: a.cliente, clienteId: a.clienteId, criadoEm: a.createdAt, itens: [] };
    g[a.numeroComanda].itens.push(a);
  });
  return Object.values(g).sort((a, b) => a.numero - b.numero);
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function DashboardTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const T           = useT();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const aguardando    = estado.atendimentos.filter(a => a.status === 'AGUARDANDO');
  const emAndamento   = estado.atendimentos.filter(a => a.status === 'EM_ATENDIMENTO');
  const finalizados   = estado.atendimentos.filter(a => a.status === 'FINALIZADO' && new Date(a.createdAt) >= hoje);
  const disponiveis   = estado.funcionarias.filter(f => f.status === 'ONLINE');
  const ocupadas      = estado.funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const ausentes      = estado.funcionarias.filter(f => f.status === 'AUSENTE');
  const offline       = estado.funcionarias.filter(f => f.status === 'OFFLINE');
  const comandas      = agruparComandas(estado.atendimentos);
  const faturamento   = finalizados.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  // Sparkline faturamento (8 slots de 2h)
  const slots      = [8, 10, 12, 14, 16, 18, 20, 22];
  const sparkData  = slots.map(h => finalizados.filter(a => { const hr = new Date(a.createdAt).getHours(); return hr >= h && hr < h + 2; }).reduce((s, a) => s + (a.servicoPreco || 0), 0));

  // Bar chart: atendimentos por hora (últimas 8h)
  const horaAtual = new Date().getHours();
  const barData = Array.from({ length: 8 }, (_, i) => {
    const h = (horaAtual - 7 + i + 24) % 24;
    const cnt = estado.atendimentos.filter(a => {
      const ah = new Date(a.createdAt).getHours();
      return ah === h && new Date(a.createdAt) >= hoje;
    }).length;
    return { label: `${h}h`, valor: cnt, destaque: h === horaAtual };
  });

  // Por serviço stats
  const porServico = SERVICES.map(s => ({
    key: s,
    info: SERVICE_INFO[s],
    count: estado.atendimentos.filter(a => a.tipoServico === s && ['AGUARDANDO', 'EM_ATENDIMENTO', 'PENDENTE_ACEITE'].includes(a.status)).length,
  })).filter(s => s.count > 0);
  const totalServicos = porServico.reduce((s, i) => s + i.count, 0) || 1;

  return (
    <div style={{ padding: 24, fontFamily: T.font }}>

      {/* ── LINHA 1: Hero + Movimento + Equipe ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>

        {/* Hero: Faturamento */}
        <Card style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 20px 12px', flex: 1 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Faturamento do Dia</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: T.fg, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
              {fmt(faturamento)}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
              {finalizados.length > 0 ? `+${finalizados.length} serviço${finalizados.length !== 1 ? 's' : ''} hoje` : 'Nenhum serviço finalizado ainda'}
            </div>
            {/* Mini métricas */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Aguardando', valor: aguardando.length, color: '#d97706', bg: 'rgba(217,119,6,.1)' },
                { label: 'Atendendo',  valor: emAndamento.length, color: '#10B981', bg: 'rgba(16,185,129,.1)' },
                { label: 'Concluídos', valor: finalizados.length,  color: T.primary, bg: 'rgba(245,158,11,.1)' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: m.bg, borderRadius: T.radius, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.valor}</div>
                  <div style={{ fontSize: 10, color: m.color, marginTop: 3, opacity: 0.8 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <Sparkline data={sparkData} height={70} />
        </Card>

        <FilasAtivasCard
          atendimentos={estado.atendimentos}
          totalAguardando={aguardando.length}
          totalAtendendo={emAndamento.length}
        />

        <EquipeCard
          funcionarias={estado.funcionarias}
          atendimentos={estado.atendimentos}
        />
      </div>

      {/* ── LINHA 2: Bar Chart + Breakdown por serviço ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Bar Chart: Atendimentos por hora */}
        <Card>
          <div style={{ padding: '16px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>Atendimentos por Hora</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Últimas 8 horas · Hoje</div>
            </div>
            <span style={{ fontSize: 12, color: T.primary, background: 'rgba(245,158,11,.1)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Hoje</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <BarChart data={barData} height={130} />
          </div>
        </Card>

        {/* Breakdown por serviço */}
        <Card>
          <div style={{ padding: '16px 20px 10px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>Por Serviço</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Ativos agora</div>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {porServico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13 }}>Nenhum serviço ativo</div>
            ) : (
              porServico.map(({ key, info, count }) => {
                const pct = Math.round((count / totalServicos) * 100);
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <info.Icon size={13} color={info.color} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: T.fg }}>{info.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: T.muted }}>{count}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: info.color }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: info.darkBg, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: info.color, borderRadius: 3, transition: 'width .4s' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ── LINHA 3: Comandas Ativas (tabela) ── */}
      <Card>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>Comandas Ativas</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{comandas.length} comanda{comandas.length !== 1 ? 's' : ''} em aberto</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, padding: '3px 10px', borderRadius: 20 }}>Hoje</span>
          </div>
        </div>

        {/* Header da tabela */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 120px 80px 130px', gap: 12, padding: '8px 20px', background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {['Cliente', 'Serviços', 'Tempo', 'Total', 'Status'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {/* Linhas */}
        <div style={{ padding: '4px 0' }}>
          {comandas.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma comanda ativa no momento</div>
          ) : (
            comandas.slice(0, 8).map(grupo => (
              <ComandaRow key={grupo.numero} grupo={grupo} estado={estado} />
            ))
          )}
          {comandas.length > 8 && (
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 4, borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: T.primary, fontWeight: 500 }}>Ver todas as comandas</span>
              <ArrowRight size={13} color={T.primary} />
            </div>
          )}
        </div>
      </Card>

      <style>{`
        @media (max-width: 1100px) {
          .db-row1 { grid-template-columns: 1fr 1fr !important; }
          .db-row2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .db-row1 { grid-template-columns: 1fr !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
