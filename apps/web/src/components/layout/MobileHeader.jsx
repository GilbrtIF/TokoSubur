import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

function MobileHeader() {
  const { user } = useAuth();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-gray-100 z-50 px-4 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#C6F25E] rounded-lg flex items-center justify-center text-black font-bold">
          🌱
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">SuburOnline</span>
      </Link>

      {/* Kanan: Settings & Avatar */}
      <div className="flex items-center gap-4">
        <Link to="/settings" className="text-gray-500 hover:text-black">
          <Settings size={20} />
        </Link>
        <div className="w-8 h-8 bg-[#C6F25E] rounded-full flex items-center justify-center font-bold text-black text-sm">
          {initial}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;