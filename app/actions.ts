'use server'

import db from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// --- Dashboard Stats ---
export async function getDashboardStats() {
    const [itemCount, clientCount, projectCount, items, totalRevenue, totalExpenses] = await Promise.all([
        db.item.count(),
        db.client.count(),
        db.project.count({ where: { status: 'ACTIVE' } }),
        db.item.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { category: true, location: true }
        }),
        db.invoice.aggregate({
            _sum: { total: true },
            where: { status: 'PAID' }
        }),
        db.expense.aggregate({
            _sum: { amount: true }
        })
    ])

    const revenue = totalRevenue._sum.total || 0
    const costs = totalExpenses._sum.amount || 0
    const profit = revenue - costs

    return {
        itemCount,
        clientCount,
        projectCount,
        totalValue: profit,
        revenue,
        costs,
        recentItems: items
    }
}

// --- Items ---
export async function getItems(query?: string) {
    return db.item.findMany({
        where: {
            OR: query ? [
                { name: { contains: query } },
                { description: { contains: query } },
                { sku: { contains: query } },
                { barcode: { contains: query } },
                { category: { name: { contains: query } } },
                { location: { name: { contains: query } } }
            ] : undefined
        },
        include: { category: true, location: true, serialNumbers: true },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createItem(formData: FormData) {
    const name = formData.get('name') as string
    const categoryId = parseInt(formData.get('categoryId') as string)
    const locationId = parseInt(formData.get('locationId') as string)
    const quantity = parseInt(formData.get('quantity') as string)
    const status = formData.get('status') as string
    const costPrice = parseFloat(formData.get('costPrice') as string || '0')
    const salePrice = parseFloat(formData.get('salePrice') as string || '0')
    let barcode = formData.get('barcode') as string | null
    
    if (barcode) {
        const existing = await db.item.findUnique({ where: { barcode } })
        if (existing) throw new Error(`Barcode "${barcode}" already exists.`)
    }

    const item = await db.item.create({
        data: {
            name,
            categoryId,
            locationId,
            quantity,
            status,
            costPrice,
            salePrice,
            barcode: barcode || null
        }
    })

    const session = await getServerSession(authOptions)
    await createAuditLog(db, session, {
        action: 'CREATED',
        entityType: 'ITEM',
        entityId: item.id,
        entityLabel: name,
    })

    revalidatePath('/')
}

export async function updateItem(formData: FormData) {
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const categoryId = parseInt(formData.get('categoryId') as string)
    const locationId = parseInt(formData.get('locationId') as string)
    const quantity = parseInt(formData.get('quantity') as string)
    const status = formData.get('status') as string
    const costPrice = parseFloat(formData.get('costPrice') as string || '0')
    const salePrice = parseFloat(formData.get('salePrice') as string || '0')

    await db.item.update({
        where: { id },
        data: { name, categoryId, locationId, quantity, status, costPrice, salePrice }
    })

    revalidatePath('/')
    revalidatePath(`/items/${id}`)
    redirect('/')
}

export async function deleteItem(formData: FormData) {
    const id = parseInt(formData.get('id') as string)
    await db.item.delete({ where: { id } })
    revalidatePath('/')
}

// --- Clients ---
export async function getClients() {
    return db.client.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { vehicles: true, projects: true } } }
    })
}

export async function createClient(formData: FormData) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const address = formData.get('address') as string | null

    await db.client.create({
        data: { name, phone, email, address }
    })
    revalidatePath('/clients')
}

export async function getClientById(id: number) {
    return db.client.findUnique({
        where: { id },
        include: { vehicles: true, projects: true }
    })
}

export async function updateClient(formData: FormData) {
    const id = parseInt(formData.get('id') as string)
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const address = formData.get('address') as string | null

    await db.client.update({
        where: { id },
        data: { name, phone, email, address }
    })
    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
}

export async function createVehicle(formData: FormData) {
    const clientId = parseInt(formData.get('clientId') as string)
    const model = formData.get('model') as string
    const plate = formData.get('plate') as string | null

    await db.vehicle.create({
        data: { model, plate, clientId }
    })
    revalidatePath(`/clients/${clientId}`)
}

