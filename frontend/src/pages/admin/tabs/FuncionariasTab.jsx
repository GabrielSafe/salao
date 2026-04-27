import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, User, Scissors, Sparkles, Hand, Leaf, Loader2, Clock, CheckCircle2, Timer, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../services/api';

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
};
const ESPECIALIDADES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'];

function StatusPill({ status }) {
  const map = {
    ONLINE:          { label: 'Online',     color: 'var(--success)', bg: 'var(--success-dim)' },
    EM_ATENDIMENTO:  { label: 'Ocupada',    color: 'var(--accent)',  bg: 'var(--accent-dim)' },
    OFFLINE:         { label: 'Offline',    color: 'var(--text-3)',  bg: 'rgba(255,255,255,.05)' },
  };
  const s = map[status] || map.OFFLINE;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function HistoricoAgrupado({ atendimentos }) {
  const [abertos, setAbertos] = useState({});

  function toggle(num) {
    setAbertos((prev) => ({ ...prev, [num]: !prev[num] }));
  }

  // Agrupa por numeroComanda — cada visita é um grupo separado
  const grupos = {};
  atendimentos.forEach((a) => {
    const k = a.numeroComanda;
    if (!grupos[k]) grupos[k] = { numero: k, cliente: a.cliente, data: a.createdAt, itens: [] };
    grupos[k].itens.push(a);
  });
  const lista = Object.values(grupos).sort((a, b) => new Date(b.data) - new Date(a.data));

  if (lista.length === 0) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nenhum atendimento registrado.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Histórico — {lista.length} visita{lista.length > 1 ? 's' : ''}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lista.map((grupo) => {
          const aberto = abertos[grupo.numero];
          const finalizados = grupo.itens.filter((i) => i.status === 'FINALIZADO').length;
          const total = grupo.itens.length;
          const tudo = finalizados === total;
          const temAtivo = grupo.itens.some((i) => i.status === 'EM_ATENDIMENTO');

          return (
            <div key={grupo.numero} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <button
                onClick={() => toggle(grupo.numero)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text)', border: 'none' }}
              >
                {/* Ícones dos serviços */}
                <div style={{ display: 'flex' }}>
                  {grupo.itens.slice(0, 4).map((item, i) => {
                    const info = SERVICE_INFO[item.tipoServico];
                    if (!info) return null;
                    return (
                      <div key={item.id} style={{ width: 26, height: 26, borderRadius: 6, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -5 : 0, border: '2px solid var(--bg-elevated)' }}>
                        <info.Icon size={12} color={info.color} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    <span style={{ color: 'var(--accent)', marginRight: 6 }}>#{grupo.numero}</span>
                    {grupo.cliente?.nome}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                    {new Date(grupo.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tudo ? 'var(--success-dim)' : temAtivo ? 'var(--accent-dim)' : 'rgba(255,255,255,.06)', color: tudo ? 'var(--success)' : temAtivo ? 'var(--accent)' : 'var(--text-3)' }}>
                    {finalizados}/{total}
                  </span>
                  {aberto
                    ? <ChevronUp size={13} color="var(--text-3)" />
                    : <ChevronDown size={13} color="var(--text-3)" />
                  }
                </div>
              </button>

              {/* Serviços expandidos */}
              {aberto && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-card)' }}>
                  {grupo.itens.map((item) => {
                    const info = SERVICE_INFO[item.tipoServico];
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'var(--bg-elevated)', borderRadius: 7 }}>
                        {info && (
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <info.Icon size={12} color={info.color} />
                          </div>
                        )}
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{info?.label || item.tipoServico}</div>
                        <span className={`badge badge-${item.status.toLowerCase()}`} style={{ fontSize: 10 }}>{item.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FuncionariasTab() {
  const { usuario } = useAuth();
  const [funcionarias, setFuncionarias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null); // funcionária sendo editada
  const [historico, setHistorico] = useState(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', especialidades: [], multiTarefas: false });
  const [formEdit, setFormEdit] = useState({ nome: '', especialidades: [], multiTarefas: false, novaSenha: '', ativo: true });
  const [erro, setErro] = useState('');
  const [erroEdit, setErroEdit] = useState('');
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await api.get('/funcionarias');
    setFuncionarias(data);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Atualiza lista em tempo real quando estado do salão muda
  useSocket(usuario?.salaoId, { onEstadoCompleto: carregar });

  function toggleEsp(esp) {
    setForm((f) => ({
      ...f,
      especialidades: f.especialidades.includes(esp)
        ? f.especialidades.filter((e) => e !== esp)
        : [...f.especialidades, esp],
    }));
  }

  async function handleCriar(e) {
    e.preventDefault();
    setErro('');
    if (!form.multiTarefas && !form.especialidades.length) { setErro('Selecione pelo menos uma especialidade'); return; }
    setLoading(true);
    try {
      await api.post('/funcionarias', form);
      setForm({ nome: '', email: '', senha: '', especialidades: [], multiTarefas: false });
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  async function verHistorico(id) {
    const { data } = await api.get(`/funcionarias/${id}/historico`);
    setHistorico(data);
  }

  function abrirEdicao(f) {
    setFormEdit({
      nome: f.usuario?.nome || '',
      especialidades: f.especialidades || [],
      multiTarefas: f.multiTarefas || false,
      novaSenha: '',
      ativo: f.usuario?.ativo ?? true,
    });
    setErroEdit('');
    setEditando(f);
  }

  function toggleEspEdit(esp) {
    setFormEdit(f => ({
      ...f,
      especialidades: f.especialidades.includes(esp)
        ? f.especialidades.filter(e => e !== esp)
        : [...f.especialidades, esp],
    }));
  }

  async function handleSalvarEdicao(e) {
    e.preventDefault();
    setErroEdit('');
    if (!formEdit.multiTarefas && !formEdit.especialidades.length) {
      setErroEdit('Selecione pelo menos uma especialidade'); return;
    }
    setLoading(true);
    try {
      await api.put(`/funcionarias/${editando.id}`, {
        nome: formEdit.nome,
        especialidades: formEdit.especialidades,
        multiTarefas: formEdit.multiTarefas,
        ativo: formEdit.ativo,
        ...(formEdit.novaSenha ? { senha: formEdit.novaSenha } : {}),
      });
      setEditando(null);
      await carregar();
    } catch (err) {
      setErroEdit(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (historico) {
    const { funcionaria, estatisticas } = historico;
    return (
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => setHistorico(null)} style={{ marginBottom: 20, gap: 6 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
              {funcionaria.usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{funcionaria.usuario?.nome}</div>
              <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 2 }}>{funcionaria.usuario?.email}</div>
            </div>
          </div>
          <div className="grid-3">
            {[
              { label: 'Total',      valor: estatisticas.totalAtendimentos, Icon: Clock,        color: 'var(--blue)' },
              { label: 'Finalizados', valor: estatisticas.finalizados,       Icon: CheckCircle2, color: 'var(--success)' },
              { label: 'Tempo médio', valor: `${estatisticas.tempoMedioMinutos}m`, Icon: Timer,  color: 'var(--accent)' },
            ].map(({ label, valor, Icon, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '16px 8px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <Icon size={20} color={color} style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{valor}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <HistoricoAgrupado atendimentos={funcionaria.atendimentos} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipe</h1>
          <p className="page-subtitle">{funcionarias.length} funcionária(s) cadastrada(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : <><Plus size={15} /> Nova funcionária</>}
        </button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 15 }}>Cadastrar funcionária</h3>
          <form onSubmit={handleCriar}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Nome *</label>
                <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label">E-mail *</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Senha *</label>
              <input className="input" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Especialidades</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, cursor: 'pointer', color: 'var(--text-2)' }}>
                <input
                  type="checkbox"
                  checked={form.multiTarefas}
                  onChange={(e) => setForm({ ...form, multiTarefas: e.target.checked, especialidades: [] })}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                />
                Multitarefas (todas as especialidades)
              </label>
              {!form.multiTarefas && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ESPECIALIDADES.map((esp) => {
                    const info = SERVICE_INFO[esp];
                    const ativo = form.especialidades.includes(esp);
                    return (
                      <button key={esp} type="button" onClick={() => toggleEsp(esp)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${ativo ? info.color : 'var(--border-2)'}`, background: ativo ? info.bg : 'var(--bg-elevated)', fontSize: 13, fontWeight: 500, color: ativo ? info.color : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        <info.Icon size={13} /> {info.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {erro && <div className="alert-error" style={{ marginBottom: 12, fontSize: 13 }}>{erro}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Cadastrando...</> : 'Cadastrar'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {funcionarias.map((f) => (
          <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: 15, flexShrink: 0 }}>
              {f.usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{f.usuario?.nome}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                {f.especialidades.map((esp) => {
                  const info = SERVICE_INFO[esp];
                  if (!info) return null;
                  return (
                    <span key={esp} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: info.bg, color: info.color }}>
                      <info.Icon size={10} /> {info.label}
                    </span>
                  );
                })}
                {f.multiTarefas && <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>multitarefas</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <StatusPill status={f.status} />
              <button className="btn btn-ghost btn-sm" onClick={() => abrirEdicao(f)}>Editar</button>
              <button className="btn btn-ghost btn-sm" onClick={() => verHistorico(f.id)}>Histórico</button>
            </div>
          </div>
        ))}
        {funcionarias.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
            <User size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Nenhuma funcionária cadastrada</p>
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>Editar funcionária</h2>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{editando.usuario?.email}</p>
              </div>
              <button onClick={() => setEditando(null)} style={{ background: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao}>
              {/* Nome */}
              <div className="form-group">
                <label className="label">Nome</label>
                <input className="input" value={formEdit.nome} onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })} required />
              </div>

              {/* Especialidades */}
              <div className="form-group">
                <label className="label">Especialidades</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, cursor: 'pointer', color: 'var(--text-2)' }}>
                  <input type="checkbox" checked={formEdit.multiTarefas}
                    onChange={e => setFormEdit({ ...formEdit, multiTarefas: e.target.checked, especialidades: [] })}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  Multitarefas (todas as especialidades)
                </label>
                {!formEdit.multiTarefas && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ESPECIALIDADES.map(esp => {
                      const info = SERVICE_INFO[esp];
                      const ativo = formEdit.especialidades.includes(esp);
                      return (
                        <button key={esp} type="button" onClick={() => toggleEspEdit(esp)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${ativo ? info.color : 'var(--border-2)'}`, background: ativo ? info.bg : 'var(--bg-elevated)', fontSize: 13, fontWeight: 500, color: ativo ? info.color : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          <info.Icon size={13} /> {info.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nova senha (opcional) */}
              <div className="form-group">
                <label className="label">Nova senha <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400, fontSize: 11 }}>(deixe vazio para não alterar)</span></label>
                <input className="input" type="password" placeholder="••••••••" value={formEdit.novaSenha}
                  onChange={e => setFormEdit({ ...formEdit, novaSenha: e.target.value })} />
              </div>

              {/* Ativo */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: 'var(--text-2)' }}>
                  <input type="checkbox" checked={formEdit.ativo}
                    onChange={e => setFormEdit({ ...formEdit, ativo: e.target.checked })}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  Conta ativa (pode fazer login)
                </label>
              </div>

              {erroEdit && <div className="alert-error" style={{ marginBottom: 14, fontSize: 13 }}>{erroEdit}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Salvando...</> : <><Check size={14} /> Salvar alterações</>}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
