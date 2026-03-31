-- CreateEnum
CREATE TYPE "SessionGroupStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionPriceType" AS ENUM ('PER_SESSION', 'CUSTOM_TOTAL');

-- CreateTable
CREATE TABLE "session_groups" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "service_id" TEXT,
    "client_name" VARCHAR(100),
    "client_phone" VARCHAR(20),
    "user_id" TEXT,
    "custom_service_name" VARCHAR(200),
    "total_sessions" INTEGER NOT NULL,
    "price_type" "SessionPriceType" NOT NULL DEFAULT 'PER_SESSION',
    "total_price" DECIMAL(10,2),
    "session_price" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "notes" TEXT,
    "status" "SessionGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_groups_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "session_group_id" TEXT;

-- CreateIndex
CREATE INDEX "session_groups_professional_id_idx" ON "session_groups"("professional_id");

-- CreateIndex
CREATE INDEX "session_groups_user_id_idx" ON "session_groups"("user_id");

-- CreateIndex
CREATE INDEX "bookings_session_group_id_idx" ON "bookings"("session_group_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_session_group_id_fkey" FOREIGN KEY ("session_group_id") REFERENCES "session_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_groups" ADD CONSTRAINT "session_groups_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_groups" ADD CONSTRAINT "session_groups_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_groups" ADD CONSTRAINT "session_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
