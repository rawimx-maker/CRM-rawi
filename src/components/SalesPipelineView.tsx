import React, { useState } from 'react';
import { 
  GitCommitHorizontal, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  X,
  Building,
  TrendingUp,
  Percent
} from 'lucide-react';
import { Deal, DealStage, Client, TeamMember, UserRole } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface SalesPipelineViewProps {
  deals: Deal[];
  clients: Client[];
  teamMembers: TeamMember[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onAddDeal: (deal: Omit<Deal, 'id' | 'updatedAt'>) => void;
  onUpdateDealStage: (dealId: string, newStage: DealStage) => void;
  onDeleteDeal: (dealId: string) => void;
}

const STAGES: { id: DealStage; label: string; color: string; border: string; headerBg: string }[] = [
  { id: 'lead', label: 'Prospecto / Lead', color: 'text-slate-700', border: 'border-slate-300', headerBg: 'bg-slate-100' },
  { id: 'qualified', label: 'Cualificado', color: 'text-blue-700', border: 'border-blue-300', headerBg: 'bg-blue-50' },
  { id: 'proposal', label: 'Propuesta Enviada', color: 'text-indigo-700', border: 'border-indigo-300', headerBg: 'bg-indigo-50' },
  { id: 'negotiation', label: 'En Negociación', color: 'text-amber-700', border: 'border-amber-300', headerBg: 'bg-amber-50' },
  { id: 'won', label: 'Ganada / Cerrada', color: 'text-emerald-700', border: 'border-emerald-300', headerBg: 'bg-emerald-50' },
  { id: 'lost', label: 'Perdida', color: 'text-rose-700', border: 'border-rose-300', headerBg: 'bg-rose-50' },
];

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  deals,
  clients,
  teamMembers,
  currentRole,
  currentUser,
  onAddDeal,
  onUpdateDealStage,
  onDeleteDeal,
}) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formClientId, setFormClientId] = useState(clients[0]?.id || '');
  const [formValue, setFormValue] = useState('10000');
  const [formStage, setFormStage] = useState<DealStage>('lead');
  const [formAssignedTo, setFormAssignedTo] = useState(currentUser.id);
  const [formCloseDate, setFormCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formProbability, setFormProbability] = useState('60');
  const [formNotes, setFormNotes] = useState('');

  const openNewDealModal = (defaultStage: DealStage = 'lead') => {
    setFormTitle('');
    setFormClientId(clients[0]?.id || '');
    setFormValue('12000');
    setFormStage(defaultStage);
    setFormAssignedTo(currentUser.id);
    setFormProbability('50');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const selectedClient = clients.find(c => c.id === formClientId);

    onAddDeal({
      title: formTitle.trim(),
      clientId: formClientId,
      clientName: selectedClient ? selectedClient.name : 'Cliente General',
      clientCompany: selectedClient ? selectedClient.company : 'Empresa Prospecto',
      value: parseFloat(formValue) || 0,
      stage: formStage,
      assignedToId: formAssignedTo,
      expectedCloseDate: formCloseDate,
      probability: parseInt(formProbability) || 50,
      notes: formNotes.trim(),
    });

    setIsModalOpen(false);
  };

  // Filter deals
  const filteredDeals = deals.filter(deal => {
    if (selectedMemberFilter === 'all') return true;
    return deal.assignedToId === selectedMemberFilter;
  });

  const totalPipelineValue = filteredDeals
    .filter(d => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0);

  const totalWonValue = filteredDeals
    .filter(d => d.stage === 'won')
    .reduce((sum, d) => sum + d.value, 0);

  const moveStage = (deal: Deal, direction: 'prev' | 'next') => {
    const stageOrder: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];
    const currentIndex = stageOrder.indexOf(deal.stage);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      onUpdateDealStage(deal.id, stageOrder[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < stageOrder.length - 1) {
      onUpdateDealStage(deal.id, stageOrder[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Embudo de Ventas (Pipeline Kanban)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Flujo comercial interactivo, etapas de negociación y pronóstico de ingresos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-add-deal"
            onClick={() => openNewDealModal('lead')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Oportunidad</span>
          </button>
        </div>
      </div>

      {/* Summary Strip & Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-6 text-xs w-full md:w-auto">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Pipeline Activo:</span>
            <span className="text-base font-bold text-slate-900">{formatCurrency(totalPipelineValue)}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Cerradas Ganadas:</span>
            <span className="text-base font-bold text-emerald-600">{formatCurrency(totalWonValue)}</span>
          </div>
          <div className="border-l border-slate-200 pl-6 hidden sm:block">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total Oportunidades:</span>
            <span className="text-base font-bold text-slate-700">{filteredDeals.length}</span>
          </div>
        </div>

        {/* Filter by assigned team member */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Responsable:</span>
          <select
            value={selectedMemberFilter}
            onChange={(e) => setSelectedMemberFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todo el Equipo ({deals.length})</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-3">
        {STAGES.map((stage) => {
          const stageDeals = filteredDeals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-2.5 flex flex-col min-w-[210px]"
            >
              {/* Column Header */}
              <div className={`p-2 rounded-lg ${stage.headerBg} border ${stage.border} mb-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-slate-700 shadow-2xs">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] font-bold text-slate-700">
                  {formatCurrency(stageTotal)}
                </div>
              </div>

              {/* Deals in this column */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                {stageDeals.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-[10px] border border-dashed border-slate-200 rounded-lg">
                    Sin operaciones
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const assignee = teamMembers.find(m => m.id === deal.assignedToId);

                    return (
                      <div
                        key={deal.id}
                        className="bg-slate-50/70 hover:bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">
                              {deal.title}
                            </h4>
                          </div>

                          <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{deal.clientCompany}</span>
                          </p>

                          <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              {formatCurrency(deal.value)}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded flex items-center border border-blue-200/60">
                              {deal.probability}%
                            </span>
                          </div>

                          {deal.notes && (
                            <p className="text-[10px] text-slate-500 mt-1.5 bg-white p-1 rounded border border-slate-100 line-clamp-2">
                              {deal.notes}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {/* Assignee Avatar */}
                          <div className="flex items-center space-x-1.5" title={assignee?.name}>
                            {assignee && (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            )}
                            <span className="text-[10px] font-medium text-slate-600 truncate max-w-[65px]">
                              {assignee?.name.split(' ')[0]}
                            </span>
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="flex items-center space-x-1">
                            {stage.id !== 'lead' && stage.id !== 'lost' && (
                              <button
                                onClick={() => moveStage(deal, 'prev')}
                                title="Mover a etapa anterior"
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stage.id !== 'won' && stage.id !== 'lost' && (
                              <button
                                onClick={() => moveStage(deal, 'next')}
                                title="Avanzar etapa"
                                className="p-1 hover:bg-blue-50 rounded text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {stage.id !== 'lost' && stage.id !== 'won' && (
                              <button
                                onClick={() => onUpdateDealStage(deal.id, 'lost')}
                                title="Marcar como perdida"
                                className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-500 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nueva Oportunidad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Registrar Nueva Oportunidad en Pipeline
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Título de la Oportunidad *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Renovación Anual Licenciamiento Cloud"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cliente Vinculado *
                  </label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Valor Estimado ($ MXN) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Etapa Inicial
                  </label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as DealStage)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="lead">Prospecto</option>
                    <option value="qualified">Cualificado</option>
                    <option value="proposal">Propuesta</option>
                    <option value="negotiation">Negociación</option>
                    <option value="won">Ganada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsable
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Probabilidad (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProbability}
                    onChange={(e) => setFormProbability(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha Estimada de Cierre
                </label>
                <input
                  type="date"
                  value={formCloseDate}
                  onChange={(e) => setFormCloseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas de Negociación
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalles sobre tomadores de decisión, competidores o requerimientos clave..."
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
                  Crear Oportunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
