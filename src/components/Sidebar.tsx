import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  GitCommitHorizontal, 
  CheckSquare, 
  UserCheck, 
  FileSpreadsheet, 
  Lock,
  Sparkles,
  ShieldCheck,
  FolderKanban,
  LogOut,
  Video,
  ShoppingBag
} from 'lucide-react';
import { TeamMember, UserRole } from '../types';

export type NavTab = 'dashboard' | 'clients' | 'projects' | 'pipeline' | 'tasks' | 'team' | 'quotes' | 'content_manager' | 'store';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  currentUser: TeamMember;
  pendingTasksCount: number;
  quotesCount: number;
  projectsCount?: number;
  productsCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentRole,
  currentUser,
  pendingTasksCount,
  quotesCount,
  projectsCount = 0,
  productsCount = 0,
  onLogout,
}) => {
  const getNavItems = () => {
    if (currentRole === 'cliente') {
      return [
        {
          id: 'projects' as NavTab,
          label: 'Mi Proyecto y Avance',
          icon: FolderKanban,
          badge: 'Portal Cliente',
          badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        },
      ];
    }

    if (currentRole === 'colaborador') {
      return [
        {
          id: 'tasks' as NavTab,
          label: 'Mis Tareas Asignadas',
          icon: CheckSquare,
          badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'store' as NavTab,
          label: 'Tienda & Catálogo',
          icon: ShoppingBag,
          badge: productsCount ? `${productsCount}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'content_manager' as NavTab,
          label: 'Content Manager',
          icon: Video,
          badge: 'Tendencias',
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
      ];
    }

    if (currentRole === 'project_manager') {
      return [
        {
          id: 'dashboard' as NavTab,
          label: 'Panel General',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'projects' as NavTab,
          label: 'Proyectos y Tareas',
          icon: FolderKanban,
          badge: projectsCount > 0 ? `${projectsCount}` : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        },
        {
          id: 'store' as NavTab,
          label: 'Tienda de Productos',
          icon: ShoppingBag,
          badge: productsCount ? `${productsCount}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'tasks' as NavTab,
          label: 'Tareas y Asignaciones',
          icon: CheckSquare,
          badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        },
        {
          id: 'content_manager' as NavTab,
          label: 'Content Manager',
          icon: Video,
          badge: 'Viral',
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
        {
          id: 'clients' as NavTab,
          label: 'Clientes',
          icon: Building,
          badge: null,
        },
        {
          id: 'team' as NavTab,
          label: 'Equipo y Rendimiento',
          icon: UserCheck,
          badge: 'PM',
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
      ];
    }

    // Admin: Full access to all modules
    return [
      {
        id: 'dashboard' as NavTab,
        label: 'Panel General',
        icon: LayoutDashboard,
        badge: null,
      },
      {
        id: 'store' as NavTab,
        label: 'Tienda & Catálogo',
        icon: ShoppingBag,
        badge: productsCount ? `${productsCount}` : null,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      },
      {
        id: 'clients' as NavTab,
        label: 'Clientes',
        icon: Building,
        badge: null,
      },
      {
        id: 'content_manager' as NavTab,
        label: 'Content Manager',
        icon: Video,
        badge: 'Viral Trends',
        badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      },
      {
        id: 'projects' as NavTab,
        label: 'Proyectos y Tareas',
        icon: FolderKanban,
        badge: projectsCount > 0 ? `${projectsCount}` : null,
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      },
      {
        id: 'pipeline' as NavTab,
        label: 'Ventas (Pipeline)',
        icon: GitCommitHorizontal,
        badge: null,
      },
      {
        id: 'tasks' as NavTab,
        label: 'Tareas y Asignaciones',
        icon: CheckSquare,
        badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
        badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      },
      {
        id: 'team' as NavTab,
        label: 'Equipo y Rendimiento',
        icon: UserCheck,
        badge: 'En vivo',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      },
    ];
  };

  const mainNavItems = getNavItems();

  return (
    <aside className="w-full md:w-64 bg-[#160D42] border-b md:border-b-0 md:border-r border-[#2B1C75] flex flex-col shrink-0 text-white select-none">
      {/* Brand Header */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-[#2B1C75]/90">
        <div className="bg-white px-3 py-2 rounded-xl shadow-sm flex items-center justify-center w-full">
          <img
            src="/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png"
            alt="RAWI Marketing Digital"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

      {/* Nav List */}
      <div className="p-3 md:p-4 flex-1 flex md:flex-col overflow-x-auto md:overflow-y-auto space-x-1 md:space-x-0 md:space-y-1">
        <p className="hidden md:block text-[10px] uppercase font-bold text-indigo-300/60 mb-2 px-2 tracking-widest">
          Módulos
        </p>

        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#271871] text-[#00F5D4] border border-[#00F5D4]/40 shadow-xs'
                  : 'text-indigo-100/75 hover:text-white hover:bg-[#271871]/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00F5D4]' : 'text-indigo-300/80'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ml-2 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Only Section (Exclusive to Administrator) */}
        {currentRole === 'admin' && (
          <div className="pt-2 md:pt-6 md:mt-2 md:border-t border-[#2B1C75]/80">
            <p className="hidden md:block text-[10px] uppercase font-bold text-indigo-300/60 mb-2 px-2 tracking-widest">
              Exclusivo Admin
            </p>

            <button
              id="nav-item-quotes"
              onClick={() => onSelectTab('quotes')}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer w-full ${
                currentTab === 'quotes'
                  ? 'text-[#00F5D4] bg-[#271871] border border-[#00F5D4]/50 shadow-xs'
                  : 'text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className={`w-4 h-4 shrink-0 ${currentTab === 'quotes' ? 'text-[#00F5D4]' : 'text-amber-400'}`} />
                <span>Cotizaciones Privadas</span>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <span className="bg-[#00F5D4] text-[#160D42] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                  {`${quotesCount} DOCS`}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Bottom User / Subscription Footer */}
      <div className="hidden md:flex items-center space-x-3 p-3.5 border-t border-[#2B1C75] bg-[#120A38]/80">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-tight truncate">
            {currentUser.name}
          </p>
          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
            {currentRole === 'admin' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-semibold text-amber-300">Administrador</span>
              </>
            )}
            {currentRole === 'project_manager' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="font-semibold text-blue-300">Project Manager</span>
              </>
            )}
            {currentRole === 'colaborador' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-300">Colaborador</span>
              </>
            )}
            {currentRole === 'cliente' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="font-semibold text-purple-300">Cliente</span>
              </>
            )}
          </div>
        </div>
        {onLogout && (
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
