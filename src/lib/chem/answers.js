// Corrección de respuestas: comparación tolerante de nombres IUPAC, nombres alternativos aceptados
// y clasificación de una estructura en su familia.
import { ALKYLS, HALOGENS, SUBSTITUENTS, TERMINALS, kindOf } from './chainModel.js'

// ── Normalización de nombres ─────────────────────────────────────────────────────────
// Dos nombres son equivalentes si tienen las mismas letras y los mismos locantes en el mismo orden,
// sin importar dónde estén escritos: «pentan-2-ona» ≡ «2-pentanona» ≡ «2 pentanona».
export function nameKey(raw, { ignoreStereo = true } = {}) {
  let s = String(raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[–—−]/g, '-')
    .trim()
  if (ignoreStereo) {
    s = s.replace(/\(\s*\d*\s*[EZez](?:\s*,\s*\d*\s*[EZez])*\s*\)\s*-?/g, '')
    s = s.replace(/(^|[\s-])(?:cis|trans|[EZ])\s*-(?=[a-z0-9])/gi, '$1')
  }
  s = s.replace(/\s*,\s*/g, ',')
  const locs = []
  // locantes: números y «N» delimitados por guiones, espacios o paréntesis
  s = s.replace(/(^|[-\s(])((?:\d+|n)(?:,(?:\d+|n))*)(?=[-\s)])/gi, (_, pre, loc) => {
    locs.push(loc.toUpperCase())
    return `${pre}`
  })
  const letters = s.toLowerCase().replace(/[^a-z]/g, '')
  return `${locs.join('|')}::${letters}`
}

// ── Estilo «del curso»: el locante antes de la raíz (2-pentanona, 2-penteno) ─────────────
export function courseStyleName(result) {
  if (!result?.ok) return ''
  const get = (k) => result.pieces.find((p) => p.kind === k)?.text ?? ''
  const acid = get('acido')
  const desc = get('estereo')
  const pref = get('prefijo')
  const stem = get('raiz')
  let tail = get('insat') + get('sufijo')
  const alkyl = get('alquilo')
  const m = tail.match(/-(\d+(?:,\d+)*)-/)
  let core
  if (m) {
    tail = tail.replace(m[0], '')
    core = `-${m[1]}-${stem}${tail}`
    // «3-metil-2-pentanona»: el locante movido se une al prefijo con un guión
    return acid + desc + (pref ? `${pref}${core}` : core.slice(1)) + alkyl
  }
  core = stem + tail
  return acid + desc + pref + core + alkyl
}

export function capitalize(name) {
  return name.replace(/[a-záéíóúñ]/i, (c) => c.toUpperCase())
}

// ── Nombres aceptados ──────────────────────────────────────────────────────────────────
const VERBAL = { 1: 'formiato', 2: 'acetato', 3: 'propionato', 4: 'butirato' }
const HALIDE = { F: 'fluoruro', Cl: 'cloruro', Br: 'bromuro', I: 'yoduro' }

// ¿La cadena es lineal, saturada y sin nada más que `exactlyOne`? Devuelve el grupo o null
function plainChainWith(model, pred) {
  if (model.bonds.some((b) => b !== 1)) return null
  let found = null
  for (let i = 0; i < model.n; i++) {
    const c = model.carbons[i]
    if (c.term) {
      if (!pred.term || found) return null
      found = { i, term: c.term }
      continue
    }
    for (const s of c.subs) {
      if (!pred.sub?.(s) || found) return null
      found = { i, sub: s }
    }
  }
  return found
}

// Nombre del radical que forma la cadena cuando se une por el carbono i (sólo cadenas simples)
function radicalName(chainPrefix, n, i) {
  if (i === 0 || i === n - 1) return `${chainPrefix.get(n)}il`
  if (n === 3 && i === 1) return 'isopropil'
  if (n === 4 && (i === 1 || i === 2)) return 'sec-butil'
  return null
}

/**
 * Todos los nombres que se aceptan como correctos para este modelo.
 * El primero es el nombre «oficial» que muestra la app.
 */
