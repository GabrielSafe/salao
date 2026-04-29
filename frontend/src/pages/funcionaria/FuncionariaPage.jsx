import { useState, useCallback, useEffect, useRef } from 'react';
import {
  LogOut, PlayCircle, PauseCircle, CheckCircle2,
  Scissors, Sparkles, Hand, Leaf, Eye, Clock, Coffee,
  X, Check, WifiOff, RefreshCw, Armchair, DollarSign,
  TrendingUp, Sun, Moon, Timer, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useThemeCtx } from '../../contexts/ThemeContext.jsx';
import api from '../../services/api';

// ── Tema ─────────────────────────────────────────────────────────────────
function buildT(isDark) {
  return isDark ? {
    bg: '#0f0f0f', card: '#1a1a1a', card2: '#262626',
    border: '#2a2a2a', border2: '#333333',
    fg: '#e5e5e5', muted: '#9ca3af', sub: '#6b7280',
    primary: '#f59e0b', primaryDark: '#d97706',
    hover: '#222222',
    shadow: '0 4px 20px rgba(0,0,0,.4)',
    nav: '#0a0a0a', navBorder: 'rgba(255,255,255,.06)',
  } : {
    bg: '#f9fafb', card: '#ffffff', card2: '#f3f4f6',
    border: '#e5e7eb', border2: '#d1d5db',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', primaryDark: '#d97706',
    hover: '#f3f4f6',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.08)',
    nav: '#ffffff', navBorder: '#e5e7eb',
  };
}

// ── Constantes ─────────────────────────────────────────────────────────────
const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', dim: 'rgba(168,85,247,.08)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', dim: 'rgba(236,72,153,.08)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  dim: 'rgba(251,146,60,.08)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   dim: 'rgba(34,197,94,.08)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.15)',  dim: 'rgba(56,189,248,.08)'  },
};

const TIMEOUT_SEGUNDOS    = 60;
const HEARTBEAT_INTERVAL  = 30_000;

const fmt     = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
const fmtMin  = (m) => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}min` : ''}`;
const elapsed = (d) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m <= 0 ? '< 1 min' : fmtMin(m); };

// Desbloqueia o AudioContext via gesto do usuário (obrigatório no iOS/mobile)
function desbloquearAudio(ctxRef) {
  try {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
  } catch {}
}

