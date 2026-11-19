import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Video,
  TrendingUp,
  Copy,
  Check,
  Play,
  Search,
  Bookmark,
  Building,
  Music,
  CheckSquare,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowRight,
  Clock,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  Client,
  TeamMember,
  UserRole,
  Task,
  SocialPlatform,
  ContentIdea,
  BusinessContentProfile,
} from '../types';
import {
  TREND_ARCHETYPES,
  SOCIAL_PLATFORMS_DATA,
  INDUSTRY_OPTIONS,
  BRAND_TONES,
  CAMPAIGN_GOALS,
  generateDynamicTrends,
} from '../data/trendingTemplates';
import { VideoSimulationModal } from './content-manager/VideoSimulationModal';

interface ContentManagerViewProps {
  clients: Client[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  currentRole: UserRole;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onNavigate?: (tab: string) => void;
  selectedClientFromExternal?: Client | null;
  onClearSelectedClientFromExternal?: () => void;
}

const STORAGE_KEY_SAVED_IDEAS = 'crm_content_manager_saved_ids';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram Reels',
  youtube: 'YouTube Shorts',
  linkedin: 'LinkedIn Video',
};

function inferIndustryFromClient(client: Client): string {
  const text = `${client.company} ${client.industry || ''} ${client.servicesAndProducts || ''} ${client.brief || ''} ${client.notes || ''}`.toLowerCase();
  if (text.includes('restaurante') || text.includes('cafe') || text.includes('comida') || text.includes('tacos') || text.includes('alimento') || text.includes('gastronom')) return 'gastronomia';
  if (text.includes('inmob') || text.includes('propied') || text.includes('casa') || text.includes('constructora') || text.includes('urbana') || text.includes('departamento')) return 'inmobiliaria';
  if (text.includes('gym') || text.includes('fit') || text.includes('salud') || text.includes('clinica') || text.includes('medica') || text.includes('hospital')) return 'salud_fitness';
  if (text.includes('tienda') || text.includes('shop') || text.includes('ropa') || text.includes('e-com') || text.includes('retail') || text.includes('omnic')) return 'ecommerce';
  if (text.includes('soft') || text.includes('tech') || text.includes('app') || text.includes('digital') || text.includes('fintech') || text.includes('financ')) return 'tecnologia';
  if (text.includes('consultor') || text.includes('abogad') || text.includes('fiscal') || text.includes('logist') || text.includes('transporte')) return 'servicios_b2b';
  return 'general';
}

