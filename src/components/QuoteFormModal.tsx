import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Lock,
  Plus,
  X,
  ShoppingBag,
  Package,
  Search,
  Receipt,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  Quote,
  QuoteItem,
  QuoteStatus,
  Client,
  CompanyInfo,
  UserRole,
  TeamMember,
  CatalogProduct,
} from '../types';
import { formatCurrency, calculateValidUntil15Days, formatQuoteAuthorName } from '../utils/pdfGenerator';

const RAWI_LOGO_PATH = '/assets/aistudio/RAWI_Logo_PNG_8b0c4f46.png';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  required,
  className = '',
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(44, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      rows={2}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium leading-relaxed whitespace-pre-wrap break-words resize-none overflow-hidden focus:ring-2 focus:ring-[#271871] focus:border-[#271871] focus:outline-hidden bg-white ${className}`}
    />
  );
};

export interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuote: Quote | null;
  initialClientId?: string;
  initialPreselectedProduct?: CatalogProduct | null;
  clients: Client[];
  companyInfo: CompanyInfo;
  currentRole: UserRole;
  currentUser: TeamMember;
  catalogProducts?: CatalogProduct[];
  nextQuoteCode: string;
  onSave: (quoteData: Omit<Quote, 'id'>, existingId?: string, andDownloadPdf?: boolean) => void;
}

