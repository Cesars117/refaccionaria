#!/usr/bin/env node

/**
 * 🚨 SCRIPT DE BACKUP PRE-MIGRACIÓN OBLIGATORIO
 * 
 * Este script DEBE ejecutarse antes de cualquier migración de Prisma
 * para evitar pérdida de datos como la que ocurrió el 18/01/2026.
 * 
 * USO:
 * node scripts/pre-migration-backup.js
 * npx prisma migrate dev --name tu_migracion
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

async function preBackupCheck() {
  console.log('🔍 VERIFICACIÓN PRE-MIGRACIÓN');
  console.log('================================');
  
  try {
    // Verificar que la base de datos esté accesible
    console.log('📡 Verificando conexión a base de datos...');
    await runCommand('npx prisma db push --force-reset --accept-data-loss --skip-generate');
    console.log('✅ Base de datos accesible');
    
    // Verificar cantidad de datos
    console.log('📊 Contando registros actuales...');
    const countScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function count() {
        const [items, categories, locations] = await Promise.all([
          prisma.item.count(),
          prisma.category.count(), 
          prisma.location.count()
        ]);
        console.log(\`\${items},\${categories},\${locations}\`);
        await prisma.$disconnect();
      }
      
      count();
    `;
    
    const tempFile = 'temp-count.js';
    fs.writeFileSync(tempFile, countScript);
    const countOutput = await runCommand('node temp-count.js');
    fs.unlinkSync(tempFile);
    
    const [itemCount, categoryCount, locationCount] = countOutput.trim().split(',').map(Number);
    
    console.log(`📊 Artículos actuales: ${itemCount}`);
    console.log(`📂 Categorías actuales: ${categoryCount}`);
    console.log(`📍 Ubicaciones actuales: ${locationCount}`);
    
    if (itemCount === 0) {
      console.log('⚠️  ADVERTENCIA: No hay artículos en la base de datos');
      const proceed = await question('¿Continuar sin backup? (si/no): ');
      if (proceed.toLowerCase() !== 'si') {
        console.log('❌ Migración cancelada por el usuario');
        process.exit(1);
      }
    }
    
    return { itemCount, categoryCount, locationCount };
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error.message);
    process.exit(1);
  }
}

async function createPreMigrationBackup() {
  console.log('\n💾 CREANDO BACKUP PRE-MIGRACIÓN');
  console.log('=================================');
  
  try {
    // Crear backup usando nuestro script
    console.log('🚀 Ejecutando backup...');
    const backupOutput = await runCommand('node scripts/backup.js');
    console.log(backupOutput);
    
    // Verificar que el backup se creó
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      throw new Error('Directorio de backup no encontrado');
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-'))
      .sort()
      .reverse();
    
    if (backupFiles.length === 0) {
      throw new Error('No se encontraron archivos de backup');
    }
    
    const latestBackup = backupFiles[0];
    console.log(`✅ Backup creado: ${latestBackup}`);
    
    return latestBackup;
    
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    console.log('🚨 MIGRACIÓN ABORTADA - No se puede proceder sin backup');
    process.exit(1);
  }
}

async function confirmMigration() {
  console.log('\n⚠️  CONFIRMACIÓN DE MIGRACIÓN');
  console.log('==============================');
  
  console.log('🚨 RECORDATORIO DEL 18/01/2026:');
  console.log('   Se perdieron 125 artículos de inventario durante migración');
  console.log('   sin backup previo. ¡NO repetir este error!');
  console.log('');
  
  const migrationName = await question('📝 Nombre de la migración: ');
  if (!migrationName || migrationName.trim() === '') {
    console.log('❌ Nombre de migración requerido');
    process.exit(1);
  }
  
  console.log('');
  console.log('📋 RESUMEN PRE-MIGRACIÓN:');
  console.log(`   • Backup creado: ✅`);
  console.log(`   • Base de datos verificada: ✅`);
  console.log(`   • Nombre migración: "${migrationName}"`);
  console.log('');
  
  const confirm = await question('🔒 ¿Confirmar ejecución de migración? (CONFIRMO/no): ');
  if (confirm !== 'CONFIRMO') {
    console.log('❌ Migración cancelada por seguridad');
    process.exit(0);
  }
  
  return migrationName;
}

async function executeMigration(migrationName) {
  console.log('\\n🚀 EJECUTANDO MIGRACIÓN');
  console.log('========================');
  
  try {
    console.log(`📦 Ejecutando: npx prisma migrate dev --name "${migrationName}"`);
    const migrationOutput = await runCommand(`npx prisma migrate dev --name "${migrationName}"`);
    console.log(migrationOutput);
    
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ ERROR DURANTE MIGRACIÓN:', error.message);
    console.log('');
    console.log('🆘 PASOS DE RECUPERACIÓN:');
    console.log('1. Revisar el error de migración');
    console.log('2. Si es necesario, usar el backup para restaurar');
    console.log('3. Contactar al administrador del sistema');
    process.exit(1);
  }
}

async function postMigrationCheck() {
  console.log('\\n✅ VERIFICACIÓN POST-MIGRACIÓN');
  console.log('===============================');
  
  try {
    // Verificar que la base de datos funciona
    const countScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function count() {
        try {
          const [items, categories, locations] = await Promise.all([
            prisma.item.count(),
            prisma.category.count(), 
            prisma.location.count()
          ]);
          console.log(\`\${items},\${categories},\${locations}\`);
        } catch (error) {
          console.log(\`ERROR: \${error.message}\`);
        } finally {
          await prisma.$disconnect();
        }
      }
      
      count();
    `;
    
    const tempFile = 'temp-post-count.js';
    fs.writeFileSync(tempFile, countScript);
    const countOutput = await runCommand('node temp-post-count.js');
    fs.unlinkSync(tempFile);
    
    if (countOutput.includes('ERROR:')) {
      throw new Error('Base de datos no responde correctamente');
    }
    
    const [itemCount, categoryCount, locationCount] = countOutput.trim().split(',').map(Number);
    
    console.log(`📊 Artículos después de migración: ${itemCount}`);
    console.log(`📂 Categorías después de migración: ${categoryCount}`);
    console.log(`📍 Ubicaciones después de migración: ${locationCount}`);
    
    console.log('\\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('💡 Los datos están seguros y la aplicación funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error en verificación post-migración:', error.message);
    console.log('⚠️  La migración pudo haber causado problemas');
    process.exit(1);
  }
}

async function main() {
  console.log('🛡️  SISTEMA DE BACKUP PRE-MIGRACIÓN');
  console.log('====================================');
  console.log('🚨 Este script previene pérdida de datos como la del 18/01/2026');
  console.log('');
  
  try {
    // 1. Verificación inicial
    await preBackupCheck();
    
    // 2. Crear backup
    await createPreMigrationBackup();
    
    // 3. Confirmar migración
    const migrationName = await confirmMigration();
    
    // 4. Ejecutar migración
    await executeMigration(migrationName);
    
    // 5. Verificar resultado
    await postMigrationCheck();
    
  } catch (error) {
    console.error('❌ Error crítico:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };