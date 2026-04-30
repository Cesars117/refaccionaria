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
                <th className="table-header px-4 py-3">Datos (Usuario/Nombre/Email)</th>
                <th className="table-header px-4 py-3">Rol</th>
                <th className="table-header px-4 py-3">Estado</th>
                <th className="table-header px-4 py-3">Contraseña</th>
                <th className="table-header px-4 py-3">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <form action={updateUserAccount} className="space-y-1">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="username" defaultValue={u.username ?? ''} className="input-field h-8 py-1 px-2 text-xs" placeholder="Usuario" />
                      <input name="name" defaultValue={u.name} className="input-field h-8 py-1 px-2 text-xs" placeholder="Nombre" />
                      <input name="email" defaultValue={u.email} className="input-field h-8 py-1 px-2 text-xs" placeholder="Email" />
                      <button type="submit" className="text-[10px] text-brand-600 hover:underline font-bold">Guardar Cambios</button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserRole} className="flex flex-col gap-1">
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
                    <form action={updateUserStatus} className="flex flex-col gap-1">
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
                    <form action={resetUserPassword} className="flex flex-col gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" type="password" minLength={8} required placeholder="Nueva clave" className="input-field h-8 py-1 px-2 text-xs" />
                      <button type="submit" className="text-[10px] text-brand-600 hover:underline font-bold text-left">Reset Clave</button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteUser} onAction={(formData) => confirm('¿Eliminar usuario definitivamente?') ? deleteUser(formData) : null}>
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-red-600 hover:text-red-800 text-xs font-bold">Eliminar</button>
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
