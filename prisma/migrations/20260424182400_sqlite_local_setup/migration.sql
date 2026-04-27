-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "siteKitSku" TEXT,
    "unitType" TEXT,
    "unitsPerBox" INTEGER,
    "totalUnits" INTEGER,
    "categoryId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serialNumber" TEXT,
    "tmoSerial" TEXT,
    "itemId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SerialNumber_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "subcategory" TEXT
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityLabel" TEXT,
    "fieldChanged" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SiteKit" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteKitItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteKitId" INTEGER NOT NULL,
    "siteKitSku" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantityExpected" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SiteKitItem_siteKitId_fkey" FOREIGN KEY ("siteKitId") REFERENCES "SiteKit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteKitAssetTag" (
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
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "Item"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SiteKit_siteKitId_key" ON "SiteKit"("siteKitId");
