'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function AuditFilter({ initialType, options }: { initialType: string, options: { label: string, value: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set('type', val)
    else params.delete('type')
    router.push(`/auditoria?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Filtrar por:</label>
      <select 
        defaultValue={initialType}
        onChange={handleChange}
        className="input-field py-1 h-9 text-sm min-w-[180px]"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
