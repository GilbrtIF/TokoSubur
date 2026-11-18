import { 
  LayoutGrid as GridIcon, 
  Box as BoxIcon, 
  CreditCard as CardIcon, 
  TrendingUp as ChartIcon, 
  Sparkles as SparklesIcon, 
  Settings as GearIcon 
} from 'lucide-react';

import SidebarItem from '../sidebar/SidebarItem';
import SidebarProfile from '../sidebar/SidebarProfile';


function Sidebar() {
  const menuGroups = [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: <GridIcon size={20} /> },
        { label: 'Inventory', path: '/inventory', icon: <BoxIcon size={20} /> },
        { label: 'Transactions', path: '/transactions', icon: <CardIcon size={20} /> },
        { label: 'Sales Analytics', path: '/analytics', icon: <ChartIcon size={20} /> },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { label: 'AI Agents', path: '/ai-agents', icon: <SparklesIcon size={20} /> },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col p-4 fixed left-0 top-0">
      
      {/* LOGO */}
      <div className="flex items-center gap-2 mb-8 px-2 mt-2">
        <div className="w-8 h-8 bg-[#C6F25E] rounded-lg flex items-center justify-center text-black">
          🌱 
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">SuburOnline</span>
      </div>

      {/* MENU UTAMA */}
      <div className="flex-1 overflow-y-auto">
        {menuGroups.map((group, index) => (
          <div key={index} className="mb-6">
            <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER (Settings & Profile) */}
      <div className="pt-2">
        <SidebarItem 
          label="Settings" 
          path="/settings" 
          icon={<GearIcon size={20} />} 
        />
        <SidebarProfile />
      </div>
    </aside>
  );
}

export default Sidebar;