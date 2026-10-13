// Módulo F: práctica de parcial. Ejercicios aleatorios (o las hojas del curso) donde se clasifica el compuesto,
// se nombra una fórmula o se construye un nombre dentro del espacio del Constructor.
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Dices,
  FileText,
  Hammer,
  Lightbulb,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react'
import { emptyModel, modelToGraph, modelToSemidevelopedFormula } from '../lib/chem/chainModel.js'
import { buildMoleculeFromGraph } from '../lib/chem/molecule.js'
import { namer } from '../lib/chem/instance.js'
import { HOJAS } from '../data/hojas.js'
import { PRACTICE_FAMILIES, FAMILY_LABEL, FAMILY_SHORT, buildSession, gradeExercise, notaFinal, sessionFromSheet } from '../lib/practice.js'
import ChainEditor from '../components/ChainEditor.jsx'
import NamePanel from '../components/NamePanel.jsx'
import MoleculeStage from '../components/MoleculeStage.jsx'
import Formula from '../components/Formula.jsx'

const BEST_KEY = 'qo3d-practice-best'
const readBest = () => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}')
  } catch {
    return {}
  }
}
const writeBest = (key, nota) => {
  try {
    const b = readBest()
    if (b[key] === undefined || nota > b[key]) localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, [key]: nota }))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const on = 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300'
const off = 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

function Seg({ label, value, setValue, options }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => setValue(o.v)} className={`chip ${value === o.v ? on : off}`}>
            {o.t}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────── Configuración ───────────────────────────────
