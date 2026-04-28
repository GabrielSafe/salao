import { useState, useCallback } from 'react';
import {
  Clock, Zap, UserCheck, UserX, Scissors, Sparkles, Hand, Leaf, Eye,
  ChevronDown, ChevronUp, Plus, Check, X, Loader2, ArrowRight, TrendingUp, ShieldCheck, User
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';
import { CATALOG, CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', darkBg: 'rgba(168,85,247,.1)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', darkBg: 'rgba(236,72,153,.1)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  darkBg: 'rgba(251,146,60,.1)' },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   darkBg: 'rgba(34,197,94,.1)' },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.15)',  darkBg: 'rgba(56,189,248,.1)' },
};

const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];

function tempoEspera(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins <= 0) return '1 min';
  return `${mins} min`;
}

function tempoAtendimento(iniciadoEm, createdAt) {
  const ref = iniciadoEm || createdAt;
  const mins = Math.floor((Date.now() - new Date(ref).getTime()) / 60000);
  if (mins <= 0) return '1 min';
  return `${mins} min`;
}

function agruparComandas(atendimentos) {
  const grupos = {};
  atendimentos
    .filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status))
    .forEach(a => {
      if (!grupos[a.numeroComanda]) {
        grupos[a.numeroComanda] = {
          numero: a.numeroComanda,
          cliente: a.cliente,
          clienteId: a.clienteId,
          criadoEm: a.createdAt,
          itens: [],
        };
      }
      grupos[a.numeroComanda].itens.push(a);
    });
  return Object.values(grupos).sort((a, b) => a.numero - b.numero);
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────
function Sparkline({ data, color = '#f59e0b', width = 300, height = 80 }) {
  if (!data || data.length < 2) return <div style={{ height }} />;

  const temDados = data.some(v => v > 0);

  // Sem dados: mostra linha pontilhada suave no centro
  if (!temDados) {
    const y = height * 0.65;
    const pts = data.map((_, i) => [
      6 + (i / (data.length - 1)) * (width - 12), y
    ]);
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.35" strokeLinecap="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color} fillOpacity="0.3" />)}
      </svg>
    );
  }

  const max = Math.max(...data);
  const min = 0;
  const range = max - min || 1;
  const pad = 8;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (width - pad * 2),
    pad + ((max - v) / range) * (height - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spkGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" fill={color} />)}
    </svg>
  );
}

// ── Faturamento Card (estilo referência) ───────────────────────────────────
function FaturamentoCard({ atendimentos }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const finalizadosHoje = atendimentos.filter(a =>
    a.status === 'FINALIZADO' && a.servicoPreco != null && new Date(a.createdAt) >= hoje
  );

  const total = finalizadosHoje.reduce((s, a) => s + (a.servicoPreco || 0), 0);
  const totalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

  // Sparkline: 8 pontos por hora (horas 8h a 21h em blocos de 2h)
  const slots = [8, 10, 12, 14, 16, 18, 20, 22];
  const sparkData = slots.map(h => {
    return finalizadosHoje
      .filter(a => {
        const hr = new Date(a.createdAt).getHours();
        return hr >= h && hr < h + 2;
      })
      .reduce((s, a) => s + (a.servicoPreco || 0), 0);
  });

  const qtd = finalizadosHoje.length;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      boxShadow: '0px 4px 8px -1px rgba(0,0,0,.1)',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Poppins', sans-serif",
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 24px 12px', flex: 1 }}>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 10, fontWeight: 400, letterSpacing: '0em' }}>
          Faturamento do Dia
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: '#262626', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>
          {totalFmt}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {qtd > 0 ? `+${qtd} serviço${qtd !== 1 ? 's' : ''} hoje` : 'Nenhum serviço finalizado ainda'}
        </div>
      </div>
      <Sparkline data={sparkData} height={90} />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, valor, sub, Icon, color, bg, title }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      boxShadow: '0px 4px 8px -1px rgba(0,0,0,.1)',
      padding: '24px 24px 20px',
      fontFamily: 'Inter, sans-serif',
      transition: 'box-shadow .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0px 6px 16px -1px rgba(0,0,0,.13)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0px 4px 8px -1px rgba(0,0,0,.1)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 400 }}>{title}</div>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#262626', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>
        {valor}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{sub}</div>
    </div>
  );
}

