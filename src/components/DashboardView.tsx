import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  DollarSign, 
  ArrowUpRight, 
  Briefcase,
  AlertCircle,
  Plus,
  ShieldCheck,
  CheckCircle,
  Download,
  Lock,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Activity,
  Target,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Client, Deal, DealStage, Task, Quote, TeamMember, UserRole } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface DashboardViewProps {
  clients: Client[];
  deals: Deal[];
  tasks: Task[];
  quotes: Quote[];
  teamMembers: TeamMember[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onNavigate: (tab: 'clients' | 'projects' | 'pipeline' | 'tasks' | 'team' | 'quotes' | 'dashboard') => void;
}

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bgBadge: string; textBadge: string }> = {
  lead: { 
    label: 'Prospecto / Lead', 
    color: '#64748B', 
    bgBadge: 'bg-slate-100', 
    textBadge: 'text-slate-700' 
  },
  qualified: { 
    label: 'Cualificado', 
    color: '#00C4AA', 
    bgBadge: 'bg-teal-100', 
    textBadge: 'text-teal-800' 
  },
  proposal: { 
    label: 'Propuesta Enviada', 
    color: '#271871', 
    bgBadge: 'bg-indigo-100', 
    textBadge: 'text-[#271871]' 
  },
  negotiation: { 
    label: 'En Negociación', 
    color: '#F59E0B', 
    bgBadge: 'bg-amber-100', 
    textBadge: 'text-amber-800' 
  },
  won: { 
    label: 'Ganada / Cerrada', 
    color: '#00E0C6', 
    bgBadge: 'bg-emerald-100', 
    textBadge: 'text-emerald-800' 
  },
  lost: { 
    label: 'Perdida', 
    color: '#F43F5E', 
    bgBadge: 'bg-rose-100', 
    textBadge: 'text-rose-700' 
  },
};

