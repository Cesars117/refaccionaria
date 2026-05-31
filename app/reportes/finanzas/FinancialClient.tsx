'use client'

import { useState, useTransition, useEffect } from 'react'
import { 
  createFinancialEntryWithRecurring,
  deleteFinancialEntry, 
  updateFinancialEntry, 
  toggleFinancialPaid,
  deleteRecurringExpenseTemplate,
} from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Calendar, Edit, RefreshCw, BarChart3, Package, Tag, ArrowRight } from 'lucide-react'
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

interface PurchaseOrder {
  id: string
  invoiceRef: string | null
  totalCost: number
  createdAt: Date
  supplier?: { name: string } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unitCost: number
    totalCost: number
    part?: { price: number } | null
  }>
}

interface RecurringTemplate {
  id: string
  category: string
  amount: number
  description: string
  dayOfMonth: number
}

interface SoldPartProfitability {
  id: string
  sku: string
  description: string
  quantity: number
  cost: number;
  unitPrice: number;
  discountPct: number;
  amount: number;
  quoteNumber: string;
  customerName: string;
  createdAt: string;
}

export default function FinancialClient({ 
  initialEntries: entries,
  initialPurchaseOrders = [],
  recurringTemplates = [],
  soldPartsProfitability = [],
}: { 
  initialEntries: any[]
  initialPurchaseOrders?: any[]
  recurringTemplates?: RecurringTemplate[]
  soldPartsProfitability?: SoldPartProfitability[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'entries' | 'rentabilidad'>('entries')
  const [isRecurring, setIsRecurring] = useState(false)
  const [newType, setNewType] = useState('EXPENSE')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dayOfMonth, setDayOfMonth] = useState(1)

  useEffect(() => {
    if (!isRecurring) return
    const today = new Date()
    const targetMonth = today.getDate() > dayOfMonth ? today.getMonth() + 1 : today.getMonth()
    const nextDate = new Date(today.getFullYear(), targetMonth, Math.min(Math.max(dayOfMonth, 1), 28))
    setNewDate(nextDate.toISOString().split('T')[0])
  }, [isRecurring, dayOfMonth])

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

  // Balance cálculos
  const paidEntries = entries.filter(e => e.isPaid)
  const pendingEntries = entries.filter(e => !e.isPaid)

  const totalIncomes = paidEntries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0)
  const totalExpenses = paidEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)
  const balance = totalIncomes - totalExpenses
  const pendingExpenses = pendingEntries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)

  // Rentabilidad cálculos
  const totalPurchaseCost = initialPurchaseOrders.reduce((s: number, po: PurchaseOrder) => s + po.totalCost, 0)
  const totalSalesIncome = paidEntries
    .filter(e => e.type === 'INCOME' && e.category === 'SALES')
    .reduce((s, e) => s + e.amount, 0)
  const grossProfit = totalSalesIncome - totalPurchaseCost
  const grossMargin = totalSalesIncome > 0 ? (grossProfit / totalSalesIncome * 100) : 0
  const netProfit = balance
  const fixedExpenses = paidEntries
    .filter(e => e.type === 'EXPENSE' && e.category !== 'SUPPLIER_PURCHASE')
    .reduce((s, e) => s + e.amount, 0)

  const categories = [
    { id: 'INITIAL_INVESTMENT', label: 'Inversión Inicial' },
    { id: 'RENT', label: 'Renta' },
    { id: 'PAYROLL', label: 'Nómina' },
    { id: 'UTILITIES', label: 'Servicios (Luz, Agua, etc)' },
    { id: 'SUPPLIER_PURCHASE', label: 'Compra a Proveedor' },
    { id: 'OTHER', label: 'Otros Gastos' },
    { id: 'SALES', label: 'Entrada por Ventas' },
  ]

  const expenseCategories = categories.filter(c => c.id !== 'SALES')

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos (Pagados)</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gastos (Pagados)</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card p-4 border-l-4 border-amber-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(pendingExpenses)}</p>
        </div>
        <div className="card p-4 border-l-4 border-brand-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance Neto Real</span>
            <Wallet className="h-4 w-4 text-brand-500" />
          </div>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('entries')}
          className={`py-2.5 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'entries'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet size={15} /> Registros de Caja
        </button>
        <button
          onClick={() => setActiveTab('rentabilidad')}
          className={`py-2.5 px-5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rentabilidad'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 size={15} /> Rentabilidad
        </button>
      </div>

      {/* ── TAB: REGISTROS DE CAJA ── */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Control de Gastos y Pendientes</h2>
              <button 
                onClick={() => { setIsAdding(!isAdding); setEditingEntry(null); setIsRecurring(false) }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                {isAdding ? 'Cerrar' : 'Nuevo Registro'}
              </button>
            </div>

            {/* FORM: Nuevo Registro */}
            {isAdding && (
              <form 
                action={async (formData) => {
                  await createFinancialEntryWithRecurring(formData)
                  setIsAdding(false)
                  setIsRecurring(false)
                  router.refresh()
                }}
                className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label-field">Tipo</label>
                    <select name="type" required className="input-field" value={newType} onChange={e => { setNewType(e.target.value); if (e.target.value !== 'EXPENSE') setIsRecurring(false) }}>
                      <option value="EXPENSE">Salida / Gasto</option>
                      <option value="INCOME">Entrada / Ingreso</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Categoría</label>
                    <select name="category" required className="input-field">
                      {(newType === 'INCOME' ? [{ id: 'SALES', label: 'Entrada por Ventas' }, { id: 'OTHER', label: 'Otro Ingreso' }] : expenseCategories).map(c => (
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
                    <input
                      name="date"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-field">Descripción / Nota</label>
                    <input name="description" required className="input-field" placeholder="Ej: Pago de renta Mayo 2026" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input type="checkbox" name="isPaid" value="true" defaultChecked id="newIsPaid" className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                    <label htmlFor="newIsPaid" className="text-sm font-medium text-gray-700">Ya pagado / Liquidado</label>
                  </div>
                  {/* Toggle recurrente — solo en gastos */}
                  {newType === 'EXPENSE' && (
                    <div className="flex items-center gap-3 pt-6">
                      <input 
                        type="checkbox" 
                        id="isRecurring" 
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" 
                      />
                      <input type="hidden" name="isRecurring" value={isRecurring ? 'true' : 'false'} />
                      <label htmlFor="isRecurring" className="text-sm font-medium text-purple-700 flex items-center gap-1">
                        <RefreshCw size={13} /> Se repite cada mes
                      </label>
                    </div>
                  )}
                </div>

                {/* Panel extra: recurrente */}
                {isRecurring && newType === 'EXPENSE' && (
                  <div className="flex items-center gap-4 bg-purple-50 border border-purple-200 rounded-lg p-3 animate-in fade-in">
                    <RefreshCw size={18} className="text-purple-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-purple-700 mb-1">Gasto Recurrente Mensual</p>
                      <p className="text-xs text-purple-600">Este gasto se registrará automáticamente en la fecha elegida cada mes.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-700 block mb-1">Día del mes</label>
                      <input 
                        type="number" 
                        name="dayOfMonth" 
                        min={1} 
                        max={28} 
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(parseInt(e.target.value || '1'))}
                        className="w-20 text-sm border-purple-200 rounded focus:ring-purple-500 focus:border-purple-400 px-2 py-1" 
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary px-8 h-[42px]">Guardar Registro</button>
                </div>
              </form>
            )}

            {/* FORM: Editar registro */}
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

            {/* Tabla de registros */}
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
                            {new Date(e.date).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
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
                                <button onClick={() => handleDelete(e.id)} disabled={isPending} className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50">
                                  {isPending ? '...' : 'SÍ'}
                                </button>
                                <button onClick={() => setDeletingId(null)} disabled={isPending} className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50">
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

            {/* Sección: Plantillas de Gastos Recurrentes */}
            <div className="mt-8 border-t border-gray-150 pt-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-1.5 text-purple-700">
                <RefreshCw size={15} /> Plantillas de Gastos Recurrentes
              </h3>
              {recurringTemplates.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No hay plantillas de gastos recurrentes activas. Al crear un nuevo registro de tipo Gasto/Salida con la casilla &quot;Se repite cada mes&quot; marcada, aparecerá aquí.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recurringTemplates.map((template) => (
                    <div key={template.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{template.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Día de cobro: {template.dayOfMonth} de cada mes</p>
                        <p className="text-xs text-gray-500">Categoría: {categories.find(c => c.id === template.category)?.label || template.category}</p>
                        <p className="text-xs font-extrabold text-purple-700 mt-2">{formatCurrency(template.amount)} / mes</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`¿Deseas eliminar la plantilla de gasto recurrente para "${template.description}"? Esto no borrará los registros ya creados, pero detendrá futuras generaciones automáticas.`)) {
                            const fd = new FormData()
                            fd.append('id', template.id)
                            startTransition(async () => {
                              await deleteRecurringExpenseTemplate(fd)
                              router.refresh()
                            })
                          }
                        }}
                        disabled={isPending}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        title="Eliminar plantilla recurrente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB: RENTABILIDAD ── */}
      {activeTab === 'rentabilidad' && (
        <div className="space-y-6">
          {/* KPIs de rentabilidad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Costo Mercancía</span>
                <Package className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPurchaseCost)}</p>
              <p className="text-xs text-gray-400 mt-1">Lo que pagamos a proveedores</p>
            </div>
            <div className="card p-4 border-l-4 border-green-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ventas</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSalesIncome)}</p>
              <p className="text-xs text-gray-400 mt-1">Ingresos por ventas</p>
            </div>
            <div className="card p-4 border-l-4 border-purple-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ganancia Bruta</span>
                <Tag className="h-4 w-4 text-purple-500" />
              </div>
              <p className={`text-xl font-bold ${grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{formatCurrency(grossProfit)}</p>
              <p className="text-xs text-gray-400 mt-1">Margen: {grossMargin.toFixed(1)}%</p>
            </div>
            <div className="card p-4 border-l-4 border-brand-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ganancia Neta</span>
                <Wallet className="h-4 w-4 text-brand-500" />
              </div>
              <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
              <p className="text-xs text-gray-400 mt-1">Después de gastos fijos</p>
            </div>
          </div>

          {/* Resumen desglose */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-600" />
              Desglose de Rentabilidad
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ventas totales</span>
                <span className="text-sm font-bold text-green-600">+ {formatCurrency(totalSalesIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">− Costo de mercancía (proveedores)</span>
                <span className="text-sm font-bold text-red-600">− {formatCurrency(totalPurchaseCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 bg-purple-50/50 px-2 rounded">
                <span className="text-sm font-semibold text-purple-800">= Ganancia Bruta</span>
                <span className={`text-sm font-bold ${grossProfit >= 0 ? 'text-purple-700' : 'text-red-600'}`}>{formatCurrency(grossProfit)} ({grossMargin.toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">− Gastos fijos y operativos</span>
                <span className="text-sm font-bold text-red-600">− {formatCurrency(fixedExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-brand-50/50 px-2 rounded">
                <span className="text-sm font-bold text-brand-900">= Ganancia Neta Real</span>
                <span className={`text-base font-bold ${netProfit >= 0 ? 'text-brand-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>

          {/* Rentabilidad Detallada por Refacción Vendida */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-brand-600" />
              Rentabilidad por Refacción Vendida (Stock Interno)
            </h3>
            {soldPartsProfitability.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No hay ventas de stock registradas aún. <br />Una vez que se complete la entrega de una cotización, sus refacciones aparecerán aquí para desglosar sus ganancias.
              </p>
            ) : (
              <div className="space-y-6">
                {/* Métricas rápidas de refacciones vendidas */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Costo Compra total</span>
                    <span className="text-base font-extrabold text-red-600">{formatCurrency(soldPartsProfitability.reduce((s, i) => s + (i.cost * i.quantity), 0))}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Ventas (con IVA)</span>
                    <span className="text-base font-extrabold text-gray-900">{formatCurrency(soldPartsProfitability.reduce((s, i) => s + i.amount, 0))}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Ventas Netas (sin IVA)</span>
                    <span className="text-base font-extrabold text-green-600">{formatCurrency(soldPartsProfitability.reduce((s, i) => s + (i.amount / 1.16), 0))}</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block tracking-wider">Ganancia Neta Real</span>
                    <span className="text-base font-extrabold text-brand-600">
                      {formatCurrency(
                        soldPartsProfitability.reduce((s, i) => s + (i.amount / 1.16), 0) -
                        soldPartsProfitability.reduce((s, i) => s + (i.cost * i.quantity), 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="table-header px-4 py-2 text-left text-xs">Refacción / SKU</th>
                        <th className="table-header px-4 py-2 text-left text-xs">Venta / Cliente</th>
                        <th className="table-header px-3 py-2 text-right text-xs">Cant.</th>
                        <th className="table-header px-3 py-2 text-right text-xs">Costo Unit.</th>
                        <th className="table-header px-3 py-2 text-right text-xs">Costo Total</th>
                        <th className="table-header px-3 py-2 text-right text-xs">P. Venta c/IVA</th>
                        <th className="table-header px-3 py-2 text-right text-xs">Venta s/IVA</th>
                        <th className="table-header px-3 py-2 text-right text-xs">Ganancia Neta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {soldPartsProfitability.map((item) => {
                        const totalCostItem = item.cost * item.quantity;
                        const totalSaleSinIva = item.amount / 1.16;
                        const netProfitItem = totalSaleSinIva - totalCostItem;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 text-[11px]">
                            <td className="px-4 py-2">
                              <p className="font-semibold text-gray-950">{item.description}</p>
                              <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</p>
                            </td>
                            <td className="px-4 py-2">
                              <p className="text-gray-900 font-medium">Folio: {item.quoteNumber}</p>
                              <p className="text-[10px] text-gray-500">{item.customerName}</p>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(item.cost)}</td>
                            <td className="px-3 py-2 text-right font-medium text-red-600">{formatCurrency(totalCostItem)}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.amount / item.quantity)}</td>
                            <td className="px-3 py-2 text-right text-green-700 font-medium">{formatCurrency(totalSaleSinIva)}</td>
                            <td className={`px-3 py-2 text-right font-bold ${netProfitItem >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
                              {formatCurrency(netProfitItem)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Historial de Pedidos a Proveedor */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              Historial de Pedidos a Proveedor (Entradas)
            </h3>
            {initialPurchaseOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay pedidos de proveedor registrados. <br />Ve a <strong>Partes → Entrada Rápida</strong> para agregar tu primera entrada.</p>
            ) : (
              <div className="space-y-4">
                {initialPurchaseOrders.map((po: PurchaseOrder) => {
                  const poSalesEstimate = po.items.reduce((s, item) => {
                     const salePrice = item.part?.price || 0
                     return s + (salePrice * item.quantity)
                  }, 0)
                  const poMargin = poSalesEstimate > 0 ? ((poSalesEstimate - po.totalCost) / poSalesEstimate * 100) : 0
                  return (
                    <div key={po.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {po.supplier?.name || 'Proveedor'}
                            {po.invoiceRef && <span className="ml-2 text-xs text-gray-500 font-normal">Factura: {po.invoiceRef}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(po.createdAt).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })} · {po.items.length} artículos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">Costo: {formatCurrency(po.totalCost)}</p>
                          {poSalesEstimate > 0 && (
                            <p className="text-xs text-green-600 font-medium">Precio venta estimado: {formatCurrency(poSalesEstimate)} ({poMargin.toFixed(0)}% margen)</p>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-white">
                            <tr>
                              <th className="table-header px-3 py-2 text-left text-xs">Artículo</th>
                              <th className="table-header px-3 py-2 text-right text-xs">Cant.</th>
                              <th className="table-header px-3 py-2 text-right text-xs">Costo Unit.</th>
                              <th className="table-header px-3 py-2 text-right text-xs">Total Costo</th>
                              <th className="table-header px-3 py-2 text-right text-xs">P. Venta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {po.items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                                <td className="px-3 py-2 text-sm text-right text-gray-600">{item.quantity}</td>
                                <td className="px-3 py-2 text-sm text-right text-gray-600">{formatCurrency(item.unitCost)}</td>
                                <td className="px-3 py-2 text-sm text-right font-medium text-red-600">{formatCurrency(item.totalCost)}</td>
                                <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                                  {item.part?.price ? formatCurrency(item.part.price) : <span className="text-gray-300">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
