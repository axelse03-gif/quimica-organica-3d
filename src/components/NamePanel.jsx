// Nombre IUPAC dinámico de una estructura del constructor, con fórmulas, grupo principal y traza del algoritmo.
import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import { modelToGraph, modelToSemidevelopedFormula, stereogenicBonds } from '../lib/chem/chainModel.js'
import { formulaString } from '../lib/chem/graph.js'
import { findInDatabase, namer } from '../lib/chem/instance.js'
import Formula from './Formula.jsx'

export const PIECE_STYLES = {
  acido: 'text-slate-500 dark:text-slate-400',
  estereo: 'text-pink-600 dark:text-pink-300',
  prefijo: 'text-amber-600 dark:text-amber-300',
  raiz: 'text-teal-600 dark:text-teal-300',
  insat: 'text-violet-600 dark:text-violet-300',
  sufijo: 'text-rose-600 dark:text-rose-300',
  alquilo: 'text-sky-600 dark:text-sky-300',
}
const PIECE_LABELS = { prefijo: 'sustituyentes', raiz: 'raíz', insat: 'insaturación', sufijo: 'sufijo principal', alquilo: 'grupo alquilo (éster)' }

function tipsFor(model, result) {
  const tips = []
  const hasUnsat = model.bonds.some((b) => b > 1)
  const nonUnsat = result.groupsPresent.filter((g) => g.type !== 'ene' && g.type !== 'yne')
  const subs = model.carbons.flatMap((c) => c.subs)
  if (!hasUnsat && nonUnsat.length === 0 && !result.halogens && !subs.length) tips.push('Haz clic en un símbolo —, = o ≡ entre carbonos para crear un alqueno (-eno) o un alquino (-ino).')
  if (nonUnsat.length > 1)
    tips.push(`Hay ${nonUnsat.length} grupos funcionales: el principal es «${result.principalLabel}» (prioridad ${result.principalPriority}); los demás se nombran con prefijo.`)
  if (subs.includes('OH') && model.n >= 3 && result.principal === 'alcohol') tips.push('Mueve el -OH a otro carbono: obtendrás un isómero de posición con distinto locante.')
  if (!subs.includes('CH3') && model.n >= 4 && !subs.length) tips.push('Agrega un -CH3 a un carbono interno para formar un isómero de cadena ramificado.')
  if (stereogenicBonds(model).length) tips.push('Este doble enlace admite isomería geométrica: cambia entre E (trans) y Z (cis).')
  if (result.principal === 'ether') tips.push('Un éter no tiene sufijo: la parte más corta se nombra como «alcoxi-» y la más larga es la cadena. Es isómero de función de un alcohol.')
  if (result.principal === 'ester') tips.push('En un éster el nombre empieza por el ácido (-oato) y termina con «de» + el grupo unido al oxígeno (-ilo).')
  if (result.halogens) tips.push('Los halógenos (flúor, cloro, bromo, yodo) nunca son sufijo: siempre prefijos, en orden alfabético con el resto.')
  if (!nonUnsat.length && hasUnsat && model.n >= 3) tips.push('Prueba a añadir un grupo (-OH, =O, -NH2…): el sufijo pasará del -eno al del grupo de mayor prioridad.')
  return tips
}

/**
 * @param {{model: object, onOpenCompound?: Function, variant?: 'full'|'live', title?: string}} props
 */
export default function NamePanel({ model, onOpenCompound, variant = 'full', title = '2 · Nombre IUPAC' }) {
  const result = useMemo(() => namer.nameChain(model), [model])
  const graph = useMemo(() => modelToGraph(model), [model])
  const molecular = useMemo(() => formulaString(graph.composition()), [graph])
  const semi = useMemo(() => modelToSemidevelopedFormula(model), [model])
  const match = useMemo(() => (variant === 'full' ? findInDatabase(graph) : null), [graph, variant])

  const nameBlock = result.ok ? (
    <>
      <div className={`break-words font-bold leading-tight tracking-tight ${variant === 'full' ? 'mt-3 text-3xl' : 'text-2xl'}`} aria-live="polite">
        {result.pieces.map((p, i) => (
          <span key={i} className={PIECE_STYLES[p.kind]}>
            {p.text}
          </span>
        ))}
      </div>
      {variant === 'full' && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {Object.entries(PIECE_LABELS).map(([k, label]) => (
            <span key={k} className={`flex items-center gap-1 ${PIECE_STYLES[k]}`}>
              <i className="h-2 w-2 rounded-full bg-current" /> {label}
            </span>
          ))}
        </div>
      )}
    </>
  ) : null

  if (variant === 'live') {
    return (
      <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nombre de lo que armaste</div>
        {result.ok ? (
          <>
            {nameBlock}
            <div className="mt-1 break-all font-mono text-sm text-slate-600 dark:text-slate-300">
              <Formula>{semi}</Formula>
            </div>
          </>
        ) : (
          <ul className="mt-1 list-disc pl-5 text-xs text-red-600">
            {result.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const tips = result.ok ? tipsFor(model, result) : []
  return (
    <section className="card p-5">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      {result.ok ? (
        <>
          {nameBlock}

          {result.warnings?.length > 0 && (
            <div className="mt-3 space-y-1 rounded-xl border border-orange-500/40 bg-orange-500/10 p-3 text-xs text-orange-900 dark:text-orange-200">
              {result.warnings.map((w) => (
                <p key={w} className="flex gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}
                </p>
              ))}
            </div>
          )}

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fórmula molecular</dt>
              <dd className="font-mono text-base">
                <Formula>{molecular}</Formula>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Semidesarrollada</dt>
              <dd className="break-all font-mono text-base">
                <Formula>{semi}</Formula>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Grupo principal</dt>
              <dd className="text-sm">
                {result.principalLabel}{' '}
                <span className="text-slate-500">
                  (prioridad {result.principalPriority} · cadena de {result.chainLength} C)
                </span>
              </dd>
            </div>
          </dl>

          {match ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 size={16} />
              <span>
                Está en la base: <b>{match.nombre_iupac}</b> ({match.nombre_comun})
              </span>
              {onOpenCompound && (
                <button type="button" className="ml-auto text-xs font-semibold underline underline-offset-2" onClick={() => onOpenCompound(match.id)}>
                  Abrir en el visor
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
              Esta estructura no figura en la base de 19 compuestos, pero igualmente se puede nombrar y renderizar.
            </div>
          )}

          <ol className="mt-4 space-y-2">
            {result.trace.map((t, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">{i + 1}</span>
                <span className="text-slate-700 dark:text-slate-300">{t.detalle}</span>
              </li>
            ))}
          </ol>

          {tips.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <Lightbulb size={14} /> Sugerencias
              </div>
              {tips.slice(0, 3).map((t) => (
                <p key={t} className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
                  {t}
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <ul className="mt-3 list-disc pl-5 text-sm text-red-600">
          {result.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
