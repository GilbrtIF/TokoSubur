import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Sidebar Fixed di Kiri */}
      <Sidebar />
      
      {/* Konten Utama dengan Margin Kiri selebar Sidebar (w-64 = 16rem) */}
      <main className="ml-64 p-8 h-screen overflow-y-auto">
        <Outlet /> {/* DashboardPage akan muncul di sini */}
      </main>
    </div>
  );
}

export default MainLayout;