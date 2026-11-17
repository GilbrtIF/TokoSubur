import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function DashboardPage() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Kartu Sambutan */}
      <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        
        <div className="flex items-center justify-center w-16 h-16 bg-[#C6F25E] rounded-2xl mb-6">
          {/* Ikon Bunga/Subur */}
          <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Selamat Datang di SuburOnline!
        </h1>
        <p className="text-gray-500 mb-8 max-w-lg">
          Anda berhasil login ke sistem Inventory. Halaman ini adalah <em>placeholder</em> sementara untuk menguji coba Layout dan Routing.
        </p>

        {/* Kotak Info */}
        <div className="bg-[#FAF9F6] rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Status Akun</p>
            <p className="text-green-600 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Aktif
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Token Akses</p>
            <p className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded-md truncate max-w-[200px]">
              {/* ✅ PERBAIKAN: Tampilkan token dari context */}
              {token} 
            </p>
          </div>
        </div>

        {/* Tombol Logout */}
        <button 
          type="button" // ✅ PERBAIKAN: Tambahkan type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-full px-6 py-3 transition-colors"
        >
          Logout dari Sistem
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>

      </div>
    </div>
  );
}

// ✅ PERBAIKAN: Hapus DashboardPage.propTypes karena tidak ada props lagi
export default DashboardPage;