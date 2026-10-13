// Modelo de cadena carbonada para el constructor interactivo.
// { n, bonds:[orden entre Ci y Ci+1], carbons:[{ term: null|clave de TERMINALS, subs:[claves de SUBSTITUENTS] }], stereo:'E'|'Z' }
//
// Qué se puede armar:
//  · grupos terminales (el carbono pertenece al grupo): -CHO, -COOH, -CONH2, -C≡N y ésteres -COO-R
//  · sustituyentes: -OH, =O, -NH2, aminas N-sustituidas, alcoxi (éteres), halógenos y ramas alquilo
import { MolGraph } from './graph.js'

export const MAX_CARBONS = 10
export const MAX_BRANCHES = 6
export const MAX_METHYLS = MAX_BRANCHES // alias histórico

// ── Grupos alquilo (ramas, parte alquílica de éteres, ésteres y aminas) ───────────
// `arm`: longitud de la rama medida como cadena continua; sirve para que la cadena principal siga
// siendo la más larga (una rama de longitud L sólo cabe si ambos brazos de la cadena miden ≥ L).
export const ALKYLS = {
  CH3: { name: 'metil', ester: 'metilo', alkoxy: 'metoxi', carbons: 1, arm: 1, text: 'CH3', fwd: 'CH3', back: 'CH3' },
  C2H5: { name: 'etil', ester: 'etilo', alkoxy: 'etoxi', carbons: 2, arm: 2, text: 'CH2CH3', fwd: 'CH2-CH3', back: 'CH3-CH2' },
  C3H7: { name: 'propil', ester: 'propilo', alkoxy: 'propoxi', carbons: 3, arm: 3, text: 'CH2CH2CH3', fwd: 'CH2-CH2-CH3', back: 'CH3-CH2-CH2' },
  iC3H7: { name: 'isopropil', ester: 'isopropilo', alkoxy: 'isopropoxi', carbons: 3, arm: 2, text: 'CH(CH3)2', fwd: 'CH(CH3)2', back: 'CH3-CH(CH3)' },
}

function addAlkyl(g, parent, key) {
  const c = g.addAtom('C')
  g.addBond(parent, c, 1)
  if (key === 'CH3') g.addH(c, 3)
  else if (key === 'C2H5') {
    g.addH(c, 2)
    const c2 = g.addAtom('C')
    g.addBond(c, c2, 1)
    g.addH(c2, 3)
  } else if (key === 'C3H7') {
    g.addH(c, 2)
    const c2 = g.addAtom('C')
    g.addBond(c, c2, 1)
    g.addH(c2, 2)
    const c3 = g.addAtom('C')
    g.addBond(c2, c3, 1)
    g.addH(c3, 3)
  } else {
    g.addH(c, 1)
    for (let k = 0; k < 2; k++) {
      const me = g.addAtom('C')
      g.addBond(c, me, 1)
      g.addH(me, 3)
    }
  }
  return c
}

// ── Grupos terminales ─────────────────────────────────────────────────────────────
export const TERMINALS = {
  CHO: { label: 'Aldehído', formula: '-CHO', type: 'aldehyde', valence: 3 },
  COOH: { label: 'Ácido carboxílico', formula: '-COOH', type: 'acid', valence: 3 },
  CONH2: { label: 'Amida', formula: '-CONH2', type: 'amide', valence: 3 },
  CN: { label: 'Nitrilo', formula: '-C≡N', type: 'nitrile', valence: 3 },
}
for (const [k, a] of Object.entries(ALKYLS)) {
  TERMINALS[`COO${k}`] = { label: `Éster de ${a.ester}`, formula: `-COO${a.text}`, type: 'ester', alkyl: k, valence: 3 }
}
export const TERMINAL_GROUPS = [
  { title: 'Carbonilos y derivados', keys: ['CHO', 'COOH', 'CONH2', 'CN'] },
  { title: 'Ésteres (–COO–R)', keys: ['COOCH3', 'COOC2H5', 'COOC3H7', 'COOiC3H7'] },
]

