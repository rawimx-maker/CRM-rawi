export type UserRole = 'admin' | 'colaborador' | 'project_manager' | 'cliente';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  position: string;
  avatar: string;
  phone?: string;
  activeColor: string;
  password?: string;
  clientId?: string; // Links client users to their Client company record
}

export type ClientStage = 'lead' | 'contacted' | 'negotiation' | 'customer' | 'inactive';

export type SocialPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin';

export interface ClientBrief {
  industry: string; // Giro comercial (ej. "Restaurantes & Gastronomía", "Logística y Transporte", "FinTech & Crédito", etc.)
  servicesAndProducts: string; // Servicios y productos clave que ofrece el cliente
  brief: string; // Brief detallado de la empresa, historia, propuesta de valor, posicionamiento
  targetAudience: string; // Público objetivo / Buyer Persona
  brandTone: string; // Tono de comunicación: viral_divertido, profesional_corporativo, educativo_autoridad, aspiracional_lujo
  campaignGoal: string; // Objetivo de campaña: leads_whatsapp, ventas_ecommerce, posicionamiento_marca, visitas_local, agendar_citas
  differentiator: string; // Diferenciador clave / Ventaja competitiva única
  preferredPlatforms?: SocialPlatform[];
  socialHandles?: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    website?: string;
  };
  notesForContent?: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: ClientStage;
  assignedToId: string;
  estimatedValue: number;
  address?: string;
  city?: string;
  rfc?: string;
  postalCode?: string;
  taxRegime?: string;
  notes?: string;
  createdAt: string;
  // Contexto del Cliente & Brief de Marca
  industry?: string;
  servicesAndProducts?: string;
  brief?: string;
  targetAudience?: string;
  brandTone?: string;
  campaignGoal?: string;
  differentiator?: string;
  preferredPlatforms?: SocialPlatform[];
  clientBrief?: ClientBrief;
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  value: number;
  stage: DealStage;
  assignedToId: string;
  expectedCloseDate: string;
  probability: number;
  notes?: string;
  updatedAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId?: string;
  clientName?: string;
  assignedToId: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 to 100%
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal: number;
  productId?: string;
  sku?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface Quote {
  id: string;
  code: string;
  title: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientTaxId?: string;
  clientPostalCode?: string;
  clientTaxRegime?: string;
  items: QuoteItem[];
  subtotal: number;
  discountTotal: number;
  applyIva?: boolean; // Optional: whether prospect requires IVA
  taxRate: number; // e.g. 16 for 16% IVA
  taxAmount: number;
  applyIsr?: boolean; // Optional: whether prospect requires ISR retention
  isrRate?: number; // e.g. 1.25 for RESICO, 10 for honorarios
  isrAmount?: number; // Retención de ISR restada
  total: number; // Final total in MXN
  status: QuoteStatus;
  notes?: string;
  terms?: string;
  internalCost?: number; // admin-only internal estimation
  targetMarginPercent?: number; // admin-only margin calculation
  createdAt: string;
  validUntil: string;
  createdBy: string;
}

export type CatalogItemType = 'producto' | 'servicio' | 'paquete' | 'suscripcion';

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: CatalogItemType;
  description: string;
  price: number; // en pesos mexicanos (MXN)
  cost?: number; // costo interno en MXN
  unit: string; // ej. 'unidad', 'mes', 'hora', 'proyecto', 'licencia', 'paquete'
  defaultTaxIva?: boolean; // Requiere IVA por defecto
  defaultTaxIsr?: boolean; // Requiere ISR por defecto
  stock?: number | null; // inventario para productos físicos
  isActive: boolean;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  taxId: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  greeting?: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignedToId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  progress: number; // 0 to 100%
  completedAt?: string;
}

export interface ProjectComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  isClientObservation?: boolean;
}

export interface ProjectDownloadLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'deliverable' | 'contract' | 'asset' | 'doc' | 'material' | 'other';
  fileType?: string;
  fileSize?: string;
  addedAt: string;
  addedByName: string;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  concept: string;
  amount: number;
  date: string;
  method: 'Transferencia bancaria' | 'Tarjeta de crédito / Débito' | 'SPEI' | 'Efectivo' | 'Otro';
  status: 'completado' | 'pendiente' | 'facturado';
  reference?: string;
  invoiceUrl?: string;
  notes?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  budget?: number;
  assignedMemberIds: string[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
  downloadLinks: ProjectDownloadLink[];
  payments?: ProjectPayment[];
  createdAt: string;
  googleCalendarEventId?: string;
}

// Content Manager & Viral Trends Types

export type TrendArchetype = 
  | 'pov' 
  | '3_errores' 
  | 'antes_despues' 
  | 'detras_camaras' 
  | 'asmr_proceso' 
  | 'skit_humor' 
  | 'mito_realidad' 
  | 'reto_viral';

export interface ScriptStep {
  timeRange: string;
  stepTitle: string;
  description: string;
  spokenText: string;
  visualCue: string;
  screenCaption: string;
}

export interface SoundTrend {
  name: string;
  type: 'synth_beat' | 'lofi_chill' | 'comedy_audio' | 'suspense_rising' | 'pop_upbeat' | 'acoustic_guitar';
  vibe: string;
  exampleSearch: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  niche: string;
  archetype: TrendArchetype;
  archetypeLabel: string;
  platform: SocialPlatform;
  platformsSupported: SocialPlatform[];
  viralScore: number; // 0 to 100
  hookSpoken: string;
  hookOnScreen: string;
  hookVisualAction: string;
  conceptSummary: string;
  scriptSteps: ScriptStep[];
  soundTrend: SoundTrend;
  caption: string;
  hashtags: string[];
  recordingTips: string[];
  ctaGoal: string;
  aiGenerated?: boolean;
}

export interface BusinessContentProfile {
  id: string;
  clientId?: string;
  businessName: string;
  industry: string;
  targetAudience: string;
  mainProduct: string;
  brandTone: string;
  campaignGoal: string;
  keyDifferentiator: string;
  preferredPlatforms: SocialPlatform[];
  updatedAt: string;
}

