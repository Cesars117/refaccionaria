export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TRABAJADOR: 'TRABAJADOR',
  DISPATCH: 'DISPATCH',
  DRIVER: 'DRIVER',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function normalizeRole(role?: string | null): UserRole {
  // Compatibilidad con roles previos:
  // SUPERVISOR (anterior) -> ADMIN
  if (role === 'SUPERVISOR') return ROLES.ADMIN
  const normalized = role?.toUpperCase();
  if (
    normalized === ROLES.SUPER_ADMIN || 
    normalized === ROLES.ADMIN || 
    normalized === ROLES.TRABAJADOR ||
    normalized === ROLES.DISPATCH ||
    normalized === ROLES.DRIVER
  ) {
    return normalized as UserRole
  }
  return ROLES.TRABAJADOR
}

export function canManageUsers(role?: string | null): boolean {
  return normalizeRole(role) === ROLES.SUPER_ADMIN
}

export function canViewRevenue(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN || r === ROLES.DISPATCH
}

export function canViewAudit(role?: string | null): boolean {
  return normalizeRole(role) === ROLES.SUPER_ADMIN
}

export function canManageFinances(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN
}
