-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'DATE', 'DATETIME', 'TEXT', 'JSON');

-- CreateEnum
CREATE TYPE "MigrationOperation" AS ENUM ('CREATE_TABLE', 'DROP_TABLE', 'ADD_COLUMN', 'DROP_COLUMN', 'MODIFY_COLUMN', 'RENAME_COLUMN', 'RENAME_TABLE');

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "tableName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "type" "FieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "validation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "operation" "MigrationOperation" NOT NULL,
    "description" TEXT NOT NULL,
    "sqlQuery" TEXT,
    "rollbackSql" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_name_key" ON "resources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resources_tableName_key" ON "resources"("tableName");

-- CreateIndex
CREATE UNIQUE INDEX "fields_resourceId_name_key" ON "fields"("resourceId", "name");

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;