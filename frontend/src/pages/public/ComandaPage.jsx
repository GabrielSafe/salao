import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Scissors, Sparkles, Hand, Leaf, Clock, CheckCircle2, XCircle, User } from 'lucide-react';
import logo from '../../public/logo.png';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
};

const STATUS_INFO = {
  AGUARDANDO:      { label: 'Aguardando...', Icon: Clock,         color: 'var(--accent)',  bg: 'var(--accent-dim)' },
  EM_ATENDIMENTO:  { label: 'Em atendimento', Icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-dim)' },
  FINALIZADO:      { label: 'Finalizado',    Icon: CheckCircle2,  color: 'var(--blue)',    bg: 'var(--blue-dim)' },
  CANCELADO:       { label: 'Cancelado',     Icon: XCircle,       color: 'var(--error)',   bg: 'var(--error-dim)' },
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
    socket.on('connect', () => socket.emit('entrar_sala_salao', { salaoId, clienteId }));
    socket.on('estado_completo', () => carregarDados());
    socket.on('atendimento_atualizado', () => carregarDados());
    return () => socket.disconnect();
  }, [salaoId, carregarDados]);

  if (!dados) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #FDF5FA 0%, #F5EEF8 50%, #EEF2F8 100%)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const { salao, atendimentos } = dados;
  const todosFinalizados = atendimentos.length > 0 && atendimentos.every((a) => a.status === 'FINALIZADO');
  const clienteNome = atendimentos[0]?.cliente?.nome;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #FDF5FA 0%, #F5EEF8 50%, #EEF2F8 100%)', padding: '20px 16px' }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse, rgba(245,197,24,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logo} alt="Rápido Beauty" style={{ height: 50, width: 'auto', margin: '0 auto 12px', display: 'block' }} />
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>{salao.nome}</h1>
          {clienteNome && <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>Olá, {clienteNome}!</p>}
        </div>

        {/* Número da comanda */}
        <div style={{
          background: todosFinalizados ? 'var(--success-dim)' : 'var(--accent-dim)',
          border: `1px solid ${todosFinalizados ? 'rgba(34,197,94,.2)' : 'var(--accent-border)'}`,
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          padding: '20px',
          marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Sua comanda</p>
          <p style={{ fontSize: 52, fontWeight: 800, color: todosFinalizados ? 'var(--success)' : 'var(--accent)', lineHeight: 1, letterSpacing: '-2px' }}>#{numero}</p>
          {todosFinalizados && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>Atendimento concluído! Obrigada.</p>
            </div>
          )}
        </div>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          <span className="status-dot online" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Atualização automática em tempo real</span>
        </div>

        {/* Atendimentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {atendimentos.map((a) => {
            const svcInfo = SERVICE_INFO[a.tipoServico] || {};
            const stInfo = STATUS_INFO[a.status] || STATUS_INFO.AGUARDANDO;
            const nomeFuncionaria = a.funcionaria?.usuario?.nome;
            const SvcIcon = svcInfo.Icon;
            const StIcon = stInfo.Icon;

            return (
              <div key={a.id} className="card" style={{ border: `1px solid ${stInfo.bg === 'var(--accent-dim)' ? 'var(--accent-border)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {SvcIcon && (
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: svcInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SvcIcon size={20} color={svcInfo.color} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{svcInfo.label}</div>
                    {nomeFuncionaria && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
                        <User size={11} />
                        {a.status === 'EM_ATENDIMENTO' ? `com ${nomeFuncionaria}` : `atendida por ${nomeFuncionaria}`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 20, background: stInfo.bg, flexShrink: 0 }}>
                    {StIcon && <StIcon size={12} color={stInfo.color} />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: stInfo.color, whiteSpace: 'nowrap' }}>{stInfo.label}</span>
                  </div>
                </div>

                {a.status === 'AGUARDANDO' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="var(--accent)" />
                    Aguardando uma profissional disponível...
                  </div>
                )}
                {a.status === 'EM_ATENDIMENTO' && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--success-dim)', borderRadius: 8, fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(34,197,94,.15)' }}>
                    <CheckCircle2 size={13} />
                    {nomeFuncionaria} está te esperando!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
