import { useState } from 'react'; // useEffect tidak dipakai lagi, kita hapus
import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage'; // Sesuaikan path
import DashboardPage from '../src/pages/Dashboard'; 
import MainLayout from '../src/components/layout/MainLayout'; // Import Layout

function AppSubur() {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });
  
  const navigate = useNavigate();

  const login = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    navigate('/dashboard'); 
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <Routes>
      {/* Route Login (Tanpa Sidebar) */}
      <Route 
        path="/login" 
        element={
          token ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={login} />
        } 
      />
      
      {/* Route Dashboard (Dengan Sidebar/MainLayout) */}
      {token && (
        <Route element={<MainLayout />}>
          <Route 
            path="/dashboard" 
            element={<DashboardPage onLogout={logout} />} 
          />
          {/* Anda bisa menambahkan route lain di sini nantinya, misal: */}
          {/* <Route path="/inventory" element={<InventoryPage />} /> */}
        </Route>
      )}
      
      {/* Default route */}
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default AppSubur;