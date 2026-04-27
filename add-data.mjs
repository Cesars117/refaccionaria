import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function addData() {
  try {
    console.log('🔄 Agregando categorías...');
    await db.category.createMany({
      data: [
        { name: 'Electric-Tool', description: 'Herramientas eléctricas y equipos con motor' },
        { name: 'Manual-Tool', description: 'Herramientas manuales y de mano' },
        { name: 'Material', description: 'Materiales de construcción y consumibles' }
      ],
      skipDuplicates: true
    });

    console.log('🔄 Agregando ubicaciones...');
    await db.location.createMany({
      data: [
        { name: '8 Floor NRG', type: 'WAREHOUSE', description: 'Piso 8 del edificio NRG' },
        { name: '8 Floor NRG - Box 1', type: 'WAREHOUSE', description: 'Caja 1 en piso 8', subcategory: 'Box 1' },
        { name: '8 Floor NRG - Box 2', type: 'WAREHOUSE', description: 'Caja 2 en piso 8', subcategory: 'Box 2' },
        { name: '8 Floor NRG - Personal Milwaukee Box', type: 'WAREHOUSE', description: 'Caja personal Milwaukee', subcategory: 'Personal Milwaukee Box' },
        { name: '8 Floor NRG - Mesa Principal', type: 'WAREHOUSE', description: 'Mesa principal del piso 8', subcategory: 'Mesa Principal' },
        { name: '8 Floor NRG - Area General', type: 'WAREHOUSE', description: 'Área general del piso 8', subcategory: 'Area General' },
        { name: 'Astrodome', type: 'SITE', description: 'Sitio Astrodome' },
        { name: 'Memorial', type: 'SITE', description: 'Sitio Memorial' },
        { name: 'Center NRG', type: 'WAREHOUSE', description: 'Centro del complejo NRG' }
      ],
      skipDuplicates: true
    });

    console.log('✅ Datos agregados exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

addData();