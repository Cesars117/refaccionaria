'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { authOptions } from '@/lib/auth'
import { canManageUsers, canManageFinances, canManageInventory, normalizeRole, ROLES } from '@/lib/rbac'

async function getSessionUser() {
  const session = await getServerSession(authOptions)
  return {
    email: session?.user?.email ?? 'system@local',
    name: session?.user?.name ?? 'Sistema',
    role: normalizeRole(session?.user?.role),
  }
}

async function requireAdminUser() {
  const user = await getSessionUser()
  if (!canManageUsers(user.role)) {
    throw new Error('No autorizado: solo super admin')
  }
  await ensureSchemaRepair()
  return user
}

async function requireAdminOrFinanceUser() {
  const user = await getSessionUser()
  if (!canManageFinances(user.role)) {
    throw new Error('No autorizado: solo admin o super admin')
  }
  await ensureSchemaRepair()
  return user
}

async function requireInventoryManager() {
  const user = await getSessionUser()
  if (!canManageInventory(user.role)) {
    throw new Error('No autorizado: solo administradores o despachadores')
  }
  await ensureSchemaRepair()
  return user
}

async function ensureSchemaRepair() {
  // Auto-reparación silenciosa del esquema
  try {
    await db.$executeRaw`ALTER TABLE users ADD COLUMN username TEXT`
  } catch {}
  try {
    await db.$executeRaw`ALTER TABLE parts ADD COLUMN priceFleet REAL`
  } catch {}
  try {
    await db.$executeRaw`ALTER TABLE parts ADD COLUMN oemNumber TEXT`
  } catch {}
  try {
    await db.$executeRaw`ALTER TABLE parts ADD COLUMN brand TEXT`
  } catch {}
  try {
    await db.$executeRaw`ALTER TABLE locations ADD COLUMN type TEXT`
  } catch {}
  try {
    await db.$executeRaw`ALTER TABLE locations ADD COLUMN description TEXT`
  } catch {}
}

async function logAudit(action: string, entityType: string, entityId: string, details?: string) {
  try {
    const actor = await getSessionUser()
    await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userEmail: actor.email,
        userName: actor.name,
        details: details ?? null,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}

// ─── SEED DATA ────────────────────────────────────────────
export async function seedInitialData() {
  const catCount = await db.category.count()
  if (catCount === 0) {
    await db.category.createMany({
      data: [
        { name: 'Frenos', description: 'Balatas, discos, tambores, cilindros de rueda' },
        { name: 'Motor', description: 'Filtros, empaques, bujias, bandas, cadenas' },
        { name: 'Suspension', description: 'Amortiguadores, rotulas, terminales, hojas de resorte' },
        { name: 'Transmision', description: 'Clutch, sincros, flechas, juntas homoineticas' },
        { name: 'Electrico', description: 'Fusibles, focos, alternadores, baterias, arrancadores' },
        { name: 'Carroceria', description: 'Faros, espejos, manijas, molduras, parabrisas' },
        { name: 'Enfriamiento', description: 'Radiadores, mangueras, termostatos, tapones' },
        { name: 'Direccion', description: 'Cremalleras, bombas hidraulicas, mangueras de direccion' },
        { name: 'Lubricantes', description: 'Aceites de motor, transmision, diferencial, liquido de frenos' },
        { name: 'Filtros', description: 'Filtros de aceite, aire, combustible, habitaculo' },
      ],
      skipDuplicates: true,
    })
  }
  const locCount = await db.location.count()
  if (locCount === 0) {
    await db.location.createMany({
      data: [
        { name: 'Estante A-1' },
        { name: 'Estante A-2' },
        { name: 'Estante B-1' },
        { name: 'Estante B-2' },
        { name: 'Estante C-1' },
        { name: 'Almacen General' },
        { name: 'Bodega 2' },
        { name: 'Vitrina' },
      ],
      skipDuplicates: true,
    })
  }
}

// ─── PARTS ────────────────────────────────────────────────
export async function getParts(query?: string, filterLow?: boolean) {
  return db.part.findMany({
    where: {
      location: {
        name: {
          not: 'Proveedor (Catálogo)'
        }
      },
      ...(query ? {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
          { oemNumber: { contains: query } },
          { barcode: { contains: query } },
          { brand: { contains: query } },
          { category: { name: { contains: query } } },
        ],
      } : {}),
    },
    include: { category: true, location: true },
    orderBy: { name: 'asc' },
  })
}

export async function getPartById(id: number) {
  try {
    return await db.part.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
      },
    })
  } catch (error) {
    console.error('Error in getPartById:', error)
    return db.part.findUnique({ where: { id } })
  }
}

export async function createPart(formData: FormData) {
  await requireInventoryManager()
  const name = formData.get('name') as string
  const categoryId = parseInt(formData.get('categoryId') as string)
  const locationId = parseInt(formData.get('locationId') as string)
  const quantity = parseInt(formData.get('quantity') as string || '0')
  const minStock = parseInt(formData.get('minStock') as string || '0')
  const price = parseFloat(formData.get('price') as string || '0')
  const priceFleet = formData.get('priceFleet') ? parseFloat(formData.get('priceFleet') as string) : null
  const cost = parseFloat(formData.get('cost') as string || '0')

  const created = await db.part.create({
    data: {
      name,
      categoryId,
      locationId,
      quantity,
      minStock,
      price,
      priceFleet,
      cost,
      brand: (formData.get('brand') as string) || null,
      sku: (formData.get('sku') as string) || null,
      barcode: (formData.get('barcode') as string) || null,
      oemNumber: (formData.get('oemNumber') as string) || null,
      description: (formData.get('description') as string) || null,
    },
  })
  await logAudit('PART_CREATED', 'PART', String(created.id), `Nueva parte: ${created.name}`)
  revalidatePath('/partes')
  redirect('/partes')
}

export async function updatePart(formData: FormData) {
  try {
    await requireInventoryManager()
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const categoryId = parseInt(formData.get('categoryId') as string) || 1
    const locationId = parseInt(formData.get('locationId') as string) || 1
    const quantity = parseInt(formData.get('quantity') as string || '0')
    const minStock = parseInt(formData.get('minStock') as string || '0')
    const price = parseFloat(formData.get('price') as string || '0')
    const cost = parseFloat(formData.get('cost') as string || '0')
    const brand = (formData.get('brand') as string) || ''
    const sku = (formData.get('sku') as string) || ''
    const oemNumber = (formData.get('oemNumber') as string) || ''
    const description = (formData.get('description') as string) || ''

    // Usar Prisma para máxima compatibilidad con SQLite y MariaDB
    await db.part.update({
      where: { id },
      data: {
        name,
        categoryId,
        locationId,
        quantity,
        minStock,
        price,
        cost,
        brand: brand || null,
        sku: sku || null,
        oemNumber: oemNumber || null,
        description: description || null,
      }
    })
    await logAudit('PART_UPDATED', 'PART', String(id), `Actualización: ${name}`)
    revalidatePath('/partes')
    return { success: true }
  } catch (err) {
    console.error('CRITICAL UPDATE ERROR:', err)
    return { success: false, error: String(err) }
  }
}


// ─── CATEGORIES ────────────────────────────────────────────
export async function getCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(formData: FormData) {
  await requireInventoryManager()
  try {
    const created = await db.category.create({
      data: {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
      },
    })
    await logAudit('CATEGORY_CREATED', 'INVENTORY', String(created.id), `Categoría: ${created.name}`)
    revalidatePath('/categorias')
  } catch (error) {
    console.error('Error creating category:', error)
    throw new Error('Error al crear la categoría. Asegúrese de que el nombre no esté duplicado.')
  }
}

