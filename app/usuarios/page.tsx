import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import {
  createUserAccount,
  deleteUserAccount,
  getUsers,
  resetUserPassword,
  updateUserAccount,
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
                <th className="table-header px-4 py-3">Datos Básicos (Usuario, Nombre, Correo)</th>
                <th className="table-header px-4 py-3">Rol</th>
                <th className="table-header px-4 py-3">Estado</th>
                <th className="table-header px-4 py-3">Contraseña</th>
                <th className="table-header px-4 py-3 text-red-600">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
               {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <form action={updateUserAccount} className="flex flex-wrap items-center gap-2 min-w-[400px]">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="username" defaultValue={u.username ?? ''} placeholder="Usuario" className="input-field h-9 py-1 px-2 text-xs w-28" required />
                      <input name="name" defaultValue={u.name} placeholder="Nombre" className="input-field h-9 py-1 px-2 text-xs w-32" required />
                      <input name="email" defaultValue={u.email} type="email" placeholder="Correo" className="input-field h-9 py-1 px-2 text-xs w-40" required />
                      <button className="btn-secondary text-xs h-9" type="submit" title="Guardar cambios básicos">Guardar</button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input-field h-9 py-1 px-2 text-xs">
                        <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                        <option value={ROLES.ADMIN}>Admin</option>
                        <option value={ROLES.TRABAJADOR}>Trabajador</option>
                      </select>
                      <button className="btn-secondary text-xs h-9" type="submit">Rol</button>
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
                        {u.isActive ? 'Baja' : 'Alta'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={resetUserPassword} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" type="password" minLength={8} required placeholder="Nueva clave" className="input-field h-9 py-1 px-2 text-xs w-28" />
                      <button type="submit" className="btn-secondary text-xs h-9">Reset</button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteUserAccount} onSubmit={(e) => { if (!confirm('¿Estás seguro de eliminar este usuario?')) e.preventDefault() }}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar usuario">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
