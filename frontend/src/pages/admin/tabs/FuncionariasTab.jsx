import { useState, useEffect } from 'react';
import api from '../../../services/api';

const SERVICO_INFO = { CABELO: { label: 'Cabelo', icon: '✂️' }, MAQUIAGEM: { label: 'Maquiagem', icon: '💄' }, MAO: { label: 'Mão', icon: '💅' }, PE: { label: 'Pé', icon: '🦶' } };
const ESPECIALIDADES = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE'];
const STATUS_COR = { OFFLINE: '#9ca3af', ONLINE: 'var(--verde)', EM_ATENDIMENTO: 'var(--rosa)' };

export default function FuncionariasTab() {
  const [funcionarias, setFuncionarias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [historico, setHistorico] = useState(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', especialidades: [], multiTarefas: false });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function carregar() {
    const { data } = await api.get('/funcionarias');
    setFuncionarias(data);
  }

  useEffect(() => { carregar(); }, []);

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

  if (historico) {
    const { funcionaria, estatisticas } = historico;
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => setHistorico(null)} style={{ marginBottom: 16 }}>← Voltar</button>
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--rosa-claro)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👩</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{funcionaria.usuario?.nome}</div>
              <div style={{ color: 'var(--texto-suave)', fontSize: 13 }}>{funcionaria.usuario?.email}</div>
            </div>
          </div>
          <div className="grid-3">
            {[
              { label: 'Total', valor: estatisticas.totalAtendimentos },
              { label: 'Finalizados', valor: estatisticas.finalizados },
              { label: 'Tempo médio', valor: `${estatisticas.tempoMedioMinutos} min` },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'var(--cinza-bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--rosa)' }}>{s.valor}</div>
                <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Histórico de atendimentos</h3>
          {funcionaria.atendimentos.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Nenhum atendimento registrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {funcionaria.atendimentos.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--cinza-bg)', borderRadius: 8 }}>
                  <span style={{ fontSize: 20 }}>{SERVICO_INFO[a.tipoServico]?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.cliente?.nome}</div>
                    <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <span className={`badge badge-${a.status.toLowerCase()}`} style={{ fontSize: 11 }}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
          {mostrarForm ? 'Cancelar' : '+ Nova funcionária'}
        </button>
      </div>

      {mostrarForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Cadastrar funcionária</h3>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.multiTarefas} onChange={(e) => setForm({ ...form, multiTarefas: e.target.checked, especialidades: [] })} />
                Multitarefas (todas as especialidades)
              </label>
              {!form.multiTarefas && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ESPECIALIDADES.map((esp) => (
                    <button key={esp} type="button" onClick={() => toggleEsp(esp)}
                      style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${form.especialidades.includes(esp) ? 'var(--rosa)' : 'var(--cinza-borda)'}`, background: form.especialidades.includes(esp) ? 'var(--rosa-claro)' : '#fff', fontSize: 13, fontWeight: 500 }}>
                      {SERVICO_INFO[esp]?.icon} {SERVICO_INFO[esp]?.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erro}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {funcionarias.map((f) => (
          <div key={f.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COR[f.status], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{f.usuario?.nome}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {f.especialidades.map((esp) => (
                  <span key={esp} className={`tag-servico tag-${esp}`}>{SERVICO_INFO[esp]?.icon} {SERVICO_INFO[esp]?.label}</span>
                ))}
                {f.multiTarefas && <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>· multitarefas</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: STATUS_COR[f.status], fontWeight: 600 }}>{f.status}</div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }} onClick={() => verHistorico(f.id)}>Ver histórico</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
