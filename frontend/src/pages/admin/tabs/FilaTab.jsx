import { useCallback, useState } from 'react';
import { Scissors, Sparkles, Hand, Leaf, Eye, Clock, Users, Wifi } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', border: 'rgba(168,85,247,.25)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', border: 'rgba(236,72,153,.25)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  border: 'rgba(251,146,60,.25)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   border: 'rgba(34,197,94,.25)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.15)',  border: 'rgba(56,189,248,.25)'  },
};

const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];

function buildT(isDark) {
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', hover: '#333333',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', hover: '#f9fafb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
  };
}
function useT() { const { isDark } = useThemeCtx(); return buildT(isDark); }

function tempoNaFila(entradaEm) {
  const mins = Math.floor((Date.now() - new Date(entradaEm).getTime()) / 60000);
  if (mins <= 0) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

export default function FilaTab({ estado: estadoProps }) {
  const T = useT();
  const { isDark } = useThemeCtx();
  const { usuario } = useAuth();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;
  const totalNaFila = new Set(estado.filas.map(f => f.funcionariaId)).size;

  return (
    <div className="admin-tab">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.fg, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(252,211,77,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#FCD34D" />
            </div>
            Fila de Espera
          </h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Funcionárias disponíveis aguardando atendimento</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', padding: '6px 14px', borderRadius: 20, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{totalNaFila} na fila</span>
        </div>
      </div>

      {/* Resumo por serviço — 5 cards */}
      <div className="fila-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {SERVICES.map(srv => {
          const info = SERVICE_INFO[srv];
          const filaDoServico = estado.filas.filter(f => f.especialidade === srv);
          return (
            <div key={srv} style={{
              background: T.card,
              border: `1px solid ${filaDoServico.length > 0 ? info.border : T.border}`,
              borderRadius: 12, padding: '14px 12px', transition: 'border-color .2s',
              boxShadow: T.shadow,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <info.Icon size={15} color={info.color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{info.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: filaDoServico.length > 0 ? info.color : T.muted, lineHeight: 1 }}>
                {filaDoServico.length}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                {filaDoServico.length === 0 ? 'Ninguém disponível' : filaDoServico.length === 1 ? 'funcionária' : 'funcionárias'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Colunas de fila por serviço */}
      <div className="fila-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {SERVICES.map(srv => {
          const info = SERVICE_INFO[srv];
          const filaDoServico = estado.filas
            .filter(f => f.especialidade === srv)
            .sort((a, b) => new Date(a.entradaEm) - new Date(b.entradaEm));

          return (
            <div key={srv} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.shadow }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <info.Icon size={14} color={info.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{info.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: info.color, background: info.bg, padding: '3px 10px', borderRadius: 20 }}>
                  <Users size={10} />
                  {filaDoServico.length}
                </div>
              </div>

              <div style={{ padding: '6px 0' }}>
                {filaDoServico.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <Wifi size={17} color={T.muted} />
                    </div>
                    <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Fila vazia</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Nenhuma funcionária disponível</div>
                  </div>
                ) : (
                  filaDoServico.map((entrada, idx) => {
                    const func = estado.funcionarias.find(f => f.id === entrada.funcionariaId);
                    if (!func) return null;
                    const isFirst = idx === 0;

                    return (
                      <div key={entrada.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px',
                          background: isFirst ? 'rgba(16,185,129,.04)' : 'transparent',
                          borderLeft: `3px solid ${isFirst ? '#10B981' : 'transparent'}`,
                          transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isFirst ? 'rgba(16,185,129,.07)' : T.hover}
                        onMouseLeave={e => e.currentTarget.style.background = isFirst ? 'rgba(16,185,129,.04)' : 'transparent'}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          background: isFirst ? 'rgba(16,185,129,.2)' : T.bg2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700,
                          color: isFirst ? '#10B981' : T.muted,
                        }}>
                          {idx + 1}
                        </div>

                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${info.color}30, ${info.color}15)`,
                            border: `2px solid ${isFirst ? '#10B981' : info.color + '40'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: isFirst ? '#10B981' : info.color,
                          }}>
                            {func.usuario?.nome?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#10B981', border: `1.5px solid ${T.card}` }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {func.usuario?.nome}
                            {isFirst && (
                              <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,.12)', padding: '1px 6px', borderRadius: 8 }}>
                                Próxima
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} />
                            Na fila há {tempoNaFila(entrada.entradaEm)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                          {func.especialidades?.slice(0, 2).map(esp => {
                            const espInfo = SERVICE_INFO[esp];
                            return espInfo ? (
                              <div key={esp} style={{ width: 20, height: 20, borderRadius: 6, background: espInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={espInfo.label}>
                                <espInfo.Icon size={10} color={espInfo.color} />
                              </div>
                            ) : null;
                          })}
                          {func.especialidades?.length > 2 && (
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: T.muted }}>
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

      <style>{`
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.8); } }
        @media (max-width: 1100px) {
          .fila-summary { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .fila-summary { grid-template-columns: repeat(3, 1fr) !important; }
          .fila-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .fila-summary { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
