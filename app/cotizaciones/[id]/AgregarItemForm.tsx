'use client';

import { useState } from 'react';
import { addQuoteItem } from '@/app/actions';
import { Plus, Search } from 'lucide-react';

interface Part { 
  id: number | string; 
  name: string; 
  sku: string | null; 
  price: number; 
  quantity: number; 
  isShopCatalog?: boolean;
}

export default function AgregarItemForm({ quoteId }: { quoteId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Part[]>([]);
  const [selected, setSelected] = useState<Part | null>(null);
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/parts?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.slice(0, 8));
  }

  function selectPart(p: Part) {
    setSelected(p);
    const codeAndName = p.sku ? `${p.sku} - ${p.name}` : p.name;
    setDescription(codeAndName);
    setUnitPrice(p.price);
    setResults([]);
    setQuery(codeAndName);
  }

  return (
    <form
      action={async (fd) => {
        setLoading(true);
        await addQuoteItem(fd);
        setSelected(null); setQuery(''); setDescription(''); setQty(1); setUnitPrice(0);
        setLoading(false);
      }}
      className="space-y-3"
    >
      <p className="text-sm font-semibold text-gray-700">Agregar partida</p>
      <input type="hidden" name="quoteId" value={quoteId} />
      {selected && <input type="hidden" name="partId" value={selected.id} />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9 text-sm"
          placeholder="Buscar refacción en catálogo..."
          value={query}
          onChange={(e) => { setSelected(null); search(e.target.value); }}
          autoComplete="off"
          required
        />
        {query.length >= 2 && !selected && results.length === 0 && (
          <p className="text-xs text-red-500 mt-1">No se encontraron resultados en el catálogo.</p>
        )}
        {query.length >= 2 && !selected && results.length > 0 && (
          <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Seleccione una refacción del listado desplegable.</p>
        )}
        {selected && (
          <p className="text-xs text-green-600 mt-1 font-semibold">
            ✓ Seleccionado: {selected.name} {selected.isShopCatalog ? '(Catálogo Tienda - Bajo Pedido)' : `(Stock: ${selected.quantity})`}
          </p>
        )}
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => selectPart(p)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.isShopCatalog ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        Catálogo Tienda (Bajo Pedido)
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        Stock: {p.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                    {p.sku && <span>Código: {p.sku}</span>}
                    {p.isShopCatalog && <span className="text-amber-600 font-semibold">• Llega mismo día antes 4 PM</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="label-field">Descripción *</label>
        <input name="description" required value={description} onChange={(e) => setDescription(e.target.value)} className="input-field text-sm" placeholder="Descripción de la partida" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label-field">Cantidad</label>
          <input name="quantity" type="number" min="1" value={qty} onChange={(e) => setQty(parseInt(e.target.value))} className="input-field text-sm" />
        </div>
        <div>
          <label className="label-field">Precio unitario</label>
          <input name="unitPrice" type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value))} className="input-field text-sm" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={loading || !selected} className="btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4" /> {loading ? '...' : 'Agregar'}
          </button>
        </div>
      </div>
    </form>
  );
}

