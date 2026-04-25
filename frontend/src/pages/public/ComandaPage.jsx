import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const SERVICO_INFO = {
  CABELO: { label: 'Cabelo', icon: '✂️' },
  MAQUIAGEM: { label: 'Maquiagem', icon: '💄' },
  MAO: { label: 'Mão', icon: '💅' },
  PE: { label: 'Pé', icon: '🦶' },
};

const STATUS_INFO = {
  AGUARDANDO: { label: 'Aguardando...', cor: '#f59e0b', bg: '#fef3c7' },
  EM_ATENDIMENTO: { label: 'Em atendimento!', cor: '#16a34a', bg: '#dcfce7' },
  FINALIZADO: { label: 'Finalizado ✓', cor: '#0369a1', bg: '#e0f2fe' },
  CANCELADO: { label: 'Cancelado', cor: '#dc2626', bg: '#fee2e2' },
};

export default function ComandaPage() {
  const { salaoSlug, numero } = useParams();
  const location = useLocation();
  const [dados, setDados] = useState(null);
  const [salaoId, setSalaoId] = useState(location.state?.salaoId);

  const carregarDados = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/publico/${salaoSlug}/comanda/${numero}`);
      setDados(data);
      if (!salaoId) setSalaoId(data.salao?.id);
    } catch {}
  }, [salaoSlug, numero]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  useEffect(() => {
    if (!salaoId) return;
    const socket = io('/');
    const clienteId = location.state?.clienteId;
    socket.on('connect', () => {
      socket.emit('entrar_sala_salao', { salaoId, clienteId });
    });
    socket.on('estado_completo', () => carregarDados());
    socket.on('atendimento_atualizado', () => carregarDados());
    return () => socket.disconnect();
  }, [salaoId, carregarDados]);

  if (!dados) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fce4f3 0%, #f5f5f5 100%)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const { salao, atendimentos } = dados;
  const todosFinalizados = atendimentos.length > 0 && atendimentos.every((a) => a.status === 'FINALIZADO');
  const clienteNome = atendimentos[0]?.cliente?.nome;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4f3 0%, #f5f5f5 100%)', padding: '20px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>💇‍♀️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--rosa)' }}>{salao.nome}</h1>
          {clienteNome && <p style={{ color: 'var(--texto-suave)', fontSize: 14, marginTop: 4 }}>Olá, {clienteNome}!</p>}
        </div>

        {/* Número da comanda */}
        <div className="card" style={{ textAlign: 'center', marginBottom: 16, background: 'var(--rosa)', color: '#fff' }}>
          <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Sua comanda</p>
          <p style={{ fontSize: 48, fontWeight: 700, lineHeight: 1 }}>#{numero}</p>
          {todosFinalizados && (
            <p style={{ marginTop: 8, fontSize: 14, fontWeight: 500 }}>Atendimento concluído! Obrigada 💕</p>
          )}
        </div>

        {/* Atendimentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {atendimentos.map((a) => {
            const info = SERVICO_INFO[a.tipoServico] || {};
            const statusInfo = STATUS_INFO[a.status] || {};
            const nomeFuncionaria = a.funcionaria?.usuario?.nome;

            return (
              <div key={a.id} className="card" style={{ borderLeft: `4px solid ${statusInfo.cor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{info.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{info.label}</div>
                    {nomeFuncionaria && (
                      <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginTop: 2 }}>
                        {a.status === 'EM_ATENDIMENTO' ? `com ${nomeFuncionaria}` : `atendida por ${nomeFuncionaria}`}
                      </div>
                    )}
                  </div>
                  <span style={{ background: statusInfo.bg, color: statusInfo.cor, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {statusInfo.label}
                  </span>
                </div>

                {a.status === 'AGUARDANDO' && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef9c3', borderRadius: 8, fontSize: 13, color: '#854d0e' }}>
                    ⏳ Aguardando uma profissional disponível...
                  </div>
                )}

                {a.status === 'EM_ATENDIMENTO' && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#dcfce7', borderRadius: 8, fontSize: 13, color: '#166534' }}>
                    ✅ {nomeFuncionaria} está te esperando!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--texto-suave)', marginTop: 20 }}>
          Atualização automática em tempo real
        </p>
      </div>
    </div>
  );
}
