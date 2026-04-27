import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupPath = path.join(__dirname, '..', 'backups', 'backup-pre-sku-migration-2026-03-10T17-47-22-715Z.json');
const outputPath = path.join(__dirname, '..', 'backups', 'inventario-2026-03-10.html');

console.log('📂 Leyendo backup JSON...');
const raw = fs.readFileSync(backupPath, 'utf-8');
const backup = JSON.parse(raw);
const { items, categories, locations } = backup.data;

// Agrupar por categoría
const byCategory = {};
for (const item of items) {
  const cat = item.category?.name || 'Sin Categoría';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(item);
}

// Agrupar por ubicación
const byLocation = {};
for (const item of items) {
  const loc = item.location?.name || 'Sin Ubicación';
  if (!byLocation[loc]) byLocation[loc] = [];
  byLocation[loc].push(item);
}

// Totales
const totalItems = items.length;
const totalUnits = items.reduce((s, i) => s + (i.quantity || 0), 0);

const catIcons = {
  'Electric-Tool': '⚡',
  'Manual-Tool': '🔧',
  'Material': '📦',
};
const catColors = {
  'Electric-Tool': '#f59e0b',
  'Manual-Tool': '#3b82f6',
  'Material': '#10b981',
};
const catLabels = {
  'Electric-Tool': 'Herramientas Eléctricas',
  'Manual-Tool': 'Herramientas Manuales',
  'Material': 'Materiales y Consumibles',
};

function statusBadge(status) {
  const map = {
    'AVAILABLE': ['DISPONIBLE', '#10b981'],
    'IN_USE': ['EN USO', '#f59e0b'],
    'MAINTENANCE': ['MANT.', '#ef4444'],
  };
  const [label, color] = map[status] || [status, '#6b7280'];
  return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${label}</span>`;
}

function renderCategorySection(catName, catItems) {
  const icon = catIcons[catName] || '📋';
  const color = catColors[catName] || '#6b7280';
  const label = catLabels[catName] || catName;
  const totalQty = catItems.reduce((s, i) => s + (i.quantity || 0), 0);

  const rows = catItems.map((item, idx) => {
    const fecha = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    return `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'};">
      <td style="padding:10px 12px;font-size:13px;color:#374151;">${item.id}</td>
      <td style="padding:10px 12px;font-size:13px;color:#111827;font-weight:500;">${item.name || ''}</td>
      <td style="padding:10px 12px;font-size:13px;color:#374151;text-align:center;font-weight:700;">${item.quantity ?? 0}</td>
      <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${item.location?.name || ''}</td>
      <td style="padding:10px 12px;font-size:12px;">${statusBadge(item.status)}</td>
      <td style="padding:10px 12px;font-size:11px;color:#9ca3af;white-space:nowrap;">${fecha}</td>
    </tr>`;
  }).join('');

  return `
  <div style="margin-bottom:32px;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
    <div style="background:${color};padding:16px 20px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:28px;">${icon}</span>
      <div>
        <div style="color:white;font-size:18px;font-weight:700;">${label}</div>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;">${catItems.length} tipos &bull; ${totalQty} unidades totales</div>
      </div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">ID</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Nombre</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Cant.</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Ubicación</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Estado</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Fecha Creación</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

const categorySections = Object.entries(byCategory)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([cat, catItems]) => renderCategorySection(cat, catItems))
  .join('');

const summaryCards = Object.entries(byCategory).map(([cat, catItems]) => {
  const icon = catIcons[cat] || '📋';
  const color = catColors[cat] || '#6b7280';
  const label = catLabels[cat] || cat;
  const totalQty = catItems.reduce((s, i) => s + (i.quantity || 0), 0);
  return `
  <div style="background:white;border-radius:12px;padding:16px;border:2px solid ${color}33;flex:1;min-width:140px;">
    <div style="font-size:28px;margin-bottom:6px;">${icon}</div>
    <div style="font-size:22px;font-weight:800;color:${color};">${catItems.length}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:2px;">tipos de items</div>
    <div style="font-size:16px;font-weight:700;color:#111827;margin-top:4px;">${totalQty}</div>
    <div style="font-size:12px;color:#6b7280;">unidades</div>
    <div style="font-size:11px;color:${color};font-weight:600;margin-top:8px;">${label}</div>
  </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inventario WIP - 10 Mar 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; }
    @media print {
      body { background: white; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:28px 20px;text-align:center;color:white;">
  <div style="font-size:36px;margin-bottom:8px;">🏗️</div>
  <h1 style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">WIP</h1>
  <div style="font-size:15px;opacity:0.85;margin-top:4px;">Reporte de Inventario</div>
  <div style="background:rgba(255,255,255,0.15);display:inline-block;padding:6px 16px;border-radius:20px;font-size:13px;margin-top:10px;">📅 10 de Marzo de 2026</div>
</div>

<!-- TOTALES -->
<div style="background:white;padding:20px;border-bottom:1px solid #e5e7eb;">
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
    <div style="text-align:center;padding:16px 24px;background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;min-width:120px;">
      <div style="font-size:30px;font-weight:800;color:#1e3a5f;">${totalItems}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">Tipos de Items</div>
    </div>
    <div style="text-align:center;padding:16px 24px;background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;min-width:120px;">
      <div style="font-size:30px;font-weight:800;color:#1e3a5f;">${totalUnits.toLocaleString()}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">Unidades Totales</div>
    </div>
    <div style="text-align:center;padding:16px 24px;background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;min-width:120px;">
      <div style="font-size:30px;font-weight:800;color:#1e3a5f;">${locations.length}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">Ubicaciones</div>
    </div>
  </div>

  <!-- Cards por categoría -->
  <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
    ${summaryCards}
  </div>
</div>

<!-- BOTON IMPRIMIR / PDF -->
<div class="no-print" style="text-align:center;padding:16px;">
  <button onclick="window.print()" style="background:#1e3a5f;color:white;border:none;padding:12px 28px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;">
    🖨️ Guardar como PDF / Imprimir
  </button>
</div>

<!-- INVENTARIO POR CATEGORÍA -->
<div style="padding:0 16px 32px;">
  ${categorySections}
</div>

<!-- FOOTER -->
<div style="background:#1e3a5f;color:rgba(255,255,255,0.7);text-align:center;padding:20px;font-size:12px;">
  Inventario WIP &bull; Respaldo generado el 10 de Marzo de 2026 &bull; ${totalItems} items
</div>

</body>
</html>`;

fs.writeFileSync(outputPath, html, 'utf-8');
console.log(`\n✅ Reporte HTML generado:`);
console.log(`   📄 ${outputPath}`);
console.log(`\n📱 Para abrirlo en el celular:`);
console.log(`   1. Copia el archivo a tu celular (WhatsApp, email, USB)`);
console.log(`   2. Ábrelo con cualquier navegador (Chrome, Safari)`);
console.log(`   3. Para PDF: toca el ícono de compartir → "Imprimir" → "Guardar como PDF"`);
