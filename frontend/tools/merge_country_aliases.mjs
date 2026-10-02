// Añade a world-admin1.topojson TODOS los nombres que ya acepta el juego de país (public/data/countries/*.js),
// para que escribir un nombre (en español, inglés o variante) se acepte igual en "World subdivisions".
// Uso (desde frontend/):  node tools/merge_country_aliases.mjs        (es idempotente)
import fs from 'fs';
import { normalizeText } from '../src/lib/textMatch.js';

// Igual que stripTypeWords de src/lib/worldRegions.js
const TYPE = new Set(['province','provincia','state','estado','region','departamento','department','oblast','county','city','governorate','district','distrito','gobernacion','prefecture','prefectura','municipality','municipio','canton']);
const GLUE = new Set(['de','del','of','la','el']);
function strip(norm) {
  const t = norm.split(' ').filter((w) => !TYPE.has(w));
  while (t.length && GLUE.has(t[0])) t.shift();
  while (t.length && GLUE.has(t[t.length - 1])) t.pop();
  const s = t.join(' ');
  return s.length >= 3 && s !== norm ? s : '';
}
const forms = (raw) => { const n = normalizeText(raw), s = strip(n); return s ? [n, s] : [n]; };

const TOPO = 'public/data/world-admin1.topojson', DIR = 'public/data/countries/';
const topo = JSON.parse(fs.readFileSync(TOPO, 'utf8'));
const geoms = topo.objects.regiones.geometries;
const meta = JSON.parse(fs.readFileSync('../backend/paises_meta.json', 'utf8'));
const slug2en = {};
for (const v of Object.values(meta)) { slug2en[v.slug_front] = v.en; slug2en[v.slug_archivo] = v.en; }

const byCountry = new Map();
for (const g of geoms) {
  const p = g.properties;
  const raw = [p.n, ...(p.a ? p.a.split('|') : [])];
  g._set = new Set(raw.flatMap(forms));
  g._raw = raw;
  if (!byCountry.has(p.ce)) byCountry.set(p.ce, []);
  byCountry.get(p.ce).push(g);
}

let added = 0, regionsTouched = 0, skippedAmbiguous = 0;
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.js'))) {
  const en = slug2en[f.slice(0, -3)];
  const rs = byCountry.get(en);
  if (!rs) continue;
  const w = {};
  try { new Function('window', fs.readFileSync(DIR + f, 'utf8'))(w); } catch { continue; }
  for (const cr of w.GEOTARIA_COUNTRY?.regions || []) {
    const typed = [...new Set([cr.name, cr.display, ...(cr.names || [])].filter(Boolean))];
    const keys = typed.flatMap(forms);
    // región del mapa que más nombres comparte; si hay empate no se toca (evita alias en la región equivocada)
    const scored = rs.map((g) => [g, keys.filter((k) => g._set.has(k)).length]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]);
    if (!scored.length) continue;
    if (scored.length > 1 && scored[0][1] === scored[1][1]) { skippedAmbiguous++; continue; }
    const g = scored[0][0];
    const fresh = typed.filter((t) => normalizeText(t).length >= 4 && !forms(t).some((k) => g._set.has(k)));
    if (!fresh.length) continue;
    const cur = g.properties.a ? g.properties.a.split('|') : [];
    for (const t of fresh) { cur.push(t); forms(t).forEach((k) => g._set.add(k)); added++; }
    g.properties.a = cur.join('|');
    regionsTouched++;
  }
}
for (const g of geoms) { delete g._set; delete g._raw; }
fs.writeFileSync(TOPO, JSON.stringify(topo));
console.log({ aliasesAñadidos: added, regionesModificadas: regionsTouched, empatesOmitidos: skippedAmbiguous });
