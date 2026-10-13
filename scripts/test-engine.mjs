// Pruebas del motor químico contra quimica_organica_3d.json (Node, sin navegador).
import fs from 'node:fs'
import { buildMolecule } from '../src/lib/chem/molecule.js'
import { geometryReport } from '../src/lib/chem/embed3d.js'

const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
let failures = 0
const fail = (msg) => {
  failures++
  console.log('  ✗', msg)
}

for (const comp of data.base_compuestos) {
  const t0 = performance.now()
  let mol
  try {
    mol = buildMolecule(comp)
  } catch (e) {
    console.log(`${comp.id} ${comp.nombre_iupac}`)
    fail(`parser: ${e.message}`)
    continue
  }
  const dt = (performance.now() - t0).toFixed(0)
  const rep = geometryReport(mol.graph, mol.positions)
  const nC = mol.graph.atoms.filter((a) => a.el === 'C').length
  console.log(
    `${comp.id} ${comp.nombre_iupac.padEnd(26)} ${mol.formula.padEnd(8)} átomos=${String(mol.graph.atoms.length).padStart(2)} ` +
      `hints=${mol.hints.matched}/${mol.hints.provided} enlace±${(rep.maxBondRelErr * 100).toFixed(1)}% minNB=${rep.minNonBonded.toFixed(2)} ${dt}ms`,
  )
  if (mol.warnings.length) mol.warnings.forEach((w) => fail(w))
  if (nC !== comp.num_carbonos) fail(`num_carbonos ${nC} ≠ ${comp.num_carbonos}`)
  if (rep.maxBondRelErr > 0.06) fail(`longitud de enlace desviada ${(rep.maxBondRelErr * 100).toFixed(1)}%`)
  if (rep.minNonBonded < 1.5) fail(`átomos solapados (min ${rep.minNonBonded.toFixed(2)} Å)`)
  // ángulos
  for (const a of rep.angles) {
    const target = a.hyb === 'sp' ? 180 : a.hyb === 'sp2' ? 120 : 109.5
    const tol = comp.familia_id === 'cicloalcanos' ? 30 : 14
    if (Math.abs(a.angle - target) > tol) {
      fail(`ángulo en ${a.atom} (${a.hyb}) = ${a.angle.toFixed(1)}°`)
      break
    }
  }
}

console.log(failures ? `\n${failures} problema(s)` : '\nMotor OK: todas las moléculas válidas')
process.exit(failures ? 1 : 0)
