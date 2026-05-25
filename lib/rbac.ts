export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DISPATCH: 'DISPATCH',
  DRIVER: 'DRIVER',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function normalizeRole(role?: string | null): UserRole {
  // Compatibilidad con roles previos:
  // SUPERVISOR (anterior) -> ADMIN
  // TRABAJADOR (anterior) -> DISPATCH
  if (role === 'SUPERVISOR') return ROLES.ADMIN
  if (role === 'TRABAJADOR') return ROLES.DISPATCH
  const normalized = role?.toUpperCase();
  if (
    normalized === ROLES.SUPER_ADMIN || 
    normalized === ROLES.ADMIN || 
    normalized === ROLES.DISPATCH ||
    normalized === ROLES.DRIVER
  ) {
    return normalized as UserRole
  }
  return ROLES.DISPATCH
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

export function canManageInventory(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN || r === ROLES.DISPATCH
}

