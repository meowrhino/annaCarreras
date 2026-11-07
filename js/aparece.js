// Las cosas aparecen traídas por la corriente del fondo. Cada pieza (una
// portada, un párrafo, una foto, una línea del CV) mira el campo de flujo de la
// página en su sitio de la pantalla y lo recorre hacia atrás, hasta salir de la
// pantalla: cuantos más pasos, más lejos está de donde entra la corriente, y
// más tarde aparece. Y llega desde aguas arriba, en la dirección del campo
// (en un proyecto «recto», en horizontal o en vertical). Al cargar, al cambiar
// de página y al bajar con el scroll, cada pieza la primera vez que se ve.
//
// Sin JS no se esconde nada: <html class="js"> lo pone el <head>, y el CSS deja
// #app oculto hasta que aquí se marca .listo (o 3 s después, por si este JS falla).
import { corriente } from './fondo.js';

const PIEZAS = '.work > li, .hero, .project-head > *, .body > :not(.outputs, .tweets), .outputs > *, .tweets > *, .ficha, .geek, .pager, .upcoming, .bio > p, .cv h2, .cv li, .firma, .contact li';
const PASO = 14;        // px por paso al remontar la corriente
const PASOS = 60;       // como mucho: más, y la pieza va al final
const ESPERA = 650;     // ms: lo más tarde que empieza una pieza
const VIENE = 22;       // px desde los que llega

// Cuántos pasos de corriente hay entre el borde de la pantalla y (x, y).
function remonta(x, y, t) {
  let n = 0;
  while (n < PASOS && x > 0 && y > 0 && x < innerWidth && y < innerHeight) {
    const a = corriente(x, y, t);
    x -= Math.cos(a) * PASO; y -= Math.sin(a) * PASO;
    n++;
  }
  return n;
}

const ve = new IntersectionObserver((entradas) => {
  const t = performance.now();
  const piezas = entradas.filter((e) => e.isIntersecting).map(({ target, boundingClientRect: r }) => {
    ve.unobserve(target);
    const x = r.left + r.width / 2, y = Math.min(r.top + r.height / 2, innerHeight - 1);
    return { el: target, a: corriente(x, y, t), n: remonta(x, y, t) };
  });
  if (!piezas.length) return;
  // lo que entra a la vez (al cargar, o varias al hacer scroll) se reparte el tiempo;
  // la primera de cada tanda, sin esperar
  const min = Math.min(...piezas.map((p) => p.n));
  for (const { el, a, n } of piezas) {
    el.style.setProperty('--dx', `${(-Math.cos(a) * VIENE).toFixed(1)}px`);
    el.style.setProperty('--dy', `${(-Math.sin(a) * VIENE).toFixed(1)}px`);
    el.style.setProperty('--espera', `${Math.round((n - min) / PASOS * ESPERA)}ms`);
  }
  // un cuadro con la pieza en su sitio de salida, y entonces a su sitio
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const { el } of piezas) {
      el.classList.add('ya');
      setTimeout(() => { el.classList.remove('aparece', 'ya'); el.style.removeProperty('--espera'); }, ESPERA + 1200);
    }
  }));
}, { rootMargin: '0px 0px -5% 0px' });

export function aparece(app) {
  ve.disconnect();
  app.querySelectorAll(PIEZAS).forEach((el) => {
    el.classList.add('aparece');
    ve.observe(el);
  });
  app.classList.add('listo');
}
