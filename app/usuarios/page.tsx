import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  createUserAccount,
  getUsers,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
} from '@/app/actions'
import { authOptions } from '@/lib/auth'
import { canManageUsers, ROLES } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
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
        <p className="text-sm text-gray-500">Solo administrador puede crear usuarios, cambiar roles y restablecer contraseñas.</p>
      </div>

      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Crear Usuario</h2>
        <form action={createUserAccount} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input name="username" required placeholder="Usuario" className="input-field" />
          <input name="name" required placeholder="Nombre" className="input-field" />
          <input name="email" type="email" required placeholder="Correo" className="input-field" />
          <input name="password" type="password" required minLength={8} placeholder="Contraseña" className="input-field" />
          <select name="role" defaultValue={ROLES.TRABAJADOR} className="input-field">
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.TRABAJADOR}>Trabajador</option>
          </select>
          <div className="md:col-span-5">
            <button type="submit" className="btn-primary">Crear Usuario</button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header px-4 py-3">Usuario</th>
              <th className="table-header px-4 py-3">Nombre</th>
              <th className="table-header px-4 py-3">Correo</th>
              <th className="table-header px-4 py-3">Rol</th>
              <th className="table-header px-4 py-3">Estado</th>
              <th className="table-header px-4 py-3">Contraseña</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{u.username ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                <td className="px-4 py-3">
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="input-field h-9 py-1 px-2 text-xs">
                      <option value={ROLES.ADMIN}>Admin</option>
                      <option value={ROLES.SUPERVISOR}>Supervisor</option>
                      <option value={ROLES.TRABAJADOR}>Trabajador</option>
                    </select>
                    <button className="btn-secondary text-xs h-9" type="submit">Guardar</button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={updateUserStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="isActive" value={String(!u.isActive)} />
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <button type="submit" className="btn-secondary text-xs h-9">
                      {u.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={resetUserPassword} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="password" type="password" minLength={8} required placeholder="Nueva contraseña" className="input-field h-9 py-1 px-2 text-xs" />
                    <button type="submit" className="btn-secondary text-xs h-9">Actualizar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