export async function updateCategory(formData: FormData) {
  await requireInventoryManager()
  const id = parseInt(formData.get('id') as string)
  try {
    const updated = await db.category.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || null,
      },
    })
    await logAudit('CATEGORY_UPDATED', 'INVENTORY', String(id), `Actualización: ${updated.name}`)
    revalidatePath('/categorias')
  } catch (error) {
    console.error('Error updating category:', error)
    throw new Error('Error al actualizar la categoría.')
  }
}

export async function deleteCategory(formData: FormData) {
  await requireInventoryManager()
  const id = parseInt(formData.get('id') as string)
  try {
    const cat = await db.category.findUnique({ where: { id }, include: { _count: { select: { parts: true } } } })
    if (cat?._count?.parts && cat._count.parts > 0) {
      // Silently fail or log, but avoid throw to prevent server-side crash screen
      console.warn('Cannot delete category with parts')
      return
    }
    await db.category.delete({ where: { id } })
    await logAudit('CATEGORY_DELETED', 'INVENTORY', String(id), `Categoría eliminada (ID: ${id})`)
    revalidatePath('/categorias')
  } catch (error) {
    console.error('Error deleting category:', error)
  }
}

// ─── LOCATIONS ────────────────────────────────────────────
export async function getLocations() {
  try {
    await ensureSchemaRepair()
    return await db.location.findMany({ 
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { parts: true } }
      }
    })
  } catch (error) {
    console.error('Error in getLocations Prisma fetch:', error)
    try {
      // Fallback to raw SQL if schema is out of sync
      const raw = await db.$queryRaw`SELECT id, name FROM locations ORDER BY name ASC`
      return (raw as any[]).map(l => ({ ...l, _count: { parts: 0 } }))
    } catch (e) {
      console.error('Critical failure in getLocations:', e)
      return []
    }
  }
}

export async function createLocation(formData: FormData) {
  try {
    await requireInventoryManager()
    await ensureSchemaRepair()
    const name = formData.get('name') as string
    const type = (formData.get('type') as string) || 'WAREHOUSE'
    const description = (formData.get('description') as string) || ''
    
    // Intento con SQL puro
    try {
      await db.$executeRawUnsafe(
        `INSERT INTO locations (name, type, description) VALUES (?, ?, ?)`,
        name, type, description
      )
    } catch (e) {
      // Fallback si las columnas no existen aún
      await db.$executeRawUnsafe(
        `INSERT INTO locations (name) VALUES (?)`,
        name
      )
    }
    revalidatePath('/ubicaciones')
    await logAudit('LOCATION_CREATED', 'INVENTORY', name, `Nueva ubicación: ${name}`)
    return { success: true }
  } catch (error: any) {
    console.error('Create location error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateLocation(formData: FormData) {
  await requireInventoryManager()
  const id = parseInt(formData.get('id') as string)
  try {
    const updated = await db.location.update({
      where: { id },
      data: {
        name: formData.get('name') as string,
        type: (formData.get('type') as string) || 'WAREHOUSE',
        description: (formData.get('description') as string) || null,
      },
    })
    await logAudit('LOCATION_UPDATED', 'INVENTORY', String(id), `Ubicación actualizada: ${updated.name}`)
    revalidatePath('/ubicaciones')
  } catch (error) {
    console.error('Error updating location:', error)
    throw new Error('Error al actualizar la ubicación.')
  }
}

export async function deleteLocation(formData: FormData) {
  try {
    await requireInventoryManager()
    const id = parseInt(formData.get('id') as string)
    const deleteParts = formData.get('deleteParts') === 'true'
    const transferParts = formData.get('transferParts') === 'true'

    const count: any = await db.$queryRaw`SELECT COUNT(*) as count FROM parts WHERE locationId = ${id}`
    const partsCount = count[0]?.count || 0

    if (partsCount > 0) {
      if (deleteParts) {
        const parts = await db.part.findMany({ where: { locationId: id } })
        for (const p of parts) {
          const usedInQuotes = await db.quoteItem.findFirst({ where: { partId: p.id } })
          const usedInProjects = await db.projectPart.findFirst({ where: { partId: p.id } })
          if (usedInQuotes || usedInProjects) {
            return { 
              success: false, 
              error: `No se puede eliminar la parte '${p.name}' porque está en uso en cotizaciones o proyectos activos. Primero elimínela de allí.` 
            }
          }
        }
        await db.$executeRawUnsafe(`DELETE FROM parts WHERE locationId = ?`, id)
      } else if (transferParts) {
        let generalLoc = await db.location.findFirst({
          where: { name: 'Almacen General' }
        })
        if (!generalLoc) {
          generalLoc = await db.location.findFirst({
            where: { id: { not: id } }
          })
        }
        if (!generalLoc) {
          return { success: false, error: 'No se encontró un almacén alternativo para transferir las partes.' }
        }
        await db.part.updateMany({
          where: { locationId: id },
          data: { locationId: generalLoc.id }
        })
      } else {
        return { success: false, error: 'La ubicación tiene partes asignadas. Elija eliminarlas o transferirlas.' }
      }
    }

    await db.$executeRawUnsafe(`DELETE FROM locations WHERE id = ?`, id)
    await logAudit('LOCATION_DELETED', 'INVENTORY', String(id), `Ubicación eliminada (ID: ${id})`)
    
    revalidatePath('/ubicaciones')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting location:', error)
    return { success: false, error: error.message }
  }
}

export async function deletePart(formData: FormData) {
  try {
    await requireInventoryManager()
    const id = parseInt(formData.get('id') as string)

    // Verificar si la parte está siendo usada en alguna cotización
    const usedInQuotes = await db.quoteItem.findFirst({
      where: { partId: id },
      include: { quote: { select: { quoteNumber: true } } }
    })

    if (usedInQuotes) {
      return {
        success: false,
        error: `No se puede eliminar: esta parte está en uso en la cotización ${usedInQuotes.quote.quoteNumber}. Elimínala de la cotización primero.`
      }
    }

    // También verificar en proyectos de mantenimiento
    const usedInProjects = await db.projectPart.findFirst({ where: { partId: id } })
    if (usedInProjects) {
      return {
        success: false,
        error: 'No se puede eliminar: esta parte está en uso en un proyecto de mantenimiento.'
      }
    }

    await db.$executeRawUnsafe(`DELETE FROM parts WHERE id = ?`, id)
    await logAudit('PART_DELETED', 'PART', String(id), `Parte eliminada (ID: ${id})`)
    revalidatePath('/partes')
    return { success: true }
  } catch (error: any) {
    console.error('Delete part error:', error)
    return { success: false, error: error.message }
  }
}


// ─── CUSTOMERS ────────────────────────────────────────────
export async function getCustomers(type?: string) {
  return db.customer.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { quotes: true } },
      fleet: { include: { _count: { select: { units: true, projects: true } } } },
    },
  })
}

export async function getCustomerById(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
      fleet: {
        include: {
          units: { orderBy: { make: 'asc' } },
          projects: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { fleetUnit: true },
          },
        },
      },
    },
  })
}

export async function createCustomer(formData: FormData) {
  const type = formData.get('type') as string || 'RETAIL'
  const fleetName = formData.get('fleetName') as string | null

  const customer = await db.customer.create({
    data: {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      rfc: (formData.get('rfc') as string) || null,
      notes: (formData.get('notes') as string) || null,
      type,
    },
  })

  // Si es cliente de flota, crear la flota automáticamente
  if (type === 'FLEET') {
    await db.fleet.create({
      data: {
        name: fleetName || `Flota de ${formData.get('name')}`,
        customerId: customer.id,
      },
    })
  }

  await logAudit('CUSTOMER_CREATED', 'CUSTOMER', customer.id, `Cliente: ${customer.name} (${type})`)
  revalidatePath('/clientes')
  redirect('/clientes')
}

