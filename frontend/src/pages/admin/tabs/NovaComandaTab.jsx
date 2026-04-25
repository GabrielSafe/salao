import { useState, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const SERVICOS = [
  { id: 'CABELO', label: 'Cabelo', icon: '✂️' },
  { id: 'MAQUIAGEM', label: 'Maquiagem', icon: '💄' },
  { id: 'MAO', label: 'Mão', icon: '💅' },
  { id: 'PE', label: 'Pé', icon: '🦶' },
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
  const buscaTimer = useRef(null);

  async function buscarClientes(texto) {
    setBusca(texto);
    clearTimeout(buscaTimer.current);
    if (texto.length < 2) { setSugestoes([]); return; }
    buscaTimer.current = setTimeout(async () => {
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
      setSucesso({ numero: data[0]?.numeroComanda, nome: cliente?.nome || novoNome });
      setCliente(null); setBusca(''); setNovoNome(''); setNovoCpf(''); setSelecionados([]);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar comanda');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarServico() {
    if (!cliente) { setErro('Selecione uma cliente existente para adicionar serviço'); return; }
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
      <div className="card" style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          {sucesso.adicional ? 'Serviço adicionado!' : 'Comanda criada!'}
        </h2>
        {sucesso.numero && <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--rosa)', marginBottom: 8 }}>#{sucesso.numero}</p>}
        <p style={{ color: 'var(--texto-suave)', marginBottom: 24 }}>{sucesso.nome}</p>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSucesso(null)}>
          Nova comanda
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nova Comanda</h1>
          <p className="page-subtitle">Registre a chegada de uma cliente</p>
        </div>
      </div>

      {/* Busca de cliente */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Cliente</h3>

        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => { setCliente(null); buscarClientes(e.target.value); }}
          />
          {sugestoes.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--cinza-borda)', borderRadius: 8, zIndex: 10, boxShadow: 'var(--sombra)', marginTop: 4 }}>
              {sugestoes.map((c) => (
                <button key={c.id} onClick={() => selecionarCliente(c)} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', display: 'block', fontSize: 14, borderBottom: '1px solid var(--cinza-borda)' }}>
                  <strong>{c.nome}</strong>{c.cpf && <span style={{ color: 'var(--texto-suave)', marginLeft: 8, fontSize: 12 }}>CPF: {c.cpf}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {cliente && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--rosa-claro)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--rosa-escuro)' }}>✓ {cliente.nome}</span>
            <button onClick={() => { setCliente(null); setBusca(''); }} style={{ background: 'none', color: 'var(--texto-suave)', fontSize: 18 }}>×</button>
          </div>
        )}

        {!cliente && busca.length > 0 && sugestoes.length === 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 10 }}>Cliente não encontrada. Cadastrar nova:</p>
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

      {/* Seleção de serviços */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Serviços</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SERVICOS.map((s) => {
            const ativo = selecionados.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleServico(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, border: `2px solid ${ativo ? 'var(--rosa)' : 'var(--cinza-borda)'}`, background: ativo ? 'var(--rosa-claro)' : '#fff', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</span>
                {ativo && <span style={{ marginLeft: 'auto', color: 'var(--rosa)' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleCriar} disabled={loading || !selecionados.length}>
          {loading ? 'Criando...' : '+ Nova comanda'}
        </button>
        {cliente && (
          <button className="btn btn-secondary btn-lg" onClick={adicionarServico} disabled={loading || !selecionados.length}>
            + Adicionar serviço
          </button>
        )}
      </div>
    </div>
  );
}
