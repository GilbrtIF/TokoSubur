import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage'; 
import DashboardPage from '../src/pages/DashboardPage'; // Pastikan nama file ini benar
import MainLayout from '../src/components/layout/MainLayout'; 
import { useAuth } from '../src/hooks/useAuth'; // <-- IMPORT CUSTOM HOOK KITA

function AppSubur() {
  // Ambil status login dari AuthContext
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Route Login (Tanpa Sidebar) */}
      <Route 
        path="/login" 
        element={
          // Jika sudah login, lempar ke dashboard. Jika belum, tampilkan LoginPage
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      {/* Route Dashboard (Dengan Sidebar/MainLayout) */}
      {isAuthenticated && (
        <Route element={<MainLayout />}>
          <Route 
            path="/dashboard" 
            element={<DashboardPage />} 
          />
          {/* Tambahkan route lain di sini nantinya */}
        </Route>
      )}
      
      {/* Default route */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default AppSubur;