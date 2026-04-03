-- AlterTable
ALTER TABLE "WatchedMovie" ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'movie',
ADD COLUMN     "userRating" INTEGER;
