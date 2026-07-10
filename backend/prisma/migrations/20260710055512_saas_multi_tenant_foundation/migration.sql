/*
  Warnings:

  - The primary key for the `InternetPackage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[tenantId,customerNo]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `InternetPackage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,invoiceNo]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,serialNumber]` on the table `OnuDevice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,username]` on the table `PppAccount` will be added. If there are existing duplicate values, this will fail.
  - The required column `packageId` was added to the `InternetPackage` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_packageId_fkey";

-- DropIndex
DROP INDEX "Customer_customerNo_key";

-- DropIndex
DROP INDEX "InternetPackage_name_key";

-- DropIndex
DROP INDEX "Invoice_invoiceNo_key";

-- DropIndex
DROP INDEX "OnuDevice_serialNumber_key";

-- DropIndex
DROP INDEX "PppAccount_username_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "InternetPackage" DROP CONSTRAINT "InternetPackage_pkey",
ADD COLUMN     "packageId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT,
ALTER COLUMN "id" DROP NOT NULL,
ADD CONSTRAINT "InternetPackage_pkey" PRIMARY KEY ("packageId");

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "OltDevice" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "OnuDevice" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "PppAccount" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Router" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "ownerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "planName" TEXT NOT NULL DEFAULT 'STARTER',
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxCustomers" INTEGER NOT NULL DEFAULT 300,
    "maxRouters" INTEGER NOT NULL DEFAULT 1,
    "maxOlts" INTEGER NOT NULL DEFAULT 1,
    "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_customerNo_key" ON "Customer"("tenantId", "customerNo");

-- CreateIndex
CREATE UNIQUE INDEX "InternetPackage_tenantId_name_key" ON "InternetPackage"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceNo_key" ON "Invoice"("tenantId", "invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "OnuDevice_tenantId_serialNumber_key" ON "OnuDevice"("tenantId", "serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PppAccount_tenantId_username_key" ON "PppAccount"("tenantId", "username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Router" ADD CONSTRAINT "Router_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternetPackage" ADD CONSTRAINT "InternetPackage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "InternetPackage"("packageId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PppAccount" ADD CONSTRAINT "PppAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OltDevice" ADD CONSTRAINT "OltDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnuDevice" ADD CONSTRAINT "OnuDevice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
