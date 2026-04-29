import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut,
  Scissors, Settings, Clock, FileText, UserCircle,
  HelpCircle, Search, Bell, ChevronDown, Crown, Sun, Moon, Tag, Armchair, Menu,
  User, Mail, Lock, Eye, EyeOff, Check, X, Loader2, Edit3, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useThemeCtx as useTheme } from '../../contexts/ThemeContext.jsx';
import api from '../../services/api';
import DashboardTab        from './tabs/DashboardTab';
import ServicosTab         from './tabs/ServicosTab';
import CadeirasTab         from './tabs/CadeirasTab';
import NovaComandaTab      from './tabs/NovaComandaTab';
import FuncionariasTab     from './tabs/FuncionariasTab';
import RelatorioTab        from './tabs/RelatorioTab';
import FilaTab             from './tabs/FilaTab';
import ClientesTab         from './tabs/ClientesTab';
import ComandasTab         from './tabs/ComandasTab';
import RecepcionistasTab   from './tabs/RecepcionistasTab';

// ── Nav sections (usamos função para filtrar por role) ─────────────────────
const MAIN_MENU_ADMIN = [
  { path: '',                label: 'Dashboard',      Icon: LayoutDashboard, badge: 'ativos' },
  { path: 'comanda',         label: 'Nova Comanda',   Icon: ClipboardPlus },
  { path: 'comandas',        label: 'Comandas',       Icon: FileText },
  { path: 'funcionarias',    label: 'Equipe',         Icon: Users },
  { path: 'fila',            label: 'Fila de Espera', Icon: Clock },
  { path: 'clientes',        label: 'Clientes',       Icon: UserCircle },
  { path: 'relatorio',       label: 'Relatórios',     Icon: BarChart3 },
  { path: 'servicos',        label: 'Serviços',       Icon: Tag },
  { path: 'cadeiras',        label: 'Cadeiras',       Icon: Armchair },
  { path: 'recepcionistas',  label: 'Recepcionistas', Icon: Shield },
];

const MAIN_MENU_RECEPCIONISTA = [
  { path: '',             label: 'Dashboard',      Icon: LayoutDashboard, badge: 'ativos' },
  { path: 'comanda',      label: 'Nova Comanda',   Icon: ClipboardPlus },
  { path: 'comandas',     label: 'Comandas',       Icon: FileText },
  { path: 'funcionarias', label: 'Equipe',         Icon: Users },
  { path: 'fila',         label: 'Fila de Espera', Icon: Clock },
  { path: 'clientes',     label: 'Clientes',       Icon: UserCircle },
  { path: 'relatorio',    label: 'Relatórios',     Icon: BarChart3 },
  { path: 'cadeiras',     label: 'Cadeiras',       Icon: Armchair },
];

const PREFERENCE_MENU = [
  { path: 'configuracoes', label: 'Configurações', Icon: Settings,   soon: true },
  { path: 'ajuda',         label: 'Ajuda',         Icon: HelpCircle, soon: true },
];

const PAGE_TITLES = {
  '/admin':                    { title: 'Dashboard',        sub: 'Acompanhe o salão em tempo real' },
  '/admin/comanda':            { title: 'Nova Comanda',     sub: 'Registre a chegada de uma cliente' },
  '/admin/comandas':           { title: 'Comandas',         sub: 'Comandas ativas do salão' },
  '/admin/funcionarias':       { title: 'Equipe',           sub: 'Gerencie as funcionárias' },
  '/admin/fila':               { title: 'Fila de Espera',   sub: 'Funcionárias na fila por serviço' },
  '/admin/clientes':           { title: 'Clientes',         sub: 'Cadastro e histórico de clientes' },
  '/admin/relatorio':          { title: 'Relatórios',       sub: 'Análise de atendimentos' },
  '/admin/servicos':           { title: 'Serviços',         sub: 'Gerencie o catálogo de serviços e preços' },
  '/admin/cadeiras':           { title: 'Cadeiras',         sub: 'Gestão e relatórios das cadeiras do salão' },
  '/admin/recepcionistas':     { title: 'Recepcionistas',   sub: 'Gerencie as contas das recepcionistas' },
};

