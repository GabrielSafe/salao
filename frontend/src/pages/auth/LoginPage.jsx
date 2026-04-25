import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [showSenha, setShowSenha] = useState(false);
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
      setErro(err.response?.data?.erro || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1B2A4A 0%, #2D1B4E 50%, #1B2A4A 100%)',
      overflow: 'hidden',
    }}>
      {/* Lado esquerdo — 50% */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative',
      }} className="login-left">
        {/* Círculo decorativo */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,23,138,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(232,93,4,0.06)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {/* Logo texto */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Zap size={32} fill="#D4178A" color="#D4178A" />
            </div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px' }}>
              <span style={{ color: '#FFFFFF' }}>RÁPIDO</span><br />
              <span style={{ background: 'linear-gradient(135deg, #E85D04, #D4178A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BEAUTY</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 10, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Salão de Beleza Veloz
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Atendimento Imediato', 'Expresso', 'Sem Filas'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #E85D04, #D4178A)', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lado direito — 50% */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              Bem-vinda de volta
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Entre com suas credenciais para acessar</p>
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
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: erro ? 12 : 24 }}>
              <label className="label">Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-3)', padding: 4 }}
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {erro && <div className="alert-error" style={{ marginBottom: 16, fontSize: 13 }}>{erro}</div>}

            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }} disabled={loading}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Entrando...</> : 'Entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 24 }}>
            Sistema de atendimento inteligente
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
