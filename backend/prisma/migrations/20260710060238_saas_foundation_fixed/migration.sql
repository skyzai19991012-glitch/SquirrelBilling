/*
  Warnings:

  - The primary key for the `InternetPackage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `packageId` on the `InternetPackage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerNo]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `InternetPackage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNo]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serialNumber]` on the table `OnuDevice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `PppAccount` will be added. If there are existing duplicate values, this will fail.
  - Made the column `id` on table `InternetPackage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_packageId_fkey";

-- DropIndex
DROP INDEX "Customer_tenantId_customerNo_key";

-- DropIndex
DROP INDEX "InternetPackage_tenantId_name_key";

-- DropIndex
DROP INDEX "Invoice_tenantId_invoiceNo_key";

-- DropIndex
DROP INDEX "OnuDevice_tenantId_serialNumber_key";

-- DropIndex
DROP INDEX "PppAccount_tenantId_username_key";

-- AlterTable
ALTER TABLE "InternetPackage" DROP CONSTRAINT "InternetPackage_pkey",
DROP COLUMN "packageId",
ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "InternetPackage_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerNo_key" ON "Customer"("customerNo");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_routerId_idx" ON "Customer"("routerId");

-- CreateIndex
CREATE INDEX "Customer_packageId_idx" ON "Customer"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "InternetPackage_name_key" ON "InternetPackage"("name");

-- CreateIndex
CREATE INDEX "InternetPackage_tenantId_idx" ON "InternetPackage"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_idx" ON "Invoice"("tenantId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "OltDevice_tenantId_idx" ON "OltDevice"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OnuDevice_serialNumber_key" ON "OnuDevice"("serialNumber");

-- CreateIndex
CREATE INDEX "OnuDevice_tenantId_idx" ON "OnuDevice"("tenantId");

-- CreateIndex
CREATE INDEX "OnuDevice_oltId_idx" ON "OnuDevice"("oltId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PppAccount_username_key" ON "PppAccount"("username");

-- CreateIndex
CREATE INDEX "PppAccount_tenantId_idx" ON "PppAccount"("tenantId");

-- CreateIndex
CREATE INDEX "PppAccount_routerId_idx" ON "PppAccount"("routerId");

-- CreateIndex
CREATE INDEX "Router_tenantId_idx" ON "Router"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "InternetPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
