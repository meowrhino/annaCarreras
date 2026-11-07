// El icono de la pestaña: un trocito del mismo campo que el fondo (la misma
// semilla), dibujándose. A 64 px y con el trazo gordo, para que se lea a 16.
// Sin DOM: fondo.js lo pinta en directo, y el build saca uno quieto
// (favicon.svg) para Google y para cuando no corre el JS.
import { campo } from './campo.js';

export const LADO = 64;
const VIDA = 4000;      // ms que tarda un trazo en borrarse
const PUNTAS = 3;
const PASO = 33;        // ms por paso, como el fondo
const PREVIO = 120;     // pasos ya dibujados al empezar: nunca sale vacío
export const PAPEL = '#efede8', TINTA = '#111', RADIO = 12;

export function icono(texto, iteracion, t0) {
  const { rnd, c, rumbo } = campo(texto, iteracion);
  const zoom = 1.2 / (c.escala * LADO);   // el icono enseña un remolino y poco del campo
  const vida = c.vida / 4;
  const puntas = [];
  const trazos = [];                      // [x1, y1, x2, y2, t]
  const nace = () => puntas.push({ x: 8 + rnd() * (LADO - 16), y: 8 + rnd() * (LADO - 16), edad: 0 });

  function avanza(t) {
    while (puntas.length < PUNTAS) nace();
    for (let i = puntas.length - 1; i >= 0; i--) {
      const p = puntas[i];
      const a = rumbo(p.x * zoom, p.y * zoom, t);
      const x = p.x + Math.cos(a) * 1.4, y = p.y + Math.sin(a) * 1.4;
      trazos.push([p.x, p.y, x, y, t]);
      p.x = x; p.y = y; p.edad++;
      if (x < -4 || y < -4 || x > LADO + 4 || y > LADO + 4 || p.edad > vida) puntas.splice(i, 1);
    }
    while (trazos.length && t - trazos[0][4] > VIDA) trazos.shift();
  }

  let antes = t0 - PREVIO * PASO;
  // Los pasos que tocan hasta t. Con la pestaña de fondo el navegador llama
  // una vez por segundo: hace los que faltan, hasta 40 de golpe.
  function hasta(t, tope = 40) {
    const k = Math.min(tope, Math.floor((t - antes) / PASO));
    for (let i = k - 1; i >= 0; i--) avanza(t - i * PASO);
    if (k > 0) antes = t;
  }
  hasta(t0, PREVIO);

  // La opacidad de un trazo en t: nuevo, entero; a punto de borrarse, casi nada.
  const alfa = (tr, t) => Math.max(0, 1 - (t - tr[4]) / VIDA);
  const grueso = 3.2 + c.grueso;

  // El quieto, en SVG: diez tonos, un path por tono.
  function svg(t) {
    const tonos = Array.from({ length: 10 }, () => []);
    for (const tr of trazos) {
      const a = alfa(tr, t);
      if (a > 0) tonos[Math.min(9, a * 10 | 0)].push(`M${tr[0].toFixed(1)} ${tr[1].toFixed(1)}L${tr[2].toFixed(1)} ${tr[3].toFixed(1)}`);
    }
    const paths = tonos.map((d, k) => d.length ? `<path stroke-opacity="${((k + 1) / 10).toFixed(1)}" d="${d.join('')}"/>` : '').join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}"><clipPath id="c"><rect width="${LADO}" height="${LADO}" rx="${RADIO}"/></clipPath>`
      + `<rect width="${LADO}" height="${LADO}" rx="${RADIO}" fill="${PAPEL}"/>`
      + `<g clip-path="url(#c)" fill="none" stroke="${TINTA}" stroke-width="${grueso.toFixed(1)}" stroke-linecap="round">${paths}</g></svg>\n`;
  }

  return { trazos, hasta, alfa, grueso, svg };
}
