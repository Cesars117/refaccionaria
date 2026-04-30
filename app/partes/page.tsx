'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner } from '@/app/components/ui';
import { formatCurrency } from '@/lib/utils';

interface Part {
  id: number;
  name: string;
  sku: string | null;
  brand: string | null;
  quantity: number;
  minStock: number;
  price: number;
  category: { name: string } | null;
  location: { name: string } | null;
}

export default function PartesPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLow, setFilterLow] = useState(false);

  useEffect(() => {
    fetchParts();
  }, []);

  async function fetchParts() {
    try {
      const res = await fetch('/api/parts');
      const data = await res.json();
      setParts(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category?.name.toLowerCase().includes(q) ?? false);
    const matchLow = filterLow ? p.quantity <= p.minStock : true;
    return matchSearch && matchLow;
  });

  const lowStockCount = parts.filter((p) => p.quantity <= p.minStock).length;

  return (
    <div className="p-6">
      <PageHeader
        title="Partes"
        description={`${parts.length} partes en catálogo`}
        action={
          <Link href="/partes/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Parte
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU, marca..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {lowStockCount > 0 && (
          <button
            onClick={() => setFilterLow(!filterLow)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              filterLow
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Stock bajo ({lowStockCount})
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin partes"
          description="Agrega la primera parte al catálogo"
          action={
            <Link href="/partes/nuevo" className="btn-primary">
              <Plus className="h-4 w-4" /> Nueva Parte
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header px-6 py-3">Nombre / SKU</th>
                <th className="table-header px-4 py-3">Categoría</th>
                <th className="table-header px-4 py-3">Ubicación</th>
                <th className="table-header px-4 py-3 text-right">Stock</th>
                <th className="table-header px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                        <Package className="h-5 w-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          {p.sku ? `SKU: ${p.sku}` : ''}
                          {p.sku && p.brand ? ' · ' : ''}
                          {p.brand ?? ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.location?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        p.quantity <= p.minStock ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {p.quantity}
                    </span>
                    {p.quantity <= p.minStock && (
                      <AlertTriangle className="inline ml-1 h-3 w-3 text-amber-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/partes/${p.id}`} className="text-sm text-brand-600 hover:text-brand-800 font-medium">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
