import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SERVICO_LABELS = { CABELO: '✂️ Cabelo', MAQUIAGEM: '💄 Maquiagem', MAO: '💅 Mão', PE: '🦶 Pé' };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const usuario = await login(form.email, form.senha);
      if (usuario.role === 'SUPERADMIN') navigate('/superadmin');
      else if (usuario.role === 'ADMIN') navigate('/admin');
      else navigate('/funcionaria');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fce4f3 0%, #f5f5f5 100%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💇‍♀️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--rosa)' }}>Sistema Salão</h1>
          <p style={{ fontSize: 14, color: 'var(--texto-suave)', marginTop: 4 }}>Área restrita — Equipe</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              required
            />
          </div>

          {erro && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {erro}
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
