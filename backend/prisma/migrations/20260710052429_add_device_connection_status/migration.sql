-- CreateEnum
CREATE TYPE "DeviceConnectionStatus" AS ENUM ('NOT_TESTED', 'CONNECTED', 'FAILED');

-- AlterTable
ALTER TABLE "OltDevice" ADD COLUMN     "connectionStatus" "DeviceConnectionStatus" NOT NULL DEFAULT 'NOT_TESTED',
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastTestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Router" ADD COLUMN     "connectionStatus" "DeviceConnectionStatus" NOT NULL DEFAULT 'NOT_TESTED',
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastTestedAt" TIMESTAMP(3);
