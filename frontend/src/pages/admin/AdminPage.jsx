import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardPlus, Users, BarChart3, LogOut,
  Scissors, Menu, X, Bell, ChevronDown, Settings, Clock,
  FileText, Zap, Sparkles, UserCircle, Crown, HelpCircle,
  Wifi, Leaf, Hand
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import DashboardTab from './tabs/DashboardTab';
import NovaComandaTab from './tabs/NovaComandaTab';
import FuncionariasTab from './tabs/FuncionariasTab';
import RelatorioTab from './tabs/RelatorioTab';

const NAV_ITEMS = [
  { path: '',             label: 'Dashboard',      Icon: LayoutDashboard, implemented: true,  iconColor: '#D4178A', iconBg: 'rgba(212,23,138,.2)' },
  { path: 'comanda',      label: 'Nova Comanda',   Icon: ClipboardPlus,   implemented: true,  iconColor: '#A78BFA', iconBg: 'rgba(167,139,250,.2)' },
  { path: 'funcionarias', label: 'Equipe',          Icon: Users,           implemented: true,  iconColor: '#60A5FA', iconBg: 'rgba(96,165,250,.2)' },
  { path: 'relatorio',    label: 'Relatórios',     Icon: BarChart3,       implemented: true,  iconColor: '#34D399', iconBg: 'rgba(52,211,153,.2)' },
  null,
  { path: 'fila',         label: 'Fila de Espera', Icon: Clock,           implemented: false, iconColor: '#FCD34D', iconBg: 'rgba(252,211,77,.15)' },
  { path: 'atendimentos', label: 'Atendimentos',   Icon: Zap,             implemented: false, iconColor: '#FB923C', iconBg: 'rgba(251,146,60,.15)' },
  { path: 'clientes',     label: 'Clientes',       Icon: UserCircle,      implemented: false, iconColor: '#67E8F9', iconBg: 'rgba(103,232,249,.15)' },
  { path: 'configuracoes',label: 'Configurações',  Icon: Settings,        implemented: false, iconColor: '#9CA3AF', iconBg: 'rgba(156,163,175,.12)' },
];

const SERVICE_INFO = {
  CABELO:    { label: 'Cabelo',    Icon: Scissors, color: '#C084FC', bg: 'rgba(168,85,247,.15)' },
  MAQUIAGEM: { label: 'Maquiagem', Icon: Sparkles, color: '#F472B6', bg: 'rgba(236,72,153,.15)' },
  MAO:       { label: 'Mão',       Icon: Hand,     color: '#FB923C', bg: 'rgba(251,146,60,.15)' },
  PE:        { label: 'Pé',        Icon: Leaf,     color: '#4ADE80', bg: 'rgba(34,197,94,.15)' },
};

