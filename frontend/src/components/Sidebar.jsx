import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Users, User as UserIcon, GitBranch, Hand } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = ({ theme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { id: 'overview', label: t('sidebar.dashboard'), icon: LayoutGrid, path: '/dashboard' },
    { id: 'gestures', label: t('sidebar.actions'), icon: Hand, path: '/gestures' },
    { id: 'admin', label: t('sidebar.adminManagement'), icon: Users, path: '/admin-list' },
    { id: 'user', label: t('sidebar.userManagement'), icon: UserIcon, path: '/users' },
    { id: 'version', label: t('sidebar.version'), icon: GitBranch, path: '/version' },
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
        <LanguageSwitcher theme={theme} />
      </div>
    </aside>
  );
};

export default Sidebar;
