import { NavLink } from 'react-router-dom';
import { LayoutGrid, Box, CreditCard, TrendingUp, Sparkles } from 'lucide-react';

function BottomNav() {
  const menus = [
    { label: 'Inventory', path: '/inventory', icon: <Box size={20} /> },
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutGrid size={20} /> },
    { label: 'Transactions', path: '/transactions', icon: <CreditCard size={20} /> },
    { label: 'Analytics', path: '/analytics', icon: <TrendingUp size={20} /> },
    { label: 'AI Agents', path: '/ai-agents', icon: <Sparkles size={20} /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-50 pb-safe px-2 py-2">
      <div className="flex items-center justify-between gap-1">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-black text-white' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'text-[#C6F25E]' : ''} mb-1`}>
                  {menu.icon}
                </div>
                <span className={`text-[9px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {menu.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;