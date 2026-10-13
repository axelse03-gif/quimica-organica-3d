// Módulo E: manual de estudio con ejemplos que se pueden armar en el Constructor, ver en 3D y practicar.
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Box, CheckCircle2, Circle, ClipboardCheck, Hammer, Lightbulb, TriangleAlert } from 'lucide-react'
import { RULES } from '../data/index.js'
import { buildSections } from '../data/manual.js'
import { modelToGraph, modelToSemidevelopedFormula } from '../lib/chem/chainModel.js'
import { findInDatabase } from '../lib/chem/instance.js'
import { buildMoleculeFromGraph } from '../lib/chem/molecule.js'
import MoleculeStage from '../components/MoleculeStage.jsx'
import Formula from '../components/Formula.jsx'

const DONE_KEY = 'qo3d-manual-done'
const readDone = () => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function Example({ item, onBuild, onOpenCompound }) {
  const [show3d, setShow3d] = useState(false)
  const formula = useMemo(() => modelToSemidevelopedFormula(item.model), [item.model])
  const match = useMemo(() => findInDatabase(modelToGraph(item.model)), [item.model])
  const mol = useMemo(
    () => (show3d ? buildMoleculeFromGraph(modelToGraph(item.model), { seed: item.nombre, stereo: item.model.stereo === 'Z' ? 'cis' : 'trans' }) : null),
    [show3d, item],
  )
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-base font-bold text-slate-900 dark:text-white">{item.nombre}</span>
        <span className="break-all font-mono text-sm text-teal-700 dark:text-teal-300">
          <Formula>{formula}</Formula>
        </span>
      </div>
      {item.porque && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.porque}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-ghost !px-2.5 !py-1 text-xs" onClick={() => onBuild(item.model)}>
          <Hammer size={13} /> Armar en el Constructor
        </button>
        <button type="button" className="btn btn-ghost !px-2.5 !py-1 text-xs" aria-pressed={show3d} onClick={() => setShow3d((v) => !v)}>
          <Box size={13} /> {show3d ? 'Ocultar 3D' : 'Ver en 3D'}
        </button>
        {match && (
          <button type="button" className="btn btn-ghost !px-2.5 !py-1 text-xs" onClick={() => onOpenCompound(match.id)}>
            Abrir en el visor
          </button>
        )}
      </div>
      {show3d && mol && <MoleculeStage key={item.nombre} molecule={mol} className="mt-3 h-[300px]" />}
    </div>
  )
}

