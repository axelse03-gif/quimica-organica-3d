// Práctica de parcial: generador aleatorio de ejercicios de nomenclatura, hojas fijas y corrección.
// Es puro (sin React ni JSON): el nombrador se inyecta, así se puede probar desde Node.
import {
  ALKYLS,
  TERMINALS,
  SUBSTITUENTS,
  canAddSub,
  cloneModel,
  emptyModel,
  kindOf,
  modelToGraph,
  modelToSemidevelopedFormula,
  totalCarbons,
  validateModel,
} from './chem/chainModel.js'
import { acceptedNames, capitalize, checkName, classifyModel, courseStyleName } from './chem/answers.js'
import { canonicalHash } from './chem/canonical.js'
import { formulaString } from './chem/graph.js'
import { hashString } from './chem/embed3d.js'

// ── Familias que se pueden generar ───────────────────────────────────────────────────
export const PRACTICE_FAMILIES = [
  { id: 'alcanos', label: 'Alcanos ramificados', short: 'Alcano', group: '-ano', ejemplo: 'CH3-CH(CH3)-CH3' },
  { id: 'alquenos', label: 'Alquenos', short: 'Alqueno', group: 'C=C', ejemplo: 'CH2=CH-CH3' },
  { id: 'alquinos', label: 'Alquinos', short: 'Alquino', group: 'C≡C', ejemplo: 'CH≡C-CH3' },
  { id: 'halogenuros', label: 'Halogenuros de alquilo', short: 'Halogenuro', group: '-X', ejemplo: 'CH3-CH2-Cl' },
  { id: 'alcoholes', label: 'Alcoholes', short: 'Alcohol', group: '-OH', ejemplo: 'CH3-CH2-OH' },
  { id: 'eteres', label: 'Éteres', short: 'Éter', group: 'R-O-R', ejemplo: 'CH3-O-CH3' },
  { id: 'aldehidos', label: 'Aldehídos', short: 'Aldehído', group: '-CHO', ejemplo: 'CH3-CHO' },
  { id: 'cetonas', label: 'Cetonas', short: 'Cetona', group: '-CO-', ejemplo: 'CH3-CO-CH3' },
  { id: 'acidos_carboxilicos', label: 'Ácidos carboxílicos', short: 'Ácido', group: '-COOH', ejemplo: 'CH3-COOH' },
  { id: 'esteres', label: 'Ésteres', short: 'Éster', group: '-COO-R', ejemplo: 'CH3-COO-CH3' },
  { id: 'aminas', label: 'Aminas', short: 'Amina', group: '-NH2 / -NHR', ejemplo: 'CH3-CH2-NH2' },
  { id: 'amidas', label: 'Amidas', short: 'Amida', group: '-CONH2', ejemplo: 'CH3-CONH2' },
  { id: 'nitrilos', label: 'Nitrilos', short: 'Nitrilo', group: '-C≡N', ejemplo: 'CH3-CN' },
]
export const FAMILY_LABEL = Object.fromEntries(PRACTICE_FAMILIES.map((f) => [f.id, f.label]))
export const FAMILY_SHORT = Object.fromEntries(PRACTICE_FAMILIES.map((f) => [f.id, f.short]))

// ── Aleatoriedad con semilla ─────────────────────────────────────────────────────────
export function makeRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed))
  const next = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1))
  const pick = (arr) => arr[Math.floor(next() * arr.length)]
  const chance = (p) => next() < p
  const shuffle = (arr) => {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  return { next, int, pick, chance, shuffle }
}

// ── ¿La cadena del modelo es la más larga? (esqueleto de carbonos con ramas alquilo) ────
export function chainIsLongest(model) {
  // nodos: carbonos de la cadena + carbonos de las ramas alquilo (los alcoxi/N-alquilo/éster no cuentan)
  const adj = []
  const addNode = () => (adj.push([]), adj.length - 1)
  const link = (a, b) => (adj[a].push(b), adj[b].push(a))
  const chain = model.carbons.map(() => addNode())
  for (let i = 0; i < model.n - 1; i++) link(chain[i], chain[i + 1])
  const required = new Set()
  model.carbons.forEach((c, i) => {
    if (c.term) required.add(chain[i])
    c.subs.forEach((s) => {
      const k = kindOf(s)
      if (['oh', 'oxo', 'amine', 'amineN'].includes(k)) required.add(chain[i])
      if (k === 'alkyl') {
        const root = addNode()
        link(chain[i], root)
        const extra = { CH3: 0, C2H5: 1, C3H7: 2, iC3H7: 1 }[s]
        let prev = root
        for (let t = 0; t < (s === 'iC3H7' ? 1 : extra); t++) {
          const nx = addNode()
          link(prev, nx)
          prev = nx
        }
        if (s === 'iC3H7') link(root, addNode())
      }
    })
  })
  model.bonds.forEach((o, i) => {
    if (o > 1) {
      required.add(chain[i])
      required.add(chain[i + 1])
    }
  })
  const leaves = adj.map((x, i) => (x.length <= 1 ? i : -1)).filter((i) => i >= 0)
  let best = 0
  for (const s of leaves) {
    const stack = [[s, -1, [s]]]
    while (stack.length) {
      const [u, p, path] = stack.pop()
      if (adj[u].length <= 1 && path.length > 1) {
        if ([...required].every((r) => path.includes(r))) best = Math.max(best, path.length)
      }
      for (const v of adj[u]) if (v !== p) stack.push([v, u, [...path, v]])
    }
  }
  if (adj.length === 1) best = 1
  return best <= model.n
}

