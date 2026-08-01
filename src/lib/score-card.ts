export type ScorePillar = { label: string; points: number; max: number };

const NAVY = "#0A1628";
const TEAL = "#2DD4BF";
const MUTED = "#94A3B8";

function levelColor(band: string) {
  switch (band) {
    case "Outstanding":
      return "#34D399";
    case "Good":
      return TEAL;
    case "Average":
      return "#FBBF24";
    case "Below Average":
      return "#FB923C";
    default:
      return "#F87171";
  }
}

/**
 * Renders the shareable Health Score card to a canvas.
 * `format` "square" = 1080x1080 (WhatsApp/Facebook), "story" = 1080x1920.
 */
export function drawScoreCard(opts: {
  name: string;
  score: number;
  band: string;
  pillars: ScorePillar[];
  format: "square" | "story";
}): HTMLCanvasElement {
  const w = 1080;
  const h = opts.format === "story" ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background with a soft teal glow.
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.38, 40, w / 2, h * 0.38, w * 0.7);
  glow.addColorStop(0, "rgba(45,212,191,0.20)");
  glow.addColorStop(1, "rgba(10,22,40,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const topPad = opts.format === "story" ? 220 : 90;
  ctx.textAlign = "center";

  // Brand.
  ctx.font = "700 46px 'Sora', system-ui, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Nirogi", w / 2 - 40, topPad);
  ctx.fillStyle = TEAL;
  ctx.fillText("AI", w / 2 + 78, topPad);

  // Heading.
  ctx.font = "600 40px 'Manrope', system-ui, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(`${opts.name}'s Health Score`, w / 2, topPad + 76);

  // Score ring.
  const cy = topPad + (opts.format === "story" ? 420 : 340);
  const r = 190;
  ctx.lineWidth = 34;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.arc(w / 2, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = TEAL;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(w / 2, cy, r, -Math.PI / 2, -Math.PI / 2 + (opts.score / 100) * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 150px 'Sora', system-ui, sans-serif";
  ctx.fillText(String(opts.score), w / 2, cy + 36);
  ctx.font = "600 38px 'Manrope', system-ui, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("/ 100", w / 2, cy + 92);

  ctx.font = "700 48px 'Sora', system-ui, sans-serif";
  ctx.fillStyle = levelColor(opts.band);
  ctx.fillText(opts.band, w / 2, cy + r + 90);

  // Pillar bars.
  const barW = 760;
  const barX = (w - barW) / 2;
  let y = cy + r + 170;
  ctx.textAlign = "left";
  for (const p of opts.pillars) {
    ctx.font = "600 30px 'Manrope', system-ui, sans-serif";
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(p.label, barX, y);
    ctx.textAlign = "right";
    ctx.fillStyle = MUTED;
    ctx.fillText(`${p.points}/${p.max}`, barX + barW, y);
    ctx.textAlign = "left";

    y += 20;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(barX, y, barW, 18, 9);
    ctx.fill();
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.roundRect(barX, y, Math.max(12, (p.points / p.max) * barW), 18, 9);
    ctx.fill();
    y += 66;
  }

  // Footer.
  ctx.textAlign = "center";
  ctx.font = "600 32px 'Manrope', system-ui, sans-serif";
  ctx.fillStyle = TEAL;
  ctx.fillText("Catch it before it is too late — nirogi.ai", w / 2, h - (opts.format === "story" ? 200 : 92));
  ctx.font = "500 26px 'Manrope', system-ui, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(
    `Checked on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    w / 2,
    h - (opts.format === "story" ? 150 : 50),
  );

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render the card."))), "image/png"),
  );
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
