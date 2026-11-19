import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  Tag, 
  Box, 
  Sparkles, 
  ShieldCheck, 
  FileSpreadsheet, 
  Info, 
  X, 
  Grid, 
  List, 
  Percent, 
  Briefcase,
  TrendingUp,
  Receipt,
  Check
} from 'lucide-react';
import { CatalogProduct, CatalogItemType, UserRole, TeamMember } from '../types';
import { formatCurrency } from '../utils/pdfGenerator';

interface StoreViewProps {
  products: CatalogProduct[];
  currentRole: UserRole;
  currentUser: TeamMember;
  onAddProduct: (product: Omit<CatalogProduct, 'id' | 'createdAt'>) => void;
  onUpdateProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (id: string) => void;
  onSelectForQuotation: (product: CatalogProduct) => void;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  currentRole,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSelectForQuotation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formType, setFormType] = useState<CatalogItemType>('servicio');
  const [formCategory, setFormCategory] = useState('Tecnología & Software');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<string>('12000');
  const [formCost, setFormCost] = useState<string>('4500');
  const [formUnit, setFormUnit] = useState('proyecto');
  const [formStock, setFormStock] = useState<string>('10');
  const [formDefaultIva, setFormDefaultIva] = useState(true);
  const [formDefaultIsr, setFormDefaultIsr] = useState(false);
  const [formTags, setFormTags] = useState('Ventas, Corporativo');

  const canManageCatalog = currentRole === 'admin' || currentRole === 'project_manager';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchType = selectedType === 'all' || p.type === selectedType;
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchType && matchCat;
    });
  }, [products, searchTerm, selectedType, selectedCategory]);

  // Catalog metrics
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const servicesCount = products.filter(p => p.type === 'servicio').length;
    const physicalProductsCount = products.filter(p => p.type === 'producto').length;
    const packagesCount = products.filter(p => p.type === 'paquete' || p.type === 'suscripcion').length;
    const totalInventoryValue = products.reduce((acc, p) => {
      if (p.type === 'producto' && typeof p.stock === 'number') {
        return acc + (p.price * p.stock);
      }
      return acc;
    }, 0);
    const avgPrice = totalCount > 0 
      ? products.reduce((acc, p) => acc + p.price, 0) / totalCount 
      : 0;

    return {
      totalCount,
      servicesCount,
      physicalProductsCount,
      packagesCount,
      totalInventoryValue,
      avgPrice,
    };
  }, [products]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormSku(`PRD-${randomNum}`);
    setFormType('servicio');
    setFormCategory(categories[0] || 'Servicios Profesionales');
    setFormDescription('');
    setFormPrice('15000');
    setFormCost('6000');
    setFormUnit('proyecto');
    setFormStock('10');
    setFormDefaultIva(true);
    setFormDefaultIsr(false);
    setFormTags('Comercial, Estrategia');
    setIsModalOpen(true);
  };

  const openEditModal = (product: CatalogProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormType(product.type);
    setFormCategory(product.category);
    setFormDescription(product.description);
    setFormPrice(String(product.price));
    setFormCost(String(product.cost || 0));
    setFormUnit(product.unit || 'unidad');
    setFormStock(product.stock !== null && product.stock !== undefined ? String(product.stock) : '0');
    setFormDefaultIva(product.defaultTaxIva ?? true);
    setFormDefaultIsr(product.defaultTaxIsr ?? false);
    setFormTags((product.tags || []).join(', '));
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) return;

    const priceNum = Math.max(0, parseFloat(formPrice) || 0);
    const costNum = Math.max(0, parseFloat(formCost) || 0);
    const stockNum = formType === 'producto' ? (parseInt(formStock, 10) || 0) : null;
    const tagList = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const productPayload = {
      name: formName.trim(),
      sku: formSku.trim().toUpperCase(),
      category: formCategory.trim() || 'General',
      type: formType,
      description: formDescription.trim(),
      price: priceNum,
      cost: costNum,
      unit: formUnit.trim() || 'unidad',
      stock: stockNum,
      defaultTaxIva: formDefaultIva,
      defaultTaxIsr: formDefaultIsr,
      isActive: true,
      tags: tagList,
    };

    if (editingProduct) {
      onUpdateProduct({
        ...productPayload,
        id: editingProduct.id,
        createdAt: editingProduct.createdAt,
      });
      showToast(`Producto "${productPayload.name}" actualizado correctamente.`);
    } else {
      onAddProduct(productPayload);
      showToast(`"${productPayload.name}" agregado a la Tienda del negocio.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    onDeleteProduct(id);
    setDeleteConfirmId(null);
    showToast('Producto o servicio eliminado del catálogo.');
  };

  const getTypeBadge = (type: CatalogItemType) => {
    switch (type) {
      case 'servicio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Briefcase className="w-3 h-3" /> Servicio
          </span>
        );
      case 'producto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Box className="w-3 h-3" /> Producto Físico
          </span>
        );
      case 'paquete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="w-3 h-3" /> Paquete
          </span>
        );
      case 'suscripcion':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3 h-3" /> Suscripción / Software
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs border border-blue-500 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Tienda & Catálogo de Soluciones
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Pesos Mexicanos (MXN)
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Inventario centralizado de productos y servicios para anexar directamente a cotizaciones comerciales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {canManageCatalog && (
              <button
                id="btn-add-store-product"
                onClick={openCreateModal}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto / Servicio</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Catálogo
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">{metrics.totalCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">ítems activos</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Servicios Profesionales
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-blue-900">{metrics.servicesCount}</span>
              <span className="text-[10px] text-blue-600 font-medium">soluciones</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Productos Físicos
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-900">{metrics.physicalProductsCount}</span>
              <span className="text-[10px] text-emerald-600 font-medium">artículos</span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Precio Promedio (MXN)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-purple-900 truncate">
                {formatCurrency(metrics.avgPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="store-search-input"
            type="text"
            placeholder="Buscar por nombre, SKU, categoría o palabra clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Filter Types */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setSelectedType('servicio')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedType === 'servicio' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Servicios
            </button>
            <button
              onClick={() => setSelectedType('producto')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedType === 'producto' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setSelectedType('paquete')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedType === 'paquete' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paquetes
            </button>
            <button
              onClick={() => setSelectedType('suscripcion')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedType === 'suscripcion' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SaaS
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-slate-500">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Vista de tabla"
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No se encontraron productos o servicios</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prueba ajustando los filtros de búsqueda o agrega un nuevo producto a la tienda del negocio.
          </p>
          {canManageCatalog && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Primer Producto
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const marginPercent = product.cost && product.price > 0
              ? Math.round(((product.price - product.cost) / product.price) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: SKU, Type, Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {product.sku}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(product.type)}
                      {canManageCatalog && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-1">
                          <button
                            onClick={() => openEditModal(product)}
                            title="Editar producto"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(product.id)}
                            title="Eliminar producto"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title and Category */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5 line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {product.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price, Stock and Action */}
                <div className="pt-4 mt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Precio Unitario (MXN)
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          / {product.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {product.type === 'producto' ? (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">Stock</span>
                          <span className={`text-xs font-bold ${
                            (product.stock || 0) > 5 ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {product.stock || 0} disponibles
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">Entrega</span>
                          <span className="text-[11px] font-semibold text-blue-600">
                            Bajo Demanda
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tax Defaults indicators */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {product.defaultTaxIva ? 'IVA 16%' : 'IVA Exento'}
                      </span>
                      {product.defaultTaxIsr && (
                        <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
                          <Check className="w-3 h-3 text-amber-600" />
                          Retención ISR
                        </span>
                      )}
                    </div>

                    {canManageCatalog && product.cost ? (
                      <span className="text-slate-600 font-semibold">
                        Margen: <strong className="text-emerald-700">{marginPercent}%</strong>
                      </span>
                    ) : null}
                  </div>

                  {/* Primary CTA: Anexar a Cotización */}
                  <button
                    onClick={() => onSelectForQuotation(product)}
                    className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cotizar este Producto / Servicio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Nombre y Categoría</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-right">Precio Unitario (MXN)</th>
                  <th className="p-3.5 text-center">Unidad / Stock</th>
                  <th className="p-3.5 text-center">Impuestos</th>
                  {canManageCatalog && <th className="p-3.5 text-right">Costo / Margen</th>}
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const marginPercent = product.cost && product.price > 0
                    ? Math.round(((product.price - product.cost) / product.price) * 100)
                    : 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-600">
                        {product.sku}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="text-[10px] text-slate-400">{product.category}</div>
                      </td>
                      <td className="p-3.5">
                        {getTypeBadge(product.type)}
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-semibold text-slate-700">{product.unit}</span>
                        {product.type === 'producto' && (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            {product.stock || 0} pzas
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-semibold text-slate-600">
                            {product.defaultTaxIva ? 'IVA 16%' : 'Sin IVA'}
                          </span>
                          {product.defaultTaxIsr && (
                            <span className="text-[9px] font-bold text-amber-700">
                              + Ret. ISR
                            </span>
                          )}
                        </div>
                      </td>
                      {canManageCatalog && (
                        <td className="p-3.5 text-right">
                          <div className="text-slate-600 font-medium">
                            {formatCurrency(product.cost || 0)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            {marginPercent}% margen
                          </div>
                        </td>
                      )}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectForQuotation(product)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-blue-400" /> Cotizar
                          </button>
                          {canManageCatalog && (
                            <>
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(product.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Product or Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingProduct ? 'Editar Producto o Servicio' : 'Agregar Nuevo Producto / Servicio a Tienda'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Estará disponible de inmediato para adjuntar en la cotización comercial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre de la Solución / Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Licenciamiento CRM Pro, Tótem Publicitario 55..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    SKU / Código Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SRV-CRM-01"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Ítem *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CatalogItemType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white font-medium"
                  >
                    <option value="servicio">Servicio Profesional</option>
                    <option value="producto">Producto Físico</option>
                    <option value="paquete">Paquete Comercial</option>
                    <option value="suscripcion">Suscripción / Software SaaS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Marketing, Hardware, Software, Consultoría"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    placeholder="ej. proyecto, unidad, mes, hora, licencia"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Pricing in MXN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Precio Venta ($ MXN) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-black text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Costo Interno ($ MXN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold text-slate-700 bg-white"
                  />
                </div>

                {formType === 'producto' ? (
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Inventario / Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-bold text-emerald-700 bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-slate-500 italic pb-2">
                      Servicio intangible sin límite de inventario físico.
                    </span>
                  </div>
                )}
              </div>

              {/* Fiscal settings */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <span className="font-bold text-blue-950 block text-[11px]">
                  Configuración Fiscal Predeterminada (Pesos Mexicanos MXN)
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDefaultIva}
                      onChange={(e) => setFormDefaultIva(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="font-medium text-slate-700">Aplica I.V.A. (16%)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDefaultIsr}
                      onChange={(e) => setFormDefaultIsr(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="font-medium text-slate-700">Aplica Retención I.S.R.</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción Comercial Detallada
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla alcances, especificaciones técnicas, entregables y garantías..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Etiquetas / Tags (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="Ventas, Cloud, Anual, Hardware"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer active:scale-95"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Agregar a Tienda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">¿Eliminar producto de la Tienda?</h3>
            <p className="text-xs text-slate-600">
              Esta acción quitará el producto del catálogo comercial. Las cotizaciones previamente guardadas mantendrán su historial.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