async function tocarAlerta(ctxRef) {
  // Vibração — funciona mesmo em background no Android
  navigator.vibrate?.([400, 100, 400, 100, 400]);

  try {
    // Usa o AudioContext já desbloqueado pelo gesto do usuário
    const ctx = ctxRef?.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    if (ctx.state !== 'running') return;

    [0, 200, 400].forEach((delay) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
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
  const info     = SERVICE_INFO[proposta.tipoServico];
  const servicos = proposta.servicosAgrupados?.length > 0 ? proposta.servicosAgrupados : [proposta];
  const total    = servicos.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const pct = (segundos / TIMEOUT_SEGUNDOS) * 100;
  const cor = segundos > 20 ? '#10B981' : segundos > 10 ? '#f59e0b' : '#EF4444';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 24, padding: '32px 24px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.8)', animation: 'scaleIn .25s ease' }}>

        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(245,158,11,.4)', animation: 'ring 1s ease infinite' }}>
          <span style={{ fontSize: 32 }}>🔔</span>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6 }}>Nova solicitação</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>
          {servicos.length > 1 ? `${servicos.length} serviços` : info?.label}
        </h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>Uma cliente está esperando por você</p>

        <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '14px 16px', marginBottom: 20, textAlign: 'left', border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: servicos.length > 1 ? 12 : 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.25),rgba(217,119,6,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>
              {proposta.cliente?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{proposta.cliente?.nome}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>Comanda #{proposta.numeroComanda}</div>
            </div>
          </div>

          {servicos.map((s, i) => {
            const sInfo = SERVICE_INFO[s.tipoServico];
            return (
              <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px solid #2a2a2a' }}>
                {sInfo && <div style={{ width: 28, height: 28, borderRadius: 8, background: sInfo.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><sInfo.Icon size={13} color={sInfo.color} /></div>}
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{s.servicoNome || sInfo?.label}</span>
                {s.servicoPreco != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(s.servicoPreco)}</span>}
              </div>
            );
          })}

          {servicos.length > 1 && total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #2a2a2a', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>{fmt(total)}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Responda em:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: cor }}>{segundos}s</span>
          </div>
          <div style={{ height: 5, background: '#2a2a2a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: cor, transition: 'width 1s linear, background .3s' }} />
          </div>
          {segundos === 0 && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>Tempo esgotado — você foi para o final da fila</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onRecusar}
            style={{ padding: '13px', borderRadius: 12, border: '1.5px solid #333', background: '#1a1a1a', color: '#9ca3af', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#9ca3af'; }}>
            <X size={16} /> Recusar
          </button>
          <button onClick={onAceitar}
            style={{ padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(245,158,11,.35)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,.35)'; }}>
            <Check size={16} /> Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal offline forçado ─────────────────────────────────────────────────
function ModalOffline({ mensagem, onReconectar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .3s ease' }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 24, padding: '40px 28px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.9)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <WifiOff size={28} color="#EF4444" />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: '#EF4444', textTransform: 'uppercase', marginBottom: 8 }}>Você ficou offline</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10, fontFamily: "'Poppins', sans-serif" }}>Sessão encerrada</h2>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
          {mensagem || 'Você ficou offline por inatividade. Entre na fila novamente para receber atendimentos.'}
        </p>
        <button onClick={onReconectar}
          style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(245,158,11,.3)' }}>
          <RefreshCw size={16} /> Voltar ao online
        </button>
      </div>
    </div>
  );
}

// ── Timer ao vivo ─────────────────────────────────────────────────────────
function TimerVivo({ iniciadoEm }) {
  const [mins, setMins] = useState(0);
  useEffect(() => {
    function calc() { setMins(Math.floor((Date.now() - new Date(iniciadoEm)) / 60000)); }
    calc();
    const t = setInterval(calc, 30_000);
    return () => clearInterval(t);
  }, [iniciadoEm]);
  return <span>{fmtMin(Math.max(mins, 0)) || '< 1 min'}</span>;
}

// ── Página principal ──────────────────────────────────────────────────────
export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const { isDark, toggle }  = useThemeCtx();
  const T = buildT(isDark);

  const [estado, setEstado]             = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila]             = useState(false);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState({ text: '', type: '' });
  const [ausente, setAusente]           = useState(false);
  const [proposta, setProposta]         = useState(null);
  const [virouOffline, setVirouOffline] = useState(false);
  const [msgOffline, setMsgOffline]     = useState('');
  const [conectado, setConectado]       = useState(true);
  const propostaRef  = useRef(null);
  const audioCtxRef  = useRef(null); // AudioContext pré-desbloqueado via gesto

  const salaoId       = usuario?.salaoId;
  const funcionariaId = usuario?.funcionaria?.id;

  // ── Valores derivados (antes dos effects) ─────────────────────────────
  const meuAtendimento       = estado.atendimentos.find(a => a.funcionariaId === funcionariaId && a.status === 'EM_ATENDIMENTO');
  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria    = estado.funcionarias.find(f => f.id === funcionariaId)?.status || 'ONLINE';

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const meusFinalizados  = estado.atendimentos.filter(a => a.funcionariaId === funcionariaId && a.status === 'FINALIZADO' && new Date(a.createdAt) >= hoje);
  const ganhosHoje       = meusFinalizados.reduce((s, a) => s + (a.servicoPreco || 0), 0);
  const temposMedioMin   = meusFinalizados.length > 0
    ? Math.round(meusFinalizados.filter(a => a.iniciadoEm && a.finalizadoEm).reduce((s, a) => s + (new Date(a.finalizadoEm) - new Date(a.iniciadoEm)) / 60000, 0) / Math.max(meusFinalizados.filter(a => a.iniciadoEm).length, 1))
    : 0;

  // ── Registra Service Worker + Web Push ──────────────────────────────
  useEffect(() => {
    async function setupPush() {
      try {
        // Pede permissão de notificação
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }
        if (Notification.permission !== 'granted') return;

        // Suporte necessário
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        // Registra SW
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Busca a chave pública VAPID do servidor
        const res = await api.get('/push/public-key');
        const vapidPublicKey = res.data?.publicKey;
        if (!vapidPublicKey) return;

        // Verifica se já tem subscription ativa neste dispositivo
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          // Cria nova subscription
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly:      true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
        }

        // Registra/atualiza no servidor
        await api.post('/push/subscribe', subscription.toJSON());
      } catch (err) {
        // Falha silenciosa — sistema continua funcionando via socket
        console.warn('[push] Setup:', err.message);
      }
    }
    setupPush();
  }, []);

  function urlBase64ToUint8Array(base64) {
    const pad  = '='.repeat((4 - base64.length % 4) % 4);
    const b64  = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw  = window.atob(b64);
    const arr  = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  // ── Socket callbacks ──────────────────────────────────────────────────
  const onEstadoCompleto = useCallback((dados) => {
    setEstado(dados);
    setNaFila((dados.filas?.filter(f => f.funcionariaId === funcionariaId)?.length ?? 0) > 0);
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
    tocarAlerta(audioCtxRef);

    let count = 0; const orig = document.title;
    const timer = setInterval(() => {
      document.title = count % 2 === 0 ? '🔔 Nova cliente!' : orig;
      if (++count > 14) { clearInterval(timer); document.title = orig; }
    }, 600);

    // Notification API cobre aba em background (browser aberto, outra aba ativa)
    // Push VAPID cobre browser fechado/minimizado — ambos são necessários
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const servicos = atendimento.servicosAgrupados?.length > 0
        ? atendimento.servicosAgrupados.map(s => s.servicoNome || SERVICE_INFO[s.tipoServico]?.label).join(', ')
        : (atendimento.servicoNome || SERVICE_INFO[atendimento.tipoServico]?.label);
      new Notification('🔔 Nova solicitação!', {
        body: `${atendimento.cliente?.nome} • ${servicos}`,
        requireInteraction: true,
        tag: 'nova-proposta',
        renotify: true,
      });
    }

    setTimeout(() => setProposta(p => p?.id === atendimento.id ? null : p), (TIMEOUT_SEGUNDOS + 1) * 1000);
  }, []);

  const { emit, getSocket } = useSocket(salaoId, { onEstadoCompleto, onPropostaAtendimento, onVirouOffline, onAvisoPresenca });

  // ── Status da conexão ─────────────────────────────────────────────────
  useEffect(() => {
    if (!salaoId) return;
    const t = setInterval(() => setConectado(getSocket()?.connected ?? false), 3000);
    return () => clearInterval(t);
  }, [salaoId, getSocket]);

  // ── Heartbeat ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!salaoId) return;
    const t = setInterval(() => emit('heartbeat', {}), HEARTBEAT_INTERVAL);
    return () => clearInterval(t);
  }, [salaoId, emit]);

  // ── Visibilidade da página ────────────────────────────────────────────
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

  // ── Handlers ─────────────────────────────────────────────────────────
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
    const id = proposta.id; setProposta(null);
    try { await api.post(`/atendimentos/${id}/recusar`); showMsg('Você foi para o final da fila.', 'info'); }
    catch (err) { showMsg(err.response?.data?.erro || 'Erro ao recusar', 'error'); }
  }

  async function toggleFila() {
    // Desbloqueia AudioContext no gesto do usuário (obrigatório no iOS/mobile)
    desbloquearAudio(audioCtxRef);
    setLoading(true);
    try {
      if (naFila) { await api.post('/fila/sair');    showMsg('Você saiu da fila.', 'info'); }
      else        { await api.post('/fila/entrar');   showMsg('Você entrou na fila!', 'success'); }
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
    try { await api.post('/fila/entrar'); showMsg('Você voltou ao online!', 'success'); }
    catch {}
  }

  const serviceInfo = meuAtendimento ? SERVICE_INFO[meuAtendimento.tipoServico] : null;

  const statusLabel = statusFuncionaria === 'EM_ATENDIMENTO' ? { text: 'Em atendimento', color: '#f59e0b' }
    : statusFuncionaria === 'AUSENTE' || ausente           ? { text: 'Ausente',         color: '#9CA3AF' }
    : naFila                                               ? { text: 'Na fila',         color: '#10B981' }
    :                                                        { text: 'Disponível',      color: '#6b7280' };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', sans-serif", transition: 'background .2s' }}>

      {proposta && <ModalProposta proposta={proposta} onAceitar={handleAceitar} onRecusar={handleRecusar} />}
      {virouOffline && statusFuncionaria === 'OFFLINE' && <ModalOffline mensagem={msgOffline} onReconectar={handleReconectar} />}

      {/* ── Topbar ── */}
      <nav style={{ background: T.nav, borderBottom: `1px solid ${T.navBorder}`, padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, transition: 'background .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#000', fontFamily: "'Poppins', sans-serif" }}>R</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, lineHeight: 1 }}>Rápido <span style={{ color: '#f59e0b' }}>Beauty</span></div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{usuario?.salao?.nome || 'Salão'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!conectado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', padding: '4px 10px', borderRadius: 20 }}>
              <WifiOff size={11} color="#EF4444" />
              <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>Reconectando…</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 20, background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)', border: `1px solid ${T.border}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusLabel.color, animation: naFila || statusFuncionaria === 'EM_ATENDIMENTO' ? 'pulseDot 2s ease infinite' : 'none' }} />
            <span style={{ fontSize: 12, color: statusLabel.color, fontWeight: 700 }}>{statusLabel.text}</span>
          </div>

          <button onClick={toggle} title="Alternar tema"
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {isDark ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color={T.muted} />}
          </button>

          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: T.sub, fontSize: 12, fontWeight: 600, transition: 'all .15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.sub; }}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </nav>

      {/* ── Banners ── */}
      {ausente && naFila && (
        <div style={{ background: 'rgba(16,185,129,.06)', borderBottom: '1px solid rgba(16,185,129,.15)', padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulseDot 2s ease infinite' }} />
          <span style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Você está na fila e disponível — aguardando próxima cliente.</span>
        </div>
      )}
      {ausente && !naFila && statusFuncionaria !== 'EM_ATENDIMENTO' && (
        <div style={{ background: 'rgba(245,158,11,.06)', borderBottom: `1px solid rgba(245,158,11,.15)`, padding: '9px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Coffee size={13} color={T.primaryDark} />
          <span style={{ fontSize: 13, color: T.primaryDark, fontWeight: 600 }}>Você está ausente — volte para esta aba.</span>
        </div>
      )}
      {msg.text && (
        <div style={{ padding: '9px 20px', background: msg.type === 'error' ? 'rgba(239,68,68,.08)' : msg.type === 'warning' ? 'rgba(245,158,11,.08)' : msg.type === 'info' ? 'rgba(96,165,250,.08)' : 'rgba(16,185,129,.08)', borderBottom: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,.2)' : msg.type === 'warning' ? 'rgba(245,158,11,.2)' : msg.type === 'info' ? 'rgba(96,165,250,.2)' : 'rgba(16,185,129,.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 13, color: msg.type === 'error' ? '#EF4444' : msg.type === 'warning' ? T.primaryDark : msg.type === 'info' ? '#60A5FA' : '#10B981', fontWeight: 500 }}>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex', padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* ── Conteúdo ── */}
      <div style={{ padding: '20px 16px 32px', maxWidth: 480, margin: '0 auto' }}>

        {/* ── Stats do dia ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { Icon: CheckCircle2, label: 'Hoje',      value: String(meusFinalizados.length), color: '#10b981', bg: 'rgba(16,185,129,.1)'  },
            { Icon: DollarSign,   label: 'Ganhos',    value: fmt(ganhosHoje),                color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
            { Icon: Timer,        label: 'Tempo médio', value: temposMedioMin > 0 ? fmtMin(temposMedioMin) : '—', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
          ].map(({ Icon, label, value, color, bg }) => (
            <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 10px', textAlign: 'center', boxShadow: T.shadow }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                <Icon size={14} color={color} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.fg, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Card de atendimento atual ── */}
        {meuAtendimento ? (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `3px solid #10b981`, borderRadius: 14, padding: '20px', marginBottom: 16, boxShadow: T.shadow }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulseDot 2s ease infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.8px' }}>Em atendimento</span>
              </div>
              {meuAtendimento.iniciadoEm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted, background: T.card2, padding: '3px 10px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                  <Clock size={11} />
                  <TimerVivo iniciadoEm={meuAtendimento.iniciadoEm} />
                </div>
              )}
            </div>

            {/* Cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.25),rgba(217,119,6,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#d97706', flexShrink: 0, border: '2px solid rgba(245,158,11,.3)' }}>
                {meuAtendimento.cliente?.nome?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.fg }}>{meuAtendimento.cliente?.nome}</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
                  Comanda <span style={{ color: '#f59e0b', fontWeight: 700 }}>#{meuAtendimento.numeroComanda}</span>
                </div>
              </div>
            </div>

            {/* Detalhes: serviço + cadeira + valor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {/* Serviço */}
              {serviceInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.card2, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: serviceInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <serviceInfo.Icon size={15} color={serviceInfo.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.5px' }}>Serviço</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{meuAtendimento.servicoNome || serviceInfo.label}</div>
                  </div>
                  {meuAtendimento.servicoPreco != null && (
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>{fmt(meuAtendimento.servicoPreco)}</div>
                  )}
                </div>
              )}

              {/* Cadeira */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.card2, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Armchair size={15} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.5px' }}>Cadeira</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>
                    {meuAtendimento.cadeira
                      ? `${meuAtendimento.cadeira.nome || `Cadeira ${meuAtendimento.cadeira.numero}`}`
                      : <span style={{ color: T.sub, fontSize: 13 }}>Não atribuída</span>
                    }
                  </div>
                </div>
                {meuAtendimento.cadeira && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,.15)', border: '2px solid rgba(245,158,11,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#d97706', flexShrink: 0 }}>
                    {meuAtendimento.cadeira.numero}
                  </div>
                )}
              </div>
            </div>

            {/* Botão finalizar */}
            <button onClick={finalizarAtendimento} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? .7 : 1, boxShadow: '0 4px 16px rgba(16,185,129,.25)', transition: 'all .15s' }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,.35)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,.25)'; }}>
              <CheckCircle2 size={18} /> Finalizar atendimento
            </button>
          </div>
        ) : (
          /* Card vazio */
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '28px 20px', marginBottom: 16, textAlign: 'center', boxShadow: T.shadow }}>
            <div style={{ width: 56, height: 56, background: T.card2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `1px solid ${T.border}` }}>
              <Clock size={26} color={T.sub} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 5, color: T.fg }}>Nenhum atendimento</p>
            <p style={{ color: T.muted, fontSize: 14 }}>
              {naFila ? 'Na fila — aguardando próxima cliente.' : 'Entre na fila para receber atendimentos.'}
            </p>
          </div>
        )}

        {/* ── Botão entrar/sair da fila ── */}
        {!meuAtendimento && (
          <button onClick={toggleFila} disabled={loading}
            style={{ width: '100%', padding: '15px', borderRadius: 12, background: naFila ? T.card : `linear-gradient(135deg,#f59e0b,#d97706)`, color: naFila ? T.fg : '#000', fontSize: 15, fontWeight: 700, border: naFila ? `1.5px solid ${T.border}` : 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, opacity: loading ? .7 : 1, boxShadow: naFila ? 'none' : '0 4px 20px rgba(245,158,11,.3)', transition: 'all .15s' }}
            onMouseEnter={e => { if (!loading && !naFila) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = naFila ? 'none' : '0 4px 20px rgba(245,158,11,.3)'; }}>
            {loading ? 'Aguarde…' : naFila ? <><PauseCircle size={18} /> Sair da fila</> : <><PlayCircle size={18} /> Entrar na fila</>}
          </button>
        )}

        {/* ── Posição na fila ── */}
        {naFila && !meuAtendimento && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px', marginBottom: 16, boxShadow: T.shadow }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 12 }}>Posição na fila</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {minhasEspecialidades.map(esp => {
                const info = SERVICE_INFO[esp];
                if (!info) return null;
                const filaEsp = [...estado.filas].filter(f => f.especialidade === esp).sort((a, b) => new Date(a.entradaEm) - new Date(b.entradaEm));
                const posicao = filaEsp.findIndex(f => f.funcionariaId === funcionariaId) + 1;
                if (posicao === 0) return null;
                const isPrimeira = posicao === 1;
                return (
                  <div key={esp} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: isPrimeira ? 'rgba(16,185,129,.06)' : T.card2, border: `1px solid ${isPrimeira ? 'rgba(16,185,129,.2)' : T.border}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: isPrimeira ? 'rgba(16,185,129,.15)' : info.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: isPrimeira ? '#10B981' : info.color, fontFamily: "'Poppins', sans-serif" }}>
                      {posicao}°
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <info.Icon size={13} color={info.color} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: T.fg }}>{info.label}</span>
                        {isPrimeira && <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.12)', padding: '1px 7px', borderRadius: 10 }}>Próxima</span>}
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                        {isPrimeira ? 'Você será a próxima a atender' : `${posicao - 1} na sua frente · ${filaEsp.length} total`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Especialidades ── */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px', boxShadow: T.shadow }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 12 }}>Minhas especialidades</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minhasEspecialidades.map(esp => {
              const info = SERVICE_INFO[esp];
              if (!info) return null;
              return (
                <span key={esp} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: info.dim, color: info.color, fontSize: 13, fontWeight: 600, border: `1px solid ${info.color}25` }}>
                  <info.Icon size={13} /> {info.label}
                </span>
              );
            })}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes ring {
          0%,100%{transform:rotate(0deg);box-shadow:0 8px 32px rgba(245,158,11,.4)}
          20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)}
          60%{transform:rotate(-4deg)} 80%{transform:rotate(4deg);box-shadow:0 8px 40px rgba(245,158,11,.6)}
        }
      `}</style>
    </div>
  );
}
