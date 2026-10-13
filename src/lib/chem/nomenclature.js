// Nombrador IUPAC (español) para cadenas del constructor.
// Toma prefijos de cadena y jerarquía de grupos directamente de `reglas_nomenclatura` del JSON
// e implementa sus 5 pasos: grupo principal → cadena → numeración → sustituyentes → ensamblado.
//
// Cubre alcanos (con ramas metil/etil/propil/isopropil), alquenos, alquinos, alcoholes, éteres (alcoxi),
// aldehídos, cetonas, ácidos, ésteres, amidas, nitrilos, aminas (primarias, secundarias y terciarias)
// y halogenuros (los halógenos no están en la jerarquía del JSON: siempre son prefijos).
import { ALKYLS, HALOGENS, SUBSTITUENTS, TERMINALS, kindOf, stereogenicBonds, validateModel } from './chainModel.js'

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa']
const mult = (k) => MULT[k] ?? ''
const num = (a, b) => a - b
const TERMINAL_TYPES = ['acid', 'ester', 'amide', 'nitrile', 'aldehyde']
const SUFFIX_TYPES = [...TERMINAL_TYPES, 'ketone', 'alcohol', 'amine']

function cmpArr(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1
    if (b[i] === undefined) return 1
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

// «N» (locante del nitrógeno) va antes que los números: N,2-dimetil
const locSort = (a, b) => (a === 'N' ? (b === 'N' ? 0 : -1) : b === 'N' ? 1 : a - b)

function uniquePositions(type, m) {
  if (type === 'alcohol' || type === 'amine') return Math.ceil(m / 2)
  if (type === 'ketone') return m < 3 ? 0 : Math.ceil((m - 2) / 2)
  if (type === 'ene' || type === 'yne') return Math.ceil((m - 1) / 2)
  return 99
}

// Los grupos del JSON, sin ramas del tipo «a / b»
const clean = (s) => s.split('/')[0].replace(/-/g, '').trim()

export function createNamer(reglas) {
  const chainPrefix = new Map(reglas.prefijos_cadena.map((p) => [p.carbonos, p.prefijo.replace(/-/g, '')]))
  const byName = new Map(reglas.jerarquia_grupos_funcionales.map((g) => [norm(g.grupo), g]))
  const need = (nm) => {
    const g = byName.get(norm(nm))
    if (!g) throw new Error(`Falta el grupo «${nm}» en reglas_nomenclatura.jerarquia_grupos_funcionales`)
    return g
  }
  const GROUPS = {
    acid: need('Ácido carboxílico'),
    ester: need('Éster'),
    amide: need('Amida'),
    nitrile: need('Nitrilo'),
    aldehyde: need('Aldehído'),
    ketone: need('Cetona'),
    alcohol: need('Alcohol'),
    amine: need('Amina'),
    ether: need('Éter'),
    ene: need('Alqueno'),
    yne: need('Alquino'),
    ane: need('Alcano'),
  }
  const SUFFIX = Object.fromEntries(SUFFIX_TYPES.filter((t) => t !== 'ester').map((t) => [t, clean(GROUPS[t].sufijo)]))
  // «-ato de -ilo»: el sufijo del éster se deriva del ácido (-oico → -oato)
  SUFFIX.ester = SUFFIX.acid.replace(/ico$/, 'ato')
  const UNSAT = {
    ene: clean(GROUPS.ene.sufijo).replace(/o$/, ''),
    yne: clean(GROUPS.yne.sufijo).replace(/o$/, ''),
    ane: clean(GROUPS.ane.sufijo).replace(/o$/, ''),
  }
  const PREFIX = {
    oxo: clean(GROUPS.ketone.prefijo),
    hidroxi: clean(GROUPS.alcohol.prefijo),
    amino: clean(GROUPS.amine.prefijo),
    ciano: clean(GROUPS.nitrile.prefijo),
    carbamoil: clean(GROUPS.amide.prefijo),
    metil: `${chainPrefix.get(1)}il`,
  }
  const cmpName = (a, b) => norm(a).replace(/[()]/g, '').localeCompare(norm(b).replace(/[()]/g, ''), 'es')

  // Nombre de las ramas y sustituyentes (todo lo que no es el grupo principal)
  const subPrefixes = (sub, idx, principal) => {
    const s = SUBSTITUENTS[sub]
    switch (s.kind) {
      case 'alkyl':
        return [{ name: ALKYLS[sub].name, idx }]
      case 'oh':
        return principal === 'alcohol' ? [] : [{ name: PREFIX.hidroxi, idx }]
      case 'oxo':
        return principal === 'ketone' ? [] : [{ name: PREFIX.oxo, idx }]
      case 'amine':
        return principal === 'amine' ? [] : [{ name: PREFIX.amino, idx }]
      case 'amineN': {
        if (principal === 'amine') return s.alkyls.map((k) => ({ name: ALKYLS[k].name, idx: 'N' }))
        const alk = s.alkyls.length === 2 && s.alkyls[0] === s.alkyls[1] ? `di${ALKYLS[s.alkyls[0]].name}` : s.alkyls.map((k) => ALKYLS[k].name).join('')
        return [{ name: `(${alk}${PREFIX.amino})`, idx }]
      }
      case 'alkoxy':
        return [{ name: ALKYLS[s.alkyl].alkoxy, idx }]
      case 'halogen':
        return [{ name: HALOGENS[sub].name, idx }]
      default:
        return []
    }
  }

  /**
   * @param {object} model modelo de cadena
   * @param {{full?: boolean, noStereo?: boolean}} [opts] full: escribe todos los locantes (etan-1-ol);
   *   noStereo: omite el descriptor (2E)/(2Z)
   */
  function nameChain(model, opts = {}) {
    const errors = validateModel(model)
    if (errors.length) return { ok: false, errors }
    const n = model.n

    // ── Paso 1: grupos presentes y grupo principal ───────────────────────
    const present = {}
    const add = (t, idx) => (present[t] ??= []).push(idx)
    model.carbons.forEach((c, i) => {
      if (c.term) add(TERMINALS[c.term].type, i)
      c.subs.forEach((s) => {
        const k = kindOf(s)
        if (k === 'oh') add('alcohol', i)
        else if (k === 'amine' || k === 'amineN') add('amine', i)
        else if (k === 'oxo') add('ketone', i)
        else if (k === 'alkoxy') add('ether', i)
      })
    })
    const enBonds = []
    const yneBonds = []
    model.bonds.forEach((o, i) => {
      if (o === 2) enBonds.push(i)
      if (o === 3) yneBonds.push(i)
    })
    if (enBonds.length) present.ene = enBonds
    if (yneBonds.length) present.yne = yneBonds

    const ranked = Object.keys(present).sort((a, b) => GROUPS[a].prioridad - GROUPS[b].prioridad)
    const principal = ranked[0] ?? 'ane'
    const principalIsTerminal = TERMINAL_TYPES.includes(principal)
    const hasSuffix = SUFFIX_TYPES.includes(principal)
    const halogens = model.carbons.flatMap((c, i) => c.subs.filter((s) => kindOf(s) === 'halogen').map((s) => ({ s, i })))

    // ── Paso 2: cadena principal (los carbonos funcionales de menor rango pueden quedar fuera) ──
    let lo = 0
    let hi = n - 1
    const extraPrefixes = []
    const notes = []
    if (principalIsTerminal) {
      for (const i of n === 1 ? [0] : [0, n - 1]) {
        const c = model.carbons[i]
        if (!c.term || TERMINALS[c.term].type === principal) continue
        const t = TERMINALS[c.term].type
        if (t === 'aldehyde') {
          extraPrefixes.push({ name: PREFIX.oxo, idx: i })
          notes.push(`El -CHO del C${i + 1} está dentro de la cadena, así que se nombra «${PREFIX.oxo}-» (se usaría «${clean(GROUPS.aldehyde.prefijo)}-» si fuera una ramificación).`)
        } else {
          const nm = t === 'amide' ? PREFIX.carbamoil : t === 'nitrile' ? PREFIX.ciano : `(${ALKYLS[TERMINALS[c.term].alkyl].alkoxy}carbonil)`
          if (i === 0) {
            lo = 1
            extraPrefixes.push({ name: nm, idx: 1 })
          } else {
            hi = n - 2
            extraPrefixes.push({ name: nm, idx: n - 2 })
          }
          notes.push(`El carbono de ${GROUPS[t].grupo.toLowerCase()} (C${i + 1}) queda fuera de la cadena y se nombra como sustituyente «${nm}-».`)
        }
      }
    }
    const m = hi - lo + 1
    const stem = chainPrefix.get(m) ?? `C${m}`

    const principalIdx = SUFFIX_TYPES.includes(principal) ? present[principal] : []
    const prefixes = [...extraPrefixes]
    for (let i = lo; i <= hi; i++) for (const s of model.carbons[i].subs) prefixes.push(...subPrefixes(s, i, principal))

    // ── Paso 3: numeración (menor locante: principal → insaturaciones → prefijos → alfabético) ──
    const evaluate = (dir) => {
      const loc = (idx) => (dir === 'f' ? idx - lo + 1 : hi - idx + 1)
      const pLocs = principalIdx.map(loc).sort(num)
      if (principalIsTerminal && !pLocs.includes(1)) return null
      const enLocs = enBonds.map((i) => Math.min(loc(i), loc(i + 1))).sort(num)
      const yneLocs = yneBonds.map((i) => Math.min(loc(i), loc(i + 1))).sort(num)
      const subs = prefixes.map((p) => ({ name: p.name, loc: p.idx === 'N' ? 'N' : loc(p.idx) }))
      const numeric = subs.filter((s) => s.loc !== 'N')
      const key = [
        pLocs,
        [...enLocs, ...yneLocs].sort(num),
        numeric.map((s) => s.loc).sort(num),
        [...numeric].sort((a, b) => cmpName(a.name, b.name) || a.loc - b.loc).map((s) => s.loc),
      ]
      return { dir, loc, pLocs, enLocs, yneLocs, subs, key }
    }
    const cands = ['f', 'r'].map(evaluate).filter(Boolean)
    cands.sort((a, b) => {
      for (let k = 0; k < 4; k++) {
        const c = cmpArr(a.key[k], b.key[k])
        if (c) return c
      }
      return a.dir === 'f' ? -1 : 1
    })
    const best = cands[0]
    const symmetric = cands.length === 2 && cands.every((c, _, arr) => arr[0].key.every((k, i) => cmpArr(k, arr[1].key[i]) === 0))
    const { pLocs, enLocs, yneLocs, subs, loc } = best

    // ── Pasos 4–5: sustituyentes y ensamblado ────────────────────────────
    const chainSubs = subs.filter((s) => s.loc !== 'N')
    const elementsTotal = enLocs.length + yneLocs.length + (hasSuffix ? principalIdx.length : 0) + chainSubs.length
    const single = elementsTotal === 1
    const full = !!opts.full

    const parts = []
    if (enLocs.length) parts.push({ locs: enLocs, text: mult(enLocs.length) + UNSAT.ene, type: 'ene' })
    if (yneLocs.length) parts.push({ locs: yneLocs, text: mult(yneLocs.length) + UNSAT.yne, type: 'yne' })
    let base
    if (!parts.length) base = stem + UNSAT.ane
    else {
      const showUnsat = full || !(single && uniquePositions(parts[0].type, m) === 1)
      base = stem + (parts[0].locs.length > 1 ? 'a' : '')
      parts.forEach((p) => {
        base += (showUnsat ? `-${p.locs.join(',')}-` : '') + p.text
      })
    }

    let core
    let suffixTail = ''
    if (hasSuffix) {
      const suffixText = mult(principalIdx.length) + SUFFIX[principal]
      const showLocs = !principalIsTerminal && (full || !(single && uniquePositions(principal, m) === 1))
      const locText = showLocs ? `-${pLocs.join(',')}-` : ''
      const startsVowel = /^[aeiou]/.test(suffixText)
      suffixTail = locText + suffixText
      core = base + (startsVowel ? '' : 'o') + suffixTail
    } else {
      core = base + 'o'
    }

    // Los locantes numéricos de los prefijos se omiten cuando no hay ambigüedad: clorometano, cloroetano
    const omitNumeric = !full && (m === 1 || (m === 2 && elementsTotal === 1))
    const grouped = {}
    subs.forEach((s) => (grouped[s.name] ??= []).push(s.loc))
    const prefNames = Object.keys(grouped).sort(cmpName)
    const prefText = prefNames
      .map((nm) => {
        const locs = [...grouped[nm]].sort(locSort)
        const shown = omitNumeric ? locs.filter((l) => l === 'N') : locs
        return `${shown.length ? `${shown.join(',')}-` : ''}${mult(locs.length)}${nm}`
      })
      .join('-')

    let descriptor = ''
    const stereo = stereogenicBonds(model)
    if (stereo.length === 1 && !opts.noStereo) descriptor = `(${Math.min(loc(stereo[0]), loc(stereo[0] + 1))}${model.stereo})-`

    const acidWord = principal === 'acid' ? 'ácido ' : ''
    const esterTerm = principal === 'ester' ? model.carbons.map((c) => c.term).find((t) => t && TERMINALS[t].type === 'ester') : null
    const esterWord = esterTerm ? ` de ${ALKYLS[TERMINALS[esterTerm].alkyl].ester}` : ''
    const name = acidWord + descriptor + prefText + core + esterWord

    // Advertencias didácticas: la cadena principal debe ser la más larga
    const warnings = []
    if (principal === 'ether') {
      const longest = Math.max(...model.carbons.flatMap((c) => c.subs.filter((s) => kindOf(s) === 'alkoxy').map((s) => ALKYLS[SUBSTITUENTS[s].alkyl].carbons)))
      if (longest > m)
        warnings.push(`Ojo: el grupo alcoxi tiene ${longest} carbonos y la cadena sólo ${m}. En IUPAC la cadena principal es la más larga: intercambia los roles (cadena ↔ alcoxi) para obtener el nombre estándar.`)
    }
    if (principal === 'amine') {
      const s = model.carbons.flatMap((c) => c.subs).find((x) => kindOf(x) === 'amineN')
      if (s) {
        const longest = Math.max(...SUBSTITUENTS[s].alkyls.map((k) => ALKYLS[k].carbons))
        if (longest > m)
          warnings.push(`Ojo: el sustituyente del nitrógeno (${longest} C) es más largo que la cadena (${m} C). La cadena principal debe ser la más larga; intercambia los roles.`)
      }
    }

    // Trazas didácticas (una por paso del algoritmo del JSON)
    const g = GROUPS[principal]
    const others = ranked.slice(1).filter((t) => t !== 'ene' && t !== 'yne')
    const pasos = reglas.pasos_algoritmo_nombrado ?? []
    const halogenNote = halogens.length
      ? ` Los halógenos (${[...new Set(halogens.map((h) => HALOGENS[h.s].name))].join(', ')}) no tienen sufijo: siempre se nombran como prefijos.`
      : ''
    const step1 =
      principal === 'ane'
        ? halogens.length
          ? `No hay un grupo funcional con sufijo: la cadena es un ${g.grupo.toLowerCase()} (prioridad ${g.prioridad}) y los halógenos pasan a prefijos.`
          : `No hay grupos funcionales: es un ${g.grupo.toLowerCase()} (prioridad ${g.prioridad}) → sufijo «-${UNSAT.ane}o».`
        : principal === 'ether'
          ? `Grupo principal: ${g.grupo} (prioridad ${g.prioridad} de ${reglas.jerarquia_grupos_funcionales.length}). Un éter no tiene sufijo: la cadena más larga es el alcano y la otra parte se nombra como «alcoxi-».`
          : principal === 'ester'
            ? `Grupo principal: ${g.grupo} (prioridad ${g.prioridad} de ${reglas.jerarquia_grupos_funcionales.length}) → «${SUFFIX.ester}» + «de …ilo»: primero el nombre del ácido (cambia -oico por -oato) y luego el grupo alquilo unido al oxígeno.`
            : `Grupo principal: ${g.grupo} (prioridad ${g.prioridad} de ${reglas.jerarquia_grupos_funcionales.length}) → sufijo «${g.sufijo}».`
    const trace = [
      {
        paso: pasos[0] ?? '1. Grupo principal',
        detalle:
          step1 +
          (others.length && principal !== 'ane' ? ` También hay ${others.map((t) => GROUPS[t].grupo.toLowerCase()).join(', ')}: pasan a prefijos.` : '') +
          (principal !== 'ane' ? halogenNote : ''),
      },
      {
        paso: pasos[1] ?? '2. Cadena principal',
        detalle: `Cadena principal de ${m} carbono${m === 1 ? '' : 's'} → raíz «${stem}-».` + (notes.length ? ' ' + notes.join(' ') : ''),
      },
      {
        paso: pasos[2] ?? '3. Numeración',
        detalle: symmetric
          ? 'Ambos sentidos dan los mismos locantes; se numera de izquierda a derecha.'
          : `Se numera desde el extremo ${best.dir === 'f' ? 'izquierdo' : 'derecho'}: da los menores locantes${hasSuffix && !principalIsTerminal ? ` al grupo principal (${pLocs.join(',')})` : principalIsTerminal ? ' (el grupo principal es el C1)' : ' a las insaturaciones o a los sustituyentes'}.`,
      },
      {
        paso: pasos[3] ?? '4. Sustituyentes',
        detalle: prefText ? `Sustituyentes en orden alfabético: ${prefText.replace(/-/g, ' · ')}.` : 'No hay sustituyentes ni ramificaciones.',
      },
      {
        paso: pasos[4] ?? '5. Ensamblado',
        detalle: `[prefijos] + [raíz] + [insaturaciones] + [sufijo] → ${name}`,
      },
    ]

    const unsatPart = core.slice(stem.length, core.length - suffixTail.length)
    return {
      ok: true,
      name,
      pieces: [
        acidWord && { kind: 'acido', text: acidWord.trim() + ' ' },
        descriptor && { kind: 'estereo', text: descriptor },
        prefText && { kind: 'prefijo', text: prefText },
        { kind: 'raiz', text: stem },
        unsatPart && { kind: 'insat', text: unsatPart },
        suffixTail && { kind: 'sufijo', text: suffixTail },
        esterWord && { kind: 'alquilo', text: esterWord },
      ].filter(Boolean),
      principal,
      principalLabel: g.grupo,
      principalPriority: g.prioridad,
      chainLength: m,
      halogens: halogens.length > 0,
      groupsPresent: ranked.map((t) => ({ type: t, label: GROUPS[t].grupo, prioridad: GROUPS[t].prioridad })),
      trace,
      warnings,
      errors: [],
    }
  }

  return { nameChain, GROUPS, PREFIX, chainPrefix }
}
