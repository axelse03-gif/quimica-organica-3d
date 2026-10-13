// Pruebas del constructor ampliado: éteres, ésteres, aminas N-sustituidas, halogenuros y ramas largas.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { createNamer } from '../src/lib/chem/nomenclature.js'
import { emptyModel, modelToGraph, modelToSemidevelopedFormula, validateModel, canAddSub, canSetTerm, resizeModel, sanitize } from '../src/lib/chem/chainModel.js'
import { parseSemidevelopedFormula } from '../src/lib/chem/formulaParser.js'
import { canonicalHash } from '../src/lib/chem/canonical.js'
import { formulaString } from '../src/lib/chem/graph.js'
import { buildMoleculeFromGraph } from '../src/lib/chem/molecule.js'
import { geometryReport } from '../src/lib/chem/embed3d.js'
import { HOJAS } from '../src/data/hojas.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const { nameChain } = createNamer(data.reglas_nomenclatura)

function mk(n, { bonds = {}, at = {} } = {}) {
  const m = emptyModel(n)
  Object.entries(bonds).forEach(([i, o]) => (m.bonds[i] = o))
  Object.entries(at).forEach(([i, v]) => {
    if (v.term) m.carbons[i].term = v.term
    if (v.subs) m.carbons[i].subs = [...v.subs]
  })
  return m
}

