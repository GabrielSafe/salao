import { useState, useCallback } from 'react';
import { LogOut, PlayCircle, PauseCircle, CheckCircle2, Scissors, Sparkles, Hand, Leaf, Clock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)' },
};

export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const salaoId = usuario?.salaoId;
  const funcionariaId = usuario?.funcionaria?.id;

  const onEstadoCompleto = useCallback((dados) => {
    setEstado(dados);
    const minhasEntradas = dados.filas?.filter((f) => f.funcionariaId === funcionariaId);
    setNaFila(minhasEntradas?.length > 0);
  }, [funcionariaId]);

  useSocket(salaoId, { onEstadoCompleto });

  const meuAtendimento = estado.atendimentos.find(
    (a) => a.funcionariaId === funcionariaId && a.status === 'EM_ATENDIMENTO'
  );

  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria = estado.funcionarias.find((f) => f.id === funcionariaId)?.status || 'ONLINE';

  function showMsg(text, type = 'success') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <nav style={{
        background: 'var(--nav-bg)', borderBottom: '1px solid var(--nav-border)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={18} color="#0A0A0A" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF' }}>{usuario?.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
              {statusFuncionaria === 'EM_ATENDIMENTO' ? (
                <span style={{ color: 'var(--accent)' }}>Em atendimento</span>
              ) : naFila ? (
                <span style={{ color: 'var(--success)' }}>Na fila</span>
              ) : (
                <span style={{ color: 'var(--text-3)' }}>Disponível</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <LogOut size={14} /> Sair
        </button>
      </nav>

      <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
        {msg.text && (
          <div className={msg.type === 'error' ? 'alert-error' : msg.type === 'info' ? 'alert-info' : 'alert-success'} style={{ marginBottom: 16, fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        {/* Atendimento atual */}
        {meuAtendimento ? (
          <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(34,197,94,.2)', background: 'var(--bg-card)' }}>
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
      </div>
    </div>
  );
}
