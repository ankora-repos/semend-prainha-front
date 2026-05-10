import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  ClipboardList,
  Bell,
  ScrollText,
  FileDown,
  X,
  Globe,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  permission?: 'view' | 'edit' | 'send' | 'receive' | 'approve' | 'reject';
}

const mainNavItems: NavItem[] = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Protocolos', path: '/protocolos', icon: FileText },
  { label: 'Novo Protocolo', path: '/protocolos/novo', icon: Plus, permission: 'send' },
  { label: 'Notificações', path: '/notificacoes', icon: Bell },
];

const adminNavItems: NavItem[] = [
  { label: 'Usuários', path: '/usuarios', icon: Users, permission: 'edit' },
  { label: 'Setores', path: '/setores', icon: Building2, permission: 'edit' },
  { label: 'Perfis', path: '/perfis', icon: Shield, permission: 'edit' },
  { label: 'Tipos de Solicitação', path: '/tipos-solicitacao', icon: ClipboardList, permission: 'edit' },
  { label: 'Relatórios', path: '/relatorios', icon: FileDown, permission: 'edit' },
  { label: 'Auditoria', path: '/auditoria', icon: ScrollText, permission: 'edit' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { can, isSuperadmin } = useAuth();
  const { organization } = useOrganization();

  const filteredMainItems = mainNavItems.filter(
    (item) => !item.permission || can(item.permission),
  );
  const filteredAdminItems = adminNavItems.filter(
    (item) => !item.permission || can(item.permission),
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo Area */}
      <div className="flex h-[72px] items-center gap-3.5 px-6 border-b border-surface-100">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm shadow-md ring-1 ring-primary-900/10 shrink-0',
            !organization?.primaryColor && 'bg-gradient-to-br from-primary-500 to-primary-700',
          )}
          style={organization?.primaryColor ? { backgroundColor: organization.primaryColor } : undefined}
        >
          {organization?.name
            ? organization.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
            : 'SP'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-surface-900 leading-tight tracking-tight truncate">
            {organization?.name || 'Sistema'}
          </span>
          <span className="text-[13px] font-medium text-surface-500 leading-tight truncate">
            Protocolo
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin">
        <div className="space-y-1.5">
          {filteredMainItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 border',
                  isActive
                    ? 'bg-white shadow-sm border-surface-200 text-primary-600'
                    : 'border-transparent text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0 transition-colors" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {filteredAdminItems.length > 0 && (
          <div>
            <p className="mb-3 px-3.5 text-xs font-bold uppercase tracking-wider text-surface-400">
              Administração
            </p>
            <div className="space-y-1.5">
              {filteredAdminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 border',
                      isActive
                        ? 'bg-white shadow-sm border-surface-200 text-primary-600'
                        : 'border-transparent text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {isSuperadmin && (
          <div>
            <p className="mb-3 px-3.5 text-xs font-bold uppercase tracking-wider text-surface-400">
              Super Admin
            </p>
            <div className="space-y-1.5">
              {[
                { to: '/admin/organizacoes', label: 'Organizações', icon: Globe },
                { to: '/admin/superadmins', label: 'Super Admins', icon: ShieldCheck },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 border',
                      isActive
                        ? 'bg-white shadow-sm border-surface-200 text-primary-600'
                        : 'border-transparent text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0 transition-colors" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-surface-100 bg-surface-50/50">
        <p className="text-[11px] font-medium text-surface-400 text-center uppercase tracking-wider">
          {organization?.name || 'Sistema de Protocolo'} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={onClose}
      />

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] bg-surface-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-surface-400 hover:bg-surface-200 hover:text-surface-700 transition-colors ring-1 ring-surface-200 bg-surface-50"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[280px] lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-surface-200/60 lg:bg-surface-50/50">
        {sidebarContent}
      </aside>
    </>
  );
}
