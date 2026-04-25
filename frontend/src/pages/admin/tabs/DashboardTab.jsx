import { useState, useCallback } from 'react';
import {
  Clock, Zap, UserCheck, UserX, Scissors, Sparkles, Hand, Leaf,
  ChevronDown, ChevronUp, Plus, Check, X, Loader2, ArrowRight, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)', darkBg: 'rgba(168,85,247,.1)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)', darkBg: 'rgba(236,72,153,.1)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)',  darkBg: 'rgba(251,146,60,.1)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)',   darkBg: 'rgba(34,197,94,.1)' },
};

const SERVICES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'];

function tempoEspera(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins <= 0) return '1 min';
  return `${mins} min`;
}

function tempoAtendimento(iniciadoEm, createdAt) {
  const ref = iniciadoEm || createdAt;
  const mins = Math.floor((Date.now() - new Date(ref).getTime()) / 60000);
  if (mins <= 0) return '1 min';
  return `${mins} min`;
}

function agruparComandas(atendimentos) {
  const grupos = {};
  atendimentos
    .filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status))
    .forEach(a => {
      if (!grupos[a.numeroComanda]) {
        grupos[a.numeroComanda] = {
          numero: a.numeroComanda,
          cliente: a.cliente,
          clienteId: a.clienteId,
          criadoEm: a.createdAt,
          itens: [],
        };
      }
      grupos[a.numeroComanda].itens.push(a);
    });
  return Object.values(grupos).sort((a, b) => a.numero - b.numero);
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, valor, sub, Icon, color, bg }) {
  return (
    <div style={{
      background: '#1C2128', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 12, padding: '18px 20px',
      transition: 'border-color .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={12} color="#10B981" />
          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>{sub}</span>
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 4, fontFamily: "'Poppins', sans-serif" }}>{valor}</div>
      <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
    </div>
  );
}

