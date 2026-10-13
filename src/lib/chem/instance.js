// Instancias compartidas por las vistas: el nombrador (con las reglas del JSON) y el índice de la base.
import { COMPOUNDS, RULES } from '../../data/index.js'
import { createNamer } from './nomenclature.js'
import { parseSemidevelopedFormula } from './formulaParser.js'
import { canonicalHash } from './canonical.js'

export const namer = createNamer(RULES)

let dbIndex = null
/** Busca en la base de compuestos una estructura idéntica (por huella canónica). */
export function findInDatabase(graph) {
  if (!dbIndex) {
    dbIndex = new Map(
      COMPOUNDS.map((c) => [
        canonicalHash(parseSemidevelopedFormula(c.formula_semidesarrollada, { familyId: c.familia_id })),
        c,
      ]),
    )
  }
  return dbIndex.get(canonicalHash(graph)) ?? null
}
