-- AlterTable
ALTER TABLE "WatchedMovie" ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];