function buildProfileFromClient(client?: Client): BusinessContentProfile {
  if (!client) {
    return {
      id: 'default-profile',
      businessName: 'Negocio Demo',
      industry: 'gastronomia',
      targetAudience: 'Clientes potenciales en México',
      mainProduct: 'Servicios y productos clave',
      brandTone: 'viral_divertido',
      campaignGoal: 'leads_whatsapp',
      keyDifferentiator: 'Atención personalizada y resultados comprobables',
      preferredPlatforms: ['tiktok', 'instagram'],
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: `profile-${client.id}`,
    clientId: client.id,
    businessName: client.company,
    industry: inferIndustryFromClient(client),
    targetAudience: client.targetAudience || `Clientes y tomadores de decisión de ${client.company}`,
    mainProduct:
      client.servicesAndProducts ||
      (client.notes ? client.notes.slice(0, 100) : `Servicios y productos de ${client.company}`),
    brandTone: (client.brandTone as any) || 'viral_divertido',
    campaignGoal: (client.campaignGoal as any) || 'leads_whatsapp',
    keyDifferentiator: client.differentiator || 'Calidad superior, tiempos garantizados y servicio profesional',
    preferredPlatforms: client.preferredPlatforms || ['tiktok', 'instagram'],
    updatedAt: new Date().toISOString(),
  };
}

export const ContentManagerView: React.FC<ContentManagerViewProps> = ({
  clients,
  teamMembers,
  currentUser,
  onAddTask,
  onNavigate,
  selectedClientFromExternal,
  onClearSelectedClientFromExternal,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (selectedClientFromExternal) return selectedClientFromExternal.id;
    return clients.length > 0 ? clients[0].id : '';
  });

  const [profile, setProfile] = useState<BusinessContentProfile>(() =>
    buildProfileFromClient(selectedClientFromExternal || clients[0])
  );

  const [ideas, setIdeas] = useState<ContentIdea[]>(() => generateDynamicTrends(profile));

  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_IDEAS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [selectedSimIdea, setSelectedSimIdea] = useState<ContentIdea | null>(null);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [taskCreatedId, setTaskCreatedId] = useState<string | null>(null);
  const [isBriefEditorOpen, setIsBriefEditorOpen] = useState<boolean>(true);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const found = clients.find((c) => c.id === clientId);
    if (found) {
      const updatedProfile = buildProfileFromClient(found);
      setProfile(updatedProfile);
      setIdeas(generateDynamicTrends(updatedProfile));
      setExpandedIdeaId(null);
      showNotification(`Brief y contexto sincronizados para ${found.company}.`);
    }
  };

  useEffect(() => {
    if (selectedClientFromExternal) {
      handleClientSelect(selectedClientFromExternal.id);
      if (onClearSelectedClientFromExternal) {
        onClearSelectedClientFromExternal();
      }
    }
  }, [selectedClientFromExternal]);

  const handleRegenerateIdeas = () => {
    const freshIdeas = generateDynamicTrends(profile);
    setIdeas(freshIdeas);
    setExpandedIdeaId(null);
    showNotification('Guiones actualizados con los datos actuales del negocio.');
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    const linkedClient =
      clients.find((c) => c.id === selectedClientId) ||
      clients.find((c) => c.company.toLowerCase() === profile.businessName.toLowerCase());

    try {
      const response = await fetch('/api/content-manager/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientCompany: profile.businessName,
          industry: linkedClient?.industry || profile.industry,
          servicesAndProducts: linkedClient?.servicesAndProducts || profile.mainProduct,
          brief: linkedClient?.brief || profile.targetAudience,
          audience: linkedClient?.targetAudience || profile.targetAudience,
          product: linkedClient?.servicesAndProducts || profile.mainProduct,
          tone: linkedClient?.brandTone || profile.brandTone,
          goal: linkedClient?.campaignGoal || profile.campaignGoal,
          differentiator: linkedClient?.differentiator || profile.keyDifferentiator,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
          setIdeas(data.ideas);
          setExpandedIdeaId(null);
          showNotification('Nuevos guiones generados con IA usando el brief del cliente.');
          setIsGeneratingAI(false);
          return;
        }
      }
    } catch {
      // Fallback to local template generator
    }

    const freshIdeas = generateDynamicTrends(profile).map((idea) => ({
      ...idea,
      aiGenerated: true,
    }));
    setIdeas(freshIdeas);
    setExpandedIdeaId(null);
    setIsGeneratingAI(false);
    showNotification('Guiones optimizados para la marca y campaña seleccionadas.');
  };

  const toggleSaveIdea = (id: string) => {
    const isSaved = savedIdeaIds.includes(id);
    const updated = isSaved ? savedIdeaIds.filter((item) => item !== id) : [...savedIdeaIds, id];
    setSavedIdeaIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_IDEAS, JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  };

  const handleCopyScript = (idea: ContentIdea) => {
    const stepsText = idea.scriptSteps
      .map(
        (s, idx) =>
          `${idx + 1}. [${s.timeRange}] ${s.stepTitle}\n   Decir: "${s.spokenText}"\n   Texto en pantalla: ${s.screenCaption}\n   Visual: ${s.visualCue}`
      )
      .join('\n\n');

    const text = `TÍTULO: ${idea.title}\nFORMATO: ${idea.archetypeLabel} · ${PLATFORM_LABELS[idea.platform] || idea.platform}\n\nGANCHO (0-3s):\n"${idea.hookSpoken}"\nEn pantalla: ${idea.hookOnScreen}\nVisual: ${idea.hookVisualAction}\n\nGUIÓN COMPLETO:\n${stepsText}\n\nAUDIO SUGERIDO: ${idea.soundTrend.name} (${idea.soundTrend.exampleSearch})\n\nCOPY:\n${idea.caption}\n\nHASHTAGS:\n${idea.hashtags.join(' ')}`;

    navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
    showNotification('Guión completo copiado al portapapeles.');
  };

  const handleCreateTaskFromIdea = (idea: ContentIdea) => {
    const assignee = teamMembers.find((m) => m.role === 'colaborador') || currentUser;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    onAddTask({
      title: `[Video] ${idea.title.slice(0, 60)}`,
      description: `Grabar y editar video en formato "${idea.archetypeLabel}" para ${PLATFORM_LABELS[idea.platform] || idea.platform}.\n\nGancho: "${idea.hookSpoken}"\nAudio: ${idea.soundTrend.name}\nObjetivo: ${idea.ctaGoal}`,
      clientId: profile.clientId || (clients[0] ? clients[0].id : undefined),
      clientName: profile.businessName,
      assignedToId: assignee.id,
      priority: 'high',
      status: 'pending',
      progress: 0,
      dueDate: dueDate.toISOString().split('T')[0],
    });

    setTaskCreatedId(idea.id);
    setTimeout(() => setTaskCreatedId(null), 3000);
    showNotification(`Tarea asignada a ${assignee.name} en el CRM.`);
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (selectedPlatform !== 'all') {
        const matchPlat =
          idea.platform === selectedPlatform ||
          idea.platformsSupported.includes(selectedPlatform as SocialPlatform);
        if (!matchPlat) return false;
      }

      if (selectedArchetype !== 'all' && idea.archetype !== selectedArchetype) {
        return false;
      }

      if (onlySaved && !savedIdeaIds.includes(idea.id)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          idea.title.toLowerCase().includes(q) ||
          idea.hookSpoken.toLowerCase().includes(q) ||
          idea.hookOnScreen.toLowerCase().includes(q) ||
          idea.archetypeLabel.toLowerCase().includes(q) ||
          idea.conceptSummary.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [ideas, selectedPlatform, selectedArchetype, onlySaved, savedIdeaIds, searchQuery]);

  const resetFilters = () => {
    setSelectedPlatform('all');
    setSelectedArchetype('all');
    setSearchQuery('');
    setOnlySaved(false);
  };

  const hasActiveFilters =
    selectedPlatform !== 'all' || selectedArchetype !== 'all' || searchQuery.trim() !== '' || onlySaved;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1B1152] text-white border border-[#00F5D4]/50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 text-[#00F5D4] shrink-0" />
          <span className="text-xs font-semibold">{feedbackMessage}</span>
        </div>
      )}

      {/* Workspace Header */}
      <header className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Estudio Creativo</span>
              <span aria-hidden="true">·</span>
              <span>TikTok, Reels, Shorts y LinkedIn</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#271871] font-semibold tabular-nums">{ideas.length} guiones listos</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Content Manager
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Selecciona un cliente, ajusta su propuesta y obtén guiones listos para grabar con simulación vertical 9:16 y asignación directa al equipo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRegenerateIdeas}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Actualizar formatos</span>
            </button>

            <button
              type="button"
              id="btn-generate-content-ai"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="px-4 py-2.5 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Sparkles className={`w-4 h-4 text-[#00F5D4] ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'Generando guiones...' : 'Generar ideas con IA'}</span>
            </button>
          </div>
        </div>

        {/* Guided 3-Step Flow Indicator */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#271871] text-[#00F5D4] font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
              1
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">Cliente: {profile.businessName}</p>
              <p className="text-slate-500 truncate">Define giro, producto y objetivo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
              2
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">Explora por red y formato</p>
              <p className="text-slate-500 tabular-nums">{filteredIdeas.length} opciones visibles</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
              3
            </span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">Simula, copia o agenda</p>
              <p className="text-slate-500 tabular-nums">{savedIdeaIds.length} ideas guardadas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Contexto de Marca & Brief */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden lg:sticky lg:top-6">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#271871]/10 text-[#271871] flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">01. Contexto de Marca</h2>
                <p className="text-xs text-slate-500 truncate">Fuente de datos para los guiones</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBriefEditorOpen(!isBriefEditorOpen)}
              className="lg:hidden px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isBriefEditorOpen ? 'Ocultar' : 'Editar'}</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* CRM Client Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="cm-client-select" className="text-xs font-bold text-slate-800">
                  Cliente vinculado en el CRM
                </label>
                {activeClient && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('clients')}
                    className="text-[11px] font-semibold text-[#271871] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver expediente</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
              <select
                id="cm-client-select"
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#271871] focus:outline-hidden cursor-pointer"
              >
                <option value="">Negocio independiente (personalizado)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Brief Preview (Clean surface, no nested card clutter) */}
            {activeClient && (activeClient.brief || activeClient.servicesAndProducts) && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold text-slate-700">Brief sincronizado del cliente</span>
                  {activeClient.industry && <span>{activeClient.industry}</span>}
                </div>
                {activeClient.brief && (
                  <p className="text-slate-600 leading-relaxed line-clamp-3">
                    {activeClient.brief}
                  </p>
                )}
              </div>
            )}

            {/* Editable Brief Parameters */}
            {isBriefEditorOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre comercial
                  </label>
                  <input
                    type="text"
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    placeholder="Ej. Café La Sierra"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Industria o giro
                  </label>
                  <select
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  >
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Producto o servicio principal
                  </label>
                  <textarea
                    rows={2}
                    value={profile.mainProduct}
                    onChange={(e) => setProfile({ ...profile, mainProduct: e.target.value })}
                    placeholder="Ej. Paquetes dentales, asesoría fiscal, menú ejecutivo..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#271871] focus:outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Público objetivo
                  </label>
                  <input
                    type="text"
                    value={profile.targetAudience}
                    onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                    placeholder="Ej. Dueños de PyMEs, familias jóvenes..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tono de comunicación
                    </label>
                    <select
                      value={profile.brandTone}
                      onChange={(e) => setProfile({ ...profile, brandTone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                    >
                      {BRAND_TONES.map((tone) => (
                        <option key={tone.id} value={tone.id}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Objetivo de campaña
                    </label>
                    <select
                      value={profile.campaignGoal}
                      onChange={(e) => setProfile({ ...profile, campaignGoal: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                    >
                      {CAMPAIGN_GOALS.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diferenciador clave
                  </label>
                  <input
                    type="text"
                    value={profile.keyDifferentiator}
                    onChange={(e) => setProfile({ ...profile, keyDifferentiator: e.target.value })}
                    placeholder="Ej. Garantía 30 días, entrega en 24h..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-apply-brand-profile"
                    onClick={handleRegenerateIdeas}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Aplicar cambios y actualizar guiones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Filters & Script Feed */}
        <section className="lg:col-span-8 space-y-4">
          {/* Filter & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            {/* Row 1: Platform Segmented Control */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedPlatform === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas las redes
                </button>
                {SOCIAL_PLATFORMS_DATA.map((plat) => (
                  <button
                    type="button"
                    key={plat.id}
                    onClick={() => setSelectedPlatform(plat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedPlatform === plat.id
                        ? 'bg-[#271871] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setOnlySaved(!onlySaved)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  onlySaved
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                <span>Guardadas</span>
                <span className="tabular-nums text-slate-500">({savedIdeaIds.length})</span>
              </button>
            </div>

            {/* Row 2: Search + Archetype Select */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por tema, gancho o palabra clave..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#271871] focus:outline-hidden text-slate-900"
                />
              </div>

              <div className="sm:col-span-5 flex items-center gap-2">
                <select
                  aria-label="Filtrar por formato"
                  value={selectedArchetype}
                  onChange={(e) => setSelectedArchetype(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#271871] focus:outline-hidden text-slate-800 cursor-pointer"
                >
                  <option value="all">Todos los formatos ({ideas.length})</option>
                  {TREND_ARCHETYPES.map((arch) => (
                    <option key={arch.id} value={arch.id}>
                      {arch.label}
                    </option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    title="Limpiar filtros"
                    className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ideas List Header */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <h2 className="font-bold text-slate-900 text-sm">
              02. Guiones y Conceptos ({filteredIdeas.length})
            </h2>
            <span className="hidden sm:inline">
              Haz clic en un guión para leer cada escena o abre la simulación 9:16
            </span>
          </div>

          {/* Empty State or Script Cards */}
          {filteredIdeas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                No hay guiones con los filtros actuales
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Prueba seleccionando otra red social, limpiando tu búsqueda o generando nuevas ideas con IA para {profile.businessName}.
              </p>
              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  className="px-4 py-2 bg-[#271871] hover:bg-[#342294] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Generar con IA
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIdeas.map((idea) => {
                const isSaved = savedIdeaIds.includes(idea.id);
                const isCopied = copiedId === idea.id;
                const isTaskCreated = taskCreatedId === idea.id;
                const isExpanded = expandedIdeaId === idea.id;

                return (
                  <article
                    key={idea.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors space-y-4"
                  >
                    {/* Card Header: Clean Unboxed Metadata + Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="font-bold text-[#271871]">
                            {PLATFORM_LABELS[idea.platform] || idea.platform.toUpperCase()}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{idea.archetypeLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{idea.scriptSteps.length} escenas</span>
                          {idea.aiGenerated && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-indigo-700 font-semibold">Generado con IA</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {idea.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {idea.conceptSummary}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveIdea(idea.id)}
                        className={`p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                          isSaved
                            ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                        title={isSaved ? 'Quitar de guardadas' : 'Guardar idea'}
                        aria-label={isSaved ? 'Quitar de guardadas' : 'Guardar idea'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Hook Section (Clean surface separation, zero nested box overload) */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#271871]" />
                          Gancho inicial (0s - 3s)
                        </span>
                        <span className="font-medium truncate max-w-[200px]">
                          {idea.ctaGoal}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {idea.hookSpoken}
                      </p>

                      <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-800">Texto en pantalla: </span>
                          <span>{idea.hookOnScreen}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">Acción visual: </span>
                          <span>{idea.hookVisualAction}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compact Timeline Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {idea.scriptSteps.slice(0, 4).map((step, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                          className="text-left p-2.5 rounded-xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/70 transition-colors cursor-pointer"
                        >
                          <span className="block font-mono text-[11px] font-bold text-[#271871] tabular-nums">
                            {step.timeRange}
                          </span>
                          <span className="block text-xs font-semibold text-slate-800 truncate mt-0.5">
                            {step.stepTitle}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Expandable Full Script & Production Details */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#271871]" />
                            Guión completo escena por escena
                          </h4>
                          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                            {idea.scriptSteps.map((step, idx) => (
                              <div key={idx} className="p-3.5 bg-white space-y-1.5 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-900">
                                    {idx + 1}. {step.stepTitle}
                                  </span>
                                  <span className="font-mono text-[11px] font-semibold text-[#271871] tabular-nums">
                                    {step.timeRange}
                                  </span>
                                </div>
                                <p className="text-slate-800 font-medium">
                                  "{step.spokenText}"
                                </p>
                                <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>
                                    <strong className="text-slate-700">Pantalla:</strong> {step.screenCaption}
                                  </span>
                                  <span>
                                    <strong className="text-slate-700">Visual:</strong> {step.visualCue}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <Music className="w-3.5 h-3.5 text-[#271871]" />
                              <span>Audio sugerido</span>
                            </div>
                            <p className="text-slate-700 font-medium">{idea.soundTrend.name}</p>
                            <p className="text-slate-500">Buscar: {idea.soundTrend.exampleSearch}</p>
                          </div>

                          <div className="space-y-1">
                            <div className="font-bold text-slate-800">Copy y hashtags para publicar</div>
                            <p className="text-slate-600 leading-relaxed">{idea.caption}</p>
                            <p className="text-[#271871] font-medium">{idea.hashtags.join(' ')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Card Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Ocultar guión</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Ver guión completo</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyScript(idea)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copiar guión</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateTaskFromIdea(idea)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                            isTaskCreated
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isTaskCreated ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span>{isTaskCreated ? 'Tarea creada' : 'Agendar en CRM'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSimIdea(idea)}
                        className="px-4 py-2 bg-[#271871] hover:bg-[#342294] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 text-[#00F5D4] fill-[#00F5D4]" />
                        <span>Simular Video 9:16</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Editorial Production Tips Footer */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#271871]/10 text-[#271871] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Guía rápida de grabación y retención</h3>
            <p className="text-xs text-slate-500">Buenas prácticas para mejorar el alcance orgánico de cada guión</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">01. Bucle continuo</h4>
            <p className="text-slate-600 leading-relaxed">
              Conecta la última frase con el primer segundo del video para incentivar la repetición automática y aumentar la retención.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">02. Audio cercano y natural</h4>
            <p className="text-slate-600 leading-relaxed">
              Graba con micrófono de solapa o voz clara en los primeros 2 segundos. La naturalidad genera más confianza que un locutor rígido.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">03. Subtítulos de alto contraste</h4>
            <p className="text-slate-600 leading-relaxed">
              Coloca subtítulos breves en el tercio medio-bajo resaltando palabras clave; gran parte de la audiencia inicia el video sin sonido.
            </p>
          </div>
        </div>
      </section>

      {/* Video Simulation Modal */}
      {selectedSimIdea && (
        <VideoSimulationModal
          idea={selectedSimIdea}
          profile={profile}
          onClose={() => setSelectedSimIdea(null)}
          onCreateTask={handleCreateTaskFromIdea}
        />
      )}
    </div>
  );
};