// ── Sustituyentes ─────────────────────────────────────────────────────────────────
// kind: oh | oxo | amine (NH2) | amineN (NHR, NR2) | alkyl | alkoxy | halogen
const cap = (t) => t[0].toUpperCase() + t.slice(1)
export const SUBSTITUENTS = {
  OH: { label: 'Hidroxilo (alcohol)', formula: '-OH', text: 'OH', kind: 'oh', valence: 1 },
  oxo: { label: 'Carbonilo (cetona)', formula: '=O', text: 'O', kind: 'oxo', valence: 2 },
  NH2: { label: 'Amino (amina primaria)', formula: '-NH2', text: 'NH2', kind: 'amine', valence: 1 },
}
for (const [k, a] of Object.entries(ALKYLS)) {
  SUBSTITUENTS[k] = { label: `${cap(a.ester)} (rama)`, formula: `-${a.text}`, text: a.text, kind: 'alkyl', valence: 1 }
  SUBSTITUENTS[`O${k}`] = { label: `${cap(a.alkoxy)} (éter)`, formula: `-O${a.text}`, text: `O${a.text}`, kind: 'alkoxy', alkyl: k, valence: 1 }
}
for (const k of ['CH3', 'C2H5', 'C3H7']) {
  const a = ALKYLS[k]
  SUBSTITUENTS[`NH${k}`] = { label: `${cap(a.name)}amino (sec.)`, formula: `-NH${a.text}`, text: `NH${a.text}`, kind: 'amineN', alkyls: [k], valence: 1 }
}
for (const k of ['CH3', 'C2H5']) {
  const a = ALKYLS[k]
  SUBSTITUENTS[`N(${k})2`] = { label: `Di${a.name}amino (terc.)`, formula: `-N(${a.text})2`, text: `N(${a.text})2`, kind: 'amineN', alkyls: [k, k], valence: 1 }
}
export const HALOGENS = {
  F: { name: 'fluoro', label: 'Flúor' },
  Cl: { name: 'cloro', label: 'Cloro' },
  Br: { name: 'bromo', label: 'Bromo' },
  I: { name: 'yodo', label: 'Yodo' },
}
for (const [k, h] of Object.entries(HALOGENS)) {
  SUBSTITUENTS[k] = { label: `${h.label} (halogenuro)`, formula: `-${k}`, text: k, kind: 'halogen', valence: 1 }
}

export const SUBSTITUENT_GROUPS = [
  { title: 'Grupos funcionales', keys: ['OH', 'oxo'] },
  { title: 'Aminas', keys: ['NH2', 'NHCH3', 'NHC2H5', 'NHC3H7', 'N(CH3)2', 'N(C2H5)2'] },
  { title: 'Éteres (alcoxi)', keys: ['OCH3', 'OC2H5', 'OC3H7', 'OiC3H7'] },
  { title: 'Halógenos', keys: ['F', 'Cl', 'Br', 'I'] },
  { title: 'Ramificaciones (alquilo)', keys: ['CH3', 'C2H5', 'C3H7', 'iC3H7'] },
]

export const kindOf = (sub) => SUBSTITUENTS[sub]?.kind
export const isAlkyl = (sub) => kindOf(sub) === 'alkyl'
export const isHalogen = (sub) => kindOf(sub) === 'halogen'
const isHetero = (sub) => !isAlkyl(sub) // OH, oxo, aminas, alcoxi y halógenos ocupan el «lugar funcional»
const isEster = (term) => TERMINALS[term]?.type === 'ester'

// Carbonos aportados por un sustituyente (para contar el tamaño total de la molécula)
export function subCarbons(sub) {
  const s = SUBSTITUENTS[sub]
  if (s.kind === 'alkyl') return ALKYLS[sub].carbons
  if (s.kind === 'alkoxy') return ALKYLS[s.alkyl].carbons
  if (s.kind === 'amineN') return s.alkyls.reduce((t, k) => t + ALKYLS[k].carbons, 0)
  return 0
}
export function totalCarbons(m) {
  return m.n + m.carbons.reduce((t, c) => t + c.subs.reduce((u, s) => u + subCarbons(s), 0) + (isEster(c.term) ? ALKYLS[TERMINALS[c.term].alkyl].carbons : 0), 0)
}