// ── Coluna de fila por serviço ─────────────────────────────────────────────
function FilaColuna({ servico, atendimentos }) {
  const info = SERVICE_INFO[servico];
  const Icon = info.Icon;
  const todos = atendimentos.filter(a => a.status === 'AGUARDANDO' && a.tipoServico === servico);

  // Agrupa por cliente: 1 cliente = 1 posição na fila (pega o mais antigo como referência)
  const porCliente = new Map();
  todos.forEach(a => {
    if (!porCliente.has(a.clienteId)) {
      porCliente.set(a.clienteId, { ...a, qtdServicos: 1 });
    } else {
      porCliente.get(a.clienteId).qtdServicos++;
    }
  });
  const aguardando = [...porCliente.values()];

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '0.375rem',
      boxShadow: '0px 4px 8px -1px rgba(0,0,0,.1)',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Poppins', sans-serif",
      flex: 1, minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '0.375rem', background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={14} color={info.color} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#262626', letterSpacing: '0em' }}>{info.label}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: info.color, background: info.darkBg, padding: '2px 10px', borderRadius: 20 }}>
            {aguardando.length} aguardando
          </span>
        </div>
      </div>

      {/* Lista */}
      <div>
        {aguardando.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Fila vazia
          </div>
        ) : (
          aguardando.slice(0, 4).map((a, idx) => (
            <div key={a.clienteId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid #f3f4f6', transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.cliente?.nome}
                </div>
                {a.qtdServicos > 1 && (
                  <div style={{ fontSize: 10, color: info.color, marginTop: 1 }}>
                    {a.qtdServicos} serviços
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: idx === 0 ? '#10B981' : idx < 3 ? '#f59e0b' : '#ef4444' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: idx === 0 ? '#10B981' : idx < 3 ? '#d97706' : '#ef4444' }}>
                  {tempoEspera(a.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        {aguardando.length > 4 && (
          <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 4, borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 12, color: info.color, fontWeight: 500 }}>
              +{aguardando.length - 4} mais na fila
            </span>
            <ArrowRight size={12} color={info.color} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Botão finalizar admin ──────────────────────────────────────────────────
function FinalizarAdminBtn({ atendimentoId, onFinalizado }) {
  const [loading, setLoading] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function handleFinalizar() {
    if (!confirmando) { setConfirmando(true); return; }
    setLoading(true);
    try {
      await api.patch(`/atendimentos/${atendimentoId}/finalizar-admin`);
      if (onFinalizado) onFinalizado();
    } catch {}
    finally { setLoading(false); setConfirmando(false); }
  }

  return confirmando ? (
    <div style={{ display: 'flex', gap: 5 }}>
      <button onClick={handleFinalizar} disabled={loading}
        style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
        {loading ? <Loader2 size={11} style={{ animation: 'spin .7s linear infinite' }} /> : 'Confirmar'}
      </button>
      <button onClick={() => setConfirmando(false)}
        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,.06)', color: '#6B7280', border: 'none', cursor: 'pointer' }}>
        Não
      </button>
    </div>
  ) : (
    <button onClick={handleFinalizar}
      style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <ShieldCheck size={11} /> Finalizar
    </button>
  );
}

// ── Botão atribuir manualmente ────────────────────────────────────────────
function AtribuirBtn({ atendimentoId, tipoServico, funcionarias }) {
  const [aberto, setAberto]   = useState(false);
  const [loading, setLoading] = useState(null); // funcionariaId em loading

  const candidatas = funcionarias.filter(f =>
    (f.especialidades?.includes(tipoServico) || f.multiTarefas) &&
    ['ONLINE', 'AUSENTE', 'EM_ATENDIMENTO'].includes(f.status)
  );

  async function atribuir(funcionariaId) {
    setLoading(funcionariaId);
    try {
      await api.patch(`/atendimentos/${atendimentoId}/atribuir`, { funcionariaId });
      setAberto(false);
    } catch {}
    finally { setLoading(null); }
  }

  const statusColor = { ONLINE: '#10B981', AUSENTE: '#F59E0B', EM_ATENDIMENTO: '#D4178A', OFFLINE: '#9CA3AF' };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setAberto(!aberto)}
        style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(96,165,250,.08)', color: '#60A5FA', border: '1px solid rgba(96,165,250,.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        <UserCheck size={11} /> Atribuir
      </button>

      {aberto && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, zIndex: 50, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.12)', minWidth: 180 }}>
          <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
            Escolha a funcionária
          </div>
          {candidatas.length === 0 ? (
            <div style={{ padding: '12px', fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>Nenhuma disponível</div>
          ) : (
            candidatas.map(f => (
              <button key={f.id} onClick={() => atribuir(f.id)} disabled={!!loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,.04)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,165,250,.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${statusColor[f.status]}20`, border: `1.5px solid ${statusColor[f.status]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: statusColor[f.status], flexShrink: 0 }}>
                  {f.usuario?.nome?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.usuario?.nome}</div>
                  <div style={{ fontSize: 10, color: statusColor[f.status] }}>{f.status === 'ONLINE' ? 'Disponível' : f.status === 'AUSENTE' ? 'Ausente' : 'Em atendimento'}</div>
                </div>
                {loading === f.id && <Loader2 size={12} color="#60A5FA" style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }} />}
              </button>
            ))
          )}
          <button onClick={() => setAberto(false)}
            style={{ width: '100%', padding: '7px', background: 'rgba(0,0,0,.02)', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9CA3AF' }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ── ComandaRow ─────────────────────────────────────────────────────────────
function ComandaRow({ grupo, estado }) {
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const ativos = grupo.itens.filter(i => i.status === 'EM_ATENDIMENTO').length;
  const temAtivo = ativos > 0;
  const nomesJa = grupo.itens.map(i => i.servicoNome).filter(Boolean);
  const [catAtiva, setCatAtiva] = useState('CABELO');

  const noSelecionados = (nome) => selecionados.some(s => s.servicoNome === nome);

  function toggleSelecionado(tipoServico, servicoNome, servicoPreco) {
    if (noSelecionados(servicoNome)) {
      setSelecionados(p => p.filter(s => s.servicoNome !== servicoNome));
    } else {
      setSelecionados(p => [...p, { tipoServico, servicoNome, servicoPreco }]);
    }
  }

  async function handleAdicionar() {
    if (!selecionados.length) return;
    const clienteId = grupo.clienteId;
    setLoading(true);
    try {
      await Promise.all(selecionados.map(s => api.post('/atendimentos/adicionar', { clienteId, tipoServico: s.tipoServico, servicoNome: s.servicoNome, servicoPreco: s.servicoPreco })));
      setMsg('Adicionado!');
      setSelecionados([]);
      setAdicionando(false);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  const duracaoTotal = tempoAtendimento(grupo.criadoEm);

  return (
    <div style={{ border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Row principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#FFFFFF', cursor: 'pointer', transition: 'background .15s' }}
        onClick={() => setAberto(!aberto)}
        onMouseEnter={e => e.currentTarget.style.background = '#F8F7F5'}
        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
      >
        {/* Avatar + comanda */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.3), rgba(232,93,4,.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>
            {grupo.cliente?.nome?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div style={{ minWidth: 130, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#D4178A' }}>#{grupo.numero}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1B2A4A' }}>{grupo.cliente?.nome}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
            {grupo.itens.length} serviço{grupo.itens.length > 1 ? 's' : ''} · {new Date(grupo.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Serviços pills */}
        <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          {grupo.itens.map(item => {
            const info = SERVICE_INFO[item.tipoServico];
            const func = item.funcionaria?.usuario?.nome?.split(' ')[0];
            const isAtivo = item.status === 'EM_ATENDIMENTO';
            return info ? (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: isAtivo ? info.bg : 'rgba(0,0,0,.05)', border: `1px solid ${isAtivo ? info.color + '40' : 'transparent'}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: isAtivo ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isAtivo ? info.color : '#6B7280' }}>{info.label}</span>
                </div>
                {func && <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', paddingLeft: 4 }}>↳ {func}</div>}
              </div>
            ) : null;
          })}
        </div>

        {/* Status + tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: temAtivo ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: temAtivo ? '#10B981' : '#F59E0B', border: `1px solid ${temAtivo ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)'}` }}>
              {temAtivo ? 'Em andamento' : 'Aguardando'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              <Clock size={10} color="#6B7280" />
              <span style={{ fontSize: 11, color: '#6B7280' }}>{duracaoTotal}</span>
            </div>
          </div>
          <button style={{ background: 'rgba(0,0,0,.05)', border: 'none', color: '#6B7280', padding: '6px', borderRadius: 6, display: 'flex', cursor: 'pointer' }}>
            {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandido */}
      {aberto && (
        <div style={{ padding: '12px 16px', background: '#F4F3F1', borderTop: '1px solid rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {grupo.itens.map(item => {
              const info = SERVICE_INFO[item.tipoServico];
              const isAtivo = item.status === 'EM_ATENDIMENTO';
              return info ? (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,.02)', borderRadius: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={12} color={info.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1B2A4A' }}>{item.servicoNome || info.label}</div>
                    {item.servicoNome && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{info.label}</div>}
                    {item.funcionaria && (
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                        {isAtivo ? 'com' : 'por'} {item.funcionaria.usuario?.nome}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {item.servicoPreco != null && <span style={{ fontSize: 11, fontWeight: 700, color: '#D4178A' }}>R$ {Number(item.servicoPreco).toFixed(2).replace('.', ',')}</span>}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: isAtivo ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: isAtivo ? '#10B981' : '#F59E0B' }}>
                      {isAtivo ? 'Ativo' : 'Fila'}
                    </span>
                    {['AGUARDANDO', 'PENDENTE_ACEITE'].includes(item.status) && (
                      <AtribuirBtn
                        atendimentoId={item.id}
                        tipoServico={item.tipoServico}
                        funcionarias={estado.funcionarias}
                      />
                    )}
                  </div>
                </div>
              ) : null;
            })}
          </div>

          {msg && <div style={{ fontSize: 12, color: msg.includes('Erro') ? '#EF4444' : '#10B981', marginBottom: 8 }}>{msg}</div>}

          {/* Finalizar serviços individualmente pelo admin */}
          {grupo.itens.some(i => ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(i.status)) && (
            <div style={{ marginBottom: 10, padding: '10px 12px', background: 'rgba(239,68,68,.04)', border: '1px dashed rgba(239,68,68,.2)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={12} color="#9CA3AF" /> Finalização de emergência (Admin)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {grupo.itens.filter(i => ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(i.status)).map(item => {
                  const info = SERVICE_INFO[item.tipoServico];
                  return info ? (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280' }}>
                        <info.Icon size={12} color={info.color} />
                        {info.label}
                      </div>
                      <FinalizarAdminBtn atendimentoId={item.id} onFinalizado={() => setMsg('Finalizado pelo admin.')} />
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {adicionando ? (
            <div style={{ background: 'rgba(212,23,138,.04)', border: '1px solid rgba(212,23,138,.12)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adicionar serviço</div>
              {/* Tabs de categoria */}
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', marginBottom: 8, scrollbarWidth: 'none' }}>
                {CATEGORIAS_ORDEM.map(cat => {
                  const info = SERVICE_INFO[cat];
                  const ativo = cat === catAtiva;
                  const qtd = selecionados.filter(s => s.tipoServico === cat).length;
                  return (
                    <button key={cat} onClick={() => setCatAtiva(cat)}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 14, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all .12s',
                        background: ativo ? info.darkBg : 'transparent',
                        border: `1.5px solid ${ativo ? info.color + '60' : 'rgba(0,0,0,.1)'}`,
                        color: ativo ? info.color : '#9CA3AF',
                      }}>
                      <info.Icon size={10} /> {info.label}
                      {qtd > 0 && <span style={{ fontSize: 8, fontWeight: 800, background: info.color, color: '#fff', width: 13, height: 13, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{qtd}</span>}
                    </button>
                  );
                })}
              </div>
              {/* Itens */}
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid rgba(0,0,0,.08)', borderRadius: 6, marginBottom: 8, background: '#fff' }}>
                {CATALOG[catAtiva].grupos.map(grupo => (
                  <div key={grupo.nome}>
                    <div style={{ padding: '4px 8px 2px', fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', background: '#F9FAFB' }}>{grupo.nome}</div>
                    {grupo.itens.map(item => {
                      const jaExiste = nomesJa.includes(item.nome);
                      const sel = noSelecionados(item.nome);
                      const catInfo = SERVICE_INFO[catAtiva];
                      return (
                        <button key={item.nome} onClick={() => !jaExiste && toggleSelecionado(catAtiva, item.nome, item.preco)}
                          disabled={jaExiste}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', background: sel ? catInfo.darkBg : 'transparent', border: 'none', cursor: jaExiste ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: jaExiste ? 0.4 : 1 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${sel ? catInfo.color : 'rgba(0,0,0,.15)'}`, background: sel ? catInfo.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <Check size={9} color="#fff" />}
                          </div>
                          <span style={{ flex: 1, fontSize: 11, color: sel ? catInfo.color : '#374151', fontWeight: sel ? 600 : 400 }}>{item.nome}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', flexShrink: 0 }}>R$ {item.preco}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleAdicionar} disabled={loading || !selecionados.length}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: selecionados.length ? 'linear-gradient(135deg,#E85D04,#D4178A)' : 'rgba(0,0,0,.05)', color: selecionados.length ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 600, border: 'none', cursor: selecionados.length ? 'pointer' : 'not-allowed' }}>
                  {loading ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={12} />}
                  Confirmar {selecionados.length > 0 && `(${selecionados.length})`}
                </button>
                <button onClick={() => { setAdicionando(false); setSelecionados([]); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,.05)', color: '#6B7280', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                  <X size={12} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdicionando(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,.03)', border: '1px dashed rgba(0,0,0,.15)', color: '#6B7280', fontSize: 12, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,23,138,.3)'; e.currentTarget.style.color = '#D4178A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,.15)'; e.currentTarget.style.color = '#6B7280'; }}
            >
              <Plus size={13} /> Adicionar serviço
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────
export default function DashboardTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  // Usa estado passado pelo AdminPage se disponível, senão usa o local
  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;

  const aguardando  = estado.atendimentos.filter(a => a.status === 'AGUARDANDO');
  const emAndamento = estado.atendimentos.filter(a => a.status === 'EM_ATENDIMENTO');
  const disponiveis = estado.funcionarias.filter(f => f.status === 'ONLINE');
  const ocupadas    = estado.funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const comandas    = agruparComandas(estado.atendimentos);

  const kpis = [
    { title: 'Aguardando',       valor: aguardando.length,                    sub: 'clientes na fila agora',          Icon: Clock,     color: '#F59E0B', bg: 'rgba(245,158,11,.1)'  },
    { title: 'Em Atendimento',   valor: emAndamento.length,                   sub: 'sendo atendidas agora',           Icon: Zap,       color: '#10B981', bg: 'rgba(16,185,129,.1)'  },
    { title: 'Disponíveis',      valor: disponiveis.length,                   sub: 'funcionárias online',             Icon: UserCheck, color: '#60A5FA', bg: 'rgba(96,165,250,.1)'  },
    { title: 'Ativos agora',     valor: emAndamento.length + aguardando.length, sub: 'comandas em aberto',            Icon: UserX,     color: '#D4178A', bg: 'rgba(212,23,138,.1)'  },
  ];

  const dark = { color: '#1B2A4A', colorSub: '#6B7280', border: 'rgba(0,0,0,.08)' };

  return (
    <div>
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: dark.color, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(212,23,138,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} color="#D4178A" />
            </div>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: dark.colorSub, marginTop: 4 }}>Acompanhe o salão em tempo real</p>
        </div>
      </div>

      {/* Grid: Faturamento (esquerda, 2 linhas) + 4 KPIs (direita, 2×2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 14, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Faturamento ocupa 2 linhas */}
        <div style={{ gridRow: 'span 2' }}>
          <FaturamentoCard atendimentos={estado.atendimentos} />
        </div>
        {kpis.map(k => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Filas de Atendimento */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: dark.colorSub, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Filas de Atendimento
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {SERVICES.map(s => (
            <FilaColuna key={s} servico={s} atendimentos={estado.atendimentos} />
          ))}
        </div>
      </div>

      {/* Comandas Ativas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: dark.colorSub, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Comandas Ativas
          </h2>
          <button style={{ fontSize: 12, color: '#D4178A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todas <ArrowRight size={13} />
          </button>
        </div>

        {comandas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(0,0,0,.07)', color: '#6B7280', fontSize: 14 }}>
            Nenhuma comanda ativa no momento
          </div>
        ) : (
          <div>
            {comandas.map(grupo => (
              <ComandaRow key={grupo.numero} grupo={grupo} estado={estado} />
            ))}
            {comandas.length > 5 && (
              <button style={{ width: '100%', padding: '12px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,23,138,.2)'; e.currentTarget.style.color = '#D4178A'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,.07)'; e.currentTarget.style.color = '#6B7280'; }}
              >
                Ver todas as comandas ativas <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .filas-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .kpi-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .filas-grid, .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
