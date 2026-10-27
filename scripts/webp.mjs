// Pasa a webp lo que no lo sea en las carpetas que se le den, como imgToWeb
// (q85, 2000 px como mucho): img/3.jpg → img/3.webp, y borra el original.
// Los gif, animados y sin pérdida: con pérdida pesan el doble que el gif.
// Lo usa scrape.py con lo que baja del WordPress.
//
//   node scripts/webp.mjs work/<slug>/img …
import sharp from 'sharp';
import { readdirSync, rmSync } from 'node:fs';
import { join, parse } from 'node:path';

for (const dir of process.argv.slice(2)) {
  for (const f of readdirSync(dir)) {
    const { name, ext } = parse(f);
    if (!/^\.(jpe?g|png|gif)$/i.test(ext)) continue;
    const gif = /gif/i.test(ext);
    await sharp(join(dir, f), { animated: gif })
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp(gif ? { lossless: true, effort: 6 } : { quality: 85 })
      .toFile(join(dir, `${name}.webp`));
    rmSync(join(dir, f));
    console.log(`  ${join(dir, f)} → ${name}.webp`);
  }
}
