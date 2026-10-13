// Construye una molécula 3D lista para renderizar a partir de un compuesto del JSON.
import { parseSemidevelopedFormula } from './formulaParser.js'
import { embed3D } from './embed3d.js'
import { formulaString } from './graph.js'

const cache = new Map()

function stereoFromName(name = '') {
  const n = name.toLowerCase()
  if (/\bcis[-\s]|\(z\)|-cis\b/.test(n)) return 'cis'
  return 'trans' // por defecto: zigzag extendido (E)
}

/** Molécula 3D a partir de un grafo arbitrario (lo usa el constructor). */
export function buildMoleculeFromGraph(graph, { seed = 'builder', stereo = 'trans' } = {}) {
  const { positions, error } = embed3D(graph, { seed, stereo })
  return {
    graph,
    positions,
    hints: { provided: 0, matched: 0 },
    formula: formulaString(graph.composition()),
    hybridizations: [...new Set(graph.atoms.filter((a) => a.hyb).map((a) => a.hyb))],
    warnings: graph.checkValences(),
    error,
  }
}

/**
 * @param {object} compound entrada de base_compuestos
 * @returns {{graph, positions, hints:{provided:number, matched:number}, formula:string, hybridizations:string[], warnings:string[]}}
 */
export function buildMolecule(compound) {
  if (cache.has(compound.id)) return cache.get(compound.id)

  const graph = parseSemidevelopedFormula(compound.formula_semidesarrollada, { familyId: compound.familia_id })
  const warnings = graph.checkValences()

  // Hints del JSON: se asocian por id de átomo (C1, C2, H1…)
  const idToIdx = new Map(graph.atoms.map((a) => [a.id, a.idx]))
  const hints = new Map()
  for (const node of compound.nodos_3d ?? []) {
    const idx = idToIdx.get(node.id)
    if (idx !== undefined && graph.atoms[idx].el === node.elemento && Array.isArray(node.pos_3d_hint)) {
      hints.set(idx, node.pos_3d_hint)
    }
  }

  const { positions, error } = embed3D(graph, {
    hints,
    seed: compound.id,
    stereo: stereoFromName(compound.nombre_iupac),
  })

  const formula = formulaString(graph.composition())
  if (compound.formula_molecular && formula !== compound.formula_molecular) {
    warnings.push(`Fórmula calculada ${formula} ≠ JSON ${compound.formula_molecular}`)
  }
  const hybridizations = [...new Set(graph.atoms.filter((a) => a.hyb).map((a) => a.hyb))]
  const result = {
    graph,
    positions,
    hints: { provided: compound.nodos_3d?.length ?? 0, matched: hints.size },
    formula,
    hybridizations,
    warnings,
    error,
  }
  cache.set(compound.id, result)
  return result
}
