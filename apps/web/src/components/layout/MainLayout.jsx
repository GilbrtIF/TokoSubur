import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      
      {/* 1. SIDEBAR (Hanya Desktop) */}
      <div className="hidden md:block fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar />
      </div>

      {/* 2. HEADER MOBILE (Hanya Mobile) */}
      <MobileHeader />

      {/* 3. KONTEN UTAMA */}
      {/* pt-16 (padding top untuk mobile header) & pb-24 (padding bottom untuk bottom nav) */}
      {/* md:ml-64 (margin kiri untuk desktop) & md:pt-8 md:pb-8 */}
      <main className="pt-20 pb-24 px-4 md:ml-64 md:pt-8 md:pb-8 md:px-8 h-screen overflow-y-auto">
        <Outlet />
      </main>

      {/* 4. BOTTOM NAV (Hanya Mobile) */}
      <BottomNav />
    </div>
  );
}

export default MainLayout;