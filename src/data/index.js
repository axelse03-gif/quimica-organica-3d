// Capa de datos: el JSON es la única fuente de verdad. Aquí sólo se derivan índices y utilidades.
import raw from './quimica_organica_3d.json'

export const DATA = raw
export const INFO = raw.plataforma_info
export const RULES = raw.reglas_nomenclatura
export const FAMILIES = raw.familias_y_grupos
export const COMPOUNDS = raw.base_compuestos
export const CHALLENGES = raw.fichas_didacticas_desafios

export const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]))
export const COMPOUND_BY_ID = Object.fromEntries(COMPOUNDS.map((c) => [c.id, c]))

// Relación familia → grupo de la jerarquía IUPAC (por nombre del grupo en el JSON)
export const FAMILY_TO_GROUP = {
  alcanos: 'Alcano',
  alquenos: 'Alqueno',
  alquinos: 'Alquino',
  alcoholes: 'Alcohol',
  eteres: 'Éter',
  aldehidos: 'Aldehído',
  cetonas: 'Cetona',
  acidos_carboxilicos: 'Ácido carboxílico',
  esteres: 'Éster',
  aminas: 'Amina',
  amidas: 'Amida',
  nitrilos: 'Nitrilo',
}

export const normalize = (s = '') =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const PALETTE = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#22c55e', '#0ea5e9', '#f97316', '#a855f7', '#ef4444', '#84cc16', '#06b6d4', '#e11d48', '#8b5cf6', '#10b981']
export const familyColor = (id) => {
  const i = FAMILIES.findIndex((f) => f.id === id)
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length]
}

export function familyName(id) {
  return FAMILY_BY_ID[id]?.nombre ?? id
}

const HAY = new Map(
  COMPOUNDS.map((c) => {
    const f = FAMILY_BY_ID[c.familia_id] ?? {}
    return [
      c.id,
      normalize(
        [
          c.id,
          c.nombre_iupac,
          c.nombre_comun,
          c.formula_molecular,
          c.formula_semidesarrollada,
          f.nombre,
          f.grupo_funcional,
          f.tipo_hidrocarburo,
        ].join(' | '),
      ),
    ]
  }),
)

/** Búsqueda en tiempo real: todos los términos deben aparecer (nombre, fórmula, familia o grupo funcional). */
export function searchCompounds(query, familyId = null) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return COMPOUNDS.filter((c) => {
    if (familyId && c.familia_id !== familyId) return false
    const hay = HAY.get(c.id)
    return terms.every((t) => hay.includes(t))
  })
}

export function familyCounts() {
  const counts = {}
  for (const c of COMPOUNDS) counts[c.familia_id] = (counts[c.familia_id] ?? 0) + 1
  return counts
}

// Etiquetas legibles para las claves de `ficha_didactica`
export const FICHA_LABELS = {
  concepto: 'Concepto',
  aplicacion: 'Aplicación / relevancia',
  relevancia: 'Relevancia',
  geometria: 'Geometría',
  isomeria: 'Isomería',
  regla_nombrar: 'Regla de nombrado',
  propiedad: 'Propiedad',
  quiralidad: 'Quiralidad',
}

export function fichaLabel(key) {
  return FICHA_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
}
