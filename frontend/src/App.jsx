import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/auth/LoginPage';
import ClientePage from './pages/public/ClientePage';
import ComandaPage from './pages/public/ComandaPage';
import FuncionariaPage from './pages/funcionaria/FuncionariaPage';
import AdminPage from './pages/admin/AdminPage';
import SuperAdminPage from './pages/superadmin/SuperAdminPage';

function RotaPrivada({ children, roles }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/login" replace />;
  return children;
}

function RedirecionarPorRole() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.role === 'SUPERADMIN') return <Navigate to="/superadmin" replace />;
  if (usuario.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (usuario.role === 'FUNCIONARIA') return <Navigate to="/funcionaria" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/:salaoSlug" element={<ClientePage />} />
        <Route path="/:salaoSlug/comanda/:numero" element={<ComandaPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirecionamento por role */}
        <Route path="/" element={<RedirecionarPorRole />} />

        {/* Área da funcionária */}
        <Route
          path="/funcionaria"
          element={
            <RotaPrivada roles={['FUNCIONARIA']}>
              <FuncionariaPage />
            </RotaPrivada>
          }
        />

        {/* Área do admin/gerente */}
        <Route
          path="/admin/*"
          element={
            <RotaPrivada roles={['ADMIN']}>
              <AdminPage />
            </RotaPrivada>
          }
        />

        {/* Área do superadmin */}
        <Route
          path="/superadmin/*"
          element={
            <RotaPrivada roles={['SUPERADMIN']}>
              <SuperAdminPage />
            </RotaPrivada>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