// ── Cores do tema ─────────────────────────────────────────────────────────
function buildTheme(isDark) {
  return isDark ? {
    // sidebar
    sidebarBg:      '#0f0f0f',
    sidebarBorder:  'rgba(255,255,255,.06)',
    sidebarText:    'rgba(255,255,255,.45)',
    sidebarTitle:   '#ffffff',
    sidebarSub:     'rgba(255,255,255,.28)',
    sidebarSection: 'rgba(255,255,255,.22)',
    sidebarHover:   'rgba(255,255,255,.04)',
    sidebarProfile: 'rgba(255,255,255,.04)',
    sidebarUpBg:    'rgba(245,158,11,.08)',
    sidebarUpBorder:'rgba(245,158,11,.15)',
    sidebarUpText:  '#ffffff',
    sidebarUpSub:   'rgba(255,255,255,.3)',
    sidebarLogout:  'rgba(255,255,255,.28)',
    // topbar
    topbarBg:       '#1a1a1a',
    topbarBorder:   '#2a2a2a',
    topbarText:     '#e5e5e5',
    topbarMuted:    '#a3a3a3',
    topbarHover:    '#262626',
    topbarBtnBorder:'#333333',
    searchBg:       '#262626',
    searchBorder:   '#404040',
    searchText:     '#e5e5e5',
    searchKbd:      '#404040',
    searchKbdText:  '#a3a3a3',
    // content
    contentBg:      '#111111',
  } : {
    // sidebar
    sidebarBg:      '#f9fafb',
    sidebarBorder:  '#e5e7eb',
    sidebarText:    '#6b7280',
    sidebarTitle:   '#262626',
    sidebarSub:     '#9ca3af',
    sidebarSection: '#9ca3af',
    sidebarHover:   'rgba(0,0,0,.04)',
    sidebarProfile: 'rgba(0,0,0,.04)',
    sidebarUpBg:    'rgba(245,158,11,.06)',
    sidebarUpBorder:'rgba(245,158,11,.2)',
    sidebarUpText:  '#262626',
    sidebarUpSub:   '#6b7280',
    sidebarLogout:  '#9ca3af',
    // topbar
    topbarBg:       '#ffffff',
    topbarBorder:   '#e5e7eb',
    topbarText:     '#262626',
    topbarMuted:    '#6b7280',
    topbarHover:    '#f9fafb',
    topbarBtnBorder:'#e5e7eb',
    searchBg:       '#f9fafb',
    searchBorder:   '#e5e7eb',
    searchText:     '#262626',
    searchKbd:      '#e5e7eb',
    searchKbdText:  '#9ca3af',
    // content
    contentBg:      '#f9fafb',
  };
}

