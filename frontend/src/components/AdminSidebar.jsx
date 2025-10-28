import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Users, Settings, Home } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const pathToItem = {
  '/user-list': 'user',
};

const AdminSidebar = ({ theme, activeItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const resolvedActive = activeItem || pathToItem[location.pathname] || null;

  const menuItems = [
    {
      id: 'home',
      label: t('sidebar.home', {
        defaultValue: i18n.language.startsWith('vi') ? 'Trang chủ' : 'Home',
      }),
      icon: Home,
      path: '/user-list',
    },
    {
      id: 'gestures',
      label: t('userList.gesturesControl'),
      icon: Gamepad2,
    },
    {
      id: 'user',
      label: t('userList.user'),
      icon: Users,
      path: '/user-list',
    },
    {
      id: 'version',
      label: t('userList.version'),
      icon: Settings,
    },
  ];

  const getButtonClasses = (itemId, isActive) => {
    const base =
      'w-full flex items-center gap-4 px-8 py-4 rounded-xl transition-all font-medium text-base';

    if (itemId === 'home') {
      if (theme === 'dark') {
        return isActive
          ? `${base} bg-slate-200 text-slate-900`
          : `${base} bg-slate-900/40 text-slate-200 hover:bg-slate-800/60`;
      }
      return isActive
        ? `${base} bg-slate-800 text-white`
        : `${base} bg-white/70 text-slate-600 hover:bg-slate-200/80`;
    }

    if (theme === 'dark') {
      if (itemId === 'gestures') {
        return isActive
          ? `${base} bg-violet-500/40 text-white shadow-lg shadow-violet-500/30`
          : `${base} bg-slate-900/40 text-purple-200 hover:bg-slate-800/60`;
      }
      if (itemId === 'user') {
        return isActive
          ? `${base} bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/40`
          : `${base} bg-slate-900/40 text-cyan-200 hover:bg-slate-800/60`;
      }
      return isActive
        ? `${base} bg-slate-200 text-slate-900`
        : `${base} bg-slate-900/40 text-slate-300 hover:bg-slate-800/60`;
    }

    // Light theme variants
    if (itemId === 'gestures') {
      return isActive
        ? `${base} bg-violet-100 text-violet-700 shadow-md shadow-violet-200`
        : `${base} bg-white/70 text-violet-500 hover:bg-violet-100/80`;
    }
    if (itemId === 'user') {
      return isActive
        ? `${base} bg-cyan-500 text-white shadow-lg shadow-cyan-400/40`
        : `${base} bg-white/70 text-cyan-600 hover:bg-cyan-100/70`;
    }
    return isActive
      ? `${base} bg-slate-200 text-slate-900`
      : `${base} bg-white/70 text-slate-500 hover:bg-slate-200/80`;
  };

  const getIconClasses = (itemId, isActive) => {
    if (itemId === 'home') {
      if (theme === 'dark') {
        return isActive ? 'text-slate-900' : 'text-slate-200';
      }
      return isActive ? 'text-white' : 'text-slate-500';
    }
    if (itemId === 'gestures') {
      return isActive
        ? theme === 'dark'
          ? 'text-white'
          : 'text-violet-700'
        : theme === 'dark'
        ? 'text-purple-300'
        : 'text-violet-500';
    }
    if (itemId === 'user') {
      return isActive
        ? theme === 'dark'
          ? 'text-slate-900'
          : 'text-white'
        : theme === 'dark'
        ? 'text-cyan-300'
        : 'text-cyan-500';
    }
    return isActive
      ? theme === 'dark'
        ? 'text-slate-900'
        : 'text-slate-700'
      : theme === 'dark'
      ? 'text-slate-300'
      : 'text-slate-400';
  };

  const handleClick = (item) => {
    if (item.path) navigate(item.path);
  };

  return (
    <aside
      className={`w-72 flex-shrink-0 flex flex-col backdrop-blur-sm border-r ${
        theme === 'dark'
          ? 'bg-[#0b1020]/95 border-slate-900'
          : 'bg-slate-100/90 border-slate-200'
      }`}
    >
      <nav className="flex-1 pt-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = resolvedActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={getButtonClasses(item.id, isActive)}
            >
              <Icon size={22} className={getIconClasses(item.id, isActive)} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={`pb-8 px-8 flex justify-center border-t pt-6 ${
          theme === 'dark' ? 'border-slate-800/60' : 'border-slate-200'
        }`}
      >
        <LanguageSwitcher theme={theme} />
      </div>
    </aside>
  );
};

export default AdminSidebar;
