import { useState, useRef, useEffect } from 'react';
import {
  Search, X, Check, Plus, Scissors, Sparkles, Hand, Leaf, Eye,
  Loader2, CheckCircle2, Trash2, User, Zap, Armchair, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';
import { useServicos } from '../../../hooks/useServicos.js';
import api from '../../../services/api';
import { CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.1)',  border: 'rgba(168,85,247,.25)', darkBg: 'rgba(168,85,247,.15)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.1)',  border: 'rgba(236,72,153,.25)', darkBg: 'rgba(236,72,153,.15)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.1)',   border: 'rgba(251,146,60,.25)', darkBg: 'rgba(251,146,60,.15)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.1)',    border: 'rgba(34,197,94,.25)',  darkBg: 'rgba(34,197,94,.15)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.1)',   border: 'rgba(56,189,248,.25)', darkBg: 'rgba(56,189,248,.15)'  },
};

const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

function useT() {
  const { isDark } = useThemeCtx();
  return isDark ? {
    card: '#262626', border: '#404040', bg: '#171717', bg2: '#1f1f1f',
    fg: '#e5e5e5', muted: '#a3a3a3', sub: '#6b7280',
    primary: '#f59e0b', inputBg: '#1f1f1f', inputBorder: '#404040',
    shadow: '0 1px 3px rgba(0,0,0,.4), 0 4px 14px rgba(0,0,0,.3)',
    cardShadow: '0 2px 8px rgba(0,0,0,.3)',
    hover: '#333',
  } : {
    card: '#ffffff', border: '#e5e7eb', bg: '#f9fafb', bg2: '#f3f4f6',
    fg: '#262626', muted: '#6b7280', sub: '#9ca3af',
    primary: '#f59e0b', inputBg: '#ffffff', inputBorder: '#e5e7eb',
    shadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)',
    cardShadow: '0 1px 4px rgba(0,0,0,.08)',
    hover: '#f9fafb',
  };
}

