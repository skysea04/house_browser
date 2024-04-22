-- Migration number: 0001 	 2024-04-23T16:52:04.065Z
-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lineNotifyToken" TEXT
);

-- CreateTable
CREATE TABLE "RentCondition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "conditionUrl" TEXT
);

-- CreateTable
CREATE TABLE "RentHouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rentConditionId" INTEGER NOT NULL,
    "area" TEXT,
    "url" TEXT,
    "price" INTEGER,
    "surrounding" TEXT,
    CONSTRAINT "RentHouse_rentConditionId_fkey" FOREIGN KEY ("rentConditionId") REFERENCES "RentCondition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);


