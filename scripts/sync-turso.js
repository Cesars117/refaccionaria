import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Error: No se encontraron las variables TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en el entorno.");
    process.exit(1);
}

const client = createClient({ url, authToken });

async function sync() {
    console.log("🚀 Iniciando sincronización manual con Turso...");
    console.log(`🔗 Conectando a: ${url}`);
    
    try {
        // 1. Nuevas columnas en tablas existentes
        console.log("📝 Verificando columnas adicionales...");
        try { 
            await client.execute("ALTER TABLE Item ADD COLUMN siteKitSku TEXT"); 
            console.log("✅ Columna siteKitSku añadida a Item");
        } catch(e) { console.log("ℹ️ Columna siteKitSku ya existe o no se pudo crear."); }
        
        try { 
            await client.execute("ALTER TABLE SerialNumber ADD COLUMN tmoSerial TEXT"); 
            console.log("✅ Columna tmoSerial añadida a SerialNumber");
        } catch(e) { console.log("ℹ️ Columna tmoSerial ya existe o no se pudo crear."); }

        // 2. Tabla SiteKit
        console.log("🏗️ Creando tabla SiteKit...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "SiteKit" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "siteKitId" TEXT NOT NULL,
                "bomId" TEXT,
                "siteId" TEXT,
                "projectName" TEXT,
                "pallets" INTEGER,
                "authNumber" TEXT,
                "mslLocation" TEXT,
                "company" TEXT,
                "catsCode" TEXT,
                "subcontractor" TEXT,
                "dateCompleted" DATETIME,
                "status" TEXT NOT NULL DEFAULT 'PENDING',
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        try { await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS "SiteKit_siteKitId_key" ON "SiteKit"("siteKitId")'); } catch(e) {}

        // 3. Tabla SiteKitItem
        console.log("🏗️ Creando tabla SiteKitItem...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "SiteKitItem" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "siteKitId" INTEGER NOT NULL,
                "siteKitSku" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "quantityExpected" INTEGER NOT NULL,
                "quantityReceived" INTEGER NOT NULL DEFAULT 0,
                "status" TEXT NOT NULL DEFAULT 'PENDING',
                "notes" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "SiteKitItem_siteKitId_fkey" FOREIGN KEY ("siteKitId") REFERENCES "SiteKit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // 4. Tabla SiteKitAssetTag
        console.log("🏗️ Creando tabla SiteKitAssetTag...");
        await client.execute(`
            CREATE TABLE IF NOT EXISTS "SiteKitAssetTag" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "siteKitItemId" INTEGER NOT NULL,
                "assetTag" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'EXPECTED',
                "linkedItemId" INTEGER,
                "linkedSerialId" INTEGER,
                "verifiedAt" DATETIME,
                "verifiedBy" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "SiteKitAssetTag_siteKitItemId_fkey" FOREIGN KEY ("siteKitItemId") REFERENCES "SiteKitItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "SiteKitAssetTag_linkedItemId_fkey" FOREIGN KEY ("linkedItemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT "SiteKitAssetTag_linkedSerialId_fkey" FOREIGN KEY ("linkedSerialId") REFERENCES "SerialNumber" ("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        console.log("✅ ¡Sincronización completada con éxito!");
        console.log("🌐 Ya puedes refrescar tu página de Vercel.");
    } catch (error) {
        console.error("❌ Error crítico durante la sincronización:", error);
    }
}

sync();