function Setup({ onStart, preset }) {
  const [source, setSource] = useState('random')
  const [familias, setFamilias] = useState(() => PRACTICE_FAMILIES.map((f) => f.id))
  const [cantidad, setCantidad] = useState(10)
  const [tipos, setTipos] = useState('mixto')
  const [dificultad, setDificultad] = useState('mixto')
  const [estilo, setEstilo] = useState('curso')
  const [mode, setMode] = useState('practica')
  const [seed, setSeed] = useState('')
  const [hoja, setHoja] = useState(HOJAS[0].id)
  const best = readBest()

  useEffect(() => {
    if (preset?.familias?.length) {
      setSource('random')
      setFamilias(preset.familias)
    }
  }, [preset?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setFamilias((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const canStart = source === 'hoja' || familias.length > 0

  const start = () => {
    if (source === 'hoja') {
      const h = HOJAS.find((x) => x.id === hoja)
      onStart({ session: sessionFromSheet(h, namer), mode, key: `hoja:${h.id}`, titulo: h.titulo })
    } else {
      const s = buildSession({ familias, cantidad, tipos, dificultad, estilo, seed: seed.trim() ? seed.trim() : undefined }, namer)
      onStart({ session: s, mode, key: 'aleatoria', titulo: 'Práctica aleatoria' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
          <ClipboardCheck size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Práctica de parcial</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          En cada ejercicio primero <b>clasificas</b> el compuesto en su familia y después lo resuelves: o <b>nombras</b> la fórmula semidesarrollada, o{' '}
          <b>construyes</b> la estructura de un nombre en el mismo espacio del Constructor. Se califica sobre 10.
        </p>
        {Object.keys(best).length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Mejores notas:{' '}
            {Object.entries(best).map(([k, v]) => (
              <span key={k} className="mr-2 whitespace-nowrap">
                {k === 'aleatoria' ? 'Aleatoria' : (HOJAS.find((h) => `hoja:${h.id}` === k)?.corto ?? k)} <b className="text-teal-600 dark:text-teal-300">{v}</b>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="card space-y-5 p-6">
        <Seg
          label="Ejercicios"
          value={source}
          setValue={setSource}
          options={[
            { v: 'random', t: 'Aleatorios (nuevos cada vez)' },
            { v: 'hoja', t: 'Hojas fijas (tus parciales y la práctica)' },
          ]}
        />

        {source === 'hoja' ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {HOJAS.map((h) => (
              <button
                key={h.id}
                type="button"
                aria-pressed={hoja === h.id}
                onClick={() => setHoja(h.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${hoja === h.id ? on : off}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <FileText size={15} /> {h.corto}
                </span>
                <span className="mt-0.5 block text-xs opacity-80">
                  {h.origen} · {h.items.length} ejercicios
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Familias</span>
                <span className="flex gap-3 text-xs">
                  <button type="button" className="text-teal-600 underline underline-offset-2" onClick={() => setFamilias(PRACTICE_FAMILIES.map((f) => f.id))}>
                    todas
                  </button>
                  <button type="button" className="text-slate-500 underline underline-offset-2" onClick={() => setFamilias([])}>
                    ninguna
                  </button>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRACTICE_FAMILIES.map((f) => (
                  <button key={f.id} type="button" aria-pressed={familias.includes(f.id)} onClick={() => toggle(f.id)} className={`chip ${familias.includes(f.id) ? on : off}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Seg label="Cantidad" value={cantidad} setValue={setCantidad} options={[5, 10, 15, 20].map((v) => ({ v, t: String(v) }))} />
              <Seg
                label="Tipo"
                value={tipos}
                setValue={setTipos}
                options={[
                  { v: 'mixto', t: 'Mixto' },
                  { v: 'formula', t: 'Fórmula → nombre' },
                  { v: 'nombre', t: 'Nombre → estructura' },
                ]}
              />
              <Seg
                label="Dificultad"
                value={dificultad}
                setValue={setDificultad}
                options={[
                  { v: 'mixto', t: 'Mixta' },
                  { v: 'basico', t: 'Básica' },
                  { v: 'intermedio', t: 'Intermedia' },
                ]}
              />
              <Seg
                label="Nombres dados como"
                value={estilo}
                setValue={setEstilo}
                options={[
                  { v: 'curso', t: '2-pentanona (curso)' },
                  { v: 'iupac', t: 'pentan-2-ona (IUPAC 2013)' },
                ]}
              />
            </div>
            <label className="block text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">Semilla (opcional)</span>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Misma semilla = mismos ejercicios (para repetir o compartir una práctica)"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </>
        )}

        <Seg
          label="Modo"
          value={mode}
          setValue={setMode}
          options={[
            { v: 'practica', t: 'Práctica (corrección inmediata y ayudas)' },
            { v: 'simulacro', t: 'Simulacro de parcial (sin ayudas, nota al final)' },
          ]}
        />

        <button type="button" className="btn btn-primary w-full !py-3 text-base" disabled={!canStart} onClick={start}>
          <Dices size={18} /> Empezar
        </button>
        {!canStart && <p className="text-center text-xs text-amber-600">Elegí al menos una familia.</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────── Un ejercicio ───────────────────────────────
function Feedback({ ex, grade, mine, onBuild, onManual }) {
  const [show3d, setShow3d] = useState(false)
  const mol = useMemo(
    () => (show3d ? buildMoleculeFromGraph(modelToGraph(ex.model), { seed: ex.hash, stereo: ex.model.stereo === 'Z' ? 'cis' : 'trans' }) : null),
    [show3d, ex],
  )
  const perfect = grade.claseOk && grade.respOk
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${perfect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/5'}`} role="status">
      <div className="flex flex-wrap items-center gap-3">
        {perfect ? <CheckCircle2 className="text-emerald-600" size={22} /> : <XCircle className="text-rose-600" size={22} />}
        <b className="text-base text-slate-900 dark:text-white">{perfect ? '¡Correcto!' : grade.respOk || grade.claseOk ? 'Parcialmente correcto' : 'Incorrecto'}</b>
        <span className="ml-auto font-mono text-sm text-slate-600 dark:text-slate-300">{Math.round(grade.puntos * 100)} / 100 pts</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <li className={grade.claseOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
          {grade.claseOk ? '✓' : '✗'} Clasificación: <b>{FAMILY_LABEL[ex.familia] ?? ex.familia}</b>
          {!grade.claseOk && mine.familia && <span className="text-slate-500"> (elegiste {FAMILY_SHORT[mine.familia] ?? mine.familia})</span>}
        </li>
        <li className={grade.respOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
          {grade.respOk ? '✓' : '✗'} {ex.tipo === 'formula' ? 'Nombre' : 'Estructura'}
          {!grade.respOk && grade.hint && <span className="text-slate-600 dark:text-slate-300"> — {grade.hint}</span>}
        </li>
      </ul>

      <div className="mt-3 grid gap-2 rounded-xl bg-white/60 p-3 text-sm dark:bg-slate-900/50 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Nombre IUPAC</div>
          <div className="font-semibold">{ex.nombre}</div>
          {ex.aceptados.length > 1 && <div className="text-[11px] text-slate-500">También válido: {ex.aceptados.filter((a) => a !== ex.nombre).slice(0, 4).join(' · ')}</div>}
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fórmula</div>
          <div className="font-mono break-all">
            <Formula>{modelToSemidevelopedFormula(ex.model)}</Formula> <span className="text-slate-500">· <Formula>{ex.molecular}</Formula></span>
          </div>
        </div>
      </div>

      <details className="mt-3 text-sm">
        <summary className="flex cursor-pointer items-center gap-1.5 font-medium text-teal-700 dark:text-teal-300">
          <Lightbulb size={14} /> Cómo se llega al nombre
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {ex.traza.map((t, i) => (
            <li key={i}>{t.detalle}</li>
          ))}
        </ol>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-ghost !py-1.5 text-xs" onClick={() => setShow3d((v) => !v)}>
          <Box size={14} /> {show3d ? 'Ocultar 3D' : 'Ver en 3D'}
        </button>
        <button type="button" className="btn btn-ghost !py-1.5 text-xs" onClick={() => onBuild(ex.model)}>
          <Hammer size={14} /> Cargar solución en el Constructor
        </button>
        {onManual && !grade.claseOk && (
          <button type="button" className="btn btn-ghost !py-1.5 text-xs" onClick={() => onManual(ex.familia)}>
            Repasar en el manual
          </button>
        )}
      </div>
      {show3d && mol && <MoleculeStage key={ex.hash} molecule={mol} className="mt-3 h-[320px]" />}
    </div>
  )
}

function Exercise({ ex, index, total, answer, setAnswer, grade, exam, onBuild, onManual }) {
  const [selected, setSelected] = useState(0)
  const locked = !!grade
  const model = answer.model ?? emptyModel(4)

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ejercicio {index + 1} de {total} · {ex.tipo === 'formula' ? 'Fórmula → nombre' : 'Nombre → estructura'}
        </h2>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        {ex.tipo === 'formula' ? (
          <>
            <div className="text-xs text-slate-500">Escribí el nombre IUPAC de:</div>
            <div className="mt-1 break-all font-mono text-2xl font-bold text-slate-900 dark:text-white" data-testid="dado">
              <Formula>{ex.formula}</Formula>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs text-slate-500">Construí la estructura de:</div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white" data-testid="dado">
              {ex.dado}
            </div>
          </>
        )}
      </div>

      <fieldset className="mt-4" disabled={locked}>
        <legend className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">1 · ¿A qué familia pertenece?</legend>
        <div className="flex flex-wrap gap-1.5">
          {PRACTICE_FAMILIES.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={answer.familia === f.id}
              onClick={() => setAnswer({ ...answer, familia: f.id })}
              className={`chip disabled:cursor-not-allowed ${answer.familia === f.id ? on : off}`}
              title={exam ? undefined : f.group}
            >
              {f.short}
              {!exam && <span className="font-mono opacity-60">{f.group}</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">{ex.tipo === 'formula' ? '2 · Nombre IUPAC' : '2 · Estructura'}</div>
        {ex.tipo === 'formula' ? (
          <input
            value={answer.nombre ?? ''}
            disabled={locked}
            onChange={(e) => setAnswer({ ...answer, nombre: e.target.value })}
            aria-label="Nombre IUPAC"
            placeholder="p. ej. 3-metil-2-pentanona"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
          />
        ) : locked ? (
          <NamePanel model={model} variant="live" />
        ) : (
          <div className="space-y-3">
            <ChainEditor
              key={index}
              title="Tu estructura"
              model={model}
              setModel={(v) => setAnswer((prev) => ({ ...prev, touched: true, model: typeof v === 'function' ? v(prev.model ?? emptyModel(4)) : v }))}
              selected={selected}
              setSelected={setSelected}
              onReset={() => setAnswer((prev) => ({ ...prev, touched: false }))}
            />
            {!exam && <NamePanel model={model} variant="live" />}
          </div>
        )}
        {ex.tipo === 'formula' && exam === false && !locked && <p className="mt-1.5 text-xs text-slate-500">Se aceptan los dos estilos: «2-pentanona» y «pentan-2-ona». Los acentos no cuentan.</p>}
      </div>

      {grade && <Feedback ex={ex} grade={grade} mine={answer} onBuild={onBuild} onManual={onManual} />}
    </section>
  )
}

// ─────────────────────────────── Resultados ───────────────────────────────
function Results({ run, answers, grades, seconds, onAgain, onRetryFailed, onSetup, onBuild }) {
  const nota = notaFinal(grades)
  const ex = run.session.ejercicios
  const failed = ex.filter((_, i) => !(grades[i].claseOk && grades[i].respOk))
  const aprob = nota >= 6
  return (
    <div className="space-y-4">
      <section className="card p-6 text-center">
        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-white ${aprob ? 'bg-emerald-600' : 'bg-amber-600'}`}>
          <Trophy size={28} />
        </div>
        <div className="text-sm text-slate-500">{run.titulo} · {run.mode === 'simulacro' ? 'Simulacro' : 'Práctica'} · {fmtTime(seconds)}</div>
        <div className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white" data-testid="nota">
          {nota.toFixed(1)}<span className="text-2xl font-semibold text-slate-400"> / 10</span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {grades.filter((g) => g.claseOk && g.respOk).length} de {ex.length} ejercicios perfectos · clasificación 25 % + respuesta 75 %
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={onAgain}>
            <Dices size={16} /> Otra práctica con la misma configuración
          </button>
          {failed.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={onRetryFailed}>
              <RotateCcw size={16} /> Repetir los {failed.length} que fallé
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onSetup}>
            Cambiar configuración
          </button>
        </div>
      </section>

      <section className="card overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="p-2">#</th>
              <th className="p-2">Dado</th>
              <th className="p-2">Tu respuesta</th>
              <th className="p-2">Resultado</th>
              <th className="p-2">Solución</th>
            </tr>
          </thead>
          <tbody>
            {ex.map((e, i) => {
              const g = grades[i]
              const a = answers[i]
              const mine = e.tipo === 'formula' ? a.nombre || '—' : a.touched && a.model ? modelToSemidevelopedFormula(a.model) : '—'
              return (
                <tr key={i} className="border-b border-slate-100 align-top dark:border-slate-800/60">
                  <td className="p-2 font-mono text-slate-500">{i + 1}</td>
                  <td className="p-2">{e.tipo === 'formula' ? <Formula className="font-mono">{e.formula}</Formula> : e.dado}</td>
                  <td className="p-2">
                    <div className={e.tipo === 'nombre' ? 'font-mono' : ''}>{e.tipo === 'nombre' && mine !== '—' ? <Formula>{mine}</Formula> : mine}</div>
                    <div className="text-[11px] text-slate-500">Clasif.: {a.familia ? FAMILY_SHORT[a.familia] : '—'}</div>
                  </td>
                  <td className="p-2">
                    <span className={`chip ${g.claseOk && g.respOk ? 'border-emerald-500 text-emerald-600' : g.respOk || g.claseOk ? 'border-amber-500 text-amber-600' : 'border-rose-500 text-rose-600'}`}>
                      {Math.round(g.puntos * 100)}%
                    </span>
                    {!g.respOk && g.hint && <div className="mt-1 max-w-[16rem] text-[11px] text-slate-500">{g.hint}</div>}
                  </td>
                  <td className="p-2">
                    <div className="font-semibold">{e.tipo === 'formula' ? e.nombre : <Formula className="font-mono">{modelToSemidevelopedFormula(e.model)}</Formula>}</div>
                    <div className="text-[11px] text-slate-500">{FAMILY_SHORT[e.familia]}</div>
                    <button type="button" className="mt-0.5 text-[11px] font-medium text-teal-600 underline underline-offset-2" onClick={() => onBuild(e.model)}>
                      armar en el Constructor
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// ─────────────────────────────── Vista principal ───────────────────────────────
/**
 * @param {{preset?: {familias: string[], nonce: number}|null, onBuild: Function, onManual?: Function}} props
 */
export default function PracticeView({ preset, onBuild, onManual }) {
  const [run, setRun] = useState(null) // { session, mode, key, titulo }
  const [phase, setPhase] = useState('setup') // setup | play | results
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [grades, setGrades] = useState([]) // null = sin corregir
  const [seconds, setSeconds] = useState(0)
  const topRef = useRef(null)

  useEffect(() => {
    if (phase !== 'play') return undefined
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  const begin = (r) => {
    const n = r.session.ejercicios.length
    if (!n) return
    setRun(r)
    setAnswers(Array.from({ length: n }, () => ({ familia: null, nombre: '', model: null, touched: false })))
    setGrades(Array(n).fill(null))
    setIdx(0)
    setSeconds(0)
    setPhase('play')
  }

  const exam = run?.mode === 'simulacro'
  const exercises = run?.session.ejercicios ?? []

  const gradeOne = (i, list = answers) => {
    const a = list[i]
    return gradeExercise(exercises[i], { familia: a.familia, nombre: a.nombre, model: a.touched ? a.model : null }, namer)
  }

  const check = () => setGrades((g) => g.map((x, i) => (i === idx ? gradeOne(i) : x)))

  const finish = () => {
    const all = exercises.map((_, i) => grades[i] ?? gradeOne(i))
    setGrades(all)
    writeBest(run.key, notaFinal(all))
    setPhase('results')
    topRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }

  const setAnswer = (v) => setAnswers((list) => list.map((a, i) => (i === idx ? (typeof v === 'function' ? v(a) : v) : a)))

  const answered = (i) => {
    const a = answers[i]
    return !!a && (a.familia || a.nombre?.trim() || a.touched)
  }
  const allChecked = !exam && grades.every(Boolean)
  const last = idx === exercises.length - 1

  if (phase === 'setup' || !run) return <Setup onStart={begin} preset={preset} />

  if (phase === 'results')
    return (
      <div ref={topRef}>
        <Results
          run={run}
          answers={answers}
          grades={grades}
          seconds={seconds}
          onBuild={onBuild}
          onSetup={() => setPhase('setup')}
          onAgain={() => {
            if (run.session.hoja) return begin(run)
            const s = buildSession({ ...run.session.opts, seed: undefined }, namer)
            begin({ ...run, session: s })
          }}
          onRetryFailed={() => {
            const failed = exercises.filter((_, i) => !(grades[i].claseOk && grades[i].respOk))
            begin({ ...run, key: `${run.key}:repaso`, session: { ...run.session, ejercicios: failed } })
          }}
        />
      </div>
    )

  const ex = exercises[idx]
  const sinResponder = exercises.filter((_, i) => !answered(i)).length

  return (
    <div className="mx-auto max-w-4xl space-y-4" ref={topRef}>
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <button type="button" className="btn btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => setPhase('setup')} aria-label="Salir de la práctica">
          <ArrowLeft size={14} /> Salir
        </button>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5" aria-label="Progreso">
          {exercises.map((_, i) => {
            const g = grades[i]
            const state = g ? (g.claseOk && g.respOk ? 'bg-emerald-500 text-white' : g.puntos > 0 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white') : answered(i) ? 'bg-teal-500/25 text-teal-800 dark:text-teal-200' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Ir al ejercicio ${i + 1}`}
                aria-current={i === idx ? 'step' : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${state} ${i === idx ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <span className="flex items-center gap-1.5 font-mono text-sm text-slate-600 dark:text-slate-300" aria-label="Tiempo">
          <Timer size={14} /> {fmtTime(seconds)}
        </span>
        <span className={`chip ${exam ? 'border-amber-500 text-amber-600' : 'border-teal-500 text-teal-600'}`}>{exam ? 'Simulacro' : 'Práctica'}</span>
      </div>

      <Exercise key={idx} ex={ex} index={idx} total={exercises.length} answer={answers[idx]} setAnswer={setAnswer} grade={grades[idx]} exam={exam} onBuild={onBuild} onManual={onManual} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
          <ArrowLeft size={16} /> Anterior
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {!exam && !grades[idx] && (
            <button type="button" className="btn btn-primary" onClick={check} disabled={!answered(idx)}>
              <CheckCircle2 size={16} /> Comprobar
            </button>
          )}
          {!last && (
            <button type="button" className={`btn ${!exam && !grades[idx] ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setIdx(idx + 1)}>
              Siguiente <ArrowRight size={16} />
            </button>
          )}
          {(last || allChecked || exam) && (
            <button type="button" className={`btn ${last ? 'btn-primary' : 'btn-ghost'}`} onClick={finish}>
              <Trophy size={16} /> {exam ? 'Entregar y ver nota' : 'Ver resultados'}
            </button>
          )}
        </div>
      </div>
      {exam && sinResponder > 0 && <p className="text-center text-xs text-amber-600">Te quedan {sinResponder} ejercicios sin responder: contarán como 0.</p>}
      {!exam && !allChecked && last && <p className="text-center text-xs text-amber-600">Los ejercicios que no compruebes se corregirán al ver los resultados.</p>}
    </div>
  )
}
