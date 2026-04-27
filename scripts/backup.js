import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Directorio backups creado');
  }

  try {
    console.log('🚀 Iniciando backup automático...');
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    
    // Obtener todos los datos
    const [items, categories, locations] = await Promise.all([
      prisma.item.findMany({
        include: {
          category: true,
          location: true
        }
      }),
      prisma.category.findMany(),
      prisma.location.findMany()
    ]);

    // Crear backup JSON completo
    const fullBackup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      counts: {
        items: items.length,
        categories: categories.length,
        locations: locations.length
      },
      data: {
        items,
        categories,
        locations
      }
    };

    // Guardar backup JSON
    const jsonBackupPath = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(jsonBackupPath, JSON.stringify(fullBackup, null, 2));
    console.log(`✅ Backup JSON: ${jsonBackupPath}`);

    // Crear backup CSV para fácil lectura
    const csvContent = [
      'nombre,sku,descripcion,estado,categoria,ubicacion,fechaCreacion',
      ...items.map(item => 
        `"${item.name}","${item.sku}","${item.description || ''}","${item.status}","${item.category?.name || 'Sin categoría'}","${item.location?.name || 'Sin ubicación'}","${item.createdAt}"`
      )
    ].join('\n');
    
    const csvBackupPath = path.join(backupDir, `backup-items-${timestamp}.csv`);
    fs.writeFileSync(csvBackupPath, csvContent);
    console.log(`✅ Backup CSV: ${csvBackupPath}`);

    // Crear script de restauración
    const restoreScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreBackup() {
  console.log('🔄 Restaurando backup del ${new Date(timestamp).toLocaleString()}...');
  
  const backupData = JSON.parse(fs.readFileSync('${jsonBackupPath}', 'utf8'));
  
  console.log(\`📊 Restaurando \${backupData.counts.items} artículos...\`);
  
  // Limpiar datos actuales (¡CUIDADO!)
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  
  // Restaurar categorías
  for (const category of backupData.data.categories) {
    await prisma.category.create({
      data: {
        id: category.id,
        name: category.name,
        createdAt: category.createdAt
      }
    });
  }
  
  // Restaurar ubicaciones
  for (const location of backupData.data.locations) {
    await prisma.location.create({
      data: {
        id: location.id,
        name: location.name,
        type: location.type,
        createdAt: location.createdAt
      }
    });
  }
  
  // Restaurar artículos
  for (const item of backupData.data.items) {
    await prisma.item.create({
      data: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        status: item.status,
        categoryId: item.categoryId,
        locationId: item.locationId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    });
  }
  
  console.log('✅ ¡Backup restaurado exitosamente!');
  await prisma.$disconnect();
}

restoreBackup().catch(console.error);
`;

    const restorePath = path.join(backupDir, `restore-${timestamp}.js`);
    fs.writeFileSync(restorePath, restoreScript);
    console.log(`✅ Script restauración: ${restorePath}`);

    // Limpiar backups antiguos (mantener solo los últimos 30)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-'))
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

    console.log('🎉 Backup completado exitosamente!');
    console.log(`📊 Artículos respaldados: ${items.length}`);
    console.log(`📂 Categorías respaldadas: ${categories.length}`);
    console.log(`📍 Ubicaciones respaldadas: ${locations.length}`);
    
    return {
      success: true,
      jsonPath: jsonBackupPath,
      csvPath: csvBackupPath,
      restorePath,
      counts: {
        items: items.length,
        categories: categories.length,
        locations: locations.length
      }
    };

  } catch (error) {
    console.error('❌ Error durante backup:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar backup si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup().then(result => {
    if (!result.success) {
      process.exit(1);
    }
  });
}

export { createBackup };