// Pruebas del nombrador IUPAC y del constructor frente a la base del JSON.
import fs from 'node:fs'
import { createNamer } from '../src/lib/chem/nomenclature.js'
import { emptyModel, modelToGraph, modelToSemidevelopedFormula, validateModel } from '../src/lib/chem/chainModel.js'
import { parseSemidevelopedFormula } from '../src/lib/chem/formulaParser.js'
import { canonicalHash } from '../src/lib/chem/canonical.js'
import { formulaString } from '../src/lib/chem/graph.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const namer = createNamer(data.reglas_nomenclatura)

function mk(n, { bonds = {}, at = {}, stereo = 'E' } = {}) {
  const m = emptyModel(n)
  m.stereo = stereo
  Object.entries(bonds).forEach(([i, o]) => (m.bonds[i] = o))
  Object.entries(at).forEach(([i, v]) => {
    if (v.term) m.carbons[i].term = v.term
    if (v.subs) m.carbons[i].subs = [...v.subs]
  })
  return m
}

const cases = [
  ['metano', mk(1)],
  ['propano', mk(3)],
  ['decano', mk(10)],
  ['2-metilbutano', mk(4, { at: { 1: { subs: ['CH3'] } } })],
  ['2-metilpropano', mk(3, { at: { 1: { subs: ['CH3'] } } })],
  ['2,2-dimetilpropano', mk(3, { at: { 1: { subs: ['CH3', 'CH3'] } } })],
  ['2,4-dimetilpentano', mk(5, { at: { 1: { subs: ['CH3'] }, 3: { subs: ['CH3'] } } })],
  ['eteno', mk(2, { bonds: { 0: 2 } })],
  ['propeno', mk(3, { bonds: { 0: 2 } })],
  ['but-1-eno', mk(4, { bonds: { 0: 2 } })],
  ['(2E)-pent-2-eno', mk(5, { bonds: { 1: 2 } })],
  ['(2Z)-pent-2-eno', mk(5, { bonds: { 1: 2 }, stereo: 'Z' })],
  ['etino', mk(2, { bonds: { 0: 3 } })],
  ['buta-1,3-dieno', mk(4, { bonds: { 0: 2, 2: 2 } })],
  ['hex-1-en-4-ino', mk(6, { bonds: { 0: 2, 3: 3 } })],
  ['metanol', mk(1, { at: { 0: { subs: ['OH'] } } })],
  ['etanol', mk(2, { at: { 0: { subs: ['OH'] } } })],
  ['propan-1-ol', mk(3, { at: { 0: { subs: ['OH'] } } })],
  ['propan-2-ol', mk(3, { at: { 1: { subs: ['OH'] } } })],
  ['butano-1,4-diol', mk(4, { at: { 0: { subs: ['OH'] }, 3: { subs: ['OH'] } } })],
  ['propano-1,2,3-triol', mk(3, { at: { 0: { subs: ['OH'] }, 1: { subs: ['OH'] }, 2: { subs: ['OH'] } } })],
  ['but-3-en-1-ol', mk(4, { bonds: { 2: 2 }, at: { 0: { subs: ['OH'] } } })],
  ['2-metilpropan-1-ol', mk(3, { at: { 0: { subs: ['OH'] }, 1: { subs: ['CH3'] } } })],
  ['propanona', mk(3, { at: { 1: { subs: ['oxo'] } } })],
  ['butanona', mk(4, { at: { 1: { subs: ['oxo'] } } })],
  ['pentan-3-ona', mk(5, { at: { 2: { subs: ['oxo'] } } })],
  ['butano-2,3-diona', mk(4, { at: { 1: { subs: ['oxo'] }, 2: { subs: ['oxo'] } } })],
  ['1-hidroxipentan-3-ona', mk(5, { at: { 0: { subs: ['OH'] }, 2: { subs: ['oxo'] } } })],
  ['metanal', mk(1, { at: { 0: { term: 'CHO' } } })],
  ['propanal', mk(3, { at: { 0: { term: 'CHO' } } })],
  ['butanodial', mk(4, { at: { 0: { term: 'CHO' }, 3: { term: 'CHO' } } })],
  ['4-oxopentanal', mk(5, { at: { 0: { term: 'CHO' }, 3: { subs: ['oxo'] } } })],
  ['ácido metanoico', mk(1, { at: { 0: { term: 'COOH' } } })],
  ['ácido etanoico', mk(2, { at: { 0: { term: 'COOH' } } })],
  ['ácido 2-hidroxipropanoico', mk(3, { at: { 0: { term: 'COOH' }, 1: { subs: ['OH'] } } })],
  ['ácido butanodioico', mk(4, { at: { 0: { term: 'COOH' }, 3: { term: 'COOH' } } })],
  ['ácido but-3-enoico', mk(4, { bonds: { 2: 2 }, at: { 0: { term: 'COOH' } } })],
  ['ácido 4-oxobutanoico', mk(4, { at: { 0: { term: 'COOH' }, 3: { term: 'CHO' } } })],
  ['ácido 3-cianopropanoico', mk(4, { at: { 0: { term: 'COOH' }, 3: { term: 'CN' } } })],
  ['propanamida', mk(3, { at: { 0: { term: 'CONH2' } } })],
  ['etanonitrilo', mk(2, { at: { 1: { term: 'CN' } } })],
  ['propanonitrilo', mk(3, { at: { 2: { term: 'CN' } } })],
  ['etanamina', mk(2, { at: { 0: { subs: ['NH2'] } } })],
  ['propan-1-amina', mk(3, { at: { 0: { subs: ['NH2'] } } })],
  ['3-aminobutan-2-ol', mk(4, { at: { 1: { subs: ['OH'] }, 2: { subs: ['NH2'] } } })],
]

