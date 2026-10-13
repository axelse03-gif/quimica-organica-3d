// Módulo D: modo juego / desafíos (isomería, hibridación, prioridad IUPAC, nomenclatura).
import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight, Flame, Play, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { DATA } from '../data/index.js'
import { CATEGORIES, buildQuestionBank, drawGame } from '../lib/quiz.js'
import Formula from '../components/Formula.jsx'

const BEST_KEY = 'qo3d-best'
const readBest = () => {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const SOURCE_BADGE = {
  json: { label: 'Del JSON', cls: 'bg-teal-500/15 text-teal-700 dark:text-teal-300' },
  generada: { label: 'Generada desde el JSON', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' },
  complementaria: { label: 'Complementaria', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
}

function Menu({ onStart, bank }) {
  const [count, setCount] = useState(10)
  const [cats, setCats] = useState(CATEGORIES)
  const best = readBest()
  const available = bank.filter((q) => cats.includes(q.cat)).length
  const toggle = (c) => setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white">
          <Trophy size={28} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Desafíos de Química Orgánica</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Isomería, hibridación, prioridad de grupos funcionales y nomenclatura. Cada respuesta trae su explicación teórica.
        </p>
        {best.score !== undefined && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Mejor puntaje: <b className="text-teal-600 dark:text-teal-300">{best.score}</b> pts ({best.correct}/{best.total} correctas)
          </p>
        )}
      </div>

      <div className="card space-y-5 p-6">
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Temas</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = cats.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(c)}
                  aria-pressed={on}
                  className={`chip ${on ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Cantidad de preguntas</div>
          <div className="flex gap-2">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`btn ${count === n ? 'btn-primary' : 'btn-ghost'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary w-full !py-3 text-base"
          disabled={cats.length === 0 || available === 0}
          onClick={() => onStart({ count, categories: cats })}
        >
          <Play size={18} /> Comenzar ({Math.min(count, available)} preguntas)
        </button>
        <p className="text-center text-[11px] text-slate-400">
          Banco: {bank.length} preguntas · {bank.filter((q) => q.fuente === 'json').length} del JSON, {bank.filter((q) => q.fuente === 'generada').length} generadas
          desde sus datos y {bank.filter((q) => q.fuente === 'complementaria').length} complementarias.
        </p>
      </div>
    </div>
  )
}

function Play_({ questions, onFinish }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [log, setLog] = useState([])
  const [shake, setShake] = useState(false)

  const q = questions[i]
  const answered = picked !== null
  const isCorrect = answered && picked === q.correcta

  const choose = (opt) => {
    if (answered) return
    setPicked(opt)
    const ok = opt === q.correcta
    const newStreak = ok ? streak + 1 : 0
    const gained = ok ? 100 + Math.min(100, (newStreak - 1) * 25) : 0
    setScore((s) => s + gained)
    setStreak(newStreak)
    setBestStreak((b) => Math.max(b, newStreak))
    setLog((l) => [...l, { q, picked: opt, ok, gained }])
    if (!ok) {
      setShake(true)
      setTimeout(() => setShake(false), 320)
    }
  }

  const next = () => {
    if (i + 1 >= questions.length) {
      const correct = log.filter((x) => x.ok).length
      onFinish({ score, correct, total: questions.length, bestStreak, log })
    } else {
      setI(i + 1)
      setPicked(null)
    }
  }

  const badge = SOURCE_BADGE[q.fuente]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card flex items-center gap-4 px-5 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>
              Pregunta {i + 1} de {questions.length}
            </span>
            <span>{q.cat}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all" style={{ width: `${((i + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400" title="Racha de aciertos">
          <Flame size={16} /> {streak}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Puntos</div>
          <div className="font-mono text-lg font-bold text-teal-600 dark:text-teal-300">{score}</div>
        </div>
      </div>

      <div className={`card p-6 ${shake ? 'animate-shake' : 'animate-pop'}`} key={q.id}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{q.titulo}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
          <Formula>{q.pregunta}</Formula>
        </h3>

        <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Opciones">
          {q.opciones.map((opt, k) => {
            const isPicked = picked === opt
            const isRight = opt === q.correcta
            let cls = 'border-slate-200 hover:border-teal-500 hover:bg-teal-500/5 dark:border-slate-700'
            if (answered) {
              if (isRight) cls = 'border-emerald-500 bg-emerald-500/10'
              else if (isPicked) cls = 'border-red-500 bg-red-500/10'
              else cls = 'border-slate-200 opacity-55 dark:border-slate-800'
            }
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={answered}
                onClick={() => choose(opt)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all ${cls}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {'ABCD'[k]}
                </span>
                <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                  <Formula>{opt}</Formula>
                </span>
                {answered && isRight && <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />}
                {answered && isPicked && !isRight && <XCircle size={20} className="shrink-0 text-red-500" />}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`mt-5 animate-pop rounded-xl border p-4 ${isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
            <div className={`mb-1 text-sm font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              {isCorrect ? `¡Correcto! +${log[log.length - 1]?.gained ?? 0} pts` : 'No es esa'}
            </div>
            {!isCorrect && (
              <p className="mb-1 text-sm text-slate-700 dark:text-slate-200">
                Respuesta correcta: <b><Formula>{q.correcta}</Formula></b>
              </p>
            )}
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              <Formula>{q.explicacion}</Formula>
            </p>
            <button type="button" className="btn btn-primary mt-4" onClick={next} autoFocus>
              {i + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'} <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Result({ res, onAgain, onMenu }) {
  const pct = Math.round((res.correct / res.total) * 100)
  const byCat = useMemo(() => {
    const m = {}
    res.log.forEach((l) => {
      m[l.q.cat] ??= { ok: 0, n: 0 }
      m[l.q.cat].n++
      if (l.ok) m[l.q.cat].ok++
    })
    return m
  }, [res])
  const wrong = res.log.filter((l) => !l.ok)
  const verdict = pct === 100 ? '¡Perfecto!' : pct >= 70 ? '¡Muy bien!' : pct >= 40 ? 'Vas por buen camino' : 'A repasar un poco más'

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card animate-pop p-6 text-center">
        <Trophy size={36} className="mx-auto text-amber-500" />
        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{verdict}</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ['Puntaje', res.score],
            ['Aciertos', `${res.correct}/${res.total}`],
            ['Mejor racha', res.bestStreak],
          ].map(([label, v]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
              <div className="font-mono text-2xl font-bold text-teal-600 dark:text-teal-300">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-2 text-left">
          {Object.entries(byCat).map(([c, v]) => (
            <div key={c}>
              <div className="mb-0.5 flex justify-between text-xs text-slate-500">
                <span>{c}</span>
                <span>
                  {v.ok}/{v.n}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${(v.ok / v.n) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={onAgain}>
            <RotateCcw size={16} /> Jugar de nuevo
          </button>
          <button type="button" className="btn btn-ghost" onClick={onMenu}>
            Cambiar temas
          </button>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Para repasar ({wrong.length})</h3>
          <ul className="space-y-3">
            {wrong.map((l) => (
              <li key={l.q.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  <Formula>{l.q.pregunta}</Formula>
                </div>
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Tu respuesta: <Formula>{l.picked}</Formula>
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Correcta: <Formula>{l.q.correcta}</Formula>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  <Formula>{l.q.explicacion}</Formula>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function QuizView() {
  const bank = useMemo(() => buildQuestionBank(DATA), [])
  const [phase, setPhase] = useState('menu')
  const [config, setConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [result, setResult] = useState(null)
  const [round, setRound] = useState(0)

  const start = (cfg) => {
    setConfig(cfg)
    setQuestions(drawGame(bank, cfg))
    setRound((r) => r + 1)
    setPhase('play')
  }

  const finish = (res) => {
    setResult(res)
    setPhase('result')
    try {
      const best = readBest()
      if (best.score === undefined || res.score > best.score) {
        localStorage.setItem(BEST_KEY, JSON.stringify({ score: res.score, correct: res.correct, total: res.total }))
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }

  if (phase === 'play') return <Play_ key={round} questions={questions} onFinish={finish} />
  if (phase === 'result') return <Result res={result} onAgain={() => start(config)} onMenu={() => setPhase('menu')} />
  return <Menu bank={bank} onStart={start} />
}
