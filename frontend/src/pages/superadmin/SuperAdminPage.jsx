import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function SuperAdminPage() {
  const { usuario, logout } = useAuth();
  const [saloes, setSaloes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nome: '', slug: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [detalhe, setDetalhe] = useState(null);

  async function carregar() {
    const { data } = await api.get('/saloes');
    setSaloes(data);
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await api.post('/saloes', form);
      setForm({ nome: '', slug: '' });
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar salão');
    } finally {
      setLoading(false);
    }
  }

  async function verDashboard(id) {
    const { data } = await api.get(`/saloes/${id}/dashboard`);
    setDetalhe(data);
  }

  if (detalhe) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cinza-bg)' }}>
        <nav style={{ background: 'var(--rosa)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setDetalhe(null)} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>← Voltar</button>
          <span style={{ color: '#fff', fontWeight: 700 }}>Dashboard do Salão</span>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>Sair</button>
        </nav>
        <div style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto' }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total funcionárias', valor: detalhe.totalFuncionarias },
              { label: 'Online agora', valor: detalhe.online },
            ].map((k) => (
              <div key={k.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--rosa)' }}>{k.valor}</div>
                <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Atendimentos hoje</h3>
            {detalhe.atendimentosHoje.length === 0 ? (
              <p style={{ color: 'var(--texto-suave)', fontSize: 14 }}>Nenhum atendimento hoje.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detalhe.atendimentosHoje.slice(0, 20).map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--cinza-bg)', borderRadius: 8, fontSize: 13 }}>
                    <span><strong>#{a.numeroComanda}</strong> · {a.cliente?.nome} · {a.tipoServico}</span>
                    <span className={`badge badge-${a.status.toLowerCase()}`} style={{ fontSize: 11 }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cinza-bg)' }}>
      <nav style={{ background: '#1a1a2e', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>🌐 Super Admin</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Gerenciamento global · {usuario?.nome}</div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>Sair</button>
      </nav>

      <div style={{ padding: '20px 16px', maxWidth: 800, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Salões cadastrados</h1>
            <p className="page-subtitle">{saloes.length} salão(ões) no sistema</p>
          </div>
          <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Novo salão'}
          </button>
        </div>

        {mostrarForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Criar novo salão</h3>
            <form onSubmit={handleCriar}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Nome do salão *</label>
                  <input className="input" placeholder="Ex: Salão da Maria" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Slug (URL) *</label>
                  <input className="input" placeholder="Ex: salao-maria" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                  {form.slug && <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 4 }}>URL pública: /{form.slug}</p>}
                </div>
              </div>
              {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erro}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar salão'}</button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {saloes.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.ativo ? 'var(--verde)' : '#ccc', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.nome}</div>
                <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
                  /{s.slug} · {s._count.funcionarias} funcionária(s) · {s._count.atendimentos} atendimento(s)
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => verDashboard(s.id)}>Ver dashboard</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
