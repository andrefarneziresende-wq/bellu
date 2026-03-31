-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_service_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "service_id" DROP NOT NULL;
ALTER TABLE "bookings" ADD COLUMN "custom_service_name" VARCHAR(200);

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