function Block({ b, onBuild, onOpenCompound }) {
  switch (b.t) {
    case 'p':
      return <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{b.x}</p>
    case 'ul':
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      )
    case 'pasos':
      return (
        <ol className="space-y-2">
          {b.items.map((x, i) => (
            <li key={x} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">{i + 1}</span>
              <span>{x}</span>
            </li>
          ))}
        </ol>
      )
    case 'tabla':
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800">
                {b.head.map((h, i) => (
                  <th key={`${h}${i}`} className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                  {r.map((c, j) => (
                    <td key={j} className="p-2 text-slate-700 dark:text-slate-300">
                      <Formula>{c}</Formula>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'nota':
      return (
        <div
          className={`flex gap-2 rounded-xl border p-3 text-sm ${
            b.tono === 'error'
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100'
          }`}
        >
          {b.tono === 'error' ? <TriangleAlert size={16} className="mt-0.5 shrink-0" /> : <Lightbulb size={16} className="mt-0.5 shrink-0" />}
          <span>{b.x}</span>
        </div>
      )
    case 'ejemplos':
      return (
        <div className="space-y-2">
          {b.items.map((it) => (
            <Example key={it.nombre} item={it} onBuild={onBuild} onOpenCompound={onOpenCompound} />
          ))}
        </div>
      )
    default:
      return null
  }
}

function FamilySection({ f, onBuild, onOpenCompound, onPractice }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/40 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Grupo funcional</dt>
          <dd className="font-mono">
            <Formula>{f.grupo}</Formula>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sufijo / prefijo</dt>
          <dd>{f.sufijo}</dd>
        </div>
      </dl>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Cómo se nombra</h4>
        <Block b={{ t: 'pasos', items: f.regla }} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Ejemplos resueltos</h4>
        <Block b={{ t: 'ejemplos', items: f.ejemplos }} onBuild={onBuild} onOpenCompound={onOpenCompound} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Errores frecuentes</h4>
        <Block b={{ t: 'ul', items: f.errores }} />
      </div>
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-indigo-900 dark:text-indigo-100">
        <b>Isomería: </b>
        {f.isomeria}
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onPractice([f.familia])}>
        <ClipboardCheck size={16} /> Practicar esta familia
      </button>
    </div>
  )
}

function PriorityTable() {
  const rows = RULES.jerarquia_grupos_funcionales
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800">
            <th className="p-2">Prioridad</th>
            <th className="p-2">Grupo</th>
            <th className="p-2">Fórmula</th>
            <th className="p-2">Sufijo (principal)</th>
            <th className="p-2">Prefijo (secundario)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.prioridad} className="border-b border-slate-100 dark:border-slate-800/60">
              <td className="p-2 font-mono text-slate-500">{g.prioridad}</td>
              <td className="p-2 font-medium text-slate-900 dark:text-white">{g.grupo}</td>
              <td className="p-2 font-mono">
                <Formula>{g.formula_grupo}</Formula>
              </td>
              <td className="p-2">{g.sufijo}</td>
              <td className="p-2">{g.prefijo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * @param {{onBuild: Function, onPractice: Function, onOpenCompound: Function, jump?: {id: string, nonce: number}|null}} props
 */
export default function ManualView({ onBuild, onPractice, onOpenCompound, jump }) {
  const sections = useMemo(() => buildSections(), [])
  const [current, setCurrent] = useState(sections[0].id)
  const [done, setDone] = useState(readDone)

  useEffect(() => {
    if (jump?.id && sections.some((s) => s.id === jump.id)) setCurrent(jump.id)
  }, [jump?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDone = (id) =>
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next))
      } catch {
        /* sin almacenamiento */
      }
      return next
    })

  const idx = sections.findIndex((s) => s.id === current)
  const sec = sections[idx] ?? sections[0]
  const pct = Math.round((done.filter((d) => sections.some((s) => s.id === d)).length / sections.length) * 100)
  const isDone = done.includes(sec.id)

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-20">
        <div className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-slate-900 dark:text-white">
          <BookOpen size={16} className="text-teal-600" /> Manual de estudio
        </div>
        <div className="mb-3 px-1">
          <div className="mb-1 flex justify-between text-[11px] text-slate-500">
            <span>Progreso</span>
            <span aria-label="Progreso del manual">{pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <nav aria-label="Secciones del manual" className="flex gap-1 overflow-x-auto lg:max-h-[70vh] lg:flex-col lg:overflow-y-auto">
          {sections.map((s) => {
            const active = s.id === sec.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrent(s.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {done.includes(s.id) ? <CheckCircle2 size={14} className={active ? '' : 'text-emerald-500'} /> : <Circle size={14} className="opacity-40" />}
                <span className="whitespace-nowrap lg:whitespace-normal">{s.titulo}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <article className="card p-5 sm:p-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Sección {idx + 1} de {sections.length}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{sec.titulo}</h2>
            <p className="mt-1 text-sm text-slate-500">{sec.resumen}</p>
          </div>
          <button
            type="button"
            aria-pressed={isDone}
            onClick={() => toggleDone(sec.id)}
            className={`chip !px-3 !py-1.5 ${isDone ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
          >
            {isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />} {isDone ? 'Estudiada' : 'Marcar como estudiada'}
          </button>
        </header>

        <div className="space-y-4">
          {sec.f ? (
            <FamilySection f={sec.f} onBuild={onBuild} onOpenCompound={onOpenCompound} onPractice={onPractice} />
          ) : (
            <>
              {sec.dinamica === 'prioridad' && <PriorityTable />}
              {sec.bloques.map((b, i) => (
                <Block key={i} b={b} onBuild={onBuild} onOpenCompound={onOpenCompound} />
              ))}
            </>
          )}
        </div>

        <footer className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" className="btn btn-ghost" disabled={idx === 0} onClick={() => setCurrent(sections[idx - 1].id)}>
            ← Anterior
          </button>
          <button type="button" className="btn btn-primary" disabled={idx === sections.length - 1} onClick={() => setCurrent(sections[idx + 1].id)}>
            Siguiente →
          </button>
        </footer>
      </article>
    </div>
  )
}
