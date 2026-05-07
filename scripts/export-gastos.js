import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportGastos() {
  try {
    const expenses = await prisma.financialEntry.findMany({
      orderBy: { date: 'desc' }
    });

    if (expenses.length === 0) {
      console.log('ℹ️ No hay gastos para exportar.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = 'backups';
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    // JSON
    const jsonPath = path.join(backupDir, `gastos_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(expenses, null, 2));

    // CSV
    const csvHeader = 'id,tipo,categoria,monto,descripcion,pagado,fecha\n';
    const csvRows = expenses.map(e => 
      `"${e.id}","${e.type}","${e.category}",${e.amount},"${e.description.replace(/"/g, '""')}",${e.isPaid},"${e.date.toISOString()}"`
    ).join('\n');
    
    const csvPath = path.join(backupDir, `gastos_${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvHeader + csvRows);

    console.log('✅ Respaldo de GASTOS completado:');
    console.log(`   - JSON: ${jsonPath}`);
    console.log(`   - CSV:  ${csvPath}`);
    console.log(`   - Total registros: ${expenses.length}`);

  } catch (error) {
    console.error('❌ Error al exportar gastos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportGastos();
