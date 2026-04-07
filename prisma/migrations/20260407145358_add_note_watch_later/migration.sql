-- AlterTable
ALTER TABLE "WatchedMovie" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "WatchLaterMovie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "movieTitle" TEXT NOT NULL,
    "posterPath" TEXT,
    "releaseYear" TEXT,
    "voteAverage" DOUBLE PRECISION,
    "mediaType" TEXT NOT NULL DEFAULT 'movie',
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchLaterMovie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchLaterMovie_userId_idx" ON "WatchLaterMovie"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchLaterMovie_userId_movieId_key" ON "WatchLaterMovie"("userId", "movieId");

-- AddForeignKey
ALTER TABLE "WatchLaterMovie" ADD CONSTRAINT "WatchLaterMovie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
