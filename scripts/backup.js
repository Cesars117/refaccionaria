import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Directorio backups creado');
  }

  try {
    console.log('🚀 Iniciando backup de base de datos MySQL...');
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    
    // Lista de todas las tablas en la base de datos compartida
    const tables = [
      'users',
      'suppliers',
      'supplier_parts',
      'categories',
      'locations',
      'parts',
      'vehicle_models',
      'fitment',
      'customers',
      'fleets',
      'fleet_units',
      'maintenance_projects',
      'project_parts',
      'quotes',
      'quote_items',
      'audit_log',
      'financial_entries',
      'delivery_routes',
      'delivery_stops',
      'recurring_expense_templates',
      // Tablas de la tienda online
      'ShopUser',
      'ShopProduct',
      'ShopVehicleCompatibility',
      'ShopCart',
      'ShopCartItem',
      'ShopOrder',
      'ShopOrderItem',
      'ShopSystemLog'
    ];

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      tables: {}
    };

    // Respaldar cada tabla de forma dinámica
    for (const table of tables) {
      try {
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\``);
        backupData.tables[table] = rows;
        console.log(`   • Tabla \`${table}\`: ${rows.length} filas respaldadas`);
      } catch (tableErr) {
        console.warn(`   ⚠️ Advertencia: No se pudo respaldar la tabla \`${table}\` (puede que no exista aún):`, tableErr.message);
      }
    }

    // Guardar archivo JSON
    const backupFileName = `backup-shared-db-${timestamp}.json`;
    const jsonBackupPath = path.join(backupDir, backupFileName);
    fs.writeFileSync(jsonBackupPath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup guardado en: ${jsonBackupPath}`);

    // Insertar registro de auditoría en la BD para que se vea en el panel
    try {
      const details = `Copia de seguridad automática diaria completada con éxito. Archivo: ${backupFileName}`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO audit_log (action, entityType, entityId, userEmail, userName, details, createdAt)
        VALUES ('DATABASE_BACKUP', 'SYSTEM', 'BACKUP', 'system@backup.local', 'Sistema de Backup', ?, CURRENT_TIMESTAMP)
      `, details);
      console.log('✅ Registro de auditoría guardado en la base de datos.');
    } catch (auditErr) {
      console.error('❌ Error al guardar registro de auditoría:', auditErr.message);
    }

    // Limpiar backups antiguos (mantener solo los últimos 30 archivos de backup)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-shared-db-'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > 30) {
      const filesToDelete = backupFiles.slice(30);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
      });
    }

    console.log('🎉 ¡Copia de seguridad completada con éxito!');
    return {
      success: true,
      path: jsonBackupPath,
    };

  } catch (error) {
    console.error('❌ Error general durante backup:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar backup si se llama directamente
const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  createBackup().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  });
}

export { createBackup };