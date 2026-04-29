export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TRABAJADOR: 'TRABAJADOR',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function normalizeRole(role?: string | null): UserRole {
  // Compatibilidad con roles previos:
  // ADMIN (anterior) -> SUPER_ADMIN
  // SUPERVISOR (anterior) -> ADMIN
  if (role === 'SUPERVISOR') return ROLES.ADMIN
  if (role === 'ADMIN') return ROLES.SUPER_ADMIN
  if (role === ROLES.SUPER_ADMIN || role === ROLES.TRABAJADOR) return role
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
