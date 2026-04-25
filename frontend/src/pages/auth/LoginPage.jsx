import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap, Clock, Users, Star, Scissors, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../public/logo.png';

const TAGLINES = [
  { text: 'Atendimento imediato, sem espera',   icon: Zap },
  { text: 'Serviços expresso para o seu tempo', icon: Clock },
  { text: 'Equipe sempre disponível para você', icon: Users },
  { text: 'Beleza rápida, resultado incrível',  icon: Star },
];

const STATS = [
  { end: 1200, suffix: '+', label: 'Atendimentos' },
  { end: 98,   suffix: '%', label: 'Satisfação' },
  { end: 0,    suffix: 'min', label: 'Tempo de espera' },
];

function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

function StatCounter({ stat, delay }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  const count = useCountUp(started ? stat.end : 0);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Poppins', sans-serif", color: '#FFFFFF', lineHeight: 1 }}>
        {count}{stat.suffix}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {stat.label}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [taglineVisible, setTaglineVisible] = useState(true);

  // Rotação das taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineVisible(false);
      setTimeout(() => {
        setTaglineIdx((i) => (i + 1) % TAGLINES.length);
        setTaglineVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const TaglineIcon = TAGLINES[taglineIdx].icon;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

      {/* ── Lado esquerdo — navy animado ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1B2A4A 0%, #2D1B4E 60%, #1B2A4A 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative', overflow: 'hidden',
      }} className="login-left">

        {/* Orbs flutuantes */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,23,138,0.18) 0%, transparent 70%)',
            top: '-10%', left: '-10%',
            animation: 'orbFloat1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,93,4,0.14) 0%, transparent 70%)',
            bottom: '-5%', right: '5%',
            animation: 'orbFloat2 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,23,138,0.10) 0%, transparent 70%)',
            top: '50%', right: '-5%',
            animation: 'orbFloat3 7s ease-in-out infinite',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420, width: '100%' }}>

          {/* Logo */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'linear-gradient(135deg, #E85D04, #D4178A)', borderRadius: 16, marginBottom: 16, boxShadow: '0 8px 32px rgba(212,23,138,0.4)' }}>
              <Zap size={28} color="#FFFFFF" fill="#FFFFFF" />
            </div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
              <div style={{ fontSize: 44, color: '#FFFFFF' }}>RÁPIDO</div>
              <div style={{ fontSize: 44, background: 'linear-gradient(135deg, #E85D04, #D4178A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BEAUTY</div>
            </div>
          </div>

          {/* Tagline rotativa */}
          <div style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 40,
          }}>
            <div style={{
              opacity: taglineVisible ? 1 : 0,
              transform: taglineVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TaglineIcon size={16} color="rgba(255,255,255,0.8)" />
              </div>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                {TAGLINES[taglineIdx].text}
              </span>
            </div>
          </div>

          {/* Indicadores de tagline */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 48 }}>
            {TAGLINES.map((_, i) => (
              <div key={i} style={{
                width: i === taglineIdx ? 20 : 6,
                height: 6, borderRadius: 3,
                background: i === taglineIdx
                  ? 'linear-gradient(90deg, #E85D04, #D4178A)'
                  : 'rgba(255,255,255,0.2)',
                transition: 'all 0.4s ease',
              }} />
            ))}
          </div>

          {/* Contadores */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, background: 'rgba(255,255,255,0.06)',
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: '20px 12px', background: 'rgba(255,255,255,0.03)' }}>
                <StatCounter stat={s} delay={i * 200} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lado direito — formulário ── */}
      <div style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
        minHeight: '100vh',
      }} className="login-form-side">
        {/* Decoração fundo branco */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Orb canto superior direito */}
          <div style={{
            position: 'absolute', width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,23,138,0.06) 0%, transparent 70%)',
            top: '-15%', right: '-15%',
            animation: 'orbFloat2 9s ease-in-out infinite',
          }} />
          {/* Orb canto inferior esquerdo */}
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,93,4,0.05) 0%, transparent 70%)',
            bottom: '-10%', left: '-10%',
            animation: 'orbFloat1 11s ease-in-out infinite',
          }} />
          {/* Orb centro */}
          <div style={{
            position: 'absolute', width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,23,138,0.04) 0%, transparent 70%)',
            top: '40%', right: '10%',
            animation: 'orbFloat3 8s ease-in-out infinite',
          }} />

          {/* Ícones flutuantes de beleza */}
          {[
            { Icon: Scissors, top: '8%',  left: '8%',  size: 22, delay: '0s',   rot: '-15deg', opacity: 0.10 },
            { Icon: Sparkles, top: '14%', right: '7%', size: 18, delay: '1.2s', rot: '20deg',  opacity: 0.09 },
            { Icon: Star,     top: '72%', left: '5%',  size: 20, delay: '0.6s', rot: '-10deg', opacity: 0.08 },
            { Icon: Clock,    top: '78%', right: '6%', size: 22, delay: '1.8s', rot: '12deg',  opacity: 0.09 },
            { Icon: Zap,      top: '42%', left: '3%',  size: 16, delay: '2.4s', rot: '30deg',  opacity: 0.07 },
            { Icon: Star,     top: '35%', right: '4%', size: 14, delay: '3.0s', rot: '-20deg', opacity: 0.06 },
          ].map(({ Icon, top, left, right, size, delay, rot, opacity }, i) => (
            <div key={i} style={{
              position: 'absolute', top, left, right,
              opacity,
              transform: `rotate(${rot})`,
              animation: `iconFloat 6s ease-in-out ${delay} infinite`,
              color: '#D4178A',
            }}>
              <Icon size={size} />
            </div>
          ))}

          {/* Linha decorativa lateral esquerda */}
          <div style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3,
            background: 'linear-gradient(180deg, transparent, rgba(212,23,138,0.2), rgba(232,93,4,0.15), transparent)',
            borderRadius: 2,
          }} />
        </div>
        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, padding: '0 8px' }} className="login-form-inner">
          <div style={{ marginBottom: 32 }}>
            <img
              src={logo}
              alt="Rápido Beauty"
              style={{ width: '100%', maxWidth: 240, marginBottom: 32, display: 'block' }}
            />
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.5px' }}>
              Bem-vinda de volta
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Entre com suas credenciais para acessar o sistema
            </p>
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

            <div className="form-group" style={{ marginBottom: erro ? 12 : 28 }}>
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
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Entrando...</>
                : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {['Atendimento Imediato', 'Expresso', 'Sem Filas'].map((tag) => (
              <span key={tag} style={{
                fontSize: 11, fontWeight: 600, color: '#D4178A',
                background: 'rgba(212,23,138,0.08)',
                border: '1px solid rgba(212,23,138,0.18)',
                padding: '4px 10px', borderRadius: 20,
                letterSpacing: '0.3px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes iconFloat {
          0%,100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
          50%      { transform: translateY(-12px) rotate(var(--rot, 0deg)); }
        }
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(40px, -30px) scale(1.08); }
          66%      { transform: translate(-25px, 20px) scale(0.94); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-35px, 25px) scale(1.06); }
          66%      { transform: translate(30px, -20px) scale(0.96); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-20px, -30px) scale(1.1); }
        }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-form-side { padding: 32px 24px !important; }
          .login-form-inner { max-width: 100% !important; }
        }
        @media (min-width: 769px) {
          .login-form-side { padding: 48px 56px !important; }
        }
      `}</style>
    </div>
  );
}
