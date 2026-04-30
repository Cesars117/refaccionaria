'use client';

import { useState } from 'react';
import { 
  updateUserAccount, 
  updateUserRole, 
  updateUserStatus, 
  resetUserPassword, 
  deleteUser 
} from '@/app/actions';
import { ROLES } from '@/lib/rbac';

export default function UserRow({ u }: { u: any }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: Function, formData: FormData, actionName: string) => {
    setLoading(actionName);
    setError(null);
    try {
      await action(formData);
    } catch (err: any) {
      setError(err.message || 'Error en la operación');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <form action={(fd) => handleAction(updateUserAccount, fd, 'data')} className="space-y-1">
          <input type="hidden" name="id" value={u.id} />
          <input name="username" defaultValue={u.username ?? ''} className="input-field h-8 py-1 px-2 text-xs" placeholder="Usuario" />
          <input name="name" defaultValue={u.name} className="input-field h-8 py-1 px-2 text-xs" placeholder="Nombre" />
          <input name="email" defaultValue={u.email} className="input-field h-8 py-1 px-2 text-xs" placeholder="Email" />
          <button type="submit" disabled={!!loading} className="text-[10px] text-brand-600 hover:underline font-bold disabled:opacity-50">
            {loading === 'data' ? 'Cargando...' : 'Guardar Cambios'}
          </button>
        </form>
        {error && <p className="text-[9px] text-red-600 mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3">
        <form action={(fd) => handleAction(updateUserRole, fd, 'role')} className="flex flex-col gap-1">
          <input type="hidden" name="id" value={u.id} />
          <select name="role" defaultValue={u.role} className="input-field h-8 py-1 px-2 text-xs">
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.TRABAJADOR}>Trabajador</option>
          </select>
          <button className="text-[10px] text-brand-600 hover:underline font-bold text-left" type="submit">Actualizar Rol</button>
        </form>
      </td>
      <td className="px-4 py-3">
        <form action={(fd) => handleAction(updateUserStatus, fd, 'status')} className="flex flex-col gap-1">
          <input type="hidden" name="id" value={u.id} />
          <input type="hidden" name="isActive" value={String(!u.isActive)} />
          <span className={`inline-flex self-start rounded-full px-2 py-0.5 text-[10px] font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
            {u.isActive ? 'Activo' : 'Inactivo'}
          </span>
          <button type="submit" className="text-[10px] text-gray-600 hover:underline font-bold text-left">
            {u.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </form>
      </td>
      <td className="px-4 py-3">
        <form action={(fd) => handleAction(resetUserPassword, fd, 'pass')} className="flex flex-col gap-1">
          <input type="hidden" name="id" value={u.id} />
          <input name="password" type="password" minLength={8} required placeholder="Nueva clave" className="input-field h-8 py-1 px-2 text-xs" />
          <button type="submit" className="text-[10px] text-brand-600 hover:underline font-bold text-left">Reset Clave</button>
        </form>
      </td>
      <td className="px-4 py-3">
        <form action={(fd) => { if (confirm('¿Eliminar usuario definitivamente?')) handleAction(deleteUser, fd, 'delete'); }}>
          <input type="hidden" name="id" value={u.id} />
          <button type="submit" className="text-red-600 hover:text-red-800 text-xs font-bold">Eliminar</button>
        </form>
      </td>
    </tr>
  );
}
