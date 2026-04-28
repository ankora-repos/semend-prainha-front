import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { Bell, Menu, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-surface-200/60 bg-white/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Left: Mobile Menu Trigger */}
      <button
        onClick={onMenuClick}
        className="rounded-xl p-2.5 text-surface-500 hover:bg-surface-100 hover:text-surface-900 focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block">
        {/* Espaço reservado para breadcrumbs ou título da página no futuro */}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-4 ml-auto">
        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notificacoes')}
          className="relative rounded-full p-2.5 text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Bell className="h-[22px] w-[22px]" />
          {unreadCount != null && unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-surface-200 hidden sm:block"></div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="group flex items-center gap-3 rounded-full md:rounded-xl p-1 md:pr-3 hover:bg-surface-100 transition-all focus-visible:ring-2 focus-visible:ring-primary-500 border border-transparent md:hover:border-surface-200"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100 group-hover:bg-primary-100 transition-colors">
              <span className="text-sm font-bold tracking-tight">
                {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || <UserIcon className="h-4 w-4" />}
              </span>
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-surface-900 leading-none">
                {user?.name?.split(' ').slice(0, 2).join(' ')}
              </span>
              <span className="text-xs font-medium text-surface-500 leading-none mt-1">
                {user?.role?.name || user?.sector?.name}
              </span>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-surface-400 group-hover:text-surface-600 transition-colors" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-surface-200/60 bg-white/95 backdrop-blur-xl p-1 shadow-xl ring-1 ring-black/5 origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-3 border-b border-surface-100 mb-1">
                <p className="text-sm font-bold text-surface-900 truncate">{user?.name}</p>
                <p className="text-xs text-surface-500 mt-0.5 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center rounded-md bg-surface-100 px-2 py-1 text-xs font-medium text-surface-600 ring-1 ring-inset ring-surface-200">
                  {user?.sector?.name}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
