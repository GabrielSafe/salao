import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, X, ChevronDown, Phone, Mail, Calendar,
  Instagram, HelpCircle, FileText, User, ArrowLeft, Scissors,
  Sparkles, Hand, Leaf, Check, Loader2
} from 'lucide-react';
import api from '../../../services/api';

const GENEROS = ['Feminino', 'Masculino', 'Não-binário', 'Prefiro não informar'];
const COMO_CONHECEU = ['Instagram', 'TikTok', 'Google', 'Indicação de amigo', 'Passou na rua', 'Facebook', 'Outro'];

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
};

const FORM_VAZIO = {
  nome: '', telefone: '', cpf: '', email: '',
  genero: '', nascimento: '', redesSociais: '',
  comoConheceu: '', observacoes: '',
};

function InputField({ label, icon: Icon, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
        {Icon && <Icon size={11} />}
        {label}
        {required && <span style={{ color: '#D4178A' }}>*</span>}
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

const inputStyle = (hasError) => ({
  width: '100%', padding: '10px 12px',
  background: '#21262D', border: `1.5px solid ${hasError ? '#EF4444' : 'rgba(255,255,255,.1)'}`,
  borderRadius: 8, fontSize: 14, color: '#E6EDF3',
  outline: 'none', transition: 'border-color .15s',
  boxSizing: 'border-box',
});

function ClienteForm({ inicial, onSalvar, onCancelar, loading }) {
  const [form, setForm] = useState(inicial || FORM_VAZIO);
  const [erros, setErros] = useState({});

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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Nome */}
        <InputField label="Nome completo" icon={User} required error={erros.nome}>
          <input
            style={inputStyle(erros.nome)}
            placeholder="Ex: Ana Clara Silva"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = erros.nome ? '#EF4444' : 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* Telefone */}
        <InputField label="Telefone" icon={Phone} required error={erros.telefone}>
          <input
            style={inputStyle(erros.telefone)}
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={e => set('telefone', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = erros.telefone ? '#EF4444' : 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* Email */}
        <InputField label="E-mail" icon={Mail}>
          <input
            style={inputStyle(false)}
            type="email" placeholder="email@exemplo.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* CPF */}
        <InputField label="CPF">
          <input
            style={inputStyle(false)}
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={e => set('cpf', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* Gênero */}
        <InputField label="Gênero" icon={User}>
          <select
            style={{ ...inputStyle(false), cursor: 'pointer' }}
            value={form.genero}
            onChange={e => set('genero', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          >
            <option value="">Selecionar...</option>
            {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </InputField>

        {/* Nascimento */}
        <InputField label="Data de nascimento" icon={Calendar}>
          <input
            style={inputStyle(false)}
            type="date"
            value={form.nascimento}
            onChange={e => set('nascimento', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* Redes Sociais */}
        <InputField label="Redes sociais" icon={Instagram}>
          <input
            style={inputStyle(false)}
            placeholder="@usuario ou link"
            value={form.redesSociais}
            onChange={e => set('redesSociais', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          />
        </InputField>

        {/* Como nos conheceu */}
        <InputField label="Como nos conheceu" icon={HelpCircle}>
          <select
            style={{ ...inputStyle(false), cursor: 'pointer' }}
            value={form.comoConheceu}
            onChange={e => set('comoConheceu', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          >
            <option value="">Selecionar...</option>
            {COMO_CONHECEU.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </InputField>
      </div>

      {/* Observações — full width */}
      <div style={{ marginBottom: 24 }}>
        <InputField label="Observações" icon={FileText}>
          <textarea
            style={{ ...inputStyle(false), minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Alergias, preferências, observações importantes..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            onFocus={e => e.target.style.borderColor = '#D4178A'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
          />
        </InputField>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: 'linear-gradient(135deg,#E85D04,#D4178A)', color: '#fff', borderRadius: 9, fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={15} />}
          {inicial ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <button type="button" onClick={onCancelar}
          style={{ padding: '10px 18px', background: 'rgba(255,255,255,.06)', color: '#8B949E', borderRadius: 9, fontSize: 14, border: '1px solid rgba(255,255,255,.08)', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ClienteCard({ cliente, onEditar, onVerHistorico }) {
  const inicial = cliente.nome?.[0]?.toUpperCase();
  const idade = cliente.nascimento
    ? Math.floor((Date.now() - new Date(cliente.nascimento)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '16px', transition: 'border-color .2s', display: 'flex', alignItems: 'flex-start', gap: 14 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'}
    >
      {/* Avatar */}
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.3), rgba(232,93,4,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#E6EDF3', flexShrink: 0 }}>
        {inicial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3', marginBottom: 4 }}>{cliente.nome}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#6B7280' }}>
          {cliente.telefone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{cliente.telefone}</span>}
          {cliente.email    && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{cliente.email}</span>}
          {idade            && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{idade} anos</span>}
          {cliente.genero   && <span>{cliente.genero}</span>}
          {cliente.comoConheceu && (
            <span style={{ background: 'rgba(212,23,138,.1)', color: '#D4178A', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
              {cliente.comoConheceu}
            </span>
          )}
        </div>
        {cliente.observacoes && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#4B5563', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{cliente.observacoes}"
          </div>
        )}
        {/* Total atendimentos */}
        <div style={{ marginTop: 6, fontSize: 11, color: '#374151' }}>
          {cliente._count?.atendimentos ?? 0} atendimento{(cliente._count?.atendimentos ?? 0) !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onVerHistorico(cliente)}
          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, color: '#8B949E', cursor: 'pointer' }}>
          Histórico
        </button>
        <button onClick={() => onEditar(cliente)}
          style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', background: 'rgba(212,23,138,.1)', border: '1px solid rgba(212,23,138,.2)', borderRadius: 7, color: '#D4178A', cursor: 'pointer' }}>
          Editar
        </button>
      </div>
    </div>
  );
}

export default function ClientesTab() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [modo, setModo] = useState('lista'); // lista | novo | editar | historico
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
    setErro('');
    setLoading(true);
    try {
      if (modo === 'editar' && clienteSelecionado) {
        await api.put(`/clientes/${clienteSelecionado.id}`, form);
      } else {
        await api.post('/clientes', form);
      }
      await carregar(busca);
      setModo('lista');
      setClienteSelecionado(null);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerHistorico(cliente) {
    setClienteSelecionado(cliente);
    setModo('historico');
    try {
      const { data } = await api.get(`/clientes/${cliente.id}/historico`);
      setHistorico(data);
    } catch {}
  }

  // ── Vista: Histórico ──────────────────────────────────────────────
  if (modo === 'historico' && clienteSelecionado) {
    return (
      <div>
        <button onClick={() => { setModo('lista'); setHistorico(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#8B949E', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.3), rgba(232,93,4,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#E6EDF3' }}>
              {clienteSelecionado.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3' }}>{clienteSelecionado.nome}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3, display: 'flex', gap: 12 }}>
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
              <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,.04)', borderRadius: 9 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#D4178A' }}>{valor}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', fontSize: 13, fontWeight: 700, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico de atendimentos</div>
          {!historico ? (
            <div style={{ padding: '32px', textAlign: 'center' }}><Loader2 size={20} color="#374151" style={{ animation: 'spin .7s linear infinite' }} /></div>
          ) : historico.atendimentos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#374151', fontSize: 13 }}>Nenhum atendimento registrado</div>
          ) : (
            historico.atendimentos.map(a => {
              const info = SERVICE_INFO[a.tipoServico];
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  {info && (
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <info.Icon size={14} color={info.color} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#C9D1D9' }}>{info?.label}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')} · {a.funcionaria?.usuario?.nome || '—'}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: a.status === 'FINALIZADO' ? 'rgba(16,185,129,.12)' : a.status === 'EM_ATENDIMENTO' ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.06)', color: a.status === 'FINALIZADO' ? '#10B981' : a.status === 'EM_ATENDIMENTO' ? '#F59E0B' : '#6B7280' }}>
                    {a.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Vista: Formulário novo/editar ─────────────────────────────────
  if (modo === 'novo' || modo === 'editar') {
    return (
      <div>
        <button onClick={() => { setModo('lista'); setClienteSelecionado(null); setErro(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', color: '#8B949E', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ background: '#1C2128', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3', marginBottom: 4 }}>
            {modo === 'editar' ? 'Editar cliente' : 'Cadastrar nova cliente'}
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
            Campos com <span style={{ color: '#D4178A' }}>*</span> são obrigatórios
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

  // ── Vista: Lista ──────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(103,232,249,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#67E8F9" />
            </div>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrada{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModo('novo')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'linear-gradient(135deg,#E85D04,#D4178A)', color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(212,23,138,.3)' }}>
          <Plus size={15} /> Nova cliente
        </button>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
        <input
          style={{ width: '100%', padding: '11px 14px 11px 40px', background: '#1C2128', border: '1.5px solid rgba(255,255,255,.08)', borderRadius: 10, fontSize: 14, color: '#E6EDF3', outline: 'none', boxSizing: 'border-box' }}
          placeholder="Buscar por nome, telefone, e-mail ou CPF..."
          value={busca}
          onChange={e => handleBusca(e.target.value)}
          onFocus={e => e.target.style.borderColor = '#D4178A'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.08)'}
        />
        {busca && (
          <button onClick={() => { setBusca(''); carregar(''); }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: '#4B5563', cursor: 'pointer', padding: 2 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista */}
      {clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1C2128', borderRadius: 12, border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Users size={24} color="#374151" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#4B5563', marginBottom: 6 }}>
            {busca ? 'Nenhuma cliente encontrada' : 'Nenhuma cliente cadastrada'}
          </div>
          <div style={{ fontSize: 13, color: '#2D3748' }}>
            {busca ? 'Tente outro termo de busca' : 'Clique em "Nova cliente" para começar'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clientes.map(c => (
            <ClienteCard
              key={c.id}
              cliente={c}
              onEditar={c => { setClienteSelecionado(c); setModo('editar'); }}
              onVerHistorico={handleVerHistorico}
            />
          ))}
        </div>
      )}
    </div>
  );
}