// ── Tela de confirmação ────────────────────────────────────────────────────
function ConfirmacaoComanda({ sucesso, onNova }) {
  const T = useT();
  const itens = sucesso.atendimentos || [];
  const total = itens.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  return (
    <div style={{ maxWidth: 480, margin: '40px auto 0', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,.15)', background: T.card, border: `1px solid ${T.border}` }}>
        <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '32px 28px', textAlign: 'center', color: '#000', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(0,0,0,.025) 0px, rgba(0,0,0,.025) 1px, transparent 1px, transparent 14px)', pointerEvents: 'none' }} />
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative' }}>
            <CheckCircle2 size={24} color="#000" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', opacity: .65, marginBottom: 6 }}>Comanda criada</div>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', fontFamily: "'Poppins', sans-serif" }}>#{sucesso.numero}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8, opacity: .8 }}>{sucesso.nome}</div>
          {sucesso.cadeiraNome && <div style={{ fontSize: 12, opacity: .6, marginTop: 4 }}>🪑 {sucesso.cadeiraNome}</div>}
          {total > 0 && (
            <div style={{ marginTop: 16, display: 'inline-block', background: 'rgba(0,0,0,.1)', borderRadius: 40, padding: '9px 24px', border: '1px solid rgba(0,0,0,.1)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, opacity: .6, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 1 }}>Total estimado</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Poppins', sans-serif" }}>{fmt(total)}</div>
            </div>
          )}
        </div>

        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '12px 22px 5px', fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {itens.length} serviço{itens.length !== 1 ? 's' : ''}
          </div>
          {itens.map((a, i) => {
            const info = SERVICE_INFO[a.tipoServico];
            return (
              <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderBottom: i < itens.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                {info && <div style={{ width: 32, height: 32, borderRadius: 8, background: info.bg, border: `1px solid ${info.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><info.Icon size={14} color={info.color} /></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{a.servicoNome || info?.label}</div>
                  {a.servicoNome && <div style={{ fontSize: 11, color: T.muted }}>{info?.label}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  {a.servicoPreco != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{fmt(a.servicoPreco)}</span>}
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'rgba(245,158,11,.1)', color: '#d97706' }}>Na fila</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ margin: '0 18px 14px', padding: '9px 14px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Distribuindo para funcionárias disponíveis...</span>
        </div>

        <div style={{ padding: '0 18px 18px' }}>
          <button onClick={onNova}
            style={{ width: '100%', padding: '12px', borderRadius: '0.375rem', background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(245,158,11,.35)', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,.35)'; }}
          >
            <Plus size={15} /> Nova Comanda
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
  const { catalog: CATALOG, loading: loadingCatalog } = useServicos();
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

  useEffect(() => { api.get('/cadeiras').then(r => setCadeiras(r.data)).catch(() => {}); }, []);

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

  if (!CATALOG || loadingCatalog) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: T.muted, gap: 10, fontFamily: 'Inter, sans-serif' }}>
      <Loader2 size={20} style={{ animation: 'spin .7s linear infinite' }} /> Carregando catálogo...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const catInfo    = SERVICE_INFO[categoriaAtiva];
  const catData    = CATALOG[categoriaAtiva] || { grupos: [] };
  const totalItens = catData.grupos.reduce((s, g) => s + g.itens.length, 0);

  return (
    <div style={{ padding: '28px 28px 28px', fontFamily: "'Inter', sans-serif", background: T.bg, minHeight: '100%' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCart size={17} color="#f59e0b" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.fg, letterSpacing: '-0.3px', margin: 0 }}>Nova Comanda</h1>
        </div>
        <p style={{ fontSize: 13, color: T.muted, margin: 0, paddingLeft: 48 }}>Selecione a cliente, os serviços e a cadeira</p>
      </div>

      {/* ── LAYOUT PRINCIPAL ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="nc-grid">

        {/* ── COLUNA ESQUERDA: catálogo ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Tabs de categoria */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {CATEGORIAS_ORDEM.map(cat => {
              const info = SERVICE_INFO[cat];
              const ativo = cat === categoriaAtiva;
              const qtd   = carrinho.filter(s => s.tipoServico === cat).length;
              return (
                <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: '0.5rem', whiteSpace: 'nowrap', fontSize: 13, fontWeight: ativo ? 700 : 500, cursor: 'pointer', transition: 'all .18s', flexShrink: 0, border: `1.5px solid ${ativo ? info.color + '50' : T.border}`,
                    background: ativo ? (isDark ? info.darkBg : info.bg) : T.card,
                    color: ativo ? info.color : T.muted,
                    boxShadow: ativo ? T.cardShadow : 'none',
                    transform: ativo ? 'translateY(-1px)' : 'none',
                  }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: ativo ? (isDark ? info.bg : 'rgba(255,255,255,.6)') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <info.Icon size={13} color={ativo ? info.color : T.sub} />
                  </div>
                  {info.label}
                  {qtd > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: info.color, color: '#fff', minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      {qtd}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Card do catálogo */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.5rem', boxShadow: T.shadow, overflow: 'hidden' }}>

            {/* Header da categoria */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '0.375rem', background: catInfo.bg, border: `1.5px solid ${catInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <catInfo.Icon size={15} color={catInfo.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>{catInfo.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{totalItens} serviços disponíveis</div>
                </div>
              </div>
              {carrinho.filter(s => s.tipoServico === categoriaAtiva).length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: catInfo.color, background: catInfo.bg, padding: '3px 10px', borderRadius: 20, border: `1px solid ${catInfo.border}` }}>
                  {carrinho.filter(s => s.tipoServico === categoriaAtiva).length} selecionado{carrinho.filter(s => s.tipoServico === categoriaAtiva).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Grade de serviços */}
            <div style={{ maxHeight: 500, overflowY: 'auto', scrollbarWidth: 'thin', padding: '16px' }}>
              {catData.grupos.map((grupo, gi) => (
                <div key={grupo.nome} style={{ marginBottom: gi < catData.grupos.length - 1 ? 20 : 0 }}>
                  {/* Grupo header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ height: 1, flex: 1, background: T.border }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
                      {grupo.nome}
                    </span>
                    <div style={{ height: 1, flex: 1, background: T.border }} />
                  </div>

                  {/* Cards dos serviços em grade 2 colunas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {grupo.itens.map(item => {
                      const sel = noCarrinho(item.nome);
                      return (
                        <button key={item.nome} onClick={() => toggleServico(categoriaAtiva, item.nome, item.preco)}
                          style={{
                            position: 'relative',
                            padding: '12px 14px',
                            borderRadius: '0.5rem',
                            border: `1.5px solid ${sel ? catInfo.color : T.border}`,
                            background: sel ? (isDark ? catInfo.darkBg : catInfo.bg) : T.card,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all .15s',
                            boxShadow: sel ? `0 0 0 3px ${catInfo.color}18` : T.cardShadow,
                            transform: sel ? 'scale(1.01)' : 'scale(1)',
                          }}
                          onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = catInfo.color + '60'; e.currentTarget.style.background = isDark ? T.hover : catInfo.bg; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                          onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; e.currentTarget.style.transform = 'scale(1)'; } }}
                        >
                          {/* Checkmark no canto */}
                          <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: sel ? catInfo.color : T.bg2, border: `1.5px solid ${sel ? catInfo.color : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                            {sel && <Check size={10} color="#fff" strokeWidth={3} />}
                          </div>

                          {/* Ícone */}
                          <div style={{ width: 28, height: 28, borderRadius: '0.375rem', background: sel ? (isDark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.7)') : catInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <catInfo.Icon size={13} color={catInfo.color} />
                          </div>

                          {/* Nome */}
                          <div style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? catInfo.color : T.fg, marginBottom: 6, paddingRight: 20, lineHeight: 1.3 }}>
                            {item.nome}
                          </div>

                          {/* Preço */}
                          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: sel ? catInfo.color : '#f59e0b', background: sel ? 'rgba(255,255,255,.15)' : 'rgba(245,158,11,.1)', padding: '2px 8px', borderRadius: 20, letterSpacing: '-0.2px' }}>
                            {fmt(item.preco)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA: resumo ── */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }} className="nc-cart">
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.5rem', boxShadow: T.shadow, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}`, background: 'rgba(245,158,11,.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.fg, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Resumo do Pedido</span>
                {carrinho.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: 20 }}>
                    {carrinho.length}
                  </span>
                )}
              </div>
            </div>

            {/* Cliente */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                <User size={10} /> Cliente
              </div>
              {cliente ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: 'rgba(245,158,11,.07)', borderRadius: '0.375rem', border: '1px solid rgba(245,158,11,.2)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                    {cliente.nome[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.nome}</div>
                    {cliente.telefone && <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{cliente.telefone}</div>}
                  </div>
                  <button onClick={limparCliente} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                  <input placeholder="Buscar cliente..." value={busca} onChange={e => buscarClientes(e.target.value)}
                    style={{ width: '100%', padding: '8px 9px 8px 30px', borderRadius: '0.375rem', border: `1.5px solid ${T.inputBorder}`, fontSize: 12, outline: 'none', boxSizing: 'border-box', background: T.inputBg, color: T.fg, fontFamily: 'inherit', transition: 'border-color .15s' }}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = T.inputBorder}
                  />
                  {sugestoes.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: '0.375rem', zIndex: 30, overflow: 'hidden', boxShadow: T.shadow }}>
                      {sugestoes.map(c => (
                        <button key={c.id} onClick={() => selecionarCliente(c)}
                          style={{ width: '100%', padding: '8px 10px', textAlign: 'left', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>
                            {c.nome[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                            {c.telefone && <div style={{ fontSize: 10, color: T.muted }}>{c.telefone}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showNovoCliente && (
                    <div style={{ marginTop: 7, padding: '10px 11px', background: 'rgba(245,158,11,.06)', borderRadius: '0.375rem', border: '1px solid rgba(245,158,11,.2)' }}>
                      <div style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginBottom: 7 }}>Cliente não encontrada — cadastrar:</div>
                      <input placeholder="Nome *" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '0.375rem', border: `1.5px solid ${T.inputBorder}`, fontSize: 12, marginBottom: 5, boxSizing: 'border-box', outline: 'none', background: T.inputBg, color: T.fg, fontFamily: 'inherit' }} />
                      <input placeholder="CPF (opcional)" value={novoCpf} onChange={e => setNovoCpf(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '0.375rem', border: `1.5px solid ${T.inputBorder}`, fontSize: 12, boxSizing: 'border-box', outline: 'none', background: T.inputBg, color: T.fg, fontFamily: 'inherit' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cadeiras */}
            {cadeiras.length > 0 && (
              <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Armchair size={10} /> Cadeira
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5 }}>
                  {cadeiras.map(c => {
                    const livre = c.ativo && !c.ocupada;
                    const sel   = cadeiraId === c.id;
                    const cor   = sel ? '#f59e0b' : livre ? '#10b981' : T.sub;
                    return (
                      <button key={c.id} onClick={() => livre && setCadeiraId(sel ? null : c.id)} disabled={!livre && !sel}
                        title={c.ocupada ? `Ocupada — ${c.ocupacao?.clienteNome || ''}` : c.nome}
                        style={{ padding: '6px 4px', borderRadius: '0.375rem', border: `1.5px solid ${sel ? '#f59e0b' : livre ? 'rgba(16,185,129,.3)' : T.border}`, background: sel ? 'rgba(245,158,11,.12)' : livre ? 'rgba(16,185,129,.06)' : 'transparent', cursor: livre ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all .12s' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: cor }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: cor }}>{c.numero}</span>
                      </button>
                    );
                  })}
                </div>
                {cadeiraId && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Check size={10} /> {cadeiras.find(c => c.id === cadeiraId)?.nome} selecionada
                  </div>
                )}
              </div>
            )}

            {/* Itens do carrinho */}
            <div style={{ minHeight: 64, maxHeight: 240, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {carrinho.length === 0 ? (
                <div style={{ padding: '22px 16px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.bg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <ShoppingCart size={17} color={T.sub} />
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>Nenhum serviço adicionado</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>Clique nos cards ao lado</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '8px 16px 3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {carrinho.length} serviço{carrinho.length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setCarrinho([])} style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Trash2 size={10} /> Limpar
                    </button>
                  </div>
                  {carrinho.map((item, i) => {
                    const info = SERVICE_INFO[item.tipoServico];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderBottom: `1px solid ${T.border}` }}>
                        {info && <div style={{ width: 24, height: 24, borderRadius: 6, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><info.Icon size={11} color={info.color} /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.servicoNome}</div>
                          <div style={{ fontSize: 10, color: info?.color }}>{info?.label}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', flexShrink: 0, marginRight: 4 }}>{fmt(item.servicoPreco)}</span>
                        <button onClick={() => setCarrinho(c => c.filter(s => s.servicoNome !== item.servicoNome))}
                          style={{ background: 'none', border: 'none', color: T.sub, cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = T.sub}
                        ><X size={13} /></button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Total */}
            {carrinho.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.bg2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>Total estimado</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.3px' }}>{fmt(total)}</span>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div style={{ margin: '0 14px', padding: '7px 12px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '0.375rem', fontSize: 11, color: '#ef4444', fontWeight: 500 }}>
                {erro}
              </div>
            )}

            {/* Botão criar */}
            <div style={{ padding: '12px 16px' }}>
              <button onClick={handleCriar} disabled={loading || !canCreate}
                style={{ width: '100%', padding: '12px', borderRadius: '0.375rem', background: canCreate ? '#f59e0b' : T.bg2, color: canCreate ? '#000' : T.sub, border: `1px solid ${canCreate ? 'transparent' : T.border}`, cursor: canCreate ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all .15s', boxShadow: canCreate ? '0 4px 14px rgba(245,158,11,.3)' : 'none' }}
                onMouseEnter={e => { if (canCreate) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(245,158,11,.4)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canCreate ? '0 4px 14px rgba(245,158,11,.3)' : 'none'; }}
              >
                {loading ? <><Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</>
                         : <><Plus size={15} /> Criar Comanda {carrinho.length > 0 && `(${carrinho.length})`}</>}
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
        @media (max-width: 900px) {
          .nc-grid { flex-direction: column !important; }
          .nc-cart { width: 100% !important; position: static !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
