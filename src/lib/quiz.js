// Banco de preguntas: JSON (fichas_didacticas_desafios) + generadas desde el JSON + complementarias.
import { COMPLEMENTARIAS } from '../data/complementarios.js'

export const CATEGORIES = ['Isomería', 'Hibridación y geometría', 'Prioridad IUPAC', 'Nomenclatura', 'Familias y fórmulas']

const CATEGORY_BY_CHALLENGE = {
  desafio_01: 'Isomería',
  desafio_02: 'Prioridad IUPAC',
  desafio_03: 'Hibridación y geometría',
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = (arr, k, exclude = [], rng = Math.random) =>
  shuffle(
    [...new Set(arr)].filter((x) => !exclude.includes(x)),
    rng,
  ).slice(0, k)

function make(base, distractors, rng) {
  const opts = [base.correcta, ...pick(distractors, 3, [base.correcta], rng)]
  return { ...base, opciones: opts }
}

/** Construye el banco completo a partir de los datos. */
export function buildQuestionBank(data, rng = Math.random) {
  const bank = []

  // 1) Desafíos del JSON, tal cual
  for (const d of data.fichas_didacticas_desafios) {
    bank.push({
      id: d.id,
      cat: CATEGORY_BY_CHALLENGE[d.id] ?? 'Familias y fórmulas',
      fuente: 'json',
      titulo: d.titulo,
      pregunta: d.pregunta,
      opciones: d.opciones,
      correcta: d.respuesta_correcta,
      explicacion: d.explicacion,
    })
  }

  // 2) Complementarias (isomería, hibridación)
  for (const d of COMPLEMENTARIAS) {
    bank.push({
      id: d.id,
      cat: d.categoria,
      fuente: 'complementaria',
      titulo: d.titulo,
      pregunta: d.pregunta,
      opciones: d.opciones,
      correcta: d.respuesta_correcta,
      explicacion: d.explicacion,
    })
  }

  const fam = data.familias_y_grupos
  const rules = data.reglas_nomenclatura
  const groups = rules.jerarquia_grupos_funcionales
  const comps = data.base_compuestos
  const clean = (s) => s.split('/')[0].trim()

  // 3) Hibridación + geometría por familia
  const withGeo = fam.filter((f) => f.hibridacion_carbono && f.geometria)
  const pair = (f) => `${f.hibridacion_carbono} · ${f.geometria}`
  for (const f of withGeo) {
    bank.push(
      make(
        {
          id: `gen_hib_${f.id}`,
          cat: 'Hibridación y geometría',
          fuente: 'generada',
          titulo: `Hibridación de ${f.nombre.split('(')[0].trim()}`,
          pregunta: `¿Qué hibridación y geometría caracterizan a los carbonos de los ${f.nombre.split('(')[0].trim().toLowerCase()}?`,
          correcta: pair(f),
          explicacion: `${f.descripcion} Hibridación ${f.hibridacion_carbono}, geometría ${f.geometria}.`,
        },
        withGeo.map(pair),
        rng,
      ),
    )
  }

  // 4) Fórmula general (sólo familias con fórmula única)
  const formulaCount = {}
  fam.forEach((f) => (formulaCount[f.formula_general] = (formulaCount[f.formula_general] ?? 0) + 1))
  const uniqueFormula = fam.filter((f) => formulaCount[f.formula_general] === 1)
  for (const f of uniqueFormula) {
    bank.push(
      make(
        {
          id: `gen_fg_${f.id}`,
          cat: 'Familias y fórmulas',
          fuente: 'generada',
          titulo: `Fórmula general: ${f.nombre.split('(')[0].trim()}`,
          pregunta: `¿Cuál es la fórmula general de los ${f.nombre.split('(')[0].trim().toLowerCase()}?`,
          correcta: f.formula_general,
          explicacion: `${f.nombre}: ${f.formula_general}. ${f.descripcion}`,
        },
        uniqueFormula.map((x) => x.formula_general),
        rng,
      ),
    )
  }

  // 5) Prioridad entre grupos funcionales (4 grupos al azar → mayor prioridad)
  for (let k = 0; k < 8; k++) {
    const four = shuffle(groups, rng).slice(0, 4)
    const top = [...four].sort((a, b) => a.prioridad - b.prioridad)[0]
    bank.push({
      id: `gen_prio_${k}`,
      cat: 'Prioridad IUPAC',
      fuente: 'generada',
      titulo: 'Jerarquía de grupos funcionales',
      pregunta: '¿Cuál de estos grupos funcionales tiene MAYOR prioridad para ser el grupo principal en la nomenclatura IUPAC?',
      opciones: four.map((g) => `${g.grupo} (${g.formula_grupo})`),
      correcta: `${top.grupo} (${top.formula_grupo})`,
      explicacion: `Prioridades: ${[...four]
        .sort((a, b) => a.prioridad - b.prioridad)
        .map((g) => `${g.grupo} = ${g.prioridad}`)
        .join(' < ')}. El número menor indica mayor jerarquía.`,
    })
  }

  // 6) Sufijos y prefijos por grupo
  for (const g of groups) {
    bank.push(
      make(
        {
          id: `gen_suf_${g.prioridad}`,
          cat: 'Nomenclatura',
          fuente: 'generada',
          titulo: `Sufijo de ${g.grupo.toLowerCase()}`,
          pregunta: `¿Qué sufijo se usa cuando el grupo principal es ${g.grupo.toLowerCase()} (${g.formula_grupo})?`,
          correcta: clean(g.sufijo),
          explicacion: `El grupo ${g.grupo.toLowerCase()} (${g.formula_grupo}) tiene prioridad ${g.prioridad} y su sufijo es «${g.sufijo}».`,
        },
        groups.map((x) => clean(x.sufijo)),
        rng,
      ),
    )
    if (g.prioridad > 1 && g.grupo !== 'Alcano') {
      bank.push(
        make(
          {
            id: `gen_pre_${g.prioridad}`,
            cat: 'Nomenclatura',
            fuente: 'generada',
            titulo: `Prefijo de ${g.grupo.toLowerCase()}`,
            pregunta: `Cuando el ${g.grupo.toLowerCase()} (${g.formula_grupo}) NO es el grupo principal, ¿con qué prefijo se nombra como sustituyente?`,
            correcta: g.prefijo,
            explicacion: `Un grupo de menor prioridad se nombra como sustituyente con el prefijo «${g.prefijo}».`,
          },
          groups.map((x) => x.prefijo),
          rng,
        ),
      )
    }
  }

  // 7) Raíz según número de carbonos
  const chain = rules.prefijos_cadena
  for (const p of chain.slice(0, 10)) {
    bank.push(
      make(
        {
          id: `gen_raiz_${p.carbonos}`,
          cat: 'Nomenclatura',
          fuente: 'generada',
          titulo: 'Raíz de la cadena',
          pregunta: `¿Qué raíz se usa para una cadena principal de ${p.carbonos} carbono${p.carbonos === 1 ? '' : 's'}?`,
          correcta: p.prefijo,
          explicacion: `${p.carbonos} carbono${p.carbonos === 1 ? '' : 's'} → «${p.prefijo}».`,
        },
        chain.slice(0, 10).map((x) => x.prefijo),
        rng,
      ),
    )
  }

  // 8) Compuestos: fórmula ↔ nombre ↔ nombre común ↔ carbonos
  for (const c of comps) {
    const others = comps.filter((x) => x.id !== c.id)
    bank.push(
      make(
        {
          id: `gen_fx_${c.id}`,
          cat: 'Nomenclatura',
          fuente: 'generada',
          titulo: 'Fórmula → nombre IUPAC',
          pregunta: `¿Cuál es el nombre IUPAC de ${c.formula_semidesarrollada} (${c.formula_molecular})?`,
          correcta: c.nombre_iupac,
          explicacion: `${c.formula_semidesarrollada} es ${c.nombre_iupac}${c.nombre_comun && c.nombre_comun !== c.nombre_iupac ? ` (nombre común: ${c.nombre_comun})` : ''}.`,
        },
        others.map((x) => x.nombre_iupac),
        rng,
      ),
    )
    if (c.nombre_comun && c.nombre_comun !== c.nombre_iupac) {
      bank.push(
        make(
          {
            id: `gen_cm_${c.id}`,
            cat: 'Familias y fórmulas',
            fuente: 'generada',
            titulo: 'Nombre común → IUPAC',
            pregunta: `¿Qué compuesto es conocido como «${c.nombre_comun}»?`,
            correcta: c.nombre_iupac,
            explicacion: `«${c.nombre_comun}» es el nombre común del ${c.nombre_iupac} (${c.formula_semidesarrollada}).`,
          },
          others.filter((x) => x.nombre_iupac !== x.nombre_comun).map((x) => x.nombre_iupac),
          rng,
        ),
      )
    }
  }

  return bank
}

/** Selecciona `count` preguntas variadas, evitando concentrar demasiadas del mismo tipo. */
export function drawGame(bank, { count = 10, categories = CATEGORIES } = {}, rng = Math.random) {
  const pool = shuffle(
    bank.filter((q) => categories.includes(q.cat)),
    rng,
  )
  // Prioriza preguntas del JSON y complementarias, y limita las generadas repetitivas por prefijo de id
  const perKind = {}
  const picked = []
  const cap = Math.max(2, Math.ceil(count / 4))
  for (const q of pool) {
    const kind = q.id.replace(/_[^_]+$/, '')
    perKind[kind] = (perKind[kind] ?? 0) + 1
    if (q.fuente === 'generada' && perKind[kind] > cap) continue
    picked.push(q)
    if (picked.length >= count) break
  }
  return picked.map((q) => ({ ...q, opciones: shuffle(q.opciones, rng) }))
}
