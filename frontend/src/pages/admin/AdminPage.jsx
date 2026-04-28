import { useState, useCallback } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut,
  Scissors, Settings, Clock, FileText, UserCircle,
  HelpCircle, Search, Bell, ChevronDown, Crown, Sun, Moon, Tag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useThemeCtx as useTheme } from '../../contexts/ThemeContext.jsx';
import DashboardTab   from './tabs/DashboardTab';
import ServicosTab    from './tabs/ServicosTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab   from './tabs/RelatorioTab';
import FilaTab        from './tabs/FilaTab';
import ClientesTab    from './tabs/ClientesTab';
import ComandasTab    from './tabs/ComandasTab';

// ── Nav sections ───────────────────────────────────────────────────────────
const MAIN_MENU = [
  { path: '',             label: 'Dashboard',      Icon: LayoutDashboard, badge: 'ativos' },
  { path: 'comanda',      label: 'Nova Comanda',   Icon: ClipboardPlus },
  { path: 'comandas',     label: 'Comandas',       Icon: FileText },
  { path: 'funcionarias', label: 'Equipe',         Icon: Users },
  { path: 'fila',         label: 'Fila de Espera', Icon: Clock },
  { path: 'clientes',     label: 'Clientes',       Icon: UserCircle },
  { path: 'relatorio',    label: 'Relatórios',     Icon: BarChart3 },
  { path: 'servicos',     label: 'Serviços',       Icon: Tag },
];

const PREFERENCE_MENU = [
  { path: 'configuracoes', label: 'Configurações', Icon: Settings,   soon: true },
  { path: 'ajuda',         label: 'Ajuda',         Icon: HelpCircle, soon: true },
];

const PAGE_TITLES = {
  '/admin':              { title: 'Dashboard',      sub: 'Acompanhe o salão em tempo real' },
  '/admin/comanda':      { title: 'Nova Comanda',   sub: 'Registre a chegada de uma cliente' },
  '/admin/comandas':     { title: 'Comandas',       sub: 'Comandas ativas do salão' },
  '/admin/funcionarias': { title: 'Equipe',         sub: 'Gerencie as funcionárias' },
  '/admin/fila':         { title: 'Fila de Espera', sub: 'Funcionárias na fila por serviço' },
  '/admin/clientes':     { title: 'Clientes',       sub: 'Cadastro e histórico de clientes' },
  '/admin/relatorio':    { title: 'Relatórios',     sub: 'Análise de atendimentos' },
  '/admin/servicos':     { title: 'Serviços',       sub: 'Gerencie o catálogo de serviços e preços' },
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

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ item, totalAtivos, t, isDark }) {
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
  const { usuario, logout }   = useAuth();
  const location              = useLocation();
  const { isDark, toggle }    = useTheme();
  const [estado, setEstado]   = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const t = buildTheme(isDark);
  const totalAtivos = estado.atendimentos.filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status)).length;
  const page = PAGE_TITLES[location.pathname] || { title: 'Painel', sub: '' };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: t.contentBg }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: t.sidebarBg,
        borderRight: `1px solid ${t.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        transition: 'background .2s, border-color .2s',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: t.sidebarProfile, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.sidebarTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {usuario?.nome}
              </div>
              <div style={{ fontSize: 11, color: t.sidebarSub, marginTop: 1 }}>Administrador</div>
            </div>
            <ChevronDown size={13} color={t.sidebarSub} />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, scrollbarWidth: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.sidebarSection, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
            MAIN MENU
          </div>
          {MAIN_MENU.map(item => (
            <NavItem key={item.path} item={item} totalAtivos={totalAtivos} t={t} isDark={isDark} />
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.sidebarSection, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
              PREFERENCE
            </div>
            {PREFERENCE_MENU.map(item => (
              <NavItem key={item.path} item={item} totalAtivos={0} t={t} isDark={isDark} />
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
          {/* Título */}
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.topbarText, lineHeight: 1 }}>{page.title}</div>
            {page.sub && <div style={{ fontSize: 11, color: t.topbarMuted, marginTop: 2 }}>{page.sub}</div>}
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 360 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', padding: '5px 12px', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: '0.5px' }}>AO VIVO</span>
          </div>

          {/* Sino */}
          <button style={{ position: 'relative', width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s' }}
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
            style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
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
          <button style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <Settings size={15} color={t.topbarMuted} />
          </button>

          {/* Help */}
          <button style={{ width: 36, height: 36, borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, background: t.topbarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <HelpCircle size={15} color={t.topbarMuted} />
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: '0.375rem', border: `1px solid ${t.topbarBtnBorder}`, cursor: 'pointer', background: t.topbarBg, transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = t.topbarHover}
            onMouseLeave={e => e.currentTarget.style.background = t.topbarBg}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000' }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: t.topbarText }}>
              {usuario?.nome?.split(' ')[0]}
            </span>
            <ChevronDown size={13} color={t.topbarMuted} />
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, overflow: 'auto', background: t.contentBg, transition: 'background .2s' }}>
          <Routes>
            <Route index                element={<DashboardTab   estado={estado} />} />
            <Route path="comanda"       element={<NovaComandaTab />} />
            <Route path="funcionarias"  element={<FuncionariasTab />} />
            <Route path="relatorio"     element={<RelatorioTab />} />
            <Route path="fila"          element={<FilaTab estado={estado} />} />
            <Route path="clientes"      element={<ClientesTab />} />
            <Route path="comandas"      element={<ComandasTab estado={estado} />} />
            <Route path="servicos"      element={<ServicosTab />} />
          </Routes>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,.2); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 768px) { aside { display: none !important; } }
      `}</style>
    </div>
  );
}