// --- Projects ---
export async function getProjects() {
    return db.project.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { 
            client: true, 
            vehicle: true,
            _count: { select: { serviceOrders: true } }
        }
    })
}

export async function createProject(formData: FormData) {
    const name = formData.get('name') as string
    const clientId = parseInt(formData.get('clientId') as string)
    const vehicleId = formData.get('vehicleId') ? parseInt(formData.get('vehicleId') as string) : null
    const status = formData.get('status') as string || 'ACTIVE'

    await db.project.create({
        data: { name, clientId, vehicleId, status }
    })
    revalidatePath('/projects')
    redirect('/projects')
}

export async function deleteProject(formData: FormData) {
    const id = parseInt(formData.get('id') as string)
    await db.project.delete({ where: { id } })
    revalidatePath('/projects')
}

export async function getProjectById(id: number) {
    return db.project.findUnique({
        where: { id },
        include: {
            client: true,
            vehicle: true,
            serviceOrders: {
                include: {
                    itemsUsed: {
                        include: { item: true }
                    }
                }
            }
        }
    })
}



// --- Categories & Locations ---
export async function getCategories() {
    return db.category.findMany({ orderBy: { name: 'asc' } })
}

export async function getLocations() {
    return db.location.findMany({ orderBy: { name: 'asc' } })
}

export async function createCategory(formData: FormData) {
    const name = formData.get('name') as string
    await db.category.create({ data: { name } })
    revalidatePath('/categories')
}

export async function createLocation(formData: FormData) {
    const name = formData.get('name') as string
    await db.location.create({ data: { name } })
    revalidatePath('/locations')
}

// --- Finance ---
export async function getInvoices() {
    return db.invoice.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: { client: true, project: true } 
    })
}

export async function createServiceOrder(formData: FormData) {
    const projectId = parseInt(formData.get('projectId') as string)
    const type = formData.get('type') as string || 'GENERAL'
    const laborCost = parseFloat(formData.get('laborCost') as string || '0')
    const itemsJson = formData.get('itemsUsed') as string // JSON string of [{itemId, quantity}]
    
    const project = await db.project.findUnique({
        where: { id: projectId },
        include: { client: true, vehicle: true }
    })
    if (!project) throw new Error('Project not found')

    const itemsUsed: { itemId: number; quantity: number }[] = JSON.parse(itemsJson)
    const orderNumber = `SO-${Date.now()}`

    return await db.$transaction(async (tx) => {
        let totalAmount = laborCost

        // 1. Create Service Order
        const serviceOrder = await tx.serviceOrder.create({
            data: {
                orderNumber,
                type,
                clientId: project.clientId,
                vehicleId: project.vehicleId,
                projectId: project.id,
                laborCost,
                status: 'COMPLETED'
            }
        })

        // 2. Process Items
        for (const itemUsage of itemsUsed) {
            const item = await tx.item.findUnique({ where: { id: itemUsage.itemId } })
            if (!item || item.quantity < itemUsage.quantity) {
                throw new Error(`Insufficient stock for item: ${item?.name || itemUsage.itemId}`)
            }

            const lineTotal = item.salePrice * itemUsage.quantity
            totalAmount += lineTotal

            // Create Order Item
            await tx.serviceOrderItem.create({
                data: {
                    serviceOrderId: serviceOrder.id,
                    itemId: item.id,
                    quantity: itemUsage.quantity,
                    unitPrice: item.salePrice,
                    costPrice: item.costPrice
                }
            })

            // Decrement Inventory
            await tx.item.update({
                where: { id: item.id },
                data: { quantity: { decrement: itemUsage.quantity } }
            })

            // Audit Log
            await createAuditLog(tx, null, {
                action: 'QTY_CHANGED',
                entityType: 'ITEM',
                entityId: item.id,
                entityLabel: item.name,
                fieldChanged: 'quantity',
                oldValue: String(item.quantity),
                newValue: String(item.quantity - itemUsage.quantity),
                metadata: JSON.stringify({ reason: 'Service Order', orderNumber })
            })
        }

        // 3. Update Service Order Total
        await tx.serviceOrder.update({
            where: { id: serviceOrder.id },
            data: { totalAmount }
        })

        // 4. Create Invoice automatically (Optional, but useful)
        await tx.invoice.create({
            data: {
                invoiceNumber: `INV-${orderNumber}`,
                clientId: project.clientId,
                projectId: project.id,
                total: totalAmount,
                status: 'PAID'
            }
        })

        revalidatePath(`/projects/${projectId}`)
        return serviceOrder
    })
}


