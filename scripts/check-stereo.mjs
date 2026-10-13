import fs from 'node:fs'
import { buildMolecule } from '../src/lib/chem/molecule.js'
const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const get = (id) => buildMolecule(data.base_compuestos.find((c) => c.id === id))
const sub = (a, b) => a.map((v, i) => v - b[i])
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)
const dihedral = (p, i, j, k, l) => {
  const b1 = sub(p[j], p[i]), b2 = sub(p[k], p[j]), b3 = sub(p[l], p[k])
  const n1 = cross(b1, b2), n2 = cross(b2, b3)
  const m1 = cross(n1, b2.map((v) => v / Math.hypot(...b2)))
  return (Math.atan2(dot(m1, n2), dot(n1, n2)) * 180) / Math.PI
}
// trans-2-penteno: C1-C2=C3-C4
const pen = get('comp_05')
const ids = Object.fromEntries(pen.graph.atoms.map((a) => [a.id, a.idx]))
console.log('trans-2-penteno diedro C1-C2=C3-C4:', dihedral(pen.positions, ids.C1, ids.C2, ids.C3, ids.C4).toFixed(1))
// benceno planaridad: desviación máx. respecto del plano z=0 tras PCA
const bz = get('comp_08')
console.log('benceno max |z|:', Math.max(...bz.positions.map((p) => Math.abs(p[2]))).toFixed(3))
// acetileno linealidad
const ac = get('comp_06')
console.log('etino posiciones:', ac.positions.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' | '))
// carbonilo de acetona: planaridad (diedro C-C(=O)-C con O)
const ace = get('comp_13')
console.log('acetona hibridaciones:', ace.graph.atoms.filter(a=>a.el!=='H').map(a=>a.id+':'+a.hyb).join(' '))
