import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, X, Phone, Mail, Calendar,
  Instagram, HelpCircle, FileText, User, ArrowLeft, Scissors,
  Sparkles, Hand, Leaf, Check, Loader2, Eye
} from 'lucide-react';
import api from '../../../services/api';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';

const GENEROS = ['Feminino', 'Masculino', 'Não-binário', 'Prefiro não informar'];
const COMO_CONHECEU = ['Instagram', 'TikTok', 'Google', 'Indicação de amigo', 'Passou na rua', 'Facebook', 'Outro'];

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,  color: '#38BDF8', bg: 'rgba(56,189,248,.12)' },
};

const FORM_VAZIO = {
  nome: '', telefone: '', cpf: '', email: '',
  genero: '', nascimento: '', redesSociais: '',
  comoConheceu: '', observacoes: '',
};

function buildT(isDark) {
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', hover: '#333333',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
    inputBg: '#1f1f1f', inputBorder: '#404040', inputText: '#e5e5e5',
    selectBg: '#1f1f1f',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', hover: '#f9fafb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
    inputBg: '#f9fafb', inputBorder: '#e5e7eb', inputText: '#262626',
    selectBg: '#ffffff',
  };
}
function useT() { const { isDark } = useThemeCtx(); return buildT(isDark); }

function InputField({ label, icon: Icon, required, children, error, T }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon size={11} />}
        {label}
        {required && <span style={{ color: T.primary }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>
          {error}
        </span>
      )}
    </div>
  );
}

