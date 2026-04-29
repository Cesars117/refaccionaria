const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function main() {
  const db = new PrismaClient()

  const user = await db.user.findFirst({
    where: { username: 'admin' },
    select: {
      username: true,
      email: true,
      role: true,
      isActive: true,
      password: true,
    },
  })

  if (!user) {
    console.log('NO_ADMIN_USER')
    await db.$disconnect()
    return
  }

  const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'radiamex2026!'
  const passwordMatchesBootstrap = await bcrypt.compare(bootstrapPassword, user.password)

  console.log({
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    passwordMatchesBootstrap,
  })

  await db.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
