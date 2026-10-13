// Convierte una fórmula semidesarrollada (p. ej. "CH3-CH(CH3)-CH2-CH3", "CH3-CHOH-COOH")
// en un grafo molecular con hidrógenos explícitos.
import { MolGraph } from './graph.js'

const BOND_SYMBOLS = { '-': 1, '=': 2, '≡': 3 }

// Bases reconocidas, de la más específica a la más general.
const withH = (build) => (g) => {
  const u = build(g)
  g.addH(u.entry, 1)
  return u
}

const BASES = [
  { re: /^HCHO/, build: (g) => carbonyl(g, { h: 2 }) },
  { re: /^HCONH2/, build: withH((g) => acylLike(g, 'N')) },
  { re: /^HCOOH/, build: withH((g) => acylLike(g, 'OH')) },
  { re: /^HCOO(?!H)/, build: withH((g) => acylLike(g, 'O')) },
  { re: /^HCN/, build: withH((g) => nitrile(g)) },
  { re: /^CONH2/, build: (g) => acylLike(g, 'N') },
  { re: /^COOH/, build: (g) => acylLike(g, 'OH') },
  { re: /^COO(?!H)/, build: (g) => acylLike(g, 'O') },
  { re: /^CHO(?!H)/, build: (g) => carbonyl(g, { h: 1 }) },
  { re: /^CN/, build: (g) => nitrile(g) },
  { re: /^CO(?![OHN])/, build: (g) => carbonyl(g, { h: 0 }) },
  { re: /^NH2/, build: (g) => hetero(g, 'N', 2) },
  { re: /^NH(?![0-9A-Za-z])/, build: (g) => hetero(g, 'N', 1) }, // amina secundaria: R-NH-R'
  { re: /^N(?![A-Za-z])/, build: (g) => hetero(g, 'N', 0) }, // amina terciaria: R-N(R')-R''
  { re: /^(?:F|Cl|Br|I)(?![a-z])/, build: (g, sym) => hetero(g, sym, 0) }, // halógeno terminal
  { re: /^OH/, build: (g) => hetero(g, 'O', 1) },
  { re: /^O(?![A-Za-z])/, build: (g) => hetero(g, 'O', 0) },
]

function carbonyl(g, { h }) {
  const c = g.addAtom('C')
  const o = g.addAtom('O')
  g.addBond(c, o, 2)
  g.addH(c, h)
  return { entry: c, exit: c }
}

function acylLike(g, kind) {
  const c = g.addAtom('C')
  const o = g.addAtom('O')
  g.addBond(c, o, 2)
  if (kind === 'N') {
    const n = g.addAtom('N')
    g.addBond(c, n, 1)
    g.addH(n, 2)
    return { entry: c, exit: c }
  }
  const o2 = g.addAtom('O')
  g.addBond(c, o2, 1)
  if (kind === 'OH') {
    g.addH(o2, 1)
    return { entry: c, exit: c }
  }
  return { entry: c, exit: o2 } // éster: la cadena continúa por el oxígeno
}

function nitrile(g) {
  const c = g.addAtom('C')
  const n = g.addAtom('N')
  g.addBond(c, n, 3)
  return { entry: c, exit: c }
}

function hetero(g, element, h) {
  const a = g.addAtom(element)
  g.addH(a, h)
  return { entry: a, exit: a }
}

// `suffix` agrupa los grupos escritos pegados al carbono: "OH", "NH2", "Cl", "Cl2", "ClBr"…
function carbonUnit(g, h, suffix = '') {
  const c = g.addAtom('C')
  g.addH(c, h)
  for (const m of suffix.matchAll(/OH|NH2|(F|Cl|Br|I)(\d*)/g)) {
    if (m[0] === 'OH') {
      const o = g.addAtom('O')
      g.addBond(c, o, 1)
      g.addH(o, 1)
    } else if (m[0] === 'NH2') {
      const n = g.addAtom('N')
      g.addBond(c, n, 1)
      g.addH(n, 2)
    } else {
      const times = m[2] ? Number(m[2]) : 1
      for (let t = 0; t < times; t++) {
        const x = g.addAtom(m[1])
        g.addBond(c, x, 1)
      }
    }
  }
  return { entry: c, exit: c }
}

