import { useCallback, useState } from 'react';
import { Scissors, Sparkles, Hand, Leaf, Clock, Users, Wifi } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', border: 'rgba(168,85,247,.25)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', border: 'rgba(236,72,153,.25)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  border: 'rgba(251,146,60,.25)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   border: 'rgba(34,197,94,.25)' },
};

const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'];

function tempoNaFila(entradaEm) {
  const mins = Math.floor((Date.now() - new Date(entradaEm).getTime()) / 60000);
  if (mins <= 0) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export default function FilaTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;

  const totalNaFila = new Set(estado.filas.map(f => f.funcionariaId)).size;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: '#1B2A4A', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(252,211,77,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#FCD34D" />
            </div>
            Fila de Espera
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Funcionárias disponíveis aguardando atendimento
          </p>
        </div>

        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', padding: '6px 14px', borderRadius: 20 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{totalNaFila} na fila</span>
        </div>
      </div>

      {/* Resumo geral */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {SERVICES.map(srv => {
          const info = SERVICE_INFO[srv];
          const filaDoServico = estado.filas.filter(f => f.especialidade === srv);
          return (
            <div key={srv} style={{
              background: '#FFFFFF', border: `1px solid ${filaDoServico.length > 0 ? info.border : 'rgba(0,0,0,.08)'}`,
              borderRadius: 12, padding: '16px',
              transition: 'border-color .2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <info.Icon size={16} color={info.color} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A' }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: filaDoServico.length > 0 ? info.color : '#6B7280', fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>
                {filaDoServico.length}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                {filaDoServico.length === 0 ? 'Ninguém disponível' : filaDoServico.length === 1 ? 'funcionária' : 'funcionárias'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Colunas de fila por serviço */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {SERVICES.map(srv => {
          const info = SERVICE_INFO[srv];
          const filaDoServico = estado.filas
            .filter(f => f.especialidade === srv)
            .sort((a, b) => new Date(a.entradaEm) - new Date(b.entradaEm));

          return (
            <div key={srv} style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,.08)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Header da coluna */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <info.Icon size={15} color={info.color} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2A4A' }}>{info.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: info.color, background: info.bg, padding: '3px 10px', borderRadius: 20 }}>
                  <Users size={11} />
                  {filaDoServico.length}
                </div>
              </div>

              {/* Lista de funcionárias */}
              <div style={{ padding: '8px 0' }}>
                {filaDoServico.length === 0 ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Wifi size={18} color="#374151" />
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Fila vazia</div>
                    <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>Nenhuma funcionária disponível</div>
                  </div>
                ) : (
                  filaDoServico.map((entrada, idx) => {
                    const func = estado.funcionarias.find(f => f.id === entrada.funcionariaId);
                    if (!func) return null;
                    const isFirst = idx === 0;

                    return (
                      <div key={entrada.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px',
                          background: isFirst ? 'rgba(16,185,129,.04)' : 'transparent',
                          borderLeft: isFirst ? '3px solid #10B981' : '3px solid transparent',
                          transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = isFirst ? 'rgba(16,185,129,.04)' : 'transparent'}
                      >
                        {/* Posição */}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: isFirst ? 'rgba(16,185,129,.2)' : 'rgba(0,0,0,.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: isFirst ? '#10B981' : '#6B7280',
                        }}>
                          {idx + 1}
                        </div>

                        {/* Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${info.color}30, ${info.color}15)`,
                            border: `2px solid ${isFirst ? '#10B981' : info.color + '40'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 15, fontWeight: 700, color: isFirst ? '#10B981' : info.color,
                          }}>
                            {func.usuario?.nome?.[0]?.toUpperCase()}
                          </div>
                          {/* Dot online */}
                          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#10B981', border: '1.5px solid #1C2128' }} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {func.usuario?.nome}
                            {isFirst && (
                              <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.12)', padding: '1px 6px', borderRadius: 8 }}>
                                Próxima
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} />
                            Na fila há {tempoNaFila(entrada.entradaEm)}
                          </div>
                        </div>

                        {/* Especialidades */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {func.especialidades?.slice(0, 2).map(esp => {
                            const espInfo = SERVICE_INFO[esp];
                            return espInfo ? (
                              <div key={esp} style={{ width: 22, height: 22, borderRadius: 6, background: espInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={espInfo.label}>
                                <espInfo.Icon size={11} color={espInfo.color} />
                              </div>
                            ) : null;
                          })}
                          {func.especialidades?.length > 2 && (
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#6B7280' }}>
                              +{func.especialidades.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
