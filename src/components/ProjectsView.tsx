import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Building, 
  User as UserIcon, 
  MessageSquare, 
  Download, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Check, 
  FileText, 
  Paperclip, 
  Send, 
  RefreshCw, 
  CalendarCheck,
  Sparkles,
  Search,
  X,
  Layers,
  ArrowUpRight,
  DollarSign,
  CreditCard,
  Receipt
} from 'lucide-react';
import { 
  Project, 
  ProjectTask, 
  ProjectComment, 
  ProjectDownloadLink, 
  ProjectStatus, 
  Client, 
  TeamMember, 
  UserRole, 
  TaskPriority,
  ProjectPayment
} from '../types';
import { 
  signInWithGoogleCalendar, 
  signOutGoogleCalendar, 
  initCalendarAuth, 
  fetchGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  GoogleCalendarEvent 
} from '../utils/googleCalendar';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectClient?: (clientId: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  clients,
  teamMembers,
  currentRole,
  currentUser,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  // Role permissions
  const isCliente = currentRole === 'cliente';
  const isPM = currentRole === 'project_manager';
  const isAdmin = currentRole === 'admin';
  const canCreateProject = isAdmin || isPM;
  const canManageTasks = isAdmin || isPM;

  // Navigation tabs inside module
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'calendar'>('projects');

  // Selected project for detail drawer/modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => projects[0] || null);
  const [detailTab, setDetailTab] = useState<'tasks' | 'comments' | 'downloads' | 'overview' | 'payments'>('tasks');

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

  // New Comment state
  const [newCommentText, setNewCommentText] = useState('');

  // New Payment state
  const [payConcept, setPayConcept] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<ProjectPayment['method']>('Transferencia bancaria');
  const [payStatus, setPayStatus] = useState<ProjectPayment['status']>('completado');
  const [payReference, setPayReference] = useState('');
  const [payInvoiceUrl, setPayInvoiceUrl] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Google Calendar Integration State
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendarSyncSuccess, setCalendarSyncSuccess] = useState<string | null>(null);
  const [calendarSyncError, setCalendarSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Calendar View month navigation
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2025, 2, 1)); // Default March 2025

  // Form states for New Project
  const [newPrjCode, setNewPrjCode] = useState(`PRJ-2025-00${projects.length + 1}`);
  const [newPrjName, setNewPrjName] = useState('');
  const [newPrjDesc, setNewPrjDesc] = useState('');
  const [newPrjClientId, setNewPrjClientId] = useState(clients[0]?.id || '');
  const [newPrjStatus, setNewPrjStatus] = useState<ProjectStatus>('planning');
  const [newPrjPriority, setNewPrjPriority] = useState<TaskPriority>('medium');
  const [newPrjStartDate, setNewPrjStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPrjEndDate, setNewPrjEndDate] = useState('');
  const [newPrjBudget, setNewPrjBudget] = useState('');
  const [newPrjMembers, setNewPrjMembers] = useState<string[]>([currentUser.id]);

  // Form states for New Project Task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser.id);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  // Form states for New Download Link
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState<'deliverable' | 'contract' | 'asset' | 'doc' | 'other'>('deliverable');
  const [newLinkType, setNewLinkType] = useState('PDF');
  const [newLinkSize, setNewLinkSize] = useState('1.5 MB');
  const [newLinkDesc, setNewLinkDesc] = useState('');

  // Accessible projects according to role
  const accessibleProjects = useMemo(() => {
    if (isCliente) {
      return projects.filter(p => {
        const matchClientId = currentUser.clientId && p.clientId === currentUser.clientId;
        const matchEmail = currentUser.email && p.clientEmail && p.clientEmail.toLowerCase() === currentUser.email.toLowerCase();
        const matchName = currentUser.name && p.clientName && p.clientName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]);
        const isBeatrizDemo = currentUser.id === 'user-cliente-beatriz' && p.clientId === 'cli-1';
        return matchClientId || matchEmail || matchName || isBeatrizDemo;
      });
    }
    return projects;
  }, [projects, isCliente, currentUser]);

  // Keep selected project updated when accessible projects change
  useEffect(() => {
    if (accessibleProjects.length > 0) {
      if (!selectedProject || !accessibleProjects.some(p => p.id === selectedProject.id)) {
        setSelectedProject(accessibleProjects[0]);
      } else {
        const refreshed = accessibleProjects.find(p => p.id === selectedProject.id);
        if (refreshed) {
          setSelectedProject(refreshed);
        }
      }
    } else {
      setSelectedProject(null);
    }
  }, [accessibleProjects]);

  // Initialize Firebase Google Calendar listener
  useEffect(() => {
    const unsubscribe = initCalendarAuth((user, hasToken) => {
      if (user && hasToken) {
        setIsGoogleConnected(true);
        setGoogleUserEmail(user.email || 'Conectado');
        loadGoogleCalendarEvents();
      } else {
        setIsGoogleConnected(false);
        setGoogleUserEmail(null);
        setGoogleEvents([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadGoogleCalendarEvents = async () => {
    try {
      setIsSyncing(true);
      const events = await fetchGoogleCalendarEvents();
      setGoogleEvents(events);
      setCalendarSyncError(null);
    } catch (err: any) {
      console.warn('Error fetching calendar events:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogleCalendar = async (): Promise<boolean> => {
    try {
      setIsConnectingGoogle(true);
      setCalendarSyncError(null);
      const res = await signInWithGoogleCalendar();
      if (!res) {
        // User closed or cancelled the popup - no error needed
        return false;
      }
      const { user } = res;
      setIsGoogleConnected(true);
      setGoogleUserEmail(user.email || 'Conectado');
      setCalendarSyncSuccess('¡Google Calendar conectado exitosamente!');
      setTimeout(() => setCalendarSyncSuccess(null), 4000);
      await loadGoogleCalendarEvents();
      return true;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // User intentionally closed the popup
        return false;
      }
      setCalendarSyncError(err?.message || 'Error al conectar con Google Calendar');
      return false;
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOutGoogleCalendar();
    setIsGoogleConnected(false);
    setGoogleUserEmail(null);
    setGoogleEvents([]);
    setCalendarSyncSuccess('Google Calendar desconectado.');
    setTimeout(() => setCalendarSyncSuccess(null), 3000);
  };

  // Sync a project deadline to Google Calendar
  const handleSyncProjectToGoogle = async (project: Project) => {
    if (!isGoogleConnected) {
      const connected = await handleConnectGoogleCalendar();
      if (!connected) return;
    }

    try {
      setIsSyncing(true);
      setCalendarSyncError(null);

      const client = clients.find(c => c.id === project.clientId);
      const clientStr = client ? `${client.name} (${client.company})` : project.clientCompany;

      await createGoogleCalendarEvent({
        summary: `[Proyecto CRM] ${project.name}`,
        description: `Proyecto: ${project.name}\nCliente: ${clientStr}\nAlcance: ${project.description}\nTareas totales: ${project.tasks.length}\nEstado: ${project.status}`,
        startDate: project.startDate,
        endDate: project.endDate,
      });

      setCalendarSyncSuccess(`¡Proyecto "${project.name}" exportado a Google Calendar!`);
      setTimeout(() => setCalendarSyncSuccess(null), 4000);
      await loadGoogleCalendarEvents();
    } catch (err: any) {
      setCalendarSyncError(err.message || 'Error al sincronizar con Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync individual project task to Google Calendar
  const handleSyncTaskToGoogle = async (project: Project, task: ProjectTask) => {
    if (!isGoogleConnected) {
      const connected = await handleConnectGoogleCalendar();
      if (!connected) return;
    }

    try {
      setIsSyncing(true);
      setCalendarSyncError(null);

      await createGoogleCalendarEvent({
        summary: `[Tarea] ${task.title} - ${project.clientCompany}`,
        description: `Proyecto: ${project.name}\nDetalle: ${task.description || 'Sin notas adicionales'}\nProgreso: ${task.progress}%\nPrioridad: ${task.priority}`,
        startDate: task.dueDate,
        endDate: task.dueDate,
      });

      setCalendarSyncSuccess(`Tarea "${task.title}" añadida a tu Google Calendar`);
      setTimeout(() => setCalendarSyncSuccess(null), 4000);
      await loadGoogleCalendarEvents();
    } catch (err: any) {
      setCalendarSyncError(err.message || 'Error al exportar tarea');
    } finally {
      setIsSyncing(false);
    }
  };

  // Project progress calculation
  const getProjectProgress = (prj: Project) => {
    if (prj.tasks.length === 0) return 0;
    const sum = prj.tasks.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(sum / prj.tasks.length);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return accessibleProjects.filter(p => {
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchClient = isCliente ? true : (clientFilter === 'all' || p.clientId === clientFilter);
      const matchSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchClient && matchSearch;
    });
  }, [accessibleProjects, statusFilter, clientFilter, searchQuery, isCliente]);

  // Handle Add Project
  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrjName.trim() || !newPrjClientId) return;

    const selectedCli = clients.find(c => c.id === newPrjClientId);
    if (!selectedCli) return;

    const newProject: Omit<Project, 'id' | 'createdAt'> = {
      code: newPrjCode || `PRJ-${Date.now().toString().slice(-4)}`,
      name: newPrjName.trim(),
      description: newPrjDesc.trim(),
      clientId: selectedCli.id,
      clientName: selectedCli.name,
      clientCompany: selectedCli.company,
      status: newPrjStatus,
      priority: newPrjPriority,
      startDate: newPrjStartDate || new Date().toISOString().split('T')[0],
      endDate: newPrjEndDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      budget: newPrjBudget ? parseFloat(newPrjBudget) : undefined,
      assignedMemberIds: newPrjMembers.length > 0 ? newPrjMembers : [currentUser.id],
      tasks: [],
      comments: [
        {
          id: `pc-${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          authorRole: currentUser.role,
          content: `Proyecto creado para el cliente ${selectedCli.company}.`,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        }
      ],
      downloadLinks: [],
    };

    onAddProject(newProject);
    setIsNewProjectModalOpen(false);
    // Reset form
    setNewPrjName('');
    setNewPrjDesc('');
    setNewPrjBudget('');
    setNewPrjCode(`PRJ-2025-00${projects.length + 2}`);
  };

  // Toggle task complete / progress in selected project
  const handleToggleTaskStatus = (task: ProjectTask) => {
    if (isCliente) return; // Cliente únicamente podrá ver el progreso del trabajo encargado
    if (!selectedProject) return;
    const isNowCompleted = task.status !== 'completed';
    const updatedTasks = selectedProject.tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: isNowCompleted ? ('completed' as const) : ('in_progress' as const),
          progress: isNowCompleted ? 100 : 50,
          completedAt: isNowCompleted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return t;
    });

    const allCompleted = updatedTasks.every(t => t.status === 'completed');
    const updatedPrj: Project = {
      ...selectedProject,
      status: allCompleted ? 'completed' : selectedProject.status,
      tasks: updatedTasks,
    };

    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
  };

  // Add Task to selected project
  const handleAddTaskToProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `pt-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      assignedToId: newTaskAssignee,
      status: 'pending',
      priority: newTaskPriority,
      dueDate: newTaskDueDate || selectedProject.endDate,
      progress: 0,
    };

    const updatedPrj: Project = {
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask],
    };

    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
    setIsNewTaskModalOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  // Add Comment to selected project
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newCommentText.trim()) return;

    const newComment: ProjectComment = {
      id: `pc-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isClientObservation: currentUser.role === 'cliente',
    };

    const updatedPrj: Project = {
      ...selectedProject,
      comments: [...selectedProject.comments, newComment],
    };

    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
    setNewCommentText('');
  };

  // Add Payment to selected project
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !payConcept.trim() || !payAmount) return;

    const newPayment: ProjectPayment = {
      id: `pay-${Date.now()}`,
      projectId: selectedProject.id,
      concept: payConcept.trim(),
      amount: parseFloat(payAmount) || 0,
      date: payDate || new Date().toISOString().split('T')[0],
      method: payMethod,
      status: payStatus,
      reference: payReference.trim() || undefined,
      invoiceUrl: payInvoiceUrl.trim() || undefined,
      notes: payNotes.trim() || undefined,
    };

    const updatedPrj: Project = {
      ...selectedProject,
      payments: [...(selectedProject.payments || []), newPayment],
    };

    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
    setIsNewPaymentModalOpen(false);
    setPayConcept('');
    setPayAmount('');
    setPayReference('');
    setPayInvoiceUrl('');
    setPayNotes('');
  };

  // Delete Payment
  const handleDeletePayment = (paymentId: string) => {
    if (!selectedProject) return;
    const updatedPrj: Project = {
      ...selectedProject,
      payments: (selectedProject.payments || []).filter(p => p.id !== paymentId),
    };
    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
  };

  // Add Download Link to selected project
  const handleAddDownloadLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const newLink: ProjectDownloadLink = {
      id: `pdl-${Date.now()}`,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
      description: newLinkDesc.trim(),
      category: newLinkCategory,
      fileType: newLinkType.trim() || 'Documento',
      fileSize: newLinkSize.trim() || 'Enlace Web',
      addedAt: new Date().toISOString().split('T')[0],
      addedByName: currentUser.name,
    };

    const updatedPrj: Project = {
      ...selectedProject,
      downloadLinks: [...selectedProject.downloadLinks, newLink],
    };

    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
    setIsNewLinkModalOpen(false);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkDesc('');
  };

  // Delete Link
  const handleDeleteLink = (linkId: string) => {
    if (!selectedProject) return;
    const updatedPrj: Project = {
      ...selectedProject,
      downloadLinks: selectedProject.downloadLinks.filter(l => l.id !== linkId),
    };
    onUpdateProject(updatedPrj);
    setSelectedProject(updatedPrj);
  };

  // Status badge config
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'in_progress':
        return { label: 'En Progreso', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'planning':
        return { label: 'Planificación', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'review':
        return { label: 'En Revisión', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'completed':
        return { label: 'Completado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'on_hold':
        return { label: 'En Pausa', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: status, badge: 'bg-slate-100 text-slate-600' };
    }
  };

  // Calendar logic (days of month)
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const totalDays = daysInMonth(currentYear, currentMonth);
  // Shift Sunday (0) to end if using Monday-first, or keep standard 0-6
  const startingDay = firstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleTodayMonth = () => {
    setCalendarDate(new Date());
  };

  // Format currency
  const formatCurrency = (val?: number) => {
    if (!val) return '$0 MXN';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Toast feedback */}
      {calendarSyncSuccess && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 text-xs border border-emerald-500 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{calendarSyncSuccess}</span>
        </div>
      )}

      {calendarSyncError && (
        <div className="fixed bottom-5 right-5 z-50 bg-rose-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 text-xs border border-rose-500 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
          <span>{calendarSyncError}</span>
          <button onClick={() => setCalendarSyncError(null)} className="ml-2 text-rose-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-blue-600" />
              {isCliente ? 'Mi Proyecto y Entregables' : 'Gestión de Proyectos por Cliente'}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
              {accessibleProjects.length} {accessibleProjects.length === 1 ? 'Proyecto' : 'Proyectos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCliente 
              ? 'Seguimiento del progreso del trabajo encargado, aportación de materiales, observaciones y control de pagos realizados.'
              : 'Asignación de series de tareas por cliente, seguimiento de entregables, comentarios del equipo y conexión con Google Calendar.'}
          </p>
        </div>

        {/* Action buttons & View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setActiveSubTab('projects')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'projects'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Proyectos</span>
            </button>
            <button
              onClick={() => setActiveSubTab('calendar')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Calendario & Google</span>
              {isGoogleConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {canCreateProject && (
            <button
              id="btn-create-project"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Either Projects View or Calendar View */}
      {activeSubTab === 'projects' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                Estado:
              </span>
              {(['all', 'in_progress', 'planning', 'review', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {st === 'all' ? 'Todos' : getStatusBadge(st as ProjectStatus).label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isCliente ? (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  <span>{selectedProject?.clientCompany || currentUser.name}</span>
                </span>
              ) : (
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todos los clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar proyecto o cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Master Detail Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left column: List of Project Cards */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-0.5">
              {filteredProjects.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300">
                  <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No hay proyectos coincidentes</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Crea un nuevo proyecto asignando cliente y tareas.</p>
                </div>
              ) : (
                filteredProjects.map((prj) => {
                  const isSelected = selectedProject?.id === prj.id;
                  const progress = getProjectProgress(prj);
                  const completedTasksCount = prj.tasks.filter(t => t.status === 'completed').length;
                  const statusInfo = getStatusBadge(prj.status);

                  return (
                    <div
                      key={prj.id}
                      onClick={() => setSelectedProject(prj)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded border border-blue-200">
                              {prj.code}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${statusInfo.badge}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-xs text-slate-900 mt-1 leading-snug truncate">
                            {prj.name}
                          </h3>
                        </div>

                        {prj.budget && (
                          <span className="text-xs font-extrabold text-slate-800 shrink-0">
                            {formatCurrency(prj.budget)}
                          </span>
                        )}
                      </div>

                      {/* Client info banner */}
                      <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-medium bg-slate-100/60 px-2 py-1 rounded">
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{prj.clientCompany}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 truncate">{prj.clientName}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Avance del Proyecto:</span>
                          <span className="font-extrabold text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer strip */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {completedTasksCount}/{prj.tasks.length} tareas
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            {prj.comments.length}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Download className="w-3 h-3 text-purple-500" />
                            {prj.downloadLinks.length}
                          </span>
                        </div>

                        <span className="font-bold text-blue-600 flex items-center text-[10px]">
                          Ver detalles <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right column: Selected Project Deep Workspace */}
            <div className="lg:col-span-7">
              {selectedProject ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
                  {/* Top Bar of Selected Project */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedProject.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedProject.status).badge}`}>
                          {getStatusBadge(selectedProject.status).label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Entrega: <span className="font-bold text-slate-700">{selectedProject.endDate}</span>
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 mt-1">
                        {selectedProject.name}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedProject.description}
                      </p>
                    </div>

                    {/* Quick project controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSyncProjectToGoogle(selectedProject)}
                        title="Exportar fecha y datos a Google Calendar"
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Google Cal</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Deseas eliminar el proyecto "${selectedProject.name}"?`)) {
                              onDeleteProject(selectedProject.id);
                              setSelectedProject(null);
                            }
                          }}
                          title="Eliminar proyecto (Solo Administrador)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Client & Team Card Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Cliente Asignado
                      </span>
                      <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        <span>{selectedProject.clientCompany}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Contacto: <span className="font-semibold">{selectedProject.clientName}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Equipo Asignado ({selectedProject.assignedMemberIds.length})
                      </span>
                      <div className="mt-1 flex items-center space-x-1.5">
                        {selectedProject.assignedMemberIds.map((mId) => {
                          const member = teamMembers.find(m => m.id === mId);
                          if (!member) return null;
                          return (
                            <div key={member.id} className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                              <img src={member.avatar} alt={member.name} className="w-4 h-4 rounded-full object-cover" />
                              <span className="text-[10px] font-bold text-slate-700">{member.name.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Deep Project Tabs: Tareas | Comentarios | Links de Descargas | Pagos */}
                  <div className="border-b border-slate-200">
                    <div className="flex space-x-2 overflow-x-auto pb-0.5">
                      <button
                        onClick={() => setDetailTab('tasks')}
                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          detailTab === 'tasks'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Progreso y Tareas ({selectedProject.tasks.length})</span>
                      </button>

                      <button
                        onClick={() => setDetailTab('comments')}
                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          detailTab === 'comments'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Observaciones y Notas ({selectedProject.comments.length})</span>
                      </button>

                      <button
                        onClick={() => setDetailTab('downloads')}
                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          detailTab === 'downloads'
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Materiales y Enlaces ({selectedProject.downloadLinks.length})</span>
                      </button>

                      <button
                        onClick={() => setDetailTab('payments')}
                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          detailTab === 'payments'
                            ? 'border-emerald-600 text-emerald-700'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Historial de Pagos ({selectedProject.payments?.length || 0})</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: Serie de Tareas */}
                  {detailTab === 'tasks' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                          {isCliente 
                            ? 'Progreso en tiempo real de los entregables y tareas de tu proyecto:'
                            : `Lista de tareas para el cliente ${selectedProject.clientCompany}:`}
                        </p>
                        {canManageTasks && (
                          <button
                            onClick={() => setIsNewTaskModalOpen(true)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Agregar Tarea</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {selectedProject.tasks.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <p className="text-xs text-slate-500 font-medium">No hay tareas programadas para este proyecto.</p>
                            {canManageTasks && (
                              <button
                                onClick={() => setIsNewTaskModalOpen(true)}
                                className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                              >
                                + Crear la primera tarea
                              </button>
                            )}
                          </div>
                        ) : (
                          selectedProject.tasks.map((t) => {
                            const isDone = t.status === 'completed';
                            const assignee = teamMembers.find(m => m.id === t.assignedToId);

                            return (
                              <div
                                key={t.id}
                                className={`p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                                  isDone
                                    ? 'bg-slate-50/60 border-slate-200 opacity-80'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                                  {isCliente ? (
                                    <div
                                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                                        isDone
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 bg-slate-100 text-slate-400'
                                      }`}
                                      title={isDone ? 'Tarea completada' : 'En progreso'}
                                    >
                                      {isDone && <Check className="w-3 h-3" />}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleTaskStatus(t)}
                                      title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
                                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                                        isDone
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 hover:border-blue-500 bg-white'
                                      }`}
                                    >
                                      {isDone && <Check className="w-3 h-3" />}
                                    </button>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                        {t.title}
                                      </h4>
                                      {isCliente && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                          {isDone ? '100% Completado' : `${t.progress || 50}% Avance`}
                                        </span>
                                      )}
                                    </div>
                                    {t.description && (
                                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                        {t.description}
                                      </p>
                                    )}

                                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                                      {assignee && (
                                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                          <img src={assignee.avatar} alt={assignee.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                                          <span>{assignee.name.split(' ')[0]}</span>
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1 text-slate-500">
                                        <Clock className="w-3 h-3 text-slate-400" /> {t.dueDate}
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                                        t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                                        t.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {t.priority}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleSyncTaskToGoogle(selectedProject, t)}
                                    title="Sincronizar vencimiento con Google Calendar"
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  >
                                    <CalendarIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Comentarios & Observaciones del Cliente */}
                  {detailTab === 'comments' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                          Observaciones, requerimientos y retroalimentación para alimentar el proyecto:
                        </p>
                        {isCliente && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Escribe tus observaciones directas al equipo
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {selectedProject.comments.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-500 font-medium">Sin observaciones ni notas aún.</p>
                          </div>
                        ) : (
                          selectedProject.comments.map((comm) => (
                            <div 
                              key={comm.id} 
                              className={`p-2.5 rounded-lg border space-y-1 ${
                                comm.isClientObservation || comm.authorRole === 'cliente'
                                  ? 'bg-purple-50/50 border-purple-200'
                                  : 'bg-slate-50 border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <img src={comm.authorAvatar} alt={comm.authorName} className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200" />
                                  <span className="text-xs font-bold text-slate-900">{comm.authorName}</span>
                                  {comm.authorRole === 'admin' && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                      ADMIN
                                    </span>
                                  )}
                                  {comm.authorRole === 'project_manager' && (
                                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                      PM
                                    </span>
                                  )}
                                  {(comm.isClientObservation || comm.authorRole === 'cliente') && (
                                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded border border-purple-200">
                                      OBSERVACIÓN CLIENTE
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400">{comm.createdAt}</span>
                              </div>
                              <p className="text-xs text-slate-700 pl-7 leading-relaxed font-normal">
                                {comm.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input */}
                      <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <input
                          type="text"
                          placeholder={isCliente ? "Escribe una observación o requerimiento para alimentar el proyecto..." : "Escribe una actualización o respuesta para el cliente..."}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newCommentText.trim()}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isCliente ? 'Enviar Observación' : 'Publicar'}</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: Links de Descargas y Materiales del Cliente */}
                  {detailTab === 'downloads' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                          Entregables, materiales aportados, links y archivos de trabajo:
                        </p>
                        <button
                          onClick={() => setIsNewLinkModalOpen(true)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isCliente ? 'Aportar Material / Link' : 'Agregar Enlace'}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedProject.downloadLinks.length === 0 ? (
                          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Download className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-500 font-medium">No hay links ni materiales en este proyecto todavía.</p>
                            <button
                              onClick={() => setIsNewLinkModalOpen(true)}
                              className="mt-2 text-xs font-bold text-purple-600 hover:underline"
                            >
                              + Añadir primer enlace o material de descarga
                            </button>
                          </div>
                        ) : (
                          selectedProject.downloadLinks.map((link) => {
                            const canDeleteThisLink = isAdmin || link.addedByName === currentUser.name;
                            return (
                              <div
                                key={link.id}
                                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                              >
                                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-1.5">
                                      <h4 className="text-xs font-bold text-slate-900 truncate">
                                        {link.title}
                                      </h4>
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                        {link.category === 'material' ? 'Material Cliente' : (link.fileType || 'Archivo')}
                                      </span>
                                    </div>
                                    {link.description && (
                                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {link.description}
                                      </p>
                                    )}
                                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                      <span>{link.fileSize}</span>
                                      <span>•</span>
                                      <span>Aportado por {link.addedByName}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Descargar</span>
                                  </a>

                                  {canDeleteThisLink && (
                                    <button
                                      onClick={() => handleDeleteLink(link.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Historial de Pagos y Estado de Cuenta */}
                  {detailTab === 'payments' && (
                    <div className="space-y-4">
                      {/* Financial Metrics Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Inversión / Presupuesto
                          </span>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            ${(selectedProject.budget || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">MXN</span>
                          </p>
                          <span className="text-[10px] text-slate-500">Monto total acordado</span>
                        </div>

                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            Total Abonado / Pagado
                          </span>
                          <p className="text-lg font-bold text-emerald-700 mt-1">
                            ${(selectedProject.payments || [])
                              .filter(p => p.status === 'completado')
                              .reduce((acc, p) => acc + p.amount, 0)
                              .toLocaleString()} <span className="text-xs font-normal text-emerald-600">MXN</span>
                          </p>
                          <span className="text-[10px] text-emerald-600">Pagos verificados y recibidos</span>
                        </div>

                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                            Saldo Pendiente
                          </span>
                          <p className="text-lg font-bold text-blue-800 mt-1">
                            ${Math.max(0, (selectedProject.budget || 0) - (selectedProject.payments || [])
                              .filter(p => p.status === 'completado')
                              .reduce((acc, p) => acc + p.amount, 0)
                            ).toLocaleString()} <span className="text-xs font-normal text-blue-600">MXN</span>
                          </p>
                          <span className="text-[10px] text-blue-600">Por liquidar conforme entregables</span>
                        </div>
                      </div>

                      {/* Header and Add Button */}
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-slate-600 font-medium">
                          Registro de pagos y transacciones efectuadas para este proyecto:
                        </p>
                        {!isCliente && (
                          <button
                            onClick={() => setIsNewPaymentModalOpen(true)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Registrar Pago</span>
                          </button>
                        )}
                      </div>

                      {/* List of Payments */}
                      <div className="space-y-2.5">
                        {(!selectedProject.payments || selectedProject.payments.length === 0) ? (
                          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No hay pagos registrados aún</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isCliente 
                                ? 'Los comprobantes y pagos que realices se reflejarán aquí una vez verificados.'
                                : 'Haz clic en "Registrar Pago" para asentar un anticipo o liquidación.'}
                            </p>
                            {!isCliente && (
                              <button
                                onClick={() => setIsNewPaymentModalOpen(true)}
                                className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                              >
                                + Registrar el primer pago
                              </button>
                            )}
                          </div>
                        ) : (
                          selectedProject.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-2xs"
                            >
                              <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                  <DollarSign className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-xs font-bold text-slate-900">
                                      {payment.concept}
                                    </h4>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      payment.status === 'completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      payment.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {payment.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-400" /> {payment.date}
                                    </span>
                                    <span>•</span>
                                    <span>{payment.method}</span>
                                    {payment.reference && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono text-[10px] text-slate-600">Ref: {payment.reference}</span>
                                      </>
                                    )}
                                  </div>
                                  {payment.notes && (
                                    <p className="text-[11px] text-slate-500 mt-1 italic">
                                      {payment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <div className="text-right">
                                  <span className="text-sm font-bold text-slate-900 block">
                                    ${payment.amount.toLocaleString()} MXN
                                  </span>
                                  {payment.invoiceUrl && (
                                    <a
                                      href={payment.invoiceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      <Receipt className="w-3 h-3" /> Factura / Comprobante
                                    </a>
                                  )}
                                </div>

                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeletePayment(payment.id)}
                                    title="Eliminar registro de pago"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                  <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700">Selecciona un proyecto</p>
                  <p className="text-xs text-slate-400 mt-1">Elige un proyecto de la lista izquierda para gestionar sus tareas, comentarios y descargas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CALENDAR SUB-TAB: Interactive Google Calendar View */
        <div className="space-y-4">
          {/* Google Calendar Connection Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/10">
                <CalendarCheck className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white">
                    Integración con Google Calendar
                  </h3>
                  {isGoogleConnected ? (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.2 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Conectado en vivo
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.2 rounded-full border border-slate-700">
                      No conectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isGoogleConnected 
                    ? `Sincronizado con la cuenta ${googleUserEmail}. Los hitos de tus proyectos se reflejan en tu Google Calendar.`
                    : 'Conecta tu cuenta de Google para agendar reuniones con clientes y exportar las fechas límites de tus proyectos en un clic.'
                  }
                </p>
              </div>
            </div>

            {/* Official Google Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              {isGoogleConnected ? (
                <>
                  <button
                    onClick={loadGoogleCalendarEvents}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Actualizar Eventos</span>
                  </button>

                  <button
                    onClick={handleDisconnectGoogle}
                    className="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGoogleCalendar}
                  disabled={isConnectingGoogle}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.2 3.66-9.12z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.13C3.29 21.36 7.37 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.28C.46 8.2 0 10.04 0 12s.46 3.8 1.28 5.42l4-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.28 6.58l4 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                  </svg>
                  <span>{isConnectingGoogle ? 'Conectando...' : 'Conectar con Google Calendar'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Month Navigation & Sync Controls */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900 min-w-44 text-center">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleTodayMonth}
                className="ml-2 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Entrega de Proyecto
              </span>
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tarea de Proyecto
              </span>
              {isGoogleConnected && (
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Evento Google
                </span>
              )}
            </div>
          </div>

          {/* Month Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 text-center py-2">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {/* Empty leading days */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] p-1.5 bg-slate-50/40 border-b border-r border-slate-100" />
              ))}

              {/* Days of current month */}
              {Array.from({ length: totalDays }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                // Find projects with end date or start date on this day
                const dayProjects = projects.filter(p => p.endDate === dateStr || p.startDate === dateStr);
                
                // Find project tasks due on this day
                const dayTasks: { task: ProjectTask; project: Project }[] = [];
                projects.forEach(p => {
                  p.tasks.forEach(t => {
                    if (t.dueDate === dateStr) {
                      dayTasks.push({ task: t, project: p });
                    }
                  });
                });

                // Find Google Calendar events on this day
                const dayGoogleEvents = googleEvents.filter(ev => {
                  const evDate = ev.start?.date || ev.start?.dateTime?.split('T')[0];
                  return evDate === dateStr;
                });

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`min-h-[100px] p-1.5 border-b border-r border-slate-100 flex flex-col justify-between transition-colors hover:bg-blue-50/20 ${
                      isToday ? 'bg-blue-50/40 font-bold' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-blue-600 text-white font-bold' : 'text-slate-700'
                      }`}>
                        {dayNum}
                      </span>
                    </div>

                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {/* Project markers */}
                      {dayProjects.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProject(p);
                            setActiveSubTab('projects');
                          }}
                          title={`Proyecto: ${p.name} (${p.clientCompany})`}
                          className="px-1.5 py-0.5 rounded bg-blue-100/90 text-blue-900 border border-blue-200 text-[10px] font-bold truncate cursor-pointer hover:bg-blue-200 transition-colors"
                        >
                          📌 {p.name}
                        </div>
                      ))}

                      {/* Task markers */}
                      {dayTasks.map(({ task, project }) => (
                        <div
                          key={task.id}
                          onClick={() => {
                            setSelectedProject(project);
                            setActiveSubTab('projects');
                            setDetailTab('tasks');
                          }}
                          title={`Tarea: ${task.title} [${project.clientCompany}]`}
                          className="px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-200 text-[9px] font-semibold truncate cursor-pointer hover:bg-emerald-200 transition-colors"
                        >
                          ✓ {task.title}
                        </div>
                      ))}

                      {/* Google Event markers */}
                      {dayGoogleEvents.map(gev => (
                        <div
                          key={gev.id}
                          title={`Google Calendar: ${gev.summary}`}
                          className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-bold truncate"
                        >
                          📅 {gev.summary}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Proyecto */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Crear Nuevo Proyecto por Cliente</h3>
              </div>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProject} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Código</label>
                  <input
                    type="text"
                    required
                    value={newPrjCode}
                    onChange={(e) => setNewPrjCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Nombre del Proyecto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Implementación E-commerce B2B"
                    value={newPrjName}
                    onChange={(e) => setNewPrjName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cliente Vinculado *</label>
                <select
                  value={newPrjClientId}
                  onChange={(e) => setNewPrjClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company} — {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alcance y Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalla los entregables principales y objetivos del proyecto..."
                  value={newPrjDesc}
                  onChange={(e) => setNewPrjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={newPrjStartDate}
                    onChange={(e) => setNewPrjStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha Límite / Entrega</label>
                  <input
                    type="date"
                    value={newPrjEndDate}
                    onChange={(e) => setNewPrjEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={newPrjStatus}
                    onChange={(e) => setNewPrjStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="planning">Planificación</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="review">En Revisión</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prioridad</label>
                  <select
                    value={newPrjPriority}
                    onChange={(e) => setNewPrjPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Presupuesto ($)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newPrjBudget}
                    onChange={(e) => setNewPrjBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Colaboradores Asignados</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {teamMembers.map(m => {
                    const isSelected = newPrjMembers.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setNewPrjMembers(prev => prev.filter(id => id !== m.id));
                          } else {
                            setNewPrjMembers(prev => [...prev, m.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <img src={m.avatar} alt={m.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                        <span>{m.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Tarea de Proyecto */}
      {isNewTaskModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                Agregar Tarea a {selectedProject.name}
              </h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTaskToProject} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título de la Tarea *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Configurar base de datos y esquema de tablas"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción / Criterio de Aceptación</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre lo que se espera de esta tarea..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Asignar a</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prioridad</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Enlace de Descarga */}
      {isNewLinkModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                Agregar Link de Descarga / Entregable
              </h3>
              <button onClick={() => setIsNewLinkModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDownloadLink} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título del Enlace o Archivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manual Técnico de Implementación v1.0"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL de Descarga o Enlace Cloud *</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... o enlace de descarga"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={newLinkCategory}
                    onChange={(e) => setNewLinkCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="deliverable">Entregable</option>
                    <option value="contract">Contrato / Legal</option>
                    <option value="doc">Manual / Documento</option>
                    <option value="asset">Recursos / Diseños</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Archivo</label>
                  <input
                    type="text"
                    placeholder="PDF, ZIP, Figma, Drive"
                    value={newLinkType}
                    onChange={(e) => setNewLinkType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Peso o Tamaño</label>
                <input
                  type="text"
                  placeholder="Ej. 4.2 MB o Enlace Web"
                  value={newLinkSize}
                  onChange={(e) => setNewLinkSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="Notas para el cliente o equipo..."
                  value={newLinkDesc}
                  onChange={(e) => setNewLinkDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewLinkModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Guardar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Registro de Pago */}
      {isNewPaymentModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Registrar Pago o Abono
                </h3>
              </div>
              <button 
                onClick={() => setIsNewPaymentModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Concepto del Pago *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anticipo 50% de desarrollo, Hito 1, etc."
                  value={payConcept}
                  onChange={(e) => setPayConcept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monto ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="3500"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Método de Pago</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                    <option value="SPEI">SPEI</option>
                    <option value="Tarjeta de crédito / Débito">Tarjeta de crédito / Débito</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none"
                  >
                    <option value="completado">Completado / Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="facturado">Facturado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Referencia / Código de Rastreo</label>
                <input
                  type="text"
                  placeholder="Ej. SPEI-8921893 o Auth #10293"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Link de Factura / Recibo (opcional)</label>
                <input
                  type="url"
                  placeholder="https://... enlace al PDF de factura"
                  value={payInvoiceUrl}
                  onChange={(e) => setPayInvoiceUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas Internas</label>
                <input
                  type="text"
                  placeholder="Observaciones de pago, banco emisor..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
