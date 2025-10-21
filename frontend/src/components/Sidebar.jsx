import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, User as UserIcon, GitBranch, Hand } from 'lucide-react';
import VNFlag from '../assets/flags/vn.svg';
import GBFlag from '../assets/flags/gb.svg';

const Sidebar = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '/dashboard' },
    { id: 'gestures', label: 'Gestures Control', icon: Hand, path: '/gestures' },
    { id: 'admin', label: 'Admin', icon: Users, path: '/admin-list' },
    { id: 'user', label: 'User', icon: UserIcon, path: '/users' },
    { id: 'version', label: 'Version', icon: GitBranch, path: '/version' },
  ];

  return (
    <aside className={`w-72 h-full border-r transition-colors flex flex-col ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {/* Menu Items - start from top */}
      <nav className="flex-1 pt-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-8 py-4 transition-all ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-cyan-primary/20 text-cyan-400 border-l-4 border-cyan-primary'
                    : 'bg-cyan-100 text-cyan-700 border-l-4 border-cyan-500'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={22} />
              <span className="font-medium text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Language Selector with Flag Icons */}
      <div className={`pb-8 px-8 flex gap-3 justify-center border-t pt-6 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          title="Tiếng Việt"
        >
          <img src={VNFlag} alt="VN" className="w-6 h-6 rounded-sm" />
          <span className="font-medium">VN</span>
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
          title="English"
        >
          <img src={GBFlag} alt="EN" className="w-6 h-6 rounded-sm" />
          <span className="font-medium">EN</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