class Parser {
  constructor(src, graph) {
    this.s = src
    this.i = 0
    this.g = graph
  }

  peek() {
    return this.s[this.i]
  }

  parseChain() {
    const first = this.parseUnit()
    let last = first.exit
    while (this.i < this.s.length && BOND_SYMBOLS[this.peek()] !== undefined) {
      const order = BOND_SYMBOLS[this.s[this.i++]]
      const next = this.parseUnit()
      this.g.addBond(last, next.entry, order)
      last = next.exit
    }
    return { entry: first.entry, exit: last }
  }

  parseUnit() {
    const rest = this.s.slice(this.i)
    let unit = null
    for (const base of BASES) {
      const m = rest.match(base.re)
      if (m) {
        this.i += m[0].length
        unit = base.build(this.g, m[0])
        break
      }
    }
    if (!unit) {
      const m = rest.match(/^C(?:H(\d*))?((?:OH|NH2|(?:F|Cl|Br|I)\d*)*)/)
      if (!m) throw new Error(`No se reconoce "${rest.slice(0, 8)}" en la fórmula "${this.s}"`)
      this.i += m[0].length
      const hasH = m[0].startsWith('CH')
      const h = hasH ? (m[1] === undefined || m[1] === '' ? 1 : Number(m[1])) : 0
      unit = carbonUnit(this.g, h, m[2])
    }
    // Ramificaciones entre paréntesis: "(CH3)" o "(CH3)2"
    while (this.peek() === '(') {
      const start = this.i + 1
      let depth = 0
      let j = this.i
      for (; j < this.s.length; j++) {
        if (this.s[j] === '(') depth++
        else if (this.s[j] === ')') {
          depth--
          if (depth === 0) break
        }
      }
      const inner = this.s.slice(start, j)
      this.i = j + 1
      let times = 1
      const mult = this.s.slice(this.i).match(/^\d+/)
      if (mult) {
        times = Number(mult[0])
        this.i += mult[0].length
      }
      for (let t = 0; t < times; t++) {
        const sub = new Parser(inner, this.g).parseChain()
        this.g.addBond(unit.entry, sub.entry, 1)
      }
    }
    return unit
  }
}

function ringOf(g, n, hPerAtom, order) {
  const idx = []
  for (let k = 0; k < n; k++) {
    const c = g.addAtom('C')
    g.addH(c, hPerAtom)
    idx.push(c)
  }
  for (let k = 0; k < n; k++) g.addBond(idx[k], idx[(k + 1) % n], typeof order === 'function' ? order(k) : order)
}

/**
 * @param {string} formula formula_semidesarrollada del JSON
 * @param {{familyId?: string}} opts
 * @returns {MolGraph}
 */
export function parseSemidevelopedFormula(formula, opts = {}) {
  const src = formula.replace(/\s+/g, '')
  const g = new MolGraph()

  // Anillos saturados escritos como (CH2)n
  const ring = src.match(/^\((CH\d?|C)\)(\d+)$/)
  if (ring) {
    const hm = ring[1].match(/^CH(\d?)$/)
    const h = hm ? (hm[1] === '' ? 1 : Number(hm[1])) : 0
    ringOf(g, Number(ring[2]), h, 1)
    return g.assignHybridization()
  }

  // Benceno (anillo aromático): enlaces de orden 1.5 y un H por carbono
  if (opts.familyId === 'aromaticos' && /^C6H6$/.test(src)) {
    ringOf(g, 6, 1, 1.5)
    return g.assignHybridization()
  }

  // Un único carbono con H: "CH4"
  const parser = new Parser(src, g)
  parser.parseChain()
  if (parser.i !== src.length) throw new Error(`Fórmula no consumida por completo: "${src}" (pos ${parser.i})`)
  return g.assignHybridization()
}
