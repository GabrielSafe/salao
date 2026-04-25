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
    <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* ── Lado esquerdo — navy animado ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1B2A4A 0%, #2D1B4E 60%, #1B2A4A 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative',
        overflow: 'visible',
      }} className="login-left">

        {/* ── Mechas SVG — ancoradas na borda direita (linha divisória exata) ── */}
        <div style={{
          position: 'absolute',
          right: -60,       /* -60px = metade do SVG ultrapassa pra direita */
          top: 0, bottom: 0,
          width: 120,
          zIndex: 20, pointerEvents: 'none',
        }} className="hair-divider">
          <svg width="120" height="100%" viewBox="0 0 120 900"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block', height: '100%' }}
          >
            <defs>
              <linearGradient id="hg1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#E85D04" stopOpacity="1"   />
                <stop offset="50%"  stopColor="#D4178A" stopOpacity="1"   />
                <stop offset="100%" stopColor="#9B12B8" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="hg2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#E85D04" stopOpacity="0.55" />
                <stop offset="50%"  stopColor="#D4178A" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#9B12B8" stopOpacity="0.45" />
              </linearGradient>
              </defs>
            {/* x=60 = centro do SVG = borda direita do lado esquerdo = linha divisória */}
            <path className="hair-1"
              d="M 60 0 C 84 85 36 175 65 260 C 90 342 40 430 68 515 C 92 596 44 682 64 765 L 60 900"
              stroke="url(#hg1)" strokeWidth="7" fill="none"
              strokeLinecap="round"
              strokeDasharray="1800" strokeDashoffset="1800"
            />
            <path className="hair-2"
              d="M 54 0 C 28 95 86 190 48 282 C 20 365 80 455 40 548 C 14 628 72 714 38 800 L 36 900"
              stroke="url(#hg1)" strokeWidth="4.5" fill="none"
              strokeLinecap="round" opacity="0.8"
              strokeDasharray="1800" strokeDashoffset="1800"
            />
            <path className="hair-3"
              d="M 66 0 C 96 90 38 185 78 275 C 108 358 46 448 82 535 C 106 616 54 702 86 788 L 84 900"
              stroke="url(#hg2)" strokeWidth="3.5" fill="none"
              strokeLinecap="round"
              strokeDasharray="1800" strokeDashoffset="1800"
            />
            <path className="hair-4"
              d="M 57 20 C 32 120 82 218 46 312 C 18 398 78 488 42 578 C 16 656 70 740 38 828 L 36 900"
              stroke="url(#hg2)" strokeWidth="2.2" fill="none"
              strokeLinecap="round" opacity="0.6"
              strokeDasharray="1800" strokeDashoffset="1800"
            />
          </svg>
        </div>

        {/* Orbs flutuantes — em container clipado pra não vazar */}
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
        position: 'relative', overflow: 'hidden',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
      }}>
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
        <div style={{ width: '100%', maxWidth: 420, padding: '40px 48px', position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <img
              src={logo}
              alt="Rápido Beauty"
              style={{ width: '100%', maxWidth: 260, marginBottom: 36, display: 'block' }}
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
        /* ── Animações das mechas ── */
        .hair-1 { animation: drawHair 2.0s ease forwards, waveHair 4s ease-in-out 2s infinite; }
        .hair-2 { animation: drawHair 2.3s ease 0.2s forwards, waveHair 5s ease-in-out 2.3s infinite; }
        .hair-3 { animation: drawHair 2.6s ease 0.4s forwards, waveHair 4.5s ease-in-out 2.6s infinite; }
        .hair-4 { animation: drawHair 2.8s ease 0.6s forwards, waveHair 6s ease-in-out 2.8s infinite; }

        @keyframes drawHair {
          from { stroke-dashoffset: 1800; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes waveHair {
          0%,100% { transform: scaleX(1)   translateX(0px); }
          30%     { transform: scaleX(1.04) translateX(1px); }
          70%     { transform: scaleX(0.97) translateX(-1px); }
        }

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
          .login-left   { display: none !important; }
          .hair-divider { display: none !important; }
        }
      `}</style>
    </div>
  );
}
