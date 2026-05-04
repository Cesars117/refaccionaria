'use client'

import { useState, useTransition } from 'react'
import { createFinancialEntry, deleteFinancialEntry, updateFinancialEntry, toggleFinancialPaid } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Entry {
  id: string
  type: string
  category: string
  amount: number
  description: string
  isPaid: boolean
  date: Date
}

export default function FinancialClient({ initialEntries: entries }: { initialEntries: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    const formData = new FormData()
    formData.append('id', id)
    
    startTransition(async () => {
      try {
        await deleteFinancialEntry(formData)
        setDeletingId(null)
        router.refresh()
      } catch (err) {
        alert('Error al eliminar: ' + (err as Error).message)
      }
    })
  }

  const handleToggle = (id: string, currentStatus: boolean) => {
    const formData = new FormData()
    formData.append('id', id)
    formData.append('isPaid', String(!currentStatus))
    
    startTransition(async () => {
      await toggleFinancialPaid(formData)
      router.refresh()
    })
  }

  // Solo los PAGADOS cuentan para el balance real
  const paidEntries = entries.filter(e => e.isPaid)
  const pendingEntries = entries.filter(e => !e.isPaid)

  const totalIncomes = paidEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0)
  const totalExpenses = paidEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)
  const balance = totalIncomes - totalExpenses

  const pendingExpenses = pendingEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)

  const categories = [
    { id: 'INITIAL_INVESTMENT', label: 'Inversión Inicial' },
    { id: 'RENT', label: 'Renta' },
    { id: 'PAYROLL', label: 'Nómina' },
    { id: 'UTILITIES', label: 'Servicios (Luz, Agua, etc)' },
    { id: 'OTHER', label: 'Otros Gastos' },
    { id: 'SALES', label: 'Entrada por Ventas' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Ingresos (Pagados)</span>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Gastos (Pagados)</span>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Pendientes (Por pagar)</span>
            <Calendar className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(pendingExpenses)}</p>
        </div>
        <div className="card p-4 border-l-4 border-brand-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Balance Neto Real</span>
            <Wallet className="h-5 w-5 text-brand-500" />
          </div>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Control de Gastos y Pendientes</h2>
          <button 
            onClick={() => { setIsAdding(!isAdding); setEditingEntry(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {isAdding ? 'Cerrar' : 'Nuevo Registro'}
          </button>
        </div>

        {isAdding && (
          <form 
            action={async (formData) => {
              await createFinancialEntry(formData)
              setIsAdding(false)
              router.refresh()
            }}
            className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4"
          >
            <div>
              <label className="label-field">Tipo</label>
              <select name="type" required className="input-field">
                <option value="EXPENSE">Salida / Gasto</option>
                <option value="INCOME">Entrada / Ingreso</option>
              </select>
            </div>
            <div>
              <label className="label-field">Categoría</label>
              <select name="category" required className="input-field">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Monto ($)</label>
              <input name="amount" type="number" step="0.01" required className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="label-field">Fecha</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Descripción / Nota</label>
              <input name="description" required className="input-field" placeholder="Ej: Pago de renta Mayo 2026" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" name="isPaid" value="true" defaultChecked id="newIsPaid" className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="newIsPaid" className="text-sm font-medium text-gray-700">Ya pagado / Liquidado</label>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full h-[42px]">Guardar Registro</button>
            </div>
          </form>
        )}

        {editingEntry && (
          <form 
            action={async (formData) => {
              await updateFinancialEntry(formData)
              setEditingEntry(null)
              router.refresh()
            }}
            className="bg-brand-50/30 p-4 rounded-xl mb-6 border border-brand-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4"
          >
            <input type="hidden" name="id" value={editingEntry.id} />
            <div>
              <label className="label-field">Tipo</label>
              <select name="type" defaultValue={editingEntry.type} required className="input-field">
                <option value="EXPENSE">Salida / Gasto</option>
                <option value="INCOME">Entrada / Ingreso</option>
              </select>
            </div>
            <div>
              <label className="label-field">Categoría</label>
              <select name="category" defaultValue={editingEntry.category} required className="input-field">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Monto ($)</label>
              <input name="amount" type="number" step="0.01" defaultValue={editingEntry.amount} required className="input-field" />
            </div>
            <div>
              <label className="label-field">Fecha</label>
              <input name="date" type="date" defaultValue={new Date(editingEntry.date).toISOString().split('T')[0]} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Descripción / Nota</label>
              <input name="description" defaultValue={editingEntry.description} required className="input-field" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" name="isPaid" value="true" defaultChecked={editingEntry.isPaid} id="editIsPaid" className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="editIsPaid" className="text-sm font-medium text-gray-700">Pagado / Liquidado</label>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary flex-1 h-[42px]">Guardar Cambios</button>
              <button type="button" onClick={() => setEditingEntry(null)} className="btn-secondary h-[42px]">Cancelar</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header px-4 py-3">Estado</th>
                <th className="table-header px-4 py-3">Fecha</th>
                <th className="table-header px-4 py-3">Descripción</th>
                <th className="table-header px-4 py-3">Categoría</th>
                <th className="table-header px-4 py-3 text-right">Monto</th>
                <th className="table-header px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">No hay registros financieros.</td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className={`hover:bg-gray-50 transition-colors ${!e.isPaid ? 'bg-amber-50/30' : ''} ${editingEntry?.id === e.id ? 'ring-2 ring-brand-500 ring-inset' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={e.isPaid} 
                        disabled={e.isPaid || isPending}
                        onChange={() => handleToggle(e.id, e.isPaid)}
                        className={`h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 ${e.isPaid ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        title={e.isPaid ? "Ya liquidado" : "Marcar como pagado"}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(e.date).toLocaleDateString('es-MX')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{e.description}</div>
                      {!e.isPaid && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">PENDIENTE</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 uppercase">
                        {categories.find(c => c.id === e.category)?.label || e.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${!e.isPaid ? 'text-gray-400' : (e.type === 'INCOME' ? 'text-green-600' : 'text-red-600')}`}>
                      {e.type === 'INCOME' ? '+' : '-'} {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {deletingId === e.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                            <button 
                              onClick={() => handleDelete(e.id)}
                              disabled={isPending}
                              className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {isPending ? '...' : 'SÍ'}
                            </button>
                            <button 
                              onClick={() => setDeletingId(null)}
                              disabled={isPending}
                              className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setEditingEntry(e); setIsAdding(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className="text-gray-400 hover:text-brand-600 p-1.5 rounded-full hover:bg-brand-50 transition-colors"
                              title="Editar registro"
                            >
                              <Edit size={18} />
                            </button>
                            
                            <button 
                              onClick={() => setDeletingId(e.id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