export function emptyModel(n = 3) {
  return {
    n,
    bonds: Array(Math.max(0, n - 1)).fill(1),
    carbons: Array.from({ length: n }, () => ({ term: null, subs: [] })),
    stereo: 'E',
  }
}

export function cloneModel(m) {
  return {
    n: m.n,
    bonds: [...m.bonds],
    carbons: m.carbons.map((c) => ({ term: c.term, subs: [...c.subs] })),
    stereo: m.stereo,
  }
}

// ¿Puede este sustituyente estar en esta posición? (reglas estructurales, no de valencia)
export function subAllowedAt(m, i, sub) {
  const s = SUBSTITUENTS[sub]
  const arm = Math.min(i, m.n - 1 - i)
  if (s.kind === 'alkyl') return arm >= ALKYLS[sub].arm
  if (s.kind === 'oxo') return arm >= 1
  return true
}

export function resizeModel(model, n) {
  const m = emptyModel(n)
  m.stereo = model.stereo
  for (let i = 0; i < Math.min(n, model.n); i++) {
    m.carbons[i] = { term: null, subs: [...model.carbons[i].subs] }
    if (i < n - 1 && i < model.n - 1) m.bonds[i] = model.bonds[i]
  }
  // El grupo terminal sólo se conserva si sigue en un extremo
  if (model.carbons[0].term) m.carbons[0].term = model.carbons[0].term
  const oldLast = model.carbons[model.n - 1].term
  if (oldLast && model.n - 1 > 0 && n - 1 > 0) m.carbons[n - 1].term = oldLast
  // Sustituyentes que ya no son válidos en la nueva posición
  m.carbons.forEach((c, i) => {
    c.subs = c.subs.filter((s) => subAllowedAt(m, i, s))
  })
  return sanitize(m)
}

const countSubs = (m, pred) => m.carbons.reduce((t, c) => t + c.subs.filter(pred).length, 0)

// Elimina lo que deje de ser válido por valencias o reglas tras un cambio.
export function sanitize(m) {
  for (let i = 0; i < m.n; i++) {
    const c = m.carbons[i]
    if (c.term) {
      c.subs = []
      if (m.bonds[i - 1] > 1) m.bonds[i - 1] = 1
      if (m.bonds[i] > 1) m.bonds[i] = 1
    }
  }
  // un solo grupo funcional por carbono (los halógenos pueden repetirse)
  m.carbons.forEach((c) => {
    const kept = []
    for (const sub of c.subs) {
      const hetero = kept.filter(isHetero)
      if (isAlkyl(sub)) kept.push(sub)
      else if (!hetero.length || (isHalogen(sub) && hetero.every(isHalogen))) kept.push(sub)
    }
    c.subs = kept
  })
  // un solo éster por molécula
  let esters = 0
  m.carbons.forEach((c) => {
    if (isEster(c.term) && ++esters > 1) c.term = null
  })
  // a lo sumo una amina N-sustituida y sin otras aminas
  let nSub = 0
  m.carbons.forEach((c) => {
    c.subs = c.subs.filter((s) => {
      if (kindOf(s) !== 'amineN') return true
      return ++nSub <= 1
    })
  })
  if (nSub) m.carbons.forEach((c) => (c.subs = c.subs.filter((s) => s !== 'NH2')))
  let guard = 0
  while (guard++ < 60) {
    let changed = false
    for (let i = 0; i < m.n; i++) {
      if (carbonState(m, i).free < 0) {
        const c = m.carbons[i]
        if (c.subs.length) c.subs.pop()
        else if (i > 0 && m.bonds[i - 1] > 1) m.bonds[i - 1]--
        else if (i < m.n - 1 && m.bonds[i] > 1) m.bonds[i]--
        changed = true
      }
    }
    if (!changed) break
  }
  return m
}

