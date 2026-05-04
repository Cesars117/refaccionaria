export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TRABAJADOR: 'TRABAJADOR',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function normalizeRole(role?: string | null): UserRole {
  // Compatibilidad con roles previos:
  // SUPERVISOR (anterior) -> ADMIN
  if (role === 'SUPERVISOR') return ROLES.ADMIN
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.TRABAJADOR) return role
  return ROLES.TRABAJADOR
}

export function canManageUsers(role?: string | null): boolean {
  return normalizeRole(role) === ROLES.SUPER_ADMIN
}

export function canViewRevenue(role?: string | null): boolean {
  return normalizeRole(role) !== ROLES.TRABAJADOR
}

export function canViewAudit(role?: string | null): boolean {
  return normalizeRole(role) === ROLES.SUPER_ADMIN
}

export function canManageFinances(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN
}
