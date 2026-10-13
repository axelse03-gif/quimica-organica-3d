// Módulo B: explorador de familias + teoría interactiva de nomenclatura IUPAC.
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Layers, ListOrdered } from 'lucide-react'
import {
  COMPOUNDS,
  FAMILIES,
  FAMILY_BY_ID,
  FAMILY_TO_GROUP,
  RULES,
  familyColor,
  familyCounts,
  normalize,
} from '../data/index.js'
import Formula from '../components/Formula.jsx'

function Stat({ label, children }) {
  if (!children) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{children}</div>
    </div>
  )
}

function PriorityLadder({ activeGroup }) {
  return (
    <ol className="space-y-1">
      {RULES.jerarquia_grupos_funcionales.map((g) => {
        const active = activeGroup && normalize(g.grupo) === normalize(activeGroup)
        return (
          <li
            key={g.prioridad}
            className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active ? 'bg-teal-500/15 ring-1 ring-teal-500/60' : 'bg-slate-50 dark:bg-slate-950/30'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {g.prioridad}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-slate-100">{g.grupo}</span>
            <Formula className="font-mono text-xs text-slate-500">{g.formula_grupo}</Formula>
            <span className="hidden w-28 truncate text-right font-mono text-xs text-indigo-600 dark:text-indigo-300 sm:block">{g.sufijo}</span>
          </li>
        )
      })}
    </ol>
  )
}

