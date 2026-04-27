import { useState, useRef } from 'react';
import { Search, X, Check, Plus, Scissors, Sparkles, Hand, Leaf, Eye, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { CATALOG, CATEGORIAS_ORDEM } from '../../../utils/servicosCatalog';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.12)'  },
};

function formatPreco(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
}

export default function NovaComandaTab() {
  const { usuario } = useAuth();
  const [busca, setBusca]               = useState('');
  const [sugestoes, setSugestoes]       = useState([]);
  const [cliente, setCliente]           = useState(null);
  const [novoNome, setNovoNome]         = useState('');
  const [novoCpf, setNovoCpf]           = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('CABELO');
  const [carrinho, setCarrinho]         = useState([]); // [{ tipoServico, servicoNome, servicoPreco }]
  const [sucesso, setSucesso]           = useState(null);
  const [erro, setErro]                 = useState('');
  const [loading, setLoading]           = useState(false);
  const timer = useRef(null);

  const noCarrinho = (nome) => carrinho.some(s => s.servicoNome === nome);

  function toggleServico(tipoServico, servicoNome, servicoPreco) {
    if (noCarrinho(servicoNome)) {
      setCarrinho(c => c.filter(s => s.servicoNome !== servicoNome));
    } else {
      setCarrinho(c => [...c, { tipoServico, servicoNome, servicoPreco }]);
    }
  }

  const totalCarrinho = carrinho.reduce((s, i) => s + i.servicoPreco, 0);

  async function buscarClientes(texto) {
    setBusca(texto);
    setCliente(null);
    clearTimeout(timer.current);
    if (texto.length < 2) { setSugestoes([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/clientes/buscar?q=${texto}`);
        setSugestoes(data);
      } catch {}
    }, 300);
  }

  function selecionarCliente(c) {
    setCliente(c);
    setBusca(c.nome);
    setSugestoes([]);
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
      setSucesso({ numero: data[0]?.numeroComanda, nome: cliente?.nome || novoNome, atendimentos: data, carrinho: [...carrinho] });
      setCliente(null); setBusca(''); setNovoNome(''); setNovoCpf(''); setCarrinho([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar comanda');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarServico() {
    if (!cliente) { setErro('Selecione uma cliente existente'); return; }
    if (!carrinho.length) { setErro('Selecione um serviço'); return; }
    setErro('');
    setLoading(true);
    try {
      for (const s of carrinho) {
        await api.post('/atendimentos/adicionar', s.clienteId
          ? s
          : { clienteId: cliente.id, tipoServico: s.tipoServico, servicoNome: s.servicoNome, servicoPreco: s.servicoPreco });
      }
      setSucesso({ numero: null, nome: cliente.nome, adicional: true, carrinho: [...carrinho] });
      setCarrinho([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao adicionar serviço');
    } finally {
      setLoading(false);
    }
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (sucesso) {
    const totalSucesso = (sucesso.atendimentos || sucesso.carrinho || []).reduce((s, a) => s + (a.servicoPreco || 0), 0);
    return (
      <div style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--success-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="var(--success)" />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
                {sucesso.adicional ? 'Serviço adicionado!' : 'Comanda criada!'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{sucesso.nome}</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setSucesso(null)}>
            <Plus size={15} /> Nova comanda
          </button>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Topo */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.2), rgba(232,93,4,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {sucesso.nome?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{sucesso.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {(sucesso.atendimentos || sucesso.carrinho || []).length} serviço(s) solicitado(s)
                </div>
              </div>
            </div>
            {sucesso.numero && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}>
                  #{sucesso.numero}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Comanda</div>
              </div>
            )}
          </div>

          {/* Serviços */}
          <div style={{ padding: '8px 0' }}>
            {(sucesso.atendimentos || sucesso.carrinho || []).map((item, i) => {
              const tipoServico = item.tipoServico;
              const info = SERVICE_INFO[tipoServico];
              const nome = item.servicoNome;
              const preco = item.servicoPreco;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  {info && (
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <info.Icon size={17} color={info.color} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{nome || info?.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{info?.label}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {preco != null && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{formatPreco(preco)}</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,197,24,.1)', color: 'var(--accent)' }}>
                      Na fila
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total + rodapé */}
          {totalSucesso > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Total estimado</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Poppins', sans-serif" }}>{formatPreco(totalSucesso)}</span>
            </div>
          )}

          <div style={{ padding: '10px 20px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Distribuindo para as funcionárias disponíveis...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  const catInfo = SERVICE_INFO[categoriaAtiva];
  const catData = CATALOG[categoriaAtiva];

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nova Comanda</h1>
          <p className="page-subtitle">Registre a chegada de uma cliente</p>
        </div>
      </div>

      {/* ── Cliente ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</h3>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            style={{ paddingLeft: 36 }}
            onChange={(e) => buscarClientes(e.target.value)}
          />
          {sugestoes.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-2)', borderRadius: 8, zIndex: 20, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              {sugestoes.map((c) => (
                <button key={c.id} onClick={() => selecionarCliente(c)}
                  style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontWeight: 500 }}>{c.nome}</span>
                  {c.telefone && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.telefone}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {cliente && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{cliente.nome}</span>
            </div>
            <button onClick={() => { setCliente(null); setBusca(''); }} style={{ background: 'none', color: 'var(--text-3)', padding: 2 }}>
              <X size={15} />
            </button>
          </div>
        )}

        {!cliente && busca.length >= 2 && sugestoes.length === 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>Cliente não encontrada. Cadastrar nova:</p>
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Nome *</label>
                <input className="input" placeholder="Nome completo" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">CPF</label>
                <input className="input" placeholder="000.000.000-00" value={novoCpf} onChange={e => setNovoCpf(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Seleção de serviços ── */}
      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços</h3>
        </div>

        {/* Tabs de categoria */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 16px', gap: 8, borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
          {CATEGORIAS_ORDEM.map(cat => {
            const info = SERVICE_INFO[cat];
            const ativo = cat === categoriaAtiva;
            const qtdNoCarrinho = carrinho.filter(s => s.tipoServico === cat).length;
            return (
              <button key={cat} onClick={() => setCategoriaAtiva(cat)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
                  background: ativo ? info.bg : 'var(--bg-elevated)',
                  border: `1.5px solid ${ativo ? info.color + '60' : 'var(--border-2)'}`,
                  color: ativo ? info.color : 'var(--text-2)',
                }}>
                <info.Icon size={14} />
                {info.label}
                {qtdNoCarrinho > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, background: info.color, color: '#fff', width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
                    {qtdNoCarrinho}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista de serviços da categoria ativa */}
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
          {catData.grupos.map(grupo => (
            <div key={grupo.nome}>
              <div style={{ padding: '8px 20px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {grupo.nome}
              </div>
              {grupo.itens.map(item => {
                const emCarrinho = noCarrinho(item.nome);
                return (
                  <button key={item.nome} onClick={() => toggleServico(categoriaAtiva, item.nome, item.preco)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', background: emCarrinho ? catInfo.bg : 'transparent', border: 'none', cursor: 'pointer', transition: 'background .12s', textAlign: 'left' }}
                    onMouseEnter={e => { if (!emCarrinho) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!emCarrinho) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: emCarrinho ? catInfo.color + '20' : 'var(--bg-elevated)', border: `1.5px solid ${emCarrinho ? catInfo.color : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {emCarrinho && <Check size={12} color={catInfo.color} />}
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: emCarrinho ? 600 : 400, color: emCarrinho ? catInfo.color : 'var(--text)' }}>
                      {item.nome}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: emCarrinho ? catInfo.color : 'var(--text-2)', flexShrink: 0 }}>
                      {formatPreco(item.preco)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Carrinho ── */}
      {carrinho.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Carrinho · {carrinho.length} serviço{carrinho.length > 1 ? 's' : ''}
            </span>
            <button onClick={() => setCarrinho([])} style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={11} /> Limpar
            </button>
          </div>

          {carrinho.map((item, i) => {
            const info = SERVICE_INFO[item.tipoServico];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                {info && (
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <info.Icon size={15} color={info.color} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.servicoNome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{info?.label}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginRight: 8 }}>{formatPreco(item.servicoPreco)}</span>
                <button onClick={() => setCarrinho(c => c.filter(s => s.servicoNome !== item.servicoNome))}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <X size={15} />
                </button>
              </div>
            );
          })}

          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>Total estimado</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Poppins', sans-serif" }}>{formatPreco(totalCarrinho)}</span>
          </div>
        </div>
      )}

      {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleCriar} disabled={loading || !carrinho.length}>
          {loading ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</> : <><Plus size={16} /> Nova comanda ({carrinho.length})</>}
        </button>
        {cliente && carrinho.length > 0 && (
          <button className="btn btn-secondary btn-lg" onClick={adicionarServico} disabled={loading}>
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}
