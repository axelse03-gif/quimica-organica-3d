// Generador de coordenadas 3D por relajación de restricciones (position-based dynamics).
// Restricciones: longitudes de enlace, ángulos (1-3) según hibridación y anillos,
// zigzag anti en cadenas sp3, planaridad cis/trans en dobles enlaces y repulsión no enlazante.
import { bondLength, idealAngle, el } from './elements.js'

const DEG = Math.PI / 180

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Distancia entre a y d para un diedro dado (grados: 0 = cis, 180 = trans) alrededor del enlace b–c.
function dist14(l1, th1, L, th2, l3, dihedralDeg) {
  const phi = dihedralDeg === true ? Math.PI : dihedralDeg === false ? 0 : dihedralDeg * DEG
  const ax = l1 * Math.cos(th1)
  const ay = l1 * Math.sin(th1)
  const dx = L - l3 * Math.cos(th2)
  const dy = l3 * Math.sin(th2) * Math.cos(phi)
  const dz = l3 * Math.sin(th2) * Math.sin(phi)
  return Math.hypot(ax - dx, ay - dy, dz)
}

function angleOf(graph, rings, a, b, c) {
  const atom = graph.atoms[b]
  const ring = rings.find((r) => r.includes(a) && r.includes(b) && r.includes(c))
  if (ring) return ((ring.length - 2) * 180) / ring.length
  return idealAngle(atom.el, atom.hyb)
}

