import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, Navigate  } from 'react-router-dom';
import LoginPage from './pages/LoginPage'; // Sesuaikan path-nya

function AppSubur() {
  // ✅ PERBAIKAN 1: Lazy Initialization (Mengatasi error cascading renders)
  // State langsung membaca dari localStorage saat pertama kali dirender
  const [token, setToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });
  
  const navigate = useNavigate();

  const login = (accessToken) => {
    // 1. Simpan token ke state dan localStorage
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
    
    // 2. Arahkan ke halaman dashboard
    navigate('/dashboard');
  };

  const logout = () => {
    // Hapus token dari state dan localStorage
    setToken(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <Routes>
      {/* Route untuk halaman Login */}
      <Route 
        path="/login" 
        element={
          token ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={login} />
        } 
      />
      
      {/* Route untuk halaman Dashboard (Protected Route) */}
      <Route 
        path="/dashboard" 
        element={
          token ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Selamat Datang di OpenJob!</h1>
              <p>Anda berhasil login.</p>
              <p style={{ fontSize: '12px', color: 'gray' }}>Token Anda: {token}</p>
              <button onClick={logout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          ) : (
            // ✅ PERBAIKAN 2: Gunakan <Navigate> agar URL berubah ke /login
            // Daripada me-render <LoginPage> di dalam /dashboard
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Default route: Redirect ke /login jika mengakses path sembarang */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppSubur;