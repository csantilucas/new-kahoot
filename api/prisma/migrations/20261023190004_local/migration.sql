-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "confettiSoundUrl" TEXT,
ADD COLUMN     "correctSoundUrl" TEXT,
ADD COLUMN     "countdownSoundUrl" TEXT,
ADD COLUMN     "entranceEffect" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "timeUpSoundUrl" TEXT;
