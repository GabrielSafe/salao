import { useState, useRef } from 'react';
import {
  Search, X, Check, Plus, Scissors, Sparkles, Hand, Leaf, Eye,
  Loader2, CheckCircle2, Trash2, User, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
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

// ── Tela de confirmação ────────────────────────────────────────────────────
function ConfirmacaoComanda({ sucesso, onNova }) {
  const itens = sucesso.atendimentos || [];
  const total = itens.reduce((s, a) => s + (a.servicoPreco || 0), 0);

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,.14)', background: '#fff' }}>

        {/* Hero header */}
        <div style={{
          background: 'linear-gradient(135deg, #E85D04 0%, #D4178A 100%)',
          padding: '36px 32px 32px',
          textAlign: 'center',
          color: '#fff',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0px, rgba(255,255,255,.03) 1px, transparent 1px, transparent 12px)', pointerEvents: 'none' }} />

          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backdropFilter: 'blur(4px)' }}>
            <CheckCircle2 size={28} color="#fff" />
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', opacity: .8, marginBottom: 6 }}>
            Comanda criada
          </div>

          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, fontFamily: "'Poppins', sans-serif", letterSpacing: '-2px' }}>
            #{sucesso.numero}
          </div>

          <div style={{ fontSize: 17, fontWeight: 600, marginTop: 10, opacity: .9 }}>
            {sucesso.nome}
          </div>

          {total > 0 && (
            <div style={{ marginTop: 20, display: 'inline-block', background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', borderRadius: 50, padding: '10px 28px', border: '1px solid rgba(255,255,255,.25)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .8, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>Total estimado</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}>{fmt(total)}</div>
            </div>
          )}
        </div>

        {/* Lista de serviços */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '12px 24px 6px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            {itens.length} serviço{itens.length !== 1 ? 's' : ''} solicitado{itens.length !== 1 ? 's' : ''}
          </div>
          {itens.map((a, i) => {
            const info = SERVICE_INFO[a.tipoServico];
            const isLast = i === itens.length - 1;
            return (
              <div key={a.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px', borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,.05)' }}>
                {info && (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: info.bg, border: `1px solid ${info.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={16} color={info.color} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.servicoNome || info?.label}
                  </div>
                  {a.servicoNome && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{info?.label}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  {a.servicoPreco != null && (
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#D4178A' }}>{fmt(a.servicoPreco)}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,.1)', color: '#D97706' }}>
                    Na fila
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div style={{ margin: '0 20px 16px', padding: '10px 14px', background: 'rgba(22,163,74,.06)', border: '1px solid rgba(22,163,74,.12)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>Distribuindo para as funcionárias disponíveis...</span>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 20px 20px' }}>
          <button onClick={onNova}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #E85D04, #D4178A)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(212,23,138,.3)', transition: 'all .15s', fontFamily: "'Poppins', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,23,138,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,23,138,.3)'; }}
          >
            <Plus size={18} /> Nova Comanda
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Formulário principal ───────────────────────────────────────────────────
export default function NovaComandaTab() {
  const { usuario }                         = useAuth();
  const [busca, setBusca]                   = useState('');
  const [sugestoes, setSugestoes]           = useState([]);
  const [cliente, setCliente]               = useState(null);
  const [novoNome, setNovoNome]             = useState('');
  const [novoCpf, setNovoCpf]               = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('CABELO');
  const [carrinho, setCarrinho]             = useState([]);
  const [sucesso, setSucesso]               = useState(null);
  const [erro, setErro]                     = useState('');
  const [loading, setLoading]               = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const timer = useRef(null);

  const noCarrinho = (nome) => carrinho.some(s => s.servicoNome === nome);
  const total = carrinho.reduce((s, i) => s + i.servicoPreco, 0);

  function toggleServico(tipoServico, servicoNome, servicoPreco) {
    if (noCarrinho(servicoNome)) {
      setCarrinho(c => c.filter(s => s.servicoNome !== servicoNome));
    } else {
      setCarrinho(c => [...c, { tipoServico, servicoNome, servicoPreco }]);
    }
  }

  async function buscarClientes(texto) {
    setBusca(texto);
    setCliente(null);
    setShowNovoCliente(false);
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

  function selecionarCliente(c) {
    setCliente(c);
    setBusca(c.nome);
    setSugestoes([]);
    setShowNovoCliente(false);
  }

  function limparCliente() {
    setCliente(null);
    setBusca('');
    setSugestoes([]);
    setNovoNome('');
    setNovoCpf('');
    setShowNovoCliente(false);
  }

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
      const { data } = await api.post('/atendimentos/comanda', { clienteId, servicos: carrinho });
      setSucesso({ numero: data[0]?.numeroComanda, nome: cliente?.nome || novoNome, atendimentos: data });
      setCliente(null); setBusca(''); setNovoNome(''); setNovoCpf(''); setCarrinho([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar comanda');
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return <ConfirmacaoComanda sucesso={sucesso} onNova={() => setSucesso(null)} />;
  }

  const catInfo = SERVICE_INFO[categoriaAtiva];
  const catData = CATALOG[categoriaAtiva];
  const clienteLabel = cliente?.nome || (novoNome.trim() ? novoNome : null);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 700, color: '#1B2A4A', letterSpacing: '-0.3px' }}>
          Nova Comanda
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>Registre a chegada de uma cliente</p>
      </div>

      {/* Layout de duas colunas */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }} className="nova-comanda-grid">

        {/* ── COLUNA ESQUERDA: Catálogo ── */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>

          {/* Tabs de categoria */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', marginBottom: 14, padding: '6px', display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            {CATEGORIAS_ORDEM.map(cat => {
              const info = SERVICE_INFO[cat];
              const ativo = cat === categoriaAtiva;
              const qtd = carrinho.filter(s => s.tipoServico === cat).length;
              return (
                <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', flexShrink: 0, border: 'none',
                    background: ativo ? info.bg : 'transparent',
                    color: ativo ? info.color : '#6B7280',
                    boxShadow: ativo ? `inset 0 0 0 1.5px ${info.border}` : 'none',
                  }}>
                  <info.Icon size={14} />
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

          {/* Lista de serviços */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
            {/* Header da categoria */}
            <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,.05)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: catInfo.bg, border: `1px solid ${catInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <catInfo.Icon size={15} color={catInfo.color} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A' }}>{catInfo.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{catData.grupos.reduce((s, g) => s + g.itens.length, 0)} serviços disponíveis</div>
              </div>
            </div>

            {/* Grupos + itens */}
            <div style={{ maxHeight: 460, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {catData.grupos.map((grupo, gi) => (
                <div key={grupo.nome}>
                  <div style={{ padding: '10px 20px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(0,0,0,.015)', borderBottom: '1px solid rgba(0,0,0,.04)', borderTop: gi > 0 ? '1px solid rgba(0,0,0,.04)' : 'none' }}>
                    {grupo.nome}
                  </div>
                  {grupo.itens.map((item, ii) => {
                    const selecionado = noCarrinho(item.nome);
                    const isLast = ii === grupo.itens.length - 1;
                    return (
                      <button key={item.nome} onClick={() => toggleServico(categoriaAtiva, item.nome, item.preco)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', background: selecionado ? catInfo.bg : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,.04)', transition: 'background .12s' }}
                        onMouseEnter={e => { if (!selecionado) e.currentTarget.style.background = 'rgba(0,0,0,.02)'; }}
                        onMouseLeave={e => { if (!selecionado) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Checkbox visual */}
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selecionado ? catInfo.color : 'rgba(0,0,0,.15)'}`, background: selecionado ? catInfo.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                          {selecionado && <Check size={11} color="#fff" strokeWidth={3} />}
                        </div>

                        {/* Nome */}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: selecionado ? 600 : 400, color: selecionado ? catInfo.color : '#374151' }}>
                          {item.nome}
                        </span>

                        {/* Preço */}
                        <span style={{ fontSize: 13, fontWeight: 700, color: selecionado ? catInfo.color : '#6B7280', flexShrink: 0 }}>
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

        {/* ── COLUNA DIREITA: Resumo / Carrinho ── */}
        <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 20 }} className="nova-comanda-cart">
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,.06)', background: 'linear-gradient(135deg, rgba(232,93,4,.04), rgba(212,23,138,.04))' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Resumo</div>
            </div>

            {/* Seção: Cliente */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={11} /> Cliente
              </div>

              {cliente ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(212,23,138,.05)', borderRadius: 10, border: '1px solid rgba(212,23,138,.15)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.25), rgba(232,93,4,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#D4178A', flexShrink: 0 }}>
                    {cliente.nome[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.nome}</div>
                    {cliente.telefone && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{cliente.telefone}</div>}
                  </div>
                  <button onClick={limparCliente} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    placeholder="Buscar cliente..."
                    value={busca}
                    onChange={e => buscarClientes(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,.1)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FAFAFA', transition: 'border-color .15s' }}
                    onFocus={e => e.target.style.borderColor = '#D4178A'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,.1)'}
                  />
                  {sugestoes.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10, zIndex: 30, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}>
                      {sugestoes.map(c => (
                        <button key={c.id} onClick={() => selecionarCliente(c)}
                          style={{ width: '100%', padding: '9px 12px', textAlign: 'left', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,.05)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,23,138,.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(212,23,138,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#D4178A', flexShrink: 0 }}>
                            {c.nome[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</div>
                            {c.telefone && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.telefone}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Cadastrar nova */}
                  {showNovoCliente && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(245,158,11,.05)', borderRadius: 8, border: '1px solid rgba(245,158,11,.2)' }}>
                      <div style={{ fontSize: 11, color: '#D97706', fontWeight: 600, marginBottom: 8 }}>Cliente não encontrada — cadastrar:</div>
                      <input placeholder="Nome *" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid rgba(0,0,0,.1)', fontSize: 12, marginBottom: 6, boxSizing: 'border-box', outline: 'none' }} />
                      <input placeholder="CPF (opcional)" value={novoCpf} onChange={e => setNovoCpf(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1.5px solid rgba(0,0,0,.1)', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seção: Itens do carrinho */}
            <div style={{ minHeight: 60, maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {carrinho.length === 0 ? (
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Zap size={20} color="#D1D5DB" />
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>Nenhum serviço selecionado</div>
                  <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>Clique nos serviços ao lado</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      {carrinho.length} serviço{carrinho.length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => setCarrinho([])} style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Trash2 size={10} /> Limpar
                    </button>
                  </div>
                  {carrinho.map((item, i) => {
                    const info = SERVICE_INFO[item.tipoServico];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                        {info && (
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <info.Icon size={13} color={info.color} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1B2A4A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.servicoNome}</div>
                          <div style={{ fontSize: 11, color: info?.color, marginTop: 1 }}>{info?.label}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#D4178A', flexShrink: 0, marginRight: 4 }}>{fmt(item.servicoPreco)}</span>
                        <button onClick={() => setCarrinho(c => c.filter(s => s.servicoNome !== item.servicoNome))}
                          style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
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
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,.015)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Total estimado</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#D4178A', fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.3px' }}>{fmt(total)}</span>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div style={{ margin: '0 16px', padding: '8px 12px', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, fontSize: 12, color: '#EF4444', fontWeight: 500 }}>
                {erro}
              </div>
            )}

            {/* Botão criar */}
            <div style={{ padding: '14px 16px' }}>
              <button onClick={handleCriar} disabled={loading || !carrinho.length || (!cliente && !novoNome.trim())}
                style={{ width: '100%', padding: '13px', borderRadius: 11, background: (!carrinho.length || (!cliente && !novoNome.trim())) ? '#E5E7EB' : 'linear-gradient(135deg, #E85D04, #D4178A)', color: (!carrinho.length || (!cliente && !novoNome.trim())) ? '#9CA3AF' : '#fff', border: 'none', cursor: (!carrinho.length || (!cliente && !novoNome.trim())) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s', boxShadow: (!carrinho.length || (!cliente && !novoNome.trim())) ? 'none' : '0 4px 16px rgba(212,23,138,.25)', fontFamily: "'Poppins', sans-serif" }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</>
                  : <><Plus size={16} /> Criar Comanda {carrinho.length > 0 && `(${carrinho.length})`}</>
                }
              </button>
              {!cliente && !novoNome.trim() && carrinho.length > 0 && (
                <div style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
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
      `}</style>
    </div>
  );
}
