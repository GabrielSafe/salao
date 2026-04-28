import { useState, useCallback } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut,
  Scissors, Settings, Clock, FileText, UserCircle,
  HelpCircle, Search, Bell, ChevronDown, Crown, Eye,
  Sparkles, Hand, Leaf, Coffee
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import DashboardTab  from './tabs/DashboardTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab  from './tabs/RelatorioTab';
import FilaTab       from './tabs/FilaTab';
import ClientesTab   from './tabs/ClientesTab';
import ComandasTab   from './tabs/ComandasTab';

// ── Nav sections ───────────────────────────────────────────────────────────
const MAIN_MENU = [
  { path: '',             label: 'Dashboard',      Icon: LayoutDashboard, badge: 'ativos' },
  { path: 'comanda',      label: 'Nova Comanda',   Icon: ClipboardPlus },
  { path: 'comandas',     label: 'Comandas',       Icon: FileText },
  { path: 'funcionarias', label: 'Equipe',         Icon: Users },
  { path: 'fila',         label: 'Fila de Espera', Icon: Clock },
  { path: 'clientes',     label: 'Clientes',       Icon: UserCircle },
  { path: 'relatorio',    label: 'Relatórios',     Icon: BarChart3 },
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
};

// ── Sidebar NavItem ────────────────────────────────────────────────────────
function NavItem({ item, totalAtivos }) {
  const { path, label, Icon, badge, soon } = item;
  if (soon) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, opacity: 0.35, cursor: 'not-allowed', userSelect: 'none' }}>
      <Icon size={16} color="rgba(255,255,255,.5)" />
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.07)', padding: '2px 6px', borderRadius: 4 }}>Em breve</span>
    </div>
  );
  return (
    <NavLink
      to={path === '' ? '/admin' : `/admin/${path}`}
      end={path === ''}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', borderRadius: 8,
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        color: isActive ? '#f59e0b' : 'rgba(255,255,255,.5)',
        background: isActive ? 'rgba(245,158,11,.1)' : 'transparent',
        textDecoration: 'none', transition: 'all .15s',
        borderLeft: `2px solid ${isActive ? '#f59e0b' : 'transparent'}`,
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} color={isActive ? '#f59e0b' : 'rgba(255,255,255,.4)'} />
          <span style={{ flex: 1 }}>{label}</span>
          {badge === 'ativos' && totalAtivos > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '1px 7px', borderRadius: 10 }}>
              {totalAtivos}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const totalAtivos = estado.atendimentos.filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status)).length;
  const page = PAGE_TITLES[location.pathname] || { title: 'Painel', sub: '' };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", background: '#f9fafb' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#111',
        borderRight: '1px solid rgba(255,255,255,.05)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scissors size={18} color="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>
                Rápido <span style={{ color: '#f59e0b' }}>Beauty</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {usuario?.salao?.nome || 'Salão'}
              </div>
            </div>
          </div>
        </div>

        {/* User profile */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,.04)', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {usuario?.nome}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 1 }}>Administrador</div>
            </div>
            <ChevronDown size={13} color="rgba(255,255,255,.3)" />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, scrollbarWidth: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
            MAIN MENU
          </div>
          {MAIN_MENU.map(item => (
            <NavItem key={item.path} item={item} totalAtivos={totalAtivos} />
          ))}

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '4px 10px 10px' }}>
              PREFERENCE
            </div>
            {PREFERENCE_MENU.map(item => (
              <NavItem key={item.path} item={item} totalAtivos={0} />
            ))}
          </div>
        </nav>

        {/* Upgrade card + logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.15)', borderRadius: 12, padding: '14px', textAlign: 'center', marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(245,158,11,.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
              <Crown size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Plano Profissional</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 10, lineHeight: 1.4 }}>
              Acesse recursos avançados de gestão.
            </div>
            <button style={{ width: '100%', padding: '7px', borderRadius: 7, background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Ver Planos →
            </button>
          </div>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.3)', fontSize: 12, borderRadius: 8, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,.6)'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,.3)'; e.currentTarget.style.background = 'none'; }}
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
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16,
        }}>
          {/* Título da página */}
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#262626', lineHeight: 1 }}>{page.title}</div>
            {page.sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{page.sub}</div>}
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 380 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '7px 14px', transition: 'border-color .15s' }}>
              <Search size={14} color="#9ca3af" />
              <input
                placeholder="Buscar cliente, comanda..."
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#262626', fontFamily: 'inherit' }}
              />
              <span style={{ fontSize: 10, color: '#9ca3af', background: '#e5e7eb', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.5px' }}>⌘ K</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* AO VIVO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', padding: '5px 12px', borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: '0.5px' }}>AO VIVO</span>
          </div>

          {/* Bell */}
          <button style={{ position: 'relative', width: 36, height: 36, borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <Bell size={15} color="#6b7280" />
            {totalAtivos > 0 && (
              <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#f59e0b', fontSize: 9, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalAtivos > 9 ? '9+' : totalAtivos}
              </div>
            )}
          </button>

          {/* Settings */}
          <button style={{ width: 36, height: 36, borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <Settings size={15} color="#6b7280" />
          </button>

          {/* Help */}
          <button style={{ width: 36, height: 36, borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <HelpCircle size={15} color="#6b7280" />
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: '0.375rem', border: '1px solid #e5e7eb', cursor: 'pointer', background: '#fff', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000' }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>
              {usuario?.nome?.split(' ')[0]}
            </span>
            <ChevronDown size={13} color="#6b7280" />
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
          <Routes>
            <Route index                element={<DashboardTab   estado={estado} />} />
            <Route path="comanda"       element={<NovaComandaTab />} />
            <Route path="funcionarias"  element={<FuncionariasTab />} />
            <Route path="relatorio"     element={<RelatorioTab />} />
            <Route path="fila"          element={<FilaTab estado={estado} />} />
            <Route path="clientes"      element={<ClientesTab />} />
            <Route path="comandas"      element={<ComandasTab estado={estado} />} />
          </Routes>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.1); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 768px) { aside { display: none !important; } }
      `}</style>
    </div>
  );
}
