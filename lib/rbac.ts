export const ROLES = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  TRABAJADOR: 'TRABAJADOR',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export function normalizeRole(role?: string | null): UserRole {
  if (role === ROLES.ADMIN || role === ROLES.SUPERVISOR || role === ROLES.TRABAJADOR) {
    return role
  }
  return ROLES.TRABAJADOR
}

export function canManageUsers(role?: string | null): boolean {
  return normalizeRole(role) === ROLES.ADMIN
}

export function canViewRevenue(role?: string | null): boolean {
  return normalizeRole(role) !== ROLES.TRABAJADOR
}

export function canViewAudit(role?: string | null): boolean {
  const normalized = normalizeRole(role)
  return normalized === ROLES.ADMIN || normalized === ROLES.SUPERVISOR
}
