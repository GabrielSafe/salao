import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const SERVICO_INFO = {
  CABELO: { label: 'Cabelo', icon: '✂️' },
  MAQUIAGEM: { label: 'Maquiagem', icon: '💄' },
  MAO: { label: 'Mão', icon: '💅' },
  PE: { label: 'Pé', icon: '🦶' },
};

export default function FuncionariaPage() {
  const { usuario, logout } = useAuth();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [naFila, setNaFila] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

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

  async function toggleFila() {
    setLoading(true);
    setMsg('');
    try {
      if (naFila) {
        await api.post('/fila/sair');
        setMsg('Você saiu da fila.');
      } else {
        await api.post('/fila/entrar');
        setMsg('Você entrou na fila!');
      }
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function finalizarAtendimento() {
    if (!meuAtendimento) return;
    setLoading(true);
    try {
      await api.patch(`/atendimentos/${meuAtendimento.id}/finalizar`);
      setMsg('Atendimento finalizado!');
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  const minhasEspecialidades = usuario?.funcionaria?.especialidades || [];
  const statusFuncionaria = estado.funcionarias.find((f) => f.id === funcionariaId)?.status || 'ONLINE';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cinza-bg)' }}>
      {/* Navbar */}
      <nav style={{ background: 'var(--rosa)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>💇‍♀️ {usuario?.nome}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
            {minhasEspecialidades.map((e) => SERVICO_INFO[e]?.icon).join(' ')}
            {' '}
            {statusFuncionaria === 'EM_ATENDIMENTO' ? '🔴 Em atendimento' : naFila ? '🟢 Na fila' : '⚪ Disponível'}
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>
          Sair
        </button>
      </nav>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>

        {msg && (
          <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
            {msg}
          </div>
        )}

        {/* Atendimento atual */}
        {meuAtendimento ? (
          <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--verde)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16 }}>Atendimento atual</h2>
              <span className="badge badge-em_atendimento">Em andamento</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>{SERVICO_INFO[meuAtendimento.tipoServico]?.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{meuAtendimento.cliente?.nome}</div>
                <div style={{ color: 'var(--texto-suave)', fontSize: 14 }}>
                  {SERVICO_INFO[meuAtendimento.tipoServico]?.label} · Comanda #{meuAtendimento.numeroComanda}
                </div>
              </div>
            </div>
            <button className="btn btn-success" style={{ width: '100%', padding: '12px' }} onClick={finalizarAtendimento} disabled={loading}>
              ✓ Finalizar atendimento
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⏳</div>
            <p style={{ fontWeight: 600, fontSize: 16 }}>Nenhum atendimento no momento</p>
            <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginTop: 4 }}>
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
            {naFila ? '⏸ Sair da fila' : '▶ Entrar na fila'}
          </button>
        )}

        {/* Especialidades */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Minhas especialidades</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {minhasEspecialidades.map((esp) => (
              <span key={esp} className={`tag-servico tag-${esp}`}>
                {SERVICO_INFO[esp]?.icon} {SERVICO_INFO[esp]?.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
