// Huella canónica de un grafo molecular (refinamiento de colores de Weisfeiler-Lehman).
// Para estructuras acíclicas y anillos simples identifica moléculas idénticas.
import { hashString } from './embed3d.js'

export function canonicalHash(graph, rounds = 8) {
  const heavy = graph.atoms.filter((a) => a.el !== 'H').map((a) => a.idx)
  const isHeavy = new Set(heavy)
  let labels = new Map(
    heavy.map((i) => {
      const hcount = graph.adj[i].filter((x) => graph.atoms[x.n].el === 'H').length
      return [i, String(hashString(`${graph.atoms[i].el}${hcount}`))]
    }),
  )
  for (let r = 0; r < rounds; r++) {
    const next = new Map()
    for (const i of heavy) {
      const neigh = graph.adj[i]
        .filter((x) => isHeavy.has(x.n))
        .map((x) => `${x.order}:${labels.get(x.n)}`)
        .sort()
        .join(',')
      next.set(i, String(hashString(`${labels.get(i)}|${neigh}`)))
    }
    labels = next
  }
  return [...labels.values()].sort().join('.')
}
