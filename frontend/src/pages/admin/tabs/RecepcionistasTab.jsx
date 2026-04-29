import { useState, useEffect, useCallback } from 'react';
import { Plus, User, Mail, Lock, Check, X, Edit3, Loader2, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../../../services/api';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';

function buildT(isDark) {
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', hover: '#333',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
    inputBg: '#1f1f1f', inputBorder: '#404040',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', hover: '#f9fafb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
    inputBg: '#f9fafb', inputBorder: '#e5e7eb',
  };
}
function useT() { const { isDark } = useThemeCtx(); return buildT(isDark); }

const FORM_VAZIO = { nome: '', email: '', senha: '', ativo: true };

export default function RecepcionistasTab() {
  const T = useT();
  const [lista, setLista]     = useState([]);
  const [modo, setModo]       = useState('lista'); // lista | novo | editar
  const [selecionada, setSel] = useState(null);
  const [form, setForm]       = useState(FORM_VAZIO);
  const [erros, setErros]     = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [verSenha, setVerSenha] = useState(false);

  const carregar = useCallback(async () => {
    try { const { data } = await api.get('/recepcionistas'); setLista(data); } catch {}
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function set(campo, val) {
    setForm(f => ({ ...f, [campo]: val }));
    if (erros[campo]) setErros(e => ({ ...e, [campo]: '' }));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome obrigatório';
    if (!form.email.trim()) e.email = 'E-mail obrigatório';
    if (modo === 'novo' && !form.senha) e.senha = 'Senha obrigatória';
    setErros(e);
    return !Object.keys(e).length;
  }

  async function handleSalvar(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setLoading(true); setErro('');
    try {
      if (modo === 'novo') {
        await api.post('/recepcionistas', form);
      } else {
        const payload = { nome: form.nome, email: form.email, ativo: form.ativo };
        if (form.senha) payload.novaSenha = form.senha;
        await api.put(`/recepcionistas/${selecionada.id}`, payload);
      }
      await carregar();
      setModo('lista'); setSel(null); setForm(FORM_VAZIO); setErro('');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  function abrirEditar(r) {
    setSel(r);
    setForm({ nome: r.nome, email: r.email, senha: '', ativo: r.ativo });
    setErros({}); setErro('');
    setModo('editar');
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: T.inputBg, border: `1.5px solid ${T.inputBorder}`,
    borderRadius: 8, fontSize: 14, color: T.fg,
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color .15s',
  };
  const focus = (e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.15)'; };
  const blur  = (e) => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = 'none'; };

  // ── Formulário ─────────────────────────────────────────────────────
  if (modo === 'novo' || modo === 'editar') {
    return (
      <div className="admin-tab">
        <button onClick={() => { setModo('lista'); setSel(null); setErro(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, boxShadow: T.shadow, maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.fg }}>{modo === 'novo' ? 'Nova recepcionista' : 'Editar recepcionista'}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Campos com * são obrigatórios</div>
            </div>
          </div>

          {erro && (
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <X size={14} /> {erro}
            </div>
          )}

          <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={11} /> Nome *
              </label>
              <input style={{ ...inputStyle, borderColor: erros.nome ? '#ef4444' : T.inputBorder }} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" onFocus={focus} onBlur={blur} />
              {erros.nome && <span style={{ fontSize: 11, color: '#ef4444' }}>{erros.nome}</span>}
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Mail size={11} /> E-mail *
              </label>
              <input style={{ ...inputStyle, borderColor: erros.email ? '#ef4444' : T.inputBorder }} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" onFocus={focus} onBlur={blur} />
              {erros.email && <span style={{ fontSize: 11, color: '#ef4444' }}>{erros.email}</span>}
            </div>

            {/* Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={11} /> {modo === 'novo' ? 'Senha *' : 'Nova senha (deixe vazio para não alterar)'}
              </label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, paddingRight: 38, borderColor: erros.senha ? '#ef4444' : T.inputBorder }} type={verSenha ? 'text' : 'password'} value={form.senha} onChange={e => set('senha', e.target.value)} placeholder="••••••••" onFocus={focus} onBlur={blur} />
                <button type="button" onClick={() => setVerSenha(!verSenha)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex', padding: 2 }}>
                  {verSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {erros.senha && <span style={{ fontSize: 11, color: '#ef4444' }}>{erros.senha}</span>}
            </div>

            {/* Ativo (só na edição) */}
            {modo === 'editar' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: T.muted, padding: '10px 12px', background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)}
                  style={{ accentColor: '#f59e0b', width: 15, height: 15 }} />
                Conta ativa (pode fazer login)
              </label>
            )}

            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button type="submit" disabled={loading}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', background: '#f59e0b', color: '#000', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
                {loading ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={15} />}
                {modo === 'novo' ? 'Cadastrar recepcionista' : 'Salvar alterações'}
              </button>
              <button type="button" onClick={() => { setModo('lista'); setSel(null); setErro(''); }}
                style={{ padding: '11px 18px', background: T.bg2, color: T.muted, borderRadius: 9, fontSize: 14, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Lista ───────────────────────────────────────────────────────────
  return (
    <div className="admin-tab">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.fg, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="#f59e0b" />
            </div>
            Recepcionistas
          </h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{lista.length} recepcionista{lista.length !== 1 ? 's' : ''} cadastrada{lista.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setModo('novo'); setForm(FORM_VAZIO); setErros({}); setErro(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#f59e0b', color: '#000', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(245,158,11,.3)', flexShrink: 0 }}>
          <Plus size={15} /> Nova recepcionista
        </button>
      </div>

      {lista.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '48px 20px', textAlign: 'center', boxShadow: T.shadow }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Shield size={22} color={T.sub} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.fg, marginBottom: 5 }}>Nenhuma recepcionista cadastrada</div>
          <div style={{ fontSize: 13, color: T.muted }}>Clique em "Nova recepcionista" para começar</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lista.map(r => (
            <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: T.shadow, transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              {/* Avatar */}
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: r.ativo ? 'linear-gradient(135deg,rgba(245,158,11,.3),rgba(217,119,6,.2))' : T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: r.ativo ? '#d97706' : T.sub, flexShrink: 0, border: `2px solid ${r.ativo ? 'rgba(245,158,11,.3)' : T.border}` }}>
                {r.nome[0].toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>{r.nome}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{r.email}</div>
              </div>

              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: r.ativo ? 'rgba(16,185,129,.1)' : T.bg2, color: r.ativo ? '#10b981' : T.sub, flexShrink: 0 }}>
                {r.ativo ? 'Ativa' : 'Inativa'}
              </span>

              <button onClick={() => abrirEditar(r)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, color: '#d97706', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                <Edit3 size={12} /> Editar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
