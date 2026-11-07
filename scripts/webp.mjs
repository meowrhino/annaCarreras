// Pasa lo que baja del WordPress a lo que entiende la web, en las carpetas que
// se le den, y borra el original:
//   - fotos (jpg, png, gif quieto) → N.webp, como imgToWeb (q85, 2000 px como mucho);
//   - gif animado y mp4 → N.webm + N.poster.webp, como videoToWeb (VP8; el gif en
//     modo loop con más calidad, el mp4 en 720p, sin audio). Necesita ffmpeg.
// Lo usa scrape.py.
//
//   node scripts/webp.mjs work/<slug>/img …
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';

const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a]);
const caja = (w, h) => `scale='min(${w},iw)':'min(${h},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;

for (const dir of process.argv.slice(2)) {
  for (const f of readdirSync(dir)) {
    const { name, ext } = parse(f);
    if (!/^\.(jpe?g|png|gif|mp4)$/i.test(ext)) continue;
    const src = join(dir, f), out = join(dir, name);
    const gif = /gif/i.test(ext);
    const animado = gif && ((await sharp(src).metadata()).pages || 1) > 1;
    if (animado || /mp4/i.test(ext)) {
      const ajustes = animado ? ['-crf', '10', '-b:v', '2500k', '-vf', caja(960, 960)] : ['-crf', '20', '-b:v', '1200k', '-vf', caja(1280, 720)];
      ff('-i', src, '-c:v', 'libvpx', ...ajustes, '-cpu-used', '5', '-an', '-pix_fmt', 'yuv420p', `${out}.webm`);
      // el fotograma: el primero en un bucle, a medio segundo en un vídeo
      const png = await sharp(execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', animado ? '0' : '0.5', '-i', `${out}.webm`, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-']));
      await png.webp({ quality: 80 }).toFile(`${out}.poster.webp`);
      console.log(`  ${src} → ${name}.webm + ${name}.poster.webp`);
    } else {
      await sharp(src).resize(2000, 2000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(`${out}.webp`);
      console.log(`  ${src} → ${name}.webp`);
    }
    rmSync(src);
  }
}
