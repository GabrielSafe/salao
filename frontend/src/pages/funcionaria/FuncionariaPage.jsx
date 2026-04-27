import { useState, useCallback, useEffect, useRef } from 'react';
import { LogOut, PlayCircle, PauseCircle, CheckCircle2, Scissors, Sparkles, Hand, Leaf, Clock, Coffee, X, Check } from 'lucide-react';
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

const TIMEOUT_SEGUNDOS = 60;

function tocarAlerta() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 200, 400].forEach((delay) => {
      const osc  = ctx.createOscillator();
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

// ── Modal de Proposta ──────────────────────────────────────────────────────
function ModalProposta({ proposta, onAceitar, onRecusar }) {
  const [segundos, setSegundos] = useState(TIMEOUT_SEGUNDOS);
  const info = SERVICE_INFO[proposta.tipoServico];

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  const pct = (segundos / TIMEOUT_SEGUNDOS) * 100;
  const corBarra = segundos > 20 ? '#10B981' : segundos > 10 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'fadeIn .2s ease',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 24, padding: '32px 28px',
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,.5)',
        animation: 'fadeInScale .25s ease',
      }}>
        {/* Ícone animado */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E85D04, #D4178A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(212,23,138,.4)',
          animation: 'ring 1s ease infinite',
        }}>
          <span style={{ fontSize: 32 }}>🔔</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A4A', marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>
          Nova solicitação!
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>
          Uma cliente está esperando por você
        </p>

        {/* Info da cliente */}
        <div style={{ background: '#F4F3F1', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.3), rgba(232,93,4,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1B2A4A', flexShrink: 0 }}>
              {proposta.cliente?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>{proposta.cliente?.nome}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {info && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: info.bg }}>
                    <info.Icon size={13} color={info.color} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</span>
                  </div>
                )}
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>Comanda #{proposta.numeroComanda}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Responda em:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: corBarra, fontFamily: "'Poppins', sans-serif" }}>
              {segundos}s
            </span>
          </div>
          <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${pct}%`,
              background: corBarra,
              transition: 'width 1s linear, background .3s',
            }} />
          </div>
          {segundos === 0 && (
            <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
              Tempo esgotado — você foi para o final da fila
            </p>
          )}
        </div>

        {/* Botões */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={onRecusar}
            style={{ padding: '12px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = '#F9FAFB'; }}
          >
            <X size={16} /> Recusar
          </button>
          <button
            onClick={onAceitar}
            style={{ padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E85D04, #D4178A)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px rgba(212,23,138,.35)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,23,138,.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,23,138,.35)'; }}
          >
            <Check size={16} /> Aceitar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn      { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeInScale { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
        @keyframes ring {
          0%,100% { transform: rotate(0deg); box-shadow: 0 8px 32px rgba(212,23,138,.4); }
          20%     { transform: rotate(-8deg); }
          40%     { transform: rotate(8deg); }
          60%     { transform: rotate(-4deg); }
          80%     { transform: rotate(4deg); box-shadow: 0 8px 40px rgba(212,23,138,.6); }
        }
      `}</style>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const [estado, setEstado]         = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState({ text: '', type: '' });
  const [ausente, setAusente]       = useState(false);
  const [proposta, setProposta]     = useState(null);
  const propostaRef = useRef(null);

  const salaoId       = usuario?.salaoId;
  const funcionariaId = usuario?.funcionaria?.id;

  // Solicita permissão de notificação
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Detecta aba minimizada/em foco
  useEffect(() => {
    async function handleVisibility() {
      const hidden = document.hidden;
      setAusente(hidden);
      try { await api.patch('/status/presenca', { ausente: hidden }); } catch {}
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const onEstadoCompleto = useCallback((dados) => {
    setEstado(dados);
    const minhasEntradas = dados.filas?.filter(f => f.funcionariaId === funcionariaId);
    setNaFila(minhasEntradas?.length > 0);
  }, [funcionariaId]);

  // Recebe proposta de atendimento
  const onPropostaAtendimento = useCallback((atendimento) => {
    propostaRef.current = atendimento;
    setProposta(atendimento);
    tocarAlerta();

    // Flash no título
    let count = 0;
    const orig = document.title;
    const timer = setInterval(() => {
      document.title = count % 2 === 0 ? '🔔 Nova cliente!' : orig;
      if (++count > 14) { clearInterval(timer); document.title = orig; }
    }, 600);

    // Notificação do navegador
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Nova cliente!', {
        body: `${atendimento.cliente?.nome} — ${SERVICE_INFO[atendimento.tipoServico]?.label}`,
        requireInteraction: true,
      });
    }

    // Auto-fechar modal após 10s (timeout do backend já cuida da lógica, aqui só limpa o modal)
    setTimeout(() => {
      setProposta(p => p?.id === atendimento.id ? null : p);
    }, (TIMEOUT_SEGUNDOS + 1) * 1000);
  }, []);

  useSocket(salaoId, { onEstadoCompleto, onPropostaAtendimento });

  const meuAtendimento = estado.atendimentos.find(
    a => a.funcionariaId === funcionariaId && a.status === 'EM_ATENDIMENTO'
  );
  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria    = estado.funcionarias.find(f => f.id === funcionariaId)?.status || 'ONLINE';

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  }

  async function handleAceitar() {
    if (!proposta) return;
    setProposta(null);
    try {
      await api.post(`/atendimentos/${proposta.id}/aceitar`);
    } catch (err) {
      showMsg(err.response?.data?.erro || 'Erro ao aceitar', 'error');
    }
  }

  async function handleRecusar() {
    if (!proposta) return;
    const id = proposta.id;
    setProposta(null);
    try {
      await api.post(`/atendimentos/${id}/recusar`);
      showMsg('Você foi para o final da fila.', 'info');
    } catch (err) {
      showMsg(err.response?.data?.erro || 'Erro ao recusar', 'error');
    }
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
    try {
      await api.patch(`/atendimentos/${meuAtendimento.id}/finalizar`);
      showMsg('Atendimento finalizado!', 'success');
    } catch (err) { showMsg(err.response?.data?.erro || 'Erro', 'error'); }
    finally { setLoading(false); }
  }

  const serviceInfo = meuAtendimento ? SERVICE_INFO[meuAtendimento.tipoServico] : null;
  const statusLabel = statusFuncionaria === 'EM_ATENDIMENTO'
    ? { text: 'Em atendimento', color: '#F59E0B' }
    : statusFuncionaria === 'AUSENTE' || ausente
    ? { text: 'Ausente',        color: '#9CA3AF' }
    : naFila
    ? { text: 'Na fila',        color: 'var(--success)' }
    : { text: 'Disponível',     color: 'var(--text-3)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Modal de proposta */}
      {proposta && (
        <ModalProposta
          proposta={proposta}
          onAceitar={handleAceitar}
          onRecusar={handleRecusar}
        />
      )}

      {/* Header */}
      <nav style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logo} alt="Rápido Beauty" style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ausente && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(156,163,175,.15)', border: '1px solid rgba(156,163,175,.25)', padding: '4px 10px', borderRadius: 20 }}>
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

      {/* Banner ausente */}
      {ausente && (
        <div style={{ background: 'rgba(245,158,11,.08)', borderBottom: '1px solid rgba(245,158,11,.2)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Coffee size={14} color="#D97706" />
          <span style={{ fontSize: 13, color: '#D97706' }}>
            Você está <strong>ausente</strong>. Volte para esta aba para ficar online.
          </span>
        </div>
      )}

      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        {msg.text && (
          <div className={msg.type === 'error' ? 'alert-error' : msg.type === 'info' ? 'alert-info' : 'alert-success'} style={{ marginBottom: 16, fontSize: 13 }}>
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
            <button className="btn btn-success btn-lg" style={{ width: '100%' }} onClick={finalizarAtendimento} disabled={loading}>
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
              {naFila ? 'Na fila — aguardando próxima cliente.' : 'Entre na fila para receber atendimentos.'}
            </p>
          </div>
        )}

        {!meuAtendimento && (
          <button className={`btn btn-lg ${naFila ? 'btn-secondary' : 'btn-primary'}`} style={{ width: '100%', marginBottom: 16 }} onClick={toggleFila} disabled={loading}>
            {naFila ? <><PauseCircle size={18} /> Sair da fila</> : <><PlayCircle size={18} /> Entrar na fila</>}
          </button>
        )}

        {/* Posição na fila */}
        {naFila && !meuAtendimento && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sua posição na fila
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {minhasEspecialidades.map(esp => {
                const info = SERVICE_INFO[esp];
                if (!info) return null;

                // Ordena entradas desta especialidade por tempo de entrada
                const filaEsp = [...estado.filas]
                  .filter(f => f.especialidade === esp)
                  .sort((a, b) => new Date(a.entradaEm) - new Date(b.entradaEm));

                const posicao = filaEsp.findIndex(f => f.funcionariaId === funcionariaId) + 1;
                if (posicao === 0) return null; // não está nesta fila

                const isPrimeira = posicao === 1;
                const totalNaFila = filaEsp.length;

                return (
                  <div key={esp} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10,
                    background: isPrimeira ? 'rgba(16,163,74,.06)' : 'var(--bg-elevated)',
                    border: `1px solid ${isPrimeira ? 'rgba(22,163,74,.2)' : 'var(--border)'}`,
                  }}>
                    {/* Posição */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: isPrimeira ? 'rgba(22,163,74,.15)' : info.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 800,
                      color: isPrimeira ? 'var(--success)' : info.color,
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      {posicao}°
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <info.Icon size={14} color={info.color} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{info.label}</span>
                        {isPrimeira && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', background: 'rgba(22,163,74,.12)', padding: '1px 7px', borderRadius: 10 }}>
                            Próxima
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                        {isPrimeira
                          ? 'Você será a próxima a atender'
                          : `${posicao - 1} pessoa${posicao - 1 > 1 ? 's' : ''} na sua frente · ${totalNaFila} na fila`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Minhas especialidades</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minhasEspecialidades.map(esp => {
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
      </div>
    </div>
  );
}
