import React, { useState } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  Plus, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckSquare, 
  ChevronRight,
  X,
  Edit3,
  Trash2,
  FolderKanban,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  UserCog
} from 'lucide-react';
import { TeamMember, Task, Deal, Client, UserRole } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface TeamProgressViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  deals: Deal[];
  clients: Client[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  onUpdateTeamMember?: (member: TeamMember) => void;
  onDeleteTeamMember?: (memberId: string) => void;
}

const ROLE_OPTIONS: {
  value: UserRole;
  shortTag: string;
  label: string;
  description: string;
  badgeClass: string;
  activeCardClass: string;
  activeColor: string;
  defaultPassword: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'admin',
    shortTag: 'ADMIN',
    label: 'Administrador',
    description: 'Control total: usuarios, cotizaciones privadas, tienda, finanzas y CRM.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    activeCardClass: 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30',
    activeColor: 'amber',
    defaultPassword: 'admin123',
    icon: ShieldCheck,
  },
  {
    value: 'project_manager',
    shortTag: 'PM',
    label: 'Project Manager',
    description: 'Crea y gestiona proyectos, asigna tareas, ve clientes y rendimiento.',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    activeCardClass: 'bg-sky-50 border-sky-500 ring-2 ring-sky-400/30',
    activeColor: 'blue',
    defaultPassword: 'pm123',
    icon: FolderKanban,
  },
  {
    value: 'colaborador',
    shortTag: 'COLAB',
    label: 'Colaborador',
    description: 'Acceso a sus tareas asignadas, Tienda & Catálogo y Content Manager.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    activeCardClass: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30',
    activeColor: 'emerald',
    defaultPassword: 'equipo123',
    icon: UserCheck,
  },
  {
    value: 'cliente',
    shortTag: 'CLIENTE',
    label: 'Cliente',
    description: 'Portal de cliente: avance de proyecto, entregables, observaciones y pagos.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    activeCardClass: 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/30',
    activeColor: 'purple',
    defaultPassword: 'cliente123',
    icon: Building,
  },
];

const getRoleMeta = (role?: string) => {
  const normalized = role === 'team_member' ? 'colaborador' : role;
  return ROLE_OPTIONS.find((r) => r.value === normalized) || ROLE_OPTIONS[2];
};

