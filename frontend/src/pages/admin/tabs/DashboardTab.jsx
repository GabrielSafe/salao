import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';

const SERVICO_INFO = {
  CABELO: { label: 'Cabelo', icon: '✂️' },
  MAQUIAGEM: { label: 'Maquiagem', icon: '💄' },
  MAO: { label: 'Mão', icon: '💅' },
  PE: { label: 'Pé', icon: '🦶' },
};

export default function DashboardTab() {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const aguardando = estado.atendimentos.filter((a) => a.status === 'AGUARDANDO');
  const emAndamento = estado.atendimentos.filter((a) => a.status === 'EM_ATENDIMENTO');
  const disponíveis = estado.funcionarias.filter((f) => f.status === 'ONLINE');
  const emAtend = estado.funcionarias.filter((f) => f.status === 'EM_ATENDIMENTO');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Acompanhe o salão em tempo real</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Aguardando', valor: aguardando.length, cor: 'var(--amarelo)', icon: '⏳' },
          { label: 'Em atendimento', valor: emAndamento.length, cor: 'var(--verde)', icon: '✂️' },
          { label: 'Disponíveis', valor: disponíveis.length, cor: 'var(--azul)', icon: '👩' },
          { label: 'Ocupadas', valor: emAtend.length, cor: 'var(--rosa)', icon: '🔴' },
        ].map((kpi) => (
          <div key={kpi.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{kpi.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: kpi.cor }}>{kpi.valor}</div>
            <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Atendimentos ativos */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>⚡ Atendimentos ativos</h3>
          {estado.atendimentos.filter((a) => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status)).length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Nenhum atendimento no momento.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {estado.atendimentos
                .filter((a) => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status))
                .map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'var(--cinza-bg)', borderRadius: 8 }}>
                    <span style={{ fontSize: 22 }}>{SERVICO_INFO[a.tipoServico]?.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        #{a.numeroComanda} · {a.cliente?.nome}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
                        {SERVICO_INFO[a.tipoServico]?.label}
                        {a.funcionaria && ` · ${a.funcionaria.usuario?.nome}`}
                      </div>
                    </div>
                    <span className={`badge badge-${a.status.toLowerCase()}`} style={{ fontSize: 11 }}>
                      {a.status === 'AGUARDANDO' ? 'Aguardando' : 'Atendendo'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Filas */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>👥 Status da equipe</h3>
          {estado.funcionarias.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Nenhuma funcionária cadastrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {estado.funcionarias.map((f) => {
                const nasFilas = estado.filas.filter((fi) => fi.funcionariaId === f.id);
                const atendAtual = estado.atendimentos.find((a) => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'var(--cinza-bg)', borderRadius: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.status === 'EM_ATENDIMENTO' ? 'var(--rosa)' : f.status === 'ONLINE' ? 'var(--verde)' : '#ccc', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.usuario?.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
                        {f.status === 'EM_ATENDIMENTO' && atendAtual
                          ? `Atendendo: ${atendAtual.cliente?.nome}`
                          : f.status === 'ONLINE' && nasFilas.length > 0
                          ? `Na fila: ${nasFilas.map((fi) => SERVICO_INFO[fi.especialidade]?.icon).join(' ')}`
                          : f.status === 'OFFLINE' ? 'Offline' : 'Online'}
                      </div>
                    </div>
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
