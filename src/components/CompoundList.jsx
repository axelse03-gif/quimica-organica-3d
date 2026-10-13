// Buscador en tiempo real + filtro por familia + lista de compuestos.
import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { COMPOUNDS, FAMILIES, familyColor, familyCounts, searchCompounds } from '../data/index.js'
import Formula from './Formula.jsx'

export default function CompoundList({ query, setQuery, family, setFamily, selectedId, onSelect, className = '' }) {
  const results = useMemo(() => searchCompounds(query, family), [query, family])
  const counts = useMemo(familyCounts, [])

  return (
    <aside className={`card flex min-h-0 flex-col ${className}`}>
      <div className="space-y-3 border-b border-slate-200 p-3 dark:border-slate-800">
        <label className="relative block">
          <span className="sr-only">Buscar compuesto</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, fórmula o grupo funcional…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-950/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setFamily(null)}
            className={`chip ${
              !family
                ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Todas · {COMPOUNDS.length}
          </button>
          {FAMILIES.filter((f) => counts[f.id]).map((f) => {
            const active = family === f.id
            const c = familyColor(f.id)
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFamily(active ? null : f.id)}
                className={`chip ${active ? '' : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                style={active ? { borderColor: c, background: `${c}26`, color: c } : undefined}
              >
                <i className="h-2 w-2 rounded-full" style={{ background: c }} />
                {f.nombre.split('(')[0].trim()} · {counts[f.id]}
              </button>
            )
          })}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto p-2" role="listbox" aria-label="Compuestos">
        {results.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            Sin resultados para «{query}».
            <br />
            Prueba con «alcohol», «C3H6O» o «ácido».
          </li>
        )}
        {results.map((c) => {
          const active = c.id === selectedId
          const color = familyColor(c.familia_id)
          return (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(c.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  active ? 'bg-teal-500/15 ring-1 ring-teal-500/50' : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <i className="h-8 w-1 shrink-0 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{c.nombre_iupac}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{c.nombre_comun}</span>
                </span>
                <Formula className="shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">{c.formula_molecular}</Formula>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-800">
        {results.length} de {COMPOUNDS.length} compuestos
      </div>
    </aside>
  )
}
