import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Comenzando seed de datos...')

    // Categorías
    const catCount = await prisma.category.count()
    if (catCount === 0) {
        console.log('   -> Insertando Categorías...')
        await prisma.category.createMany({
            data: [
                { name: 'Herramientas Eléctricas', description: 'Taladros, sierras, etc.' },
                { name: 'Herramientas Manuales', description: 'Martillos, destornilladores' },
                { name: 'Conectividad', description: 'Cables, conectores coax, fibra' },
                { name: 'Consumibles', description: 'Tornillos, cintas, pegamentos' }
            ]
        })
    } else {
        console.log('   -> Categorías ya existen. Saltando.')
    }

    // Ubicaciones
    const locCount = await prisma.location.count()
    if (locCount === 0) {
        console.log('   -> Insertando Ubicaciones...')
        await prisma.location.createMany({
            data: [
                { name: 'Bodega Central', type: 'WAREHOUSE' },
                { name: 'Camioneta #1', type: 'VEHICLE' },
                { name: 'Camioneta #2', type: 'VEHICLE' },
                { name: 'Sitio Alpha', type: 'SITE' }
            ]
        })
    } else {
        console.log('   -> Ubicaciones ya existen. Saltando.')
    }

    console.log('✅ Seed completado con éxito.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