// ── Generadores por familia ──────────────────────────────────────────────────────────
function blank(n) {
  return emptyModel(n)
}
const interior = (n) => Array.from({ length: Math.max(0, n - 2) }, (_, i) => i + 1)

function addMethyls(r, m, count) {
  for (let k = 0; k < count; k++) {
    const options = interior(m.n).filter((i) => canAddSub(m, i, 'CH3'))
    if (!options.length) return
    m.carbons[r.pick(options)].subs.push('CH3')
  }
}

const GENERATORS = {
  alcanos(r, lvl) {
    const n = lvl === 'basico' ? r.int(4, 6) : r.int(5, 6)
    const m = blank(n)
    addMethyls(r, m, lvl === 'basico' ? 1 : r.int(1, 2))
    return m
  },
  alquenos(r, lvl) {
    const n = lvl === 'basico' ? r.int(3, 5) : r.int(4, 6)
    const m = blank(n)
    m.bonds[r.int(0, n - 2)] = 2
    if (lvl === 'intermedio' ? r.chance(0.75) : r.chance(0.25)) addMethyls(r, m, 1)
    return m
  },
  alquinos(r, lvl) {
    const n = lvl === 'basico' ? r.int(3, 5) : r.int(4, 6)
    const m = blank(n)
    m.bonds[r.int(0, n - 2)] = 3
    if (lvl === 'intermedio' ? r.chance(0.75) : r.chance(0.25)) addMethyls(r, m, 1)
    return m
  },
  halogenuros(r, lvl) {
    const n = r.int(2, lvl === 'basico' ? 4 : 5)
    const m = blank(n)
    const halos = lvl === 'basico' ? ['Cl', 'Br'] : ['F', 'Cl', 'Br', 'I']
    const i = r.int(0, n - 1)
    m.carbons[i].subs.push(r.pick(halos))
    if (lvl === 'intermedio') {
      if (r.chance(0.4)) {
        const j = r.pick(Array.from({ length: n }, (_, k) => k).filter((k) => k !== i))
        m.carbons[j].subs.push(r.pick(halos))
      } else if (r.chance(0.6)) addMethyls(r, m, 1)
    }
    return m
  },
  alcoholes(r, lvl) {
    const n = lvl === 'basico' ? r.int(3, 5) : r.int(4, 6)
    const m = blank(n)
    m.carbons[r.int(0, n - 1)].subs.push('OH')
    if (lvl === 'intermedio' ? r.chance(0.7) : r.chance(0.25)) addMethyls(r, m, lvl === 'intermedio' && r.chance(0.25) ? 2 : 1)
    return m
  },
  eteres(r, lvl) {
    const n = lvl === 'basico' ? r.int(2, 3) : r.int(2, 4)
    const m = blank(n)
    // el grupo alcoxi es más corto que la cadena: así la cadena principal es la más larga
    const pool = ['CH3', 'C2H5', 'C3H7', 'iC3H7'].filter((k) => ALKYLS[k].carbons < n)
    let R = r.pick(lvl === 'basico' ? pool.filter((k) => k === 'CH3' || k === 'C2H5') : pool)
    let idx = lvl === 'basico' ? r.pick([0, n - 1]) : r.int(0, n - 1)
    // éteres simétricos (etoxietano, propoxipropano): alcoxi igual a la cadena y unido por el extremo
    if (n <= 3 && r.chance(0.2)) {
      R = ['CH3', 'C2H5', 'C3H7'][n - 1]
      idx = n - 1
    }
    m.carbons[idx].subs.push(`O${R}`)
    return m
  },
  aldehidos(r, lvl) {
    const n = lvl === 'basico' ? r.int(3, 5) : r.int(4, 6)
    const m = blank(n)
    m.carbons[r.pick([0, n - 1])].term = 'CHO'
    if (lvl === 'intermedio' ? r.chance(0.8) : r.chance(0.3)) addMethyls(r, m, 1)
    return m
  },
  cetonas(r, lvl) {
    const n = lvl === 'basico' ? r.int(4, 5) : r.int(5, 6)
    const m = blank(n)
    m.carbons[r.pick(interior(n))].subs.push('oxo')
    if (lvl === 'intermedio' ? r.chance(0.8) : r.chance(0.3)) addMethyls(r, m, 1)
    return m
  },
  acidos_carboxilicos(r, lvl) {
    const n = lvl === 'basico' ? r.int(2, 5) : r.int(3, 6)
    const m = blank(n)
    m.carbons[r.pick([0, n - 1])].term = 'COOH'
    if (n >= 3 && (lvl === 'intermedio' ? r.chance(0.8) : r.chance(0.3))) addMethyls(r, m, 1)
    return m
  },
  esteres(r, lvl) {
    const n = lvl === 'basico' ? r.int(1, 3) : r.int(1, 4)
    const m = blank(n)
    const pool = lvl === 'basico' ? ['CH3', 'C2H5'] : ['CH3', 'C2H5', 'C3H7', 'iC3H7']
    m.carbons[r.pick(n === 1 ? [0] : [0, n - 1])].term = `COO${r.pick(pool)}`
    if (n >= 3 && lvl === 'intermedio' && r.chance(0.5)) addMethyls(r, m, 1)
    return m
  },
  aminas(r, lvl) {
    const m0 = r.next()
    if (lvl === 'basico' ? m0 < 0.6 : m0 < 0.4) {
      const n = lvl === 'basico' ? r.int(3, 4) : r.int(3, 5)
      const m = blank(n)
      m.carbons[r.int(0, n - 1)].subs.push('NH2')
      if (lvl === 'intermedio' && r.chance(0.5)) addMethyls(r, m, 1)
      return m
    }
    if (lvl === 'intermedio' && m0 > 0.85) {
      const n = r.int(3, 4)
      const m = blank(n)
      m.carbons[r.int(0, n - 1)].subs.push('N(CH3)2')
      return m
    }
    const n = lvl === 'basico' ? r.int(2, 3) : r.int(2, 4)
    const m = blank(n)
    const R = n >= 3 && lvl === 'intermedio' ? r.pick(['CH3', 'C2H5']) : 'CH3'
    m.carbons[lvl === 'basico' ? r.pick([0, n - 1]) : r.int(0, n - 1)].subs.push(`NH${R}`)
    return m
  },
  amidas(r, lvl) {
    const n = lvl === 'basico' ? r.int(2, 4) : r.int(3, 5)
    const m = blank(n)
    m.carbons[r.pick([0, n - 1])].term = 'CONH2'
    if (n >= 3 && lvl === 'intermedio' && r.chance(0.6)) addMethyls(r, m, 1)
    return m
  },
  nitrilos(r, lvl) {
    const n = lvl === 'basico' ? r.int(2, 4) : r.int(3, 5)
    const m = blank(n)
    m.carbons[r.pick([0, n - 1])].term = 'CN'
    if (n >= 3 && lvl === 'intermedio' && r.chance(0.6)) addMethyls(r, m, 1)
    return m
  },
}