export function carbonState(m, i) {
  const c = m.carbons[i]
  const left = i > 0 ? m.bonds[i - 1] : 0
  const right = i < m.n - 1 ? m.bonds[i] : 0
  const termV = c.term ? TERMINALS[c.term].valence : 0
  const subV = c.subs.reduce((s, x) => s + SUBSTITUENTS[x].valence, 0)
  const used = left + right + termV + subV
  const free = 4 - used
  // Hidrógenos: los libres + (CHO aporta su propio H)
  const h = Math.max(0, free) + (c.term === 'CHO' ? 1 : 0)
  return { used, free, h }
}

export function validateModel(m) {
  const errors = []
  let esters = 0
  let nSubs = 0
  let nh2 = 0
  for (let i = 0; i < m.n; i++) {
    const c = m.carbons[i]
    const st = carbonState(m, i)
    if (st.free < 0) errors.push(`C${i + 1}: supera 4 enlaces (valencia excedida)`)
    if (c.term && i !== 0 && i !== m.n - 1) errors.push(`C${i + 1}: el grupo ${c.term} sólo puede ir en un extremo`)
    if (c.term && c.subs.length) errors.push(`C${i + 1}: un carbono funcional terminal no admite más sustituyentes`)
    if (isEster(c.term)) esters++
    for (const s of c.subs) {
      if (!subAllowedAt(m, i, s)) {
        errors.push(
          isAlkyl(s)
            ? `C${i + 1}: la rama ${ALKYLS[s].name}o es demasiado larga para este carbono (la cadena principal dejaría de ser la más larga)`
            : `C${i + 1}: el carbonilo sólo puede ir en carbonos internos`,
        )
      }
      if (kindOf(s) === 'amineN') nSubs++
      if (s === 'NH2') nh2++
    }
    const heteros = c.subs.filter(isHetero)
    if (heteros.length > 1 && !heteros.every(isHalogen)) errors.push(`C${i + 1}: un solo grupo funcional por carbono`)
  }
  if (esters > 1) errors.push('Sólo se admite un grupo éster por molécula')
  if (nSubs > 1 || (nSubs && nh2)) errors.push('Sólo se admite una amina N-sustituida y sin otras aminas')
  return errors
}

// ¿Se puede agregar este sustituyente en este carbono?
export function canAddSub(m, i, sub) {
  const c = m.carbons[i]
  if (c.term) return false
  const s = SUBSTITUENTS[sub]
  if (!subAllowedAt(m, i, sub)) return false
  if (s.kind === 'alkyl') {
    if (c.subs.filter(isAlkyl).length >= 2) return false
    if (countSubs(m, isAlkyl) >= MAX_BRANCHES) return false
  } else if (s.kind === 'halogen') {
    if (c.subs.some((x) => isHetero(x) && !isHalogen(x))) return false
  } else {
    if (c.subs.some(isHetero)) return false // un solo grupo funcional por carbono
    if (s.kind === 'amineN' && (countSubs(m, (x) => kindOf(x) === 'amineN') > 0 || countSubs(m, (x) => x === 'NH2') > 0)) return false
    if (sub === 'NH2' && countSubs(m, (x) => kindOf(x) === 'amineN') > 0) return false
  }
  return carbonState(m, i).free >= s.valence
}