export function buildConstraints(graph, { stereo = 'trans' } = {}) {
  const { atoms, adj } = graph
  const rings = graph.findRings()
  const ringBond = new Set()
  rings.forEach((r) => r.forEach((v, k) => ringBond.add([v, r[(k + 1) % r.length]].sort().join('-'))))
  const inRingBond = (a, b) => ringBond.has([a, b].sort().join('-'))
  const D = graph.distanceMatrix()
  const cons = []
  const L = (a, b) => bondLength(atoms[a].el, atoms[b].el, graph.bondOrder(a, b), atoms[a].hyb, atoms[b].hyb)

  // 1-2
  for (const b of graph.bonds) cons.push({ i: b.a, j: b.b, d: L(b.a, b.b), w: 1, kind: 'bond' })

  // 1-3
  atoms.forEach((atom, b) => {
    const nb = adj[b]
    for (let p = 0; p < nb.length; p++) {
      for (let q = p + 1; q < nb.length; q++) {
        const a = nb[p].n
        const c = nb[q].n
        const th = angleOf(graph, rings, a, b, c) * DEG
        const l1 = L(a, b)
        const l2 = L(b, c)
        const d = Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * Math.cos(th))
        cons.push({ i: a, j: c, d, w: 0.9, kind: 'angle' })
      }
    }
  })

  // 1-4: diedros
  for (const bond of graph.bonds) {
    const b = bond.a
    const c = bond.b
    if (atoms[b].el === 'H' || atoms[c].el === 'H') continue
    const nbB = adj[b].map((x) => x.n).filter((x) => x !== c)
    const nbC = adj[c].map((x) => x.n).filter((x) => x !== b)
    if (!nbB.length || !nbC.length) continue
    const ring = inRingBond(b, c)

    const addDihedral = (a, d, dihedral, w) => {
      const th1 = angleOf(graph, rings, a, b, c) * DEG
      const th2 = angleOf(graph, rings, b, c, d) * DEG
      cons.push({ i: a, j: d, d: dist14(L(a, b), th1, L(b, c), th2, L(c, d), dihedral), w, kind: 'dihedral' })
    }

    const planar = (w, preferHeavyTrans) => {
      // Orden: sustituyentes pesados primero para controlar cis/trans.
      const sortHeavyFirst = (arr) => [...arr].sort((x, y) => (atoms[x].el === 'H') - (atoms[y].el === 'H'))
      const nB = sortHeavyFirst(nbB)
      let nC = sortHeavyFirst(nbC)
      if (preferHeavyTrans !== undefined && nC.length === 2 && nB.length === 2) {
        // nB[0] es cis a nC[0] y trans a nC[1]. Queremos controlar la relación de los pesados.
        const heavyC = nC.filter((x) => atoms[x].el !== 'H')
        const heavyB = nB.filter((x) => atoms[x].el !== 'H')
        if (heavyB.length === 1 && heavyC.length === 1) {
          nC = preferHeavyTrans === 'trans' ? [nC[1], nC[0]] : [nC[0], nC[1]]
        }
      }
      nB.forEach((a, k) =>
        nC.forEach((d, m) => {
          if (k > 1 || m > 1) return
          addDihedral(a, d, (k + m) % 2 === 1, w)
        }),
      )
    }

    const planarRing = ring && rings.some((r) => r.includes(b) && r.includes(c) && r.every((v) => atoms[v].hyb === 'sp2'))

    if (planarRing) {
      // Anillo totalmente sp2 (p. ej. benceno): todo el sistema es coplanar.
      for (const a of nbB) {
        for (const d of nbC) {
          const trans = inRingBond(a, b) !== inRingBond(c, d)
          addDihedral(a, d, trans, 0.9)
        }
      }
    } else if (bond.order === 2 && atoms[b].hyb === 'sp2' && atoms[c].hyb === 'sp2' && !ring) {
      planar(0.9, stereo)
    } else if (bond.order === 1 && !ring && atoms[b].hyb === 'sp2' && atoms[c].hyb === 'sp2') {
      planar(0.5)
    } else if (bond.order === 1 && !ring && atoms[b].hyb === 'sp3' && atoms[c].hyb === 'sp3') {
      // Conformación escalonada: cada sustituyente queda anti a uno del otro lado y gauche al resto.
      // Con los pesados primero, las cadenas lineales adoptan el zigzag extendido.
      const heavyFirst = (arr) => [...arr].sort((x, y) => (atoms[x].el === 'H') - (atoms[y].el === 'H'))
      const nB = heavyFirst(nbB)
      const nC = heavyFirst(nbC)
      nB.forEach((a, k) =>
        nC.forEach((d, m) => {
          const anti = k === m
          const heavyPair = atoms[a].el !== 'H' && atoms[d].el !== 'H'
          addDihedral(a, d, anti ? 180 : 60, anti && heavyPair ? 0.4 : 0.25)
        }),
      )
    }
  }

  // No enlazantes: evitar solapamientos entre átomos separados por ≥3 enlaces
  const n = atoms.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (D[i][j] >= 3) {
        const dmin = 0.78 * (el(atoms[i].el).vdw + el(atoms[j].el).vdw)
        cons.push({ i, j, d: dmin, w: 0.35, kind: 'repulsion' })
      }
    }
  }
  return cons
}

function randomUnit(rng) {
  const z = rng() * 2 - 1
  const t = rng() * Math.PI * 2
  const r = Math.sqrt(1 - z * z)
  return [r * Math.cos(t), r * Math.sin(t), z]
}

function initialPositions(graph, rng, hints) {
  const n = graph.atoms.length
  const pos = new Float64Array(3 * n)
  const visited = new Array(n).fill(false)
  for (let root = 0; root < n; root++) {
    if (visited[root]) continue
    visited[root] = true
    const queue = [root]
    while (queue.length) {
      const u = queue.shift()
      for (const { n: v, order } of graph.adj[u]) {
        if (visited[v]) continue
        visited[v] = true
        const u3 = randomUnit(rng)
        const len = bondLength(graph.atoms[u].el, graph.atoms[v].el, order, graph.atoms[u].hyb, graph.atoms[v].hyb)
        pos[3 * v] = pos[3 * u] + u3[0] * len
        pos[3 * v + 1] = pos[3 * u + 1] + u3[1] * len
        pos[3 * v + 2] = pos[3 * u + 2] + u3[2] * len
        queue.push(v)
      }
    }
  }
  if (hints) {
    for (const [idx, p] of hints) {
      pos[3 * idx] = p[0]
      pos[3 * idx + 1] = p[1]
      pos[3 * idx + 2] = p[2]
    }
  }
  return pos
}