export async function updateCustomer(formData: FormData) {
  const id = formData.get('id') as string
  await db.customer.update({
    where: { id },
    data: {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      rfc: (formData.get('rfc') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })
  await logAudit('CUSTOMER_UPDATED', 'CUSTOMER', id, `Actualización: ${formData.get('name')}`)
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}

export async function deleteCustomer(formData: FormData) {
  const id = formData.get('id') as string
  const customer = await db.customer.findUnique({ where: { id }, select: { name: true } })
  await db.customer.delete({ where: { id } })
  await logAudit('CUSTOMER_DELETED', 'CUSTOMER', id, `Cliente eliminado: ${customer?.name || id}`)
  revalidatePath('/clientes')
  redirect('/clientes')
}

// ─── FLEET UNITS ──────────────────────────────────────────
export async function createFleetUnit(formData: FormData) {
  const fleetId = formData.get('fleetId') as string
  await db.fleetUnit.create({
    data: {
      fleetId,
      year: parseInt(formData.get('year') as string),
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      trim: (formData.get('trim') as string) || null,
      color: (formData.get('color') as string) || null,
      plate: (formData.get('plate') as string) || null,
      vin: (formData.get('vin') as string) || null,
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null,
      engine: (formData.get('engine') as string) || null,
      notes: (formData.get('notes') as string) || null,
    },
  })
  // Find the customer of this fleet
  const fleet = await db.fleet.findUnique({ where: { id: fleetId } })
  await logAudit('FLEET_UNIT_CREATED', 'FLEET', fleetId, `Unidad añadida: ${formData.get('make')} ${formData.get('model')}`)
  revalidatePath(`/clientes/${fleet?.customerId}`)
  revalidatePath('/flotas')
}

export async function deleteFleetUnit(formData: FormData) {
  const id = formData.get('id') as string
  const unit = await db.fleetUnit.findUnique({ where: { id }, include: { fleet: true } })
  await db.fleetUnit.delete({ where: { id } })
  await logAudit('FLEET_UNIT_DELETED', 'FLEET', id, `Unidad eliminada: ${unit?.make} ${unit?.model} (Placa: ${unit?.plate})`)
  revalidatePath(`/clientes/${unit?.fleet?.customerId}`)
  revalidatePath('/flotas')
}

// ─── MAINTENANCE PROJECTS ─────────────────────────────────
function genProjectNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `PROY-${year}-${rand}`
}

export async function getProjects(status?: string) {
  return db.maintenanceProject.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      fleet: { include: { customer: true } },
      fleetUnit: true,
      _count: { select: { parts: true } },
    },
  })
}

export async function getProjectById(id: string) {
  return db.maintenanceProject.findUnique({
    where: { id },
    include: {
      fleet: { include: { customer: true } },
      fleetUnit: true,
      parts: {
        include: { part: { include: { category: true, location: true } } },
      },
    },
  })
}

export async function createProject(formData: FormData) {
  const fleetId = formData.get('fleetId') as string
  const fleetUnitId = formData.get('fleetUnitId') as string

  let projectNumber = genProjectNumber()
  let existing = await db.maintenanceProject.findUnique({ where: { projectNumber } })
  while (existing) {
    projectNumber = genProjectNumber()
    existing = await db.maintenanceProject.findUnique({ where: { projectNumber } })
  }

  const project = await db.maintenanceProject.create({
    data: {
      projectNumber,
      fleetId,
      fleetUnitId,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      priority: (formData.get('priority') as string) || 'NORMAL',
      mileageAtService: formData.get('mileageAtService') ? parseInt(formData.get('mileageAtService') as string) : null,
      status: 'OPEN',
    },
  })
  await logAudit('PROJECT_CREATED', 'PROJECT', project.id, `Proyecto ${project.projectNumber}: ${project.name}`)
  revalidatePath('/proyectos')
  redirect(`/proyectos/${project.id}`)
}

export async function updateProjectStatus(formData: FormData) {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const data: Record<string, unknown> = { status }
  if (status === 'COMPLETED') data.completedDate = new Date()
  if (status === 'IN_PROGRESS') data.startDate = new Date()
  await db.maintenanceProject.update({ where: { id }, data })
  await logAudit('PROJECT_STATUS_CHANGED', 'PROJECT', id, `Estado actualizado a ${status}`)
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
}

export async function deleteProject(formData: FormData) {
  const id = formData.get('id') as string
  const project = await db.maintenanceProject.findUnique({ where: { id }, select: { projectNumber: true } })
  await db.maintenanceProject.delete({ where: { id } })
  await logAudit('PROJECT_DELETED', 'PROJECT', id, `Proyecto eliminado: ${project?.projectNumber || id}`)
  revalidatePath('/proyectos')
  redirect('/proyectos')
}

export async function addProjectPart(formData: FormData) {
  const projectId = formData.get('projectId') as string
  const partId = parseInt(formData.get('partId') as string)
  const quantity = parseInt(formData.get('quantity') as string || '1')
  const unitPrice = parseFloat(formData.get('unitPrice') as string || '0')

  await db.projectPart.create({
    data: {
      projectId,
      partId,
      quantity,
      unitPrice,
      notes: (formData.get('notes') as string) || null,
    },
  })
  await logAudit('PROJECT_PART_ADDED', 'PROJECT', projectId, `Parte añadida: ${partId} x${quantity}`)
  revalidatePath(`/proyectos/${projectId}`)
}

export async function removeProjectPart(formData: FormData) {
  const id = formData.get('id') as string
  const pp = await db.projectPart.findUnique({ where: { id } })
  await db.projectPart.delete({ where: { id } })
  if (pp) {
    await logAudit('PROJECT_PART_REMOVED', 'PROJECT', pp.projectId, `Parte removida (ID: ${pp.partId})`)
  }
  revalidatePath(`/proyectos/${pp?.projectId}`)
}

// Marcar proyecto como completado y descontar partes del inventario
export async function completeProject(formData: FormData) {
  const id = formData.get('id') as string
  const project = await db.maintenanceProject.findUnique({
    where: { id },
    include: { parts: true },
  })
  if (!project) throw new Error('Proyecto no encontrado')
  if (project.status === 'COMPLETED') throw new Error('El proyecto ya fue completado')

  await db.$transaction(async (tx) => {
    // Descontar partes del inventario
    for (const pp of project.parts) {
      await tx.part.update({
        where: { id: pp.partId },
        data: { quantity: { decrement: pp.quantity } },
      })
    }
    await tx.maintenanceProject.update({
      where: { id },
      data: { status: 'COMPLETED', completedDate: new Date() },
    })
  })

  await logAudit('PROJECT_COMPLETED', 'PROJECT', id, `Proyecto ${project.projectNumber} finalizado. Inventario descontado.`)
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
}

// ─── QUOTES ───────────────────────────────────────────────
function genQuoteNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `COT-${year}-${rand}`
}

export async function getQuotes(status?: string) {
  return db.quote.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      _count: { select: { items: true } },
    },
  })
}

export async function getQuoteById(id: string) {
  return db.quote.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { part: { include: { category: true, location: true } } } },
    },
  })
}