export async function createExpense(formData: FormData) {
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)

    await db.expense.create({
        data: { description, amount }
    })
    revalidatePath('/finance')
}

// --- Suppliers ---

export async function getSuppliers() {
    return db.supplier.findMany({ orderBy: { name: 'asc' } })
}

export async function createSupplier(formData: FormData) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null

    await db.supplier.create({
        data: { name, phone, email }
    })
    revalidatePath('/suppliers')
}

// --- Purchases ---
export async function getPurchaseOrders() {
    return db.purchaseOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, _count: { select: { itemsBought: true } } }
    })
}

export async function createPurchaseOrder(formData: FormData) {
    const supplierId = parseInt(formData.get('supplierId') as string)
    const itemsJson = formData.get('itemsBought') as string // [{itemId, quantity, costPrice}]
    const orderNumber = `PUR-${Date.now()}`
    
    const itemsBought: { itemId: number; quantity: number; costPrice: number }[] = JSON.parse(itemsJson)

    return await db.$transaction(async (tx) => {
        let totalAmount = 0

        const purchaseOrder = await tx.purchaseOrder.create({
            data: {
                orderNumber,
                supplierId,
                status: 'RECEIVED'
            }
        })

        for (const itemBuy of itemsBought) {
            const lineTotal = itemBuy.costPrice * itemBuy.quantity
            totalAmount += lineTotal

            // Create Purchase Item
            await tx.purchaseOrderItem.create({
                data: {
                    purchaseOrderId: purchaseOrder.id,
                    itemId: itemBuy.itemId,
                    quantity: itemBuy.quantity,
                    costPrice: itemBuy.costPrice
                }
            })

            // Increment Inventory & Update Cost Price
            const item = await tx.item.findUnique({ where: { id: itemBuy.itemId } })
            if (!item) throw new Error('Item not found')

            await tx.item.update({
                where: { id: itemBuy.itemId },
                data: { 
                    quantity: { increment: itemBuy.quantity },
                    costPrice: itemBuy.costPrice // Update latest cost price
                }
            })

            // Audit Log
            await createAuditLog(tx, null, {
                action: 'QTY_CHANGED',
                entityType: 'ITEM',
                entityId: itemBuy.itemId,
                entityLabel: item.name,
                fieldChanged: 'quantity',
                oldValue: String(item.quantity),
                newValue: String(item.quantity + itemBuy.quantity),
                metadata: JSON.stringify({ reason: 'Purchase Order', orderNumber })
            })
        }

        await tx.purchaseOrder.update({
            where: { id: purchaseOrder.id },
            data: { totalAmount }
        })

        revalidatePath('/')
        revalidatePath('/purchases')
        return purchaseOrder
    })
}

// --- Seeding ---
export async function seedInitialData() {
    const catCount = await db.category.count()
    if (catCount === 0) {
        await db.category.createMany({
            data: [
                { name: 'Frenos', description: 'Pastillas, zapatas, bombas' },
                { name: 'Discos', description: 'Discos de freno y tambores' },
                { name: 'Radiadores', description: 'Radiadores, anticongelante, mangueras' },
                { name: 'General', description: 'Otras refacciones' }
            ]
        })
    }

    const locCount = await db.location.count()
    if (locCount === 0) {
        await db.location.createMany({
            data: [
                { name: 'Mostrador Principal', type: 'SHELF' },
                { name: 'Bodega A', type: 'WAREHOUSE' },
                { name: 'Bodega B', type: 'WAREHOUSE' }
            ]
        })
    }
}