function FamiliesPanel({ onOpenCompound }) {
  const [familyId, setFamilyId] = useState(FAMILIES[0].id)
  const counts = useMemo(familyCounts, [])
  const family = FAMILY_BY_ID[familyId]
  const color = familyColor(familyId)
  const groupName = FAMILY_TO_GROUP[familyId]
  const members = COMPOUNDS.filter((c) => c.familia_id === familyId)

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <nav className="card max-h-[70vh] space-y-1 overflow-y-auto p-2 lg:sticky lg:top-20" aria-label="Familias">
        {FAMILIES.map((f) => {
          const active = f.id === familyId
          const c = familyColor(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFamilyId(f.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                active ? 'font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
              style={active ? { background: `${c}22`, color: c } : undefined}
            >
              <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c }} />
              <span className="min-w-0 flex-1 truncate">{f.nombre}</span>
              <span className="rounded-full bg-slate-200/70 px-1.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {counts[f.id] ?? 0}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="min-w-0 space-y-4">
        <section className="card animate-pop p-5" key={familyId}>
          <div className="flex items-center gap-3">
            <i className="h-10 w-1.5 rounded-full" style={{ background: color }} />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{family.nombre}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{family.tipo_hidrocarburo}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{family.descripcion}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Fórmula general">
              <Formula className="font-mono">{family.formula_general}</Formula>
            </Stat>
            <Stat label="Hibridación del carbono">{family.hibridacion_carbono}</Stat>
            <Stat label="Geometría">{family.geometria}</Stat>
            <Stat label="Grupo funcional">{family.grupo_funcional}</Stat>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <ListOrdered size={16} className="text-teal-600" /> Prioridad IUPAC
            </h3>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {groupName
                ? `Los ${family.nombre.split('(')[0].trim().toLowerCase()} corresponden al grupo «${groupName}».`
                : 'Esta familia no tiene un grupo propio en la jerarquía: se nombra por su esqueleto de carbono.'}
            </p>
            <PriorityLadder activeGroup={groupName} />
          </div>

          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Layers size={16} className="text-indigo-500" /> Compuestos de la base ({members.length})
            </h3>
            <ul className="space-y-2">
              {members.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCompound(c.id)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-teal-500/60 hover:bg-teal-500/5 dark:border-slate-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{c.nombre_iupac}</span>
                      <Formula className="font-mono text-xs text-slate-500">{c.formula_semidesarrollada}</Formula>
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-teal-600 opacity-80 transition group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-teal-300">
                      Ver en 3D <ArrowRight size={14} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

function RootExplorer() {
  const chain = RULES.prefijos_cadena
  const [n, setN] = useState(3)
  const prefix = chain.find((p) => p.carbonos === n)?.prefijo.replace('-', '') ?? ''
  const ane = RULES.jerarquia_grupos_funcionales.find((g) => g.grupo === 'Alcano')?.sufijo.replace('-', '')
  const ene = RULES.jerarquia_grupos_funcionales.find((g) => g.grupo === 'Alqueno')?.sufijo.replace('-', '')
  const yne = RULES.jerarquia_grupos_funcionales.find((g) => g.grupo === 'Alquino')?.sufijo.replace('-', '')
  const ol = RULES.jerarquia_grupos_funcionales.find((g) => g.grupo === 'Alcohol')?.sufijo.replace('-', '')
  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm font-medium">
          Carbonos en la cadena
          <input
            type="range"
            min={1}
            max={chain.length}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-44 accent-teal-500"
          />
          <span className="w-6 text-center font-mono text-lg font-bold text-teal-600 dark:text-teal-300">{n}</span>
        </label>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-teal-500/15 px-2 py-1 font-mono font-bold text-teal-700 dark:text-teal-300">{prefix}-</span>
          <ArrowRight size={14} className="text-slate-400" />
          <span className="font-semibold">{prefix + ane}</span>
          {n >= 2 && <span className="text-slate-500">· {prefix + ene}</span>}
          {n >= 2 && <span className="text-slate-500">· {prefix + yne}</span>}
          <span className="text-slate-500">· {prefix + 'an' + ol}</span>
        </div>
      </div>
    </div>
  )
}

function TheoryPanel() {
  const steps = RULES.pasos_algoritmo_nombrado
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <BookOpen size={18} className="text-teal-600" /> Algoritmo para nombrar un compuesto
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Los 5 pasos de <code>reglas_nomenclatura.pasos_algoritmo_nombrado</code>.</p>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">{i + 1}</span>
              <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{s.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Raíz según el número de carbonos</h2>
        <RootExplorer />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {RULES.prefijos_cadena.map((p) => (
            <div key={p.carbonos} className="rounded-xl border border-slate-200 p-2.5 text-center dark:border-slate-800">
              <div className="text-xs text-slate-500">{p.carbonos} C</div>
              <div className="font-mono text-base font-bold text-teal-700 dark:text-teal-300">{p.prefijo}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden p-5">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Jerarquía de grupos funcionales</h2>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          El grupo de menor número es el <b>principal</b> (da el sufijo); los demás pasan a ser sustituyentes con su prefijo.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                <th className="py-2 pr-3">Prior.</th>
                <th className="py-2 pr-3">Grupo</th>
                <th className="py-2 pr-3">Fórmula</th>
                <th className="py-2 pr-3">Sufijo (principal)</th>
                <th className="py-2">Prefijo (sustituyente)</th>
              </tr>
            </thead>
            <tbody>
              {RULES.jerarquia_grupos_funcionales.map((g) => (
                <tr key={g.prioridad} className="border-b border-slate-100 last:border-0 dark:border-slate-800/70">
                  <td className="py-2 pr-3 font-bold text-teal-600 dark:text-teal-300">{g.prioridad}</td>
                  <td className="py-2 pr-3 font-medium text-slate-900 dark:text-slate-100">{g.grupo}</td>
                  <td className="py-2 pr-3 font-mono">
                    <Formula>{g.formula_grupo}</Formula>
                  </td>
                  <td className="py-2 pr-3 font-mono text-indigo-600 dark:text-indigo-300">{g.sufijo}</td>
                  <td className="py-2 font-mono text-amber-600 dark:text-amber-300">{g.prefijo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default function ExplorerView({ onOpenCompound }) {
  const [tab, setTab] = useState('familias')
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900/70">
        {[
          ['familias', 'Familias de compuestos'],
          ['teoria', 'Teoría de nomenclatura'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'familias' ? <FamiliesPanel onOpenCompound={onOpenCompound} /> : <TheoryPanel />}
    </div>
  )
}
