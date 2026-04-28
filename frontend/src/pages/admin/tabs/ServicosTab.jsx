import { useState, useEffect, useCallback } from 'react';
import { Scissors, Sparkles, Hand, Leaf, Eye, Edit2, Check, X, Plus, Loader2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../services/api';
import { useThemeCtx } from '../../../contexts/ThemeContext.jsx';

const SERVICE_INFO = {
  CABELO:      { label: 'Cabelo',      Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.2)' },
  MAQUIAGEM:   { label: 'Maquiagem',   Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.2)' },
  MAO:         { label: 'Mão',         Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.12)',  border: 'rgba(251,146,60,.2)'  },
  PE:          { label: 'Pé',          Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.2)'   },
  SOBRANCELHA: { label: 'Sobrancelha', Icon: Eye,      color: '#38BDF8', bg: 'rgba(56,189,248,.12)',  border: 'rgba(56,189,248,.2)'  },
};

const CATEGORIAS = ['CABELO', 'MAQUIAGEM', 'MAO', 'PE', 'SOBRANCELHA'];

const fmt = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

// ── Linha editável ─────────────────────────────────────────────────────────
function ServicoRow({ item, catInfo, onSave, onToggle }) {
  const { isDark } = useThemeCtx();
  const [editando, setEditando] = useState(false);
  const [nome, setNome]         = useState(item.nome);
  const [preco, setPreco]       = useState(String(item.preco));
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const border   = isDark ? '#404040' : '#e5e7eb';
  const card     = isDark ? '#262626' : '#ffffff';
  const fg       = isDark ? '#e5e5e5' : '#262626';
  const muted    = isDark ? '#a3a3a3' : '#6b7280';
  const hover    = isDark ? '#333' : '#f9fafb';
  const inputBg  = isDark ? '#1f1f1f' : '#f9fafb';

  async function handleSave() {
    if (!nome.trim()) { setErr('Nome obrigatório'); return; }
    const p = parseFloat(preco.replace(',', '.'));
    if (isNaN(p) || p < 0) { setErr('Preço inválido'); return; }
    setSaving(true);
    try {
      await onSave(item.id, { nome: nome.trim(), preco: p });
      setEditando(false);
      setErr('');
    } catch { setErr('Erro ao salvar'); }
    finally { setSaving(false); }
  }

  function handleCancel() {
    setNome(item.nome); setPreco(String(item.preco));
    setEditando(false); setErr('');
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: `1px solid ${border}`, background: editando ? (isDark ? '#1f1f1f' : '#fffbeb') : 'transparent', transition: 'background .12s', opacity: item.ativo ? 1 : 0.45 }}
      onMouseEnter={e => { if (!editando) e.currentTarget.style.background = hover; }}
      onMouseLeave={e => { if (!editando) e.currentTarget.style.background = editando ? (isDark ? '#1f1f1f' : '#fffbeb') : 'transparent'; }}
    >
      {/* Ícone */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: catInfo.bg, border: `1px solid ${catInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <catInfo.Icon size={15} color={catInfo.color} />
      </div>

      {/* Nome */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editando ? (
          <input value={nome} onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${catInfo.color}`, background: inputBg, color: fg, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            autoFocus
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 500, color: fg }}>{item.nome}</span>
        )}
        {err && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{err}</div>}
      </div>

      {/* Preço */}
      <div style={{ width: 120, flexShrink: 0 }}>
        {editando ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${catInfo.color}`, background: inputBg }}>
            <span style={{ fontSize: 12, color: muted }}>R$</span>
            <input value={preco} onChange={e => setPreco(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', color: fg, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif', width: 60 }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            />
          </div>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: catInfo.color }}>R$ {fmt(item.preco)}</span>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {editando ? (
          <>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 6, background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {saving ? <Loader2 size={12} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={12} />}
              Salvar
            </button>
            <button onClick={handleCancel}
              style={{ padding: '5px 10px', borderRadius: 6, background: isDark ? '#333' : '#f3f4f6', color: muted, border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
              <X size={12} /> Cancelar
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditando(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: isDark ? '#333' : '#f3f4f6', color: muted, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 12, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = catInfo.color; e.currentTarget.style.color = catInfo.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = muted; }}
            >
              <Edit2 size={12} /> Editar
            </button>
            <button onClick={() => onToggle(item.id, !item.ativo)} title={item.ativo ? 'Desativar' : 'Ativar'}
              style={{ padding: '5px 8px', borderRadius: 6, background: 'none', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', color: item.ativo ? '#10b981' : muted, transition: 'all .15s' }}>
              {item.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Grupo de serviços ──────────────────────────────────────────────────────
function GrupoSection({ grupo, itens, catInfo, onSave, onToggle }) {
  const { isDark } = useThemeCtx();
  const [aberto, setAberto] = useState(true);
  const border = isDark ? '#404040' : '#e5e7eb';
  const fg     = isDark ? '#e5e5e5' : '#262626';
  const muted  = isDark ? '#a3a3a3' : '#6b7280';
  const bg2    = isDark ? '#1f1f1f' : '#f9fafb';

  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setAberto(!aberto)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', background: bg2, border: 'none', cursor: 'pointer', borderTop: `1px solid ${border}`, borderBottom: aberto ? `1px solid ${border}` : 'none' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{grupo} · {itens.length} serviços</span>
        {aberto ? <ChevronUp size={13} color={muted} /> : <ChevronDown size={13} color={muted} />}
      </button>
      {aberto && itens.map(item => (
        <ServicoRow key={item.id} item={item} catInfo={catInfo} onSave={onSave} onToggle={onToggle} />
      ))}
    </div>
  );
}

// ── Tab principal ──────────────────────────────────────────────────────────
export default function ServicosTab() {
  const { isDark } = useThemeCtx();
  const [servicos, setServicos]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [categoriaAtiva, setCat]      = useState('CABELO');
  const [showNovo, setShowNovo]       = useState(false);
  const [novoNome, setNovoNome]       = useState('');
  const [novoGrupo, setNovoGrupo]     = useState('');
  const [novoPreco, setNovoPreco]     = useState('');
  const [savingNovo, setSavingNovo]   = useState(false);
  const [erroNovo, setErroNovo]       = useState('');

  const card   = isDark ? '#262626' : '#ffffff';
  const border = isDark ? '#404040' : '#e5e7eb';
  const bg     = isDark ? '#171717' : '#f9fafb';
  const bg2    = isDark ? '#1f1f1f' : '#f3f4f6';
  const fg     = isDark ? '#e5e5e5' : '#262626';
  const muted  = isDark ? '#a3a3a3' : '#6b7280';
  const shadow = isDark ? '0 1px 3px rgba(0,0,0,.4)' : '0 1px 3px rgba(0,0,0,.06), 0 4px 14px rgba(0,0,0,.07)';

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/servicos');
      setServicos(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleSave(id, dados) {
    const { data } = await api.patch(`/servicos/${id}`, dados);
    setServicos(prev => prev.map(s => s.id === id ? data : s));
  }

  async function handleToggle(id, ativo) {
    const { data } = await api.patch(`/servicos/${id}`, { ativo });
    setServicos(prev => prev.map(s => s.id === id ? data : s));
  }

  async function handleCriarNovo() {
    setErroNovo('');
    if (!novoNome.trim()) { setErroNovo('Informe o nome'); return; }
    if (!novoGrupo.trim()) { setErroNovo('Informe o grupo'); return; }
    const p = parseFloat(novoPreco.replace(',', '.'));
    if (isNaN(p) || p < 0) { setErroNovo('Preço inválido'); return; }
    setSavingNovo(true);
    try {
      const { data } = await api.post('/servicos', { nome: novoNome.trim(), grupo: novoGrupo.trim(), categoria: categoriaAtiva, preco: p });
      setServicos(prev => [...prev, data]);
      setNovoNome(''); setNovoGrupo(''); setNovoPreco(''); setShowNovo(false);
    } catch (err) { setErroNovo(err.response?.data?.erro || 'Erro ao criar'); }
    finally { setSavingNovo(false); }
  }

  const catInfo = SERVICE_INFO[categoriaAtiva];
  const da_cat  = servicos.filter(s => s.categoria === categoriaAtiva);
  const grupos  = [...new Set(da_cat.map(s => s.grupo))];
  const ativos  = da_cat.filter(s => s.ativo).length;
  const total   = servicos.length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: muted, fontFamily: 'Inter, sans-serif' }}>
      <Loader2 size={22} style={{ animation: 'spin .7s linear infinite', marginRight: 10 }} /> Carregando serviços...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: fg, letterSpacing: '-0.3px' }}>Serviços</h1>
          <p style={{ fontSize: 13, color: muted, marginTop: 3 }}>{total} serviços cadastrados no catálogo do salão</p>
        </div>
        <button onClick={() => setShowNovo(!showNovo)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '0.375rem', background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(245,158,11,.3)' }}>
          <Plus size={15} /> Novo serviço
        </button>
      </div>

      {/* Tabs de categoria */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '0.375rem', boxShadow: shadow, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {CATEGORIAS.map(cat => {
            const info = SERVICE_INFO[cat];
            const ativo = cat === categoriaAtiva;
            const cnt = servicos.filter(s => s.categoria === cat).length;
            return (
              <button key={cat} onClick={() => { setCat(cat); setShowNovo(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 20px', background: ativo ? `${info.color}12` : 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? info.color : muted, borderBottom: ativo ? `2px solid ${info.color}` : '2px solid transparent', transition: 'all .15s', flexShrink: 0 }}>
                <info.Icon size={15} />
                {info.label}
                <span style={{ fontSize: 10, fontWeight: 700, background: ativo ? info.color : isDark ? '#333' : '#f3f4f6', color: ativo ? '#fff' : muted, padding: '1px 6px', borderRadius: 10 }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Info da categoria */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: catInfo.bg, border: `1px solid ${catInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <catInfo.Icon size={14} color={catInfo.color} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: fg }}>{catInfo.label}</span>
              <span style={{ fontSize: 12, color: muted, marginLeft: 8 }}>{ativos} ativo{ativos !== 1 ? 's' : ''} · {da_cat.length} total</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: muted }}>
            Total estimado do menu: <strong style={{ color: catInfo.color }}>
              R$ {fmt(da_cat.filter(s => s.ativo).reduce((s, i) => s + i.preco, 0))}
            </strong>
          </div>
        </div>

        {/* Cabeçalho da lista */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', background: bg2, borderBottom: `1px solid ${border}` }}>
          <div style={{ width: 32, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Serviço</div>
          <div style={{ width: 120, fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0 }}>Preço</div>
          <div style={{ width: 160, fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0 }}>Ações</div>
        </div>

        {/* Novo serviço inline */}
        {showNovo && (
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}`, background: isDark ? '#1e2d1e' : '#f0fdf4', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome *</label>
              <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex: Fast Escova Premium"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1.5px solid ${catInfo.color}`, background: card, color: fg, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grupo *</label>
              <input value={novoGrupo} onChange={e => setNovoGrupo(e.target.value)} placeholder="Ex: Escovas & Finalizações"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1.5px solid ${border}`, background: card, color: fg, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ width: 110 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preço (R$) *</label>
              <input value={novoPreco} onChange={e => setNovoPreco(e.target.value)} placeholder="89,00"
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1.5px solid ${border}`, background: card, color: fg, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
              <button onClick={handleCriarNovo} disabled={savingNovo}
                style={{ padding: '7px 16px', borderRadius: 6, background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                {savingNovo ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={13} />} Adicionar
              </button>
              <button onClick={() => { setShowNovo(false); setErroNovo(''); setNovoNome(''); setNovoGrupo(''); setNovoPreco(''); }}
                style={{ padding: '7px 12px', borderRadius: 6, background: bg2, color: muted, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
            </div>
            {erroNovo && <div style={{ width: '100%', fontSize: 12, color: '#ef4444', marginTop: 2 }}>{erroNovo}</div>}
          </div>
        )}

        {/* Lista agrupada */}
        <div>
          {grupos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: muted, fontSize: 13 }}>Nenhum serviço cadastrado para esta categoria.</div>
          ) : (
            grupos.map(grupo => (
              <GrupoSection
                key={grupo}
                grupo={grupo}
                itens={da_cat.filter(s => s.grupo === grupo)}
                catInfo={catInfo}
                onSave={handleSave}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
