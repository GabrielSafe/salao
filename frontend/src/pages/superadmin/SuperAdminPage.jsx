import { useState, useEffect } from 'react';
import { Scissors, LogOut, Plus, ArrowLeft, Users, Zap, BarChart3, Globe, Loader2, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const { data } = await api.get('/saloes');
    setSaloes(data);
  }

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
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: '#0D0D0D', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setDetalhe(null)} style={{ gap: 6 }}>
            <ArrowLeft size={14} /> Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={14} color="#0A0A0A" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Dashboard do Salão</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ gap: 6 }}>
            <LogOut size={14} /> Sair
          </button>
        </nav>

        <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total funcionárias', valor: detalhe.totalFuncionarias, Icon: Users,  color: 'var(--blue)',    bg: 'var(--blue-dim)' },
              { label: 'Online agora',       valor: detalhe.online,            Icon: Zap,    color: 'var(--success)', bg: 'var(--success-dim)' },
            ].map(({ label, valor, Icon, color, bg }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
                <div className="kpi-value" style={{ color }}>{valor}</div>
                <div className="kpi-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atendimentos hoje</h3>
            {detalhe.atendimentosHoje.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>Nenhum atendimento hoje.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detalhe.atendimentosHoje.slice(0, 20).map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
                    <span>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>#{a.numeroComanda}</span>
                      <span style={{ color: 'var(--text-2)' }}> · {a.cliente?.nome} · {a.tipoServico}</span>
                    </span>
                    <span className={`badge badge-${a.status.toLowerCase()}`} style={{ fontSize: 10 }}>{a.status}</span>
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav style={{ background: '#0D0D0D', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={16} color="#0A0A0A" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Super Admin</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{usuario?.nome}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout} style={{ gap: 6 }}>
          <LogOut size={14} /> Sair
        </button>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: 860, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Salões cadastrados</h1>
            <p className="page-subtitle">{saloes.length} salão(ões) no sistema</p>
          </div>
          <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : <><Plus size={15} /> Novo salão</>}
          </button>
        </div>

        {mostrarForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: 15 }}>Criar novo salão</h3>
            <form onSubmit={handleCriar}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Nome do salão *</label>
                  <input className="input" placeholder="Ex: Salão da Maria" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="label">Slug (URL) *</label>
                  <input className="input" placeholder="Ex: salao-maria" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
                  {form.slug && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>URL pública: /{form.slug}</p>}
                </div>
              </div>
              {erro && <div className="alert-error" style={{ marginBottom: 14, fontSize: 13 }}>{erro}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</> : <><CheckCircle2 size={14} /> Criar salão</>}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {saloes.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.ativo ? 'var(--success-dim)' : 'var(--bg-elevated)', border: `1px solid ${s.ativo ? 'rgba(34,197,94,.2)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe size={18} color={s.ativo ? 'var(--success)' : 'var(--text-3)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{s.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 500 }}>/{s.slug}</span>
                  <span><Users size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />{s._count.funcionarias} funcionária(s)</span>
                  <span><BarChart3 size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />{s._count.atendimentos} atendimento(s)</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => verDashboard(s.id)}>
                <BarChart3 size={13} /> Dashboard
              </button>
            </div>
          ))}
          {saloes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              <Globe size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Nenhum salão cadastrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