function RightTeamPanel({ estado }) {
  const atendendo  = estado.funcionarias.filter(f => f.status === 'EM_ATENDIMENTO');
  const disponiveis= estado.funcionarias.filter(f => f.status === 'ONLINE');
  const offline    = estado.funcionarias.filter(f => f.status === 'OFFLINE');

  function Avatar({ f, size = 36 }) {
    const atend = estado.atendimentos.find(a => a.funcionariaId === f.id && a.status === 'EM_ATENDIMENTO');
    const svcInfo = atend ? SERVICE_INFO[atend.tipoServico] : null;
    const statusColor = f.status === 'EM_ATENDIMENTO' ? '#F59E0B' : f.status === 'ONLINE' ? '#10B981' : '#6B7280';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', transition: 'background .15s', cursor: 'default', borderRadius: 8 }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: size, height: size, borderRadius: '50%', background: `${statusColor}20`, border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: statusColor }}>
            {f.usuario?.nome?.[0]?.toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: statusColor, border: '1.5px solid #0D1117' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: f.status === 'OFFLINE' ? '#4B5563' : '#E6EDF3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.usuario?.nome}
          </div>
          <div style={{ fontSize: 11, color: f.status === 'OFFLINE' ? '#374151' : svcInfo?.color || '#6B7280', marginTop: 1 }}>
            {svcInfo?.label || (f.status === 'ONLINE' ? 'Disponível' : 'Offline')}
          </div>
        </div>
        {f.status === 'EM_ATENDIMENTO' && atend && (
          <div style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,.12)', padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>
            {Math.floor((Date.now() - new Date(atend.iniciadoEm || atend.createdAt)) / 60000)}m
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: 260, flexShrink: 0, background: '#161B22', borderLeft: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="right-panel">
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E6EDF3' }}>EQUIPE</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{estado.funcionarias.length} funcionários</div>
          </div>
          <button style={{ fontSize: 11, fontWeight: 600, color: '#D4178A', background: 'rgba(212,23,138,.1)', border: '1px solid rgba(212,23,138,.2)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
            Ver todos
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {/* Atendendo agora */}
        {atendendo.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: '4px 16px 8px', fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Atendendo agora
            </div>
            {atendendo.map(f => <Avatar key={f.id} f={f} />)}
          </div>
        )}

        {/* Disponíveis */}
        {disponiveis.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: '4px 16px 8px', fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Disponíveis
            </div>
            {disponiveis.map(f => <Avatar key={f.id} f={f} />)}
          </div>
        )}

        {/* Offline */}
        {offline.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ padding: '4px 16px 8px', fontSize: 10, fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Offline
            </div>
            {offline.map(f => <Avatar key={f.id} f={f} />)}
          </div>
        )}

        {estado.funcionarias.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#374151', fontSize: 13 }}>Nenhuma funcionária</div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { usuario, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [estado, setEstado] = useState({ atendimentos: [], filas: [], funcionarias: [] });

  const onEstadoCompleto = useCallback((dados) => setEstado(dados), []);
  useSocket(usuario?.salaoId, { onEstadoCompleto });

  const totalAtivos = estado.atendimentos.filter(a => ['AGUARDANDO', 'EM_ATENDIMENTO'].includes(a.status)).length;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0D1117', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{
          width: 220, flexShrink: 0,
          background: '#161B22',
          borderRight: '1px solid rgba(255,255,255,.07)',
          display: 'flex', flexDirection: 'column',
          height: '100vh', overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #E85D04, #D4178A)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Scissors size={17} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 800, lineHeight: 1, color: '#E6EDF3' }}>
                  RÁPIDO <span style={{ background: 'linear-gradient(135deg, #E85D04, #D4178A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>BEAUTY</span>
                </div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {usuario?.salao?.nome || 'Salão'}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {NAV_ITEMS.map((item, i) => {
              if (item === null) return <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '8px 6px' }} />;
              const { path, label, Icon, implemented } = item;
              const { iconColor, iconBg } = item;

              if (!implemented) {
                return (
                  <div key={path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, cursor: 'not-allowed', userSelect: 'none', opacity: 0.4 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={iconColor} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>{label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: '#4B5563', background: 'rgba(255,255,255,.04)', padding: '2px 6px', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
                      Em breve
                    </span>
                  </div>
                );
              }
              return (
                <NavLink
                  key={path}
                  to={path === '' ? '/admin' : `/admin/${path}`}
                  end={path === ''}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 9,
                    fontSize: 13, fontWeight: 500,
                    color: isActive ? '#fff' : '#8B949E',
                    background: isActive ? 'rgba(255,255,255,.06)' : 'transparent',
                    textDecoration: 'none', transition: 'all .15s',
                    border: isActive ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.style.background.includes('rgba(255,255,255,.06)')) e.currentTarget.style.background = 'rgba(255,255,255,.04)'; }}
                  onMouseLeave={e => { /* handled by NavLink */ }}
                >
                  {({ isActive }) => (
                    <>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: isActive ? iconBg : 'rgba(255,255,255,.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                        boxShadow: isActive ? `0 2px 8px ${iconColor}30` : 'none',
                      }}>
                        <Icon size={15} color={isActive ? iconColor : '#6B7280'} />
                      </div>
                      <span style={{ flex: 1 }}>{label}</span>
                      {path === '' && totalAtivos > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: iconColor, background: iconBg, padding: '2px 7px', borderRadius: 10 }}>{totalAtivos}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Plano */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(212,23,138,.12), rgba(232,93,4,.08))', border: '1px solid rgba(212,23,138,.2)', borderRadius: 10, padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Crown size={14} color="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3' }}>Plano Profissional</span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Expira em 30 dias</div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2 }}>
                <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #E85D04, #D4178A)', borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#6B7280' }}>75% utilizado</span>
                <button style={{ fontSize: 10, color: '#D4178A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver planos</button>
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 12, marginTop: 6, borderRadius: 8, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = '#8B949E'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }}
            >
              <HelpCircle size={14} /> Precisa de ajuda?
            </button>
          </div>
        </aside>
      )}

      {/* ── Área principal ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ height: 56, background: '#161B22', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', color: '#8B949E', padding: 6, borderRadius: 6, display: 'flex', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Menu size={18} />
          </button>

          <div style={{ flex: 1 }} />

          {/* AO VIVO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', padding: '5px 12px', borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse-dot 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981', letterSpacing: '0.5px' }}>AO VIVO</span>
          </div>

          {/* Notificações */}
          <button style={{ position: 'relative', background: 'none', color: '#8B949E', padding: 8, borderRadius: 8, display: 'flex', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#E6EDF3'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#8B949E'; }}
          >
            <Bell size={18} />
            {totalAtivos > 0 && (
              <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#D4178A', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalAtivos > 9 ? '9+' : totalAtivos}
              </div>
            )}
          </button>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #E85D04, #D4178A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {usuario?.nome?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3', lineHeight: 1 }}>{usuario?.nome}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Administrador</div>
            </div>
            <ChevronDown size={14} color="#6B7280" />
          </div>

          <button onClick={logout} style={{ background: 'none', color: '#6B7280', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = '#E6EDF3'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <LogOut size={15} />
          </button>
        </header>

        {/* Content + Right panel */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <Routes>
              <Route index element={<DashboardTab estado={estado} />} />
              <Route path="comanda" element={<NovaComandaTab />} />
              <Route path="funcionarias" element={<FuncionariasTab />} />
              <Route path="relatorio" element={<RelatorioTab />} />
            </Routes>
          </main>
          <RightTeamPanel estado={estado} />
        </div>
      </div>

      <style>{`
        .right-panel { }
        @media (max-width: 1200px) { .right-panel { display: none !important; } }
        @media (max-width: 768px) {
          aside { display: none !important; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