// Motivo legible cuando no se puede agregar (para el tooltip)
export function whyNotSub(m, i, sub) {
  const c = m.carbons[i]
  const s = SUBSTITUENTS[sub]
  if (c.term) return 'Un carbono funcional terminal no admite sustituyentes'
  if (!subAllowedAt(m, i, sub)) {
    return s.kind === 'alkyl'
      ? `Esta rama (${ALKYLS[sub].name}o) necesita al menos ${ALKYLS[sub].arm} carbono${ALKYLS[sub].arm > 1 ? 's' : ''} a cada lado; si no, la cadena principal sería otra`
      : 'Sólo en carbonos internos (en un extremo sería un aldehído)'
  }
  if (s.kind === 'alkyl') {
    if (c.subs.filter(isAlkyl).length >= 2) return 'Máximo dos ramas por carbono'
    if (countSubs(m, isAlkyl) >= MAX_BRANCHES) return `Máximo ${MAX_BRANCHES} ramificaciones`
  }
  if (s.kind !== 'alkyl' && c.subs.some(isHetero) && !(s.kind === 'halogen' && c.subs.every((x) => isHalogen(x) || isAlkyl(x)))) return 'Un solo grupo funcional por carbono'
  if (s.kind === 'amineN' || sub === 'NH2') {
    if (s.kind === 'amineN' && (countSubs(m, (x) => kindOf(x) === 'amineN') > 0 || countSubs(m, (x) => x === 'NH2') > 0)) return 'Una sola amina N-sustituida, sin otras aminas'
    if (sub === 'NH2' && countSubs(m, (x) => kindOf(x) === 'amineN') > 0) return 'Ya hay una amina N-sustituida en la molécula'
  }
  if (carbonState(m, i).free < s.valence) return 'No quedan valencias libres en este carbono'
  return ''
}

export function canSetTerm(m, i, term) {
  if (i !== 0 && i !== m.n - 1) return false
  const c = m.carbons[i]
  if (c.subs.length) return false
  if (term === null) return true
  const chainBond = i === 0 ? m.bonds[0] ?? 0 : m.bonds[m.n - 2] ?? 0
  if (chainBond > 1) return false
  if (isEster(term)) {
    const other = m.carbons.some((x, k) => k !== i && isEster(x.term))
    if (other) return false
  }
  return true
}

export function canSetBond(m, i, order) {
  const t = cloneModel(m)
  t.bonds[i] = order
  for (const k of [i, i + 1]) if (carbonState(t, k).free < 0) return false
  // los carbonos funcionales terminales sólo admiten enlace simple
  if ((m.carbons[i].term || m.carbons[i + 1].term) && order > 1) return false
  return true
}

// Dobles enlaces con estereoquímica E/Z (un sustituyente pesado en cada carbono)
export function stereogenicBonds(m) {
  const heavy = (i, partner) => {
    let k = 0
    if (i > 0 && i - 1 !== partner) k++
    if (i < m.n - 1 && i + 1 !== partner) k++
    k += m.carbons[i].subs.length
    return k
  }
  const out = []
  for (let i = 0; i < m.n - 1; i++) {
    if (m.bonds[i] === 2 && heavy(i, i + 1) === 1 && heavy(i + 1, i) === 1) out.push(i)
  }
  return out
}

// Ensambla un sustituyente sobre el átomo `a` del grafo
function attachSub(g, a, sub) {
  const s = SUBSTITUENTS[sub]
  switch (s.kind) {
    case 'oh': {
      const o = g.addAtom('O')
      g.addBond(a, o, 1)
      g.addH(o, 1)
      break
    }
    case 'oxo': {
      const o = g.addAtom('O')
      g.addBond(a, o, 2)
      break
    }
    case 'amine': {
      const n = g.addAtom('N')
      g.addBond(a, n, 1)
      g.addH(n, 2)
      break
    }
    case 'amineN': {
      const n = g.addAtom('N')
      g.addBond(a, n, 1)
      if (s.alkyls.length === 1) g.addH(n, 1)
      s.alkyls.forEach((k) => addAlkyl(g, n, k))
      break
    }
    case 'alkyl':
      addAlkyl(g, a, sub)
      break
    case 'alkoxy': {
      const o = g.addAtom('O')
      g.addBond(a, o, 1)
      addAlkyl(g, o, s.alkyl)
      break
    }
    case 'halogen': {
      const x = g.addAtom(sub)
      g.addBond(a, x, 1)
      break
    }
    default:
  }
}

