-- Migration number: 0003 	 2024-12-15T12:12:34.063Z
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RentHouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rentConditionId" INTEGER NOT NULL,
    "area" INTEGER,
    "url" TEXT,
    "price" INTEGER,
    "surrounding" TEXT
);
INSERT INTO "new_RentHouse" ("area", "id", "price", "rentConditionId", "surrounding", "url") SELECT "area", "id", "price", "rentConditionId", "surrounding", "url" FROM "RentHouse";
DROP TABLE "RentHouse";
ALTER TABLE "new_RentHouse" RENAME TO "RentHouse";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