// Custom tooltip for Pipeline Distribution Donut
const CustomPipelineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-100">{data.label}</span>
        </div>
        <div className="space-y-1.5 text-slate-300">
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Oportunidades:</span>
            <span className="font-bold text-white">{data.count} {data.count === 1 ? 'lead' : 'leads'}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Valor Acumulado:</span>
            <span className="font-bold text-emerald-400">{formatCurrency(data.value)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-slate-400">Participación:</span>
            <span className="font-bold text-amber-300">{data.percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Team Workload Stacked Bar Chart
const CustomWorkloadTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[210px]">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-800">
          <img 
            src={data.avatar} 
            alt={data.fullName} 
            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-600 shrink-0" 
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-100 truncate">{data.fullName}</div>
            <div className="text-[10px] text-slate-400 truncate">{data.position}</div>
          </div>
        </div>
        <div className="space-y-1.5 text-slate-300">
          <div className="flex justify-between items-center gap-4">
            <span className="text-blue-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> En Curso:
            </span>
            <span className="font-bold text-white">{data.inProgress} tareas</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-amber-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendientes:
            </span>
            <span className="font-bold text-white">{data.pending} tareas</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Finalizadas:
            </span>
            <span className="font-bold text-white">{data.completed} tareas</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center gap-4 text-[11px]">
            <span className="text-slate-400">Progreso Promedio:</span>
            <span className="font-bold text-blue-300">{data.avgProgress}%</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-[11px]">
            <span className="text-slate-400">Estado de Carga:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              data.loadLevel === 'alta' 
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                : data.loadLevel === 'baja'
                ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}>
              {data.loadLevel === 'alta' ? 'Carga Alta' : data.loadLevel === 'baja' ? 'Disponible' : 'Carga Óptima'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  deals,
  tasks,
  quotes,
  teamMembers,
  currentRole,
  currentUser,
  onNavigate,
}) => {
  // Toggle for pipeline chart metric: count vs monetary value
  const [pipelineMetric, setPipelineMetric] = useState<'count' | 'value'>('count');

  // Calculations
  const wonDeals = deals.filter(d => d.stage === 'won');
  const totalRevenueWon = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const totalDealsValue = deals.reduce((sum, d) => sum + d.value, 0);

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Active tasks list sorted by priority
  const activeTasksList = [...tasks]
    .sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    })
    .slice(0, 5);

  // Pipeline Chart Data
  const pipelineChartData = useMemo(() => {
    const totalCount = deals.length;
    const stages = Object.keys(STAGE_CONFIG) as DealStage[];

    return stages.map(stageKey => {
      const stageDeals = deals.filter(d => d.stage === stageKey);
      const count = stageDeals.length;
      const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
      const percentage = pipelineMetric === 'count' 
        ? (totalCount > 0 ? Math.round((count / totalCount) * 100) : 0)
        : (totalDealsValue > 0 ? Math.round((value / totalDealsValue) * 100) : 0);

      return {
        stage: stageKey,
        label: STAGE_CONFIG[stageKey].label,
        count,
        value,
        chartValue: pipelineMetric === 'count' ? count : value,
        percentage,
        color: STAGE_CONFIG[stageKey].color,
        bgBadge: STAGE_CONFIG[stageKey].bgBadge,
        textBadge: STAGE_CONFIG[stageKey].textBadge,
      };
    });
  }, [deals, pipelineMetric, totalDealsValue]);

  // Only stages with data for pie rendering (or fallback if empty)
  const activePipelineSlices = useMemo(() => {
    return pipelineChartData.filter(item => item.chartValue > 0);
  }, [pipelineChartData]);

  // Team Workload Data
  const workloadChartData = useMemo(() => {
    const internalMembers = teamMembers.filter(m => m.role !== 'cliente');

    return internalMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignedToId === member.id);
      const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
      const pending = memberTasks.filter(t => t.status === 'pending').length;
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      const totalActive = inProgress + pending;
      const total = memberTasks.length;
      const avgProgress = total > 0 
        ? Math.round(memberTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total) 
        : 0;

      let loadLevel: 'baja' | 'optima' | 'alta' = 'optima';
      if (totalActive >= 4) loadLevel = 'alta';
      else if (totalActive <= 1) loadLevel = 'baja';

      return {
        id: member.id,
        name: member.name.split(' ')[0], // Display first name for clean axis
        fullName: member.name,
        avatar: member.avatar,
        position: member.position,
        role: member.role,
        inProgress,
        pending,
        completed,
        totalActive,
        total,
        avgProgress,
        loadLevel,
      };
    });
  }, [teamMembers, tasks]);

  // Win rate percentage
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const avgDealTicket = deals.length > 0 ? Math.round(totalDealsValue / deals.length) : 0;

  return (
    <div className="space-y-6">
      {/* High Density Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Resumen Ejecutivo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas comerciales, distribución del pipeline y balance de carga del equipo en tiempo real
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2 text-xs shadow-2xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-medium text-slate-600">Sincronizado en Tiempo Real</span>
          </div>

          <button
            id="dashboard-new-task-btn"
            onClick={() => onNavigate('tasks')}
            className="bg-[#271871] hover:bg-[#342294] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00F5D4]" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </header>

      {/* 4-Column KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Ventas Cerradas */}
        <div 
          onClick={() => onNavigate('pipeline')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ventas Cerradas
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalRevenueWon)}
          </h3>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>↑</span> {wonDeals.length} ventas cerradas con éxito
          </p>
        </div>

        {/* Card 2: Clientes Activos */}
        <div 
          onClick={() => onNavigate('clients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Clientes Activos
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {clients.length}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {clients.filter(c => c.stage === 'customer').length} fidelizados • {clients.filter(c => c.stage === 'negotiation').length} en cierre
          </p>
        </div>

        {/* Card 3: Tareas Pendientes */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tareas Pendientes
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {tasks.filter(t => t.status !== 'completed').length}
          </h3>
          <p className="text-xs text-amber-600 font-medium mt-1">
            {tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length} de prioridad urgente
          </p>
        </div>

        {/* Card 4: Eficiencia Equipo */}
        <div 
          onClick={() => onNavigate('team')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Eficiencia Equipo
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            {taskCompletionRate}%
          </h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${taskCompletionRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* PANEL DE VISUALIZACIÓN DE DATOS CON RECHARTS */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Panel de Analítica y Visualización de Operaciones
              </h2>
              <p className="text-xs text-slate-500">
                Gráficos interactivos de distribución de prospectos y balance de tareas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ir al Pipeline <ArrowRight className="w-3 h-3" />
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => onNavigate('team')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Equipo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* GRÁFICO 1: DISTRIBUCIÓN DE LEADS EN EL PIPELINE (DONUT CHART) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
            <div>
              {/* Header con Controles */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Distribución de Leads en Pipeline
                  </h3>
                </div>

                {/* Selector de Métrica: Cantidad vs Valor MXN */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPipelineMetric('count')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      pipelineMetric === 'count'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Cantidad ({deals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineMetric('value')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      pipelineMetric === 'value'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Valor ($ MXN)
                  </button>
                </div>
              </div>

              {/* Chart & Legend Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-3">
                {/* Donut Chart Container */}
                <div className="sm:col-span-7 h-60 w-full relative flex items-center justify-center">
                  {activePipelineSlices.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={activePipelineSlices}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="chartValue"
                            nameKey="label"
                          >
                            {activePipelineSlices.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomPipelineTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Central Badge */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {pipelineMetric === 'count' ? 'Total Leads' : 'Volumen'}
                        </span>
                        <span className="text-base font-black text-slate-800">
                          {pipelineMetric === 'count' ? deals.length : formatCurrency(totalDealsValue)}
                        </span>
                        <span className="text-[9px] text-emerald-600 font-semibold">
                          {winRate}% Cerradas
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-medium">Sin oportunidades registradas</p>
                      <button
                        onClick={() => onNavigate('pipeline')}
                        className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                      >
                        Crear primer lead
                      </button>
                    </div>
                  )}
                </div>

                {/* Mini Legend List with Counts & Values */}
                <div className="sm:col-span-5 space-y-1.5 text-xs">
                  {pipelineChartData.map((item) => (
                    <div 
                      key={item.stage} 
                      onClick={() => onNavigate('pipeline')}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-[11px] font-medium text-slate-700 truncate max-w-[95px]">
                          {item.label}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {pipelineMetric === 'count' ? `${item.count} (${item.percentage}%)` : formatCurrency(item.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Insights Row */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Activas en Curso</span>
                <span className="font-bold text-slate-800">{activeDeals.length} leads</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor en Negociación</span>
                <span className="font-bold text-amber-600">{formatCurrency(pipelineValue)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Ticket Promedio</span>
                <span className="font-bold text-blue-600">{formatCurrency(avgDealTicket)}</span>
              </div>
            </div>
          </div>

          {/* GRÁFICO 2: CARGA DE TRABAJO POR INTEGRANTE (STACKED BAR CHART) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
            <div>
              {/* Header con Indicador y Leyenda */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Carga de Trabajo por Integrante
                  </h3>
                </div>

                {/* Leyenda Visual de Estados de Tarea */}
                <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> En Curso
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Pendientes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Finalizadas
                  </span>
                </div>
              </div>

              {/* Stacked Bar Chart Container */}
              <div className="h-60 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip content={<CustomWorkloadTooltip />} />
                    <Bar 
                      dataKey="inProgress" 
                      name="En Curso" 
                      stackId="workload" 
                      fill="#271871" 
                    />
                    <Bar 
                      dataKey="pending" 
                      name="Pendiente" 
                      stackId="workload" 
                      fill="#F59E0B" 
                    />
                    <Bar 
                      dataKey="completed" 
                      name="Finalizada" 
                      stackId="workload" 
                      fill="#00D1B5" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Colaboradores Workload Badges */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Balance Operativo ({workloadChartData.length} colaboradores activos):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {workloadChartData.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => onNavigate('team')}
                    className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer text-xs"
                    title={`${member.fullName}: ${member.totalActive} tareas activas, ${member.completed} finalizadas`}
                  >
                    <img
                      src={member.avatar}
                      alt={member.fullName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="font-semibold text-slate-800 text-[11px]">{member.name}</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${
                      member.loadLevel === 'alta'
                        ? 'bg-rose-100 text-rose-700'
                        : member.loadLevel === 'baja'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {member.totalActive} act.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High Density 3-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left 2 Columns: Seguimiento de Equipo y Tareas Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3.5 px-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-800 text-sm">Seguimiento de Equipo y Tareas</h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                {tasks.length} tareas
              </span>
            </div>
            <button
              onClick={() => onNavigate('team')}
              className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver rendimiento completo <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4">Usuario</th>
                  <th className="p-3">Tarea Asignada</th>
                  <th className="p-3">Progreso</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 pr-4 text-right">Prioridad</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {activeTasksList.map((task) => {
                  const assignedMember = teamMembers.find(m => m.id === task.assignedToId);
                  const isDone = task.status === 'completed';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 pl-4 font-medium text-slate-800">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={assignedMember?.avatar}
                            alt={assignedMember?.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="truncate max-w-[110px] font-semibold text-slate-900">
                            {assignedMember?.name.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <div className="truncate max-w-[180px] sm:max-w-[220px]" title={task.title}>
                          {task.title}
                        </div>
                        {task.clientName && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {task.clientName}
                          </span>
                        )}
                      </td>
                      <td className="p-3 w-36">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isDone 
                                  ? 'bg-emerald-500' 
                                  : task.progress >= 50 
                                  ? 'bg-blue-500' 
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 w-7 text-right">
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : task.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isDone ? 'Finalizado' : task.status === 'in_progress' ? 'En Curso' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : 'Media'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Team Workload Summary Footer */}
          <div className="p-3 px-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{teamMembers.length} colaboradores activos monitoreados</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {inProgressTasks.length} en curso
              </span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {completedTasks.length} finalizadas
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Cotizaciones Admin Dark Card + Actividad de Ventas Card */}
        <div className="flex flex-col space-y-4">
          {/* Admin Cotizaciones Privadas Card */}
          <div className="bg-[#1B1152] rounded-xl p-4 text-white shadow-md relative overflow-hidden border border-[#2E207A]">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00F5D4] opacity-10 rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-1.5">
                  <h2 className="font-bold text-sm text-[#00F5D4]">Cotizaciones Admin</h2>
                  {currentRole !== 'admin' && <Lock className="w-3.5 h-3.5 text-[#00F5D4]/80" />}
                </div>
                <div className="bg-[#00F5D4] text-[#160D42] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                  {currentRole === 'admin' ? 'Privado' : 'Solo Admin'}
                </div>
              </div>

              {currentRole === 'admin' ? (
                <>
                  <div className="space-y-2 mb-4">
                    {quotes.slice(0, 3).map((q) => (
                      <div 
                        key={q.id} 
                        className="flex justify-between items-center text-xs bg-[#271871]/80 p-2 rounded border border-[#3E2C9E]/60"
                      >
                        <div>
                          <span className="text-indigo-100 font-medium block truncate max-w-[130px]">{q.clientName}</span>
                          <span className="text-[10px] text-indigo-300 font-mono">#{q.code}</span>
                        </div>
                        <span className="font-bold text-[#00F5D4]">{formatCurrency(q.total)}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onNavigate('quotes')}
                    className="w-full bg-white hover:bg-indigo-50 text-[#271871] py-2 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#271871]" />
                    <span>Abrir Cotizaciones (PDF)</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3 mb-2">
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    Módulo reservado para el Administrador. Incluye cálculo de márgenes, impuestos y exportación a PDF oficial.
                  </p>
                  <div className="p-2.5 rounded bg-[#271871]/80 border border-[#3E2C9E]/60 text-center">
                    <span className="text-xs text-[#00F5D4] font-semibold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Requiere Perfil Administrador
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actividad de Ventas Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800 text-sm">Actividad de Ventas</h2>
              <button 
                onClick={() => onNavigate('pipeline')}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
              >
                Ver Pipeline
              </button>
            </div>

            <div className="space-y-3">
              {deals.slice(0, 4).map((deal) => (
                <div key={deal.id} className="flex space-x-3 text-xs items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    deal.stage === 'won' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">{deal.title}</span>
                      <span className="text-[10px] font-semibold text-slate-600 ml-1">
                        {formatCurrency(deal.value)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      {deal.clientName} • {deal.stage === 'won' ? 'Ganada' : 'En progreso'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