export async function createQuote(formData: FormData) {
  const customerId = formData.get('customerId') as string

  let quoteNumber = genQuoteNumber()
  let existing = await db.quote.findUnique({ where: { quoteNumber } })
  while (existing) {
    quoteNumber = genQuoteNumber()
    existing = await db.quote.findUnique({ where: { quoteNumber } })
  }

  const quote = await db.quote.create({
    data: {
      quoteNumber,
      customerId,
      vehicleRef: (formData.get('vehicleRef') as string) || null,
      notes: (formData.get('notes') as string) || null,
      status: 'PENDING',
    },
  })
  await logAudit('QUOTE_CREATED', 'QUOTE', quote.id, `Cotización ${quote.quoteNumber} creada`)
  revalidatePath('/cotizaciones')
  redirect(`/cotizaciones/${quote.id}`)
}

export async function updateQuote(formData: FormData) {
  const id = formData.get('id') as string
  const customerId = formData.get('customerId') as string
  const vehicleRef = formData.get('vehicleRef') as string
  const notes = formData.get('notes') as string

  await db.quote.update({
    where: { id },
    data: {
      customerId,
      vehicleRef,
      notes,
    },
  })

  await logAudit('QUOTE_UPDATED', 'QUOTE', id, `Datos de cotización actualizados`)
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
}

export async function updateQuoteStatus(formData: FormData) {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const restoreStock = formData.get('restoreStock') === 'true'
  
  const quote = await db.quote.findUnique({
    where: { id },
    include: { items: { include: { part: { include: { location: true } } } } },
  })

  if (!quote) throw new Error('Cotización no encontrada')

  // Si se marca como SOLD, descontar inventario si no se había hecho antes
  if (status === 'SOLD' && quote.status !== 'SOLD') {
    await db.$transaction(async (tx) => {
      for (const item of quote.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
      await tx.quote.update({
        where: { id },
        data: { status: 'SOLD' },
      })
      
      // Registrar como ingreso financiero automáticamente
      await tx.financialEntry.create({
        data: {
          type: 'INCOME',
          category: 'SALES',
          amount: quote.total,
          description: `Venta Cotización ${quote.quoteNumber}`,
          isPaid: true,
          date: new Date(),
        }
      })
    })
    await logAudit('QUOTE_SOLD', 'QUOTE', id, `Venta cerrada: ${quote.quoteNumber}. Inventario descontado e ingreso registrado.`)
  } else if (status === 'CANCELLED' && quote.status === 'SOLD') {
    await db.$transaction(async (tx) => {
      if (restoreStock) {
        const stockWasDecremented = 
          quote.fulfillmentStatus === 'PENDING_DELIVERY' || 
          quote.fulfillmentStatus === 'PENDING_PICKUP' || 
          quote.fulfillmentStatus === 'COMPLETED' || 
          (quote.fulfillmentStatus === 'AWAITING_STOCK' && quote.supplierStatus === 'RECEIVED')

        if (stockWasDecremented) {
          for (const item of quote.items) {
            const isCatalog = item.part.location?.name === 'Proveedor (Catálogo)'
            if (!isCatalog) {
              await tx.part.update({
                where: { id: item.partId },
                data: { quantity: { increment: item.quantity } }
              })
            }
          }
        }
      }
      
      // Cancelar la cotización, resetear logística
      await tx.quote.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          fulfillmentStatus: 'CANCELLED',
          supplierStatus: 'NONE'
        }
      })

      // Borrar el registro financiero de la venta
      await tx.financialEntry.deleteMany({
        where: { description: { contains: `Cotización ${quote.quoteNumber}` } }
      })
    })
    await logAudit('QUOTE_STATUS_CHANGED', 'QUOTE', id, `Venta cancelada: ${quote.quoteNumber}. Stock devuelto: ${restoreStock}`)
  } else {
    await db.quote.update({ where: { id }, data: { status } })
    await logAudit('QUOTE_STATUS_CHANGED', 'QUOTE', id, `Estado actualizado a ${status}`)
  }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
  revalidatePath('/') // Revalidar dashboard para métricas
}

export async function deleteQuote(formData: FormData) {
  const id = formData.get('id') as string
  const restoreStock = formData.get('restoreStock') === 'true'

  const quote = await db.quote.findUnique({
    where: { id },
    include: { items: { include: { part: { include: { location: true } } } } }
  })
  
  if (!quote) throw new Error('Cotización no encontrada')

  await db.$transaction(async (tx) => {
    if (restoreStock && quote.status === 'SOLD') {
      const stockWasDecremented = 
        quote.fulfillmentStatus === 'PENDING_DELIVERY' || 
        quote.fulfillmentStatus === 'PENDING_PICKUP' || 
        quote.fulfillmentStatus === 'COMPLETED' || 
        (quote.fulfillmentStatus === 'AWAITING_STOCK' && quote.supplierStatus === 'RECEIVED')

      if (stockWasDecremented) {
        for (const item of quote.items) {
          const isCatalog = item.part.location?.name === 'Proveedor (Catálogo)'
          if (!isCatalog) {
            await tx.part.update({
              where: { id: item.partId },
              data: { quantity: { increment: item.quantity } }
            })
          }
        }
      }
    }

    // Borrar el registro financiero de la venta si existía
    await tx.financialEntry.deleteMany({
      where: { description: { contains: `Cotización ${quote.quoteNumber}` } }
    })

    await tx.quote.delete({ where: { id } })
  })

  await logAudit('QUOTE_DELETED', 'QUOTE', id, `Cotización eliminada: ${quote.quoteNumber}. Stock restablecido: ${restoreStock}`)
  revalidatePath('/cotizaciones')
  redirect('/cotizaciones')
}

