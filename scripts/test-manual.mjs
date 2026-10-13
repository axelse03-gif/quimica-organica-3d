// Verifica que cada ejemplo del manual tenga el nombre que declara y que sea construible.
import fs from 'node:fs'
import { createNamer } from '../src/lib/chem/nomenclature.js'
import { validateModel } from '../src/lib/chem/chainModel.js'
import { nameKey } from '../src/lib/chem/answers.js'
import { allManualExamples, buildSections, FAMILIAS_MANUAL } from '../src/data/manual.js'
import { PRACTICE_FAMILIES } from '../src/lib/practice.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const namer = createNamer(data.reglas_nomenclatura)
let bad = 0
const check = (c, msg) => { if (!c) { bad++; console.log('✗', msg) } }

const exs = allManualExamples()
for (const e of exs) {
  const errs = validateModel(e.model)
  check(!errs.length, `${e.nombre}: modelo inválido ${errs}`)
  const r = namer.nameChain(e.model)
  check(r.ok, `${e.nombre}: no se pudo nombrar`)
  if (!r.ok) continue
  const got = [r.name, namer.nameChain(e.model, { noStereo: true }).name]
  check(got.some((g) => nameKey(g, { ignoreStereo: true }) === nameKey(e.nombre, { ignoreStereo: true })), `${e.where}: declarado «${e.nombre}» ≠ generado «${r.name}»`)
}
// todas las familias de la práctica tienen sección
for (const f of PRACTICE_FAMILIES) check(FAMILIAS_MANUAL.some((m) => m.familia === f.id), `falta sección del manual: ${f.id}`)
const ids = buildSections().map((s) => s.id)
check(new Set(ids).size === ids.length, 'ids de sección repetidos')
console.log(`Manual: ${exs.length} ejemplos, ${ids.length} secciones`)
if (bad) { console.log(`${bad} problemas`); process.exit(1) }
console.log('Manual OK')
