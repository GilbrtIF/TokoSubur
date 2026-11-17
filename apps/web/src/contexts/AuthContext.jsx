import { createContext, useState } from 'react';
import PropTypes from 'prop-types';

// 1. Buat Context
export const AuthContext = createContext(null);

// 2. Buat Provider Component
export function AuthProvider({ children }) {
  // Lazy initialization: Ambil token dari localStorage saat pertama kali load
  const [token, setToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });

  // Fungsi untuk login
  const login = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
  };

  // Fungsi untuk logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem('accessToken');
  };

  // Nilai yang akan dibagikan ke seluruh aplikasi
  const authValue = {
    token,
    isAuthenticated: !!token, // Mengubah string token menjadi boolean (true/false)
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};