export async function addQuoteItem(formData: FormData) {
  const quoteId = formData.get('quoteId') as string
  const partIdStr = formData.get('partId') as string
  
  let partId: number;

  if (partIdStr && partIdStr.startsWith('shop_')) {
    const shopId = partIdStr.replace('shop_', '');
    
    // 1. Obtener producto de ShopProduct
    const shopProds = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM ShopProduct WHERE id = ?`,
      shopId
    );

    if (!shopProds || shopProds.length === 0) {
      throw new Error('No se encontró el producto en el catálogo de la tienda.');
    }

    const shopProd = shopProds[0];

    // 2. Verificar si ya existe un Part local con este SKU
    let existingPart = null;
    if (shopProd.sku) {
      existingPart = await db.part.findFirst({
        where: { sku: shopProd.sku }
      });
    }

    if (existingPart) {
      partId = existingPart.id;
    } else {
      // 3. Obtener o crear Ubicación "Proveedor (Catálogo)"
      let loc = await db.location.findFirst({
        where: { name: 'Proveedor (Catálogo)' }
      });
      if (!loc) {
        loc = await db.location.create({
          data: {
            name: 'Proveedor (Catálogo)',
            type: 'SUPPLIER',
            description: 'Ubicación para artículos bajo pedido del catálogo de la tienda'
          }
        });
      }
      const defaultLocationId = loc.id;

      // 4. Obtener o crear Categoría
      let cat = null;
      if (shopProd.category) {
        cat = await db.category.findFirst({
          where: { name: { equals: shopProd.category } }
        });
        if (!cat) {
          try {
            cat = await db.category.create({
              data: {
                name: shopProd.category,
                description: 'Categoría importada de la tienda'
              }
            });
          } catch (e) {
            cat = await db.category.findFirst();
          }
        }
      }
      if (!cat) {
        cat = await db.category.findFirst({
          where: { name: 'Enfriamiento' }
        }) || await db.category.findFirst();
      }
      const defaultCategoryId = cat?.id || 1;

      // 5. Crear la parte localmente con cantidad = 1
      const newPart = await db.part.create({
        data: {
          name: shopProd.name,
          sku: shopProd.sku || null,
          oemNumber: shopProd.oemNumber || null,
          brand: shopProd.brand || null,
          price: shopProd.price || 0,
          quantity: 1, // Se inicializa en 1 por requerimiento del usuario
          minStock: 0,
          categoryId: defaultCategoryId,
          locationId: defaultLocationId,
          description: shopProd.description || 'Producto importado de catálogo de tienda',
        }
      });

      partId = newPart.id;
      await logAudit('PART_CREATED_FROM_SHOP', 'PART', String(partId), `Parte autocreada desde tienda: ${newPart.name}`);
    }
  } else {
    partId = parseInt(partIdStr);
  }

  if (isNaN(partId)) {
    throw new Error('Debe seleccionar una parte del catálogo válida.')
  }
  const quantity = parseInt(formData.get('quantity') as string || '1')
  const unitPrice = parseFloat(formData.get('unitPrice') as string || '0')
  const amount = quantity * unitPrice

  await db.quoteItem.create({
    data: {
      quoteId,
      partId,
      description: formData.get('description') as string,
      quantity,
      unitPrice,
      amount,
    },
  })

  await logAudit('QUOTE_ITEM_ADDED', 'QUOTE', quoteId, `Parte añadida: ${formData.get('description')} x${quantity}`)
  await recalcQuote(quoteId)
  revalidatePath(`/cotizaciones/${quoteId}`)
}


export async function removeQuoteItem(formData: FormData) {
  const id = formData.get('id') as string
  const item = await db.quoteItem.findUnique({ where: { id } })
  if (!item) return
  await db.quoteItem.delete({ where: { id } })
  await logAudit('QUOTE_ITEM_REMOVED', 'QUOTE', item.quoteId, `Parte removida: ${item.description}`)
  await recalcQuote(item.quoteId)
  revalidatePath(`/cotizaciones/${item.quoteId}`)
}

export async function updateQuoteItem(formData: FormData) {
  const id = formData.get('id') as string
  const quantity = parseInt(formData.get('quantity') as string)
  const unitPrice = parseFloat(formData.get('unitPrice') as string)
  const amount = quantity * unitPrice

  const item = await db.quoteItem.update({
    where: { id },
    data: { quantity, unitPrice, amount },
    select: { quoteId: true, description: true }
  })

  await logAudit('QUOTE_ITEM_UPDATED', 'QUOTE', item.quoteId, `Item actualizado: ${item.description} (x${quantity})`)
  await recalcQuote(item.quoteId)
  revalidatePath(`/cotizaciones/${item.quoteId}`)
}

async function recalcQuote(quoteId: string) {
  const items = await db.quoteItem.findMany({ where: { quoteId } })
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const tax = Math.round(subtotal * 0.16 * 100) / 100
  const total = subtotal + tax
  await db.quote.update({ where: { id: quoteId }, data: { subtotal, tax, total } })
}

// ─── VEHICLE MODELS (fitment catalog) ─────────────────────
export async function getVehicleModels(query?: string) {
  return db.vehicleModel.findMany({
    where: query
      ? {
          OR: [
            { make: { contains: query } },
            { model: { contains: query } },
          ],
        }
      : undefined,
    orderBy: [{ make: 'asc' }, { model: 'asc' }, { yearStart: 'asc' }],
    include: { _count: { select: { fitment: true } } },
  })
}

export async function createVehicleModel(formData: FormData) {
  await db.vehicleModel.create({
    data: {
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      yearStart: parseInt(formData.get('yearStart') as string),
      yearEnd: formData.get('yearEnd') ? parseInt(formData.get('yearEnd') as string) : null,
      engine: (formData.get('engine') as string) || null,
      trim: (formData.get('trim') as string) || null,
    },
  })
  revalidatePath('/vehiculos')
}

export async function deleteVehicleModel(formData: FormData) {
  const id = formData.get('id') as string
  await db.vehicleModel.delete({ where: { id } })
  revalidatePath('/vehiculos')
}

// ─── SUPPLIERS ────────────────────────────────────────────
export async function getSuppliers() {
  return db.supplier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { parts: true } } },
  })
}

export async function createSupplier(formData: FormData) {
  await db.supplier.create({
    data: {
      name: formData.get('name') as string,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      contact: (formData.get('contact') as string) || null,
      address: (formData.get('address') as string) || null,
    },
  })
  revalidatePath('/proveedores')
}

export async function deleteSupplier(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  await db.supplier.delete({ where: { id } })
  revalidatePath('/proveedores')
}

// ─── USER MANAGEMENT (SUPER ADMIN) ───────────────────────
export async function getUsers() {
  await requireAdminUser()

  try {
    return await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
  } catch {
    const rows = (await db.$queryRaw`
      SELECT * FROM users
      ORDER BY createdAt DESC
    `) as any[]

    return rows.map((row) => ({
      id: row.id,
      username: row.username ?? null,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: Boolean(row.isActive),
      createdAt: new Date(row.createdAt),
    }))
  }
}

export async function createUserAccount(formData: FormData) {
  await requireAdminUser()

  const username = (formData.get('username') as string | null)?.trim()
  const name = (formData.get('name') as string | null)?.trim()
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const role = normalizeRole(formData.get('role') as string)

  if (!username || !name || !email || !password) {
    throw new Error('Todos los campos son obligatorios')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  let created: { id: string; username: string | null; email: string }

  try {
    created = await db.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
      },
      select: { id: true, username: true, email: true },
    })
  } catch (error) {
    console.error('Prisma user creation failed, falling back to raw SQL:', error)
    const newId = crypto.randomUUID()
    try {
      await db.$executeRaw`
        INSERT INTO users (id, username, email, password, name, role, isActive, createdAt, updatedAt)
        VALUES (${newId}, ${username}, ${email}, ${hashedPassword}, ${name}, ${role}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    } catch (sqlError) {
      console.error('Raw SQL insert with username failed, trying without:', sqlError)
      await db.$executeRaw`
        INSERT INTO users (id, email, password, name, role, isActive, createdAt, updatedAt)
        VALUES (${newId}, ${email}, ${hashedPassword}, ${name}, ${role}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    }
    created = { id: newId, username, email }
  }

  await logAudit('USER_CREATED', 'USER', created.id, `Usuario ${created.username ?? created.email} (${role})`)
  revalidatePath('/usuarios')
}

export async function updateUserRole(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const role = normalizeRole(formData.get('role') as string)

  try {
    await db.user.update({
      where: { id },
      data: { role },
    })
  } catch {
    await db.$executeRaw`
      UPDATE users
      SET role = ${role}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  }

  await logAudit('USER_ROLE_UPDATED', 'USER', id, `Rol cambiado a ${role}`)
  revalidatePath('/usuarios')
}

export async function updateUserStatus(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'

  try {
    await db.user.update({
      where: { id },
      data: { isActive },
    })
  } catch {
    await db.$executeRaw`
      UPDATE users
      SET isActive = ${isActive ? 1 : 0}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  }

  await logAudit('USER_STATUS_UPDATED', 'USER', id, isActive ? 'Usuario activado' : 'Usuario desactivado')
  revalidatePath('/usuarios')
}

export async function resetUserPassword(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const password = formData.get('password') as string

  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  try {
    await db.user.update({ where: { id }, data: { password: hashedPassword } })
  } catch {
    await db.$executeRaw`
      UPDATE users
      SET password = ${hashedPassword}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  }

  await logAudit('USER_PASSWORD_RESET', 'USER', id, 'Contraseña restablecida por super admin')
  revalidatePath('/usuarios')
}

export async function updateUserAccount(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const username = (formData.get('username') as string | null)?.trim()
  const name = (formData.get('name') as string | null)?.trim()
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()

  if (!id || !username || !name || !email) {
    throw new Error('Todos los campos son obligatorios')
  }

  try {
    await db.user.update({
      where: { id },
      data: { username, name, email },
    })
  } catch (error) {
    console.error('Prisma user update failed, falling back to raw SQL:', error)
    try {
      // Try with username
      await db.$executeRaw`
        UPDATE users
        SET username = ${username}, name = ${name}, email = ${email}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    } catch (sqlError) {
      console.error('Raw SQL with username failed, trying without username:', sqlError)
      // Try without username (maybe column missing)
      await db.$executeRaw`
        UPDATE users
        SET name = ${name}, email = ${email}, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }
  }

  await logAudit('USER_UPDATED', 'USER', id, `Datos de usuario actualizados: ${username}`)
  revalidatePath('/usuarios')
}

export async function deleteUserAccount(formData: FormData) {
  const actor = await requireAdminUser()
  const id = formData.get('id') as string

  if (id === actor.email) {
    throw new Error('No puedes eliminar tu propia cuenta')
  }

  const user = await db.user.findUnique({ where: { id }, select: { username: true, email: true } })
  if (!user) throw new Error('Usuario no encontrado')

  try {
    await db.user.delete({ where: { id } })
  } catch (error) {
    console.error('Prisma user deletion failed, falling back to raw SQL:', error)
    await db.$executeRaw`
      DELETE FROM users WHERE id = ${id}
    `
  }

  await logAudit('USER_DELETED', 'USER', id, `Usuario eliminado: ${user.username ?? user.email}`)
  revalidatePath('/usuarios')
}

export async function ensureDefaultAdmin() {
  const adminCount = await db.user.count({ where: { role: ROLES.SUPER_ADMIN } })
  if (adminCount > 0) return

  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'radiamex2026!'
  const hashedPassword = await bcrypt.hash(bootstrapPassword, 12)
  await db.user.create({
    data: {
      username: 'admin',
      name: 'Super Admin',
      email: 'admin@radiamex.local',
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    },
  })
  revalidatePath('/usuarios')
}

// ─── GESTIÓN FINANCIERA ────────────────────────────────────
export async function getFinancialEntries() {
  const session = await getServerSession(authOptions)
  if (!canManageFinances(session?.user?.role)) {
    throw new Error('No autorizado')
  }
  return db.financialEntry.findMany({
    orderBy: { date: 'desc' },
  })
}

export async function createFinancialEntry(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!canManageFinances(session?.user?.role)) {
    throw new Error('No autorizado')
  }

  const type = formData.get('type') as string
  const category = formData.get('category') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const isPaid = formData.get('isPaid') === 'true'
  const dateStr = formData.get('date') as string
  const date = dateStr ? new Date(dateStr) : new Date()

  const entry = await db.financialEntry.create({
    data: {
      type,
      category,
      amount,
      description,
      isPaid,
      date,
    },
  })

  await logAudit('FINANCIAL_CREATED', 'FINANCIAL', entry.id, `${type}: ${description} (${amount})`)
  revalidatePath('/reportes/finanzas')
  return { success: true }
}