export function modelToGraph(m) {
  const g = new MolGraph()
  const c = m.carbons.map(() => g.addAtom('C'))
  for (let i = 0; i < m.n - 1; i++) g.addBond(c[i], c[i + 1], m.bonds[i])
  m.carbons.forEach((car, i) => {
    const a = c[i]
    const { h } = carbonState(m, i)
    const term = car.term
    if (term === 'CHO') {
      const o = g.addAtom('O')
      g.addBond(a, o, 2)
    } else if (term === 'COOH') {
      const o = g.addAtom('O')
      g.addBond(a, o, 2)
      const oh = g.addAtom('O')
      g.addBond(a, oh, 1)
      g.addH(oh, 1)
    } else if (term === 'CONH2') {
      const o = g.addAtom('O')
      g.addBond(a, o, 2)
      const n = g.addAtom('N')
      g.addBond(a, n, 1)
      g.addH(n, 2)
    } else if (term === 'CN') {
      const n = g.addAtom('N')
      g.addBond(a, n, 3)
    } else if (isEster(term)) {
      const o = g.addAtom('O')
      g.addBond(a, o, 2)
      const o2 = g.addAtom('O')
      g.addBond(a, o2, 1)
      addAlkyl(g, o2, TERMINALS[term].alkyl)
    }
    for (const s of car.subs) attachSub(g, a, s)
    g.addH(a, h)
  })
  return g.assignHybridization()
}

// ── Textos ────────────────────────────────────────────────────────────────────────
// Etiqueta compacta de un carbono (para los botones de la cadena), p. ej. "CH3", "CHOH", "CH2Cl", "CH(CH3)"
function unitLabel(m, i) {
  const car = m.carbons[i]
  const { h } = carbonState(m, i)
  if (car.term) {
    if (isEster(car.term)) {
      const base = `COO${ALKYLS[TERMINALS[car.term].alkyl].text}`
      return m.n === 1 ? `H${base}` : base
    }
    const extra = m.n === 1 ? carbonState(m, i).free : 0
    const base = { CHO: 'CHO', COOH: 'COOH', CONH2: 'CONH2', CN: 'CN' }[car.term]
    if (m.n === 1) return car.term === 'CHO' ? 'HCHO' : extra ? `H${base}` : base
    return base
  }
  if (car.subs.includes('oxo')) return 'CO'
  const base = 'C' + (h > 0 ? 'H' + (h > 1 ? h : '') : '')
  const heteros = car.subs.filter(isHetero)
  const alkyls = car.subs.filter(isAlkyl)
  let out = base
  if (heteros.length && heteros.every(isHalogen)) {
    const counts = {}
    heteros.forEach((x) => (counts[x] = (counts[x] ?? 0) + 1))
    out += Object.entries(counts)
      .map(([k, n]) => k + (n > 1 ? n : ''))
      .join('')
  } else if (heteros.length === 1 && alkyls.length === 0) {
    out += SUBSTITUENTS[heteros[0]].text
  } else if (heteros.length === 1) {
    out += `(${SUBSTITUENTS[heteros[0]].text})`
  }
  const counts = {}
  alkyls.forEach((x) => (counts[x] = (counts[x] ?? 0) + 1))
  for (const [k, n] of Object.entries(counts)) out += `(${ALKYLS[k].text})${n > 1 ? n : ''}`
  return out
}

export function carbonLabel(m, i) {
  return unitLabel(m, i)
}

export function carbonUnits(m) {
  return m.carbons.map((_, i) => unitLabel(m, i))
}

// ── Fórmula semidesarrollada (compatible con el parser) ───────────────────────────
// Los grupos que enlazan por un heteroátomo en un extremo se escriben «en línea»:
//   CH3-O-CH2-CH2-CH3 · CH3-CH2-NH-CH3 · CH3-COO-CH2-CH3
// y los de carbonos internos como rama:  CH3-CH(O-CH3)-CH3
function branchText(sub) {
  const s = SUBSTITUENTS[sub]
  switch (s.kind) {
    case 'alkyl':
      return ALKYLS[sub].fwd
    case 'alkoxy':
      return `O-${ALKYLS[s.alkyl].fwd}`
    case 'amineN':
      return s.alkyls.length === 1 ? `NH-${ALKYLS[s.alkyls[0]].fwd}` : `N(${ALKYLS[s.alkyls[0]].fwd})2`
    default:
      return SUBSTITUENTS[sub].text
  }
}

