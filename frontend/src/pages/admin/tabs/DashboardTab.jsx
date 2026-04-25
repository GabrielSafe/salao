import { useState, useCallback } from 'react';
import { Clock, Zap, UserCheck, UserX, Scissors, Sparkles, Hand, Leaf } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';

const SERVICE_ICON = { CABELO: Scissors, MAQUIAGEM: Sparkles, MAO: Hand, PE: Leaf };
const SERVICE_LABEL = { CABELO: 'Cabelo', MAQUIAGEM: 'Maquiagem', MAO: 'Mão', PE: 'Pé' };
const SERVICE_COLOR = { CABELO: '#C084FC', MAQUIAGEM: '#F472B6', MAO: '#FB923C', PE: '#4ADE80' };
const SERVICE_BG = { CABELO: 'rgba(168,85,247,.12)', MAQUIAGEM: 'rgba(236,72,153,.12)', MAO: 'rgba(251,146,60,.12)', PE: 'rgba(34,197,94,.12)' };

function StatusDot({ status }) {
  const cls = status === 'ONLINE' ? 'online' : status === 'EM_ATENDIMENTO' ? 'em_atendimento' : 'offline';
  return <span className={`status-dot ${cls}`} />;
}

export default function DashboardTab() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const aguardando  = estado.atendimentos.filter((a) => a.status === 'AGUARDANDO');
  const emAndamento = estado.atendimentos.filter((a) => a.status === 'EM_ATENDIMENTO');
  const disponíveis = estado.funcionarias.filter((f) => f.status === 'ONLINE');
  const ocupadas    = estado.funcionarias.filter((f) => f.status === 'EM_ATENDIMENTO');

  const kpis = [
    { label: 'Aguardando',     valor: aguardando.length,  Icon: Clock,      color: 'var(--accent)',   bg: 'var(--accent-dim)' },
    { label: 'Em atendimento', valor: emAndamento.length, Icon: Zap,        color: 'var(--success)',  bg: 'var(--success-dim)' },
    { label: 'Disponíveis',    valor: disponíveis.length, Icon: UserCheck,  color: 'var(--blue)',     bg: 'var(--blue-dim)' },
    { label: 'Ocupadas',       valor: ocupadas.length,    Icon: UserX,      color: '#F472B6',         bg: 'rgba(244,114,182,.12)' },
  ];

  const ativos = estado.atendimentos.filter((a) => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Acompanhe o salão em tempo real</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,.2)',
          padding: '6px 12px', borderRadius: 20,
        }}>
          <span className="status-dot online" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Ao vivo</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {kpis.map(({ label, valor, Icon, color, bg }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}>
              <Icon size={18} color={color} />
            </div>
            <div className="kpi-value" style={{ color }}>{valor}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Atendimentos ativos */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Atendimentos ativos
          </h3>
          {ativos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
              Nenhum atendimento no momento
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ativos.map((a) => {
                const Icon = SERVICE_ICON[a.tipoServico] || Scissors;
                const cor = SERVICE_COLOR[a.tipoServico];
                const bg = SERVICE_BG[a.tipoServico];
                return (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: 'var(--bg-elevated)',
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={cor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        #{a.numeroComanda} · {a.cliente?.nome}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
                        {SERVICE_LABEL[a.tipoServico]}{a.funcionaria && ` · ${a.funcionaria.usuario?.nome}`}
                      </div>
                    </div>
                    <span className={`badge badge-${a.status.toLowerCase()}`}>
                      {a.status === 'AGUARDANDO' ? 'Fila' : 'Ativo'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Equipe */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Status da equipe
          </h3>
          {estado.funcionarias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
              Nenhuma funcionária cadastrada
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {estado.funcionarias.map((f) => {
                const atendAtual = estado.atendimentos.find((a) => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
                const nasFilas = estado.filas.filter((fi) => fi.funcionariaId === f.id);
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: 'var(--bg-elevated)',
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}>
                    <StatusDot status={f.status} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{f.usuario?.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 1 }}>
                        {f.status === 'EM_ATENDIMENTO' && atendAtual
                          ? `Atendendo ${atendAtual.cliente?.nome}`
                          : f.status === 'ONLINE' && nasFilas.length > 0
                          ? `Na fila (${nasFilas.length} serviço${nasFilas.length > 1 ? 's' : ''})`
                          : f.status === 'OFFLINE' ? 'Offline' : 'Disponível'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: f.status === 'ONLINE' ? 'var(--success-dim)' : f.status === 'EM_ATENDIMENTO' ? 'var(--accent-dim)' : 'rgba(255,255,255,.06)',
                      color: f.status === 'ONLINE' ? 'var(--success)' : f.status === 'EM_ATENDIMENTO' ? 'var(--accent)' : 'var(--text-3)',
                    }}>
                      {f.status === 'EM_ATENDIMENTO' ? 'Ocupada' : f.status === 'ONLINE' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