export async function deleteFinancialEntry(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!canManageFinances(session?.user?.role)) {
    throw new Error('No autorizado')
  }

  const id = formData.get('id') as string
  const entry = await db.financialEntry.findUnique({ where: { id } })
  
  if (entry) {
    await db.financialEntry.delete({ where: { id } })
    await logAudit('FINANCIAL_DELETED', 'FINANCIAL', id, `Eliminado: ${entry.description}`)
  }

  revalidatePath('/reportes/finanzas')
  return { success: true }
}

export async function updateFinancialEntry(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!canManageFinances(session?.user?.role)) {
    throw new Error('No autorizado')
  }

  const id = formData.get('id') as string
  const type = formData.get('type') as string
  const category = formData.get('category') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const isPaid = formData.get('isPaid') === 'true'
  const dateStr = formData.get('date') as string
  const date = dateStr ? new Date(dateStr) : new Date()

  await db.financialEntry.update({
    where: { id },
    data: {
      type,
      category,
      amount,
      description,
      isPaid,
      date,
    },
  })

  revalidatePath('/reportes/finanzas')
  return { success: true }
}

export async function toggleFinancialPaid(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!canManageFinances(session?.user?.role)) {
    throw new Error('No autorizado')
  }

  const id = formData.get('id') as string
  const isPaid = formData.get('isPaid') === 'true'

  await db.financialEntry.update({
    where: { id },
    data: { isPaid },
  })

  revalidatePath('/reportes/finanzas')
  return { success: true }
}

// ─── LOGÍSTICA, ENTREGAS Y DESPACHO ───────────────────────

export async function checkQuoteStock(quoteId: string) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { part: { include: { location: true } } } } },
  })

  if (!quote) return { success: false, error: 'Cotización no encontrada' }
  if (quote.items.length === 0) {
    return { success: false, error: 'Se necesita mínimo un producto agregado a la cotización para proceder.' }
  }

  let hasAllStock = true
  const missingItems: string[] = []

  for (const item of quote.items) {
    // Si la parte está en ubicación de catálogo/proveedor, siempre se pide al proveedor
    const isFromCatalog = item.part.location?.name === 'Proveedor (Catálogo)'
    if (isFromCatalog || item.part.quantity < item.quantity) {
      hasAllStock = false
      if (isFromCatalog) {
        missingItems.push(`${item.description} (Pedido a Proveedor - Catálogo Tienda)`)
      } else {
        missingItems.push(`${item.description} (Requerido: ${item.quantity}, Disponible: ${item.part.quantity})`)
      }
    }
  }

  return {
    success: true,
    stockStatus: hasAllStock ? 'IN_STOCK' : 'OUT_OF_STOCK',
    missingItems
  }
}