function ClienteForm({ inicial, onSalvar, onCancelar, loading }) {
  const T = useT();
  const [form, setForm] = useState(inicial || FORM_VAZIO);
  const [erros, setErros] = useState({});

  const inputStyle = (hasError) => ({
    width: '100%', padding: '10px 12px',
    background: T.inputBg, border: `1.5px solid ${hasError ? '#EF4444' : T.inputBorder}`,
    borderRadius: 8, fontSize: 14, color: T.inputText,
    outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  });

  function set(campo, val) {
    setForm(f => ({ ...f, [campo]: val }));
    if (erros[campo]) setErros(e => ({ ...e, [campo]: '' }));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório';
    if (!form.telefone.trim()) e.telefone = 'Telefone é obrigatório';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (validar()) onSalvar(form);
  }

  const focusStyle = (e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(245,158,11,.15)`; };
  const blurStyle  = (e, hasErr) => { e.target.style.borderColor = hasErr ? '#EF4444' : T.inputBorder; e.target.style.boxShadow = 'none'; };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="clientes-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <InputField label="Nome completo" icon={User} required error={erros.nome} T={T}>
          <input style={inputStyle(erros.nome)} placeholder="Ex: Ana Clara Silva"
            value={form.nome} onChange={e => set('nome', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, erros.nome)} />
        </InputField>

        <InputField label="Telefone" icon={Phone} required error={erros.telefone} T={T}>
          <input style={inputStyle(erros.telefone)} placeholder="(00) 00000-0000"
            value={form.telefone} onChange={e => set('telefone', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, erros.telefone)} />
        </InputField>

        <InputField label="E-mail" icon={Mail} T={T}>
          <input style={inputStyle(false)} type="email" placeholder="email@exemplo.com"
            value={form.email} onChange={e => set('email', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)} />
        </InputField>

        <InputField label="CPF" T={T}>
          <input style={inputStyle(false)} placeholder="000.000.000-00"
            value={form.cpf} onChange={e => set('cpf', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)} />
        </InputField>

        <InputField label="Gênero" icon={User} T={T}>
          <select style={{ ...inputStyle(false), cursor: 'pointer', background: T.selectBg }}
            value={form.genero} onChange={e => set('genero', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)}>
            <option value="">Selecionar...</option>
            {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </InputField>

        <InputField label="Data de nascimento" icon={Calendar} T={T}>
          <input style={{ ...inputStyle(false), colorScheme: 'auto' }} type="date"
            value={form.nascimento} onChange={e => set('nascimento', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)} />
        </InputField>

        <InputField label="Redes sociais" icon={Instagram} T={T}>
          <input style={inputStyle(false)} placeholder="@usuario ou link"
            value={form.redesSociais} onChange={e => set('redesSociais', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)} />
        </InputField>

        <InputField label="Como nos conheceu" icon={HelpCircle} T={T}>
          <select style={{ ...inputStyle(false), cursor: 'pointer', background: T.selectBg }}
            value={form.comoConheceu} onChange={e => set('comoConheceu', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)}>
            <option value="">Selecionar...</option>
            {COMO_CONHECEU.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </InputField>
      </div>

      <div style={{ marginBottom: 24 }}>
        <InputField label="Observações" icon={FileText} T={T}>
          <textarea
            style={{ width: '100%', padding: '10px 12px', background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 8, fontSize: 14, color: T.inputText, outline: 'none', minHeight: 90, resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color .15s' }}
            placeholder="Alergias, preferências, observações importantes..."
            value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
            onFocus={focusStyle} onBlur={e => blurStyle(e, false)}
          />
        </InputField>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="submit" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: '#f59e0b', color: '#000', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={15} />}
          {inicial ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <button type="button" onClick={onCancelar}
          style={{ padding: '10px 18px', background: T.bg2, color: T.muted, borderRadius: 9, fontSize: 14, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

function ClienteCard({ cliente, onEditar, onVerHistorico, T }) {
  const inicial = cliente.nome?.[0]?.toUpperCase();
  const idade = cliente.nascimento
    ? Math.floor((Date.now() - new Date(cliente.nascimento)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', transition: 'border-color .2s, box-shadow .2s', display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: T.shadow }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 2px 12px rgba(245,158,11,.1)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = T.shadow; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245,158,11,.3), rgba(217,119,6,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
        {inicial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.fg, marginBottom: 4 }}>{cliente.nome}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: T.muted }}>
          {cliente.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{cliente.telefone}</span>}
          {cliente.email    && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{cliente.email}</span>}
          {idade            && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{idade} anos</span>}
          {cliente.genero   && <span>{cliente.genero}</span>}
          {cliente.comoConheceu && (
            <span style={{ background: 'rgba(245,158,11,.12)', color: '#d97706', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
              {cliente.comoConheceu}
            </span>
          )}
        </div>
        {cliente.observacoes && (
          <div style={{ marginTop: 5, fontSize: 12, color: T.sub, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{cliente.observacoes}"
          </div>
        )}
        <div style={{ marginTop: 5, fontSize: 11, color: T.muted }}>
          {cliente._count?.atendimentos ?? 0} atendimento{(cliente._count?.atendimentos ?? 0) !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onVerHistorico(cliente)}
          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 7, color: T.muted, cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.fg; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
          Histórico
        </button>
        <button onClick={() => onEditar(cliente)}
          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 7, color: '#d97706', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,.1)'; }}>
          Editar
        </button>
      </div>
    </div>
  );
}

export default function ClientesTab() {
  const T = useT();
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [modo, setModo] = useState('lista');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const timer = useRef(null);

  useEffect(() => { carregar(); }, []);

  async function carregar(q = '') {
    try {
      const { data } = await api.get(`/clientes${q ? `?q=${q}` : ''}`);
      setClientes(data);
    } catch {}
  }

  function handleBusca(texto) {
    setBusca(texto);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => carregar(texto), 350);
  }

  async function handleSalvar(form) {
    setErro(''); setLoading(true);
    try {
      if (modo === 'editar' && clienteSelecionado) {
        await api.put(`/clientes/${clienteSelecionado.id}`, form);
      } else {
        await api.post('/clientes', form);
      }
      await carregar(busca);
      setModo('lista'); setClienteSelecionado(null);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setLoading(false); }
  }

  async function handleVerHistorico(cliente) {
    setClienteSelecionado(cliente); setModo('historico');
    try {
      const { data } = await api.get(`/clientes/${cliente.id}/historico`);
      setHistorico(data);
    } catch {}
  }

  // ── Vista: Histórico ───────────────────────────────────────────────
  if (modo === 'historico' && clienteSelecionado) {
    return (
      <div className="admin-tab">
        <button onClick={() => { setModo('lista'); setHistorico(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(245,158,11,.3),rgba(217,119,6,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#d97706' }}>
              {clienteSelecionado.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.fg }}>{clienteSelecionado.nome}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 3, display: 'flex', gap: 12 }}>
                {clienteSelecionado.telefone && <span>{clienteSelecionado.telefone}</span>}
                {clienteSelecionado.email && <span>{clienteSelecionado.email}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total', valor: historico?.atendimentos?.length ?? 0 },
              { label: 'Finalizados', valor: historico?.atendimentos?.filter(a => a.status === 'FINALIZADO').length ?? 0 },
              { label: 'Última visita', valor: historico?.atendimentos?.[0] ? new Date(historico.atendimentos[0].createdAt).toLocaleDateString('pt-BR') : '-' },
            ].map(({ label, valor }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: T.bg2, borderRadius: 9, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.primary }}>{valor}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.shadow }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Histórico de atendimentos
          </div>
          {!historico ? (
            <div style={{ padding: '32px', textAlign: 'center' }}><Loader2 size={20} color={T.muted} style={{ animation: 'spin .7s linear infinite' }} /></div>
          ) : historico.atendimentos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhum atendimento registrado</div>
          ) : (
            historico.atendimentos.map(a => {
              const info = SERVICE_INFO[a.tipoServico];
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                  {info && (
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <info.Icon size={14} color={info.color} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{info?.label || a.tipoServico}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.funcionaria?.usuario?.nome || '—'}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: a.status === 'FINALIZADO' ? 'rgba(16,185,129,.12)' : a.status === 'EM_ATENDIMENTO' ? 'rgba(245,158,11,.12)' : T.bg2, color: a.status === 'FINALIZADO' ? '#10B981' : a.status === 'EM_ATENDIMENTO' ? '#d97706' : T.muted }}>
                    {a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Vista: Formulário ──────────────────────────────────────────────
  if (modo === 'novo' || modo === 'editar') {
    return (
      <div className="admin-tab">
        <button onClick={() => { setModo('lista'); setClienteSelecionado(null); setErro(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px', boxShadow: T.shadow }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.fg, marginBottom: 4 }}>
            {modo === 'editar' ? 'Editar cliente' : 'Cadastrar nova cliente'}
          </h2>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>
            Campos com <span style={{ color: T.primary }}>*</span> são obrigatórios
          </p>

          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>
              <span>⚠</span> {erro}
            </div>
          )}

          <ClienteForm
            inicial={modo === 'editar' ? {
              ...clienteSelecionado,
              nascimento: clienteSelecionado?.nascimento
                ? new Date(clienteSelecionado.nascimento).toISOString().split('T')[0]
                : '',
            } : null}
            onSalvar={handleSalvar}
            onCancelar={() => { setModo('lista'); setClienteSelecionado(null); setErro(''); }}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  // ── Vista: Lista ───────────────────────────────────────────────────
  return (
    <div className="admin-tab">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.fg, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(56,189,248,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#38BDF8" />
            </div>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrada{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModo('novo')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#f59e0b', color: '#000', borderRadius: 9, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(245,158,11,.3)', flexShrink: 0 }}>
          <Plus size={15} /> Nova cliente
        </button>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
        <input
          style={{ width: '100%', padding: '11px 14px 11px 40px', background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 10, fontSize: 14, color: T.fg, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', transition: 'border-color .15s' }}
          placeholder="Buscar por nome, telefone, e-mail ou CPF..."
          value={busca} onChange={e => handleBusca(e.target.value)}
          onFocus={e => { e.target.style.borderColor = T.primary; }}
          onBlur={e => { e.target.style.borderColor = T.border; }}
        />
        {busca && (
          <button onClick={() => { setBusca(''); carregar(''); }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista */}
      {clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={24} color={T.muted} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.fg, marginBottom: 6 }}>
            {busca ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>
            {busca ? 'Tente outro termo de busca' : 'Clique em "Nova cliente" para começar'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clientes.map(c => (
            <ClienteCard key={c.id} cliente={c} T={T}
              onEditar={c => { setClienteSelecionado(c); setModo('editar'); }}
              onVerHistorico={handleVerHistorico}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .clientes-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
