import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ArrowLeft, Sparkles, Hand, Leaf, Check, Loader2 } from 'lucide-react';
import logo from '../../public/logo.png';

const SERVICOS = [
  { id: 'CABELO',    label: 'Cabelo',    desc: 'Corte, escova, tintura',  Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)' },
  { id: 'MAQUIAGEM', label: 'Maquiagem', desc: 'Make social, noiva',      Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)' },
  { id: 'MAO',       label: 'Mão',       desc: 'Manicure, gel, nail art', Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)' },
  { id: 'PE',        label: 'Pé',        desc: 'Pedicure, spa dos pés',   Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)' },
];

export default function ClientePage() {
  const { salaoSlug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('dados');
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '' });
  const [selecionados, setSelecionados] = useState([]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleServico(id) {
    setSelecionados((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FDF5FA 0%, #F5EEF8 50%, #EEF2F8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(245,197,24,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={logo} alt="Rápido Beauty" style={{ height: 60, width: 'auto', margin: '0 auto 14px', display: 'block' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Bem-vinda!</h1>
          <p style={{ color: 'var(--text-2)', marginTop: 5, fontSize: 14 }}>Solicite seu atendimento</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {['dados', 'servicos'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: step === s || (s === 'dados' && step === 'servicos') ? 'var(--accent)' : 'var(--bg-elevated)',
                color: step === s || (s === 'dados' && step === 'servicos') ? '#0A0A0A' : 'var(--text-3)',
                border: '1px solid ' + (step === s ? 'var(--accent)' : 'var(--border-2)'),
              }}>
                {s === 'dados' && step === 'servicos' ? <Check size={12} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, color: step === s ? 'var(--text)' : 'var(--text-3)', fontWeight: step === s ? 600 : 400 }}>
                {s === 'dados' ? 'Seus dados' : 'Serviços'}
              </span>
              {i === 0 && <div style={{ width: 24, height: 1, background: 'var(--border-2)' }} />}
            </div>
          ))}
        </div>

        {/* Step: Dados */}
        {step === 'dados' && (
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Seus dados</h2>
            <div className="form-group">
              <label className="label">Nome completo *</label>
              <input className="input" placeholder="Como posso te chamar?" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">CPF <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400, fontSize: 11 }}>(opcional)</span></label>
              <input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="label">Telefone <span style={{ color: 'var(--text-3)', textTransform: 'none', fontWeight: 400, fontSize: 11 }}>(opcional)</span></label>
              <input className="input" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            {erro && <div className="alert-error" style={{ marginBottom: 14, fontSize: 13 }}>{erro}</div>}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => {
                if (!form.nome.trim()) { setErro('Informe seu nome'); return; }
                setErro('');
                setStep('servicos');
              }}
            >
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step: Serviços */}
        {step === 'servicos' && (
          <div className="card" style={{ padding: '24px' }}>
            <button onClick={() => setStep('dados')} style={{ background: 'none', color: 'var(--text-2)', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <ArrowLeft size={14} /> Voltar
            </button>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>O que você deseja?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>Olá, {form.nome}! Selecione os serviços:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {SERVICOS.map(({ id, label, desc, Icon, color, bg }) => {
                const ativo = selecionados.includes(id);
                return (
                  <button key={id} onClick={() => toggleServico(id)} className={`service-btn${ativo ? ' active' : ''}`}>
                    <div className="svc-icon" style={{ background: ativo ? bg : 'var(--bg-hover)', width: 44, height: 44, borderRadius: 12 }}>
                      <Icon size={20} color={ativo ? color : 'var(--text-3)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="svc-name" style={{ fontSize: 15 }}>{label}</div>
                      <div className="svc-desc">{desc}</div>
                    </div>
                    {ativo && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} color="#0A0A0A" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {erro && <div className="alert-error" style={{ marginBottom: 14, fontSize: 13 }}>{erro}</div>}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleEnviar}
              disabled={loading || !selecionados.length}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> Aguarde...</>
                : <>Confirmar {selecionados.length > 0 && `(${selecionados.length})`} <ArrowRight size={16} /></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