let fails = 0
const check = (label, got, want) => {
  const ok = got === want
  if (!ok) fails++
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `  → ${got}  (esperado ${want})`}`)
}

// ── Nombres de los grupos nuevos ────────────────────────────────────────────────────
const cases = [
  ['1-metoxipropano', mk(3, { at: { 2: { subs: ['OCH3'] } } }), '1-metoxipropano'],
  ['etoxietano', mk(2, { at: { 1: { subs: ['OC2H5'] } } }), 'etoxietano'],
  ['2-metoxipropano', mk(3, { at: { 1: { subs: ['OCH3'] } } }), '2-metoxipropano'],
  ['metoximetano', mk(1, { at: { 0: { subs: ['OCH3'] } } }), 'metoximetano'],
  ['etanoato de propilo', mk(2, { at: { 1: { term: 'COOC3H7' } } }), 'etanoato de propilo'],
  ['etanoato de etilo (term izquierda)', mk(2, { at: { 0: { term: 'COOC2H5' } } }), 'etanoato de etilo'],
  ['metanoato de metilo', mk(1, { at: { 0: { term: 'COOCH3' } } }), 'metanoato de metilo'],
  ['2-metilpropanoato de isopropilo', mk(3, { at: { 0: { term: 'COOiC3H7' }, 1: { subs: ['CH3'] } } }), '2-metilpropanoato de isopropilo'],
  ['but-2-enoato de metilo', mk(4, { bonds: { 1: 2 }, at: { 3: { term: 'COOCH3' } } }), '(2E)-but-2-enoato de metilo'],
  ['propan-1-amina', mk(3, { at: { 0: { subs: ['NH2'] } } }), 'propan-1-amina'],
  ['N-metilpropan-1-amina', mk(3, { at: { 2: { subs: ['NHCH3'] } } }), 'N-metilpropan-1-amina'],
  ['N-metiletanamina', mk(2, { at: { 1: { subs: ['NHCH3'] } } }), 'N-metiletanamina'],
  ['N-metilmetanamina', mk(1, { at: { 0: { subs: ['NHCH3'] } } }), 'N-metilmetanamina'],
  ['N,N-dimetilpropan-1-amina', mk(3, { at: { 0: { subs: ['N(CH3)2'] } } }), 'N,N-dimetilpropan-1-amina'],
  ['N-etilpropan-2-amina', mk(3, { at: { 1: { subs: ['NHC2H5'] } } }), 'N-etilpropan-2-amina'],
  ['N,2-dimetilpropan-1-amina', mk(3, { at: { 0: { subs: ['NHCH3'] }, 1: { subs: ['CH3'] } } }), 'N,2-dimetilpropan-1-amina'],
  ['2-(metilamino)etan-1-ol', mk(2, { at: { 0: { subs: ['OH'] }, 1: { subs: ['NHCH3'] } } }), '2-(metilamino)etan-1-ol'],
  ['cloroetano', mk(2, { at: { 0: { subs: ['Cl'] } } }), 'cloroetano'],
  ['1-cloropropano', mk(3, { at: { 0: { subs: ['Cl'] } } }), '1-cloropropano'],
  ['2-bromopropano', mk(3, { at: { 1: { subs: ['Br'] } } }), '2-bromopropano'],
  ['diclorometano', mk(1, { at: { 0: { subs: ['Cl', 'Cl'] } } }), 'diclorometano'],
  ['triclorometano', mk(1, { at: { 0: { subs: ['Cl', 'Cl', 'Cl'] } } }), 'triclorometano'],
  ['1,2-dicloroetano', mk(2, { at: { 0: { subs: ['Cl'] }, 1: { subs: ['Cl'] } } }), '1,2-dicloroetano'],
  ['2-bromo-2-metilpropano', mk(3, { at: { 1: { subs: ['Br', 'CH3'] } } }), '2-bromo-2-metilpropano'],
  ['1-bromo-2-cloroetano (alfabético)', mk(2, { at: { 0: { subs: ['Cl'] }, 1: { subs: ['Br'] } } }), '1-bromo-2-cloroetano'],
  ['3-etilpentano', mk(5, { at: { 2: { subs: ['C2H5'] } } }), '3-etilpentano'],
  ['4-isopropilheptano (chain 7)', mk(7, { at: { 3: { subs: ['iC3H7'] } } }), '4-isopropilheptano'],
  ['3-etil-2-metilhexano', mk(6, { at: { 1: { subs: ['CH3'] }, 2: { subs: ['C2H5'] } } }), '3-etil-2-metilhexano'],
  ['4-propiloctano', mk(8, { at: { 3: { subs: ['C3H7'] } } }), '4-propiloctano'],
  ['but-3-en-2-ol con etoxi', mk(4, { bonds: { 2: 2 }, at: { 1: { subs: ['OH'] }, 3: { subs: ['OC2H5'] } } }), '(3E)-4-etoxibut-3-en-2-ol'],
  ['ácido 4-metoxi-… con ester en otro extremo', mk(4, { at: { 0: { term: 'COOH' }, 3: { term: 'COOCH3' } } }), 'ácido 3-(metoxicarbonil)propanoico'],
  ['4-oxo… éster+aldehído', mk(3, { at: { 0: { term: 'CHO' }, 2: { term: 'COOCH3' } } }), '3-oxopropanoato de metilo'],
]
for (const [label, model, want] of cases) {
  const r = nameChain(model)
  check(label, r.ok ? r.name : `ERR ${r.errors}`, want)
}

// ── Variantes «full» y sin estereoquímica ────────────────────────────────────────────
check('etan-1-ol (full)', nameChain(mk(2, { at: { 0: { subs: ['OH'] } } }), { full: true }).name, 'etan-1-ol')
check('1-cloroetano (full)', nameChain(mk(2, { at: { 0: { subs: ['Cl'] } } }), { full: true }).name, '1-cloroetano')
check('sin descriptor', nameChain(mk(5, { bonds: { 1: 2 } }), { noStereo: true }).name, 'pent-2-eno')

// ── Advertencias de cadena principal ─────────────────────────────────────────────────
const w1 = nameChain(mk(1, { at: { 0: { subs: ['OC3H7'] } } }))
check('advierte alcoxi más largo que la cadena', w1.warnings.length, 1)
check('sin advertencia si la cadena es la larga', nameChain(mk(3, { at: { 2: { subs: ['OCH3'] } } })).warnings.length, 0)

// ── Reglas de construcción ───────────────────────────────────────────────────────────
check('etilo no cabe en C2 de 5', canAddSub(mk(5), 1, 'C2H5'), false)
check('etilo cabe en C3 de 5', canAddSub(mk(5), 2, 'C2H5'), true)
check('propilo no cabe en C3 de 5', canAddSub(mk(5), 2, 'C3H7'), false)
check('propilo cabe en C4 de 7', canAddSub(mk(7), 3, 'C3H7'), true)
check('un solo grupo funcional por carbono', canAddSub(mk(3, { at: { 1: { subs: ['OH'] } } }), 1, 'Cl'), false)
check('dos halógenos en un carbono', canAddSub(mk(3, { at: { 1: { subs: ['Cl'] } } }), 1, 'Br'), true)
check('tercer halógeno en un carbono', canAddSub(mk(3, { at: { 0: { subs: ['Cl', 'Cl'] } } }), 0, 'Cl'), true)
check('un solo éster', canSetTerm(mk(3, { at: { 0: { term: 'COOCH3' } } }), 2, 'COOC2H5'), false)
check('ester + ácido sí', canSetTerm(mk(3, { at: { 0: { term: 'COOCH3' } } }), 2, 'COOH'), true)
check('amina N-sust. excluye NH2', canAddSub(mk(3, { at: { 0: { subs: ['NHCH3'] } } }), 2, 'NH2'), false)
const shrunk = resizeModel(mk(5, { at: { 2: { subs: ['C2H5'] } } }), 4)
check('al achicar la cadena se descarta la rama que no cabe', shrunk.carbons[2].subs.length, 0)
check('sanitize deja el modelo válido', validateModel(sanitize(mk(3, { at: { 1: { subs: ['OH', 'Cl'] } } }))).length, 0)

// ── Fórmulas: ida y vuelta (modelo → texto → parser → huella) para todas las hojas ─────
for (const hoja of HOJAS) {
  hoja.items.forEach((it, i) => {
    const label = `${hoja.corto} #${i + 1}`
    const g1 = modelToGraph(it.model)
    const text = modelToSemidevelopedFormula(it.model)
    const h1 = canonicalHash(g1)
    const h2 = canonicalHash(parseSemidevelopedFormula(text))
    check(`${label} fórmula generada «${text}» reanalizable`, h1 === h2, true)
    if (it.formula) check(`${label} fórmula de la hoja «${it.formula}»`, canonicalHash(parseSemidevelopedFormula(it.formula)) === h1, true)
    const r = nameChain(it.model)
    check(`${label} se puede nombrar`, r.ok, true)
    check(`${label} valencias`, g1.checkValences().length, 0)
  })
}

