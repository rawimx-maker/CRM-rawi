import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  DollarSign, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X,
  Briefcase,
  Eye,
  GitCommitHorizontal,
  FileSpreadsheet,
  FolderKanban,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  Receipt
} from 'lucide-react';
import { 
  Client, 
  ClientStage, 
  TeamMember, 
  UserRole, 
  Deal, 
  Quote, 
  Project, 
  Task, 
  CompanyInfo,
  DealStage,
  CatalogProduct
} from '../types';
import { SAT_TAX_REGIMES } from '../data/initialData';
import { formatCurrency } from '../utils/pdfGenerator';
import { ClientDetailModal } from './ClientDetailModal';
import { NavTab } from './Sidebar';

interface ClientsViewProps {
  clients: Client[];
  teamMembers: TeamMember[];
  currentRole: UserRole;
  currentUser?: TeamMember;
  deals?: Deal[];
  quotes?: Quote[];
  projects?: Project[];
  tasks?: Task[];
  companyInfo?: CompanyInfo;
  catalogProducts?: CatalogProduct[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForTask?: (client: Client) => void;
  onNavigate?: (tab: NavTab) => void;
  onSelectClientForContentManager?: (client: Client) => void;
  onAddQuote?: (quote: Omit<Quote, 'id'>) => void;
  onUpdateQuote?: (quote: Quote) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

const STAGE_LABELS: Record<ClientStage, { label: string; bg: string; text: string }> = {
  lead: { label: 'Prospecto / Lead', bg: 'bg-slate-100', text: 'text-slate-700' },
  contacted: { label: 'Contactado', bg: 'bg-blue-100', text: 'text-blue-700' },
  negotiation: { label: 'En Negociación', bg: 'bg-amber-100', text: 'text-amber-800' },
  customer: { label: 'Cliente Activo', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  inactive: { label: 'Inactivo', bg: 'bg-rose-100', text: 'text-rose-700' },
};

const DEAL_STAGE_SHORT_LABELS: Record<DealStage, string> = {
  lead: 'Lead',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
};

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  teamMembers,
  currentRole,
  currentUser,
  deals = [],
  quotes = [],
  projects = [],
  tasks = [],
  companyInfo,
  catalogProducts = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForTask,
  onNavigate,
  onSelectClientForContentManager,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedDetailClient, setSelectedDetailClient] = useState<Client | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStage, setFormStage] = useState<ClientStage>('lead');
  const [formAssignedTo, setFormAssignedTo] = useState<string>(teamMembers[0]?.id || '');
  const [formEstimatedValue, setFormEstimatedValue] = useState<string>('5000');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRfc, setFormRfc] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formTaxRegime, setFormTaxRegime] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formServicesAndProducts, setFormServicesAndProducts] = useState('');
  const [formBrief, setFormBrief] = useState('');
  const [formTargetAudience, setFormTargetAudience] = useState('');
  const [formDifferentiator, setFormDifferentiator] = useState('');

  const openNewModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormStage('lead');
    setFormAssignedTo(teamMembers[0]?.id || '');
    setFormEstimatedValue('5000');
    setFormAddress('');
    setFormCity('');
    setFormRfc('');
    setFormPostalCode('');
    setFormTaxRegime('');
    setFormNotes('');
    setFormIndustry('');
    setFormServicesAndProducts('');
    setFormBrief('');
    setFormTargetAudience('');
    setFormDifferentiator('');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.company);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormStage(client.stage);
    setFormAssignedTo(client.assignedToId);
    setFormEstimatedValue(String(client.estimatedValue));
    setFormAddress(client.address || '');
    setFormCity(client.city || '');
    setFormRfc(client.rfc || '');
    setFormPostalCode(client.postalCode || '');
    setFormTaxRegime(client.taxRegime || '');
    setFormNotes(client.notes || '');
    setFormIndustry(client.industry || '');
    setFormServicesAndProducts(client.servicesAndProducts || '');
    setFormBrief(client.brief || '');
    setFormTargetAudience(client.targetAudience || '');
    setFormDifferentiator(client.differentiator || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCompany.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name: formName.trim(),
        company: formCompany.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        stage: formStage,
        assignedToId: formAssignedTo,
        estimatedValue: parseFloat(formEstimatedValue) || 0,
        address: formAddress.trim(),
        city: formCity.trim(),
        rfc: formRfc.trim().toUpperCase(),
        postalCode: formPostalCode.trim(),
        taxRegime: formTaxRegime.trim(),
        notes: formNotes.trim(),
        industry: formIndustry.trim(),
        servicesAndProducts: formServicesAndProducts.trim(),
        brief: formBrief.trim(),
        targetAudience: formTargetAudience.trim(),
        differentiator: formDifferentiator.trim(),
      });
    } else {
      onAddClient({
        name: formName.trim(),
        company: formCompany.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        stage: formStage,
        assignedToId: formAssignedTo,
        estimatedValue: parseFloat(formEstimatedValue) || 0,
        address: formAddress.trim(),
        city: formCity.trim(),
        rfc: formRfc.trim().toUpperCase(),
        postalCode: formPostalCode.trim(),
        taxRegime: formTaxRegime.trim(),
        notes: formNotes.trim(),
        industry: formIndustry.trim(),
        servicesAndProducts: formServicesAndProducts.trim(),
        brief: formBrief.trim(),
        targetAudience: formTargetAudience.trim(),
        differentiator: formDifferentiator.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Filter & Sort logic
  const filteredClients = clients
    .filter(client => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        client.name.toLowerCase().includes(q) ||
        client.company.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        (client.city && client.city.toLowerCase().includes(q)) ||
        (client.rfc && client.rfc.toLowerCase().includes(q)) ||
        (client.postalCode && client.postalCode.toLowerCase().includes(q));
      
      const matchesStage = selectedStage === 'all' || client.stage === selectedStage;
      return matchesSearch && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === 'az') {
        return (a.company || a.name).localeCompare(b.company || b.name, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'za') {
        return (b.company || b.name).localeCompare(a.company || a.name, 'es', { sensitivity: 'base' });
      }
      const dateCompare = (a.createdAt || '').localeCompare(b.createdAt || '');
      if (dateCompare !== 0) {
        return sortBy === 'newest' ? -dateCompare : dateCompare;
      }
      const aNum = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return sortBy === 'newest' ? bNum - aNum : aNum - bNum;
    });

  return (
    <div className="space-y-5">
      {/* Header with Search & Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Directorio de Clientes y Cuentas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra contactos comerciales, valor proyectado y responsable asignado.
          </p>
        </div>

        <button
          id="btn-add-client"
          onClick={openNewModal}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-clients-input"
            type="text"
            placeholder="Buscar por cliente, empresa, RFC o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStage === 'all'
                  ? 'bg-[#271871] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({clients.length})
            </button>
            {(['lead', 'contacted', 'negotiation', 'customer'] as ClientStage[]).map((stage) => {
              const count = clients.filter(c => c.stage === stage).length;
              const config = STAGE_LABELS[stage];
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedStage === stage
                      ? 'bg-[#271871] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#271871] shrink-0" />
              <select
                id="select-clients-sort"
                aria-label="Ordenar clientes"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'az' | 'za')}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer pr-1"
              >
                <option value="newest">Más reciente</option>
                <option value="oldest">Más antiguo</option>
                <option value="az">Alfabético (A - Z)</option>
                <option value="za">Alfabético (Z - A)</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                id="btn-clients-view-list"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#271871] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista en lista"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
              <button
                type="button"
                id="btn-clients-view-grid"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#271871] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tarjetas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List or Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-dashed border-slate-300">
          <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No se encontraron clientes</p>
          <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros o registra uno nuevo.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop List Header */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <div className="col-span-3">Cliente / Empresa</div>
            <div className="col-span-2">Contacto Directo</div>
            <div className="col-span-2">Etapa & Responsable</div>
            <div className="col-span-2">Actividad 360°</div>
            <div className="col-span-1 text-right">Valor (MXN)</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredClients.map((client) => {
              const stageConfig = STAGE_LABELS[client.stage] || STAGE_LABELS.lead;
              const assignee = teamMembers.find(m => m.id === client.assignedToId);

              const clientDeal = deals.find(
                (d) => d.clientId === client.id || d.clientCompany?.toLowerCase() === client.company.toLowerCase()
              );
              const clientQuotes = quotes.filter(
                (q) => q.clientId === client.id || q.clientCompany?.toLowerCase() === client.company.toLowerCase()
              );
              const clientProjects = projects.filter(
                (p) => p.clientId === client.id || p.clientCompany?.toLowerCase() === client.company.toLowerCase()
              );
              const clientTasks = tasks.filter(
                (t) =>
                  t.clientId === client.id ||
                  t.clientName?.toLowerCase().includes(client.company.toLowerCase()) ||
                  t.clientName?.toLowerCase().includes(client.name.toLowerCase())
              );
              const clientProjectTasksCount = clientProjects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
              const totalTasksCount = clientTasks.length + clientProjectTasksCount;

              return (
                <div
                  key={client.id}
                  className="p-4 lg:px-4 lg:py-3 hover:bg-indigo-50/35 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-3"
                >
                  {/* Col 1: Empresa, contacto principal, giro */}
                  <div
                    onClick={() => setSelectedDetailClient(client)}
                    className="lg:col-span-3 flex items-start gap-3 min-w-0 cursor-pointer group"
                    title="Clic para abrir Expediente 360°"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#271871]/10 text-[#271871] group-hover:bg-[#271871] group-hover:text-[#00F5D4] font-black text-sm flex items-center justify-center shrink-0 transition-colors">
                      {client.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#271871] truncate transition-colors">
                          {client.company}
                        </h3>
                        <Eye className="w-3.5 h-3.5 text-[#271871] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {client.name}
                        {client.city && <span className="text-slate-400"> • {client.city}</span>}
                      </p>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        {client.industry && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 truncate max-w-full">
                            {client.industry}
                          </span>
                        )}
                        {client.rfc && (
                          <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            RFC: {client.rfc}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Contacto Directo */}
                  <div className="lg:col-span-2 space-y-1 text-xs text-slate-600 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                        {client.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  </div>

                  {/* Col 3: Etapa & Responsable */}
                  <div className="lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${stageConfig.bg} ${stageConfig.text}`}>
                      {stageConfig.label}
                    </span>
                    {assignee ? (
                      <div className="flex items-center gap-1.5" title={`Asignado a: ${assignee.name}`}>
                        <img
                          src={assignee.avatar}
                          alt={assignee.name}
                          className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
                          {assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">Sin asignar</span>
                    )}
                  </div>

                  {/* Col 4: Actividad 360° */}
                  <div
                    onClick={() => setSelectedDetailClient(client)}
                    className="lg:col-span-2 grid grid-cols-2 gap-1.5 text-[11px] cursor-pointer p-2 rounded-lg bg-slate-50/80 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                    title="Ver detalle en Expediente 360°"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <FileSpreadsheet className="w-3 h-3 text-purple-600 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">{clientQuotes.length} cotiz.</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <GitCommitHorizontal className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">
                        {clientDeal ? (DEAL_STAGE_SHORT_LABELS[clientDeal.stage] || clientDeal.stage) : 'Sin trato'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <FolderKanban className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">{clientProjects.length} proy.</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate text-slate-700 font-semibold">{totalTasksCount} tareas</span>
                    </div>
                  </div>

                  {/* Col 5: Valor Proyectado */}
                  <div className="lg:col-span-1 flex lg:block items-center justify-between lg:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400 lg:hidden">Valor proyectado:</span>
                    <span className="font-extrabold text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(client.estimatedValue)}
                    </span>
                  </div>

                  {/* Col 6: Acciones */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailClient(client)}
                      className="px-2.5 py-1.5 bg-[#271871] hover:bg-[#342294] text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Ver Expediente 360°"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00F5D4]" />
                      <span>360°</span>
                    </button>

                    {onSelectClientForContentManager && (
                      <button
                        type="button"
                        onClick={() => onSelectClientForContentManager(client)}
                        title={`Content Manager para ${client.company}`}
                        className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition-colors cursor-pointer border border-rose-200/70"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onSelectClientForTask && (
                      <button
                        onClick={() => onSelectClientForTask(client)}
                        title="Crear tarea para este cliente"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(client)}
                      title="Editar cliente"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {currentRole === 'admin' && (
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        title="Eliminar cliente"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredClients.map((client) => {
            const stageConfig = STAGE_LABELS[client.stage] || STAGE_LABELS.lead;
            const assignee = teamMembers.find(m => m.id === client.assignedToId);

            const clientDeal = deals.find(
              (d) => d.clientId === client.id || d.clientCompany?.toLowerCase() === client.company.toLowerCase()
            );
            const clientQuotes = quotes.filter(
              (q) => q.clientId === client.id || q.clientCompany?.toLowerCase() === client.company.toLowerCase()
            );
            const clientProjects = projects.filter(
              (p) => p.clientId === client.id || p.clientCompany?.toLowerCase() === client.company.toLowerCase()
            );
            const clientTasks = tasks.filter(
              (t) =>
                t.clientId === client.id ||
                t.clientName?.toLowerCase().includes(client.company.toLowerCase()) ||
                t.clientName?.toLowerCase().includes(client.name.toLowerCase())
            );
            const clientProjectTasksCount = clientProjects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
            const totalTasksCount = clientTasks.length + clientProjectTasksCount;

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Clickable Card Header / Profile Section */}
                  <div 
                    onClick={() => setSelectedDetailClient(client)}
                    className="cursor-pointer group -m-1.5 p-1.5 rounded-lg hover:bg-slate-50/90 transition-colors"
                    title="Clic para ver expediente completo, cotizaciones, embudo y proyectos"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {client.company.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 leading-tight truncate group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span className="truncate">{client.company}</span>
                            <Eye className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate pl-9 flex items-center gap-1.5 flex-wrap">
                          <span>Contacto: <strong className="text-slate-700">{client.name}</strong></span>
                          {client.industry && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {client.industry}
                            </span>
                          )}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${stageConfig.bg} ${stageConfig.text}`}>
                        {stageConfig.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline truncate">
                        {client.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                    {client.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.city}</span>
                      </div>
                    )}
                  </div>

                  {/* 360 Mini Status Ribbon */}
                  <div 
                    onClick={() => setSelectedDetailClient(client)}
                    className="mt-3 grid grid-cols-2 gap-1.5 p-2 bg-slate-50/80 rounded-lg border border-slate-100 text-[11px] cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                    title="Ver detalle de cotizaciones, embudo, proyectos y tareas"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate text-slate-600">
                        {clientQuotes.length > 0 ? (
                          <strong className="text-slate-800">{clientQuotes.length} cotiz.</strong>
                        ) : (
                          <span className="text-slate-400">Sin cotiz.</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <GitCommitHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-slate-600">
                        {clientDeal ? (
                          <strong className="text-blue-700">{DEAL_STAGE_SHORT_LABELS[clientDeal.stage] || clientDeal.stage}</strong>
                        ) : (
                          <span className="text-slate-400">Sin trato</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <FolderKanban className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate text-slate-600">
                        {clientProjects.length > 0 ? (
                          <strong className="text-amber-800">{clientProjects.length} proy.</strong>
                        ) : (
                          <span className="text-slate-400">Sin proy.</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate text-slate-600">
                        {totalTasksCount > 0 ? (
                          <strong className="text-emerald-700">{totalTasksCount} tareas</strong>
                        ) : (
                          <span className="text-slate-400">Sin tareas</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {client.notes && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 italic truncate">
                      "{client.notes}"
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Valor proyectado:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(client.estimatedValue)}
                    </span>
                  </div>

                  {/* Expediente 360 Action Button */}
                  {/* Expediente 360 & Content Manager Action Buttons */}
                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailClient(client)}
                      className="col-span-4 py-1.5 px-3 bg-blue-50/70 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-200/60"
                      title="Ver expediente completo, cotizaciones, proyectos y brief"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Expediente 360°</span>
                    </button>
                    {onSelectClientForContentManager ? (
                      <button
                        type="button"
                        onClick={() => onSelectClientForContentManager(client)}
                        title={`Crear ideas y videos en Content Manager para ${client.company}`}
                        className="col-span-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer border border-rose-200/70"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedDetailClient(client)}
                        className="col-span-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center transition-all cursor-pointer border border-slate-200"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {assignee ? (
                        <div className="flex items-center space-x-1.5" title={`Asignado a: ${assignee.name}`}>
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[90px]">
                            {assignee.name.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Sin asignar</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {onSelectClientForTask && (
                        <button
                          onClick={() => onSelectClientForTask(client)}
                          title="Crear tarea para este cliente"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-xs cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(client)}
                        title="Editar cliente"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {currentRole === 'admin' && (
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          title="Eliminar cliente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingClient ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Empresa / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Ej. Soluciones Globales S.A."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contacto Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Roberto Valdés"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Etapa Comercial
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as ClientStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="lead">Prospecto (Lead)</option>
                    <option value="contacted">Contactado</option>
                    <option value="negotiation">En Negociación</option>
                    <option value="customer">Cliente Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsable Asignado
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.position.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Valor Estimado ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formEstimatedValue}
                    onChange={(e) => setFormEstimatedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ciudad / Región
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Ej. Ciudad de México"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Calle, número, colonia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Datos Fiscales (CFDI) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#271871]">
                  <Receipt className="w-3.5 h-3.5 text-[#271871]" />
                  <span>Datos Fiscales (Facturación / CFDI)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      RFC
                    </label>
                    <input
                      id="client-form-rfc"
                      type="text"
                      maxLength={13}
                      value={formRfc}
                      onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                      placeholder="Ej. XAXX010101000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden bg-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Código Postal
                    </label>
                    <input
                      id="client-form-postal-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={formPostalCode}
                      onChange={(e) => setFormPostalCode(e.target.value.replace(/[^\d]/g, '').slice(0, 5))}
                      placeholder="Ej. 96400"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Régimen Fiscal
                  </label>
                  <select
                    id="client-form-tax-regime"
                    value={formTaxRegime}
                    onChange={(e) => setFormTaxRegime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden bg-white"
                  >
                    <option value="">Seleccionar Régimen Fiscal (SAT)...</option>
                    {SAT_TAX_REGIMES.map((regime) => (
                      <option key={regime} value={regime}>
                        {regime}
                      </option>
                    ))}
                    {formTaxRegime && !SAT_TAX_REGIMES.includes(formTaxRegime) && (
                      <option value={formTaxRegime}>{formTaxRegime}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Contexto de Negocio & Brief para Content Manager</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giro Comercial / Industria
                    </label>
                    <input
                      type="text"
                      value={formIndustry}
                      onChange={(e) => setFormIndustry(e.target.value)}
                      placeholder="Ej. Gastronomía, Inmobiliaria, Logística..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Diferenciador Clave
                    </label>
                    <input
                      type="text"
                      value={formDifferentiator}
                      onChange={(e) => setFormDifferentiator(e.target.value)}
                      placeholder="Ej. 100% fresco, entrega 24h, ISO 9001..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Servicios y Productos Clave del Cliente
                  </label>
                  <textarea
                    rows={2}
                    value={formServicesAndProducts}
                    onChange={(e) => setFormServicesAndProducts(e.target.value)}
                    placeholder="Menciona los productos estrella, paquetes o servicios clave del negocio..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brief de Marca & Antecedentes
                  </label>
                  <textarea
                    rows={3}
                    value={formBrief}
                    onChange={(e) => setFormBrief(e.target.value)}
                    placeholder="Describe la propuesta de valor, historia, metas de marketing y pilares de comunicación..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas de Seguimiento y Contexto
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalles clave sobre sus necesidades, fechas límite o requerimientos técnicos..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
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
                  {editingClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Expediente 360° del Cliente */}
      {selectedDetailClient && (
        <ClientDetailModal
          client={selectedDetailClient}
          allClients={clients}
          deals={deals}
          quotes={quotes}
          projects={projects}
          tasks={tasks}
          teamMembers={teamMembers}
          companyInfo={companyInfo || {
            name: 'RAWI: Marketing Digital',
            tagline: 'Marketing Digital • Estrategias Digitales, Redes y Contenido',
            taxId: 'RFC: RWM-210419-7H1',
            email: 'info@rawi.mx',
            phone: '9211193860',
            website: 'https://rawi.mx',
            address: 'Av. Universidad 112a, Col. Triangulo, Coatzacoalcos, Ver',
            greeting: 'Buen día, por este medio le hago entrega de la información solicitada sobre el precios de los servicios.',
          }}
          currentRole={currentRole}
          currentUser={currentUser || teamMembers[0]}
          catalogProducts={catalogProducts}
          onClose={() => setSelectedDetailClient(null)}
          onEditClient={(c) => {
            setSelectedDetailClient(null);
            openEditModal(c);
          }}
          onNavigate={onNavigate}
          onUpdateClient={(updated) => {
            onUpdateClient(updated);
            setSelectedDetailClient(updated);
          }}
          onSelectClientForContentManager={onSelectClientForContentManager}
          onAddQuote={onAddQuote}
          onUpdateQuote={onUpdateQuote}
          onDeleteQuote={onDeleteQuote}
        />
      )}
    </div>
  );
};
