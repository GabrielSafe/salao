import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SERVICOS = [
  { id: 'CABELO', label: 'Cabelo', icon: '✂️', desc: 'Corte, escova, tintura' },
  { id: 'MAQUIAGEM', label: 'Maquiagem', icon: '💄', desc: 'Make social, noiva' },
  { id: 'MAO', label: 'Mão', icon: '💅', desc: 'Manicure, gel, nail art' },
  { id: 'PE', label: 'Pé', icon: '🦶', desc: 'Pedicure, spa dos pés' },
];

export default function ClientePage() {
  const { salaoSlug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('dados'); // dados | servicos | enviando
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '' });
  const [selecionados, setSelecionados] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleServico(id) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleEnviar() {
    if (!selecionados.length) { setErro('Selecione pelo menos um serviço'); return; }
    setErro('');
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/publico/${salaoSlug}/solicitar`, {
        nome: form.nome,
        cpf: form.cpf || undefined,
        telefone: form.telefone || undefined,
        servicos: selecionados,
      });
      navigate(`/${salaoSlug}/comanda/${data.numeroComanda}`, {
        state: { clienteId: data.cliente.id, salaoId: data.atendimentos[0]?.salaoId },
      });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao solicitar atendimento');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fce4f3 0%, #f5f5f5 100%)', padding: '20px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💇‍♀️</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--rosa)' }}>Bem-vinda!</h1>
          <p style={{ color: 'var(--texto-suave)', marginTop: 4 }}>Solicite seu atendimento abaixo</p>
        </div>

        {/* Step: Dados */}
        {step === 'dados' && (
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Seus dados</h2>

            <div className="form-group">
              <label className="label">Nome completo *</label>
              <input
                className="input"
                placeholder="Como posso te chamar?"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">CPF <span style={{ color: 'var(--texto-suave)', fontWeight: 400 }}>(opcional — para agilizar próximas visitas)</span></label>
              <input
                className="input"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">Telefone <span style={{ color: 'var(--texto-suave)', fontWeight: 400 }}>(opcional)</span></label>
              <input
                className="input"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => { if (!form.nome.trim()) { setErro('Informe seu nome'); return; } setErro(''); setStep('servicos'); }}
            >
              Continuar →
            </button>
            {erro && <p style={{ color: 'var(--vermelho)', fontSize: 13, marginTop: 10 }}>{erro}</p>}
          </div>
        )}

        {/* Step: Serviços */}
        {step === 'servicos' && (
          <div className="card">
            <button onClick={() => setStep('dados')} style={{ background: 'none', color: 'var(--texto-suave)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Voltar
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>O que você deseja?</h2>
            <p style={{ fontSize: 14, color: 'var(--texto-suave)', marginBottom: 20 }}>Olá, {form.nome}! Selecione os serviços:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {SERVICOS.map((s) => {
                const ativo = selecionados.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleServico(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px',
                      borderRadius: 12,
                      border: `2px solid ${ativo ? 'var(--rosa)' : 'var(--cinza-borda)'}`,
                      background: ativo ? 'var(--rosa-claro)' : 'var(--branco)',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{s.desc}</div>
                    </div>
                    {ativo && <span style={{ color: 'var(--rosa)', fontSize: 20 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {erro && <p style={{ color: 'var(--vermelho)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleEnviar}
              disabled={loading || !selecionados.length}
            >
              {loading ? 'Aguarde...' : `Confirmar ${selecionados.length > 0 ? `(${selecionados.length})` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
