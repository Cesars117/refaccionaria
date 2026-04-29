'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { canManageUsers, normalizeRole, ROLES } from '@/lib/rbac'

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
  return user
}

async function logAudit(action: string, entityType: string, entityId: string, details?: string) {
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
      ...(query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { oemNumber: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    include: { category: true, location: true },
    orderBy: { name: 'asc' },
  })
}

export async function getPartById(id: number) {
  return db.part.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      fitment: { include: { vehicleModel: true } },
      supplierParts: { include: { supplier: true } },
    },
  })
}

export async function createPart(formData: FormData) {
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
  const id = parseInt(formData.get('id') as string)
  const previous = await db.part.findUnique({ where: { id }, select: { quantity: true, name: true } })
  const quantity = parseInt(formData.get('quantity') as string || '0')
  const minStock = parseInt(formData.get('minStock') as string || '0')
  const price = parseFloat(formData.get('price') as string || '0')
  const priceFleet = formData.get('priceFleet') ? parseFloat(formData.get('priceFleet') as string) : null
  const cost = parseFloat(formData.get('cost') as string || '0')

  const updated = await db.part.update({
    where: { id },
    data: {
      name: formData.get('name') as string,
      categoryId: parseInt(formData.get('categoryId') as string),
      locationId: parseInt(formData.get('locationId') as string),
      quantity, minStock, price, priceFleet, cost,
      brand: (formData.get('brand') as string) || null,
      sku: (formData.get('sku') as string) || null,
      barcode: (formData.get('barcode') as string) || null,
      oemNumber: (formData.get('oemNumber') as string) || null,
      description: (formData.get('description') as string) || null,
    },
  })
  if (previous && previous.quantity !== quantity) {
    await logAudit('PART_QTY_CHANGED', 'PART', String(updated.id), `Parte ${updated.name}: ${previous.quantity} -> ${quantity}`)
  } else {
    await logAudit('PART_UPDATED', 'PART', String(updated.id), `Parte actualizada: ${updated.name}`)
  }
  revalidatePath('/partes')
  revalidatePath(`/partes/${id}`)
  redirect('/partes')
}

export async function deletePart(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const existing = await db.part.findUnique({ where: { id }, select: { name: true } })
  await db.part.delete({ where: { id } })
  await logAudit('PART_DELETED', 'PART', String(id), `Parte eliminada: ${existing?.name ?? id}`)
  revalidatePath('/partes')
  redirect('/partes')
}

// ─── CATEGORIES ────────────────────────────────────────────
export async function getCategories() {
  return db.category.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(formData: FormData) {
  await db.category.create({
    data: {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
    },
  })
  revalidatePath('/categorias')
}

export async function updateCategory(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  await db.category.update({
    where: { id },
    data: {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
    },
  })
  revalidatePath('/categorias')
}

export async function deleteCategory(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const cat = await db.category.findUnique({ where: { id }, include: { _count: { select: { parts: true } } } })
  if (cat?._count?.parts && cat._count.parts > 0) {
    throw new Error('No se puede eliminar: la categoria tiene partes asignadas.')
  }
  await db.category.delete({ where: { id } })
  revalidatePath('/categorias')
}

// ─── LOCATIONS ────────────────────────────────────────────
export async function getLocations() {
  return db.location.findMany({ orderBy: { name: 'asc' } })
}

export async function createLocation(formData: FormData) {
  await db.location.create({ data: { name: formData.get('name') as string } })
  revalidatePath('/ubicaciones')
}

export async function updateLocation(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  await db.location.update({ where: { id }, data: { name: formData.get('name') as string } })
  revalidatePath('/ubicaciones')
}

export async function deleteLocation(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const loc = await db.location.findUnique({ where: { id }, include: { _count: { select: { parts: true } } } })
  if (loc?._count?.parts && loc._count.parts > 0) {
    throw new Error('No se puede eliminar: la ubicacion tiene partes asignadas.')
  }
  await db.location.delete({ where: { id } })
  revalidatePath('/ubicaciones')
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
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}

export async function deleteCustomer(formData: FormData) {
  const id = formData.get('id') as string
  await db.customer.delete({ where: { id } })
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
  revalidatePath(`/clientes/${fleet?.customerId}`)
  revalidatePath('/flotas')
}

export async function deleteFleetUnit(formData: FormData) {
  const id = formData.get('id') as string
  const unit = await db.fleetUnit.findUnique({ where: { id }, include: { fleet: true } })
  await db.fleetUnit.delete({ where: { id } })
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
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
}

export async function deleteProject(formData: FormData) {
  const id = formData.get('id') as string
  await db.maintenanceProject.delete({ where: { id } })
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
  revalidatePath(`/proyectos/${projectId}`)
}

export async function removeProjectPart(formData: FormData) {
  const id = formData.get('id') as string
  const pp = await db.projectPart.findUnique({ where: { id } })
  await db.projectPart.delete({ where: { id } })
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
      items: { include: { part: { include: { category: true } } } },
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

export async function updateQuoteStatus(formData: FormData) {
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  await db.quote.update({ where: { id }, data: { status } })
  await logAudit('QUOTE_STATUS_CHANGED', 'QUOTE', id, `Estado actualizado a ${status}`)
  revalidatePath('/cotizaciones')
  revalidatePath(`/cotizaciones/${id}`)
}

export async function deleteQuote(formData: FormData) {
  const id = formData.get('id') as string
  await db.quote.delete({ where: { id } })
  revalidatePath('/cotizaciones')
  redirect('/cotizaciones')
}

export async function addQuoteItem(formData: FormData) {
  const quoteId = formData.get('quoteId') as string
  const partId = parseInt(formData.get('partId') as string)
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

  await recalcQuote(quoteId)
  revalidatePath(`/cotizaciones/${quoteId}`)
}

export async function removeQuoteItem(formData: FormData) {
  const id = formData.get('id') as string
  const item = await db.quoteItem.findUnique({ where: { id } })
  if (!item) return
  await db.quoteItem.delete({ where: { id } })
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
            { make: { contains: query, mode: 'insensitive' } },
            { model: { contains: query, mode: 'insensitive' } },
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
  return db.user.findMany({
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

  const created = await db.user.create({
    data: {
      username,
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  })

  await logAudit('USER_CREATED', 'USER', created.id, `Usuario ${created.username ?? created.email} (${role})`)
  revalidatePath('/usuarios')
}

export async function updateUserRole(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const role = normalizeRole(formData.get('role') as string)

  await db.user.update({
    where: { id },
    data: { role },
  })

  await logAudit('USER_ROLE_UPDATED', 'USER', id, `Rol cambiado a ${role}`)
  revalidatePath('/usuarios')
}

export async function updateUserStatus(formData: FormData) {
  await requireAdminUser()

  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'

  await db.user.update({
    where: { id },
    data: { isActive },
  })

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
  await db.user.update({ where: { id }, data: { password: hashedPassword } })

  await logAudit('USER_PASSWORD_RESET', 'USER', id, 'Contraseña restablecida por super admin')
  revalidatePath('/usuarios')
}

export async function ensureDefaultAdmin() {
  const adminCount = await db.user.count({
    where: {
      role: {
        in: [ROLES.SUPER_ADMIN, 'ADMIN'],
      },
    },
  })
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
