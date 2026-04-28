import { useState, useRef, useEffect } from 'react';
import {
  Search, X, Check, Plus, Scissors, Sparkles, Hand, Leaf, Eye,
  Loader2, CheckCircle2, Trash2, User, Zap, Armchair
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';
import api from '../../../services/api';
import { CATALOG, CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.1)',  border: 'rgba(168,85,247,.2)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.1)',  border: 'rgba(236,72,153,.2)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.1)',   border: 'rgba(251,146,60,.2)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.1)',    border: 'rgba(34,197,94,.2)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.1)',   border: 'rgba(56,189,248,.2)'  },
};

const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

function useT() {
  const { isDark } = useThemeCtx();
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', inputBg: '#1f1f1f', inputBorder: '#404040',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', inputBg: '#f9fafb', inputBorder: '#e5e7eb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
  };
}

// ── Tela de confirmação ────────────────────────────────────────────────────
function ConfirmacaoComanda({ sucesso, onNova }) {
  const T = useT();
  const itens = sucesso.atendimentos || [];
  const total = itens.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,.18)', background: T.card, border: `1px solid ${T.border}` }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '36px 32px 32px', textAlign: 'center', color: '#000', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(0,0,0,.02) 0px, rgba(0,0,0,.02) 1px, transparent 1px, transparent 12px)', pointerEvents: 'none' }} />
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', backdropFilter: 'blur(4px)' }}>
            <CheckCircle2 size={26} color="#000" />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: .7, marginBottom: 6 }}>Comanda criada</div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', fontFamily: "'Poppins', sans-serif" }}>#{sucesso.numero}</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 10, opacity: .85 }}>{sucesso.nome}</div>
          {sucesso.cadeiraNome && (
            <div style={{ marginTop: 5, fontSize: 13, opacity: .7 }}>🪑 {sucesso.cadeiraNome}</div>
          )}
          {total > 0 && (
            <div style={{ marginTop: 18, display: 'inline-block', background: 'rgba(0,0,0,.1)', borderRadius: 50, padding: '10px 28px', border: '1px solid rgba(0,0,0,.12)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, opacity: .65, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Total estimado</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', fontFamily: "'Poppins', sans-serif" }}>{fmt(total)}</div>
            </div>
          )}
        </div>

        {/* Serviços */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '12px 24px 6px', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {itens.length} serviço{itens.length !== 1 ? 's' : ''} solicitado{itens.length !== 1 ? 's' : ''}
          </div>
          {itens.map((a, i) => {
            const info  = SERVICE_INFO[a.tipoServico];
            const isLast = i === itens.length - 1;
            return (
              <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px', borderBottom: isLast ? 'none' : `1px solid ${T.border}` }}>
                {info && (
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: info.bg, border: `1px solid ${info.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={15} color={info.color} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.servicoNome || info?.label}
                  </div>
                  {a.servicoNome && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{info?.label}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  {a.servicoPreco != null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(a.servicoPreco)}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,.1)', color: '#d97706' }}>Na fila</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div style={{ margin: '0 20px 14px', padding: '10px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Distribuindo para as funcionárias disponíveis...</span>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 20px 20px' }}>
          <button onClick={onNova}
            style={{ width: '100%', padding: '13px', borderRadius: '0.375rem', background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(245,158,11,.35)', transition: 'all .15s', fontFamily: "'Inter', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,.35)'; }}
          >
            <Plus size={16} /> Nova Comanda
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formulário principal ───────────────────────────────────────────────────
export default function NovaComandaTab() {
  const { usuario }                         = useAuth();
  const T                                   = useT();
  const { isDark }                          = useThemeCtx();
  const [busca, setBusca]                   = useState('');
  const [sugestoes, setSugestoes]           = useState([]);
  const [cliente, setCliente]               = useState(null);
  const [novoNome, setNovoNome]             = useState('');
  const [novoCpf, setNovoCpf]               = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('CABELO');
  const [carrinho, setCarrinho]             = useState([]);
  const [cadeiras, setCadeiras]             = useState([]);
  const [cadeiraId, setCadeiraId]           = useState(null);
  const [sucesso, setSucesso]               = useState(null);
  const [erro, setErro]                     = useState('');
  const [loading, setLoading]               = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    api.get('/cadeiras').then(r => setCadeiras(r.data)).catch(() => {});
  }, []);

  const noCarrinho = (nome) => carrinho.some(s => s.servicoNome === nome);
  const total = carrinho.reduce((s, i) => s + i.servicoPreco, 0);
  const canCreate = carrinho.length > 0 && (cliente || novoNome.trim());

  function toggleServico(tipoServico, servicoNome, servicoPreco) {
    if (noCarrinho(servicoNome)) setCarrinho(c => c.filter(s => s.servicoNome !== servicoNome));
    else setCarrinho(c => [...c, { tipoServico, servicoNome, servicoPreco }]);
  }

  async function buscarClientes(texto) {
    setBusca(texto); setCliente(null); setShowNovoCliente(false);
    clearTimeout(timer.current);
    if (texto.length < 2) { setSugestoes([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clientes/buscar?q=${texto}`);
        setSugestoes(data);
        if (data.length === 0) setShowNovoCliente(true);
      } catch {}
    }, 300);
  }

  function selecionarCliente(c) { setCliente(c); setBusca(c.nome); setSugestoes([]); setShowNovoCliente(false); }
  function limparCliente() { setCliente(null); setBusca(''); setSugestoes([]); setNovoNome(''); setNovoCpf(''); setShowNovoCliente(false); }

  async function handleCriar() {
    setErro('');
    if (!carrinho.length) { setErro('Selecione pelo menos um serviço'); return; }
    setLoading(true);
    try {
      let clienteId = cliente?.id;
      if (!clienteId) {
        if (!novoNome.trim()) { setErro('Informe o nome da cliente'); setLoading(false); return; }
        const { data } = await api.post('/clientes', { nome: novoNome, cpf: novoCpf || undefined });
        clienteId = data.id;
      }
      const { data } = await api.post('/atendimentos/comanda', { clienteId, servicos: carrinho, cadeiraId: cadeiraId || undefined });
      const cadeiraEscolhida = cadeiras.find(c => c.id === cadeiraId);
      setSucesso({ numero: data[0]?.numeroComanda, nome: cliente?.nome || novoNome, atendimentos: data, cadeiraNome: cadeiraEscolhida?.nome });
      setCliente(null); setBusca(''); setNovoNome(''); setNovoCpf(''); setCarrinho([]); setCadeiraId(null);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar comanda');
    } finally { setLoading(false); }
  }

  if (sucesso) return <ConfirmacaoComanda sucesso={sucesso} onNova={() => setSucesso(null)} />;

  const catInfo = SERVICE_INFO[categoriaAtiva];
  const catData = CATALOG[categoriaAtiva];

  const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', boxShadow: T.shadow, overflow: 'hidden' };
  const inputStyle = { width: '100%', padding: '9px 10px 9px 32px', borderRadius: '0.375rem', border: `1.5px solid ${T.inputBorder}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: T.inputBg, color: T.fg, fontFamily: "'Inter', sans-serif", transition: 'border-color .15s' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.fg, letterSpacing: '-0.3px' }}>Nova Comanda</h1>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>Registre a chegada de uma cliente</p>
      </div>

      {/* Layout 2 colunas */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="nova-comanda-grid">

        {/* ── CATÁLOGO ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Tabs de categoria */}
          <div style={{ ...cardStyle, marginBottom: 12, padding: '6px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {CATEGORIAS_ORDEM.map(cat => {
              const info = SERVICE_INFO[cat];
              const ativo = cat === categoriaAtiva;
              const qtd = carrinho.filter(s => s.tipoServico === cat).length;
              return (
                <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: '0.375rem', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', flexShrink: 0, border: 'none',
                    background: ativo ? info.bg : 'transparent',
                    color: ativo ? info.color : T.muted,
                    boxShadow: ativo ? `inset 0 0 0 1.5px ${info.border}` : 'none',
                  }}>
                  <info.Icon size={14} />
                  {info.label}
                  {qtd > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: info.color, color: '#fff', minWidth: 17, height: 17, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      {qtd}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de serviços */}
          <div style={cardStyle}>
            <div style={{ padding: '13px 20px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: catInfo.bg, border: `1px solid ${catInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <catInfo.Icon size={14} color={catInfo.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>{catInfo.label}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{catData.grupos.reduce((s, g) => s + g.itens.length, 0)} serviços disponíveis</div>
              </div>
            </div>

            <div style={{ maxHeight: 460, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {catData.grupos.map((grupo, gi) => (
                <div key={grupo.nome}>
                  <div style={{ padding: '9px 20px 4px', fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.8px', background: T.bg2, borderBottom: `1px solid ${T.border}`, borderTop: gi > 0 ? `1px solid ${T.border}` : 'none' }}>
                    {grupo.nome}
                  </div>
                  {grupo.itens.map((item, ii) => {
                    const sel = noCarrinho(item.nome);
                    const isLast = ii === grupo.itens.length - 1;
                    return (
                      <button key={item.nome} onClick={() => toggleServico(categoriaAtiva, item.nome, item.preco)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: sel ? catInfo.bg : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: isLast ? 'none' : `1px solid ${T.border}`, transition: 'background .12s' }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = T.bg2; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ width: 19, height: 19, borderRadius: 5, border: `2px solid ${sel ? catInfo.color : T.inputBorder}`, background: sel ? catInfo.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                          {sel && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? catInfo.color : T.fg }}>
                          {item.nome}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: sel ? catInfo.color : T.muted, flexShrink: 0 }}>
                          {fmt(item.preco)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CARRINHO ── */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }} className="nova-comanda-cart">
          <div style={cardStyle}>

            {/* Header */}
            <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}`, background: isDark ? 'rgba(245,158,11,.06)' : 'rgba(245,158,11,.04)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Resumo</div>
            </div>

            {/* Cliente */}
            <div style={{ padding: '13px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} /> Cliente
              </div>

              {cliente ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: 'rgba(245,158,11,.08)', borderRadius: '0.375rem', border: '1px solid rgba(245,158,11,.2)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                    {cliente.nome[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.nome}</div>
                    {cliente.telefone && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{cliente.telefone}</div>}
                  </div>
                  <button onClick={limparCliente} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <input placeholder="Buscar cliente..." value={busca} onChange={e => buscarClientes(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = T.inputBorder}
                  />
                  {sugestoes.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', zIndex: 30, overflow: 'hidden', boxShadow: T.shadow }}>
                      {sugestoes.map(c => (
                        <button key={c.id} onClick={() => selecionarCliente(c)}
                          style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                            {c.nome[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{c.nome}</div>
                            {c.telefone && <div style={{ fontSize: 11, color: T.muted }}>{c.telefone}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showNovoCliente && (
                    <div style={{ marginTop: 7, padding: '10px 12px', background: 'rgba(245,158,11,.06)', borderRadius: '0.375rem', border: '1px solid rgba(245,158,11,.2)' }}>
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginBottom: 7 }}>Cliente não encontrada — cadastrar:</div>
                      <input placeholder="Nome *" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '10px', marginBottom: 5 }} />
                      <input placeholder="CPF (opcional)" value={novoCpf} onChange={e => setNovoCpf(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: '10px' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cadeiras */}
            {cadeiras.length > 0 && (
              <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Armchair size={10} /> Cadeira
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                  {cadeiras.map(c => {
                    const livre = c.ativo && !c.ocupada;
                    const sel = cadeiraId === c.id;
                    const cor = sel ? '#f59e0b' : livre ? '#10b981' : T.sub;
                    return (
                      <button key={c.id} onClick={() => livre && setCadeiraId(sel ? null : c.id)} disabled={!livre && !sel}
                        title={c.ocupada ? `Ocupada — ${c.ocupacao?.clienteNome || ''}` : c.nome || `Cadeira ${c.numero}`}
                        style={{ padding: '6px 4px', borderRadius: '0.375rem', border: `1.5px solid ${sel ? '#f59e0b' : livre ? 'rgba(16,185,129,.3)' : T.border}`, background: sel ? 'rgba(245,158,11,.12)' : livre ? 'rgba(16,185,129,.06)' : 'transparent', cursor: livre ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cor }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: cor }}>{c.numero}</span>
                      </button>
                    );
                  })}
                </div>
                {cadeiraId && (
                  <div style={{ marginTop: 5, fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={10} /> {cadeiras.find(c => c.id === cadeiraId)?.nome} selecionada
                  </div>
                )}
              </div>
            )}

            {/* Itens do carrinho */}
            <div style={{ minHeight: 60, maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {carrinho.length === 0 ? (
                <div style={{ padding: '22px 20px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 9px' }}>
                    <Zap size={18} color={T.sub} />
                  </div>
                  <div style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Nenhum serviço selecionado</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Clique nos serviços ao lado</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '9px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {carrinho.length} serviço{carrinho.length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setCarrinho([])} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Trash2 size={10} /> Limpar
                    </button>
                  </div>
                  {carrinho.map((item, i) => {
                    const info = SERVICE_INFO[item.tipoServico];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px', borderBottom: `1px solid ${T.border}` }}>
                        {info && (
                          <div style={{ width: 26, height: 26, borderRadius: 7, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <info.Icon size={12} color={info.color} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.servicoNome}</div>
                          <div style={{ fontSize: 10, color: info?.color, marginTop: 1 }}>{info?.label}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', flexShrink: 0, marginRight: 4 }}>{fmt(item.servicoPreco)}</span>
                        <button onClick={() => setCarrinho(c => c.filter(s => s.servicoNome !== item.servicoNome))}
                          style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = T.sub}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Total */}
            {carrinho.length > 0 && (
              <div style={{ padding: '11px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Total estimado</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#f59e0b', fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.3px' }}>{fmt(total)}</span>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div style={{ margin: '0 14px', padding: '7px 12px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '0.375rem', fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                {erro}
              </div>
            )}

            {/* Botão */}
            <div style={{ padding: '13px 16px' }}>
              <button onClick={handleCriar} disabled={loading || !canCreate}
                style={{ width: '100%', padding: '12px', borderRadius: '0.375rem', background: canCreate ? '#f59e0b' : T.bg2, color: canCreate ? '#000' : T.sub, border: `1px solid ${canCreate ? '#f59e0b' : T.border}`, cursor: canCreate ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all .15s', boxShadow: canCreate ? '0 4px 14px rgba(245,158,11,.3)' : 'none', fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={e => { if (canCreate) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(245,158,11,.4)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canCreate ? '0 4px 14px rgba(245,158,11,.3)' : 'none'; }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</>
                  : <><Plus size={15} /> Criar Comanda {carrinho.length > 0 && `(${carrinho.length})`}</>
                }
              </button>
              {!canCreate && carrinho.length > 0 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: T.sub, marginTop: 5 }}>
                  Busque ou cadastre uma cliente para continuar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .nova-comanda-grid { flex-direction: column !important; }
          .nova-comanda-cart { width: 100% !important; position: static !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
