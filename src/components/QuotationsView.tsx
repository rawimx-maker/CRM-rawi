import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Lock, 
  Plus, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Building, 
  X, 
  Check,
  LayoutList,
  LayoutGrid,
  User,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { Quote, QuoteStatus, Client, CompanyInfo, UserRole, TeamMember, CatalogProduct } from '../types';
import { formatCurrency, generateQuotePDF, formatQuoteAuthorName } from '../utils/pdfGenerator';
import { QuoteFormModal } from './QuoteFormModal';

interface QuotationsViewProps {
  quotes: Quote[];
  clients: Client[];
  companyInfo: CompanyInfo;
  currentRole: UserRole;
  currentUser: TeamMember;
  onSelectAdminUser: () => void;
  onAddQuote: (quote: Omit<Quote, 'id'>) => void;
  onUpdateQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  catalogProducts?: CatalogProduct[];
  initialPreselectedProduct?: CatalogProduct | null;
  onClearPreselectedProduct?: () => void;
}

const RAWI_LOGO_PATH = '/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; badge: string }> = {
  draft: { label: 'Borrador', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  sent: { label: 'Enviada al Cliente', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  approved: { label: 'Aprobada / Firmada', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rechazada', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotes,
  clients,
  companyInfo,
  currentRole,
  currentUser,
  onSelectAdminUser,
  onAddQuote,
  onUpdateQuote,
  onDeleteQuote,
  catalogProducts = [],
  initialPreselectedProduct,
  onClearPreselectedProduct,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title_az' | 'title_za' | 'client_az' | 'client_za'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [preselectedProduct, setPreselectedProduct] = useState<CatalogProduct | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Handle incoming preselected product from Store
  useEffect(() => {
    if (initialPreselectedProduct) {
      setEditingQuote(null);
      setPreselectedProduct(initialPreselectedProduct);
      setIsModalOpen(true);
      if (onClearPreselectedProduct) {
        onClearPreselectedProduct();
      }
    }
  }, [initialPreselectedProduct, onClearPreselectedProduct]);

  // If user is NOT admin, show restricted view
  if (currentRole !== 'admin') {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Confidencial — Solo Administrador
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Acceso Restringido a Cotizaciones
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Actualmente tienes sesión iniciada como <strong>{currentUser.name}</strong> ({currentUser.position}). 
              El módulo de cotizaciones contiene costos internos, cálculo de márgenes comerciales y emisión de propuestas oficiales en PDF protegidas para el Administrador.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="switch-to-admin-btn"
              onClick={onSelectAdminUser}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Cambiar a perfil Administrador (Administrador RAWI)
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Haz clic para probar la creación de cotizaciones y descarga en PDF.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  const openNewQuoteModal = (productToAttach?: CatalogProduct) => {
    setEditingQuote(null);
    setPreselectedProduct(productToAttach || null);
    setIsModalOpen(true);
  };

  const openEditQuoteModal = (quote: Quote) => {
    setPreselectedProduct(null);
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleSaveQuote = (quoteData: Omit<Quote, 'id'>, existingId?: string, andDownloadPdf: boolean = false) => {
    if (existingId) {
      const updated: Quote = {
        ...quoteData,
        id: existingId,
      };
      onUpdateQuote(updated);
      setDownloadSuccessToast(`Cotización ${updated.code} actualizada con éxito.`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);
      if (andDownloadPdf) {
        handleDownloadPdf(updated);
      }
    } else {
      const newQuote: Quote = {
        ...quoteData,
        id: `quote-${Date.now()}`,
      };
      onAddQuote(quoteData);
      setDownloadSuccessToast(`Cotización ${quoteData.code} creada con éxito.`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);
      if (andDownloadPdf) {
        handleDownloadPdf(newQuote);
      }
    }

    setIsModalOpen(false);
    setPreselectedProduct(null);
  };

  const handleDownloadPdf = async (quote: Quote) => {
    try {
      await generateQuotePDF(quote, companyInfo);
      setDownloadSuccessToast(`Se ha descargado la cotización ${quote.code} en PDF.`);
      setTimeout(() => setDownloadSuccessToast(null), 4000);
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
  };

  const handleConfirmDeleteQuote = () => {
    if (!quoteToDelete) return;
    onDeleteQuote(quoteToDelete.id);
    if (previewQuote?.id === quoteToDelete.id) {
      setPreviewQuote(null);
    }
    setDownloadSuccessToast(`Cotización ${quoteToDelete.code} eliminada correctamente.`);
    setTimeout(() => setDownloadSuccessToast(null), 3500);
    setQuoteToDelete(null);
  };

  const filteredQuotes = quotes
    .filter(q => {
      if (selectedStatus === 'all') return true;
      return q.status === selectedStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'title_az') {
        return (a.title || a.code).localeCompare(b.title || b.code, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'title_za') {
        return (b.title || b.code).localeCompare(a.title || a.code, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'client_az') {
        return (a.clientCompany || a.clientName).localeCompare(b.clientCompany || b.clientName, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'client_za') {
        return (b.clientCompany || b.clientName).localeCompare(a.clientCompany || a.clientName, 'es', { sensitivity: 'base' });
      }
      const dateCompare = (a.createdAt || '').localeCompare(b.createdAt || '');
      if (dateCompare !== 0) {
        return sortBy === 'newest' ? -dateCompare : dateCompare;
      }
      const aNum = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
      return sortBy === 'newest' ? bNum - aNum : aNum - bNum;
    });

  const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);
  const avgMargin = quotes.length > 0 
    ? Math.round(quotes.reduce((sum, q) => sum + (q.targetMarginPercent || 50), 0) / quotes.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs border border-blue-500 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{downloadSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Cotizaciones Comerciales & Exportación
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                MXN ($)
              </span>
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Solo Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera propuestas con productos y servicios de la Tienda, selección de IVA/ISR y descarga en PDF oficial.
          </p>
        </div>

        <button
          id="btn-create-new-quote"
          onClick={() => openNewQuoteModal()}
          className="px-3.5 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-[#00F5D4]" />
          <span>Crear Nueva Cotización Comercial</span>
        </button>
      </div>

      {/* Admin KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total en Cotizaciones (MXN)
          </span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">
            {formatCurrency(totalQuoted)}
          </span>
          <span className="text-[10px] text-slate-500">{quotes.length} documentos emitidos</span>
        </div>

        <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Aprobadas / Ganadas
          </span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">
            {quotes.filter(q => q.status === 'approved').length}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {formatCurrency(quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.total, 0))}
          </span>
        </div>

        <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Enviadas / En Negociación
          </span>
          <span className="text-xl font-black text-blue-700 mt-0.5 block">
            {quotes.filter(q => q.status === 'sent').length}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold">Esperando firma del cliente</span>
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Margen Confidencial
            </span>
            <Lock className="w-3 h-3 text-amber-600" />
          </div>
          <span className="text-xl font-black text-amber-900 mt-0.5 block">
            {avgMargin}%
          </span>
          <span className="text-[10px] text-amber-700 font-semibold">Utilidad promedio estimada</span>
        </div>
      </div>

      {/* Filter Tabs & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-[#271871] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todas ({quotes.length})
          </button>
          {(['approved', 'sent', 'draft', 'rejected'] as QuoteStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#271871] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {STATUS_CONFIG[st].label} ({quotes.filter(q => q.status === st).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#271871] shrink-0" />
            <select
              id="select-quotes-sort"
              aria-label="Ordenar cotizaciones"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title_az' | 'title_za' | 'client_az' | 'client_za')}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer pr-1"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="title_az">Alfabético (A - Z)</option>
              <option value="title_za">Alfabético (Z - A)</option>
              <option value="client_az">Cliente (A - Z)</option>
              <option value="client_za">Cliente (Z - A)</option>
            </select>
          </div>

          <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
            <button
              type="button"
              id="btn-quotes-view-list"
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
              id="btn-quotes-view-grid"
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

      {/* Quotes List or Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No hay cotizaciones en esta categoría</p>
          <p className="text-xs text-slate-500 mt-1">Crea una nueva cotización comercial.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <div className="col-span-3">Folio y Propuesta</div>
            <div className="col-span-2">Cliente Receptor</div>
            <div className="col-span-2">Elaborado por / Vigencia</div>
            <div className="col-span-2">Estado e Impuestos</div>
            <div className="col-span-1 text-right">Total (MXN)</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredQuotes.map((quote) => {
              const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
              const authorDisplay = formatQuoteAuthorName(quote.createdBy);

              return (
                <div
                  key={quote.id}
                  className="p-4 lg:px-4 lg:py-3.5 hover:bg-indigo-50/35 transition-colors flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-3"
                >
                  {/* Col 1: Folio y Título */}
                  <div className="lg:col-span-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-[#271871] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
                        {quote.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {quote.items.length} {quote.items.length === 1 ? 'concepto' : 'conceptos'}
                      </span>
                    </div>
                    <h3
                      onClick={() => setPreviewQuote(quote)}
                      className="font-bold text-sm text-slate-900 hover:text-[#271871] mt-1 leading-snug line-clamp-1 cursor-pointer transition-colors"
                      title={quote.title}
                    >
                      {quote.title}
                    </h3>
                  </div>

                  {/* Col 2: Cliente Receptor */}
                  <div className="lg:col-span-2 min-w-0 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{quote.clientCompany}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate pl-5">{quote.clientName}</p>
                  </div>

                  {/* Col 3: Elaborado por & Vigencia 15 días */}
                  <div className="lg:col-span-2 min-w-0 text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <User className="w-3.5 h-3.5 text-[#271871] shrink-0" />
                      <span className="truncate" title={`Elaborado por: ${authorDisplay}`}>
                        {authorDisplay}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        Vence: <strong className="text-slate-700">{quote.validUntil}</strong> (15d)
                      </span>
                    </div>
                  </div>

                  {/* Col 4: Estado & Impuestos */}
                  <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                    {quote.applyIva !== false && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> IVA {quote.taxRate || 16}%
                      </span>
                    )}
                    {quote.applyIsr && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> ISR {quote.isrRate || 1.25}%
                      </span>
                    )}
                  </div>

                  {/* Col 5: Total Neto & Margen Admin */}
                  <div className="lg:col-span-1 flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-1">
                    <span className="font-black text-sm text-slate-900 whitespace-nowrap">
                      {formatCurrency(quote.total)}
                    </span>
                    {quote.targetMarginPercent !== undefined && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70 inline-flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5 text-amber-600" /> {quote.targetMarginPercent}%
                      </span>
                    )}
                  </div>

                  {/* Col 6: Acciones */}
                  <div className="lg:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewQuote(quote)}
                      title="Ver vista previa"
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditQuoteModal(quote)}
                      title="Editar cotización"
                      className="p-1.5 text-slate-500 hover:text-[#271871] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`btn-export-pdf-${quote.code}`}
                      onClick={() => handleDownloadPdf(quote)}
                      title="Descargar documento oficial en formato PDF"
                      className="px-2.5 py-1 bg-[#271871] hover:bg-[#342294] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00F5D4]" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuoteToDelete(quote)}
                      title="Eliminar cotización"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredQuotes.map((quote) => {
            const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;

            return (
              <div
                key={quote.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        {quote.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1 leading-snug line-clamp-1">
                        {quote.title}
                      </h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{quote.clientCompany}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Contacto: {quote.clientName}</p>
                    <p className="text-slate-500 text-[11px]">Elaborado por: <strong className="text-slate-700">{formatQuoteAuthorName(quote.createdBy)}</strong></p>
                    <p className="text-slate-500 text-[11px]">Vence: {quote.validUntil} (15 días)</p>
                  </div>

                  {/* Tax Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {quote.applyIva !== false && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> IVA {quote.taxRate || 16}%
                      </span>
                    )}
                    {quote.applyIsr && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Ret. ISR {quote.isrRate || 1.25}%
                      </span>
                    )}
                  </div>

                  {/* Financials & Confidential Admin Metric */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Total Neto (MXN)
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(quote.total)}
                      </span>
                    </div>

                    {/* Admin Confidential Box */}
                    {quote.targetMarginPercent !== undefined && (
                      <div className="text-right bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                        <span className="text-[9px] font-bold text-amber-800 uppercase flex items-center justify-end gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Margen Admin
                        </span>
                        <span className="text-xs font-bold text-amber-900">
                          {quote.targetMarginPercent}%
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                    {quote.items.length} conceptos incluidos
                  </p>
                </div>

                {/* Actions: Export to PDF */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPreviewQuote(quote)}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                    <button
                      onClick={() => openEditQuoteModal(quote)}
                      title="Editar cotización"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      id={`btn-export-pdf-${quote.code}`}
                      onClick={() => handleDownloadPdf(quote)}
                      title="Descargar documento oficial en formato PDF"
                      className="px-3 py-1 bg-[#271871] hover:bg-[#342294] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00F5D4]" />
                      <span>PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuoteToDelete(quote)}
                      title="Eliminar cotización"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear / Editar Cotización Comercial + Catálogo */}
      <QuoteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedProduct(null);
        }}
        editingQuote={editingQuote}
        initialPreselectedProduct={preselectedProduct}
        clients={clients}
        companyInfo={companyInfo}
        currentRole={currentRole}
        currentUser={currentUser}
        catalogProducts={catalogProducts}
        nextQuoteCode={`COT-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`}
        onSave={handleSaveQuote}
      />

      {/* MODAL: Preview Quote */}
      {previewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#120A38]/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            {/* Sticky Preview Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-[#271871] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {previewQuote.code}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1 truncate">
                  {previewQuote.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewQuote(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
              {/* Emisor y Cliente en Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#271871] text-white rounded-xl space-y-1.5 border-b-2 border-[#00F5D4]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#00F5D4]">Emisor:</span>
                    <div className="bg-white px-2 py-0.5 rounded-md">
                      <img src={RAWI_LOGO_PATH} alt={companyInfo.name} className="h-5 w-auto object-contain" />
                    </div>
                  </div>
                  <p className="font-bold text-white text-xs">{companyInfo.name}</p>
                  <p className="text-[11px] text-indigo-100">{companyInfo.address}</p>
                  <p className="text-[11px] text-indigo-100">Tel: {companyInfo.phone} • {companyInfo.email}</p>
                  <p className="text-[11px] text-[#00F5D4]">{companyInfo.website}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-700">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Cliente Receptor:</div>
                  <p className="font-bold text-slate-900 text-xs">{previewQuote.clientCompany}</p>
                  <p className="text-[11px]">Contacto: <strong>{previewQuote.clientName}</strong></p>
                  <p className="text-[11px] text-slate-500 break-words">{previewQuote.clientEmail} {previewQuote.clientPhone ? `• ${previewQuote.clientPhone}` : ''}</p>
                  {(previewQuote.clientTaxId || previewQuote.clientPostalCode || previewQuote.clientTaxRegime) && (
                    <p className="text-[11px] text-slate-600 break-words">
                      {previewQuote.clientTaxId && <>RFC: <strong className="font-mono">{previewQuote.clientTaxId}</strong></>}
                      {previewQuote.clientPostalCode && <> {previewQuote.clientTaxId ? '• ' : ''}C.P. <strong className="font-mono">{previewQuote.clientPostalCode}</strong></>}
                      {previewQuote.clientTaxRegime && <> • {previewQuote.clientTaxRegime}</>}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">Vigencia (15 días): <strong>{previewQuote.validUntil}</strong></p>
                  <p className="text-[11px] text-slate-500">Elaborado por: <strong>{formatQuoteAuthorName(previewQuote.createdBy)}</strong></p>
                </div>
              </div>

              {previewQuote.notes && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[#271871] text-xs italic">
                  "{previewQuote.notes}"
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Desglose de Conceptos:</h4>
                <div className="space-y-2">
                  {previewQuote.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 block whitespace-pre-wrap break-words leading-relaxed">{item.description}</span>
                        <span className="text-slate-400 block text-[11px] mt-1">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                          {item.discountPercent > 0 && ` (Desc. ${item.discountPercent}%)`}
                        </span>
                      </div>
                      <span className="font-black text-slate-900 shrink-0 whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-slate-200 text-right space-y-1">
                <div className="text-slate-600">Subtotal Bruto: {formatCurrency(previewQuote.subtotal)}</div>
                {previewQuote.discountTotal > 0 && (
                  <div className="text-rose-600">Descuento: -{formatCurrency(previewQuote.discountTotal)}</div>
                )}
                {previewQuote.applyIva !== false && previewQuote.taxAmount > 0 && (
                  <div className="text-blue-700 font-semibold">
                    (+) IVA ({previewQuote.taxRate}%): +{formatCurrency(previewQuote.taxAmount)}
                  </div>
                )}
                {previewQuote.applyIsr && previewQuote.isrAmount && previewQuote.isrAmount > 0 && (
                  <div className="text-amber-700 font-semibold">
                    (-) Retención ISR ({previewQuote.isrRate || 1.25}%): -{formatCurrency(previewQuote.isrAmount)}
                  </div>
                )}
                <div className="text-base font-black text-[#271871] pt-1 border-t border-slate-200">
                  Total Neto (MXN): {formatCurrency(previewQuote.total)}
                </div>
              </div>
            </div>

            {/* Sticky Preview Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setPreviewQuote(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  handleDownloadPdf(previewQuote);
                  setPreviewQuote(null);
                }}
                className="px-4 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#00F5D4]" />
                Descargar PDF Oficial (MXN)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmación para Eliminar Cotización */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#120A38]/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  ¿Eliminar esta cotización?
                </h3>
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
                id="btn-confirm-delete-quote"
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
