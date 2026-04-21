-- CreateTable
CREATE TABLE "MelbourneSensor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kerbsideId" INTEGER NOT NULL,
    "zoneNumber" INTEGER NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "occupancySince" DATETIME,
    "lastUpdated" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MelbourneSensor_kerbsideId_key" ON "MelbourneSensor"("kerbsideId");
