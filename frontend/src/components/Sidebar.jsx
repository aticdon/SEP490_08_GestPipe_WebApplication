// src/components/Sidebar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Hand, UserCog, User as UserIcon, Layers } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher'; 

const Sidebar = ({ theme, onLogout }) => { // Thêm onLogout (từ AdminLayout)
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { id: 'overview', label: t('sidebar.dashboard'), icon: LayoutGrid, path: '/dashboard' },
    // ===== THAY ĐỔI Ở ĐÂY =====
    { id: 'gestures', label: t('sidebar.gestureController', { defaultValue: 'Gesture Controller' }), icon: Hand, path: '/gestures' },
    // ========================
    { id: 'admin', label: t('sidebar.adminManagement'), icon: UserCog, path: '/admin-list' },
    { id: 'user', label: t('sidebar.userManagement'), icon: UserIcon, path: '/user-list' },
    { id: 'versions', label: t('sidebar.version'), icon: Layers, path: '/version-list' },
  ];

  return (
    <aside 
      className={`w-75 h-full flex flex-col flex-shrink-0
                 bg-black/30 backdrop-blur-lg 
                 border-r border-white/25 
                 transition-all duration-300 ease-in-out`}
    >
      <nav className="flex-1 pt-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path); 
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 px-6 py-3 rounded-lg 
                          transition-colors duration-200 ease-in-out ${ 
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold' 
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={25} />
              <span className="font-semibold text-base truncate">{item.label}</span> 
            </button>
          );
        })}
      </nav>

      <div className="pb-6 flex gap-3 justify-start px-11">
        <LanguageSwitcher theme="dark" /> 
      </div>

    </aside>
  );
};

export default Sidebar;