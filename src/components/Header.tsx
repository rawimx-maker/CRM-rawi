import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  Users, 
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronDown,
  LogOut,
  FolderKanban,
  UserCheck,
  Building
} from 'lucide-react';
import { TeamMember, UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  onSelectUser: (user: TeamMember) => void;
  onResetData: () => void;
  activeTasksCount: number;
  onLogout: () => void;
}

const getRoleConfig = (role?: string) => {
  switch (role) {
    case 'admin':
      return {
        label: 'ADMINISTRADOR',
        shortLabel: 'ADMIN',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        icon: ShieldCheck,
        borderClass: 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/40 text-amber-200',
        desc: 'Acceso y control total de la plataforma',
      };
    case 'project_manager':
      return {
        label: 'PROJECT MANAGER',
        shortLabel: 'PM',
        badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
        icon: FolderKanban,
        borderClass: 'bg-sky-950/30 border-sky-500/40 hover:bg-sky-900/40 text-sky-200',
        desc: 'Encargado de crear proyectos y tareas',
      };
    case 'colaborador':
    case 'team_member':
      return {
        label: 'COLABORADOR',
        shortLabel: 'COLAB',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        icon: UserCheck,
        borderClass: 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-200',
        desc: 'Únicamente sus tareas asignadas',
      };
    case 'cliente':
      return {
        label: 'CLIENTE',
        shortLabel: 'CLIENTE',
        badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        icon: Building,
        borderClass: 'bg-purple-950/30 border-purple-500/40 hover:bg-purple-900/40 text-purple-200',
        desc: 'Progreso, materiales, observaciones y pagos',
      };
    default:
      return {
        label: 'COLABORADOR',
        shortLabel: 'COLAB',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        icon: UserCheck,
        borderClass: 'bg-emerald-950/30 border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-200',
        desc: 'Tareas asignadas y seguimiento',
      };
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  teamMembers,
  onSelectUser,
  onResetData,
  activeTasksCount,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const currentRoleCfg = getRoleConfig(currentRole);
  const CurrentRoleIcon = currentRoleCfg.icon;

  return (
    <header className="sticky top-0 z-30 bg-[#1B1152] border-b border-[#2E207A] text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png"
                alt="RAWI Marketing Digital"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white">RAWI CRM</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F5D4]/15 text-[#00F5D4] font-semibold border border-[#00F5D4]/30 uppercase tracking-wider">
                  Marketing Digital
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 hidden sm:block">RAWI: Marketing Digital • Coatzacoalcos, Ver</p>
            </div>
          </div>

          {/* Right Controls: Role Simulator / User Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* Realtime Live Sync Pill (from High Density Theme) */}
            <div className="hidden md:flex items-center space-x-2 bg-[#271871]/80 px-3 py-1.5 rounded-lg border border-[#3E2C9E]/80 text-xs shadow-2xs">
              <div className="w-2 h-2 bg-[#00F5D4] rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-indigo-100">Sincronizado en Tiempo Real</span>
            </div>

            {/* Quick tasks count */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#271871]/50 border border-[#3E2C9E]/60 text-xs text-indigo-200">
              <span className="font-semibold text-white">{activeTasksCount}</span>
              <span>tareas activas</span>
            </div>

            {/* Reset Data Button */}
            <button
              id="reset-demo-data-btn"
              onClick={onResetData}
              title="Restablecer datos de prueba a los valores predeterminados"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden lg:inline text-xs">Reiniciar datos</span>
            </button>

            {/* User & Role Switcher */}
            <div className="relative">
              <button
                id="user-profile-menu-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center space-x-3 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${currentRoleCfg.borderClass}`}
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-700"
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {currentUser.name}
                    </span>
                    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded ${currentRoleCfg.badgeClass}`}>
                      <CurrentRoleIcon className="w-2.5 h-2.5 mr-0.5" /> {currentRoleCfg.shortLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                    {currentUser.position}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-xl shadow-2xl border border-slate-700/80 py-2 z-50 text-sm">
                    <div className="px-3.5 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Cambiar Cargo / Rol Activo
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Selecciona un usuario para validar las reglas de permisos en tiempo real.
                      </p>
                    </div>

                    <div className="py-1">
                      {teamMembers.map((member) => {
                        const isSelected = member.id === currentUser.id;
                        const cfg = getRoleConfig(member.role);
                        const Icon = cfg.icon;

                        return (
                          <button
                            key={member.id}
                            id={`select-user-${member.id}`}
                            onClick={() => {
                              onSelectUser(member);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center space-x-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/20 text-blue-300'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs truncate text-white">
                                  {member.name}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 shrink-0 ${cfg.badgeClass}`}>
                                  {cfg.shortLabel}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {member.position}
                              </span>
                              <span className="text-[9px] text-slate-500 block truncate mt-0.5">
                                {cfg.desc}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="px-3.5 py-2.5 border-t border-slate-800 bg-slate-950/60 mt-1">
                      <div className="space-y-1 text-[10px] text-slate-400 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                          <span><strong>Admin:</strong> Gestión y libertad total.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FolderKanban className="w-3 h-3 text-sky-400 shrink-0" />
                          <span><strong>Project Manager:</strong> Crear proyectos y tareas.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span><strong>Colaborador:</strong> Únicamente sus tareas asignadas.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-purple-400 shrink-0" />
                          <span><strong>Cliente:</strong> Progreso, materiales, observaciones y pagos.</span>
                        </div>
                      </div>

                      <button
                        id="dropdown-logout-button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/30 flex items-center justify-center space-x-2 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Logout Button */}
            <button
              id="header-quick-logout-btn"
              onClick={onLogout}
              title="Cerrar Sesión y salir al login"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-rose-900/50 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline text-xs">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
