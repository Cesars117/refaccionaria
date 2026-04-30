import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  createUserAccount,
  getUsers,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
  updateUserAccount,
  deleteUser,
} from '@/app/actions'
import { authOptions } from '@/lib/auth'
import { canManageUsers, ROLES } from '@/lib/rbac'

import UserRow from './UserRow'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role

    if (!canManageUsers(role)) {
      redirect('/')
    }

    const users = await getUsers()

    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
          <p className="text-sm text-gray-500">Solo super admin puede crear usuarios, cambiar roles y restablecer contraseñas.</p>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Crear Usuario</h2>
          <form action={createUserAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input name="username" required placeholder="Usuario" className="input-field" />
            <input name="name" required placeholder="Nombre" className="input-field" />
            <input name="email" type="email" required placeholder="Correo" className="input-field" />
            <input name="password" type="password" required minLength={8} placeholder="Contraseña" className="input-field" />
            <select name="role" defaultValue={ROLES.TRABAJADOR} className="input-field">
              <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.TRABAJADOR}>Trabajador</option>
            </select>
            <div className="md:col-span-5">
              <button type="submit" className="btn-primary">Crear Usuario</button>
            </div>
          </form>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header px-4 py-3">Datos (Usuario/Nombre/Email)</th>
                  <th className="table-header px-4 py-3">Rol</th>
                  <th className="table-header px-4 py-3">Estado</th>
                  <th className="table-header px-4 py-3">Contraseña</th>
                  <th className="table-header px-4 py-3">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {JSON.parse(JSON.stringify(users)).map((u: any) => (
                  <UserRow key={u.id} u={u} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    console.error('Error in UsuariosPage:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h3 className="text-red-800 font-bold">Error al cargar usuarios</h3>
          <p className="text-red-600 text-sm">{error.message || 'Error interno del servidor'}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs text-red-700 underline">Reintentar</button>
        </div>
      </div>
    )
  }
}