// ── Coluna de fila por serviço ─────────────────────────────────────────────
function FilaColuna({ servico, atendimentos }) {
  const info = SERVICE_INFO[servico];
  const Icon = info.Icon;
  const aguardando = atendimentos.filter(a => a.status === 'AGUARDANDO' && a.tipoServico === servico);

  return (
    <div style={{
      background: '#1C2128', border: '1px solid rgba(255,255,255,.08)',
      borderRadius: 12, overflow: 'hidden', flex: 1, minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={info.color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{info.label}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: info.color, background: info.darkBg, padding: '2px 8px', borderRadius: 20 }}>
          {aguardando.length} aguardando
        </span>
      </div>

      {/* Lista */}
      <div style={{ padding: '8px 0' }}>
        {aguardando.length === 0 ? (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#374151', fontSize: 12 }}>
            Fila vazia
          </div>
        ) : (
          aguardando.slice(0, 4).map((a, idx) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#C9D1D9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.cliente?.nome}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: idx < 2 ? '#10B981' : idx < 3 ? '#F59E0B' : '#EF4444' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: idx < 2 ? '#10B981' : idx < 3 ? '#F59E0B' : '#EF4444' }}>
                  {tempoEspera(a.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        {aguardando.length > 4 && (
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: info.color, fontWeight: 500 }}>
              Ver fila completa ({aguardando.length})
            </span>
            <ArrowRight size={12} color={info.color} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── ComandaRow ─────────────────────────────────────────────────────────────
function ComandaRow({ grupo, estado }) {
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const ativos = grupo.itens.filter(i => i.status === 'EM_ATENDIMENTO').length;
  const temAtivo = ativos > 0;
  const servicosJa = grupo.itens.map(i => i.tipoServico);
  const servicosDisponiveis = SERVICES.filter(s => !servicosJa.includes(s));

  async function handleAdicionar() {
    if (!selecionados.length) return;
    const clienteId = grupo.clienteId;
    const servicos = [...selecionados];
    setLoading(true);
    try {
      await Promise.all(servicos.map(s => api.post('/atendimentos/adicionar', { clienteId, tipoServico: s })));
      setMsg('Adicionado!');
      setSelecionados([]);
      setAdicionando(false);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  const duracaoTotal = tempoAtendimento(grupo.criadoEm);

  return (
    <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Row principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#1C2128', cursor: 'pointer', transition: 'background .15s' }}
        onClick={() => setAberto(!aberto)}
        onMouseEnter={e => e.currentTarget.style.background = '#21262D'}
        onMouseLeave={e => e.currentTarget.style.background = '#1C2128'}
      >
        {/* Avatar + comanda */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.3), rgba(232,93,4,.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#E6EDF3' }}>
            {grupo.cliente?.nome?.[0]?.toUpperCase()}
          </div>
        </div>

        {/* Info */}
        <div style={{ minWidth: 130, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#D4178A' }}>#{grupo.numero}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>{grupo.cliente?.nome}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
            {grupo.itens.length} serviço{grupo.itens.length > 1 ? 's' : ''} · {new Date(grupo.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Serviços pills */}
        <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          {grupo.itens.map(item => {
            const info = SERVICE_INFO[item.tipoServico];
            const func = item.funcionaria?.usuario?.nome?.split(' ')[0];
            const isAtivo = item.status === 'EM_ATENDIMENTO';
            return info ? (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: isAtivo ? info.bg : 'rgba(255,255,255,.06)', border: `1px solid ${isAtivo ? info.color + '40' : 'transparent'}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: isAtivo ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isAtivo ? info.color : '#6B7280' }}>{info.label}</span>
                </div>
                {func && <div style={{ fontSize: 10, color: '#4B5563', textAlign: 'center', paddingLeft: 4 }}>↳ {func}</div>}
              </div>
            ) : null;
          })}
        </div>

        {/* Status + tempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: temAtivo ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: temAtivo ? '#10B981' : '#F59E0B', border: `1px solid ${temAtivo ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)'}` }}>
              {temAtivo ? 'Em andamento' : 'Aguardando'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              <Clock size={10} color="#6B7280" />
              <span style={{ fontSize: 11, color: '#6B7280' }}>{duracaoTotal}</span>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,.06)', border: 'none', color: '#8B949E', padding: '6px', borderRadius: 6, display: 'flex', cursor: 'pointer' }}>
            {aberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expandido */}
      {aberto && (
        <div style={{ padding: '12px 16px', background: '#161B22', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {grupo.itens.map(item => {
              const info = SERVICE_INFO[item.tipoServico];
              const isAtivo = item.status === 'EM_ATENDIMENTO';
              return info ? (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: info.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={12} color={info.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C9D1D9' }}>{info.label}</div>
                    {item.funcionaria && (
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                        {isAtivo ? 'com' : 'por'} {item.funcionaria.usuario?.nome}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: isAtivo ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)', color: isAtivo ? '#10B981' : '#F59E0B' }}>
                    {isAtivo ? 'Ativo' : 'Fila'}
                  </span>
                </div>
              ) : null;
            })}
          </div>

          {msg && <div style={{ fontSize: 12, color: msg.includes('Erro') ? '#EF4444' : '#10B981', marginBottom: 8 }}>{msg}</div>}

          {adicionando ? (
            <div style={{ background: 'rgba(212,23,138,.06)', border: '1px solid rgba(212,23,138,.15)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#8B949E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adicionar serviço</div>
              {servicosDisponiveis.length === 0 ? (
                <span style={{ fontSize: 12, color: '#4B5563' }}>Todos os serviços já adicionados.</span>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {servicosDisponiveis.map(s => {
                      const info = SERVICE_INFO[s];
                      const ativo = selecionados.includes(s);
                      return (
                        <button key={s} onClick={() => setSelecionados(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, border: `1.5px solid ${ativo ? info.color : 'rgba(255,255,255,.1)'}`, background: ativo ? info.darkBg : 'transparent', fontSize: 12, fontWeight: 500, color: ativo ? info.color : '#8B949E', cursor: 'pointer', transition: 'all .15s' }}
                        >
                          <info.Icon size={11} /> {info.label}
                          {ativo && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleAdicionar} disabled={loading || !selecionados.length}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: selecionados.length ? 'linear-gradient(135deg,#E85D04,#D4178A)' : 'rgba(255,255,255,.06)', color: selecionados.length ? '#fff' : '#4B5563', fontSize: 12, fontWeight: 600, border: 'none', cursor: selecionados.length ? 'pointer' : 'not-allowed' }}>
                      {loading ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={12} />}
                      Confirmar
                    </button>
                    <button onClick={() => { setAdicionando(false); setSelecionados([]); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,.06)', color: '#8B949E', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => setAdicionando(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.1)', color: '#6B7280', fontSize: 12, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,23,138,.3)'; e.currentTarget.style.color = '#D4178A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#6B7280'; }}
            >
              <Plus size={13} /> Adicionar serviço
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────
export default function DashboardTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  // Usa estado passado pelo AdminPage se disponível, senão usa o local
  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;

  const aguardando  = estado.atendimentos.filter(a => a.status === 'AGUARDANDO');
  const emAndamento = estado.atendimentos.filter(a => a.status === 'EM_ATENDIMENTO');
  const disponiveis = estado.funcionarias.filter(f => f.status === 'ONLINE');
  const ocupadas    = estado.funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const comandas    = agruparComandas(estado.atendimentos);

  const kpis = [
    { label: 'na fila',        valor: aguardando.length,  sub: '+3 últimos 30 min', Icon: Clock,     color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  title: 'Aguardando' },
    { label: 'agora',          valor: emAndamento.length, sub: '+2 últimos 30 min', Icon: Zap,       color: '#10B981', bg: 'rgba(16,185,129,.12)',  title: 'Em atendimento' },
    { label: 'funcionários',   valor: disponiveis.length, sub: '+1 últimos 30 min', Icon: UserCheck, color: '#60A5FA', bg: 'rgba(96,165,250,.12)',  title: 'Disponíveis' },
    { label: 'atendimentos',   valor: emAndamento.length + aguardando.length, sub: 'ativos agora', Icon: UserX, color: '#D4178A', bg: 'rgba(212,23,138,.12)', title: 'Concluídos hoje' },
  ];

  const dark = { color: '#E6EDF3', colorSub: '#6B7280', border: 'rgba(255,255,255,.08)' };

  return (
    <div>
      {/* Título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: dark.color, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(212,23,138,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={16} color="#D4178A" />
            </div>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: dark.colorSub, marginTop: 4 }}>Acompanhe o salão em tempo real</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => <KpiCard key={k.title} label={k.label} valor={k.valor} sub={k.sub} Icon={k.Icon} color={k.color} bg={k.bg} />)}
      </div>

      {/* Filas de Atendimento */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: dark.colorSub, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Filas de Atendimento
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {SERVICES.map(s => (
            <FilaColuna key={s} servico={s} atendimentos={estado.atendimentos} />
          ))}
        </div>
      </div>

      {/* Comandas Ativas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: dark.colorSub, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            Comandas Ativas
          </h2>
          <button style={{ fontSize: 12, color: '#D4178A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todas <ArrowRight size={13} />
          </button>
        </div>

        {comandas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#1C2128', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)', color: '#374151', fontSize: 14 }}>
            Nenhuma comanda ativa no momento
          </div>
        ) : (
          <div>
            {comandas.map(grupo => (
              <ComandaRow key={grupo.numero} grupo={grupo} estado={estado} />
            ))}
            {comandas.length > 5 && (
              <button style={{ width: '100%', padding: '12px', background: '#1C2128', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, color: '#8B949E', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,23,138,.2)'; e.currentTarget.style.color = '#D4178A'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.color = '#8B949E'; }}
              >
                Ver todas as comandas ativas <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .filas-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .kpi-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .filas-grid, .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
