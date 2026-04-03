import type { CanvasRenderingContext2D, Image } from "canvas";

// Pastel color pairs for random gradient backgrounds
export const PASTEL_PALETTE: [string, string][] = [
  ["#ffd6e0", "#c8b6ff"], // pink → purple
  ["#bde0fe", "#caffbf"], // blue → green
  ["#fdffb6", "#ffd6a5"], // yellow → orange
  ["#ffafcc", "#bde0fe"], // pink → blue
  ["#caffbf", "#fdffb6"], // green → yellow
  ["#c8b6ff", "#ffd6e0"], // purple → pink
  ["#ffd6a5", "#ffd6e0"], // orange → pink
  ["#bde0fe", "#c8b6ff"], // blue → purple
];

// Draws a linear gradient background using two pastel colors
export function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color1: string,
  color2: string,
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Draws an image with rounded corners via clip path
export function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  image: Image,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, w, h);
  ctx.restore();
}

// Draws text truncated with ellipsis to fit within maxWidth
export function drawTruncatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  x: number,
  y: number,
) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated + "…", x, y);
}