export async function confirmQuoteFulfillment(formData: FormData) {
  const quoteId = formData.get('id') as string
  const deliveryType = formData.get('deliveryType') as string // "WILL_CALL" o "DELIVERY"
  const deliveryAddress = formData.get('deliveryAddress') as string || null

  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { part: { include: { location: true } } } } },
  })

  if (!quote) return { success: false, error: 'Cotización no encontrada' }
  if (quote.items.length === 0) {
    return { success: false, error: 'Se necesita mínimo un producto agregado a la cotización para proceder.' }
  }

  // Verificar existencias locales
  let hasAllStock = true
  const missingItems: string[] = []

  for (const item of quote.items) {
    const isFromCatalog = item.part.location?.name === 'Proveedor (Catálogo)'
    if (isFromCatalog || item.part.quantity < item.quantity) {
      hasAllStock = false
      if (isFromCatalog) {
        missingItems.push(`${item.description} (Pedido a Proveedor - Catálogo Tienda)`)
      } else {
        missingItems.push(`${item.description} (Requerido: ${item.quantity}, Disponible: ${item.part.quantity})`)
      }
    }
  }

  if (hasAllStock) {
    // Si hay stock, se descuenta de inventario y se pone como listo para entregar/recoger
    const targetFulfillmentStatus = deliveryType === 'WILL_CALL' ? 'PENDING_PICKUP' : 'PENDING_DELIVERY'
    
    await db.$transaction(async (tx) => {
      // Descontar inventario
      for (const item of quote.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
      
      // Actualizar cotización
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: 'SOLD',
          deliveryType,
          deliveryAddress,
          fulfillmentStatus: targetFulfillmentStatus,
          supplierStatus: 'NONE',
        },
      })

      // Registrar ingreso financiero
      await tx.financialEntry.create({
        data: {
          type: 'INCOME',
          category: 'SALES',
          amount: quote.total,
          description: `Venta Cotización ${quote.quoteNumber}`,
          isPaid: true,
          date: new Date(),
        }
      })
    })

    await logAudit('QUOTE_SOLD', 'QUOTE', quoteId, `Venta cerrada: ${quote.quoteNumber}. Stock local descontado. Estado: ${targetFulfillmentStatus}`)
    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${quoteId}`)
    return { success: true, stockStatus: 'IN_STOCK', fulfillmentStatus: targetFulfillmentStatus }
  } else {
    // Si NO hay stock, se marca como vendido, pero se pone en espera de mercancía (proveedor)
    await db.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: 'SOLD',
          deliveryType,
          deliveryAddress,
          fulfillmentStatus: 'AWAITING_STOCK',
          supplierStatus: 'NONE',
        },
      })

      // Registrar ingreso financiero igualmente (la venta se concreta)
      await tx.financialEntry.create({
        data: {
          type: 'INCOME',
          category: 'SALES',
          amount: quote.total,
          description: `Venta Cotización ${quote.quoteNumber} (Espera Proveedor)`,
          isPaid: true,
          date: new Date(),
        }
      })
    })

    await logAudit('QUOTE_SOLD_AWAITING', 'QUOTE', quoteId, `Venta cerrada esperando stock: ${quote.quoteNumber}. Faltante: ${missingItems.join(', ')}`)
    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${quoteId}`)
    return { success: true, stockStatus: 'OUT_OF_STOCK', fulfillmentStatus: 'AWAITING_STOCK', missingItems }
  }
}

export async function updateQuoteSupplierStatus(formData: FormData) {
  const quoteId = formData.get('id') as string
  const supplierStatus = formData.get('supplierStatus') as string // "ORDERED" o "RECEIVED"

  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: { items: { include: { part: { include: { location: true } } } } }
  })

  if (!quote) throw new Error('Cotización no encontrada')

  if (supplierStatus === 'ORDERED') {
    await db.quote.update({
      where: { id: quoteId },
      data: { supplierStatus: 'ORDERED' }
    })
    await logAudit('QUOTE_SUPPLIER_ORDERED', 'QUOTE', quoteId, `Pedido a proveedor solicitado para cotización ${quote.quoteNumber}`)
  } else if (supplierStatus === 'RECEIVED') {
    const targetFulfillmentStatus = quote.deliveryType === 'WILL_CALL' ? 'PENDING_PICKUP' : 'PENDING_DELIVERY'
    
    await db.$transaction(async (tx) => {
      // Descontar inventario de refacciones locales (las de catálogo no descuentan stock local)
      for (const item of quote.items) {
        const isCatalog = item.part.location?.name === 'Proveedor (Catálogo)'
        if (!isCatalog) {
          await tx.part.update({
            where: { id: item.partId },
            data: { quantity: { decrement: item.quantity } }
          })
        }
      }

      await tx.quote.update({
        where: { id: quoteId },
        data: { 
          supplierStatus: 'RECEIVED',
          fulfillmentStatus: targetFulfillmentStatus
        }
      })
    })
    await logAudit('QUOTE_SUPPLIER_RECEIVED', 'QUOTE', quoteId, `Pedido de proveedor recibido. Stock local reservado. Cotización ${quote.quoteNumber} lista para ${targetFulfillmentStatus}`)
  }

  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${quoteId}`)
  return { success: true }
}

export async function completeFulfillment(quoteId: string, paymentMethod?: string) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId }
  })
  if (!quote) throw new Error('Cotización no encontrada')

  await db.quote.update({
    where: { id: quoteId },
    data: { fulfillmentStatus: 'COMPLETED' }
  })

  if (paymentMethod) {
    const entry = await db.financialEntry.findFirst({
      where: {
        description: { startsWith: `Venta Cotización ${quote.quoteNumber}` }
      }
    })
    if (entry) {
      await db.financialEntry.update({
        where: { id: entry.id },
        data: {
          description: `${entry.description} (Pago: ${paymentMethod})`
        }
      })
    }
  }

  await logAudit(
    'FULFILLMENT_COMPLETED', 
    'QUOTE', 
    quoteId, 
    `Fulfillment completado (recogido en tienda).${paymentMethod ? ` Método de pago: ${paymentMethod}.` : ''}`
  )
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${quoteId}`)
  return { success: true }
}

// Acciones para el Despachador
export async function getPendingDeliveriesAndPickups() {
  const [deliveries, supplierPickups] = await Promise.all([
    // Entregas a domicilio listas
    db.quote.findMany({
      where: {
        status: 'SOLD',
        fulfillmentStatus: 'PENDING_DELIVERY'
      },
      include: { customer: true, items: { include: { part: true } } },
      orderBy: { updatedAt: 'desc' }
    }),
    // Recolecciones en proveedor pendientes (el chofer va por ellas)
    db.quote.findMany({
      where: {
        status: 'SOLD',
        fulfillmentStatus: 'AWAITING_STOCK',
        supplierStatus: 'ORDERED'
      },
      include: { customer: true, items: { include: { part: true } } },
      orderBy: { updatedAt: 'desc' }
    })
  ])

  return { deliveries, supplierPickups }
}

export async function getActiveDrivers() {
  return db.user.findMany({
    where: {
      isActive: true,
      role: { in: ['DRIVER', 'DISPATCH', 'ADMIN', 'SUPER_ADMIN'] }
    },
    select: {
      id: true,
      name: true,
      role: true,
      latitude: true,
      longitude: true
    }
  })
}

export async function createDeliveryRoute(driverId: string, stops: any[], startAddress?: string) {
  const route = await db.deliveryRoute.create({
    data: {
      driverId,
      status: 'PENDING',
      startAddress: startAddress || "Av. Norte y Coahuila #58, Dolores Hidalgo, GTO (Nuestra Sucursal)"
    }
  })

  // Crear paradas secuenciales
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    await db.deliveryStop.create({
      data: {
        routeId: route.id,
        sequence: i + 1,
        type: stop.type, // "PICKUP_PROVIDER" o "DELIVERY_CUSTOMER"
        quoteId: stop.quoteId || null,
        address: stop.address,
        latitude: stop.latitude || null,
        longitude: stop.longitude || null,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        details: stop.details,
        paymentStatus: stop.paymentStatus, // "PAID" o "COLLECT"
        amountToCollect: stop.amountToCollect || 0,
        status: 'PENDING'
      }
    })

    // Si es una entrega al cliente, podemos pasar el estado de la cotización a "IN_PROGRESS" en ruta si se desea
  }

  revalidatePath('/despacho')
  return { success: true, routeId: route.id }
}

