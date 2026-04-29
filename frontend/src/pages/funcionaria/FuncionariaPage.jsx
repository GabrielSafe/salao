import { useState, useCallback, useEffect, useRef } from 'react';
import {
  LogOut, PlayCircle, PauseCircle, CheckCircle2,
  Scissors, Sparkles, Hand, Leaf, Eye, Clock, Coffee,
  X, Check, Wifi, WifiOff, AlertTriangle, RefreshCw, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import logo from '../../public/logo.png';

// ── Constantes ─────────────────────────────────────────────────────────────
const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', darkBg: 'rgba(168,85,247,.1)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', darkBg: 'rgba(236,72,153,.1)'  },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  darkBg: 'rgba(251,146,60,.1)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   darkBg: 'rgba(34,197,94,.1)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.15)',  darkBg: 'rgba(56,189,248,.1)'  },
};

const TIMEOUT_SEGUNDOS = 60;
const HEARTBEAT_INTERVAL_MS = 30_000;

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function tocarAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 200, 400].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.3);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.35);
    });
  } catch {}
}

// ── Modal de proposta ────────────────────────────────────────────────────
function ModalProposta({ proposta, onAceitar, onRecusar }) {
  const [segundos, setSegundos] = useState(TIMEOUT_SEGUNDOS);
  const info = SERVICE_INFO[proposta.tipoServico];
  const servicos = proposta.servicosAgrupados?.length > 0 ? proposta.servicosAgrupados : [proposta];
  const totalPreco = servicos.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const pct = (segundos / TIMEOUT_SEGUNDOS) * 100;
  const corBarra = segundos > 20 ? '#10B981' : segundos > 10 ? '#f59e0b' : '#EF4444';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: '#111111', border: '1px solid #333', borderRadius: 24, padding: '32px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.7)', animation: 'fadeInScale .25s ease' }}>

        {/* Ícone animado */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(245,158,11,.4)', animation: 'ring 1s ease infinite' }}>
          <span style={{ fontSize: 32 }}>🔔</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>
          {servicos.length > 1 ? `${servicos.length} serviços solicitados!` : 'Nova solicitação!'}
        </h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>Uma cliente está esperando por você</p>

        {/* Detalhes da cliente */}
        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: servicos.length > 1 ? 12 : 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.3),rgba(217,119,6,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
              {proposta.cliente?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{proposta.cliente?.nome}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Comanda #{proposta.numeroComanda} · {info?.label}</div>
            </div>
          </div>

          {servicos.map((s, i) => {
            const sInfo = SERVICE_INFO[s.tipoServico];
            return (
              <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: i === 0 && servicos.length > 1 ? '1px solid #2a2a2a' : 'none' }}>
                {sInfo && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: sInfo.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <sInfo.Icon size={13} color={sInfo.color} />
                  </div>
                )}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{s.servicoNome || sInfo?.label}</span>
                {s.servicoPreco != null && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                    {fmt(s.servicoPreco)}
                  </span>
                )}
              </div>
            );
          })}

          {servicos.length > 1 && totalPreco > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #2a2a2a', marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b', fontFamily: "'Poppins', sans-serif" }}>{fmt(totalPreco)}</span>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Responda em:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: corBarra, fontFamily: "'Poppins', sans-serif" }}>{segundos}s</span>
          </div>
          <div style={{ height: 5, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: corBarra, transition: 'width 1s linear, background .3s' }} />
          </div>
          {segundos === 0 && (
            <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>Tempo esgotado — você foi para o final da fila</p>
          )}
        </div>

        {/* Botões */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={onRecusar}
            style={{ padding: '12px', borderRadius: 12, border: '1.5px solid #333', background: '#1a1a1a', color: '#9ca3af', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#9ca3af'; }}>
            <X size={16} /> Recusar
          </button>
          <button onClick={onAceitar}
            style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(245,158,11,.35)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,.35)'; }}>
            <Check size={16} /> Aceitar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn      { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeInScale { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
        @keyframes ring {
          0%,100% { transform:rotate(0deg); box-shadow:0 8px 32px rgba(245,158,11,.4); }
          20%     { transform:rotate(-8deg); }
          40%     { transform:rotate(8deg); }
          60%     { transform:rotate(-4deg); }
          80%     { transform:rotate(4deg); box-shadow:0 8px 40px rgba(245,158,11,.6); }
        }
      `}</style>
    </div>
  );
}

// ── Modal "virou offline" ────────────────────────────────────────────────
function ModalOffline({ mensagem, onReconectar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .3s ease' }}>
      <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 24, padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.8)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,.12)', border: '2px solid rgba(239,68,68,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <WifiOff size={28} color="#EF4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: "'Poppins', sans-serif" }}>Você ficou offline</h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
          {mensagem || 'Você ficou offline por inatividade. Entre na fila novamente para receber atendimentos.'}
        </p>
        <button onClick={onReconectar}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(245,158,11,.3)' }}>
          <RefreshCw size={16} /> Voltar ao online
        </button>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────
export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const [estado, setEstado]           = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [msg, setMsg]                 = useState({ text: '', type: '' });
  const [ausente, setAusente]         = useState(false);
  const [proposta, setProposta]       = useState(null);
  const [virouOffline, setVirouOffline]   = useState(false);
  const [msgOffline, setMsgOffline]       = useState('');
  const [conectado, setConectado]         = useState(true);
  const propostaRef = useRef(null);

  const salaoId       = usuario?.salaoId;
  const funcionariaId = usuario?.funcionaria?.id;

  // ── Permissão de notificação ──────────────────────────────────────────
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // ── Socket ────────────────────────────────────────────────────────────
  const onEstadoCompleto = useCallback((dados) => {
    setEstado(dados);
    const minhasEntradas = dados.filas?.filter(f => f.funcionariaId === funcionariaId);
    setNaFila(minhasEntradas?.length > 0);
  }, [funcionariaId]);

  const onVirouOffline = useCallback((data) => {
    setVirouOffline(true);
    setMsgOffline(data?.mensagem || '');
    setNaFila(false);
  }, []);

  const onAvisoPresenca = useCallback((data) => {
    showMsg(data?.mensagem || 'Você apareceu como ausente.', 'warning');
  }, []);

  const onPropostaAtendimento = useCallback((atendimento) => {
    propostaRef.current = atendimento;
    setProposta(atendimento);
    tocarAlerta();

    let count = 0;
    const orig = document.title;
    const timer = setInterval(() => {
      document.title = count % 2 === 0 ? '🔔 Nova cliente!' : orig;
      if (++count > 14) { clearInterval(timer); document.title = orig; }
    }, 600);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Nova cliente!', {
        body: `${atendimento.cliente?.nome} — ${SERVICE_INFO[atendimento.tipoServico]?.label}`,
        requireInteraction: true,
      });
    }

    setTimeout(() => {
      setProposta(p => p?.id === atendimento.id ? null : p);
    }, (TIMEOUT_SEGUNDOS + 1) * 1000);
  }, []);

  const { emit, getSocket } = useSocket(salaoId, {
    onEstadoCompleto,
    onPropostaAtendimento,
    onVirouOffline,
    onAvisoPresenca,
  });

  // ── Valores derivados — antes dos effects que os usam ─────────────────
  const meuAtendimento       = estado.atendimentos.find(a => a.funcionariaId === funcionariaId && a.status === 'EM_ATENDIMENTO');
  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria    = estado.funcionarias.find(f => f.id === funcionariaId)?.status || 'ONLINE';

  // ── Detecta conexão/desconexão do socket ──────────────────────────────
  useEffect(() => {
    if (!salaoId) return;
    const interval = setInterval(() => {
      const socket = getSocket();
      setConectado(socket?.connected ?? false);
    }, 3000);
    return () => clearInterval(interval);
  }, [salaoId, getSocket]);

  // ── Heartbeat — sinal de vida a cada 30s ──────────────────────────────
  useEffect(() => {
    if (!salaoId) return;
    const interval = setInterval(() => {
      emit('heartbeat', {});
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [salaoId, emit]);

  // ── Page Visibility API via socket ────────────────────────────────────
  useEffect(() => {
    function handleVisibility() {
      const oculta = document.hidden;
      setAusente(oculta);
      if (oculta && naFila) return;
      if (oculta && statusFuncionaria === 'EM_ATENDIMENTO') return;
      emit('visibilidade_alterada', { oculta });
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [emit, naFila, statusFuncionaria]);

  // ── Handlers ──────────────────────────────────────────────────────────

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  }

  async function handleAceitar() {
    if (!proposta) return;
    setProposta(null);
    try { await api.post(`/atendimentos/${proposta.id}/aceitar`); }
    catch (err) { showMsg(err.response?.data?.erro || 'Erro ao aceitar', 'error'); }
  }

  async function handleRecusar() {
    if (!proposta) return;
    const id = proposta.id;
    setProposta(null);
    try { await api.post(`/atendimentos/${id}/recusar`); showMsg('Você foi para o final da fila.', 'info'); }
    catch (err) { showMsg(err.response?.data?.erro || 'Erro ao recusar', 'error'); }
  }

  async function toggleFila() {
    setLoading(true);
    try {
      if (naFila) { await api.post('/fila/sair');   showMsg('Você saiu da fila.', 'info'); }
      else        { await api.post('/fila/entrar');  showMsg('Você entrou na fila!', 'success'); }
    } catch (err) { showMsg(err.response?.data?.erro || 'Erro', 'error'); }
    finally { setLoading(false); }
  }

  async function finalizarAtendimento() {
    if (!meuAtendimento) return;
    setLoading(true);
    try { await api.patch(`/atendimentos/${meuAtendimento.id}/finalizar`); showMsg('Atendimento finalizado!', 'success'); }
    catch (err) { showMsg(err.response?.data?.erro || 'Erro', 'error'); }
    finally { setLoading(false); }
  }

  async function handleReconectar() {
    setVirouOffline(false);
    try { await api.post('/fila/entrar'); showMsg('Você voltou ao online e entrou na fila!', 'success'); }
    catch {}
  }

  const serviceInfo = meuAtendimento ? SERVICE_INFO[meuAtendimento.tipoServico] : null;
  const statusLabel = statusFuncionaria === 'EM_ATENDIMENTO'
    ? { text: 'Em atendimento', color: '#f59e0b', dot: '#f59e0b' }
    : statusFuncionaria === 'AUSENTE' || ausente
    ? { text: 'Ausente',        color: '#9CA3AF', dot: '#9CA3AF' }
    : naFila
    ? { text: 'Na fila',        color: '#10B981', dot: '#10B981' }
    : { text: 'Disponível',     color: '#6b7280', dot: '#6b7280' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Inter', sans-serif" }}>

      {/* Modal de proposta */}
      {proposta && <ModalProposta proposta={proposta} onAceitar={handleAceitar} onRecusar={handleRecusar} />}

      {/* Modal offline */}
      {virouOffline && statusFuncionaria === 'OFFLINE' && (
        <ModalOffline mensagem={msgOffline} onReconectar={handleReconectar} />
      )}

      {/* ── Topbar ── */}
      <nav style={{ background: '#0f0f0f', borderBottom: '1px solid #1a1a1a', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#000', fontFamily: "'Poppins', sans-serif" }}>R</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>Rápido <span style={{ color: '#f59e0b' }}>Beauty</span></div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Funcionária</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status de conexão */}
          {!conectado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', padding: '4px 10px', borderRadius: 20 }}>
              <WifiOff size={11} color="#EF4444" />
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Reconectando…</span>
            </div>
          )}

          {/* Status da funcionária */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusLabel.dot, flexShrink: 0,
              animation: statusFuncionaria === 'EM_ATENDIMENTO' || naFila ? 'pulseDot 2s ease infinite' : 'none' }} />
            <span style={{ fontSize: 12, color: statusLabel.color, fontWeight: 700 }}>{statusLabel.text}</span>
          </div>

          {/* Nome */}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{usuario?.nome?.split(' ')[0]}</span>

          {/* Logout */}
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 500, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,.4)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </nav>

      {/* ── Banner: background com fila ativa ── */}
      {ausente && naFila && (
        <div style={{ background: 'rgba(16,185,129,.06)', borderBottom: '1px solid rgba(16,185,129,.15)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulseDot 2s ease infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>
            Você está na fila e <strong>disponível</strong> — aguardando próxima cliente.
          </span>
        </div>
      )}

      {/* ── Banner: ausente sem fila ── */}
      {ausente && !naFila && statusFuncionaria !== 'EM_ATENDIMENTO' && (
        <div style={{ background: 'rgba(245,158,11,.06)', borderBottom: '1px solid rgba(245,158,11,.15)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Coffee size={13} color="#d97706" />
          <span style={{ fontSize: 13, color: '#d97706', fontWeight: 600 }}>
            Você está <strong>ausente</strong> — volte para esta aba para ficar online.
          </span>
        </div>
      )}

      {/* ── Banner aviso sem heartbeat ── */}
      {msg.text && (
        <div style={{ padding: '10px 20px', background: msg.type === 'error' ? 'rgba(239,68,68,.1)' : msg.type === 'warning' ? 'rgba(245,158,11,.1)' : msg.type === 'info' ? 'rgba(96,165,250,.1)' : 'rgba(16,185,129,.1)', borderBottom: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,.2)' : msg.type === 'warning' ? 'rgba(245,158,11,.2)' : msg.type === 'info' ? 'rgba(96,165,250,.2)' : 'rgba(16,185,129,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 13, color: msg.type === 'error' ? '#EF4444' : msg.type === 'warning' ? '#d97706' : msg.type === 'info' ? '#60A5FA' : '#10B981', fontWeight: 500 }}>
            {msg.text}
          </span>
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* ── Conteúdo principal ── */}
      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>

        {/* Atendimento atual */}
        {meuAtendimento ? (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '3px solid #10b981', borderRadius: 14, padding: '20px', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Atendimento atual</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,.12)', color: '#10b981', padding: '3px 10px', borderRadius: 20 }}>Em andamento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {serviceInfo && (
                <div style={{ width: 56, height: 56, borderRadius: 14, background: serviceInfo.darkBg, border: `1px solid ${serviceInfo.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <serviceInfo.Icon size={26} color={serviceInfo.color} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>{meuAtendimento.cliente?.nome}</div>
                <div style={{ color: '#9ca3af', fontSize: 14, marginTop: 3 }}>
                  {serviceInfo?.label} · Comanda <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{meuAtendimento.numeroComanda}</span>
                </div>
              </div>
            </div>
            <button onClick={finalizarAtendimento} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 11, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? .7 : 1, boxShadow: '0 4px 16px rgba(16,185,129,.25)', transition: 'all .15s' }}>
              <CheckCircle2 size={18} /> Finalizar atendimento
            </button>
          </div>
        ) : (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '32px 20px', marginBottom: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
            <div style={{ width: 60, height: 60, background: '#262626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #333' }}>
              <Clock size={28} color="#6b7280" />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#e5e5e5' }}>Nenhum atendimento</p>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              {naFila ? 'Na fila — aguardando próxima cliente.' : 'Entre na fila para receber atendimentos.'}
            </p>
          </div>
        )}

        {/* Botão fila */}
        {!meuAtendimento && (
          <button onClick={toggleFila} disabled={loading}
            style={{ width: '100%', padding: '15px', borderRadius: 12, background: naFila ? '#1a1a1a' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: naFila ? '#e5e5e5' : '#000', fontSize: 15, fontWeight: 700, border: naFila ? '1.5px solid #333' : 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, opacity: loading ? .7 : 1, boxShadow: naFila ? 'none' : '0 4px 20px rgba(245,158,11,.3)', transition: 'all .15s' }}>
            {loading
              ? <span>Aguarde…</span>
              : naFila
              ? <><PauseCircle size={18} /> Sair da fila</>
              : <><PlayCircle size={18} /> Entrar na fila</>
            }
          </button>
        )}

        {/* Posição na fila */}
        {naFila && !meuAtendimento && (
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '18px', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sua posição na fila</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {minhasEspecialidades.map(esp => {
                const info = SERVICE_INFO[esp];
                if (!info) return null;
                const filaEsp = [...estado.filas].filter(f => f.especialidade === esp).sort((a, b) => new Date(a.entradaEm) - new Date(b.entradaEm));
                const posicao = filaEsp.findIndex(f => f.funcionariaId === funcionariaId) + 1;
                if (posicao === 0) return null;
                const isPrimeira = posicao === 1;
                return (
                  <div key={esp} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: isPrimeira ? 'rgba(16,185,129,.06)' : '#262626', border: `1px solid ${isPrimeira ? 'rgba(16,185,129,.2)' : '#333'}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: isPrimeira ? 'rgba(16,185,129,.15)' : info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: isPrimeira ? '#10B981' : info.color, fontFamily: "'Poppins', sans-serif" }}>
                      {posicao}°
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <info.Icon size={14} color={info.color} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#e5e5e5' }}>{info.label}</span>
                        {isPrimeira && <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.12)', padding: '1px 7px', borderRadius: 10 }}>Próxima</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                        {isPrimeira ? 'Você será a próxima a atender' : `${posicao - 1} na sua frente · ${filaEsp.length} na fila`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Especialidades */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '18px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Minhas especialidades</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minhasEspecialidades.map(esp => {
              const info = SERVICE_INFO[esp];
              if (!info) return null;
              return (
                <span key={esp} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: info.darkBg, color: info.color, fontSize: 13, fontWeight: 600, border: `1px solid ${info.color}25` }}>
                  <info.Icon size={13} /> {info.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Indicador de heartbeat (debug visual, sutil) */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Shield size={11} color="#2a2a2a" />
          <span style={{ fontSize: 10, color: '#2a2a2a' }}>
            {conectado ? 'Conexão ativa · heartbeat a cada 30s' : 'Sem conexão'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.8); } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeInScale { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
        @keyframes ring {
          0%,100% { transform:rotate(0deg); box-shadow:0 8px 32px rgba(245,158,11,.4); }
          20% { transform:rotate(-8deg); }
          40% { transform:rotate(8deg); }
          60% { transform:rotate(-4deg); }
          80% { transform:rotate(4deg); box-shadow:0 8px 40px rgba(245,158,11,.6); }
        }
      `}</style>
    </div>
  );
}
