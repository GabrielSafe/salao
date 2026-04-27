import { useState, useRef } from 'react';
import { Search, X, Check, Plus, Scissors, Sparkles, Hand, Leaf, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const SERVICOS = [
  { id: 'CABELO',    label: 'Cabelo',    desc: 'Corte, escova, tintura', Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  { id: 'MAQUIAGEM', label: 'Maquiagem', desc: 'Make social, noiva',     Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  { id: 'MAO',       label: 'Mão',       desc: 'Manicure, gel, nail art', Icon: Hand,    color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  { id: 'PE',        label: 'Pé',        desc: 'Pedicure, spa dos pés',  Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
];

export default function NovaComandaTab() {
  const { usuario } = useAuth();
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoCpf, setNovoCpf] = useState('');
  const [selecionados, setSelecionados] = useState([]);
  const [sucesso, setSucesso] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  async function buscarClientes(texto) {
    setBusca(texto);
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

  function toggleServico(id) {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleCriar() {
    setErro('');
    if (!selecionados.length) { setErro('Selecione pelo menos um serviço'); return; }
    setLoading(true);
    try {
      let clienteId = cliente?.id;
      if (!clienteId) {
        if (!novoNome.trim()) { setErro('Informe o nome da cliente'); setLoading(false); return; }
        const { data } = await api.post('/clientes', { nome: novoNome, cpf: novoCpf || undefined });
        clienteId = data.id;
      }
      const { data } = await api.post('/atendimentos/comanda', { clienteId, servicos: selecionados });
      setSucesso({ numero: data[0]?.numeroComanda, nome: cliente?.nome || novoNome, atendimentos: data });
      setCliente(null); setBusca(''); setNovoNome(''); setNovoCpf(''); setSelecionados([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar comanda');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarServico() {
    if (!cliente) { setErro('Selecione uma cliente existente'); return; }
    if (!selecionados.length) { setErro('Selecione um serviço'); return; }
    setErro('');
    setLoading(true);
    try {
      for (const s of selecionados) {
        await api.post('/atendimentos/adicionar', { clienteId: cliente.id, tipoServico: s });
      }
      setSucesso({ numero: null, nome: cliente.nome, adicional: true });
      setSelecionados([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao adicionar serviço');
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <div style={{ maxWidth: 560 }}>
        {/* Header com botão no canto */}
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

        {/* Card da comanda */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Topo da comanda */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,23,138,.2), rgba(232,93,4,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {sucesso.nome?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{sucesso.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  {sucesso.atendimentos?.length || selecionados.length} serviço{(sucesso.atendimentos?.length || 1) > 1 ? 's' : ''} solicitado{(sucesso.atendimentos?.length || 1) > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.5px' }}>
                #{sucesso.numero}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Comanda</div>
            </div>
          </div>

          {/* Serviços */}
          <div style={{ padding: '8px 0' }}>
            {(sucesso.atendimentos || []).map((atend) => {
              const svc = SERVICOS.find(s => s.id === atend.tipoServico);
              if (!svc) return null;
              return (
                <div key={atend.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: svc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svc.Icon size={17} color={svc.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{svc.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{svc.desc}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: atend.status === 'PENDENTE_ACEITE' ? 'rgba(245,158,11,.12)' : 'rgba(245,197,24,.12)',
                    color: atend.status === 'PENDENTE_ACEITE' ? '#D97706' : 'var(--accent)',
                  }}>
                    {atend.status === 'PENDENTE_ACEITE' ? 'Aguardando aceite' : 'Na fila'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rodapé */}
          <div style={{ padding: '12px 20px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Distribuindo para as funcionárias disponíveis...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nova Comanda</h1>
          <p className="page-subtitle">Registre a chegada de uma cliente</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</h3>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            style={{ paddingLeft: 36 }}
            onChange={(e) => { setCliente(null); buscarClientes(e.target.value); }}
          />
          {sugestoes.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-2)',
              borderRadius: 8, zIndex: 20, overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}>
              {sugestoes.map((c) => (
                <button key={c.id} onClick={() => selecionarCliente(c)}
                  style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontWeight: 500 }}>{c.nome}</span>
                  {c.cpf && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>CPF: {c.cpf}</span>}
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
                <input className="input" placeholder="Nome completo" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">CPF</label>
                <input className="input" placeholder="000.000.000-00" value={novoCpf} onChange={(e) => setNovoCpf(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Serviços */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 14, fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SERVICOS.map(({ id, label, Icon, color, bg }) => {
            const ativo = selecionados.includes(id);
            return (
              <button key={id} onClick={() => toggleServico(id)} className={`service-btn${ativo ? ' active' : ''}`}>
                <div className="svc-icon" style={{ background: ativo ? bg : 'var(--bg-hover)' }}>
                  <Icon size={18} color={ativo ? color : 'var(--text-3)'} />
                </div>
                <span className="svc-name">{label}</span>
                {ativo && <Check size={15} className="check" />}
              </button>
            );
          })}
        </div>
      </div>

      {erro && <div className="alert-error" style={{ marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleCriar} disabled={loading || !selecionados.length}>
          {loading ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Criando...</> : <><Plus size={16} /> Nova comanda</>}
        </button>
        {cliente && (
          <button className="btn btn-secondary btn-lg" onClick={adicionarServico} disabled={loading || !selecionados.length}>
            + Serviço
          </button>
        )}
      </div>
    </div>
  );
}
