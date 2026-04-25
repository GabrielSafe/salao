import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut, Scissors, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardTab from './tabs/DashboardTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab from './tabs/RelatorioTab';

const TABS = [
  { path: '', label: 'Dashboard',    Icon: LayoutDashboard },
  { path: 'comanda',      label: 'Nova Comanda', Icon: ClipboardPlus },
  { path: 'funcionarias', label: 'Equipe',       Icon: Users },
  { path: 'relatorio',    label: 'Relatório',    Icon: BarChart3 },
];

export default function AdminPage() {
  const { usuario, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sidebar desktop ── */}
      <aside className="sidebar" style={{ display: 'flex' }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--accent)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Scissors size={20} color="#0A0A0A" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{usuario?.salao?.nome || 'Salão'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Gerenciamento</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {TABS.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path === '' ? '/admin' : `/admin/${path}`}
              end={path === ''}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-hover)', border: '1px solid var(--border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
            }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario?.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Admin</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: '#0D0D0D', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scissors size={16} color="#0A0A0A" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{usuario?.salao?.nome}</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', color: 'var(--text-2)', padding: 4 }}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <div style={{ flex: 1, padding: '28px 28px', maxWidth: 1000, width: '100%' }}>
          <Routes>
            <Route index element={<DashboardTab />} />
            <Route path="comanda" element={<NovaComandaTab />} />
            <Route path="funcionarias" element={<FuncionariasTab />} />
            <Route path="relatorio" element={<RelatorioTab />} />
          </Routes>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          main > div { padding: 72px 16px 20px !important; }
        }
      `}</style>
    </div>
  );
}
