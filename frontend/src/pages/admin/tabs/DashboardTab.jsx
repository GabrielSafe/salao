import { useState, useCallback } from 'react';
import {
  DollarSign, Clock, Users, TrendingUp, AlertTriangle, CheckCircle2,
  AlertCircle, Scissors, Sparkles, Hand, Leaf, Eye,
  ChevronDown, ChevronUp, Plus, Check, X, Loader2, ArrowRight,
  ShieldCheck, UserCheck, MoreVertical, Timer, Zap
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';
import api from '../../../services/api';
import { CATALOG, CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

// ── Tema ──────────────────────────────────────────────────────────────────
function buildT(isDark) {
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', hover: '#333333',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
    radius: '0.375rem', font: "'Inter', sans-serif",
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', hover: '#f9fafb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
    radius: '0.375rem', font: "'Inter', sans-serif",
  };
}
function useT() { const { isDark } = useThemeCtx(); return buildT(isDark); }

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      short: 'Cabelo',   Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', darkBg: 'rgba(168,85,247,.1)' },
  MAQUIAGEM:   { label: 'Maquiagem',   short: 'Maquiagem',Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', darkBg: 'rgba(236,72,153,.1)' },
  MAO:         { label: 'Mão',         short: 'Mão',      Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  darkBg: 'rgba(251,146,60,.1)'  },
  PE:          { label: 'Pé',          short: 'Pé',       Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   darkBg: 'rgba(34,197,94,.1)'   },
  SOBRANCELHA: { label: 'Sobrancelha', short: 'Sobrancelha',Icon: Eye,   color: '#38BDF8', bg: 'rgba(56,189,248,.15)',  darkBg: 'rgba(56,189,248,.1)'  },
};
const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];

const fmt    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtMin = (m) => m == null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m/60)}h${m%60>0?` ${m%60}min`:''}`;
const elapsed = (d) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m <= 0 ? '<1 min' : fmtMin(m); };
const avgWait = (arr) => arr.length ? Math.round(arr.reduce((s,a) => s + (Date.now() - new Date(a.createdAt))/60000, 0) / arr.length) : 0;

// ── Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#f59e0b', height = 56 }) {
  const W = 300;
  if (!data || data.length < 2) return <div style={{ height }} />;
  const temDados = data.some(v => v > 0);
  if (!temDados) {
    const y = height * 0.6;
    const pts = data.map((_, i) => [6 + (i / (data.length-1)) * (W-12), y]);
    const line = pts.map(([x,y], i) => `${i===0?'M':'L'} ${x} ${y}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.25" strokeLinecap="round" />
      </svg>
    );
  }
  const max = Math.max(...data); const pad = 6;
  const pts = data.map((v, i) => [pad + (i/(data.length-1))*(W-pad*2), pad + ((max-v)/max)*(height-pad*2)]);
  const line = pts.map(([x,y], i) => `${i===0?'M':'L'} ${x} ${y}`).join(' ');
  const area = `${line} L ${pts[pts.length-1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${color.replace('#','')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x,y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} />)}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, valor, sub, subColor, Icon, gradient, sparkColor, sparkData }) {
  const T = useT();
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: T.font }}>
      <div style={{ padding: '16px 20px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${sparkColor}40` }}>
            <Icon size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: T.fg, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>{valor}</div>
        <div style={{ fontSize: 12, color: subColor || T.muted }}>{sub}</div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <Sparkline data={sparkData} color={sparkColor} height={56} />
      </div>
    </div>
  );
}

