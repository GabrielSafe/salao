import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardTab from './tabs/DashboardTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab from './tabs/RelatorioTab';

const TABS = [
  { path: '', label: 'Dashboard', icon: '📊' },
  { path: 'comanda', label: 'Nova Comanda', icon: '📋' },
  { path: 'funcionarias', label: 'Equipe', icon: '👥' },
  { path: 'relatorio', label: 'Relatório', icon: '📈' },
];

export default function AdminPage() {
  const { usuario, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--cinza-bg)' }}>
      {/* Header */}
      <nav style={{ background: 'var(--rosa)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>💇‍♀️ {usuario?.salao?.nome || 'Salão'}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Gerenciamento · {usuario?.nome}</div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13 }}>
          Sair
        </button>
      </nav>

      {/* Tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--cinza-borda)', padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <NavLink
            key={t.path}
            to={t.path === '' ? '/admin' : `/admin/${t.path}`}
            end={t.path === ''}
            style={({ isActive }) => ({
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? 'var(--rosa)' : 'var(--texto-suave)',
              borderBottom: isActive ? '2px solid var(--rosa)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            })}
          >
            {t.icon} {t.label}
          </NavLink>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route index element={<DashboardTab />} />
          <Route path="comanda" element={<NovaComandaTab />} />
          <Route path="funcionarias" element={<FuncionariasTab />} />
          <Route path="relatorio" element={<RelatorioTab />} />
        </Routes>
      </div>
    </div>
  );
}
