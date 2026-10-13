// Espacio de construcción: cadena de 1 a 10 carbonos con enlaces, grupos terminales y sustituyentes.
// Lo usan el Constructor (módulo C) y la Práctica de parcial.
import { Minus, Plus, RotateCcw, Wand2 } from 'lucide-react'
import {
  MAX_CARBONS,
  SUBSTITUENTS,
  SUBSTITUENT_GROUPS,
  TERMINALS,
  TERMINAL_GROUPS,
  canAddSub,
  canSetBond,
  canSetTerm,
  carbonLabel,
  carbonState,
  cloneModel,
  emptyModel,
  resizeModel,
  sanitize,
  stereogenicBonds,
  whyNotSub,
} from '../lib/chem/chainModel.js'
import Formula from './Formula.jsx'

const chipOff = 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'

function BondButton({ order, onClick, disabled }) {
  const glyph = { 1: '—', 2: '=', 3: '≡' }[order]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Este enlace no admite otro orden por valencias' : 'Clic: sencillo → doble → triple'}
      aria-label={`Enlace de orden ${order}`}
      className={`mx-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xl font-bold transition-colors ${
        order > 1
          ? 'bg-violet-500/15 text-violet-600 hover:bg-violet-500/25 dark:text-violet-300'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {glyph}
    </button>
  )
}

/**
 * @param {{model: object, setModel: Function, selected: number, setSelected: Function, title?: string, onReset?: Function, children?: any}} props
 *   `setModel` recibe un valor o una función (como el setter de useState).
 */
export default function ChainEditor({ model, setModel, selected, setSelected, title = '1 · Arma la cadena', onReset, children }) {
  const update = (fn) =>
    setModel((prev) => {
      const next = cloneModel(prev)
      fn(next)
      return sanitize(next)
    })

  const sel = Math.min(selected, model.n - 1)
  const state = carbonState(model, sel)
  const isEnd = sel === 0 || sel === model.n - 1
  const car = model.carbons[sel]
  const stereoBonds = stereogenicBonds(model)

  const cycleBond = (i) =>
    update((m) => {
      for (let step = 1; step <= 3; step++) {
        const next = ((m.bonds[i] - 1 + step) % 3) + 1
        if (canSetBond(m, i, next)) {
          m.bonds[i] = next
          return
        }
      }
    })

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <Wand2 size={18} className="text-teal-600" /> {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Carbonos</span>
          <button type="button" className="btn btn-ghost !px-2" aria-label="Quitar un carbono" disabled={model.n <= 1} onClick={() => setModel((m) => resizeModel(m, m.n - 1))}>
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-mono text-xl font-bold text-teal-600 dark:text-teal-300">{model.n}</span>
          <button type="button" className="btn btn-ghost !px-2" aria-label="Añadir un carbono" disabled={model.n >= MAX_CARBONS} onClick={() => setModel((m) => resizeModel(m, m.n + 1))}>
            <Plus size={16} />
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-2"
            aria-label="Reiniciar"
            title="Reiniciar"
            onClick={() => {
              setModel(emptyModel(model.n))
              onReset?.()
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Cadena */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 px-3 py-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mx-auto flex w-max items-start">
          {model.carbons.map((c, i) => {
            const active = i === sel
            const hasFn = !!c.term || c.subs.length > 0
            return (
              <div key={i} className="flex items-start">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-pressed={active}
                    className={`flex h-12 min-w-[3.4rem] items-center justify-center rounded-xl border px-2.5 font-mono text-sm font-semibold transition-all ${
                      active
                        ? 'border-teal-500 bg-teal-500/20 text-teal-800 shadow-[0_0_0_3px_rgb(20_184_166/0.25)] dark:text-teal-100'
                        : hasFn
                          ? 'border-indigo-400/50 bg-indigo-500/10 text-slate-800 hover:border-indigo-400 dark:text-slate-100'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <Formula>{carbonLabel(model, i)}</Formula>
                  </button>
                  <span className="text-[11px] text-slate-400">C{i + 1}</span>
                </div>
                {i < model.n - 1 && (
                  <div className="mt-1.5">
                    <BondButton order={model.bonds[i]} onClick={() => cycleBond(i)} disabled={![1, 2, 3].some((o) => o !== model.bonds[i] && canSetBond(model, i, o))} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor del carbono seleccionado */}
      <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Carbono C{sel + 1}{' '}
            <span className="font-mono text-slate-500">
              · <Formula>{carbonLabel(model, sel)}</Formula>
            </span>
          </h3>
          <span className="text-xs text-slate-500">
            {state.used} de 4 valencias usadas · {state.h} H
          </span>
        </div>

        {isEnd && (
          <div className="mt-3">
            <div className="mb-1.5 text-xs font-medium text-slate-500">Grupo terminal (el carbono forma parte del grupo)</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => update((m) => (m.carbons[sel].term = null))}
                className={`chip ${!car.term ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300' : chipOff}`}
              >
                Ninguno
              </button>
              {TERMINAL_GROUPS.flatMap((g) => g.keys).map((k) => {
                const t = TERMINALS[k]
                const active = car.term === k
                const ok = canSetTerm(model, sel, k)
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={!active && !ok}
                    title={!active && !ok ? 'Quita antes los sustituyentes o dobles/triples enlaces de este carbono (o ya hay un éster)' : t.label}
                    onClick={() => update((m) => (m.carbons[sel].term = active ? null : k))}
                    className={`chip disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : chipOff}`}
                  >
                    {t.label} <Formula className="font-mono">{t.formula}</Formula>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {!car.term && (
          <div className="mt-3 space-y-3">
            {SUBSTITUENT_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-1.5 text-xs font-medium text-slate-500">{group.title}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.keys.map((k) => {
                    const s = SUBSTITUENTS[k]
                    const count = car.subs.filter((x) => x === k).length
                    const can = canAddSub(model, sel, k)
                    const reason = whyNotSub(model, sel, k)
                    return (
                      <div key={k} className="flex items-center">
                        <button
                          type="button"
                          disabled={!can}
                          title={!can ? reason : `Añadir ${s.label}`}
                          onClick={() => update((m) => canAddSub(m, sel, k) && m.carbons[sel].subs.push(k))}
                          className={`chip rounded-r-none disabled:cursor-not-allowed disabled:opacity-40 ${count ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : chipOff}`}
                        >
                          <Plus size={12} /> {s.label} <Formula className="font-mono">{s.formula}</Formula>
                          {count > 0 && <b>×{count}</b>}
                        </button>
                        <button
                          type="button"
                          disabled={count === 0}
                          aria-label={`Quitar ${s.label}`}
                          title={`Quitar ${s.label}`}
                          onClick={() =>
                            update((m) => {
                              const a = m.carbons[sel].subs
                              const ix = a.indexOf(k)
                              if (ix >= 0) a.splice(ix, 1)
                            })
                          }
                          className="chip -ml-px rounded-l-none border-slate-200 px-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {stereoBonds.length > 0 && (
          <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <span className="text-slate-500">Estereoquímica del C=C:</span>
            {['E', 'Z'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update((m) => (m.stereo = s))}
                className={`chip ${model.stereo === s ? 'border-pink-500 bg-pink-500/15 text-pink-700 dark:text-pink-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
              >
                {s} ({s === 'E' ? 'trans' : 'cis'})
              </button>
            ))}
          </div>
        )}
      </div>

      {children}
    </section>
  )
}
