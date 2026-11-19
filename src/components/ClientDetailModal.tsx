import React, { useState } from 'react';
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Briefcase, 
  FileSpreadsheet, 
  GitCommitHorizontal, 
  TrendingUp, 
  FolderKanban, 
  Download, 
  ExternalLink, 
  Edit3, 
  ChevronRight, 
  Layers, 
  ShieldCheck,
  PlusCircle,
  FileText,
  UserCheck,
  CheckSquare,
  Video,
  Sparkles,
  Package,
  Target,
  Save,
  Check,
  Receipt,
  Trash2
} from 'lucide-react';
import { 
  Client, 
  Deal, 
  Quote, 
  Project, 
  Task, 
  TeamMember, 
  UserRole, 
  CompanyInfo,
  DealStage,
  QuoteStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  CatalogProduct
} from '../types';
import { formatCurrency, generateQuotePDF } from '../utils/pdfGenerator';
import { NavTab } from './Sidebar';
import { QuoteFormModal } from './QuoteFormModal';

interface ClientDetailModalProps {
  client: Client;
  allClients?: Client[];
  deals: Deal[];
  quotes: Quote[];
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  companyInfo: CompanyInfo;
  currentRole: UserRole;
  currentUser: TeamMember;
  catalogProducts?: CatalogProduct[];
  onClose: () => void;
  onEditClient: (client: Client) => void;
  onNavigate?: (tab: NavTab) => void;
  onUpdateClient?: (client: Client) => void;
  onSelectClientForContentManager?: (client: Client) => void;
  onAddQuote?: (quote: Omit<Quote, 'id'>) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

type DetailTab = 'overview' | 'brief' | 'quotes' | 'pipeline' | 'projects' | 'tasks';

const DEAL_STAGE_LABELS: Record<DealStage, { label: string; bg: string; text: string; step: number }> = {
  lead: { label: 'Prospecto / Lead', bg: 'bg-slate-100', text: 'text-slate-700', step: 1 },
  qualified: { label: 'Calificado', bg: 'bg-blue-100', text: 'text-blue-700', step: 2 },
  proposal: { label: 'Propuesta Enviada', bg: 'bg-purple-100', text: 'text-purple-700', step: 3 },
  negotiation: { label: 'En Negociación', bg: 'bg-amber-100', text: 'text-amber-800', step: 4 },
  won: { label: 'Ganado (Cierre)', bg: 'bg-emerald-100', text: 'text-emerald-800', step: 5 },
  lost: { label: 'Perdido', bg: 'bg-rose-100', text: 'text-rose-700', step: 0 },
};

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; badge: string }> = {
  draft: { label: 'Borrador', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  sent: { label: 'Enviada al Cliente', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  approved: { label: 'Aprobada / Firmada', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rechazada', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; badge: string }> = {
  planning: { label: 'Planificación', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_progress: { label: 'En Ejecución', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  review: { label: 'En Revisión', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Completado', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  on_hold: { label: 'En Pausa', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; badge: string }> = {
  pending: { label: 'Pendiente', badge: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'En Progreso', badge: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', badge: 'bg-emerald-100 text-emerald-700' },
};

const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'text-slate-600 bg-slate-100' },
  medium: { label: 'Media', color: 'text-blue-700 bg-blue-50' },
  high: { label: 'Alta', color: 'text-amber-700 bg-amber-50' },
  urgent: { label: 'Urgente', color: 'text-rose-700 bg-rose-50' },
};

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  allClients,
  deals,
  quotes,
  projects,
  tasks,
  teamMembers,
  companyInfo,
  currentRole,
  currentUser,
  catalogProducts = [],
  onClose,
  onEditClient,
  onNavigate,
  onUpdateClient,
  onSelectClientForContentManager,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [quoteActionToast, setQuoteActionToast] = useState<string | null>(null);

  // Client Business Context & Brief state
  const [briefIndustry, setBriefIndustry] = useState<string>(client.industry || '');
  const [briefServices, setBriefServices] = useState<string>(client.servicesAndProducts || '');
  const [briefContent, setBriefContent] = useState<string>(client.brief || '');
  const [briefAudience, setBriefAudience] = useState<string>(client.targetAudience || '');
  const [briefTone, setBriefTone] = useState<string>(client.brandTone || 'viral_divertido');
  const [briefGoal, setBriefGoal] = useState<string>(client.campaignGoal || 'leads_whatsapp');
  const [briefDifferentiator, setBriefDifferentiator] = useState<string>(client.differentiator || '');
  const [isEditingBrief, setIsEditingBrief] = useState<boolean>(false);
  const [briefSaveSuccess, setBriefSaveSuccess] = useState<boolean>(false);

  const handleSaveBrief = () => {
    const updated: Client = {
      ...client,
      industry: briefIndustry.trim(),
      servicesAndProducts: briefServices.trim(),
      brief: briefContent.trim(),
      targetAudience: briefAudience.trim(),
      brandTone: briefTone,
      campaignGoal: briefGoal,
      differentiator: briefDifferentiator.trim(),
    };
    if (onUpdateClient) {
      onUpdateClient(updated);
    }
    setIsEditingBrief(false);
    setBriefSaveSuccess(true);
    setTimeout(() => setBriefSaveSuccess(false), 3000);
  };

  const handleGoToContentManager = () => {
    if (onSelectClientForContentManager) {
      onSelectClientForContentManager(client);
    } else if (onNavigate) {
      onNavigate('content_manager');
    }
    onClose();
  };

  // Filter linked data for this specific client
  const clientDeals = deals.filter(
    (d) =>
      d.clientId === client.id ||
      d.clientCompany?.toLowerCase() === client.company.toLowerCase()
  );
  const primaryDeal = clientDeals[0] || null;

  const clientQuotes = quotes.filter(
    (q) =>
      q.clientId === client.id ||
      q.clientCompany?.toLowerCase() === client.company.toLowerCase()
  );

  const clientProjects = projects.filter(
    (p) =>
      p.clientId === client.id ||
      p.clientCompany?.toLowerCase() === client.company.toLowerCase()
  );

  const clientCRMTasks = tasks.filter(
    (t) =>
      t.clientId === client.id ||
      t.clientName?.toLowerCase().includes(client.company.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(client.name.toLowerCase())
  );

  // Extract project tasks from client projects to show complete task visibility
  const allProjectTasks = clientProjects.flatMap((prj) =>
    (prj.tasks || []).map((pt) => ({
      ...pt,
      isProjectTask: true,
      projectName: prj.name,
      projectCode: prj.code,
    }))
  );

  const assignedMember = teamMembers.find((m) => m.id === client.assignedToId);

  // Summary Metrics
  const totalQuoted = clientQuotes.reduce((acc, q) => acc + q.total, 0);
  const totalApprovedQuotes = clientQuotes.filter((q) => q.status === 'approved').reduce((acc, q) => acc + q.total, 0);
  const activeProjectsCount = clientProjects.filter((p) => p.status === 'in_progress' || p.status === 'planning' || p.status === 'review').length;
  const pendingTasksTotal = clientCRMTasks.filter((t) => t.status !== 'completed').length + 
    allProjectTasks.filter((t) => t.status !== 'completed').length;
  const completedTasksTotal = clientCRMTasks.filter((t) => t.status === 'completed').length + 
    allProjectTasks.filter((t) => t.status === 'completed').length;

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      await generateQuotePDF(quote, companyInfo);
      setQuoteActionToast(`PDF oficial de ${quote.code} descargado correctamente.`);
      setTimeout(() => setQuoteActionToast(null), 3500);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const handleOpenEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsQuoteModalOpen(true);
  };

  const handleOpenNewQuote = () => {
    setEditingQuote(null);
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuoteFromModal = (
    quoteData: Omit<Quote, 'id'>,
    existingId?: string,
    andDownloadPdf: boolean = false
  ) => {
    if (existingId && onUpdateQuote) {
      const updatedQuote: Quote = {
        ...quoteData,
        id: existingId,
      };
      onUpdateQuote(updatedQuote);
      setQuoteActionToast(`Cotización ${updatedQuote.code} actualizada con éxito.`);
      setTimeout(() => setQuoteActionToast(null), 3500);
      if (andDownloadPdf) {
        handleDownloadPDF(updatedQuote);
      }
    } else if (onAddQuote) {
      const newQuotePreview: Quote = {
        ...quoteData,
        id: `quote-${Date.now()}`,
      };
      onAddQuote(quoteData);
      setQuoteActionToast(`Cotización ${quoteData.code} creada para ${client.company}.`);
      setTimeout(() => setQuoteActionToast(null), 3500);
      if (andDownloadPdf) {
        handleDownloadPDF(newQuotePreview);
      }
    }
    setIsQuoteModalOpen(false);
    setEditingQuote(null);
  };

  const handleConfirmDeleteQuote = () => {
    if (!quoteToDelete || !onDeleteQuote) return;
    onDeleteQuote(quoteToDelete.id);
    if (selectedQuoteDetail === quoteToDelete.id) {
      setSelectedQuoteDetail(null);
    }
    setQuoteActionToast(`Cotización ${quoteToDelete.code} eliminada.`);
    setTimeout(() => setQuoteActionToast(null), 3500);
    setQuoteToDelete(null);
  };

  const handleGoTo = (tab: NavTab) => {
    if (onNavigate) {
      onNavigate(tab);
      onClose();
    }
  };

  const totalTasksCount = clientCRMTasks.length + allProjectTasks.length;

  const navOptions: {
    id: DetailTab;
    label: string;
    subtitle: string;
    badge?: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'overview',
      label: 'Resumen Integral',
      subtitle: 'Vista ejecutiva 360°',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'brief',
      label: 'Contexto & Brief',
      subtitle: client.industry ? client.industry : 'Brief de marca',
      badge: client.brief ? 'Listo' : 'Pendiente',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'quotes',
      label: 'Cotizaciones',
      subtitle: totalQuoted > 0 ? formatCurrency(totalQuoted) : 'Sin propuestas',
      badge: `${clientQuotes.length}`,
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'pipeline',
      label: 'Embudo de Ventas',
      subtitle: primaryDeal ? DEAL_STAGE_LABELS[primaryDeal.stage]?.label : 'Sin trato activo',
      badge: primaryDeal ? `${primaryDeal.probability}%` : undefined,
      icon: <GitCommitHorizontal className="w-4 h-4" />,
    },
    {
      id: 'projects',
      label: 'Proyectos',
      subtitle: activeProjectsCount > 0 ? `${activeProjectsCount} en ejecución` : 'Estado operativo',
      badge: `${clientProjects.length}`,
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      id: 'tasks',
      label: 'Tareas Creadas',
      subtitle: `${pendingTasksTotal} pend. • ${completedTasksTotal} fin.`,
      badge: `${totalTasksCount}`,
      icon: <CheckSquare className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#120A38]/75 backdrop-blur-xs overflow-hidden">
      <div 
        id="client-detail-modal"
        className="bg-white w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in duration-200"
      >
        {/* Modal Top Header */}
        <div className="shrink-0 bg-[#271871] text-white px-4 sm:px-6 py-3.5 sm:py-4 border-b-2 border-[#00F5D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#160D42] border border-[#00F5D4]/40 text-[#00F5D4] font-black text-lg flex items-center justify-center shrink-0 shadow-inner">
              {client.company.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                  {client.company}
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#00F5D4]/15 text-[#00F5D4] border border-[#00F5D4]/40 uppercase tracking-wider">
                  Expediente 360°
                </span>
                {primaryDeal && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DEAL_STAGE_LABELS[primaryDeal.stage]?.bg || 'bg-slate-700'} ${DEAL_STAGE_LABELS[primaryDeal.stage]?.text || 'text-slate-200'}`}>
                    Embudo: {DEAL_STAGE_LABELS[primaryDeal.stage]?.label || primaryDeal.stage}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-100 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00F5D4]" />
                  <span className="font-semibold text-white">{client.name}</span>
                </span>
                <span className="text-indigo-300/60">•</span>
                <span className="text-indigo-200">Registrado el {client.createdAt}</span>
                <span className="hidden md:inline text-indigo-300/60">•</span>
                <a href={`mailto:${client.email}`} className="hidden md:inline text-[#00F5D4] hover:underline font-medium">
                  {client.email}
                </a>
                <span className="hidden md:inline text-indigo-300/60">•</span>
                <span className="hidden md:inline text-indigo-100">{client.phone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {(onSelectClientForContentManager || onNavigate) && (
              <button
                onClick={handleGoToContentManager}
                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Generar ideas de contenido, guiones y videos virales para este cliente en Content Manager"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Content Manager</span>
              </button>
            )}
            <button
              onClick={() => {
                onEditClient(client);
                onClose();
              }}
              className="px-3 py-1.5 bg-[#1B1152] hover:bg-[#120A38] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-400/30"
              title="Editar datos del cliente"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#00F5D4]" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-[#1B1152] hover:bg-[#120A38] text-indigo-200 hover:text-white rounded-lg transition-colors cursor-pointer border border-indigo-400/30"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prominent & Responsive 6-Option Navigation Menu Bar */}
        <div
          role="tablist"
          aria-label="Menú del Expediente 360"
          className="shrink-0 px-3 sm:px-6 py-3 bg-slate-100/95 border-b border-slate-200"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {navOptions.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-btn-client-${item.id}`}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group text-left rounded-xl p-2.5 sm:px-3 sm:py-2.5 border transition-all cursor-pointer flex items-center gap-2.5 min-w-0 ${
                    isActive
                      ? 'bg-[#271871] text-white border-[#271871] shadow-md ring-2 ring-[#00F5D4]/60'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:border-[#271871]/40 hover:bg-indigo-50/40 hover:shadow-xs'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#00F5D4] text-[#120A38]'
                        : 'bg-slate-100 text-[#271871] group-hover:bg-[#271871] group-hover:text-[#00F5D4]'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-extrabold leading-tight truncate ${
                          isActive ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/40'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/40">
          {quoteActionToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold shadow-xs animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{quoteActionToast}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW INTEGRAL */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Quick Contact & Info Bar */}
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex flex-wrap items-center gap-y-2 gap-x-5 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#271871] shrink-0" />
                  <a href={`mailto:${client.email}`} className="text-[#271871] hover:underline font-semibold">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-800">{client.phone}</span>
                </div>
                {client.city && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{client.city} {client.address ? `(${client.address})` : ''}</span>
                  </div>
                )}
                {assignedMember && (
                  <div className="flex items-center gap-1.5 sm:ml-auto">
                    <span className="text-slate-400 font-medium">Responsable:</span>
                    <img
                      src={assignedMember.avatar}
                      alt={assignedMember.name}
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-300"
                    />
                    <span className="font-bold text-slate-800">{assignedMember.name}</span>
                  </div>
                )}
              </div>

              {(client.rfc || client.postalCode || client.taxRegime) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#271871]">
                    <Receipt className="w-3.5 h-3.5 shrink-0" />
                    <span>Datos Fiscales:</span>
                  </div>
                  {client.rfc && (
                    <div>
                      <span className="text-slate-500">RFC:</span>{' '}
                      <strong className="font-mono text-slate-900">{client.rfc}</strong>
                    </div>
                  )}
                  {client.postalCode && (
                    <div>
                      <span className="text-slate-500">C.P.:</span>{' '}
                      <strong className="font-mono text-slate-900">{client.postalCode}</strong>
                    </div>
                  )}
                  {client.taxRegime && (
                    <div className="min-w-0">
                      <span className="text-slate-500">Régimen Fiscal:</span>{' '}
                      <strong className="text-slate-900">{client.taxRegime}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Executive KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>EMBUDO DE VENTAS</span>
                    <GitCommitHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {primaryDeal ? DEAL_STAGE_LABELS[primaryDeal.stage]?.label : 'Sin trato activo'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {primaryDeal ? `Probab. ${primaryDeal.probability}% • ${formatCurrency(primaryDeal.value)}` : 'Registrar en Pipeline'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>COTIZACIONES</span>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {clientQuotes.length} {clientQuotes.length === 1 ? 'enviada' : 'enviadas'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total: <strong className="text-slate-800">{formatCurrency(totalQuoted)}</strong>
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>PROYECTOS</span>
                    <FolderKanban className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {clientProjects.length > 0 ? `${clientProjects.length} Proyecto(s)` : 'Sin proyectos'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeProjectsCount > 0 ? `${activeProjectsCount} en ejecución activa` : 'Listo para iniciar'}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>TAREAS EN CURSO</span>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {pendingTasksTotal} pendientes
                  </p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    {completedTasksTotal} tareas finalizadas
                  </p>
                </div>
              </div>
              {/* Embudo Highlight Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitCommitHorizontal className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">Situación en el Embudo de Ventas</h3>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('pipeline')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Abrir en Embudo</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {primaryDeal ? (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{primaryDeal.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Valor comercial: <strong className="text-slate-900 font-bold">{formatCurrency(primaryDeal.value)}</strong> • Cierre estimado: {primaryDeal.expectedCloseDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DEAL_STAGE_LABELS[primaryDeal.stage]?.bg} ${DEAL_STAGE_LABELS[primaryDeal.stage]?.text}`}>
                          {DEAL_STAGE_LABELS[primaryDeal.stage]?.label}
                        </span>
                        <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                          {primaryDeal.probability}% probabilidad
                        </span>
                      </div>
                    </div>

                    {/* Stepper Pipeline visualizer */}
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Progreso del Pipeline:</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {(['lead', 'qualified', 'proposal', 'negotiation', 'won'] as DealStage[]).map((stageKey, idx) => {
                          const currentStep = DEAL_STAGE_LABELS[primaryDeal.stage]?.step || 0;
                          const thisStep = idx + 1;
                          const isPassed = currentStep >= thisStep;
                          const isCurrent = primaryDeal.stage === stageKey;

                          return (
                            <div
                              key={stageKey}
                              className={`p-2 rounded-lg text-center transition-all border ${
                                isCurrent
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                  : isPassed
                                  ? 'bg-blue-50 text-blue-900 border-blue-200 font-semibold'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              <div className="text-[10px] uppercase tracking-wider">{thisStep}. {DEAL_STAGE_LABELS[stageKey].label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <GitCommitHorizontal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Este cliente aún no tiene un trato activo en el embudo.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Puedes crear una oportunidad comercial desde el embudo de ventas.</p>
                    {onNavigate && (
                      <button
                        onClick={() => handleGoTo('pipeline')}
                        className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Crear Trato en Embudo
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Contexto del Negocio, Productos, Servicios y Brief Highlight Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/50 border border-indigo-400/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>Contexto del Negocio & Brief de Marca</span>
                        {client.industry && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                            {client.industry}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        Contexto comercial y creativo sincronizado con el generador de Content Manager.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('brief')}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Ver / Editar Brief</span>
                    </button>
                    <button
                      onClick={handleGoToContentManager}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Generar en Content Manager</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 text-xs">
                  <div className="bg-slate-800/70 backdrop-blur-xs border border-slate-700/60 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1">
                      Servicios & Productos Clave:
                    </span>
                    <p className="text-slate-200 text-xs line-clamp-2">
                      {client.servicesAndProducts || 'No especificados aún. Haz clic en "Ver / Editar Brief" para agregarlos.'}
                    </p>
                  </div>

                  <div className="bg-slate-800/70 backdrop-blur-xs border border-slate-700/60 rounded-xl p-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1">
                      Brief & Antecedentes de Marca:
                    </span>
                    <p className="text-slate-200 text-xs line-clamp-2">
                      {client.brief || 'Sin brief detallado. Define su propuesta de valor para alimentar la IA.'}
                    </p>
                  </div>
                </div>

                {(client.targetAudience || client.differentiator) && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300 relative z-10">
                    {client.targetAudience && (
                      <div>
                        <span className="text-slate-400 font-medium">Audiencia:</span> {client.targetAudience}
                      </div>
                    )}
                    {client.differentiator && (
                      <div>
                        <span className="text-slate-400 font-medium">Diferenciador:</span> {client.differentiator}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid with Quotes, Projects & Tasks Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Quotes Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                        <h4 className="font-bold text-xs text-slate-900">Cotizaciones ({clientQuotes.length})</h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('quotes')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Ver todas
                      </button>
                    </div>

                    {clientQuotes.length > 0 ? (
                      <div className="space-y-2">
                        {clientQuotes.slice(0, 2).map((q) => (
                          <div key={q.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-slate-800">{q.code}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${QUOTE_STATUS_CONFIG[q.status]?.badge}`}>
                                {QUOTE_STATUS_CONFIG[q.status]?.label}
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] truncate mt-1">{q.title}</p>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 font-bold">
                              <span className="text-slate-900">{formatCurrency(q.total)}</span>
                              <div className="flex items-center gap-2">
                                {onUpdateQuote && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditQuote(q)}
                                    className="text-[11px] font-bold text-[#271871] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>
                                )}
                                {onDeleteQuote && (
                                  <button
                                    type="button"
                                    onClick={() => setQuoteToDelete(q)}
                                    className="text-[11px] font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    title="Eliminar cotización"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg">
                        No hay cotizaciones enviadas
                      </div>
                    )}
                  </div>

                  {(onAddQuote || onNavigate) && (
                    <button
                      type="button"
                      onClick={onAddQuote ? handleOpenNewQuote : () => handleGoTo('quotes')}
                      className="mt-3 w-full py-1.5 px-3 bg-purple-50 hover:bg-[#271871] hover:text-white text-[#271871] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nueva Cotización</span>
                    </button>
                  )}
                </div>

                {/* Projects Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban className="w-4 h-4 text-amber-600" />
                        <h4 className="font-bold text-xs text-slate-900">Proyectos ({clientProjects.length})</h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Ver todos
                      </button>
                    </div>

                    {clientProjects.length > 0 ? (
                      <div className="space-y-2">
                        {clientProjects.slice(0, 2).map((prj) => {
                          const completedCount = (prj.tasks || []).filter(t => t.status === 'completed').length;
                          const totalTasksCount = (prj.tasks || []).length;
                          const progress = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

                          return (
                            <div key={prj.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-slate-800">{prj.code}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${PROJECT_STATUS_CONFIG[prj.status]?.badge}`}>
                                  {PROJECT_STATUS_CONFIG[prj.status]?.label}
                                </span>
                              </div>
                              <p className="text-slate-800 font-semibold text-[11px] truncate mt-1">{prj.name}</p>
                              
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                  <span>Avance</span>
                                  <span className="font-bold text-slate-700">{progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg">
                        Sin proyecto creado aún
                      </div>
                    )}
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('projects')}
                      className="mt-3 w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Crear Proyecto</span>
                    </button>
                  )}
                </div>

                {/* Tasks Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-xs text-slate-900">Tareas Activas ({pendingTasksTotal})</h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="text-[11px] text-blue-600 hover:underline font-semibold"
                      >
                        Ver todas
                      </button>
                    </div>

                    {clientCRMTasks.length > 0 || allProjectTasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {[...clientCRMTasks, ...allProjectTasks].slice(0, 3).map((t) => (
                          <div key={t.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-[11px] font-medium leading-tight truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {t.title}
                              </p>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> {t.dueDate}
                              </span>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${TASK_PRIORITY_CONFIG[t.priority]?.color}`}>
                              {TASK_PRIORITY_CONFIG[t.priority]?.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-lg">
                        No hay tareas asociadas
                      </div>
                    )}
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('tasks')}
                      className="mt-3 w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nueva Tarea</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Client Notes & Details */}
              {client.notes && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-1">Notas Comerciales Internas:</span>
                  <p className="italic">"{client.notes}"</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTEXTO & BRIEF DE MARCA */}
          {activeTab === 'brief' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Success Notification */}
              {briefSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Contexto del negocio y brief de marca actualizados exitosamente! Ahora están sincronizados con Content Manager.</span>
                </div>
              )}

              {/* Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      Contexto del Negocio, Productos y Brief de Marca
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                      Define el giro comercial, catálogo de productos/servicios y brief creativo. Este contexto nutre automáticamente el motor de Inteligencia Artificial en <strong className="text-rose-300 font-bold">Content Manager</strong> para crear contenido viral y relevante.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isEditingBrief ? (
                    <>
                      <button
                        onClick={() => setIsEditingBrief(true)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Contexto</span>
                      </button>
                      <button
                        onClick={handleGoToContentManager}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                      >
                        <Video className="w-4 h-4" />
                        <span>Ir a Content Manager</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setBriefIndustry(client.industry || '');
                          setBriefServices(client.servicesAndProducts || '');
                          setBriefContent(client.brief || '');
                          setBriefAudience(client.targetAudience || '');
                          setBriefTone(client.brandTone || 'viral_divertido');
                          setBriefGoal(client.campaignGoal || 'leads_whatsapp');
                          setBriefDifferentiator(client.differentiator || '');
                          setIsEditingBrief(false);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveBrief}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!isEditingBrief ? (
                /* VIEW MODE */
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Giro Comercial / Industria */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span>Giro Comercial / Industria</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {client.industry || 'No especificado'}
                        </span>
                        {client.industry && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Determina el nicho de mercado y arquetipos de video en tendencia sugeridos.
                      </p>
                    </div>

                    {/* Diferenciador Clave */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Diferenciador Clave / Ventaja Competitiva</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {client.differentiator || 'No especificado aún.'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Lo que distingue a este cliente de su competencia directa.
                      </p>
                    </div>
                  </div>

                  {/* Servicios y Productos Clave */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span>Servicios y Productos Clave del Cliente</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Usado en guiones, llamados a la acción y ofertas
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {client.servicesAndProducts || (
                        <span className="text-slate-400 italic">
                          Aún no se han redactado los servicios o productos de {client.company}. Pulsa "Editar Contexto" para agregarlos.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brief Oficial de Marca */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Brief de Marca & Antecedentes Estratégicos</span>
                      </div>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                        Alimenta la IA de Contenido
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {client.brief || (
                        <span className="text-slate-400 italic">
                          No se ha cargado el brief detallado. Agrega antecedentes de la marca, historia, objetivos comerciales y pilares de comunicación.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Audiencia, Tono y Objetivos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <Target className="w-4 h-4 text-rose-600" />
                        <span>Audiencia Objetivo</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800">
                        {client.targetAudience || 'Clientes potenciales en México'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Tono de Comunicación</span>
                      </div>
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                        {client.brandTone === 'viral_divertido' && '🔥 Viral, Dinámico y Divertido'}
                        {client.brandTone === 'profesional_corporativo' && '👔 Profesional y Corporativo'}
                        {client.brandTone === 'educativo_autoridad' && '🎓 Educativo y Experto'}
                        {client.brandTone === 'inspiracional_storytelling' && '✨ Inspiracional y Storytelling'}
                        {client.brandTone === 'testimoniales_prueba_social' && '⭐ Testimoniales y Casos de Éxito'}
                        {!client.brandTone && 'Viral y Dinámico'}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span>Objetivo de Campaña</span>
                      </div>
                      <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {client.campaignGoal === 'leads_whatsapp' && '📲 Generación de Leads a WhatsApp'}
                        {client.campaignGoal === 'brand_awareness' && '📢 Reconocimiento de Marca / Alcance'}
                        {client.campaignGoal === 'trafico_web' && '🌐 Tráfico a Sitio Web / Tienda'}
                        {client.campaignGoal === 'venta_directa' && '💰 Venta Directa de Producto/Servicio'}
                        {client.campaignGoal === 'retencion_fidelizacion' && '🤝 Fidelización de Clientes'}
                        {!client.campaignGoal && 'Leads a WhatsApp'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Footer */}
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          ¿Listo para crear la estrategia de contenido de {client.company}?
                        </h4>
                        <p className="text-[11px] text-slate-600">
                          Content Manager precargará este giro, catálogo y brief para crear ideas de TikTok, Reels, Shorts y LinkedIn.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleGoToContentManager}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow shrink-0"
                    >
                      <span>Abrir en Content Manager</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* EDIT MODE */
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Formulario de Contexto & Brief de Marca
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ingresa los detalles clave de {client.company} para alimentar las plantillas y el motor de IA.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      Edición Activa
                    </span>
                  </div>

                  {/* Giro / Industria */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giro Comercial / Industria del Cliente *
                    </label>
                    <input
                      type="text"
                      value={briefIndustry}
                      onChange={(e) => setBriefIndustry(e.target.value)}
                      placeholder="Ej. Gastronomía & Alimentos, Inmobiliaria, Logística & Carga, Fintech, Salud..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-slate-400 font-medium">Sugerencias rápidas:</span>
                      {['Gastronomía & Restaurantes', 'Inmobiliaria & Bienes Raíces', 'Logística & Transporte', 'Salud & Especialidades', 'Tecnología & SaaS', 'Servicios B2B & Consultoría', 'Retail & E-commerce'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setBriefIndustry(preset)}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Servicios y Productos */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Servicios y Productos Clave del Cliente *
                    </label>
                    <textarea
                      rows={3}
                      value={briefServices}
                      onChange={(e) => setBriefServices(e.target.value)}
                      placeholder="Menciona los productos estrella, paquetes, especialidades o servicios principales que comercializa el cliente..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Esta información se insertará en los guiones y llamados a la acción de los videos.
                    </p>
                  </div>

                  {/* Brief de Marca & Antecedentes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brief de Marca Oficial, Historia y Antecedentes *
                    </label>
                    <textarea
                      rows={5}
                      value={briefContent}
                      onChange={(e) => setBriefContent(e.target.value)}
                      placeholder="Detalla la propuesta de valor, historia de la marca, pilares de comunicación, valores y problemas que resuelve a sus clientes..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Proporciona antecedentes ricos para que la IA genere ganchos de alta conversión.
                    </p>
                  </div>

                  {/* Audiencia Objetivo & Diferenciador */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Audiencia Objetivo (Buyer Persona)
                      </label>
                      <input
                        type="text"
                        value={briefAudience}
                        onChange={(e) => setBriefAudience(e.target.value)}
                        placeholder="Ej. Directores de operaciones B2B, jóvenes de 25-40 años, familias..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Diferenciador Clave (Ventaja Competitiva)
                      </label>
                      <input
                        type="text"
                        value={briefDifferentiator}
                        onChange={(e) => setBriefDifferentiator(e.target.value)}
                        placeholder="Ej. Certificación ISO, entrega en 24h, asesoría personalizada sin costo..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Tono & Objetivo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tono de Comunicación en Redes
                      </label>
                      <select
                        value={briefTone}
                        onChange={(e) => setBriefTone(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="viral_divertido">🔥 Viral, Dinámico y Divertido (Reels/TikTok)</option>
                        <option value="profesional_corporativo">👔 Profesional y Corporativo (B2B/LinkedIn)</option>
                        <option value="educativo_autoridad">🎓 Educativo y Experto (Tips/Tutoriales)</option>
                        <option value="inspiracional_storytelling">✨ Inspiracional y Storytelling</option>
                        <option value="testimoniales_prueba_social">⭐ Testimoniales y Casos de Éxito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Objetivo Principal de Campaña
                      </label>
                      <select
                        value={briefGoal}
                        onChange={(e) => setBriefGoal(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="leads_whatsapp">📲 Generación de Leads a WhatsApp</option>
                        <option value="brand_awareness">📢 Reconocimiento de Marca / Alcance</option>
                        <option value="trafico_web">🌐 Tráfico a Sitio Web / Tienda Online</option>
                        <option value="venta_directa">💰 Venta Directa de Producto/Servicio</option>
                        <option value="retencion_fidelizacion">🤝 Fidelización de Clientes</option>
                      </select>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingBrief(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBrief}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Contexto & Brief</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COTIZACIONES */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cotizaciones enviadas a {client.company}</h3>
                  <p className="text-xs text-slate-500">Edita conceptos, precios o impuestos directamente desde el expediente, o descarga el PDF oficial.</p>
                </div>
                {(onAddQuote || onNavigate) && (
                  <button
                    type="button"
                    id="btn-client-modal-new-quote"
                    onClick={onAddQuote ? handleOpenNewQuote : () => handleGoTo('quotes')}
                    className="px-3.5 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer self-start sm:self-center"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>Crear Cotización</span>
                  </button>
                )}
              </div>

              {clientQuotes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No se han emitido cotizaciones para este cliente</p>
                  <p className="text-xs text-slate-500 mt-1">Genera una propuesta formal con desglose de servicios e impuestos.</p>
                  {(onAddQuote || onNavigate) && (
                    <button
                      type="button"
                      onClick={onAddQuote ? handleOpenNewQuote : () => handleGoTo('quotes')}
                      className="mt-3 px-4 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Generar Primera Cotización
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {clientQuotes.map((quote) => {
                    const isExpanded = selectedQuoteDetail === quote.id;

                    return (
                      <div
                        key={quote.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-sm text-[#271871]">{quote.code}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${QUOTE_STATUS_CONFIG[quote.status]?.badge}`}>
                                {QUOTE_STATUS_CONFIG[quote.status]?.label}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-1">{quote.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Emitida: {quote.createdAt} • Vigente hasta: {quote.validUntil} • Por: {quote.createdBy}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                            <div className="text-right mr-1">
                              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Importe Total</span>
                              <span className="text-base font-black text-slate-900">
                                {formatCurrency(quote.total)}
                              </span>
                            </div>

                            {onUpdateQuote && (
                              <button
                                type="button"
                                id={`btn-client-edit-quote-${quote.code}`}
                                onClick={() => handleOpenEditQuote(quote)}
                                className="px-3 py-1.5 bg-[#271871] hover:bg-[#342294] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                title="Editar esta cotización"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#00F5D4]" />
                                <span>Editar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(quote)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Descargar cotización oficial en PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedQuoteDetail(isExpanded ? null : quote.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Ocultar' : 'Ver Desglose'}
                            </button>

                            {onDeleteQuote && (
                              <button
                                type="button"
                                id={`btn-client-delete-quote-${quote.code}`}
                                onClick={() => setQuoteToDelete(quote)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition-colors cursor-pointer border border-rose-200/70"
                                title="Eliminar cotización"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable items table & terms */}
                        {isExpanded && (
                          <div className="p-4 space-y-4 bg-white animate-in fade-in duration-150">
                            <div>
                              <p className="text-xs font-bold text-slate-700 mb-2">Desglose de Servicios y Conceptos:</p>
                              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                      <th className="py-2 px-3">Descripción</th>
                                      <th className="py-2 px-3 text-center">Cant.</th>
                                      <th className="py-2 px-3 text-right">Precio Unit.</th>
                                      <th className="py-2 px-3 text-right">Desc.</th>
                                      <th className="py-2 px-3 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {quote.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                                        <td className="py-2 px-3 font-medium text-slate-800 whitespace-pre-wrap break-words leading-relaxed min-w-[220px]">{item.description}</td>
                                        <td className="py-2 px-3 text-center text-slate-600 whitespace-nowrap">{item.quantity}</td>
                                        <td className="py-2 px-3 text-right text-slate-600 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                                        <td className="py-2 px-3 text-right text-slate-500 whitespace-nowrap">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
                                        <td className="py-2 px-3 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Financial totals summary */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-2">
                              <div className="text-xs text-slate-500 space-y-1 max-w-md">
                                {quote.notes && <p><strong className="text-slate-700">Notas:</strong> {quote.notes}</p>}
                                {quote.terms && <p><strong className="text-slate-700">Términos:</strong> {quote.terms}</p>}
                                {currentRole === 'admin' && quote.internalCost !== undefined && (
                                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>
                                      <strong>Costo Interno (Admin):</strong> {formatCurrency(quote.internalCost)} | Margen proyectado: <strong>{quote.targetMarginPercent}%</strong>
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="w-full sm:w-64 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                                <div className="flex justify-between text-slate-600">
                                  <span>Subtotal:</span>
                                  <span>{formatCurrency(quote.subtotal)}</span>
                                </div>
                                {quote.discountTotal > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Descuento total:</span>
                                    <span>-{formatCurrency(quote.discountTotal)}</span>
                                  </div>
                                )}
                                {quote.applyIva !== false && quote.taxAmount > 0 && (
                                  <div className="flex justify-between text-blue-700 font-medium">
                                    <span>IVA ({quote.taxRate}%):</span>
                                    <span>+{formatCurrency(quote.taxAmount)}</span>
                                  </div>
                                )}
                                {quote.applyIsr && quote.isrAmount && quote.isrAmount > 0 && (
                                  <div className="flex justify-between text-amber-700 font-medium">
                                    <span>Ret. ISR ({quote.isrRate || 1.25}%):</span>
                                    <span>-{formatCurrency(quote.isrAmount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                                  <span>Total Neto (MXN):</span>
                                  <span>{formatCurrency(quote.total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMBUDO DE VENTAS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Estatus Comercial en el Embudo de Ventas</h3>
                  <p className="text-xs text-slate-500">Etapa de la negociación, probabilidad de cierre, valor y seguimiento comercial.</p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => handleGoTo('pipeline')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Ir a Embudo de Ventas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {primaryDeal ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                  {/* Deal Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oportunidad Activa</span>
                      <h4 className="text-base font-bold text-slate-900">{primaryDeal.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Última actualización: {primaryDeal.updatedAt}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Valor Estimado:</span>
                      <span className="text-xl font-black text-slate-900">{formatCurrency(primaryDeal.value)}</span>
                    </div>
                  </div>

                  {/* Stage Stepper Interactive */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      Etapa Actual: <span className="text-blue-600">{DEAL_STAGE_LABELS[primaryDeal.stage]?.label}</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {(['lead', 'qualified', 'proposal', 'negotiation', 'won'] as DealStage[]).map((stageKey, idx) => {
                        const currentStep = DEAL_STAGE_LABELS[primaryDeal.stage]?.step || 0;
                        const thisStep = idx + 1;
                        const isPassed = currentStep >= thisStep;
                        const isCurrent = primaryDeal.stage === stageKey;

                        return (
                          <div
                            key={stageKey}
                            className={`p-3 rounded-xl border transition-all text-center ${
                              isCurrent
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40 font-bold'
                                : isPassed
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <div className="text-[10px] uppercase font-bold opacity-80 mb-0.5">Paso {thisStep}</div>
                            <div className="text-xs font-bold leading-tight">{DEAL_STAGE_LABELS[stageKey].label}</div>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-[9px] bg-white text-blue-700 font-extrabold px-1.5 py-0.2 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deal Metrics and details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1">Probabilidad de Cierre</span>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-bold text-slate-900">{primaryDeal.probability}%</span>
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${primaryDeal.probability}%` }} />
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1">Fecha Esperada de Cierre</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800">{primaryDeal.expectedCloseDate}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-semibold block mb-1">Responsable Comercial</span>
                      <div className="flex items-center gap-2 mt-1">
                        {assignedMember ? (
                          <>
                            <img src={assignedMember.avatar} alt={assignedMember.name} className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-sm font-bold text-slate-800 truncate">{assignedMember.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">Sin asignar</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {primaryDeal.notes && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">Observaciones del Trato:</span>
                      <p>{primaryDeal.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <GitCommitHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No hay tratos comerciales en el embudo para este cliente</p>
                  <p className="text-xs text-slate-500 mt-1">Crea una oportunidad para dar seguimiento a la venta y avance de etapas.</p>
                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('pipeline')}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Añadir a Embudo de Ventas
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROYECTOS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Proyectos creados para {client.company}</h3>
                  <p className="text-xs text-slate-500">Planificación técnica, porcentaje de ejecución, equipo asignado y tareas asociadas.</p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => handleGoTo('projects')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Crear Nuevo Proyecto</span>
                  </button>
                )}
              </div>

              {clientProjects.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No se ha creado ningún proyecto aún</p>
                  <p className="text-xs text-slate-500 mt-1">Cuando la cotización sea aprobada, puedes iniciar el proyecto operativo aquí.</p>
                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('projects')}
                      className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Iniciar Proyecto Operativo
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {clientProjects.map((project) => {
                    const completedTasks = (project.tasks || []).filter(t => t.status === 'completed').length;
                    const totalTasks = (project.tasks || []).length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    
                    const projectTeam = teamMembers.filter(m => (project.assignedMemberIds || []).includes(m.id));

                    return (
                      <div
                        key={project.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all p-5 space-y-4"
                      >
                        {/* Project Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {project.code}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PROJECT_STATUS_CONFIG[project.status]?.badge}`}>
                                {PROJECT_STATUS_CONFIG[project.status]?.label}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_PRIORITY_CONFIG[project.priority]?.color}`}>
                                Prioridad: {TASK_PRIORITY_CONFIG[project.priority]?.label}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mt-1">{project.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
                          </div>

                          {onNavigate && (
                            <button
                              onClick={() => handleGoTo('projects')}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center"
                            >
                              <span>Ver Proyecto</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Project Timeline & Budget Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Fecha Inicio</span>
                            <span className="font-semibold text-slate-800">{project.startDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Fecha Límite</span>
                            <span className="font-semibold text-slate-800">{project.endDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Presupuesto</span>
                            <span className="font-bold text-slate-900">{project.budget ? formatCurrency(project.budget) : 'Sin definir'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Equipo Asignado</span>
                            <div className="flex items-center -space-x-1.5 mt-0.5">
                              {projectTeam.map((m) => (
                                <img
                                  key={m.id}
                                  src={m.avatar}
                                  alt={m.name}
                                  title={m.name}
                                  className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Project Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-600">Avance global del proyecto</span>
                            <span className="text-blue-600 font-bold">{progress}% ({completedTasks} de {totalTasks} tareas)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Internal Project Tasks */}
                        {project.tasks && project.tasks.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-bold text-slate-700 mb-2">Tareas internas del proyecto:</p>
                            <div className="space-y-1.5">
                              {project.tasks.map((pt) => {
                                const assignee = teamMembers.find(m => m.id === pt.assignedToId);
                                return (
                                  <div
                                    key={pt.id}
                                    className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${pt.status === 'completed' ? 'bg-emerald-500' : pt.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                      <span className={`truncate font-medium ${pt.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                        {pt.title}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${TASK_STATUS_CONFIG[pt.status]?.badge}`}>
                                        {TASK_STATUS_CONFIG[pt.status]?.label}
                                      </span>
                                      {assignee && (
                                        <img
                                          src={assignee.avatar}
                                          alt={assignee.name}
                                          title={`Asignado a: ${assignee.name}`}
                                          className="w-4 h-4 rounded-full object-cover"
                                        />
                                      )}
                                      <span className="text-[10px] text-slate-500">{pt.dueDate}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TAREAS CREADAS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tareas creadas para {client.company}</h3>
                  <p className="text-xs text-slate-500">Visualiza tareas de seguimiento comercial del CRM y tareas operativas de proyectos.</p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => handleGoTo('tasks')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Crear Tarea</span>
                  </button>
                )}
              </div>

              {clientCRMTasks.length === 0 && allProjectTasks.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No hay tareas creadas para este cliente</p>
                  <p className="text-xs text-slate-500 mt-1">Programa llamadas de seguimiento, entregables o actividades técnicas.</p>
                  {onNavigate && (
                    <button
                      onClick={() => handleGoTo('tasks')}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Asignar Primera Tarea
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* CRM Follow-up tasks */}
                  {clientCRMTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tareas de Seguimiento Comercial (CRM):</p>
                      <div className="space-y-2">
                        {clientCRMTasks.map((task) => {
                          const assignee = teamMembers.find(m => m.id === task.assignedToId);

                          return (
                            <div
                              key={task.id}
                              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                  <CheckSquare className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {task.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_PRIORITY_CONFIG[task.priority]?.color}`}>
                                  {TASK_PRIORITY_CONFIG[task.priority]?.label}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_STATUS_CONFIG[task.status]?.badge}`}>
                                  {TASK_STATUS_CONFIG[task.status]?.label}
                                </span>
                                {assignee && (
                                  <div className="flex items-center gap-1" title={assignee.name}>
                                    <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full object-cover" />
                                    <span className="text-[11px] font-semibold text-slate-700 hidden sm:inline">{assignee.name.split(' ')[0]}</span>
                                  </div>
                                )}
                                <span className="text-[11px] text-slate-500 font-medium">{task.dueDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Project tasks */}
                  {allProjectTasks.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tareas de Proyectos Técnicos:</p>
                      <div className="space-y-2">
                        {allProjectTasks.map((pt) => {
                          const assignee = teamMembers.find(m => m.id === pt.assignedToId);

                          return (
                            <div
                              key={pt.id}
                              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${pt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  <FolderKanban className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {pt.projectCode}
                                    </span>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{pt.projectName}</span>
                                  </div>
                                  <h4 className={`text-xs font-bold mt-0.5 ${pt.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {pt.title}
                                  </h4>
                                  {pt.description && <p className="text-[11px] text-slate-500 mt-0.5">{pt.description}</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_PRIORITY_CONFIG[pt.priority]?.color}`}>
                                  {TASK_PRIORITY_CONFIG[pt.priority]?.label}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_STATUS_CONFIG[pt.status]?.badge}`}>
                                  {TASK_STATUS_CONFIG[pt.status]?.label}
                                </span>
                                {assignee && (
                                  <div className="flex items-center gap-1" title={assignee.name}>
                                    <img src={assignee.avatar} alt={assignee.name} className="w-5 h-5 rounded-full object-cover" />
                                    <span className="text-[11px] font-semibold text-slate-700 hidden sm:inline">{assignee.name.split(' ')[0]}</span>
                                  </div>
                                )}
                                <span className="text-[11px] text-slate-500 font-medium">{pt.dueDate}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-slate-500">
            Mostrando información integral de <strong className="text-slate-800">{client.company}</strong>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                onEditClient(client);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Editar Cliente
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#271871] hover:bg-[#342294] text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      </div>

      {/* Nested Modal: Crear / Editar Cotización directamente desde Expediente 360° */}
      <QuoteFormModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setEditingQuote(null);
        }}
        editingQuote={editingQuote}
        initialClientId={client.id}
        clients={allClients && allClients.length > 0 ? allClients : [client]}
        companyInfo={companyInfo}
        currentRole={currentRole}
        currentUser={currentUser}
        catalogProducts={catalogProducts}
        nextQuoteCode={`COT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`}
        onSave={handleSaveQuoteFromModal}
      />

      {/* Confirmation Modal: Eliminar Cotización desde Expediente 360° */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  ¿Eliminar esta cotización?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Estás por eliminar permanentemente la cotización <strong className="font-mono text-slate-900">{quoteToDelete.code}</strong> de <strong>{quoteToDelete.clientCompany}</strong>. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900 truncate">{quoteToDelete.title}</p>
              <p className="text-slate-600">
                Total: <strong className="text-[#271871]">{formatCurrency(quoteToDelete.total)}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-quote-360"
                onClick={handleConfirmDeleteQuote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, eliminar cotización</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