function solve(pos, cons, iterations, rng) {
  for (let it = 0; it < iterations; it++) {
    const relax = it < iterations * 0.6 ? 0.55 : 0.3
    for (let c = 0; c < cons.length; c++) {
      const { i, j, d, w, kind } = cons[c]
      let dx = pos[3 * j] - pos[3 * i]
      let dy = pos[3 * j + 1] - pos[3 * i + 1]
      let dz = pos[3 * j + 2] - pos[3 * i + 2]
      let dist = Math.hypot(dx, dy, dz)
      if (dist < 1e-9) {
        const u = randomUnit(rng)
        dx = u[0] * 1e-3
        dy = u[1] * 1e-3
        dz = u[2] * 1e-3
        dist = 1e-3
      }
      if (kind === 'repulsion' && dist >= d) continue
      const k = ((dist - d) / dist) * 0.5 * w * relax
      pos[3 * i] += dx * k
      pos[3 * i + 1] += dy * k
      pos[3 * i + 2] += dz * k
      pos[3 * j] -= dx * k
      pos[3 * j + 1] -= dy * k
      pos[3 * j + 2] -= dz * k
    }
  }
}

function energy(pos, cons) {
  let e = 0
  for (const { i, j, d, w, kind } of cons) {
    const dist = Math.hypot(pos[3 * j] - pos[3 * i], pos[3 * j + 1] - pos[3 * i + 1], pos[3 * j + 2] - pos[3 * i + 2])
    if (kind === 'repulsion' && dist >= d) continue
    e += w * (dist - d) * (dist - d) * (kind === 'bond' ? 4 : 1)
  }
  return e
}

// Eigen-descomposición de una matriz simétrica 3×3 (Jacobi).
function eigenSym3(m) {
  const a = m.map((r) => [...r])
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) off += a[p][q] * a[p][q]
    if (off < 1e-14) break
    for (let p = 0; p < 3; p++) {
      for (let q = p + 1; q < 3; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < 3; k++) {
          const akp = a[k][p]
          const akq = a[k][q]
          a[k][p] = c * akp - s * akq
          a[k][q] = s * akp + c * akq
        }
        for (let k = 0; k < 3; k++) {
          const apk = a[p][k]
          const aqk = a[q][k]
          a[p][k] = c * apk - s * aqk
          a[q][k] = s * apk + c * aqk
        }
        for (let k = 0; k < 3; k++) {
          const vkp = v[k][p]
          const vkq = v[k][q]
          v[k][p] = c * vkp - s * vkq
          v[k][q] = s * vkp + c * vkq
        }
      }
    }
  }
  const vals = [a[0][0], a[1][1], a[2][2]]
  const vecs = [0, 1, 2].map((i) => [v[0][i], v[1][i], v[2][i]])
  return { vals, vecs }
}

function centerAndAlign(pos, n, align) {
  let cx = 0
  let cy = 0
  let cz = 0
  for (let i = 0; i < n; i++) {
    cx += pos[3 * i]
    cy += pos[3 * i + 1]
    cz += pos[3 * i + 2]
  }
  cx /= n
  cy /= n
  cz /= n
  for (let i = 0; i < n; i++) {
    pos[3 * i] -= cx
    pos[3 * i + 1] -= cy
    pos[3 * i + 2] -= cz
  }
  if (!align || n < 3) return
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < n; i++) {
    const p = [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]]
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cov[r][c] += p[r] * p[c]
  }
  const { vals, vecs } = eigenSym3(cov)
  const order = [0, 1, 2].sort((x, y) => vals[y] - vals[x])
  const [e1, e2] = [vecs[order[0]], vecs[order[1]]]
  const e3 = [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ] // base derecha
  for (let i = 0; i < n; i++) {
    const x = pos[3 * i]
    const y = pos[3 * i + 1]
    const z = pos[3 * i + 2]
    pos[3 * i] = e1[0] * x + e1[1] * y + e1[2] * z
    pos[3 * i + 1] = e2[0] * x + e2[1] * y + e2[2] * z
    pos[3 * i + 2] = e3[0] * x + e3[1] * y + e3[2] * z
  }
}