// ── Ejercicios ───────────────────────────────────────────────────────────────────────
/**
 * Arma un ejercicio a partir de un modelo.
 * @param {object} model modelo de cadena (la respuesta)
 * @param {'formula'|'nombre'} tipo formula: dar la fórmula y pedir el nombre · nombre: dar el nombre y pedir construir
 * @param {object} namer salida de createNamer
 * @param {{estilo?: 'curso'|'iupac', formula?: string, nombre?: string, rng?: object}} [ctx]
 */
export function makeExercise(model, tipo, namer, ctx = {}) {
  const r = namer.nameChain(model)
  const plain = namer.nameChain(model, { noStereo: true })
  const graph = modelToGraph(model)
  const estilo = ctx.estilo ?? 'curso'
  const dado = tipo === 'nombre' ? ctx.nombre ?? capitalize(estilo === 'curso' ? courseStyleName(plain) : plain.name) : null
  return {
    tipo,
    model: cloneModel(model),
    familia: classifyModel(model, namer),
    formula: ctx.formula ?? modelToSemidevelopedFormula(model),
    dado,
    nombre: r.name,
    aceptados: acceptedNames(model, namer),
    molecular: formulaString(graph.composition()),
    hash: canonicalHash(graph),
    principal: r.principalLabel,
    prioridad: r.principalPriority,
    traza: r.trace,
    advertencias: r.warnings,
  }
}

const ok = (m, namer) => {
  if (validateModel(m).length) return false
  const r = namer.nameChain(m)
  if (!r.ok) return false
  if (totalCarbons(m) > 9) return false
  return chainIsLongest(m)
}

