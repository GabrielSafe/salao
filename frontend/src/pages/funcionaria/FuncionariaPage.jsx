import { useState, useCallback, useEffect, useRef } from 'react';
import { LogOut, PlayCircle, PauseCircle, CheckCircle2, Scissors, Sparkles, Hand, Leaf, Clock, Coffee } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import logo from '../../public/logo.png';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)' },
};

// Gera um beep de alerta via Web Audio API
function tocarAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 150, 300].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.3);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.3);
    });
  } catch {}
}

// Pisca o título da aba
function piscarTitulo(mensagem) {
  let original = document.title;
  let count = 0;
  const timer = setInterval(() => {
    document.title = count % 2 === 0 ? `🔔 ${mensagem}` : original;
    count++;
    if (count > 12) { clearInterval(timer); document.title = original; }
  }, 600);
  return timer;
}

// Envia notificação do navegador
function notificarNavegador(titulo, corpo) {
  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: corpo,
      icon: '/src/public/icon.png',
      badge: '/src/public/icon.png',
      requireInteraction: true,
    });
  }
}

export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [ausente, setAusente] = useState(false);
  const tituloTimer = useRef(null);

  const salaoId = usuario?.salaoId;
  const funcionariaId = usuario?.funcionaria?.id;

  // Solicita permissão de notificação ao carregar
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Detecta visibilidade da aba (minimizada / em foco)
  useEffect(() => {
    async function handleVisibility() {
      const hidden = document.hidden;
      setAusente(hidden);
      try {
        await api.patch('/status/presenca', { ausente: hidden });
      } catch {}
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const onEstadoCompleto = useCallback((dados) => {
    setEstado(dados);
    const minhasEntradas = dados.filas?.filter((f) => f.funcionariaId === funcionariaId);
    setNaFila(minhasEntradas?.length > 0);
  }, [funcionariaId]);

  // Alerta quando recebe novo atendimento
  const onNovoAtendimento = useCallback((atendimento) => {
    if (tituloTimer.current) clearInterval(tituloTimer.current);

    const servico = SERVICE_INFO[atendimento.tipoServico]?.label || 'Serviço';
    const cliente = atendimento.cliente?.nome || 'Cliente';
    const mensagem = `${cliente} — ${servico}`;

    tocarAlerta();
    tituloTimer.current = piscarTitulo('Nova cliente!');
    notificarNavegador('🔔 Nova cliente!', mensagem);

    showMsg(`Nova cliente: ${mensagem}`, 'success');
  }, []);

  useSocket(salaoId, { onEstadoCompleto, onNovoAtendimento });

  const meuAtendimento = estado.atendimentos.find(
    (a) => a.funcionariaId === funcionariaId && a.status === 'EM_ATENDIMENTO'
  );

  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria = estado.funcionarias.find((f) => f.id === funcionariaId)?.status || 'ONLINE';

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  }

  async function toggleFila() {
    setLoading(true);
    try {
      if (naFila) {
        await api.post('/fila/sair');
        showMsg('Você saiu da fila.', 'info');
      } else {
        await api.post('/fila/entrar');
        showMsg('Você entrou na fila!', 'success');
      }
    } catch (err) {
      showMsg(err.response?.data?.erro || 'Erro', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function finalizarAtendimento() {
    if (!meuAtendimento) return;
    setLoading(true);
    try {
      await api.patch(`/atendimentos/${meuAtendimento.id}/finalizar`);
      showMsg('Atendimento finalizado!', 'success');
    } catch (err) {
      showMsg(err.response?.data?.erro || 'Erro', 'error');
    } finally {
      setLoading(false);
    }
  }

  const serviceInfo = meuAtendimento ? SERVICE_INFO[meuAtendimento.tipoServico] : null;

  const statusLabel = statusFuncionaria === 'EM_ATENDIMENTO'
    ? { text: 'Em atendimento', color: '#F59E0B' }
    : statusFuncionaria === 'AUSENTE'
    ? { text: 'Ausente', color: '#9CA3AF' }
    : naFila
    ? { text: 'Na fila', color: 'var(--success)' }
    : { text: 'Disponível', color: 'var(--text-3)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <nav style={{
        background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="Rápido Beauty" style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Badge de ausente */}
          {ausente && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(156,163,175,.15)', border: '1px solid rgba(156,163,175,.3)', padding: '4px 10px', borderRadius: 20 }}>
              <Coffee size={13} color="#9CA3AF" />
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Ausente</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,.06)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusLabel.color }} />
            <span style={{ fontSize: 12, color: statusLabel.color, fontWeight: 600 }}>{statusLabel.text}</span>
          </div>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{usuario?.nome}</span>

          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ gap: 6, color: 'rgba(255,255,255,.6)' }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </nav>

      {/* Banner de ausente */}
      {ausente && (
        <div style={{
          background: 'rgba(245,158,11,.1)', borderBottom: '1px solid rgba(245,158,11,.2)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Coffee size={15} color="#D97706" />
          <span style={{ fontSize: 13, color: '#D97706', fontWeight: 500 }}>
            Você está marcada como <strong>ausente</strong>. Volte para a aba para ficar online novamente.
          </span>
        </div>
      )}

      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        {msg.text && (
          <div
            className={msg.type === 'error' ? 'alert-error' : msg.type === 'info' ? 'alert-info' : 'alert-success'}
            style={{ marginBottom: 16, fontSize: 13 }}
          >
            {msg.text}
          </div>
        )}

        {/* Atendimento atual */}
        {meuAtendimento ? (
          <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atendimento atual</span>
              <span className="badge badge-em_atendimento">Em andamento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              {serviceInfo && (
                <div style={{ width: 56, height: 56, borderRadius: 14, background: serviceInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <serviceInfo.Icon size={26} color={serviceInfo.color} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{meuAtendimento.cliente?.nome}</div>
                <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 3 }}>
                  {serviceInfo?.label} · Comanda <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#{meuAtendimento.numeroComanda}</span>
                </div>
              </div>
            </div>
            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%' }}
              onClick={finalizarAtendimento}
              disabled={loading}
            >
              <CheckCircle2 size={18} /> Finalizar atendimento
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: 32 }}>
            <div style={{ width: 60, height: 60, background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Clock size={28} color="var(--text-3)" />
            </div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Nenhum atendimento</p>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
              {naFila ? 'Você está na fila, aguardando próxima cliente.' : 'Entre na fila para receber atendimentos.'}
            </p>
          </div>
        )}

        {/* Botão fila */}
        {!meuAtendimento && (
          <button
            className={`btn btn-lg ${naFila ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', marginBottom: 16 }}
            onClick={toggleFila}
            disabled={loading}
          >
            {naFila
              ? <><PauseCircle size={18} /> Sair da fila</>
              : <><PlayCircle size={18} /> Entrar na fila</>
            }
          </button>
        )}

        {/* Especialidades */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minhas especialidades</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minhasEspecialidades.map((esp) => {
              const info = SERVICE_INFO[esp];
              if (!info) return null;
              return (
                <span key={esp} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: info.bg, color: info.color, fontSize: 13, fontWeight: 500 }}>
                  <info.Icon size={13} /> {info.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Aviso sobre notificações */}
        {Notification.permission === 'denied' && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,.2)', fontSize: 12, color: '#D97706' }}>
            ⚠ Notificações bloqueadas. Ative nas configurações do navegador para receber alertas quando estiver ausente.
          </div>
        )}
      </div>
    </div>
  );
}
