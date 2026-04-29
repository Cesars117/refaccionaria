const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const db = new PrismaClient()

  const migratedAdmin = await db.user.updateMany({
    where: { role: 'ADMIN' },
    data: { role: 'SUPER_ADMIN' },
  })

  const migratedSupervisor = await db.user.updateMany({
    where: { role: 'SUPERVISOR' },
    data: { role: 'ADMIN' },
  })

  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'radiamex2026!'
  const hashedPassword = await bcrypt.hash(bootstrapPassword, 12)

  const existing = await db.user.findFirst({
    where: {
      OR: [{ username: 'admin' }, { email: 'admin@radiamex.local' }],
    },
  })

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        username: existing.username || 'admin',
        email: existing.email || 'admin@radiamex.local',
        name: existing.name || 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        password: hashedPassword,
      },
    })
  } else {
    await db.user.create({
      data: {
        username: 'admin',
        email: 'admin@radiamex.local',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        password: hashedPassword,
      },
    })
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log('Migrated ADMIN->SUPER_ADMIN:', migratedAdmin.count)
  console.log('Migrated SUPERVISOR->ADMIN:', migratedSupervisor.count)
  console.log('Users:', users)

  await db.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