// ¿Tiene este carbono extremo un grupo funcional que se escribe «en línea» (o es terminal)?
const endGroup = (c) => !!c.term || c.subs.some((x) => ['oh', 'amine', 'amineN', 'alkoxy', 'halogen'].includes(kindOf(x)))

function printable(m) {
  // Se escribe con el grupo del extremo a la derecha, como en los libros (CH3-CH(CH3)-COOH, CH3-CH2-OH);
  // el éster siempre va a la derecha: CH3-COO-CH2-CH3
  const first = m.carbons[0]
  const last = m.carbons[m.n - 1]
  if (m.n > 1 && ((endGroup(first) && !endGroup(last)) || isEster(first.term))) {
    return {
      n: m.n,
      bonds: [...m.bonds].reverse(),
      carbons: [...m.carbons].reverse(),
      stereo: m.stereo,
    }
  }
  return m
}

export function modelToSemidevelopedFormula(model) {
  const m = printable(model)
  const sym = { 1: '-', 2: '=', 3: '≡' }
  const units = m.carbons.map((car, i) => {
    const { h } = carbonState(m, i)
    let pre = ''
    let post = ''
    let core
    if (car.term) {
      if (isEster(car.term)) {
        const R = ALKYLS[TERMINALS[car.term].alkyl].fwd
        core = m.n === 1 ? 'HCOO' : 'COO'
        post = `-${R}`
      } else {
        core = unitLabel(m, i)
      }
      return pre + core + post
    }
    if (car.subs.includes('oxo')) return 'CO'
    const base = 'C' + (h > 0 ? 'H' + (h > 1 ? h : '') : '')
    core = base
    const heteros = car.subs.filter(isHetero)
    const alkyls = car.subs.filter(isAlkyl)
    const atRight = i === m.n - 1
    const atLeft = i === 0
    const single = heteros.length === 1 ? heteros[0] : null
    const linker = single && (atLeft || atRight) && ['alkoxy', 'amineN', 'oh', 'amine', 'halogen'].includes(kindOf(single))
    if (heteros.length > 1 && heteros.every(isHalogen)) {
      const counts = {}
      heteros.forEach((x) => (counts[x] = (counts[x] ?? 0) + 1))
      core += Object.entries(counts)
        .map(([k, n]) => k + (n > 1 ? n : ''))
        .join('')
    } else if (single) {
      const s = SUBSTITUENTS[single]
      if (linker) {
        // extremo derecho (o cadena de 1 C): «-X-R» tras el carbono; extremo izquierdo: «R-X-» antes
        const rightSide = atRight || m.n === 1
        if (['oh', 'amine', 'halogen'].includes(s.kind)) {
          if (rightSide) post = `-${s.text}`
          else pre = `${s.text}-`
        } else {
          const alk = s.kind === 'alkoxy' ? [s.alkyl] : s.alkyls
          const link = s.kind === 'alkoxy' ? 'O' : s.alkyls.length === 1 ? 'NH' : 'N'
          if (rightSide) {
            if (link === 'N' && alk.length === 2) post = `-N(${ALKYLS[alk[0]].fwd})-${ALKYLS[alk[1]].fwd}`
            else post = `-${link}-${ALKYLS[alk[0]].fwd}`
          } else if (link === 'N' && alk.length === 2) pre = `${ALKYLS[alk[0]].back}-N(${ALKYLS[alk[1]].fwd})-`
          else pre = `${ALKYLS[alk[0]].back}-${link}-`
        }
      } else if (s.kind === 'halogen') {
        core += s.text
      } else {
        core += `(${branchText(single)})`
      }
    }
    const counts = {}
    alkyls.forEach((x) => (counts[x] = (counts[x] ?? 0) + 1))
    for (const [k, n] of Object.entries(counts)) core += `(${ALKYLS[k].fwd})${n > 1 ? n : ''}`
    return pre + core + post
  })
  return units.map((p, i) => (i < units.length - 1 ? p + sym[m.bonds[i]] : p)).join('')
}