// ── Alertas bar ───────────────────────────────────────────────────────────
function AlertasBar({ alertas }) {
  const T = useT();
  const cfg = {
    error:   { color: '#ef4444', bg: 'rgba(239,68,68,.08)',   border: 'rgba(239,68,68,.2)',   Icon: AlertCircle },
    warn:    { color: '#f59e0b', bg: 'rgba(245,158,11,.08)',  border: 'rgba(245,158,11,.2)',  Icon: AlertTriangle },
    success: { color: '#10b981', bg: 'rgba(16,185,129,.08)',  border: 'rgba(16,185,129,.2)',  Icon: CheckCircle2 },
  };
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, padding: '12px 20px', fontFamily: T.font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.fg, flexShrink: 0 }}>Alertas importantes</span>
        <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {alertas.map((a, i) => {
            const c = cfg[a.type] || cfg.success;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
                <c.Icon size={14} color={c.color} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{a.titulo}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{a.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button style={{ fontSize: 12, fontWeight: 600, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>Ver todos →</button>
      </div>
    </div>
  );
}

// ── Filas por serviço ─────────────────────────────────────────────────────
function FilasTable({ atendimentos, aguardando, emAndamento }) {
  const T = useT();
  const th = { fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '8px 14px' };
  const rows = SERVICES.map(s => {
    const info = SERVICE_INFO[s];
    const ag = aguardando.filter(a => a.tipoServico === s);
    const em = emAndamento.filter(a => a.tipoServico === s);
    const avg = ag.length ? avgWait(ag) : null;
    return { s, info, ag: ag.length, em: em.length, avg };
  }).filter(r => r.ag + r.em > 0);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden', fontFamily: T.font }}>
      <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>Filas por serviço</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg2 }}>
            <th style={{ ...th, textAlign: 'left' }}>Serviço</th>
            <th style={{ ...th, textAlign: 'center' }}>Aguardando</th>
            <th style={{ ...th, textAlign: 'center' }}>Em atendimento</th>
            <th style={{ ...th, textAlign: 'center' }}>Tempo médio</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma fila ativa</td></tr>
          ) : rows.map(({ s, info, ag, em, avg }) => (
            <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = T.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={13} color={info.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{info.label}</span>
                </div>
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                {ag > 0 ? <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,.1)', padding: '2px 10px', borderRadius: 20 }}>{ag} {ag === 1 ? 'pessoa' : 'pessoas'}</span> : <span style={{ color: T.sub, fontSize: 12 }}>—</span>}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                {em > 0 ? <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,.1)', padding: '2px 10px', borderRadius: 20 }}>{em} atendendo</span> : <span style={{ color: T.sub, fontSize: 12 }}>—</span>}
              </td>
              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                {avg != null ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: avg > 15 ? '#ef4444' : avg > 8 ? '#f59e0b' : '#10b981', background: avg > 15 ? 'rgba(239,68,68,.1)' : avg > 8 ? 'rgba(245,158,11,.1)' : 'rgba(16,185,129,.1)', padding: '2px 10px', borderRadius: 20 }}>
                    ⏱ {avg} min
                  </span>
                ) : <span style={{ color: T.sub, fontSize: 12 }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '10px 20px', borderTop: rows.length > 0 ? `1px solid ${T.border}` : 'none' }}>
        <button style={{ fontSize: 12, fontWeight: 500, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver fila completa <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Equipe table ──────────────────────────────────────────────────────────
function EquipeTable({ funcionarias, atendimentos, finalizados }) {
  const T = useT();
  const th = { fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '8px 14px' };

  const maxAt = Math.max(1, ...funcionarias.map(f => finalizados.filter(a => a.funcionariaId === f.id).length));
  const getOcupacao = (f) => {
    const count = finalizados.filter(a => a.funcionariaId === f.id).length;
    return Math.min(100, Math.round((count / maxAt) * 70 + (f.status === 'EM_ATENDIMENTO' ? 30 : 0)));
  };

  const SC = { ONLINE: '#10b981', EM_ATENDIMENTO: '#f59e0b', AUSENTE: '#d97706', OFFLINE: '#6b7280' };
  const SL = { ONLINE: 'Disponível', EM_ATENDIMENTO: 'Atendendo', AUSENTE: 'Ausente', OFFLINE: 'Offline' };

  const sorted = [...funcionarias].sort((a, b) => {
    const order = { EM_ATENDIMENTO: 0, ONLINE: 1, AUSENTE: 2, OFFLINE: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden', fontFamily: T.font }}>
      <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>Equipe</span>
        <button style={{ fontSize: 12, fontWeight: 500, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver toda equipe <ArrowRight size={13} />
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg2 }}>
            <th style={{ ...th, textAlign: 'left' }}>Funcionária</th>
            <th style={{ ...th, textAlign: 'left' }}>Status</th>
            <th style={{ ...th, textAlign: 'left' }}>Atendimento atual</th>
            <th style={{ ...th, textAlign: 'right', paddingRight: 20 }}>Ocupação</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma funcionária cadastrada</td></tr>
          ) : sorted.map(f => {
            const atend = atendimentos.find(a => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
            const svcInfo = atend ? SERVICE_INFO[atend.tipoServico] : null;
            const sc = SC[f.status] || '#6b7280';
            const occ = getOcupacao(f);
            return (
              <tr key={f.id} style={{ borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Funcionária */}
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${sc}18`, border: `2px solid ${sc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: sc }}>
                        {f.usuario?.nome?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: sc, border: `1.5px solid ${T.card}` }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{f.usuario?.nome}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        {f.especialidades?.slice(0,2).map(e => SERVICE_INFO[e]?.label).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Status */}
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: sc, background: `${sc}15`, padding: '3px 10px', borderRadius: 20 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                    {SL[f.status] || f.status}
                  </span>
                </td>
                {/* Atendimento atual */}
                <td style={{ padding: '10px 14px' }}>
                  {atend ? (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>
                        Cliente: {atend.cliente?.nome?.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: 11, color: svcInfo?.color || T.muted, marginTop: 1 }}>
                        {atend.servicoNome || svcInfo?.label}
                        {atend.iniciadoEm && <span style={{ color: T.muted }}> · {elapsed(atend.iniciadoEm)}</span>}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: T.muted }}>
                      {f.status === 'ONLINE' ? 'Aguardando próximo' : f.status === 'AUSENTE' ? 'Ausente' : '—'}
                    </span>
                  )}
                </td>
                {/* Ocupação */}
                <td style={{ padding: '10px 20px 10px 14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: occ > 70 ? '#10b981' : occ > 30 ? '#f59e0b' : T.muted, marginBottom: 4 }}>{occ}%</div>
                    <div style={{ width: 80, height: 4, background: T.bg2, borderRadius: 2, marginLeft: 'auto' }}>
                      <div style={{ width: `${occ}%`, height: '100%', borderRadius: 2, background: occ > 70 ? '#10b981' : occ > 30 ? '#f59e0b' : T.sub, transition: 'width .4s' }} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Gargalo + Tempo médio ─────────────────────────────────────────────────
function RightCards({ atendimentos, aguardando, finalizados }) {
  const T = useT();

  // Gargalo: serviço com mais aguardando
  const gargaloData = SERVICES.map(s => ({
    s, info: SERVICE_INFO[s],
    count: aguardando.filter(a => a.tipoServico === s).length,
    avg: avgWait(aguardando.filter(a => a.tipoServico === s)),
  })).sort((a, b) => b.count - a.count)[0];
  const temGargalo = gargaloData?.count > 0;

  // Tempo médio por serviço (finalizados hoje)
  const tempoMedio = SERVICES.map(s => {
    const f = finalizados.filter(a => a.tipoServico === s && a.iniciadoEm && a.finalizadoEm);
    const avg = f.length ? Math.round(f.reduce((sum, a) => sum + (new Date(a.finalizadoEm) - new Date(a.iniciadoEm)) / 60000, 0) / f.length) : null;
    return { s, info: SERVICE_INFO[s], avg };
  }).filter(r => r.avg !== null);
  const maxAvg = Math.max(1, ...tempoMedio.map(r => r.avg));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Gargalo atual */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, padding: '16px 18px', fontFamily: T.font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={14} color="#ef4444" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>Gargalo atual</span>
        </div>
        {temGargalo ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: gargaloData.info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <gargaloData.info.Icon size={15} color={gargaloData.info.color} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{gargaloData.info.label}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{gargaloData.count} pessoas na fila</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: T.muted }}>Tempo médio</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>{gargaloData.avg} min</div>
              </div>
            </div>
            <div style={{ height: 4, background: T.bg2, borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #ef4444, #f59e0b)', width: `${Math.min(100, gargaloData.count * 20)}%`, transition: 'width .4s' }} />
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0', color: T.muted, fontSize: 13 }}>
            <CheckCircle2 size={20} color="#10b981" style={{ marginBottom: 4, display: 'block', margin: '0 auto 6px' }} />
            Sem gargalos no momento
          </div>
        )}
      </div>

      {/* Tempo médio por serviço */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, padding: '16px 18px', fontFamily: T.font, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>Tempo médio por serviço</span>
          <span style={{ fontSize: 11, color: T.muted, background: T.bg2, border: `1px solid ${T.border}`, padding: '2px 8px', borderRadius: 10 }}>Hoje</span>
        </div>
        {tempoMedio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px 0', color: T.muted, fontSize: 13 }}>Sem dados hoje</div>
        ) : tempoMedio.map(({ s, info, avg }) => (
          <div key={s} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <info.Icon size={12} color={info.color} />
                <span style={{ fontSize: 12, color: T.fg }}>{info.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{avg} min</span>
            </div>
            <div style={{ height: 4, background: T.bg2, borderRadius: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, background: info.color, width: `${(avg/maxAvg)*100}%`, transition: 'width .4s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comandas table ────────────────────────────────────────────────────────
function FinalizarAdminBtn({ atendimentoId, onFinalizado }) {
  const T = useT();
  const [loading, setLoading] = useState(false);
  const [conf, setConf] = useState(false);
  async function ok() {
    if (!conf) { setConf(true); return; }
    setLoading(true);
    try { await api.patch(`/atendimentos/${atendimentoId}/finalizar-admin`); onFinalizado?.(); }
    catch {} finally { setLoading(false); setConf(false); }
  }
  return conf ? (
    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={ok} disabled={loading} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
        {loading ? '...' : 'Confirmar'}
      </button>
      <button onClick={() => setConf(false)} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: T.bg2, color: T.muted, border: 'none', cursor: 'pointer' }}>Não</button>
    </div>
  ) : (
    <button onClick={ok} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
      <ShieldCheck size={10} /> Finalizar
    </button>
  );
}

function AtribuirBtn({ atendimentoId, tipoServico, funcionarias }) {
  const T = useT();
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(null);
  const SC = { ONLINE: '#10b981', AUSENTE: '#d97706', EM_ATENDIMENTO: '#f59e0b' };
  const cands = funcionarias.filter(f => (f.especialidades?.includes(tipoServico) || f.multiTarefas) && ['ONLINE','AUSENTE','EM_ATENDIMENTO'].includes(f.status));
  async function atribuir(fid) {
    setLoading(fid);
    try { await api.patch(`/atendimentos/${atendimentoId}/atribuir`, { funcionariaId: fid }); setAberto(false); }
    catch {} finally { setLoading(null); }
  }
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setAberto(!aberto)} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(96,165,250,.08)', color: '#60A5FA', border: '1px solid rgba(96,165,250,.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        <UserCheck size={10} /> Atribuir
      </button>
      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, zIndex: 50, overflow: 'hidden', boxShadow: T.shadow, minWidth: 160 }}>
          {cands.length === 0 ? <div style={{ padding: '10px 12px', fontSize: 12, color: T.muted }}>Nenhuma disponível</div>
            : cands.map(f => (
              <button key={f.id} onClick={() => atribuir(f.id)} disabled={!!loading} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.hover} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${SC[f.status]||'#9ca3af'}18`, border: `1.5px solid ${SC[f.status]||'#9ca3af'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: SC[f.status]||'#9ca3af', flexShrink: 0 }}>
                  {f.usuario?.nome?.[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: T.fg }}>{f.usuario?.nome}</span>
                {loading === f.id && <Loader2 size={11} style={{ animation: 'spin .7s linear infinite' }} />}
              </button>
            ))}
          <button onClick={() => setAberto(false)} style={{ width: '100%', padding: '6px', background: T.bg2, border: 'none', cursor: 'pointer', fontSize: 11, color: T.muted }}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

function ComandasTable({ comandas, estado }) {
  const T = useT();
  const [expandido, setExpandido] = useState(null);
  const th = { fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', padding: '8px 14px' };

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden', fontFamily: T.font }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>Comandas ativas</span>
          <span style={{ fontSize: 12, color: T.muted, marginLeft: 10 }}>{comandas.length} comanda{comandas.length !== 1 ? 's' : ''} em andamento</span>
        </div>
        <button style={{ fontSize: 12, fontWeight: 500, color: T.primary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver todas <ArrowRight size={13} />
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg2 }}>
            <th style={{ ...th, textAlign: 'left' }}>Cliente</th>
            <th style={{ ...th, textAlign: 'left' }}>Serviços</th>
            <th style={{ ...th, textAlign: 'center' }}>Tempo de espera</th>
            <th style={{ ...th, textAlign: 'center' }}>Tempo total</th>
            <th style={{ ...th, textAlign: 'right' }}>Valor</th>
            <th style={{ ...th, textAlign: 'center' }}>Status</th>
            <th style={{ ...th, width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {comandas.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma comanda ativa no momento</td></tr>
          ) : comandas.map(g => {
            const isExp = expandido === g.numero;
            const ativos = g.itens.filter(i => i.status === 'EM_ATENDIMENTO').length;
            const total = g.itens.reduce((s, i) => s + (i.servicoPreco || 0), 0);
            const tempoEspera = elapsed(g.criadoEm);
            return (
              <>
                <tr key={g.numero} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                  onClick={() => setExpandido(isExp ? null : g.numero)}
                  onMouseEnter={e => e.currentTarget.style.background = T.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Cliente */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                        {g.cliente?.nome?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>
                          <span style={{ color: T.primary, marginRight: 5 }}>#{g.numero}</span>
                          {g.cliente?.nome}
                        </div>
                        <div style={{ fontSize: 11, color: T.muted }}>{g.itens.length} serviço{g.itens.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </td>
                  {/* Serviços */}
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {g.itens.slice(0, 3).map(item => {
                        const info = SERVICE_INFO[item.tipoServico];
                        return info ? (
                          <span key={item.id} style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: info.darkBg, color: info.color, whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
                            {item.servicoNome || info.label}
                          </span>
                        ) : null;
                      })}
                      {g.itens.length > 3 && <span style={{ fontSize: 10, color: T.muted }}>+{g.itens.length - 3}</span>}
                    </div>
                  </td>
                  {/* Tempo espera */}
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{tempoEspera}</span>
                  </td>
                  {/* Tempo total */}
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Timer size={11} /> {elapsed(g.criadoEm)}
                    </span>
                  </td>
                  {/* Valor */}
                  <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{fmt(total)}</span>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ativos > 0 ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: ativos > 0 ? '#10b981' : '#d97706', whiteSpace: 'nowrap' }}>
                      {ativos > 0 ? 'Em atendimento' : 'Aguardando'}
                    </span>
                  </td>
                  {/* Actions toggle */}
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    {isExp ? <ChevronUp size={14} color={T.muted} /> : <ChevronDown size={14} color={T.muted} />}
                  </td>
                </tr>

                {/* Expandido: detalhes dos serviços */}
                {isExp && (
                  <tr key={`exp-${g.numero}`} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td colSpan={7} style={{ padding: '0 14px 12px', background: T.bg2 }}>
                      <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {g.itens.map(item => {
                          const info = SERVICE_INFO[item.tipoServico];
                          const isAtivo = item.status === 'EM_ATENDIMENTO';
                          return info ? (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: T.card, borderRadius: 8, border: `1px solid ${T.border}` }}>
                              <div style={{ width: 26, height: 26, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <info.Icon size={12} color={info.color} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: T.fg }}>{item.servicoNome || info.label}</div>
                                {item.funcionaria && <div style={{ fontSize: 11, color: T.muted }}>com {item.funcionaria.usuario?.nome}</div>}
                              </div>
                              {item.servicoPreco != null && <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>R$ {Number(item.servicoPreco).toFixed(2).replace('.', ',')}</span>}
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: isAtivo ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)', color: isAtivo ? '#10b981' : '#d97706' }}>
                                {isAtivo ? 'Ativo' : 'Fila'}
                              </span>
                              {['AGUARDANDO','PENDENTE_ACEITE'].includes(item.status) && <AtribuirBtn atendimentoId={item.id} tipoServico={item.tipoServico} funcionarias={estado.funcionarias} />}
                              {['AGUARDANDO','PENDENTE_ACEITE','EM_ATENDIMENTO'].includes(item.status) && <FinalizarAdminBtn atendimentoId={item.id} />}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function agruparComandas(atendimentos) {
  const g = {};
  atendimentos.filter(a => ['AGUARDANDO','EM_ATENDIMENTO','PENDENTE_ACEITE'].includes(a.status)).forEach(a => {
    if (!g[a.numeroComanda]) g[a.numeroComanda] = { numero: a.numeroComanda, cliente: a.cliente, clienteId: a.clienteId, criadoEm: a.createdAt, itens: [] };
    g[a.numeroComanda].itens.push(a);
  });
  return Object.values(g).sort((a, b) => a.numero - b.numero);
}

// ── Dashboard principal ────────────────────────────────────────────────────
export default function DashboardTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const T = useT();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const aguardando  = estado.atendimentos.filter(a => a.status === 'AGUARDANDO');
  const emAndamento = estado.atendimentos.filter(a => a.status === 'EM_ATENDIMENTO');
  const finalizados = estado.atendimentos.filter(a => a.status === 'FINALIZADO' && new Date(a.createdAt) >= hoje);
  const disponiveis = estado.funcionarias.filter(f => f.status === 'ONLINE');
  const ocupadas    = estado.funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const comandas    = agruparComandas(estado.atendimentos);

  const faturamento = finalizados.reduce((s, a) => s + (a.servicoPreco || 0), 0);
  const tempoMedioEsperaVal = avgWait(aguardando);
  const clientesAtivos = new Set(estado.atendimentos.filter(a => ['AGUARDANDO','EM_ATENDIMENTO','PENDENTE_ACEITE'].includes(a.status)).map(a => a.clienteId)).size;
  const capacidade = estado.funcionarias.length > 0 ? Math.round((ocupadas.length / estado.funcionarias.length) * 100) : 0;
  const capLabel = capacidade >= 80 ? 'Ótimo nível de utilização' : capacidade >= 50 ? 'Bom nível de utilização' : capacidade > 0 ? 'Equipe disponível' : 'Equipe offline';

  // Sparklines (8 slots de 2h: 8h a 22h)
  const slots = [8, 10, 12, 14, 16, 18, 20, 22];
  const spFat  = slots.map(h => finalizados.filter(a => { const hr = new Date(a.createdAt).getHours(); return hr >= h && hr < h + 2; }).reduce((s, a) => s + (a.servicoPreco || 0), 0));
  const spEsp  = slots.map(h => aguardando.filter(a => { const hr = new Date(a.createdAt).getHours(); return hr >= h && hr < h + 2; }).length);
  const spCli  = slots.map(h => { const s = new Set(estado.atendimentos.filter(a => { const hr = new Date(a.createdAt).getHours(); return hr >= h && hr < h + 2 && new Date(a.createdAt) >= hoje; }).map(a => a.clienteId)); return s.size; });
  const spCap  = slots.map(h => estado.atendimentos.filter(a => { const hr = a.iniciadoEm ? new Date(a.iniciadoEm).getHours() : -1; return hr >= h && hr < h + 2 && new Date(a.createdAt) >= hoje; }).length);

  // Alertas
  const alertas = [];
  const longWait = new Set(aguardando.filter(a => (Date.now() - new Date(a.createdAt)) / 60000 > 10).map(a => a.clienteId)).size;
  if (longWait > 0) alertas.push({ type: 'error', titulo: `${longWait} cliente${longWait > 1 ? 's' : ''} esperando há mais de 10 minutos`, sub: 'Atenção necessária' });
  SERVICES.forEach(s => {
    const ag = aguardando.filter(a => a.tipoServico === s);
    if (ag.length >= 3) alertas.push({ type: 'warn', titulo: `Gargalo em ${SERVICE_INFO[s].label}: ${ag.length} na fila`, sub: `Tempo médio: ${avgWait(ag)} min` });
  });
  if (alertas.length === 0) {
    if (disponiveis.length > 0) alertas.push({ type: 'success', titulo: 'Equipe equilibrada', sub: `${disponiveis.length} disponíve${disponiveis.length > 1 ? 'is' : 'l'} para atender` });
    else alertas.push({ type: 'success', titulo: 'Sistema funcionando normalmente', sub: 'Nenhum alerta ativo' });
  }

  return (
    <div style={{ padding: 24, fontFamily: T.font, background: T.bg, minHeight: '100%' }}>

      {/* ── ROW 1: 4 KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Faturamento do dia"
          valor={fmt(faturamento)}
          sub={finalizados.length > 0 ? `+${finalizados.length} serviços hoje` : 'Nenhum finalizado ainda'}
          subColor={finalizados.length > 0 ? '#10b981' : T.muted}
          Icon={DollarSign}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
          sparkColor="#f59e0b"
          sparkData={spFat}
        />
        <KpiCard
          label="Tempo médio de espera"
          valor={`${tempoMedioEsperaVal} min`}
          sub={aguardando.length > 0 ? `${aguardando.length} cliente${aguardando.length > 1 ? 's' : ''} aguardando` : 'Sem fila no momento'}
          subColor={tempoMedioEsperaVal > 15 ? '#ef4444' : tempoMedioEsperaVal > 8 ? '#f59e0b' : T.muted}
          Icon={Clock}
          gradient="linear-gradient(135deg, #ef4444, #f97316)"
          sparkColor="#ef4444"
          sparkData={spEsp}
        />
        <KpiCard
          label="Clientes ativos agora"
          valor={String(clientesAtivos)}
          sub={`${aguardando.length > 0 ? aguardando.length : 0} aguardando · ${emAndamento.length} em atendimento`}
          Icon={Users}
          gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          sparkColor="#8b5cf6"
          sparkData={spCli}
        />
        <KpiCard
          label="Capacidade do salão"
          valor={`${capacidade}%`}
          sub={capLabel}
          subColor={capacidade >= 80 ? '#10b981' : capacidade >= 50 ? '#f59e0b' : T.muted}
          Icon={TrendingUp}
          gradient="linear-gradient(135deg, #10b981, #059669)"
          sparkColor="#10b981"
          sparkData={spCap}
        />
      </div>

      {/* ── ROW 2: Alertas ── */}
      <div style={{ marginBottom: 14 }}>
        <AlertasBar alertas={alertas} />
      </div>

      {/* ── ROW 3: Filas | Equipe | Gargalo+Tempo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
        <FilasTable atendimentos={estado.atendimentos} aguardando={aguardando} emAndamento={emAndamento} />
        <EquipeTable funcionarias={estado.funcionarias} atendimentos={estado.atendimentos} finalizados={finalizados} />
        <RightCards atendimentos={estado.atendimentos} aguardando={aguardando} finalizados={finalizados} />
      </div>

      {/* ── ROW 4: Comandas ativas ── */}
      <ComandasTable comandas={comandas} estado={estado} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1200px) {
          .db-r1 { grid-template-columns: repeat(2, 1fr) !important; }
          .db-r3 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .db-r1 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
