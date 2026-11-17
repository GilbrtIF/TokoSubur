import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginInput from "../components/LoginInput";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin({ username, password }) {
    setSubmitting(true);
    setErrorMessage('');

    // SIMULASI MOCK API
    setTimeout(() => {
      if (username === 'admin' && password === 'password123') {
        const fakeToken = 'mock-jwt-token-xyz-123';
        
        login(fakeToken); // 1. Simpan token ke context
        navigate('/dashboard'); // 2. ✅ PERBAIKAN: Gunakan string URL, bukan komponen
        
      } else {
        setErrorMessage('Username atau password salah (Gunakan: admin / password123)');
        setSubmitting(false);
      }
    }, 1000);
  }

  return (
    // Background krem muda dan layout terpusat
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 font-sans">
      
      {/* Card Putih Utama */}
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Logo dan Judul */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#C6F25E] rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">SuburOnline</span>
        </div>

        {/* Teks Sambutan */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-sm text-gray-500">
            Sign in to access the SuburOnline Inventory System.
          </p>
        </div>
        
        {/* Komponen Form Input */}
        <LoginInput onLogin={handleLogin} submitting={submitting} />
        
        {/* Pesan Error */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center" role="alert">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;