export async function getActiveRouteForDriver(driverId: string) {
  return db.deliveryRoute.findFirst({
    where: {
      driverId,
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    },
    include: {
      stops: {
        orderBy: { sequence: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateDriverGPS(driverId: string, latitude: number, longitude: number) {
  await db.user.update({
    where: { id: driverId },
    data: { latitude, longitude }
  })
  return { success: true }
}

export async function updateStopStatus(stopId: string, status: 'COMPLETED' | 'FAILED', failedReason?: string, paymentMethod?: string) {
  const stop = await db.deliveryStop.update({
    where: { id: stopId },
    data: {
      status,
      failedReason: failedReason || null,
      paymentMethod: paymentMethod || null,
      completedAt: new Date()
    }
  })

  // Lógica de transición de la cotización asociada
  if (stop.quoteId) {
    if (stop.type === 'PICKUP_PROVIDER' && status === 'COMPLETED') {
      // Si el chofer ya recogió del proveedor, el pedido está listo para ser entregado
      const quote = await db.quote.findUnique({ where: { id: stop.quoteId } })
      if (quote) {
        const targetFulfillmentStatus = quote.deliveryType === 'WILL_CALL' ? 'PENDING_PICKUP' : 'PENDING_DELIVERY'
        await db.quote.update({
          where: { id: stop.quoteId },
          data: {
            supplierStatus: 'RECEIVED',
            fulfillmentStatus: targetFulfillmentStatus
          }
        })
        await logAudit('QUOTE_SUPPLIER_RECEIVED', 'QUOTE', stop.quoteId, `Chofer completó la recolección del proveedor. Cotización lista para ${targetFulfillmentStatus}`)
      }
    } else if (stop.type === 'DELIVERY_CUSTOMER' && status === 'COMPLETED') {
      // Si se entregó con éxito al cliente, marcar la cotización como completada (Fulfillment complete)
      await db.quote.update({
        where: { id: stop.quoteId },
        data: { fulfillmentStatus: 'COMPLETED' }
      })
      await logAudit(
        'FULFILLMENT_COMPLETED', 
        'QUOTE', 
        stop.quoteId, 
        `Entrega completada por el chofer al cliente.${paymentMethod ? ` Método de pago: ${paymentMethod}.` : ''}`
      )
    }
  }

  // Verificar si la ruta se ha completado por completo (todas las paradas procesadas)
  const route = await db.deliveryRoute.findUnique({
    where: { id: stop.routeId },
    include: { stops: true }
  })

  if (route) {
    // Si la ruta estaba PENDING y se procesa la primera parada, pasar a IN_PROGRESS
    if (route.status === 'PENDING') {
      await db.deliveryRoute.update({
        where: { id: route.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    const allProcessed = route.stops.every(s => s.status === 'COMPLETED' || s.status === 'FAILED')
    if (allProcessed) {
      await db.deliveryRoute.update({
        where: { id: route.id },
        data: { status: 'COMPLETED' }
      })
    }
  }

  revalidatePath('/despacho')
  revalidatePath('/chofer')
  return { success: true }
}

export async function updateStopETA(stopId: string, etaMinutes: number) {
  const etaTime = new Date(Date.now() + etaMinutes * 60 * 1000)
  await db.deliveryStop.update({
    where: { id: stopId },
    data: { eta: etaTime }
  })
  revalidatePath('/despacho')
  revalidatePath('/chofer')
  return { success: true }
}

export async function cancelDeliveryStop(stopId: string) {
  try {
    const stop = await db.deliveryStop.findUnique({
      where: { id: stopId },
      include: { 
        quote: { 
          include: { 
            items: true 
          } 
        } 
      }
    })

    if (!stop) return { success: false, error: 'Parada no encontrada' }

    await db.$transaction(async (tx) => {
      // 1. Si hay cotización asociada y estaba confirmada (restando stock)
      if (stop.quoteId && stop.quote) {
        const q = stop.quote
        const stockWasDecremented = 
          q.fulfillmentStatus === 'PENDING_DELIVERY' || 
          q.fulfillmentStatus === 'PENDING_PICKUP' || 
          q.fulfillmentStatus === 'COMPLETED' || 
          (q.fulfillmentStatus === 'AWAITING_STOCK' && q.supplierStatus === 'RECEIVED')

        if (stockWasDecremented) {
          // Devolver stock a inventario
          for (const item of q.items) {
            await tx.part.update({
              where: { id: item.partId },
              data: { quantity: { increment: item.quantity } }
            })
          }
        }

        // Revertir cotización a PENDING y resetear estados de logística
        await tx.quote.update({
          where: { id: stop.quoteId },
          data: {
            status: 'PENDING',
            fulfillmentStatus: 'PENDING_STOCK_CHECK',
            supplierStatus: 'NONE'
          }
        })

        // Borrar el registro financiero de la venta si existe
        await tx.financialEntry.deleteMany({
          where: { description: { contains: `Cotización ${q.quoteNumber}` } }
        })

        await logAudit(
          'QUOTE_DELIVERY_CANCELLED', 
          'QUOTE', 
          stop.quoteId, 
          `Entrega cancelada por despacho. Cotización revertida a PENDING y stock devuelto al inventario.`
        )
      }

      // 2. Eliminar la parada
      await tx.deliveryStop.delete({
        where: { id: stopId }
      })
    })

    revalidatePath('/despacho')
    revalidatePath('/chofer')
    revalidatePath('/cotizaciones')
    return { success: true }
  } catch (err: any) {
    console.error('Error al deshacer despacho:', err)
    return { success: false, error: err.message || 'Error al procesar' }
  }
}

export async function getActiveRoutesWithStops() {
  return db.deliveryRoute.findMany({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          role: true,
          latitude: true,
          longitude: true
        }
      },
      stops: {
        orderBy: { sequence: 'asc' },
        include: {
          quote: {
            include: {
              customer: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateActiveRouteStops(routeId: string, stops: any[]) {
  await db.$transaction(async (tx) => {
    // 1. Eliminar paradas existentes de la ruta
    await tx.deliveryStop.deleteMany({
      where: { routeId }
    })

    // 2. Insertar paradas actualizadas con el nuevo orden o datos
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]
      await tx.deliveryStop.create({
        data: {
          routeId,
          sequence: i + 1,
          type: stop.type,
          quoteId: stop.quoteId || null,
          address: stop.address,
          latitude: stop.latitude || null,
          longitude: stop.longitude || null,
          contactName: stop.contactName,
          contactPhone: stop.contactPhone,
          details: stop.details,
          paymentStatus: stop.paymentStatus,
          amountToCollect: stop.amountToCollect || 0,
          status: stop.status || 'PENDING',
          failedReason: stop.failedReason || null,
          eta: stop.eta ? new Date(stop.eta) : null,
          completedAt: stop.completedAt ? new Date(stop.completedAt) : null,
        }
      })
    }
  })

  revalidatePath('/despacho')
  revalidatePath('/chofer')
  return { success: true }
}

export async function deleteDeliveryRoute(routeId: string) {
  await db.deliveryRoute.delete({
    where: { id: routeId }
  })
  revalidatePath('/despacho')
  revalidatePath('/chofer')
  return { success: true }
}

export async function generateUniqueBarcode() {
  let unique = false
  let code = ''
  while (!unique) {
    code = Math.floor(100000000000 + Math.random() * 900000000000).toString()
    const existing = await db.part.findUnique({ where: { barcode: code } })
    if (!existing) unique = true
  }
  return code
}

export async function getItems() {
  const parts = await db.part.findMany({
    include: { category: true, location: true }
  })
  return parts.map(p => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    quantity: p.quantity,
    status: p.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
    category: { name: p.category.name },
    location: { name: p.location.name }
  }))
}

export async function updateItemBarcode(itemId: number, barcode: string) {
  await db.part.update({
    where: { id: itemId },
    data: { barcode }
  })
  revalidatePath('/partes')
}

export async function findItemByBarcode(barcode: string) {
  const p = await db.part.findUnique({
    where: { barcode },
    include: { category: true, location: true }
  })
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    quantity: p.quantity,
    status: p.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
    category: { name: p.category.name },
    location: { name: p.location.name }
  }
}


