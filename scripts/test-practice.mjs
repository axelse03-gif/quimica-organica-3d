// Pruebas de la práctica: generador aleatorio, corrección tolerante y hojas fijas.
import fs from 'node:fs'
import { createNamer } from '../src/lib/chem/nomenclature.js'
import { modelToGraph, modelToSemidevelopedFormula, validateModel, emptyModel, cloneModel } from '../src/lib/chem/chainModel.js'
import { parseSemidevelopedFormula } from '../src/lib/chem/formulaParser.js'
import { canonicalHash } from '../src/lib/chem/canonical.js'
import { nameKey, checkName, acceptedNames, courseStyleName } from '../src/lib/chem/answers.js'
import { PRACTICE_FAMILIES, buildSession, sessionFromSheet, gradeExercise, notaFinal, chainIsLongest, makeRng, generateModel } from '../src/lib/practice.js'
import { HOJAS } from '../src/data/hojas.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const namer = createNamer(data.reglas_nomenclatura)
let fails = 0
const check = (label, cond, extra = '') => {
  if (!cond) fails++
  if (!cond || process.env.VERBOSE) console.log(`${cond ? '✓' : '✗'} ${label} ${cond ? '' : extra}`)
}

// ── Normalización de nombres ───────────────────────────────────────────────────────────
const same = [
  ['pentan-2-ona', '2-Pentanona'],
  ['pent-2-ino', '2-pentino'],
  ['3-metilpentan-2-ona', '3-metil 2-pentanona'],
  ['Ácido 2-metilpropanoico', 'acido 2-metilpropanoico'],
  ['but-3-en-2-ol', '3-buten-2-ol'],
  ['N-metilpropan-1-amina', 'N-metil-1-propanamina'],
  ['(2E)-pent-2-eno', '2-penteno'],
  ['but-1-eno', '1-buteno'],
  ['2,3-dimetilbutano', '2,3 dimetil butano'],
  ['etanoato de propilo', 'Etanoato de propilo'],
]
for (const [a, b] of same) check(`«${a}» ≡ «${b}»`, nameKey(a) === nameKey(b), `${nameKey(a)} vs ${nameKey(b)}`)
const diff = [
  ['pentan-2-ona', 'pentan-3-ona'],
  ['2-metilbutano', '3-metilbutano'],
  ['but-1-eno', 'but-2-eno'],
  ['2-etil-3-metilpentano', '3-metil-2-etilpentano'],
  ['propan-1-ol', 'propan-2-ol'],
  ['N-metilpropan-1-amina', 'metilpropan-1-amina'],
]
for (const [a, b] of diff) check(`«${a}» ≠ «${b}»`, nameKey(a) !== nameKey(b))

// ── Hojas fijas: la respuesta del curso se acepta con varias grafías ────────────────────
const aceptar = {
  'tema-a': ['butanona', '2-Pentino', 'butan-2-ol', '2-Hexeno', 'etoxipropano', 'ácido 2-metilpropanoico', '4-metil-2-pentino', '3-metil-2-pentanona', 'N-metiletanamina', '1-buteno'],
}
for (const [id, names] of Object.entries(aceptar)) {
  const hoja = HOJAS.find((h) => h.id === id)
  hoja.items.forEach((it, i) => check(`${id} #${i + 1} acepta «${names[i]}»`, checkName(names[i], it.model, namer).ok, JSON.stringify(acceptedNames(it.model, namer))))
}
const metoxi = HOJAS.find((h) => h.id === 'practica-a').items[6].model
check('metoxipropano / 1-metoxipropano / metil propil éter', ['metoxipropano', '1-metoxipropano', 'metil propil éter', 'propil metil éter'].every((x) => checkName(x, metoxi, namer).ok))
check('rechaza 2-metoxipropano para el metoxipropano', !checkName('2-metoxipropano', metoxi, namer).ok)
const acetato = HOJAS.find((h) => h.id === 'practica-a').items[8].model
check('etanoato / acetato de propilo', ['etanoato de propilo', 'acetato de propilo'].every((x) => checkName(x, acetato, namer).ok))
const nm = HOJAS.find((h) => h.id === 'practica-a').items[9].model
check('N-metilpropan-1-amina y metilpropilamina', ['N-metilpropan-1-amina', 'N-metil-1-propanamina', 'metilpropilamina', 'N-metilpropilamina'].every((x) => checkName(x, nm, namer).ok), JSON.stringify(acceptedNames(nm, namer)))

// ── Sesiones de las hojas: puntaje completo con respuestas correctas ───────────────────
for (const hoja of HOJAS) {
  const s = sessionFromSheet(hoja, namer)
  const res = s.ejercicios.map((ex) => gradeExercise(ex, { familia: ex.familia, nombre: ex.nombre, model: ex.model }, namer))
  check(`${hoja.corto}: nota 10 con todo correcto`, notaFinal(res) === 10, String(notaFinal(res)))
  const bad = s.ejercicios.map((ex) => gradeExercise(ex, { familia: null, nombre: 'xxx', model: emptyModel(2) }, namer))
  check(`${hoja.corto}: nota 0 con todo incorrecto`, notaFinal(bad) === 0, String(notaFinal(bad)))
}

