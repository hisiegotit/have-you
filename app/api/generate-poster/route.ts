import { createCanvas, loadImage } from "canvas";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { drawGradientBackground, drawRoundedImage, drawTruncatedText, PASTEL_PALETTE } from "@/lib/canvas-helpers";

const WIDTH = 1200;
const HEIGHT = 800;
const COLS = 3;
const POSTER_W = 160;
const POSTER_H = 240;
const NAME_H = 36;   // height reserved for movie title below each poster
const GAP = 24;
const TOP_PADDING = 100; // space for text header

export async function POST() {
  const session = await getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const movies = await prisma.watchedMovie.findMany({
    where: { userId: session.user.id, posterPath: { not: null } },
    orderBy: { watchedAt: "desc" },
    take: 6,
  });

  if (movies.length === 0) {
    return Response.json({ error: "No movies to generate poster" }, { status: 400 });
  }

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Random pastel gradient background
  const [color1, color2] = PASTEL_PALETTE[Math.floor(Math.random() * PASTEL_PALETTE.length)];
  drawGradientBackground(ctx, WIDTH, HEIGHT, color1, color2);

  // Dark text on light pastel background
  ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText(`${session.user.name}'s Movies`, 60, 66);

  ctx.fillStyle = "rgba(30, 30, 30, 0.6)";
  ctx.font = "24px sans-serif";
  ctx.fillText(`${movies.length} watched`, 60, 96);

  // Load poster images in parallel, skip failures
  const rows = Math.ceil(movies.length / COLS);
  const cardH = POSTER_H + NAME_H;
  const gridW = COLS * POSTER_W + (COLS - 1) * GAP;
  const gridH = rows * cardH + (rows - 1) * GAP;
  const startX = (WIDTH - gridW) / 2;
  const startY = TOP_PADDING + (HEIGHT - TOP_PADDING - gridH) / 2;

  const imageResults = await Promise.allSettled(
    movies.map((m) =>
      loadImage(`https://image.tmdb.org/t/p/w342${m.posterPath}`),
    ),
  );

  imageResults.forEach((result, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = startX + col * (POSTER_W + GAP);
    const y = startY + row * (cardH + GAP);

    // Draw poster image (skip if load failed)
    if (result.status === "fulfilled") {
      drawRoundedImage(ctx, result.value, x, y, POSTER_W, POSTER_H, 8);
    }

    // Draw movie title below poster
    ctx.fillStyle = "rgba(30, 30, 30, 0.85)";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    drawTruncatedText(ctx, movies[i].movieTitle, POSTER_W, x + POSTER_W / 2, y + POSTER_H + 20);
    ctx.textAlign = "left";
  });

  const buffer = canvas.toBuffer("image/png");
  // Slice to a standalone ArrayBuffer (Node Buffer may share memory with a larger ArrayBuffer)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="have-you.png"',
      "Cache-Control": "no-store",
    },
  });
}
