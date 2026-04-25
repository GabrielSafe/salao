import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut, Scissors, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardTab from './tabs/DashboardTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab from './tabs/RelatorioTab';

const TABS = [
  { path: '',             label: 'Dashboard',    Icon: LayoutDashboard },
  { path: 'comanda',      label: 'Nova Comanda', Icon: ClipboardPlus },
  { path: 'funcionarias', label: 'Equipe',        Icon: Users },
  { path: 'relatorio',    label: 'Relatório',    Icon: BarChart3 },
];

export default function AdminPage() {
  const { usuario, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Topbar ── */}
      <header style={{
        background: '#0D0D0D',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 8, height: 56,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 24, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={16} color="#0A0A0A" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{usuario?.salao?.nome || 'Salão'}</span>
          </div>

          {/* Nav links — desktop */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} className="topnav-desktop">
            {TABS.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path === '' ? '/admin' : `/admin/${path}`}
                end={path === ''}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--accent-border)' : 'transparent'}`,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                })}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="topnav-desktop">
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              }}>
                {usuario?.nome?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{usuario?.nome}</span>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <LogOut size={13} /> Sair
            </button>
            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', color: 'var(--text-2)', padding: 4, display: 'none' }}
              className="topnav-mobile"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map(({ path, label, Icon }) => (
              <NavLink
                key={path}
                to={path === '' ? '/admin' : `/admin/${path}`}
                end={path === ''}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  fontSize: 14, fontWeight: 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-2)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  textDecoration: 'none',
                })}
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Conteúdo centrado ── */}
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
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
          .topnav-desktop { display: none !important; }
          .topnav-mobile  { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
