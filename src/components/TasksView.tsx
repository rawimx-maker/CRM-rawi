import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  User, 
  CheckCircle2, 
  Building, 
  Sliders, 
  X,
  Trash2,
  Filter
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TeamMember, Client, UserRole } from '../types';

interface TasksViewProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  clients: Client[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
  urgent: { label: 'Urgente', badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  high: { label: 'Alta', badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  medium: { label: 'Media', badge: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  low: { label: 'Baja', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  teamMembers,
  clients,
  currentRole,
  currentUser,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState<string>('');
  const [formAssignedTo, setFormAssignedTo] = useState<string>(currentUser.id);
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const linkedClient = clients.find(c => c.id === formClientId);

    onAddTask({
      title: formTitle.trim(),
      description: formDescription.trim(),
      clientId: formClientId || undefined,
      clientName: linkedClient ? linkedClient.company : undefined,
      assignedToId: formAssignedTo,
      priority: formPriority,
      status: 'pending',
      progress: 0,
      dueDate: formDueDate,
    });

    setIsModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    setFormClientId('');
  };

  const handleUpdateProgress = (task: Task, newProgress: number) => {
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    let newStatus = task.status;
    let completedAt = task.completedAt;

    if (clampedProgress === 100) {
      newStatus = 'completed';
      completedAt = new Date().toISOString().split('T')[0];
    } else if (task.status === 'completed' && clampedProgress < 100) {
      newStatus = 'in_progress';
      completedAt = undefined;
    } else if (clampedProgress > 0 && task.status === 'pending') {
      newStatus = 'in_progress';
    }

    onUpdateTask({
      ...task,
      progress: clampedProgress,
      status: newStatus,
      completedAt,
    });
  };

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    let newProgress = task.progress;
    let completedAt = task.completedAt;

    if (newStatus === 'completed') {
      newProgress = 100;
      completedAt = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'pending') {
      newProgress = 0;
      completedAt = undefined;
    } else if (newStatus === 'in_progress' && task.progress === 100) {
      newProgress = 50;
      completedAt = undefined;
    }

    onUpdateTask({
      ...task,
      status: newStatus,
      progress: newProgress,
      completedAt,
    });
  };

  const isColaborador = currentRole === 'colaborador';
  const canCreateTask = currentRole === 'admin' || currentRole === 'project_manager';

  // Base accessible tasks according to role
  const accessibleTasks = isColaborador
    ? tasks.filter(t => t.assignedToId === currentUser.id)
    : tasks;

  // Filter tasks
  const filteredTasks = accessibleTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.clientName && task.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAssignee = isColaborador 
      ? true 
      : (assigneeFilter === 'all' || task.assignedToId === assigneeFilter);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesAssignee && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isColaborador ? 'Mis Tareas y Asignaciones' : 'Gestión y Asignación de Tareas'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isColaborador 
              ? 'Área exclusiva de trabajo individual. Gestiona el progreso y estado de tus responsabilidades asignadas.'
              : 'Asigna responsabilidades al equipo y realiza seguimiento en tiempo real del progreso individual.'}
          </p>
        </div>

        {canCreateTask && (
          <button
            id="btn-assign-new-task"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Asignar Tarea</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex flex-col md:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isColaborador ? "Buscar entre mis tareas asignadas..." : "Buscar tareas o clientes vinculados..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {isColaborador ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Únicamente tus tareas ({accessibleTasks.length})</span>
              </div>
            ) : (
              <>
                {/* Quick button to view My Tasks */}
                <button
                  onClick={() => setAssigneeFilter(assigneeFilter === currentUser.id ? 'all' : currentUser.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    assigneeFilter === currentUser.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Solo Mis Tareas ({tasks.filter(t => t.assignedToId === currentUser.id).length})
                </button>

                {/* Assignee Filter Dropdown */}
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Todo el Equipo ({tasks.length})</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({tasks.filter(t => t.assignedToId === m.id).length})
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="pending">Pendientes</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completadas</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todas las Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-dashed border-slate-300">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No hay tareas que coincidan</p>
            <p className="text-xs text-slate-500 mt-1">Ajusta los filtros o asigna una nueva tarea al equipo.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const assignee = teamMembers.find(m => m.id === task.assignedToId);
            const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const isAssignedToMe = task.assignedToId === currentUser.id;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl p-3.5 border transition-all ${
                  task.status === 'completed'
                    ? 'border-slate-200/70 bg-slate-50/40 opacity-90'
                    : isAssignedToMe
                    ? 'border-blue-300 shadow-xs'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Task Content */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-bold text-sm text-slate-900 ${
                        task.status === 'completed' ? 'line-through text-slate-500' : ''
                      }`}>
                        {task.title}
                      </h3>

                      {/* Priority Badge */}
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.2 rounded-full border ${priorityInfo.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${priorityInfo.dot}`} />
                        {priorityInfo.label}
                      </span>

                      {/* Client Badge */}
                      {task.clientName && (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 text-slate-700">
                          <Building className="w-3 h-3 mr-1 text-slate-400" />
                          {task.clientName}
                        </span>
                      )}

                      {/* My Task Indicator */}
                      {isAssignedToMe && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-200/60">
                          Asignada a ti
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-500 pt-0.5">
                      <div className="flex items-center space-x-1.5">
                        {assignee && (
                          <>
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-300"
                            />
                            <span className="font-semibold text-slate-700 text-xs">
                              {assignee.name}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Vence: <strong className="text-slate-700">{task.dueDate}</strong></span>
                      </div>

                      {task.completedAt && (
                        <span className="text-emerald-600 font-bold text-[11px]">
                          ✓ Completada el {task.completedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Real-time Progress Controls & Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t lg:border-t-0 pt-2.5 lg:pt-0 shrink-0">
                    {/* Real-time Progress Bar & Quick Adjuster */}
                    <div className="w-full sm:w-52 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Avance en vivo:</span>
                        <span className="font-bold text-xs text-blue-600">
                          {task.progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
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

                      {/* Quick Progress Buttons (0%, 25%, 50%, 75%, 100%) */}
                      <div className="flex items-center justify-between pt-0.5">
                        {[0, 25, 50, 75, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleUpdateProgress(task, val)}
                            className={`text-[9px] px-1 py-0.2 rounded transition-colors font-bold cursor-pointer ${
                              task.progress === val
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status Selector */}
                    <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-between">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden focus:ring-1 ${
                          task.status === 'completed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : task.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completada</option>
                      </select>

                      {(currentRole === 'admin' || currentRole === 'project_manager') && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          title="Eliminar tarea"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Asignar Tarea */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Asignar Nueva Tarea a Miembro del Equipo
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Realizar demo de propuesta comercial a directiva"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instrucciones o Descripción Detallada
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Objetivos específicos, entregables esperados y consideraciones clave..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Miembro del Equipo Asignado *
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cliente Vinculado (Opcional)
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="">Sin cliente específico (Interna)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nivel de Prioridad
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="urgent">Urgente (Crítica)</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha Límite de Entrega
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-colors"
                >
                  Asignar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