// ── Nombres esperados de las hojas (primer nombre aceptado) ──────────────────────────
const expected = {
  'tema-a': ['butanona', 'pent-2-ino', 'butan-2-ol', '(2E)-hex-2-eno', '1-etoxipropano', 'ácido 2-metilpropanoico', '4-metilpent-2-ino', '3-metilpentan-2-ona', 'N-metiletanamina', 'but-1-eno'],
  'tema-b': ['pentan-3-ona', 'hex-3-ino', 'pentan-2-ol', '(2E)-pent-2-eno', '2-metoxipropano', 'ácido 3-metilbutanoico', '3-metilpent-2-eno', 'pentan-2-ona', 'metanamina', 'etino'],
  'practica-a': ['2-metilpentano', '3-metilbut-1-eno', '3-metilbutan-1-ol', '4-metilpent-2-ino', '3-metilbutanal', '4-metilpentan-2-ona', '1-metoxipropano', 'ácido 4-metilpentanoico', 'etanoato de propilo', 'N-metilpropan-1-amina'],
  'practica-b': ['2-metilbut-1-eno', '2,3-dimetilbutano', '3-metilpent-1-ino', '2-metilbutan-2-ol', 'hexan-3-ona', '2-metilbutanal', 'ácido 2-metilbutanoico', '2-etoxipropano', 'butan-2-amina', 'butanoato de metilo'],
}
for (const hoja of HOJAS) {
  hoja.items.forEach((it, i) => check(`${hoja.corto} #${i + 1} nombre`, nameChain(it.model).name, expected[hoja.id][i]))
}

// ── Geometría 3D de los grupos nuevos ────────────────────────────────────────────────
const geo = [
  ['éter', mk(3, { at: { 0: { subs: ['OC2H5'] } } })],
  ['éster', mk(3, { at: { 2: { term: 'COOC2H5' } } })],
  ['amina terciaria', mk(3, { at: { 1: { subs: ['N(CH3)2'] } } })],
  ['bromoalcano', mk(4, { at: { 1: { subs: ['Br', 'CH3'] } } })],
  ['etilo + isopropilo', mk(7, { at: { 2: { subs: ['C2H5'] }, 4: { subs: ['iC3H7'] } } })],
]
for (const [label, model] of geo) {
  const t0 = performance.now()
  const mol = buildMoleculeFromGraph(modelToGraph(model), { seed: label })
  const ms = Math.round(performance.now() - t0)
  const rep = geometryReport ? geometryReport(mol.graph, mol.positions) : null
  const worst = rep?.maxBondError ?? 0
  check(`3D ${label}: ${mol.graph.atoms.length} átomos en ${ms} ms, error de enlace ${(worst * 100).toFixed(1)} %`, worst < 0.06 && ms < 800, true)
}

console.log(fails ? `\n${fails} FALLAS` : '\nConstructor ampliado OK')
process.exit(fails ? 1 : 0)
