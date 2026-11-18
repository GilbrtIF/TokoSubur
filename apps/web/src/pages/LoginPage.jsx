import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { loginService } from "../services/authService";
import LoginInput from "../components/auth/LoginInput";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin({ username, password }) {
    setSubmitting(true);
    setErrorMessage('');

    try {
      // Panggil simulasi API dari authService
      const response = await loginService({ username, password });
      
      // Jika sukses, simpan token & data user ke context
      login(response.accessToken, response.user); 
      
      // Arahkan ke dashboard
      navigate('/dashboard');
      
    } catch (error) {
      // Jika gagal, tampilkan pesan error dari service
      setErrorMessage(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 font-sans">
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
        
        {/* ✅ PERBAIKAN: Hanya kirim props yang dibutuhkan */}
        <LoginInput onLogin={handleLogin} submitting={submitting} />
        
        {/* Pesan Error */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center" role="alert">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Info Akun Dummy untuk Uji Coba */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-2">Akun untuk Uji Coba:</p>
          <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
            <span><strong>fauzi</strong> / fauzi123 (Owner)</span>
            <span><strong>istri</strong> / istri123 (Co-Owner)</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;