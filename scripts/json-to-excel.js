import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el JSON más reciente
const backupPath = path.join(__dirname, '..', 'backups', 'backup-pre-sku-migration-2026-03-10T17-47-22-715Z.json');
const outputPath = path.join(__dirname, '..', 'backups', 'inventario-completo-2026-03-10.csv');

console.log('📂 Leyendo backup JSON...');
const raw = fs.readFileSync(backupPath, 'utf-8');
const backup = JSON.parse(raw);

const { items, categories, locations } = backup.data;

console.log(`✅ Datos cargados:`);
console.log(`   - Items: ${items.length}`);
console.log(`   - Categorías: ${categories.length}`);
console.log(`   - Ubicaciones: ${locations.length}`);

// --- Hoja 1: Inventario Completo ---
const inventoryRows = [
  ['ID', 'Nombre', 'Descripción', 'Cantidad', 'Estado', 'Categoría', 'Ubicación', 'Tipo Ubicación', 'Subcategoría', 'Tipo Unidad', 'Unidades por Caja', 'SKU', 'Barcode', 'Fecha Creación', 'Última Actualización']
];

for (const item of items) {
  const cat = item.category?.name || '';
  const loc = item.location?.name || '';
  const locType = item.location?.type || '';
  const locSub = item.location?.subcategory || '';

  inventoryRows.push([
    item.id,
    item.name || '',
    item.description || '',
    item.quantity ?? '',
    item.status || '',
    cat,
    loc,
    locType,
    locSub,
    item.unitType || '',
    item.unitsPerBox ?? '',
    item.sku || '',
    item.barcode || '',
    item.createdAt ? new Date(item.createdAt).toLocaleString('es-MX') : '',
    item.updatedAt ? new Date(item.updatedAt).toLocaleString('es-MX') : '',
  ]);
}

// Escapar campos CSV correctamente
function escapeCSV(val) {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCSV(rows) {
  return rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
}

// Escribir CSV con BOM para que Excel lo lea en UTF-8 correctamente
const BOM = '\uFEFF';
const csvContent = BOM + rowsToCSV(inventoryRows);
fs.writeFileSync(outputPath, csvContent, 'utf-8');

console.log(`\n✅ Archivo generado exitosamente:`);
console.log(`   📄 ${outputPath}`);
console.log(`\n📊 Resumen del inventario:`);

// Resumen por categoría
const byCategory = {};
for (const item of items) {
  const cat = item.category?.name || 'Sin Categoría';
  if (!byCategory[cat]) byCategory[cat] = { count: 0, totalQty: 0 };
  byCategory[cat].count++;
  byCategory[cat].totalQty += item.quantity || 0;
}

for (const [cat, data] of Object.entries(byCategory)) {
  console.log(`   🔹 ${cat}: ${data.count} tipos de items, ${data.totalQty} unidades totales`);
}

console.log(`\n🗂️  Total: ${items.length} tipos de items en inventario`);
console.log(`\n💡 Abre el archivo en Excel:`);
console.log(`   backups/inventario-completo-2026-03-10.csv`);