// ── Generador: fuzz por familia y dificultad ───────────────────────────────────────────
const N = Number(process.env.N ?? 40)
const stats = {}
const samples = []
for (const fam of PRACTICE_FAMILIES) {
  for (const lvl of ['basico', 'intermedio']) {
    const rng = makeRng(`fuzz-${fam.id}-${lvl}`)
    let produced = 0
    const seen = new Set()
    for (let k = 0; k < N; k++) {
      const m = generateModel(fam.id, rng, lvl, namer)
      if (!m) continue
      produced++
      const g = modelToGraph(m)
      const tag = `${fam.id}/${lvl}`
      check(`${tag}: válido`, validateModel(m).length === 0)
      check(`${tag}: valencias`, g.checkValences().length === 0)
      const r = namer.nameChain(m)
      check(`${tag}: se nombra`, r.ok)
      check(`${tag}: cadena más larga`, chainIsLongest(m))
      const text = modelToSemidevelopedFormula(m)
      check(`${tag}: fórmula «${text}» ida y vuelta`, canonicalHash(parseSemidevelopedFormula(text)) === canonicalHash(g))
      const acc = acceptedNames(m, namer)
      check(`${tag}: nombre propio aceptado (${r.name})`, acc.every((n) => checkName(n, m, namer).ok))
      check(`${tag}: estilo del curso aceptado (${courseStyleName(r)})`, checkName(courseStyleName(r), m, namer).ok)
      // un nombre equivocado (se cambia un locante) no debe aceptarse
      const wrong = r.name.replace(/^\(\d+[EZ]\)-/, '').replace(/(\d)/, (d) => String(Number(d) + 5))
      if (/\d/.test(r.name.replace(/^\(\d+[EZ]\)-/, ''))) check(`${tag}: rechaza «${wrong}»`, !checkName(wrong, m, namer).ok)
      seen.add(r.name)
      if (k < 3) samples.push(`${tag.padEnd(28)} ${text.padEnd(34)} ${r.name}   [${courseStyleName(namer.nameChain(m, { noStereo: true }))}]`)
    }
    stats[`${fam.id}/${lvl}`] = `${produced}/${N} (${seen.size} nombres distintos)`
  }
}
console.log(Object.entries(stats).map(([k, v]) => `${k.padEnd(30)} ${v}`).join('\n'))
console.log('\nMuestras:\n' + samples.join('\n'))

// ── Sesiones aleatorias ────────────────────────────────────────────────────────────────
const sesion = buildSession({ cantidad: 10, tipos: 'mixto', dificultad: 'mixto', seed: 12345 }, namer)
check('sesión de 10 ejercicios', sesion.ejercicios.length === 10)
check('sin repetidos', new Set(sesion.ejercicios.map((e) => e.hash)).size === 10)
check('alterna formula/nombre', sesion.ejercicios.every((e, i) => e.tipo === (i % 2 === 0 ? 'formula' : 'nombre')))
check('reproducible con la misma semilla', JSON.stringify(sesion) === JSON.stringify(buildSession({ cantidad: 10, tipos: 'mixto', dificultad: 'mixto', seed: 12345 }, namer)))
check('otra semilla, otros ejercicios', JSON.stringify(sesion) !== JSON.stringify(buildSession({ cantidad: 10, tipos: 'mixto', dificultad: 'mixto', seed: 54321 }, namer)))
const fams = new Set(sesion.ejercicios.map((e) => e.familia))
check('variedad de familias', fams.size >= 8, [...fams].join(','))
const solo = buildSession({ cantidad: 6, familias: ['eteres'], tipos: 'nombre', dificultad: 'mixto', seed: 7 }, namer)
check('filtro de familia', solo.ejercicios.every((e) => e.familia === 'eteres' && e.tipo === 'nombre'))
const agot = buildSession({ cantidad: 50, familias: ['eteres'], dificultad: 'basico', seed: 1 }, namer)
check('filtros muy estrechos devuelven menos ejercicios sin colgarse', agot.ejercicios.length > 0 && agot.ejercicios.length < 50, String(agot.ejercicios.length))
console.log('\nSesión 12345:')
sesion.ejercicios.forEach((e, i) => console.log(`${i + 1}. [${e.tipo}] ${e.familia.padEnd(20)} ${e.tipo === 'formula' ? e.formula : e.dado}   → ${e.nombre}`))

console.log(fails ? `\n${fails} FALLAS` : '\nPráctica OK')
process.exit(fails ? 1 : 0)
