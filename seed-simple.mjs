import db from './lib/db.js';

async function seed() {
    console.log('🌱 Comenzando seed de datos...');

    try {
        // Categorías
        const catCount = await db.category.count();
        if (catCount === 0) {
            console.log('   -> Insertando Categorías...');
            await db.category.createMany({
                data: [
                    { name: 'Electric-Tool', description: 'Herramientas eléctricas y equipos con motor' },
                    { name: 'Manual-Tool', description: 'Herramientas manuales y de mano' },
                    { name: 'Material', description: 'Materiales de construcción y consumibles' }
                ]
            });
        } else {
            console.log('   -> Categorías ya existen. Saltando.');
        }

        // Ubicaciones
        const locCount = await db.location.count();
        if (locCount === 0) {
            console.log('   -> Insertando Ubicaciones...');
            await db.location.createMany({
                data: [
                    { name: '8 Floor NRG', type: 'WAREHOUSE', description: 'Piso 8 del edificio NRG' },
                    { name: 'Astrodome', type: 'SITE', description: 'Sitio Astrodome' },
                    { name: 'Memorial', type: 'SITE', description: 'Sitio Memorial' },
                    { name: 'Center NRG', type: 'WAREHOUSE', description: 'Centro del complejo NRG' }
                ]
            });
        } else {
            console.log('   -> Ubicaciones ya existen. Saltando.');
        }

        console.log('✅ Seed completado con éxito.');
    } catch (error) {
        console.error('❌ Error en seed:', error);
        throw error;
    } finally {
        await db.$disconnect();
    }
}

seed().catch(console.error);