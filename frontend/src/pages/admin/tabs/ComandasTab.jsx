import { useState, useCallback, useEffect } from 'react';
import {
  Scissors, Sparkles, Hand, Leaf, Clock, CheckCircle2,
  Plus, Check, X, Loader2, User, Filter, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.2)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.2)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)',  border: 'rgba(251,146,60,.2)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.2)' },
};

const SERVICOS_LIST = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'];

const STATUS_LABEL = {
  AGUARDANDO:      { text: 'Aguardando',      color: '#D97706', bg: 'rgba(217,119,6,.1)' },
  PENDENTE_ACEITE: { text: 'Aguardando aceite', color: '#D97706', bg: 'rgba(217,119,6,.1)' },
  EM_ATENDIMENTO:  { text: 'Em atendimento',  color: '#16A34A', bg: 'rgba(22,163,74,.1)' },
};

function tempoDecorrido(data) {
  const mins = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (mins < 1)  return '< 1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

function agrupar(atendimentos) {
  const grupos = {};
  atendimentos
    .filter(a => ['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(a.status))
    .forEach(a => {
      const k = a.numeroComanda;
      if (!grupos[k]) grupos[k] = { numero: k, cliente: a.cliente, clienteId: a.clienteId, criadoEm: a.createdAt, itens: [] };
      grupos[k].itens.push(a);
    });
  return Object.values(grupos).sort((a, b) => a.numero - b.numero);
}

// ── Card de comanda expandida ──────────────────────────────────────────────
function ComandaCard({ grupo, funcionarias }) {
  const [adicionando, setAdicionando]   = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState('');

  const ativos     = grupo.itens.filter(i => i.status === 'EM_ATENDIMENTO').length;
  const total      = grupo.itens.length;
  const temAtivo   = ativos > 0;
  const servicosJa = grupo.itens.map(i => i.tipoServico);
  const disponiveis = SERVICOS_LIST.filter(s => !servicosJa.includes(s));

  async function handleAdicionar() {
    if (!selecionados.length) return;
    const clienteId = grupo.clienteId;
    const servicos  = [...selecionados];
    setLoading(true);
    try {
      await Promise.all(servicos.map(s => api.post('/atendimentos/adicionar', { clienteId, tipoServico: s })));
      setMsg('Serviço(s) adicionado(s)!');
      setSelecionados([]); setAdicionando(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.erro || 'Erro'); }
    finally { setLoading(false); }
  }

  async function handleFinalizarAdmin(atendimentoId) {
    setLoading(true);
    try {
      await api.patch(`/atendimentos/${atendimentoId}/finalizar-admin`);
      setMsg('Finalizado pelo admin.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.erro || 'Erro'); }
    finally { setLoading(false); }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14, animation: 'slideInUp .25s ease' }}>

      {/* ── Header da comanda ── */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar cliente */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.2), rgba(232,93,4,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
          {grupo.cliente?.nome?.[0]?.toUpperCase()}
        </div>

        {/* Info cliente */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{grupo.cliente?.nome}</span>
            {grupo.cliente?.telefone && (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {grupo.cliente.telefone}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {tempoDecorrido(grupo.criadoEm)} atrás
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>· {total} serviço{total > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Número e progresso */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Poppins', sans-serif", lineHeight: 1 }}>
            #{grupo.numero}
          </div>
          <div style={{ fontSize: 11, color: temAtivo ? '#16A34A' : '#D97706', fontWeight: 600, marginTop: 4 }}>
            {ativos}/{total} em atendimento
          </div>
          {/* barra */}
          <div style={{ height: 3, background: 'var(--border-2)', borderRadius: 2, marginTop: 5, width: 80 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${total > 0 ? (ativos / total) * 100 : 0}%`, background: temAtivo ? '#16A34A' : '#D97706', transition: 'width .4s' }} />
          </div>
        </div>
      </div>

      {/* ── Serviços ── */}
      <div>
        {grupo.itens.map((item, idx) => {
          const info = SERVICE_INFO[item.tipoServico];
          const func = funcionarias.find(f => f.id === item.funcionariaId);
          const stInfo = STATUS_LABEL[item.status] || STATUS_LABEL.AGUARDANDO;
          const isUltimo = idx === grupo.itens.length - 1;

          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: isUltimo && !adicionando && !msg ? 'none' : '1px solid var(--border)' }}>
              {/* Ícone serviço */}
              {info && (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: info.bg, border: `1px solid ${info.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <info.Icon size={18} color={info.color} />
                </div>
              )}

              {/* Detalhes */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{info?.label}</div>
                {func ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.2), rgba(232,93,4,.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                      {func.usuario?.nome?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {item.status === 'EM_ATENDIMENTO' ? 'Atendida por' : 'Proposta para'} <strong>{func.usuario?.nome}</strong>
                    </span>
                    {item.iniciadoEm && (
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {tempoDecorrido(item.iniciadoEm)}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    {item.status === 'AGUARDANDO' ? 'Aguardando funcionária disponível' : 'Aguardando aceite'}
                  </div>
                )}
              </div>

              {/* Status + ação admin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: stInfo.bg, color: stInfo.color }}>
                  {stInfo.text}
                </span>
                {['AGUARDANDO', 'PENDENTE_ACEITE', 'EM_ATENDIMENTO'].includes(item.status) && (
                  <button onClick={() => handleFinalizarAdmin(item.id)} disabled={loading}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <ShieldCheck size={11} /> Finalizar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Rodapé: adicionar serviço ── */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        {msg && (
          <div style={{ fontSize: 12, color: msg.includes('Erro') ? '#EF4444' : '#16A34A', marginBottom: 10 }}>{msg}</div>
        )}

        {adicionando ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selecione o serviço
            </div>
            {disponiveis.length === 0 ? (
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Todos os serviços já adicionados.</span>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {disponiveis.map(s => {
                    const info = SERVICE_INFO[s];
                    const ativo = selecionados.includes(s);
                    return (
                      <button key={s} onClick={() => setSelecionados(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${ativo ? info.color : 'var(--border-2)'}`, background: ativo ? info.bg : 'transparent', fontSize: 12, fontWeight: 500, color: ativo ? info.color : 'var(--text-2)', cursor: 'pointer', transition: 'all .15s' }}>
                        <info.Icon size={12} /> {info.label} {ativo && <Check size={11} />}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAdicionar} disabled={loading || !selecionados.length}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: selecionados.length ? 'var(--brand-gradient)' : 'var(--bg-hover)', color: selecionados.length ? '#fff' : 'var(--text-3)', fontSize: 12, fontWeight: 600, border: 'none', cursor: selecionados.length ? 'pointer' : 'not-allowed' }}>
                    {loading ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={12} />}
                    Confirmar
                  </button>
                  <button onClick={() => { setAdicionando(false); setSelecionados([]); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-hover)', color: 'var(--text-2)', fontSize: 12, border: 'none', cursor: 'pointer' }}>
                    <X size={12} /> Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button onClick={() => setAdicionando(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Plus size={14} /> Adicionar serviço
          </button>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function ComandasTab({ estado: estadoProps }) {
  const { usuario } = useAuth();
  const [estadoLocal, setEstadoLocal] = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [filtro, setFiltro] = useState('todos'); // todos | aguardando | atendendo

  const onEstadoCompleto = useCallback(dados => setEstadoLocal(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const estado = estadoProps?.funcionarias?.length >= 0 ? estadoProps : estadoLocal;
  const grupos  = agrupar(estado.atendimentos);

  const gruposFiltrados = grupos.filter(g => {
    if (filtro === 'aguardando') return g.itens.every(i => i.status !== 'EM_ATENDIMENTO');
    if (filtro === 'atendendo')  return g.itens.some(i => i.status === 'EM_ATENDIMENTO');
    return true;
  });

  const totalAguardando = grupos.filter(g => g.itens.every(i => i.status !== 'EM_ATENDIMENTO')).length;
  const totalAtendendo  = grupos.filter(g => g.itens.some(i => i.status === 'EM_ATENDIMENTO')).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(212,23,138,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--accent)" />
            </div>
            Comandas em aberto
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            {grupos.length} comanda{grupos.length !== 1 ? 's' : ''} ativa{grupos.length !== 1 ? 's' : ''} no momento
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'todos',      label: `Todas (${grupos.length})` },
            { key: 'aguardando', label: `Aguardando (${totalAguardando})` },
            { key: 'atendendo',  label: `Atendendo (${totalAtendendo})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1.5px solid', cursor: 'pointer', transition: 'all .15s',
                borderColor: filtro === key ? 'var(--accent)' : 'var(--border-2)',
                background:  filtro === key ? 'var(--accent-dim)' : 'transparent',
                color:       filtro === key ? 'var(--accent)' : 'var(--text-2)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {gruposFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <CheckCircle2 size={40} color="var(--text-3)" style={{ marginBottom: 14, opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            {filtro === 'todos' ? 'Nenhuma comanda ativa' : `Nenhuma comanda ${filtro === 'aguardando' ? 'aguardando' : 'em atendimento'}`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {filtro === 'todos' ? 'As comandas aparecerão aqui em tempo real.' : 'Mude o filtro para ver outras comandas.'}
          </div>
        </div>
      ) : (
        gruposFiltrados.map(grupo => (
          <ComandaCard
            key={grupo.numero}
            grupo={grupo}
            funcionarias={estado.funcionarias}
          />
        ))
      )}
    </div>
  );
}