export const TeamProgressView: React.FC<TeamProgressViewProps> = ({
  teamMembers,
  tasks,
  deals,
  clients,
  currentRole,
  currentUser,
  onAddTask,
  onUpdateTask,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || '');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [memberToast, setMemberToast] = useState<string | null>(null);

  // Assign Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Create / Edit User & Permissions Form
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPosition, setMemberPosition] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('colaborador');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberClientId, setMemberClientId] = useState('');
  const [showMemberPassword, setShowMemberPassword] = useState(false);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId) || teamMembers[0];
  const memberTasks = tasks.filter(t => t.assignedToId === selectedMember?.id);
  const memberDeals = deals.filter(d => d.assignedToId === selectedMember?.id && d.stage === 'won');
  const memberTotalWon = memberDeals.reduce((sum, d) => sum + d.value, 0);

  const completedCount = memberTasks.filter(t => t.status === 'completed').length;
  const inProgressCount = memberTasks.filter(t => t.status === 'in_progress').length;
  const pendingCount = memberTasks.filter(t => t.status === 'pending').length;

  const avgProgress = memberTasks.length > 0
    ? Math.round(memberTasks.reduce((sum, t) => sum + t.progress, 0) / memberTasks.length)
    : 0;

  const completionRate = memberTasks.length > 0
    ? Math.round((completedCount / memberTasks.length) * 100)
    : 0;

  const openAssignModalForMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setTaskTitle('');
    setTaskDesc('');
    setTaskClientId('');
    setIsAssignModalOpen(true);
  };

  const handleAssignTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedMember) return;

    const linkedClient = clients.find(c => c.id === taskClientId);

    onAddTask({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      clientId: taskClientId || undefined,
      clientName: linkedClient ? linkedClient.company : undefined,
      assignedToId: selectedMember.id,
      priority: taskPriority,
      status: 'pending',
      progress: 0,
      dueDate: taskDueDate,
    });

    setIsAssignModalOpen(false);
  };

  const showToast = (msg: string) => {
    setMemberToast(msg);
    setTimeout(() => setMemberToast(null), 3500);
  };

  const openNewMemberModal = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberEmail('');
    setMemberPosition('');
    setMemberPhone('');
    setMemberRole('colaborador');
    setMemberPassword('equipo123');
    setMemberClientId(clients[0]?.id || '');
    setShowMemberPassword(false);
    setMemberFormError(null);
    setConfirmDeleteId(null);
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = (member: TeamMember) => {
    const normalizedRole = ((member.role as string) === 'team_member' ? 'colaborador' : member.role) as UserRole;
    const roleMeta = getRoleMeta(normalizedRole);
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberPosition(member.position);
    setMemberPhone(member.phone || '');
    setMemberRole(normalizedRole);
    setMemberPassword(member.password || roleMeta.defaultPassword);
    setMemberClientId(member.clientId || clients[0]?.id || '');
    setShowMemberPassword(false);
    setMemberFormError(null);
    setConfirmDeleteId(null);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormError(null);

    if (!memberName.trim() || !memberEmail.trim()) {
      setMemberFormError('El nombre completo y el correo electrónico son obligatorios.');
      return;
    }

    const emailExists = teamMembers.some(
      (m) =>
        m.email.trim().toLowerCase() === memberEmail.trim().toLowerCase() &&
        m.id !== editingMember?.id
    );
    if (emailExists) {
      setMemberFormError('Ya existe otro usuario registrado con este correo electrónico.');
      return;
    }

    const roleMeta = getRoleMeta(memberRole);

    if (editingMember && onUpdateTeamMember) {
      const updatedMember: TeamMember = {
        ...editingMember,
        name: memberName.trim(),
        email: memberEmail.trim(),
        position: memberPosition.trim() || roleMeta.label,
        phone: memberPhone.trim(),
        role: memberRole,
        activeColor: roleMeta.activeColor,
        password: memberPassword.trim() || editingMember.password || roleMeta.defaultPassword,
        clientId: memberRole === 'cliente' ? memberClientId || undefined : undefined,
      };
      onUpdateTeamMember(updatedMember);
      showToast(`Información y permisos (${roleMeta.shortTag}) de ${updatedMember.name} actualizados.`);
    } else {
      onAddTeamMember({
        name: memberName.trim(),
        email: memberEmail.trim(),
        position: memberPosition.trim() || roleMeta.label,
        phone: memberPhone.trim() || '+52 55 0000 0000',
        role: memberRole,
        avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 90000000)}?w=150&auto=format&fit=crop&q=80`,
        activeColor: roleMeta.activeColor,
        password: memberPassword.trim() || roleMeta.defaultPassword,
        clientId: memberRole === 'cliente' ? memberClientId || undefined : undefined,
      });
      showToast(`Usuario ${memberName.trim()} creado con cargo ${roleMeta.shortTag}.`);
    }

    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleQuickRoleChange = (member: TeamMember, newRole: UserRole) => {
    if (!onUpdateTeamMember || currentRole !== 'admin') return;
    const roleMeta = getRoleMeta(newRole);
    const updated: TeamMember = {
      ...member,
      role: newRole,
      activeColor: roleMeta.activeColor,
      clientId: newRole === 'cliente' ? member.clientId || clients[0]?.id : undefined,
    };
    onUpdateTeamMember(updated);
    showToast(`Permisos de ${member.name} cambiados a ${roleMeta.label} (${roleMeta.shortTag}).`);
  };

  const handleConfirmDeleteMember = (member: TeamMember) => {
    if (!onDeleteTeamMember || member.id === currentUser.id) return;
    onDeleteTeamMember(member.id);
    if (selectedMemberId === member.id) {
      const remaining = teamMembers.find((m) => m.id !== member.id);
      if (remaining) setSelectedMemberId(remaining.id);
    }
    setIsMemberModalOpen(false);
    setEditingMember(null);
    setConfirmDeleteId(null);
    showToast(`Usuario ${member.name} eliminado del equipo.`);
  };

  const updateProgress = (task: Task, newProg: number) => {
    const prog = Math.max(0, Math.min(100, newProg));
    onUpdateTask({
      ...task,
      progress: prog,
      status: prog === 100 ? 'completed' : prog > 0 ? 'in_progress' : 'pending',
      completedAt: prog === 100 ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Feedback Toast */}
      {memberToast && (
        <div className="fixed bottom-5 right-5 z-60 bg-[#271871] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs border border-[#00F5D4]/60 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#00F5D4] shrink-0" />
          <span className="font-semibold">{memberToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Equipo, Usuarios y Rendimiento
            </h1>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentRole === 'admin'
              ? 'Gestiona usuarios, modifica su información, asigna permisos de cargo (Admin, PM, COLAB o Cliente) y supervisa el rendimiento.'
              : 'Métricas de avance, rendimiento individual y carga operativa de cada integrante del equipo.'}
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            id="btn-add-team-member"
            onClick={openNewMemberModal}
            className="px-3.5 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00F5D4]" />
            <span>Dar Acceso a Usuario</span>
          </button>
        )}
      </div>

      {/* Grid of Team Member Cards (Real-time snapshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {teamMembers.map((member) => {
          const isSelected = member.id === selectedMember?.id;
          const mTasks = tasks.filter(t => t.assignedToId === member.id);
          const mCompleted = mTasks.filter(t => t.status === 'completed').length;
          const mAvg = mTasks.length > 0 
            ? Math.round(mTasks.reduce((sum, t) => sum + t.progress, 0) / mTasks.length)
            : 0;
          const roleMeta = getRoleMeta(member.role);

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/60 border-[#271871] shadow-xs ring-2 ring-[#271871]/15'
                  : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 leading-tight truncate">
                        {member.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {member.position}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${roleMeta.badgeClass}`}>
                      {roleMeta.shortTag}
                    </span>
                    {currentRole === 'admin' && onUpdateTeamMember && (
                      <button
                        type="button"
                        id={`btn-edit-member-card-${member.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditMemberModal(member);
                        }}
                        title="Modificar información y permisos"
                        className="p-1 text-slate-400 hover:text-[#271871] hover:bg-indigo-100/70 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Metric */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Avance promedio:</span>
                    <span className="font-bold text-xs text-slate-900">{mAvg}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        mAvg >= 75 ? 'bg-emerald-500' : mAvg >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${mAvg}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="text-[11px]">{mCompleted} de {mTasks.length} tareas</span>
                <span className="text-[#271871] font-bold flex items-center text-[11px]">
                  Detalle <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member Detailed Inspector */}
      {selectedMember && (() => {
        const selectedRoleMeta = getRoleMeta(selectedMember.role);
        const linkedClient = selectedMember.clientId
          ? clients.find((c) => c.id === selectedMember.clientId)
          : null;

        return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          {/* Member Header and Quick KPI strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3.5">
              <img
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-200 shadow-2xs shrink-0"
              />
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedMember.name}
                  </h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${selectedRoleMeta.badgeClass}`}>
                    <ShieldCheck className="w-3 h-3" /> {selectedRoleMeta.label} ({selectedRoleMeta.shortTag})
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {selectedMember.position}
                  {linkedClient && (
                    <span className="text-purple-700 font-semibold"> • Cuenta Cliente: {linkedClient.company}</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedMember.email}
                  </span>
                  {selectedMember.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedMember.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons: Edit User/Permissions (Admin) + Assign Task */}
            <div className="flex flex-wrap items-center gap-2">
              {currentRole === 'admin' && onUpdateTeamMember && (
                <button
                  type="button"
                  id="btn-edit-selected-member"
                  onClick={() => openEditMemberModal(selectedMember)}
                  className="px-3.5 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <UserCog className="w-3.5 h-3.5 text-[#00F5D4]" />
                  <span>Editar Usuario y Permisos</span>
                </button>
              )}
              <button
                onClick={() => openAssignModalForMember(selectedMember.id)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Asignar Tarea a {selectedMember.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>

          {/* Admin Quick Role & Permission Switcher Bar */}
          {currentRole === 'admin' && onUpdateTeamMember && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#271871] text-[#00F5D4] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Permisos y Cargo del Usuario (Solo Admin)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedRoleMeta.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                {ROLE_OPTIONS.map((roleOpt) => {
                  const isCurrentRole = (selectedMember.role as string) === 'team_member'
                    ? roleOpt.value === 'colaborador'
                    : selectedMember.role === roleOpt.value;
                  return (
                    <button
                      key={roleOpt.value}
                      type="button"
                      id={`quick-role-${selectedMember.id}-${roleOpt.value}`}
                      onClick={() => handleQuickRoleChange(selectedMember, roleOpt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isCurrentRole
                          ? 'bg-[#271871] text-white border-[#271871] ring-2 ring-[#00F5D4]/60 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#271871]/50 hover:bg-indigo-50/40'
                      }`}
                      title={roleOpt.description}
                    >
                      <span>{roleOpt.shortTag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Performance Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tareas Asignadas
              </span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {memberTasks.length}
              </span>
              <span className="text-[10px] text-slate-400">Total histórico</span>
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/80 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Completadas
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                {completedCount}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {completionRate}% tasa de éxito
              </span>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200/80 text-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                En Progreso
              </span>
              <span className="text-lg font-bold text-blue-700 mt-0.5 block">
                {inProgressCount}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">
                {pendingCount} pendientes
              </span>
            </div>

            <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200/80 text-center">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                Ventas Ganadas
              </span>
              <span className="text-lg font-bold text-indigo-700 mt-0.5 block">
                {formatCurrency(memberTotalWon)}
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                {memberDeals.length} cerrados
              </span>
            </div>
          </div>

          {/* Member's Tasks List with Real-time Progress Adjustment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tareas Específicas Asignadas a {selectedMember.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Haz clic en los porcentajes para actualizar el progreso en tiempo real.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {memberTasks.length} tareas totales
              </span>
            </div>

            {memberTasks.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Este colaborador no tiene tareas pendientes</p>
                <button
                  onClick={() => openAssignModalForMember(selectedMember.id)}
                  className="mt-3 text-xs text-blue-600 hover:underline font-semibold"
                >
                  + Asignarle su primera tarea ahora
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {memberTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-xs text-slate-900 ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </span>

                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>

                        {task.clientName && (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {task.clientName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 max-w-2xl">
                        {task.description}
                      </p>

                      <div className="text-[11px] text-slate-400">
                        Fecha límite: <span className="text-slate-700 font-medium">{task.dueDate}</span>
                      </div>
                    </div>

                    {/* Interactive Real-Time Progress Bar & Quick Buttons */}
                    <div className="w-full md:w-64 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Progreso Individual:</span>
                        <span className="font-bold text-xs text-blue-600">{task.progress}%</span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            task.progress === 100
                              ? 'bg-emerald-500'
                              : task.progress >= 50
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>

                      {/* Quick click update for real-time progress tracking */}
                      <div className="flex items-center justify-between pt-1">
                        {[0, 25, 50, 75, 100].map((step) => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => updateProgress(task, step)}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                              task.progress === step
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {step}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Modal Asignar Tarea a Miembro */}
      {isAssignModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Asignar Tarea a {selectedMember.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedMember.position}</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej. Revisión y entrega de propuesta comercial"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción / Instrucciones
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Especifica claramente los entregables y objetivos..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cliente Vinculado (Opcional)
                  </label>
                  <select
                    value={taskClientId}
                    onChange={(e) => setTaskClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Sin cliente (Gestión interna)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha Límite
                </label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Asignar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Usuario y Permisos */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#120A38]/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Sticky Modal Header */}
            <div className="shrink-0 bg-[#271871] text-white px-5 py-4 border-b-2 border-[#00F5D4] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#160D42] border border-[#00F5D4]/40 text-[#00F5D4] flex items-center justify-center shrink-0">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {editingMember ? `Editar Usuario y Permisos: ${editingMember.name}` : 'Dar Acceso a Nuevo Usuario'}
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    Modifica los datos de perfil, contraseña y asigna permisos de cargo (Admin, PM, COLAB o Cliente).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-[#1B1152] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {memberFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{memberFormError}</span>
                </div>
              )}

              {editingMember?.id === currentUser.id && memberRole !== 'admin' && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Estás cambiando el cargo de tu propia sesión activa. Al guardar, la interfaz aplicará inmediatamente los permisos de <strong>{getRoleMeta(memberRole).label}</strong>.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    id="member-form-name"
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Ej. Sofía Morales"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cargo / Puesto Descriptivo *
                  </label>
                  <input
                    id="member-form-position"
                    type="text"
                    required
                    value={memberPosition}
                    onChange={(e) => setMemberPosition(e.target.value)}
                    placeholder="Ej. Project Manager & Cuentas Digitales"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo de Acceso *
                  </label>
                  <input
                    id="member-form-email"
                    type="email"
                    required
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="sofia@rawi.mx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    id="member-form-phone"
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    placeholder="9211193860"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="member-form-password"
                      type={showMemberPassword ? 'text' : 'password'}
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      placeholder="Ej. equipo123"
                      className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberPassword(!showMemberPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showMemberPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-Role Permission Selector */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold text-slate-800 text-xs">
                  Permisos y Cargo en el Sistema (Admin, PM, COLAB o Cliente) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLE_OPTIONS.map((opt) => {
                    const isActive = memberRole === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        id={`member-role-option-${opt.value}`}
                        onClick={() => setMemberRole(opt.value)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isActive
                            ? opt.activeCardClass
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${opt.badgeClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs">{opt.label}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${opt.badgeClass}`}>
                              {opt.shortTag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client Company Link when role === 'cliente' */}
              {memberRole === 'cliente' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                  <label className="block font-bold text-purple-950 text-xs">
                    Empresa / Cuenta de Cliente Vinculada
                  </label>
                  <select
                    id="member-form-client-id"
                    value={memberClientId}
                    onChange={(e) => setMemberClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-xl bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  >
                    <option value="">-- Seleccionar cuenta de cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-purple-800">
                    Al iniciar sesión con el cargo <strong>CLIENTE</strong>, este usuario verá únicamente los proyectos, entregables y pagos de esta cuenta.
                  </p>
                </div>
              )}

              {/* Modal Footer inside Form */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <div>
                  {editingMember && onDeleteTeamMember && editingMember.id !== currentUser.id && (
                    confirmDeleteId === editingMember.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDeleteMember(editingMember)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Confirmar eliminación
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(editingMember.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Usuario</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsMemberModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="btn-save-member-form"
                    className="px-4 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>{editingMember ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
