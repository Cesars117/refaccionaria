# 🛡️ Procedimientos de Seguridad de Datos

## 🚨 LECCIÓN DEL 18 DE ENERO 2026

**NUNCA MÁS**: Se perdieron 125 artículos del inventario durante una migración sin backup. Este documento previene que vuelva a ocurrir.

---

## 📋 PROCEDIMIENTOS OBLIGATORIOS

### ✅ Antes de CUALQUIER migración:

1. **SIEMPRE ejecutar backup pre-migración:**
   ```bash
   node scripts/pre-migration-backup.js
   ```

2. **Verificar que el backup se creó correctamente**

3. **Confirmar manualmente la migración**

4. **NO proceder sin backup exitoso**

### ✅ Backup diario automático:

```bash
# Ejecutar diariamente (configurar en programador de tareas)
node scripts/backup.js
```

### ✅ Backup manual desde aplicación:

1. Ir a `/backup` en la aplicación
2. Usar "Crear Backup" antes de cambios importantes
3. Usar "Exportar CSV" para tener copia local

---

## 🚀 COMANDOS SEGUROS

### ❌ NUNCA hacer esto:
```bash
npx prisma migrate dev --name nueva_migracion  # ¡SIN BACKUP!
npx prisma db push --force-reset --accept-data-loss  # ¡PELIGROSO!
git reset --hard [commit]  # ¡Puede perder datos!
```

### ✅ Forma segura:
```bash
# 1. Crear backup primero
node scripts/pre-migration-backup.js

# 2. El script automáticamente ejecutará la migración de forma segura
# O usar el flujo manual:
node scripts/backup.js
npx prisma migrate dev --name nueva_migracion
```

---

## 📁 UBICACIONES DE BACKUP

### Backups automáticos:
- **Ubicación**: `/backups/backup-YYYY-MM-DDTHH-MM-SS.json`
- **Contiene**: Estructura completa de BD con script de restauración
- **Retención**: 30 backups más recientes

### Backups manuales:
- **Ubicación**: `/backups/manual-backup-YYYY-MM-DDTHH-MM-SS.json`
- **Desde aplicación**: `/backup`

### Exports CSV:
- **Descarga directa** desde `/backup`
- **Nombre**: `inventario-YYYY-MM-DD.csv`

---

## 🆘 RECUPERACIÓN DE EMERGENCIA

### Si se perdieron datos:

1. **Parar aplicación inmediatamente**
2. **Localizar backup más reciente** en `/backups/`
3. **Ejecutar script de restauración**:
   ```bash
   node backups/restore-[timestamp].js
   ```

### Si no hay backup:

1. **NO hacer más migraciones**
2. **Revisar logs de la aplicación**
3. **Buscar en**:
   - Archivos temporales del sistema
   - Exports CSV previos
   - Capturas de pantalla
   - Base de datos de producción vs desarrollo

---

## 🔧 CONFIGURACIÓN DE BACKUP AUTOMÁTICO

### Windows (Programador de tareas):

1. Abrir "Programador de tareas"
2. Crear tarea básica:
   - **Nombre**: "Inventory Backup Daily"
   - **Desencadenador**: Diario a las 2:00 AM
   - **Acción**: Iniciar programa
   - **Programa**: `node`
   - **Argumentos**: `scripts/backup.js`
   - **Directorio**: `C:\WIP\inventory-system`

### Linux/Mac (crontab):

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2:00 AM
0 2 * * * cd /path/to/inventory-system && node scripts/backup.js
```

---

## ⚠️ SEÑALES DE ALERTA

### 🚨 Detener inmediatamente si:

- Error "relation does not exist" en Prisma
- Comandos que mencionan "force-reset"
- Pérdida súbita de datos en la aplicación
- Errores de migración en producción

### 🔍 Verificar antes de continuar:

- Cantidad de registros antes/después: `node verify-data.js`
- Funcionamiento de la aplicación
- Integridad de las relaciones de BD

---

## 📞 CONTACTOS DE EMERGENCIA

**En caso de pérdida crítica de datos:**

1. **Parar todo el trabajo**
2. **No hacer más cambios**
3. **Contactar administrador**
4. **Documentar exactamente qué pasó**

---

## 💡 MEJORES PRÁCTICAS

### ✅ Desarrollo seguro:

- Backup antes de cambios importantes
- Probar migraciones en desarrollo primero
- Usar nombres descriptivos en migraciones
- Verificar datos después de migraciones

### ✅ Producción:

- NUNCA hacer `migrate dev` en producción
- Usar `migrate deploy` para producción
- Siempre tener backup antes de deploy
- Coordinar downtime con usuarios

### ✅ Monitoreo:

- Verificar backups diarios
- Alertas si backup falla
- Pruebas de restauración periódicas

---

## 🎯 CHECKLIST RÁPIDO

Antes de cambios importantes:

- [ ] Backup creado ✅
- [ ] Backup verificado ✅
- [ ] Cambios probados en desarrollo ✅
- [ ] Plan de rollback definido ✅
- [ ] Usuarios notificados (si aplica) ✅

---

**Recordatorio: Los datos del inventario son críticos para operaciones de trabajo. La pérdida de datos puede impactar las operaciones diarias. SIEMPRE priorizar la seguridad de los datos.**