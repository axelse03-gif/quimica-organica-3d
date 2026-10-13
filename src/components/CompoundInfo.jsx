// Panel informativo: nombres, fórmulas, familia (hibridación/geometría), prioridad IUPAC y ficha didáctica.
import { useMemo } from 'react'
import { FAMILY_BY_ID, FAMILY_TO_GROUP, RULES, familyColor, fichaLabel, normalize } from '../data/index.js'
import { buildMolecule } from '../lib/chem/molecule.js'
import Formula from './Formula.jsx'

function Field({ label, children }) {
  if (children === undefined || children === null || children === '') return null
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  )
}

export default function CompoundInfo({ compound }) {
  const family = FAMILY_BY_ID[compound.familia_id]
  const color = familyColor(compound.familia_id)
  const molecule = useMemo(() => buildMolecule(compound), [compound])
  const group = useMemo(() => {
    const name = FAMILY_TO_GROUP[compound.familia_id]
    return name ? RULES.jerarquia_grupos_funcionales.find((g) => normalize(g.grupo) === normalize(name)) : null
  }, [compound])

  const ficha = Object.entries(compound.ficha_didactica ?? {})
  const { matched, provided } = molecule.hints
  const total = molecule.graph.atoms.length

  return (
    <div className="card animate-pop p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{compound.nombre_iupac}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nombre común: <span className="font-medium text-slate-700 dark:text-slate-200">{compound.nombre_comun}</span>
          </p>
        </div>
        <span
          className="chip"
          style={{ borderColor: `${color}66`, background: `${color}1f`, color }}
        >
          <i className="h-2 w-2 rounded-full" style={{ background: color }} />
          {family?.nombre ?? compound.familia_id}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Fórmula molecular">
          <Formula className="font-mono text-base">{compound.formula_molecular}</Formula>
        </Field>
        <Field label="Fórmula semidesarrollada">
          <Formula className="font-mono text-base">{compound.formula_semidesarrollada}</Formula>
        </Field>
        <Field label="Tipo">{family?.tipo_hidrocarburo}</Field>
        <Field label="Fórmula general">
          <Formula className="font-mono">{family?.formula_general}</Formula>
        </Field>
        <Field label="Grupo funcional">{family?.grupo_funcional}</Field>
        <Field label="Átomos">
          {total} ({compound.num_carbonos} C)
        </Field>
        <Field label="Hibridación (familia)">{family?.hibridacion_carbono}</Field>
        <Field label="Geometría (familia)">{family?.geometria}</Field>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-500 dark:text-slate-400">Hibridaciones en esta molécula:</span>
        {molecule.hybridizations.map((h) => (
          <span key={h} className="rounded-md bg-teal-500/15 px-1.5 py-0.5 font-mono font-semibold text-teal-700 dark:text-teal-300">
            {h}
          </span>
        ))}
        {group && (
          <span className="ml-auto rounded-md bg-indigo-500/10 px-2 py-0.5 text-indigo-700 dark:text-indigo-300">
            Prioridad IUPAC {group.prioridad} · sufijo <b>{group.sufijo}</b>
          </span>
        )}
      </div>

      {family?.descripcion && <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{family.descripcion}</p>}

      {ficha.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Ficha didáctica</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {ficha.map(([k, v]) => (
              <div
                key={k}
                className={`rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40 ${
                  k === 'concepto' ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{fichaLabel(k)}</div>
                <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        {matched === total
          ? `Coordenadas 3D: ${matched} de ${total} átomos tomados del JSON (pos_3d_hint).`
          : matched > 0
            ? `Coordenadas 3D: ${matched} átomos de carbono vienen del JSON (pos_3d_hint); el motor completó los ${total - matched} restantes (hidrógenos) con la geometría de cada hibridación.`
            : provided === 0
              ? 'Este compuesto no trae nodos_3d en el JSON: el motor generó la geometría a partir de la fórmula semidesarrollada, las hibridaciones y las longitudes/ángulos de enlace típicos.'
              : 'Coordenadas calculadas por el motor.'}
      </p>
    </div>
  )
}
