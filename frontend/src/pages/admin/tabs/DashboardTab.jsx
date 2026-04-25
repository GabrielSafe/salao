import { useState, useCallback } from 'react';
import { Clock, Zap, UserCheck, UserX, Scissors, Sparkles, Hand, Leaf, ChevronDown, ChevronUp, Plus, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const SERVICE_ICON  = { CABELO: Scissors, MAQUIAGEM: Sparkles, MAO: Hand, PE: Leaf };
const SERVICE_LABEL = { CABELO: 'Cabelo', MAQUIAGEM: 'Maquiagem', MAO: 'Mão', PE: 'Pé' };
const SERVICE_COLOR = { CABELO: '#C084FC', MAQUIAGEM: '#F472B6', MAO: '#FB923C', PE: '#4ADE80' };
const SERVICE_BG    = { CABELO: 'rgba(168,85,247,.12)', MAQUIAGEM: 'rgba(236,72,153,.12)', MAO: 'rgba(251,146,60,.12)', PE: 'rgba(34,197,94,.12)' };

const SERVICOS_LIST = [
  { id: 'CABELO',    label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  { id: 'MAQUIAGEM', label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  { id: 'MAO',       label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  { id: 'PE',        label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
];

function StatusDot({ status }) {
  const cls = status === 'ONLINE' ? 'online' : status === 'EM_ATENDIMENTO' ? 'em_atendimento' : 'offline';
  return <span className={`status-dot ${cls}`} />;
}

// Agrupa atendimentos ativos por comanda
function agruparPorComanda(atendimentos) {
  const grupos = {};
  atendimentos
    .filter((a) => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status))
    .forEach((a) => {
      const key = a.numeroComanda;
      if (!grupos[key]) {
        grupos[key] = { numero: key, cliente: a.cliente, clienteId: a.clienteId, itens: [] };
      }
      grupos[key].itens.push(a);
    });
  return Object.values(grupos).sort((a, b) => a.numero - b.numero);
}

function ComandaCard({ grupo }) {
  const [aberto, setAberto] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const ativos    = grupo.itens.filter((i) => i.status === 'EM_ATENDIMENTO').length;
  const total     = grupo.itens.length;
  const temAtivo  = ativos > 0;

  // Serviços já solicitados para não duplicar
  const servicosJa = grupo.itens.map((i) => i.tipoServico);
  const servicosDisponiveis = SERVICOS_LIST.filter((s) => !servicosJa.includes(s.id));

  function toggleServico(id) {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleAdicionar() {
    if (!selecionados.length) return;
    setLoading(true);
    try {
      for (const s of selecionados) {
        await api.post('/atendimentos/adicionar', { clienteId: grupo.clienteId, tipoServico: s });
      }
      setMsg('Serviço(s) adicionado(s)!');
      setSelecionados([]);
      setAdicionando(false);
      setTimeout(() => setMsg(''), 3000);
      // socket emite estado_completo automaticamente após adicionar
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro ao adicionar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${temAtivo ? 'rgba(34,197,94,.2)' : 'var(--border)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header clicável */}
      <button
        onClick={() => { setAberto(!aberto); setAdicionando(false); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: 'none', cursor: 'pointer', color: 'var(--text)',
        }}
      >
        {/* Ícones dos serviços */}
        <div style={{ display: 'flex', gap: -4 }}>
          {grupo.itens.slice(0, 3).map((item, i) => {
            const Icon = SERVICE_ICON[item.tipoServico] || Scissors;
            return (
              <div key={item.id} style={{
                width: 28, height: 28, borderRadius: 7,
                background: SERVICE_BG[item.tipoServico],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -6 : 0,
                border: '2px solid var(--bg-elevated)',
              }}>
                <Icon size={13} color={SERVICE_COLOR[item.tipoServico]} />
              </div>
            );
          })}
          {grupo.itens.length > 3 && (
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -6, border: '2px solid var(--bg-elevated)', fontSize: 10, fontWeight: 700, color: 'var(--text-2)' }}>
              +{grupo.itens.length - 3}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            <span style={{ color: 'var(--accent)', marginRight: 6 }}>#{grupo.numero}</span>
            {grupo.cliente?.nome}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {total} serviço{total > 1 ? 's' : ''}
          </div>
        </div>

        {/* Progresso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: temAtivo ? 'var(--success)' : 'var(--accent)' }}>
              {ativos}/{total}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>em atend.</div>
          </div>
          {aberto ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
        </div>
      </button>

      {/* Barra de progresso */}
      <div style={{ height: 2, background: 'var(--border)', margin: '0 14px' }}>
        <div style={{ height: '100%', background: temAtivo ? 'var(--success)' : 'var(--accent)', width: `${(ativos / total) * 100}%`, transition: 'width 0.4s', borderRadius: 1 }} />
      </div>

      {/* Expandido */}
      {aberto && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Lista de serviços */}
          {grupo.itens.map((item) => {
            const Icon = SERVICE_ICON[item.tipoServico] || Scissors;
            const isAtivo = item.status === 'EM_ATENDIMENTO';
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: SERVICE_BG[item.tipoServico], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={SERVICE_COLOR[item.tipoServico]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{SERVICE_LABEL[item.tipoServico]}</div>
                  {item.funcionaria && (
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
                      {isAtivo ? 'com' : 'por'} {item.funcionaria.usuario?.nome}
                    </div>
                  )}
                </div>
                <span className={`badge badge-${item.status.toLowerCase()}`} style={{ fontSize: 10 }}>
                  {item.status === 'AGUARDANDO' ? 'Fila' : item.status === 'EM_ATENDIMENTO' ? 'Ativo' : item.status}
                </span>
              </div>
            );
          })}

          {msg && (
            <div className={msg.includes('Erro') ? 'alert-error' : 'alert-success'} style={{ fontSize: 12, padding: '8px 12px' }}>{msg}</div>
          )}

          {/* Formulário adicionar serviço */}
          {adicionando ? (
            <div style={{ background: 'var(--bg-hover)', borderRadius: 8, padding: '12px', border: '1px solid var(--accent-border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Adicionar serviço
              </div>
              {servicosDisponiveis.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Todos os serviços já foram adicionados.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {servicosDisponiveis.map(({ id, label, Icon, color, bg }) => {
                      const ativo = selecionados.includes(id);
                      return (
                        <button key={id} onClick={() => toggleServico(id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1.5px solid ${ativo ? color : 'var(--border-2)'}`, background: ativo ? bg : 'var(--bg-elevated)', fontSize: 12, fontWeight: 500, color: ativo ? color : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <Icon size={12} /> {label}
                          {ativo && <Check size={11} />}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAdicionar} disabled={loading || !selecionados.length}>
                      {loading ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={12} />}
                      {loading ? 'Adicionando...' : 'Confirmar'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAdicionando(false); setSelecionados([]); }}>
                      <X size={12} /> Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', gap: 6, marginTop: 2 }}
              onClick={() => setAdicionando(true)}
            >
              <Plus size={13} /> Adicionar serviço
            </button>
          )}
        </div>
      )}
    </div>
  );
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
    { label: 'Aguardando',     valor: aguardando.length,  Icon: Clock,     color: 'var(--accent)',  bg: 'var(--accent-dim)' },
    { label: 'Em atendimento', valor: emAndamento.length, Icon: Zap,       color: 'var(--success)', bg: 'var(--success-dim)' },
    { label: 'Disponíveis',    valor: disponíveis.length, Icon: UserCheck, color: 'var(--blue)',    bg: 'var(--blue-dim)' },
    { label: 'Ocupadas',       valor: ocupadas.length,    Icon: UserX,     color: '#F472B6',        bg: 'rgba(244,114,182,.12)' },
  ];

  const grupos = agruparPorComanda(estado.atendimentos);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Acompanhe o salão em tempo real</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,.2)', padding: '6px 12px', borderRadius: 20 }}>
          <span className="status-dot online" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Ao vivo</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {kpis.map(({ label, valor, Icon, color, bg }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
            <div className="kpi-value" style={{ color }}>{valor}</div>
            <div className="kpi-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Comandas ativas */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Comandas ativas
          </h3>
          {grupos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
              Nenhuma comanda no momento
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {grupos.map((grupo) => (
                <ComandaCard
                  key={grupo.numero}
                  grupo={grupo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Equipe */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Status da equipe
          </h3>
          {estado.funcionarias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nenhuma funcionária cadastrada</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {estado.funcionarias.map((f) => {
                const atendAtual = estado.atendimentos.find((a) => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
                const nasFilas   = estado.filas.filter((fi) => fi.funcionariaId === f.id);
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
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
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: f.status === 'ONLINE' ? 'var(--success-dim)' : f.status === 'EM_ATENDIMENTO' ? 'var(--accent-dim)' : 'rgba(255,255,255,.06)', color: f.status === 'ONLINE' ? 'var(--success)' : f.status === 'EM_ATENDIMENTO' ? 'var(--accent)' : 'var(--text-3)' }}>
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