export const QuoteFormModal: React.FC<QuoteFormModalProps> = ({
  isOpen,
  onClose,
  editingQuote,
  initialClientId,
  initialPreselectedProduct,
  clients,
  companyInfo,
  currentRole,
  currentUser,
  catalogProducts = [],
  nextQuoteCode,
  onSave,
}) => {
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<string>('all');
  const [attachQuantityMap, setAttachQuantityMap] = useState<Record<string, number>>({});
  const [inlineToast, setInlineToast] = useState<string | null>(null);

  const [formClientId, setFormClientId] = useState<string>(initialClientId || clients[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState(nextQuoteCode);
  const [formStatus, setFormStatus] = useState<QuoteStatus>('draft');

  // Tax options: IVA & ISR
  const [formApplyIva, setFormApplyIva] = useState<boolean>(true);
  const [formTaxRate, setFormTaxRate] = useState<number>(16);
  const [formApplyIsr, setFormApplyIsr] = useState<boolean>(false);
  const [formIsrRate, setFormIsrRate] = useState<number>(1.25);

  const [formNotes, setFormNotes] = useState(
    companyInfo.greeting ||
      'Buen día, por este medio le hago entrega de la información solicitada sobre el precios de los servicios.'
  );
  const [formInternalCost, setFormInternalCost] = useState<string>('4500');
  const [formCreatedBy, setFormCreatedBy] = useState<string>(() => formatQuoteAuthorName(currentUser.name));
  const [formValidUntil, setFormValidUntil] = useState(() => calculateValidUntil15Days());

  const [formItems, setFormItems] = useState<QuoteItem[]>([]);

  // Synchronize form values when modal opens or editingQuote changes
  useEffect(() => {
    if (!isOpen) return;

    const activeAuthorName = formatQuoteAuthorName(currentUser.name);

    if (editingQuote) {
      setFormClientId(editingQuote.clientId || initialClientId || clients[0]?.id || '');
      setFormTitle(editingQuote.title);
      setFormCode(editingQuote.code);
      setFormStatus(editingQuote.status);
      setFormApplyIva(editingQuote.applyIva !== false);
      setFormTaxRate(editingQuote.taxRate ?? 16);
      setFormApplyIsr(Boolean(editingQuote.applyIsr));
      setFormIsrRate(editingQuote.isrRate ?? 1.25);
      setFormInternalCost(editingQuote.internalCost !== undefined ? String(editingQuote.internalCost) : '0');
      setFormNotes(editingQuote.notes || '');
      setFormValidUntil(calculateValidUntil15Days(editingQuote.createdAt));
      setFormCreatedBy(activeAuthorName);
      setFormItems(editingQuote.items.map((it) => ({ ...it })));
    } else {
      const productToAttach = initialPreselectedProduct || undefined;
      const todayIso = new Date().toISOString().split('T')[0];
      setFormClientId(initialClientId || clients[0]?.id || '');
      setFormTitle(
        productToAttach
          ? `Propuesta Comercial: ${productToAttach.name}`
          : 'Propuesta Comercial de Servicios y Soluciones'
      );
      setFormCode(nextQuoteCode);
      setFormStatus('draft');
      setFormApplyIva(productToAttach ? productToAttach.defaultTaxIva ?? true : true);
      setFormTaxRate(16);
      setFormApplyIsr(productToAttach ? productToAttach.defaultTaxIsr ?? false : false);
      setFormIsrRate(1.25);
      setFormInternalCost(productToAttach?.cost ? String(productToAttach.cost) : '4500');
      setFormNotes(
        companyInfo.greeting ||
          'Buen día, por este medio le hago entrega de la información solicitada sobre el precios de los servicios.'
      );
      setFormValidUntil(calculateValidUntil15Days(todayIso));
      setFormCreatedBy(activeAuthorName);

      if (productToAttach) {
        setFormItems([
          {
            id: `item-${Date.now()}-1`,
            description: `${productToAttach.name} [SKU: ${productToAttach.sku}] - ${productToAttach.description}`,
            quantity: 1,
            unitPrice: productToAttach.price,
            discountPercent: 0,
            subtotal: productToAttach.price,
            productId: productToAttach.id,
            sku: productToAttach.sku,
          },
        ]);
      } else {
        setFormItems([
          {
            id: `item-${Date.now()}-1`,
            description: 'Consultoría Especializada y Despliegue de Soluciones',
            quantity: 1,
            unitPrice: 15000,
            discountPercent: 0,
            subtotal: 15000,
          },
        ]);
      }
    }
  }, [isOpen, editingQuote, initialClientId, initialPreselectedProduct, nextQuoteCode, clients, companyInfo.greeting, currentUser.name]);

  // Recalculate totals in form
  const subtotal = useMemo(() => {
    return formItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [formItems]);

  const discountTotal = useMemo(() => {
    return formItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + itemTotal * (item.discountPercent / 100);
    }, 0);
  }, [formItems]);

  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxAmount = formApplyIva ? Math.round(taxableAmount * (formTaxRate / 100) * 100) / 100 : 0;
  const isrAmount = formApplyIsr ? Math.round(taxableAmount * (formIsrRate / 100) * 100) / 100 : 0;
  const total = Math.max(0, Math.round((taxableAmount + taxAmount - isrAmount) * 100) / 100);

  const costNum = parseFloat(formInternalCost) || 0;
  const calculatedMargin = total > 0 ? Math.round(((total - costNum) / total) * 100) : 0;

  const filteredCatalogItems = useMemo(() => {
    return catalogProducts.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(catalogSearch.toLowerCase());

      const matchType = catalogTypeFilter === 'all' || item.type === catalogTypeFilter;
      return matchSearch && matchType;
    });
  }, [catalogProducts, catalogSearch, catalogTypeFilter]);

  if (!isOpen) return null;

  const addItemRow = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      quantity: 1,
      unitPrice: 1000,
      discountPercent: 0,
      subtotal: 1000,
    };
    setFormItems([...formItems, newItem]);
  };

  const updateItemRow = (id: string, field: keyof QuoteItem, value: any) => {
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const q = field === 'quantity' ? Math.max(1, Number(value) || 1) : updated.quantity;
        const p = field === 'unitPrice' ? Math.max(0, Number(value) || 0) : updated.unitPrice;
        const d =
          field === 'discountPercent' ? Math.min(100, Math.max(0, Number(value) || 0)) : updated.discountPercent;
        const rowSub = q * p * (1 - d / 100);
        updated.subtotal = Math.round(rowSub * 100) / 100;
        return updated;
      })
    );
  };

  const removeItemRow = (id: string) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((item) => item.id !== id));
  };

  const handleAttachProductFromCatalog = (product: CatalogProduct) => {
    const qty = attachQuantityMap[product.id] || 1;
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: `${product.name} [SKU: ${product.sku}] - ${product.description}`,
      quantity: Math.max(1, qty),
      unitPrice: product.price,
      discountPercent: 0,
      subtotal: product.price * Math.max(1, qty),
      productId: product.id,
      sku: product.sku,
    };

    setFormItems((prev) => [...prev, newItem]);

    if (product.defaultTaxIsr && !formApplyIsr) {
      setFormApplyIsr(true);
    }

    if (product.cost) {
      const currentCost = parseFloat(formInternalCost) || 0;
      setFormInternalCost(String(currentCost + product.cost * qty));
    }

    setIsCatalogPickerOpen(false);
    setInlineToast(`"${product.name}" anexado a la cotización.`);
    setTimeout(() => setInlineToast(null), 3000);
  };

  const handleSubmit = (andDownloadPdf: boolean = false) => {
    const client = clients.find((c) => c.id === formClientId) || clients[0];
    if (!client) return;

    const createdAtIso = editingQuote?.createdAt || new Date().toISOString().split('T')[0];

    const quoteData: Omit<Quote, 'id'> = {
      code: formCode,
      title: formTitle.trim() || 'Cotización de Soluciones',
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.company,
      clientEmail: client.email,
      clientPhone: client.phone,
      clientAddress: client.address,
      clientTaxId: client.rfc || editingQuote?.clientTaxId,
      clientPostalCode: client.postalCode || editingQuote?.clientPostalCode,
      clientTaxRegime: client.taxRegime || editingQuote?.clientTaxRegime,
      items: formItems,
      subtotal,
      discountTotal,
      applyIva: formApplyIva,
      taxRate: formApplyIva ? formTaxRate : 0,
      taxAmount,
      applyIsr: formApplyIsr,
      isrRate: formApplyIsr ? formIsrRate : 0,
      isrAmount,
      total,
      status: formStatus,
      notes: formNotes,
      internalCost: costNum,
      targetMarginPercent: calculatedMargin,
      createdAt: createdAtIso,
      validUntil: calculateValidUntil15Days(createdAtIso),
      createdBy: formatQuoteAuthorName(formCreatedBy || currentUser.name),
    };

    onSave(quoteData, editingQuote?.id, andDownloadPdf);
  };

  return (
    <>
      {/* MODAL: Crear / Editar Cotización Comercial */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-[#120A38]/75 backdrop-blur-xs">
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
          {/* Sticky Modal Header */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#271871] text-[#00F5D4] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                  {editingQuote ? `Editar Cotización Comercial (${editingQuote.code})` : 'Crear Nueva Cotización Comercial'}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  Precios expresados en Pesos Mexicanos (MXN) con desglose fiscal personalizable.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0 transition-colors"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-xs">
            {inlineToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{inlineToast}</span>
              </div>
            )}

            {/* Emisor / Datos de RAWI Marketing Digital con Logo */}
            <div className="p-3 sm:p-3.5 bg-[#271871] text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border-b-2 border-[#00F5D4]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                  <img
                    src={RAWI_LOGO_PATH}
                    alt={companyInfo.name}
                    className="h-7 sm:h-8 w-auto object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-white text-xs leading-snug truncate">
                    {companyInfo.name}
                  </h4>
                  <p className="text-[10px] text-indigo-100 mt-0.5 break-words">
                    {companyInfo.address} • Tel: {companyInfo.phone}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-[#00F5D4] font-semibold sm:text-right shrink-0">
                <div>{companyInfo.email}</div>
                <div className="text-indigo-200">{companyInfo.website}</div>
              </div>
            </div>

            {/* Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Prospecto / Cliente Receptor *
                </label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden bg-white font-medium"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} ({c.name}) - {c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Folio de Cotización
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Título del Proyecto o Propuesta Comercial *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Suministro e Implementación del Sistema de Gestión"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden font-medium"
              />
            </div>

            {/* Items Table Builder with Tienda Annex Button */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#271871]" />
                  Conceptos, Productos y Servicios a Cotizar
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {catalogProducts.length > 0 && (
                    <button
                      type="button"
                      id="btn-annex-from-store"
                      onClick={() => setIsCatalogPickerOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Anexar desde Tienda / Catálogo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Concepto Manual
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 min-w-[260px] w-[46%]">Descripción de la Solución</th>
                      <th className="p-2.5 w-16 text-center">Cant.</th>
                      <th className="p-2.5 w-28 text-right">P. Unitario ($ MXN)</th>
                      <th className="p-2.5 w-16 text-center">Desc %</th>
                      <th className="p-2.5 w-28 text-right">Subtotal</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 align-top">
                        <td className="p-2">
                          <AutoResizeTextarea
                            required
                            value={item.description}
                            onChange={(val) => updateItemRow(item.id, 'description', val)}
                            placeholder="Descripción del entregable o solución comercial..."
                          />
                          {item.sku && (
                            <span className="text-[10px] text-[#271871] font-mono font-bold mt-1 inline-block bg-indigo-50 px-1.5 py-0.5 rounded">
                              SKU: {item.sku}
                            </span>
                          )}
                        </td>
                        <td className="p-2 pt-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemRow(item.id, 'quantity', e.target.value)}
                            className="w-full px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-bold bg-white"
                          />
                        </td>
                        <td className="p-2 pt-2.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.unitPrice}
                            onChange={(e) => updateItemRow(item.id, 'unitPrice', e.target.value)}
                            className="w-full px-1.5 py-1.5 border border-slate-200 rounded-lg text-xs text-right font-black bg-white"
                          />
                        </td>
                        <td className="p-2 pt-2.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent}
                            onChange={(e) => updateItemRow(item.id, 'discountPercent', e.target.value)}
                            className="w-full px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-medium bg-white"
                          />
                        </td>
                        <td className="p-2 pt-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="p-2 pt-2.5 text-center">
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Eliminar concepto"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fiscal settings: Optional I.V.A. and Optional I.S.R. */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#271871]" />
                  <span className="font-bold text-slate-900 text-xs">
                    Selección Fiscal e Impuestos del Prospecto (Pesos Mexicanos MXN)
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Moneda Oficial: MXN ($)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: I.V.A. Toggle */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    formApplyIva ? 'bg-blue-50/70 border-blue-200 text-blue-950' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold text-xs cursor-pointer select-none">
                      <input
                        id="quote-tax-iva-toggle"
                        type="checkbox"
                        checked={formApplyIva}
                        onChange={(e) => setFormApplyIva(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>¿Requiere I.V.A. el prospecto?</span>
                    </label>
                    {formApplyIva && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        +{formatCurrency(taxAmount)}
                      </span>
                    )}
                  </div>

                  {formApplyIva ? (
                    <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600 font-medium">Tasa de I.V.A.:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormTaxRate(16)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            formTaxRate === 16
                              ? 'bg-[#271871] text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          16% (General)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormTaxRate(8)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            formTaxRate === 8
                              ? 'bg-[#271871] text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          8% (Frontera)
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formTaxRate}
                            onChange={(e) => setFormTaxRate(Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border border-blue-300 rounded text-center text-[11px] font-bold bg-white"
                          />
                          <span className="font-bold text-slate-600">%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Cotización sin I.V.A. (tasa 0% o exento de impuestos directos).
                    </p>
                  )}
                </div>

                {/* Option 2: I.S.R. Retención Toggle */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    formApplyIsr
                      ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold text-xs cursor-pointer select-none">
                      <input
                        id="quote-tax-isr-toggle"
                        type="checkbox"
                        checked={formApplyIsr}
                        onChange={(e) => setFormApplyIsr(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>¿Requiere Retención de I.S.R.?</span>
                    </label>
                    {formApplyIsr && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        -{formatCurrency(isrAmount)}
                      </span>
                    )}
                  </div>

                  {formApplyIsr ? (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-600 font-medium">Tasa retención:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormIsrRate(1.25)}
                          title="Régimen Simplificado de Confianza (RESICO)"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            formIsrRate === 1.25
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          1.25% (RESICO)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormIsrRate(10)}
                          title="Honorarios y Servicios Profesionales PM a PF"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            formIsrRate === 10
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          10% (Honorarios)
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="0.05"
                            max="100"
                            value={formIsrRate}
                            onChange={(e) => setFormIsrRate(Number(e.target.value))}
                            className="w-14 px-1 py-0.5 border border-amber-300 rounded text-center text-[11px] font-bold bg-white"
                          />
                          <span className="font-bold text-slate-600">%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                      Sin retención fiscal de ISR para este prospecto.
                    </p>
                  )}
                </div>
              </div>

              {/* Financial Totals & Margin Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                {/* Admin Internal Cost and Margin */}
                {currentRole === 'admin' ? (
                  <div className="space-y-2 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <div className="flex items-center space-x-1 text-amber-900 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Cálculo Confidencial de Margen (Solo Admin)</span>
                    </div>
                    <p className="text-[10px] text-amber-800">
                      Costo directo estimado para conocer tu margen de utilidad antes de exportar.
                    </p>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-amber-900 block">
                          Costo Interno ($ MXN):
                        </label>
                        <input
                          type="number"
                          value={formInternalCost}
                          onChange={(e) => setFormInternalCost(e.target.value)}
                          className="w-full px-2 py-1 border border-amber-300 rounded-lg bg-white text-xs font-black text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-amber-900 block">
                          Margen Estimado:
                        </span>
                        <span className="text-base font-extrabold text-amber-900">
                          {calculatedMargin}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 text-[11px]">
                    Resumen financiero calculado automáticamente en pesos mexicanos (MXN).
                  </div>
                )}

                {/* Customer Totals Breakdown */}
                <div className="space-y-1 text-xs text-right bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Bruto:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Descuento Comercial:</span>
                      <span className="font-semibold text-rose-600">-{formatCurrency(discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Base Gravable:</span>
                    <span className="font-bold">{formatCurrency(taxableAmount)}</span>
                  </div>
                  {formApplyIva ? (
                    <div className="flex justify-between text-blue-700 font-medium">
                      <span>(+) I.V.A. ({formTaxRate}%):</span>
                      <span className="font-bold">+{formatCurrency(taxAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-400">
                      <span>I.V.A. (Exento / Tasa 0%):</span>
                      <span>$0.00 MXN</span>
                    </div>
                  )}
                  {formApplyIsr ? (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>(-) Retención I.S.R. ({formIsrRate}%):</span>
                      <span className="font-bold">-{formatCurrency(isrAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>TOTAL OFICIAL (MXN):</span>
                    <span className="text-[#271871]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status, 15-Day Validity & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estado de la Cotización
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as QuoteStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden bg-white font-medium"
                >
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada al Cliente</option>
                  <option value="approved">Aprobada</option>
                  <option value="rejected">Rechazada</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Vigencia de la Oferta
                  </label>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-[#271871] border border-indigo-200">
                    15 días fijos
                  </span>
                </div>
                <input
                  id="quote-form-valid-until"
                  type="date"
                  readOnly
                  value={formValidUntil}
                  title="Todas las cotizaciones tienen una vigencia estándar de 15 días naturales"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Elaborado por
                </label>
                <input
                  id="quote-form-created-by"
                  type="text"
                  required
                  value={formCreatedBy}
                  onChange={(e) => setFormCreatedBy(e.target.value)}
                  placeholder="Nombre del usuario"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Notas Adicionales (Opcional)
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Instrucciones bancarias SPEI, garantías o notas de entrega..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#271871] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/90 flex flex-wrap items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white rounded-xl text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
            >
              {editingQuote ? 'Guardar Cambios' : 'Guardar Cotización'}
            </button>
            <button
              type="button"
              id="btn-save-and-download-pdf"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 bg-[#271871] hover:bg-[#342294] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-[#00F5D4]" />
              <span>Guardar y Descargar PDF (MXN)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Catalog Picker (Anexar desde Tienda / Catálogo) */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Catálogo de Tienda — Seleccionar Producto o Servicio
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selecciona una solución para anexarla automáticamente con sus precios en Pesos Mexicanos (MXN).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, SKU, categoría o palabra clave..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['all', 'servicio', 'producto', 'paquete', 'suscripcion'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCatalogTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      catalogTypeFilter === t
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'all' && 'Todos'}
                    {t === 'servicio' && 'Servicios'}
                    {t === 'producto' && 'Productos Físicos'}
                    {t === 'paquete' && 'Paquetes'}
                    {t === 'suscripcion' && 'SaaS / Licencias'}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Items Scrollable List */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1 divide-y divide-slate-100">
              {filteredCatalogItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No se encontraron productos o servicios con este criterio.
                </div>
              ) : (
                filteredCatalogItems.map((item) => {
                  const currentQty = attachQuantityMap[item.id] || 1;

                  return (
                    <div
                      key={item.id}
                      className="pt-2.5 pb-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.sku}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {item.category}
                          </span>
                          {item.defaultTaxIsr && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">
                              Aplica ISR
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-[10px] text-slate-400">/ {item.unit}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setAttachQuantityMap((prev) => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-12 px-1.5 py-1 border border-slate-300 rounded-lg text-xs text-center font-bold"
                            title="Cantidad a anexar"
                          />

                          <button
                            type="button"
                            onClick={() => handleAttachProductFromCatalog(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Anexar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
