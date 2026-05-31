'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPurchaseOrder } from '@/app/actions';
import { ArrowLeft, Play, PackagePlus, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Part {
  id: number;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  categoryId: number;
  locationId: number;
}

interface Category {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface ParsedItem {
  sku: string;
  description: string;
  unitCost: number;
  quantity: number;
  suggestedPrice: number;
  categoryId: number;
  locationId: number;
  existingPartId?: number;
}

interface EntradaRapidaClientProps {
  initialParts: Part[];
  categories: Category[];
  locations: Location[];
}

export default function EntradaRapidaClient({ initialParts, categories, locations }: EntradaRapidaClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [markupPercent, setMarkupPercent] = useState(40); // default +40%
  const [defaultCategoryId, setDefaultCategoryId] = useState(categories[0]?.id || 1);
  const [defaultLocationId, setDefaultLocationId] = useState(locations[0]?.id || 1);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Parse text area lines
  const handleParse = () => {
    if (!rawText.trim()) {
      alert('Por favor, pega el contenido antes de procesar.');
      return;
    }

    const lines = rawText.split('\n');
    const parsed: ParsedItem[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Splitting by tabs or multiple spaces
      let parts = trimmed.split('\t');
      if (parts.length < 2) {
        parts = trimmed.split(/\s{2,}/);
      }

      if (parts.length >= 2) {
        const sku = parts[0].trim();
        // The remaining content could contain description and price
        let description = '';
        let costStr = '0';

        if (parts.length >= 3) {
          // Format: SKU \t Description \t Cost
          description = parts[1].trim();
          costStr = parts[2].replace(/[$,\s]/g, '').trim();
        } else {
          // Format: SKU \t Description (maybe Cost is missing or inside)
          description = parts[1].trim();
        }

        const unitCost = parseFloat(costStr) || 0;
        const suggestedPrice = Math.round(unitCost * (1 + markupPercent / 100));

        // Check if SKU exists
        const existing = initialParts.find((p) => p.sku?.toLowerCase() === sku.toLowerCase());

        parsed.push({
          sku,
          description: existing?.name || description || `Refacción ${sku}`,
          unitCost,
          quantity: 1,
          suggestedPrice: existing ? existing.price : suggestedPrice,
          categoryId: existing?.categoryId || defaultCategoryId,
          locationId: existing?.locationId || defaultLocationId,
          existingPartId: existing?.id,
        });
      }
    });

    if (parsed.length === 0) {
      alert('No se pudieron identificar filas válidas. Revisa que estén divididas por columnas (Tabuladores).');
    } else {
      setItems(parsed);
      setFeedback(null);
    }
  };

  const handleApplyMarkup = () => {
    setItems((prev) =>
      prev.map((item) => {
        // Only apply to items that don't already exist or if they do, calculate suggestion
        const suggested = Math.round(item.unitCost * (1 + markupPercent / 100));
        return {
          ...item,
          suggestedPrice: suggested,
        };
      })
    );
  };

  const updateItemField = (index: number, field: keyof ParsedItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert('No hay artículos válidos para importar.');
      return;
    }

    const fd = new FormData();
    fd.append('invoiceRef', invoiceRef);
    fd.append('notes', notes);
    fd.append('items', JSON.stringify(items));

    startTransition(async () => {
      try {
        const result = await createPurchaseOrder(fd);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `¡Importación exitosa! Se registraron ${result.itemCount} refacciones y se descontó la salida en Caja.`,
          });
          setItems([]);
          setRawText('');
          setInvoiceRef('');
          setNotes('');
          router.refresh();
        } else {
          setFeedback({
            type: 'error',
            message: result.error || 'Error al guardar el pedido.',
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Error de conexión con el servidor.',
        });
      }
    });
  };

  const totalCost = items.reduce((acc, item) => acc + item.unitCost * item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="mb-4">
        <Link href="/partes" className="text-gray-400 hover:text-brand-600 flex items-center gap-1 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Volver a Partes
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entrada Rápida de Inventario ⚡</h1>
          <p className="text-sm text-gray-500">Carga masiva de refacciones copiadas desde Excel o la cotización del proveedor.</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 border rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="text-green-600 shrink-0" /> : <AlertCircle className="text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instrucciones */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Pasos para importar</h3>
            <ol className="list-decimal pl-5 space-y-2.5 text-xs text-gray-600">
              <li>Configura la <strong>categoría y ubicación por defecto</strong> para los artículos nuevos.</li>
              <li>Ingresa el **% de ganancia** sugerido para el cálculo automático de venta.</li>
              <li>Abre tu cotización en Excel o PDF, selecciona las columnas **Código/SKU, Descripción y Costo**, y cópialas (Ctrl+C).</li>
              <li>Pega el contenido en el cuadro de la derecha (Ctrl+V) y presiona **Procesar entrada**.</li>
            </ol>
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div>
                <label className="label-field text-xs font-bold">Categoría por Defecto</label>
                <select 
                  className="input-field text-xs" 
                  value={defaultCategoryId} 
                  onChange={(e) => setDefaultCategoryId(Number(e.target.value))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-bold">Ubicación por Defecto</label>
                <select 
                  className="input-field text-xs" 
                  value={defaultLocationId} 
                  onChange={(e) => setDefaultLocationId(Number(e.target.value))}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field text-xs font-bold">Porcentaje de Ganancia Sugerido</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="input-field text-xs pr-8" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(Number(e.target.value))} 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area de captura */}
          <div className="lg:col-span-2 card p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Pegar Registros del Proveedor</h3>
            <textarea
              className="w-full min-h-[300px] font-mono text-xs p-3 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-gray-50/50"
              placeholder="Pegar aquí... (ejemplo)&#10;RE440-14416.523	RADIADOR CV ASTRA 00-05/ZAFIRA 06-07	850.00&#10;RE440-15137.534	RADIADOR GOLF GL 2.0 92-1/2	628.00"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                onClick={handleParse} 
                className="btn-primary flex items-center gap-1.5 py-2.5 px-6 font-bold text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-all"
              >
                <Play size={16} /> Procesar entrada
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabecera / Configuración rápida */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="label-field text-xs font-bold">Porcentaje de Ganancia</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    className="input-field text-xs w-24" 
                    value={markupPercent} 
                    onChange={(e) => setMarkupPercent(Number(e.target.value))} 
                  />
                  <button 
                    onClick={handleApplyMarkup} 
                    className="btn-secondary text-xs flex items-center gap-1 px-3 border border-gray-200 hover:bg-gray-50"
                  >
                    <Calculator size={13} /> Aplicar
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setItems([])} 
                className="btn-secondary text-xs border border-gray-200 px-4 py-2 hover:bg-gray-50"
              >
                Cancelar / Recargar
              </button>
            </div>
          </div>

          {/* Tabla de edición de registros */}
          <div className="card overflow-hidden">
            <div className="card-header border-b border-gray-100 flex justify-between items-center px-6 py-4">
              <h3 className="font-bold text-gray-900">Previsualización de Refacciones ({items.length})</h3>
              <p className="text-sm font-semibold text-gray-700">Costo total acumulado: <span className="text-red-600 font-bold">{formatCurrency(totalCost)}</span></p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header px-4 py-2.5 text-left text-xs">SKU</th>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Nombre / Descripción</th>
                    <th className="table-header px-3 py-2.5 text-right text-xs">Cant.</th>
                    <th className="table-header px-3 py-2.5 text-right text-xs">Costo Unit.</th>
                    <th className="table-header px-3 py-2.5 text-right text-xs">P. Venta Sugerido</th>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Categoría</th>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Ubicación</th>
                    <th className="table-header px-4 py-2.5 text-center text-xs">Estado</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 text-xs">
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          className="w-28 px-2 py-1 text-xs border border-gray-200 rounded"
                          value={item.sku}
                          onChange={(e) => updateItemField(idx, 'sku', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          className="w-48 px-2 py-1 text-xs border border-gray-200 rounded"
                          value={item.description}
                          onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          className="w-14 px-2 py-1 text-xs text-right border border-gray-200 rounded"
                          value={item.quantity}
                          onChange={(e) => updateItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 px-2 py-1 text-xs text-right border border-gray-200 rounded"
                          value={item.unitCost}
                          onChange={(e) => updateItemField(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 px-2 py-1 text-xs text-right border border-gray-200 rounded font-bold text-green-700"
                          value={item.suggestedPrice}
                          onChange={(e) => updateItemField(idx, 'suggestedPrice', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="px-2 py-1 text-[11px] border border-gray-200 rounded"
                          value={item.categoryId}
                          onChange={(e) => updateItemField(idx, 'categoryId', Number(e.target.value))}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="px-2 py-1 text-[11px] border border-gray-200 rounded"
                          value={item.locationId}
                          onChange={(e) => updateItemField(idx, 'locationId', Number(e.target.value))}
                        >
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.existingPartId ? (
                          <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                            Sumar Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                            Nuevo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button 
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold"
                          title="Eliminar fila"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario de Facturación / Notas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5 space-y-4 md:col-span-2">
              <h3 className="font-bold text-gray-900">Datos adicionales del Pedido</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Número de Factura / Referencia</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: FAC-12345"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-field">Notas internas</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Pedido BRAQSA Mayo 2026"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Sidebar total */}
            <div className="card p-5 flex flex-col justify-between">
              <div>
                <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Total Compra Proveedor</h4>
                <div className="text-3xl font-extrabold text-brand-600">{formatCurrency(totalCost)}</div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Al confirmar, se añadirá el stock indicado y se generará una salida inmediata en caja.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-150 mt-4">
                <button
                  onClick={handleSave}
                  disabled={isPending || items.length === 0}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <PackagePlus size={16} />
                  <span>{isPending ? 'Importando pedido...' : 'Confirmar e Importar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