export function acceptedNames(model, namer) {
  const base = namer.nameChain(model)
  if (!base.ok) return []
  const set = new Set()
  const push = (s) => s && set.add(s)
  for (const opts of [{}, { noStereo: true }, { full: true }, { full: true, noStereo: true }]) {
    const r = namer.nameChain(model, opts)
    push(r.name)
    push(courseStyleName(r))
    // un único sustituyente en C1 sin más locantes: «1-metoxipropano» ≡ «metoxipropano»
    for (const v of [r.name, courseStyleName(r)]) if (/^1-[^0-9]+$/.test(v)) push(v.slice(2))
  }

  const cp = namer.chainPrefix
  const n = model.n
  // Éteres: «etil metil éter»
  const eth = plainChainWith(model, { sub: (s) => kindOf(s) === 'alkoxy' })
  if (eth) {
    const rc = radicalName(cp, n, eth.i)
    const ro = ALKYLS[SUBSTITUENTS[eth.sub].alkyl].name
    if (rc) {
      push(rc === ro ? `di${rc} éter` : `${rc} ${ro} éter`)
      push(`${ro} ${rc} éter`)
    }
  }
  // Aminas: «propilamina», «metilpropilamina»
  const am = plainChainWith(model, { sub: (s) => s === 'NH2' || (kindOf(s) === 'amineN' && SUBSTITUENTS[s].alkyls.length === 1) })
  if (am) {
    const rc = radicalName(cp, n, am.i)
    if (rc) {
      if (am.sub === 'NH2') push(`${rc}amina`)
      else {
        const ro = ALKYLS[SUBSTITUENTS[am.sub].alkyls[0]].name
        const [a, b] = [rc, ro].sort((x, y) => x.localeCompare(y, 'es'))
        push(`${a}${b}amina`)
        push(`N-${ro}${rc}amina`)
      }
    }
  }
  // Ésteres: nombres tradicionales «acetato de etilo»
  const es = plainChainWith(model, { term: true })
  if (es && TERMINALS[es.term].type === 'ester' && VERBAL[n]) push(`${VERBAL[n]} de ${ALKYLS[TERMINALS[es.term].alkyl].ester}`)
  // Halogenuros: «cloruro de etilo»
  const ha = plainChainWith(model, { sub: (s) => kindOf(s) === 'halogen' })
  if (ha) {
    const rc = radicalName(cp, n, ha.i)
    if (rc) push(`${HALIDE[ha.sub]} de ${rc.replace(/il$/, 'ilo')}`)
  }
  // Nombres comunes muy usados
  const bare = plainChainWith(model, { term: true })
  if (bare && n <= 4) {
    const t = TERMINALS[bare.term].type
    if (t === 'acid') push(`ácido ${{ 1: 'fórmico', 2: 'acético', 3: 'propiónico', 4: 'butírico' }[n]}`)
    if (t === 'aldehyde') push(`${{ 1: 'formaldehído', 2: 'acetaldehído', 3: 'propionaldehído', 4: 'butiraldehído' }[n]}`)
  }
  if (n === 3 && model.carbons[1].subs.length === 1 && model.carbons[1].subs[0] === 'oxo' && model.bonds.every((b) => b === 1)) push('acetona')

  return [...set]
}

export function checkName(input, model, namer) {
  const accepted = acceptedNames(model, namer)
  const keys = new Set(accepted.map((n) => nameKey(n)))
  const key = nameKey(input)
  const ok = keys.has(key)
  // pista cuando casi está bien: mismas letras, distintos locantes
  const letters = key.split('::')[1]
  const sameLetters = [...keys].some((k) => k.split('::')[1] === letters)
  return { ok, accepted, closeToRight: !ok && sameLetters && letters.length > 0, empty: letters.length === 0 }
}

// ── Clasificación en familias ──────────────────────────────────────────────────────────
export const FAMILY_OF_PRINCIPAL = {
  acid: 'acidos_carboxilicos',
  ester: 'esteres',
  amide: 'amidas',
  nitrile: 'nitrilos',
  aldehyde: 'aldehidos',
  ketone: 'cetonas',
  alcohol: 'alcoholes',
  amine: 'aminas',
  ether: 'eteres',
  ene: 'alquenos',
  yne: 'alquinos',
  ane: 'alcanos',
}

export function classifyModel(model, namer) {
  const r = namer.nameChain(model)
  if (!r.ok) return null
  if (r.halogens && (r.principal === 'ane' || r.principal === 'ene' || r.principal === 'yne')) return 'halogenuros'
  return FAMILY_OF_PRINCIPAL[r.principal]
}

export { HALOGENS }