// ── ProfileModal ──────────────────────────────────────────────────────────
function ProfileModal({ onClose, t, isDark }) {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome]               = useState(usuario?.nome || '');
  const [email, setEmail]             = useState(usuario?.email || '');
  const [senhaAtual, setSenhaAtual]   = useState('');
  const [novaSenha, setNovaSenha]     = useState('');
  const [confirmar, setConfirmar]     = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [alterarSenha, setAlterarSenha] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: isDark ? '#1f1f1f' : '#f9fafb',
    border: `1.5px solid ${isDark ? '#404040' : '#e5e7eb'}`,
    borderRadius: 8, fontSize: 14,
    color: isDark ? '#e5e5e5' : '#262626',
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color .15s',
  };

  async function handleSalvar(e) {
    e.preventDefault();
    setErro(''); setSucesso('');
    if (alterarSenha && novaSenha !== confirmar) {
      setErro('As senhas não coincidem'); return;
    }
    setLoading(true);
    try {
      const { data } = await api.patch('/auth/perfil', {
        nome, email,
        ...(alterarSenha && novaSenha ? { senhaAtual, novaSenha } : {}),
      });
      atualizarUsuario(data);
      setSucesso('Perfil atualizado com sucesso!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
      setAlterarSenha(false);
      setTimeout(onClose, 1200);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao atualizar perfil');
    } finally { setLoading(false); }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: t.sidebarBg, border: `1px solid ${t.sidebarBorder}`, borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.4)', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#000' }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.sidebarTitle }}>Editar perfil</div>
              <div style={{ fontSize: 12, color: t.sidebarSub, marginTop: 1 }}>{usuario?.role === 'RECEPCIONISTA' ? 'Recepcionista' : 'Administrador'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sidebarSub, padding: 4, display: 'flex', borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSalvar} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sidebarSub, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <User size={11} /> Nome
            </label>
            <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.15)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? '#404040' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              placeholder="Seu nome" required />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sidebarSub, textTransform: 'uppercase', letterSpacing: '.6px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={11} /> E-mail
            </label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,.15)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? '#404040' : '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              placeholder="seu@email.com" required />
          </div>

          {/* Toggle alterar senha */}
          <button type="button" onClick={() => { setAlterarSenha(!alterarSenha); setErro(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: alterarSenha ? 'rgba(245,158,11,.1)' : (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'), border: `1px solid ${alterarSenha ? 'rgba(245,158,11,.3)' : (isDark ? 'rgba(255,255,255,.08)' : '#e5e7eb')}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: alterarSenha ? '#d97706' : t.sidebarSub, transition: 'all .15s', textAlign: 'left' }}>
            <Lock size={13} />
            {alterarSenha ? 'Cancelar alteração de senha' : 'Alterar senha'}
          </button>

          {alterarSenha && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: isDark ? 'rgba(245,158,11,.04)' : 'rgba(245,158,11,.03)', borderRadius: 10, border: '1px solid rgba(245,158,11,.15)' }}>
              {/* Senha atual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: t.sidebarSub, textTransform: 'uppercase', letterSpacing: '.6px' }}>Senha atual</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 38 }} type={mostrarSenha ? 'text' : 'password'} value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = '#f59e0b'; }}
                    onBlur={e => { e.target.style.borderColor = isDark ? '#404040' : '#e5e7eb'; }}
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.sidebarSub, display: 'flex', padding: 2 }}>
                    {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {/* Nova senha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: t.sidebarSub, textTransform: 'uppercase', letterSpacing: '.6px' }}>Nova senha</label>
                <input style={inputStyle} type={mostrarSenha ? 'text' : 'password'} value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; }}
                  onBlur={e => { e.target.style.borderColor = isDark ? '#404040' : '#e5e7eb'; }}
                  placeholder="Mínimo 6 caracteres" />
              </div>
              {/* Confirmar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: t.sidebarSub, textTransform: 'uppercase', letterSpacing: '.6px' }}>Confirmar nova senha</label>
                <input style={{ ...inputStyle, borderColor: confirmar && confirmar !== novaSenha ? '#ef4444' : (isDark ? '#404040' : '#e5e7eb') }}
                  type={mostrarSenha ? 'text' : 'password'} value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = confirmar !== novaSenha ? '#ef4444' : '#f59e0b'; }}
                  onBlur={e => { e.target.style.borderColor = confirmar && confirmar !== novaSenha ? '#ef4444' : (isDark ? '#404040' : '#e5e7eb'); }}
                  placeholder="Repita a nova senha" />
                {confirmar && confirmar !== novaSenha && (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>As senhas não coincidem</span>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          {erro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#ef4444' }}>
              <X size={14} /> {erro}
            </div>
          )}
          {sucesso && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#10b981', fontWeight: 600 }}>
              <Check size={14} /> {sucesso}
            </div>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="submit" disabled={loading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#f59e0b', color: '#000', borderRadius: 9, fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={15} />}
              Salvar alterações
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 18px', background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', color: t.sidebarSub, borderRadius: 9, fontSize: 14, border: `1px solid ${t.sidebarBorder}`, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>,
    document.body
  );
}

// ── ProfileDropdown ────────────────────────────────────────────────────────
function ProfileDropdown({ anchorRef, onClose, onEditarPerfil, t, isDark, toggle, logout }) {
  const { usuario } = useAuth();
  const dropRef = useRef(null);
  const [pos, setPos] = useState({});

  useEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fromRight = window.innerWidth - rect.right;
    setPos({ top: rect.bottom + 6, right: fromRight });
  }, [anchorRef]);

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  const item = (Icon, label, action, color, bg) => (
    <button onClick={() => { onClose(); action(); }}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background .12s', color: color || t.sidebarText, fontSize: 13, fontWeight: 500, textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.background = bg || t.sidebarHover}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={color || t.sidebarText} />
      </div>
      {label}
    </button>
  );

  return createPortal(
    <div ref={dropRef} style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 1500, background: t.sidebarBg, border: `1px solid ${t.sidebarBorder}`, borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.25)', minWidth: 220, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* Cabeçalho */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
            {usuario?.nome?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.sidebarTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nome}</div>
            <div style={{ fontSize: 11, color: t.sidebarSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.email}</div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div style={{ padding: '6px' }}>
        {item(Edit3, 'Editar perfil', onEditarPerfil)}
        {item(isDark ? Sun : Moon, isDark ? 'Modo claro' : 'Modo escuro', toggle)}
        {item(Shield, 'Plano Profissional', () => {})}
      </div>

      {/* Divider + Sair */}
      <div style={{ borderTop: `1px solid ${t.sidebarBorder}`, padding: '6px' }}>
        {item(LogOut, 'Sair da conta', logout, '#ef4444', 'rgba(239,68,68,.08)')}
      </div>
    </div>,
    document.body
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ item, totalAtivos, t, isDark, onNavigate }) {
  const { path, label, Icon, badge, soon } = item;

  if (soon) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, opacity: 0.3, cursor: 'not-allowed', userSelect: 'none' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={t.sidebarText} />
      </div>
      <span style={{ fontSize: 13, color: t.sidebarText, flex: 1 }}>{label}</span>
      <span style={{ fontSize: 9, color: t.sidebarSub, background: 'rgba(128,128,128,.08)', padding: '2px 6px', borderRadius: 4 }}>Em breve</span>
    </div>
  );

  return (
    <NavLink
      to={path === '' ? '/admin' : `/admin/${path}`}
      end={path === ''}
      onClick={onNavigate}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 8,
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        color: isActive ? (isDark ? '#f5f5f5' : '#262626') : t.sidebarText,
        background: isActive
          ? (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)')
          : 'transparent',
        textDecoration: 'none', transition: 'all .15s',
        border: 'none',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget;
        if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
          el.style.background = t.sidebarHover;
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
          el.style.background = 'transparent';
        }
      }}
    >
      {({ isActive }) => (
        <>
          {/* Ícone: quadrado colorido âmbar quando ativo */}
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? '#f59e0b' : 'transparent',
            transition: 'all .15s',
          }}>
            <Icon size={15} color={isActive ? '#000' : t.sidebarText} strokeWidth={isActive ? 2.5 : 1.8} />
          </div>

          <span style={{ flex: 1 }}>{label}</span>

          {badge === 'ativos' && totalAtivos > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '1px 7px', borderRadius: 10, flexShrink: 0 }}>
              {totalAtivos}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { usuario, logout }           = useAuth();
  const location                      = useLocation();
  const { isDark, toggle }            = useTheme();
  const [estado, setEstado]           = useState({ atendimentos: [], filas: [], funcionarias: [] });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropOpen, setDropOpen]       = useState(false);
  const [modalPerfil, setModalPerfil] = useState(false);
  const topbarUserRef                 = useRef(null);
  const sidebarUserRef                = useRef(null);
  const activeAnchorRef               = useRef(topbarUserRef);

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const t = buildTheme(isDark);
  const totalAtivos = estado.atendimentos.filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status)).length;
  const page = PAGE_TITLES[location.pathname] || { title: 'Painel', sub: '' };
  const closeSidebar = () => setSidebarOpen(false);

  const isRecepcionista = usuario?.role === 'RECEPCIONISTA';
  const MAIN_MENU = isRecepcionista ? MAIN_MENU_RECEPCIONISTA : MAIN_MENU_ADMIN;
  const roleLabel = isRecepcionista ? 'Recepcionista' : 'Administrador';

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: t.contentBg }}>

      {/* ── OVERLAY mobile ── */}
      {sidebarOpen && (
        <div onClick={closeSidebar} className="rb-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999 }} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`rb-sidebar${sidebarOpen ? ' open' : ''}`} style={{
        width: 240, flexShrink: 0,
        background: t.sidebarBg,
        borderRight: `1px solid ${t.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        transition: 'background .2s, border-color .2s, transform .25s ease',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scissors size={18} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.sidebarTitle, letterSpacing: '-0.3px', lineHeight: 1 }}>
                Rápido <span style={{ color: '#f59e0b' }}>Beauty</span>
              </div>
              <div style={{ fontSize: 10, color: t.sidebarSub, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {usuario?.salao?.nome || 'Salão'}
              </div>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
          <div ref={sidebarUserRef} onClick={() => { activeAnchorRef.current = sidebarUserRef; setDropOpen(v => !v); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: dropOpen ? (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)') : t.sidebarProfile, cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => { if (!dropOpen) e.currentTarget.style.background = t.sidebarHover; }}
            onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.background = t.sidebarProfile; }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.sidebarTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {usuario?.nome}
              </div>
              <div style={{ fontSize: 11, color: t.sidebarSub, marginTop: 1 }}>{roleLabel}</div>
            </div>
            <ChevronDown size={13} color={t.sidebarSub} style={{ transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, scrollbarWidth: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.sidebarSection, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
            MAIN MENU
          </div>
          {MAIN_MENU.map(item => (
            <NavItem key={item.path} item={item} totalAtivos={totalAtivos} t={t} isDark={isDark} onNavigate={closeSidebar} />
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.sidebarSection, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
              PREFERENCE
            </div>
            {PREFERENCE_MENU.map(item => (
              <NavItem key={item.path} item={item} totalAtivos={0} t={t} isDark={isDark} onNavigate={closeSidebar} />
            ))}
          </div>
        </nav>

        {/* Upgrade + logout */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${t.sidebarBorder}` }}>
          <div style={{ background: t.sidebarUpBg, border: `1px solid ${t.sidebarUpBorder}`, borderRadius: 12, padding: '14px', textAlign: 'center', marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(245,158,11,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <Crown size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.sidebarUpText, marginBottom: 3 }}>Plano Profissional</div>
            <div style={{ fontSize: 11, color: t.sidebarUpSub, marginBottom: 10, lineHeight: 1.4 }}>
              Acesse recursos avançados de gestão.
            </div>
            <button style={{ width: '100%', padding: '7px', borderRadius: 7, background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Ver Planos →
            </button>
          </div>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', color: t.sidebarLogout, fontSize: 12, borderRadius: 8, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = t.sidebarHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TOPBAR */}
        <header style={{
          height: 60, flexShrink: 0,
          background: t.topbarBg,
          borderBottom: `1px solid ${t.topbarBorder}`,
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          transition: 'background .2s',
        }}>
          {/* Hamburger — mobile only */}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(v => !v)}
            style={{ display: 'none', width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <Menu size={18} color={t.topbarText} />
          </button>

          {/* Título */}
          <div style={{ minWidth: 0, flex: '0 1 auto' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.topbarText, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.title}</div>
            {page.sub && <div className="topbar-sub" style={{ fontSize: 11, color: t.topbarMuted, marginTop: 2, whiteSpace: 'nowrap' }}>{page.sub}</div>}
          </div>

          {/* Search */}
          <div className="topbar-search" style={{ flex: 1, maxWidth: 360 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.searchBg, border: `1px solid ${t.searchBorder}`, borderRadius: '0.375rem', padding: '7px 14px' }}>
              <Search size={14} color={t.topbarMuted} />
              <input
                placeholder="Buscar cliente, comanda..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: t.searchText, fontFamily: 'inherit' }}
              />
              <span style={{ fontSize: 10, color: t.searchKbdText, background: t.searchKbd, padding: '2px 6px', borderRadius: 4 }}>⌘ K</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* AO VIVO */}
          <div className="topbar-live" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', padding: '5px 12px', borderRadius: 20, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: '0.5px' }}>AO VIVO</span>
          </div>

          {/* Sino */}
          <button className="topbar-bell" style={{ position: 'relative', width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <Bell size={15} color={t.topbarMuted} />
            {totalAtivos > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#f59e0b', fontSize: 9, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalAtivos > 9 ? '9+' : totalAtivos}
              </div>
            )}
          </button>

          {/* Toggle tema ☀️/🌙 */}
          <button onClick={toggle}
            style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            {isDark
              ? <Sun  size={15} color="#f59e0b" />
              : <Moon size={15} color={t.topbarMuted} />
            }
          </button>

          {/* Settings */}
          <button className="topbar-settings" style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <Settings size={15} color={t.topbarMuted} />
          </button>

          {/* Help */}
          <button className="topbar-help" style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <HelpCircle size={15} color={t.topbarMuted} />
          </button>

          {/* User */}
          <div ref={topbarUserRef} onClick={() => { activeAnchorRef.current = topbarUserRef; setDropOpen(v => !v); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: '0.375rem', border: `1px solid ${dropOpen ? '#f59e0b' : t.topbarBtnBorder}`, cursor: 'pointer', background: dropOpen ? (isDark ? '#333' : '#f3f4f6') : t.topbarBg, transition: 'all .15s', flexShrink: 0 }}
            onMouseEnter={e => { if (!dropOpen) e.currentTarget.style.background = t.topbarHover; }}
            onMouseLeave={e => { if (!dropOpen) e.currentTarget.style.background = t.topbarBg; }}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <span className="topbar-username" style={{ fontSize: 13, fontWeight: 500, color: t.topbarText }}>
              {usuario?.nome?.split(' ')[0]}
            </span>
            <ChevronDown className="topbar-chevron" size={13} color={t.topbarMuted} style={{ transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, overflow: 'auto', background: t.contentBg, transition: 'background .2s' }}>
          <Routes>
            <Route index                element={<DashboardTab   estado={estado} />} />
            <Route path="comanda"       element={<NovaComandaTab />} />
            <Route path="funcionarias"  element={<FuncionariasTab />} />
            <Route path="relatorio"      element={<RelatorioTab />} />
            <Route path="fila"           element={<FilaTab estado={estado} />} />
            <Route path="clientes"       element={<ClientesTab />} />
            <Route path="comandas"       element={<ComandasTab estado={estado} />} />
            <Route path="servicos"       element={<ServicosTab />} />
            <Route path="cadeiras"       element={<CadeirasTab />} />
            <Route path="recepcionistas" element={<RecepcionistasTab />} />
          </Routes>
        </main>
      </div>

      {/* Dropdown do perfil */}
      {dropOpen && (
        <ProfileDropdown
          anchorRef={activeAnchorRef.current || topbarUserRef}
          onClose={() => setDropOpen(false)}
          onEditarPerfil={() => setModalPerfil(true)}
          t={t} isDark={isDark} toggle={toggle} logout={logout}
        />
      )}

      {/* Modal de edição de perfil */}
      {modalPerfil && (
        <ProfileModal onClose={() => setModalPerfil(false)} t={t} isDark={isDark} />
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,.2); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .rb-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0; z-index: 1000;
            transform: translateX(-100%);
          }
          .rb-sidebar.open { transform: translateX(0); }
          .rb-overlay { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
          .topbar-search { display: none !important; }
          .topbar-live { display: none !important; }
          .topbar-bell { display: none !important; }
          .topbar-settings { display: none !important; }
          .topbar-help { display: none !important; }
          .topbar-username { display: none !important; }
          .topbar-chevron { display: none !important; }
          .topbar-sub { display: none !important; }
        }

        /* ── Desktop: overlay never shows ── */
        @media (min-width: 769px) {
          .rb-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
}
