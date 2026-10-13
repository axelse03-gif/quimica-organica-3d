// Grafo molecular mínimo: átomos explícitos (incluye H) y enlaces con orden.
export class MolGraph {
  constructor() {
    this.atoms = [] // { id, el, hyb, idx }
    this.bonds = [] // { a, b, order }
    this.counters = {}
    this.adj = []
  }

  addAtom(element) {
    const n = (this.counters[element] = (this.counters[element] ?? 0) + 1)
    const idx = this.atoms.length
    this.atoms.push({ id: `${element}${n}`, el: element, hyb: null, idx })
    this.adj.push([])
    return idx
  }

  addBond(a, b, order = 1) {
    this.bonds.push({ a, b, order })
    this.adj[a].push({ n: b, order })
    this.adj[b].push({ n: a, order })
  }

  addH(idx, count = 1) {
    for (let i = 0; i < count; i++) {
      const h = this.addAtom('H')
      this.addBond(idx, h, 1)
    }
  }

  neighbors(i) {
    return this.adj[i].map((x) => x.n)
  }

  bondOrder(a, b) {
    return this.adj[a].find((x) => x.n === b)?.order ?? 0
  }

  heavyNeighbors(i) {
    return this.adj[i].filter((x) => this.atoms[x.n].el !== 'H').map((x) => x.n)
  }

  valenceSum(i) {
    return this.adj[i].reduce((s, x) => s + x.order, 0)
  }

  // Asigna hibridación a partir de los órdenes de enlace.
  assignHybridization() {
    const { atoms, adj } = this
    atoms.forEach((a, i) => {
      if (a.el === 'H') {
        a.hyb = null
        return
      }
      const orders = adj[i].map((x) => x.order)
      if (orders.includes(3)) a.hyb = 'sp'
      else if (orders.includes(2) || orders.includes(1.5)) a.hyb = 'sp2'
      else a.hyb = 'sp3'
      // Cumulenos (C=C=C) → sp
      if (orders.filter((o) => o === 2).length >= 2) a.hyb = 'sp'
    })
    // Resonancia: N de amida y O de ácido/éster unidos a un carbono carbonílico son planos (sp2).
    atoms.forEach((a, i) => {
      if (a.el !== 'N' && a.el !== 'O') return
      if (a.hyb !== 'sp3') return
      const hasCarbonylNeighbor = adj[i].some(
        (x) => atoms[x.n].el === 'C' && adj[x.n].some((y) => y.order === 2 && atoms[y.n].el === 'O'),
      )
      if (hasCarbonylNeighbor) a.hyb = 'sp2'
    })
    return this
  }

  // Anillos (ciclo más corto que pasa por cada enlace). Devuelve arreglos de índices de átomo.
  findRings() {
    const rings = []
    const seen = new Set()
    for (const bond of this.bonds) {
      const path = this.shortestPathAvoiding(bond.a, bond.b, bond)
      if (!path) continue
      const key = [...path].sort((x, y) => x - y).join(',')
      if (seen.has(key)) continue
      seen.add(key)
      rings.push(path)
    }
    return rings
  }

  shortestPathAvoiding(start, goal, skipBond) {
    const prev = new Map([[start, -1]])
    const queue = [start]
    while (queue.length) {
      const u = queue.shift()
      for (const { n } of this.adj[u]) {
        const isSkipped = (u === skipBond.a && n === skipBond.b) || (u === skipBond.b && n === skipBond.a)
        if (isSkipped || prev.has(n)) continue
        prev.set(n, u)
        if (n === goal) {
          const path = []
          let cur = goal
          while (cur !== -1) {
            path.push(cur)
            cur = prev.get(cur)
          }
          return path.reverse()
        }
        queue.push(n)
      }
    }
    return null
  }

  // Distancia (en enlaces) entre todos los pares: matriz n×n.
  distanceMatrix() {
    const n = this.atoms.length
    const D = Array.from({ length: n }, () => new Array(n).fill(Infinity))
    for (let s = 0; s < n; s++) {
      D[s][s] = 0
      const queue = [s]
      while (queue.length) {
        const u = queue.shift()
        for (const { n: v } of this.adj[u]) {
          if (D[s][v] === Infinity) {
            D[s][v] = D[s][u] + 1
            queue.push(v)
          }
        }
      }
    }
    return D
  }

  // Fórmula molecular: { C: 2, H: 6, O: 1 }
  composition() {
    const comp = {}
    for (const a of this.atoms) comp[a.el] = (comp[a.el] ?? 0) + 1
    return comp
  }

  // Comprueba valencias; devuelve lista de advertencias.
  checkValences() {
    const warnings = []
    const expected = { C: 4, H: 1, O: 2, N: 3, F: 1, Cl: 1, Br: 1, I: 1 }
    this.atoms.forEach((a, i) => {
      const v = this.valenceSum(i)
      const e = expected[a.el]
      if (e !== undefined && Math.abs(v - e) > 1e-9) warnings.push(`${a.id}: valencia ${v}, esperada ${e}`)
    })
    return warnings
  }
}

// Fórmula molecular en notación Hill (C, H, luego alfabético) como string, p. ej. "C2H6O".
export function formulaString(comp) {
  const order = ['C', 'H', ...Object.keys(comp).filter((k) => k !== 'C' && k !== 'H').sort()]
  return order
    .filter((k) => comp[k])
    .map((k) => k + (comp[k] > 1 ? comp[k] : ''))
    .join('')
}