/** Genera un modelo válido de la familia pedida (reintenta hasta lograrlo). */
export function generateModel(familia, rng, lvl, namer, avoid = new Set()) {
  const gen = GENERATORS[familia]
  for (let tries = 0; tries < 80; tries++) {
    const m = gen(rng, lvl)
    if (!ok(m, namer)) continue
    if (classifyModel(m, namer) !== familia) continue
    if (avoid.has(canonicalHash(modelToGraph(m)))) continue
    return m
  }
  return null
}

/**
 * Sesión de práctica aleatoria.
 * @param {object} opts { familias: string[], cantidad, tipos: 'mixto'|'formula'|'nombre', dificultad: 'basico'|'intermedio'|'mixto', estilo, seed }
 */
export function buildSession(opts, namer) {
  const familias = opts.familias?.length ? opts.familias : PRACTICE_FAMILIES.map((f) => f.id)
  const cantidad = opts.cantidad ?? 10
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9)
  const rng = makeRng(seed)
  const seen = new Set()
  const exercises = []
  // reparte las familias en rondas para que aparezca variedad (como en un parcial)
  let pool = []
  const agotada = {}
  let guard = 0
  while (exercises.length < cantidad && guard++ < cantidad * 200) {
    if (!pool.length) {
      pool = rng.shuffle(familias.filter((f) => (agotada[f] ?? 0) < 6))
      if (!pool.length) break // con estos filtros no hay más ejercicios distintos
    }
    const fam = pool.pop()
    const lvl = opts.dificultad === 'mixto' || !opts.dificultad ? (rng.chance(0.5) ? 'basico' : 'intermedio') : opts.dificultad
    const m = generateModel(fam, rng, lvl, namer, seen)
    if (!m) {
      agotada[fam] = (agotada[fam] ?? 0) + 1
      continue
    }
    seen.add(canonicalHash(modelToGraph(m)))
    const idx = exercises.length
    const tipo = opts.tipos === 'formula' ? 'formula' : opts.tipos === 'nombre' ? 'nombre' : idx % 2 === 0 ? 'formula' : 'nombre'
    exercises.push(makeExercise(m, tipo, namer, { estilo: opts.estilo ?? 'curso' }))
  }
  return { seed, opts: { ...opts, familias, cantidad }, ejercicios: exercises }
}

/** Sesión a partir de una hoja fija (Tema A, Tema B, Práctica A/B). */
export function sessionFromSheet(hoja, namer) {
  return {
    seed: hoja.id,
    hoja: hoja.id,
    opts: { cantidad: hoja.items.length, hoja: hoja.id },
    ejercicios: hoja.items.map((it) => makeExercise(it.model, it.tipo, namer, { formula: it.formula, nombre: it.nombre })),
  }
}

// ── Corrección ───────────────────────────────────────────────────────────────────────
export const PESO_CLASIFICACION = 0.25
export const PESO_RESPUESTA = 0.75

function composition(model) {
  return formulaString(modelToGraph(model).composition())
}

/** Pista cuando la estructura construida no es la pedida. */
export function diagnoseBuild(user, ex) {
  const mine = composition(user)
  if (mine !== ex.molecular) return `Tu estructura es ${mine}, pero la pedida es ${ex.molecular}: revisá cuántos carbonos, hidrógenos y heteroátomos lleva.`
  return 'Tenés la fórmula molecular correcta (' + ex.molecular + '), pero es otro isómero: revisá las posiciones del grupo funcional, de las ramas o de los enlaces múltiples.'
}

/**
 * @param {object} ex ejercicio
 * @param {{familia: string|null, nombre?: string, model?: object}} answer
 */
export function gradeExercise(ex, answer, namer) {
  const claseOk = answer.familia === ex.familia
  let respOk = false
  let hint = ''
  if (ex.tipo === 'formula') {
    const res = checkName(answer.nombre ?? '', ex.model, namer)
    respOk = res.ok
    if (!respOk) hint = res.empty ? 'No escribiste el nombre.' : res.closeToRight ? 'Casi: las palabras están bien, pero revisá los locantes (los números).' : 'El nombre no coincide. Revisá la cadena principal, los sustituyentes y el sufijo.'
  } else if (!answer.model) {
    hint = 'No construiste ninguna estructura.'
  } else if (validateModel(answer.model).length) {
    hint = 'La estructura construida tiene errores de valencia.'
  } else {
    respOk = canonicalHash(modelToGraph(answer.model)) === ex.hash
    if (!respOk) hint = diagnoseBuild(answer.model, ex)
  }
  const puntos = (claseOk ? PESO_CLASIFICACION : 0) + (respOk ? PESO_RESPUESTA : 0)
  return { claseOk, respOk, puntos, hint }
}

export function notaFinal(resultados) {
  const total = resultados.reduce((s, r) => s + (r?.puntos ?? 0), 0)
  return resultados.length ? Math.round((total / resultados.length) * 100) / 10 : 0
}

export { SUBSTITUENTS, TERMINALS }