let failures = 0
console.log('— Nombres IUPAC —')
for (const [expected, model] of cases) {
  const errs = validateModel(model)
  const r = errs.length ? { ok: false, errors: errs } : namer.nameChain(model)
  const got = r.ok ? r.name : `ERROR: ${r.errors.join('; ')}`
  const ok = got === expected
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} esperado «${expected}»${ok ? '' : `  obtenido «${got}»`}`)
}

console.log('\n— Ida y vuelta (modelo → fórmula → parser) —')
for (const [expected, model] of cases) {
  const f = modelToSemidevelopedFormula(model)
  try {
    const g1 = modelToGraph(model)
    const g2 = parseSemidevelopedFormula(f)
    const same = canonicalHash(g1) === canonicalHash(g2) && formulaString(g1.composition()) === formulaString(g2.composition())
    if (!same || g1.checkValences().length) {
      failures++
      console.log(`✗ ${expected}: ${f} (valencias: ${g1.checkValences().join(',')})`)
    }
  } catch (e) {
    failures++
    console.log(`✗ ${expected}: ${f} → ${e.message}`)
  }
}
console.log(failures ? '' : '✓ todas las fórmulas generadas se parsean a la misma molécula')

console.log('\n— El constructor reproduce la base del JSON —')
const dbHash = new Map(
  data.base_compuestos.map((c) => [canonicalHash(parseSemidevelopedFormula(c.formula_semidesarrollada, { familyId: c.familia_id })), c]),
)
const expectMatch = {
  '2-metilbutano': 'comp_03',
  '(2E)-pent-2-eno': 'comp_05',
  etino: 'comp_06',
  eteno: 'comp_04',
  etanol: 'comp_09',
  'propan-2-ol': 'comp_10',
  metanal: 'comp_12',
  propanona: 'comp_13',
  'ácido etanoico': 'comp_14',
  'ácido 2-hidroxipropanoico': 'comp_15',
  'propan-1-amina': 'comp_17',
  propanamida: 'comp_18',
  etanonitrilo: 'comp_19',
  metano: 'comp_01',
}
for (const [name, id] of Object.entries(expectMatch)) {
  const model = cases.find(([n]) => n === name)[1]
  const hit = dbHash.get(canonicalHash(modelToGraph(model)))
  const ok = hit?.id === id
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} ${name} → ${hit ? `${hit.id} (${hit.nombre_iupac})` : 'sin coincidencia'}`)
}
// etano (2 carbonos sin grupos) y etoxietano/éster no son construibles (éter/éster no se ofrecen en el constructor)
const etano = dbHash.get(canonicalHash(modelToGraph(mk(2))))
console.log(`${etano?.id === 'comp_02' ? '✓' : '✗'} etano → ${etano?.id}`)
if (etano?.id !== 'comp_02') failures++

console.log(failures ? `\n${failures} fallo(s)` : '\nNomenclatura OK')
process.exit(failures ? 1 : 0)