/**
 * @param {MolGraph} graph
 * @param {{hints?: Map<number,[number,number,number]>, seed?: string|number, stereo?: 'cis'|'trans', restarts?: number, iterations?: number}} opts
 * @returns {{positions: number[][], error: number, hintsUsed: number}}
 */
export function embed3D(graph, opts = {}) {
  const n = graph.atoms.length
  // Moléculas grandes (constructor con muchas ramas): menos reinicios para mantener la UI fluida.
  const big = n > 45
  const { hints = null, seed = 'mol', stereo = 'trans', restarts = big ? 3 : 6, iterations = big ? 900 : 1200 } = opts
  // Si el JSON especifica TODOS los átomos, esas coordenadas son la geometría final.
  if (hints && hints.size === n) {
    const positions = Array.from({ length: n }, (_, i) => [...hints.get(i)])
    return { positions, error: 0, hintsUsed: n }
  }
  const cons = buildConstraints(graph, { stereo })
  const seedNum = typeof seed === 'number' ? seed : hashString(String(seed))
  let best = null
  for (let r = 0; r < restarts; r++) {
    const rng = mulberry32(seedNum + r * 7919)
    const pos = initialPositions(graph, rng, hints)
    solve(pos, cons, iterations, rng)
    const e = energy(pos, cons)
    if (!best || e < best.e) best = { e, pos }
    if (e < 1e-6) break
  }
  centerAndAlign(best.pos, n, true)
  const positions = []
  for (let i = 0; i < n; i++) positions.push([best.pos[3 * i], best.pos[3 * i + 1], best.pos[3 * i + 2]])
  return { positions, error: best.e, hintsUsed: hints ? hints.size : 0 }
}

// Estadísticas de calidad (para pruebas)
export function geometryReport(graph, positions) {
  const d = (a, b) => Math.hypot(...positions[a].map((v, k) => v - positions[b][k]))
  let maxBond = 0
  for (const b of graph.bonds) {
    const target = bondLength(
      graph.atoms[b.a].el,
      graph.atoms[b.b].el,
      b.order,
      graph.atoms[b.a].hyb,
      graph.atoms[b.b].hyb,
    )
    maxBond = Math.max(maxBond, Math.abs(d(b.a, b.b) - target) / target)
  }
  let minNonBonded = Infinity
  const D = graph.distanceMatrix()
  for (let i = 0; i < graph.atoms.length; i++)
    for (let j = i + 1; j < graph.atoms.length; j++) if (D[i][j] >= 3) minNonBonded = Math.min(minNonBonded, d(i, j))
  const angleDev = []
  graph.atoms.forEach((atom, b) => {
    const nb = graph.adj[b]
    for (let p = 0; p < nb.length; p++)
      for (let q = p + 1; q < nb.length; q++) {
        const v1 = positions[nb[p].n].map((x, k) => x - positions[b][k])
        const v2 = positions[nb[q].n].map((x, k) => x - positions[b][k])
        const dot = v1.reduce((s, x, k) => s + x * v2[k], 0)
        const cos = dot / (Math.hypot(...v1) * Math.hypot(...v2))
        angleDev.push({
          atom: atom.id,
          hyb: atom.hyb,
          angle: (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI,
        })
      }
  })
  return { maxBondRelErr: maxBond, minNonBonded, angles: angleDev }
}
