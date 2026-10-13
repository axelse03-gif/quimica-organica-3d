// Módulo C: constructor dinámico de cadenas carbonadas con nomenclatura IUPAC y renderizado 3D.
import { useEffect, useMemo, useState } from 'react'
import { Box, ClipboardCheck, Sparkles } from 'lucide-react'
import { cloneModel, modelToGraph, modelToSemidevelopedFormula, sanitize } from '../lib/chem/chainModel.js'
import { namer } from '../lib/chem/instance.js'
import { buildMoleculeFromGraph } from '../lib/chem/molecule.js'
import { PRESETS } from '../lib/chem/presets.js'
import ChainEditor from '../components/ChainEditor.jsx'
import NamePanel from '../components/NamePanel.jsx'
import MoleculeStage from '../components/MoleculeStage.jsx'
import Formula from '../components/Formula.jsx'

/**
 * @param {{onOpenCompound: Function, onPractice?: Function, initial?: {model: object, nonce: number}|null}} props
 *   `initial`: estructura que llega desde otro módulo (p. ej. «Construir» en el manual)
 */
export default function BuilderView({ onOpenCompound, onPractice, initial }) {
  const [model, setModel] = useState(() => (initial ? sanitize(cloneModel(initial.model)) : PRESETS[0].model()))
  const [selected, setSelected] = useState(initial ? 0 : 1)
  const [rendered, setRendered] = useState(null)

  // Si llega otra estructura mientras el módulo está abierto, se carga
  useEffect(() => {
    if (initial) {
      setModel(sanitize(cloneModel(initial.model)))
      setSelected(0)
      setRendered(null)
    }
  }, [initial?.nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const modelKey = useMemo(() => JSON.stringify(model), [model])
  const result = useMemo(() => namer.nameChain(model), [model])

  const renderNow = () => {
    if (!result.ok) return
    const mol = buildMoleculeFromGraph(modelToGraph(model), { seed: modelKey, stereo: model.stereo === 'Z' ? 'cis' : 'trans' })
    setRendered({ molecule: mol, key: modelKey, name: result.name, formula: modelToSemidevelopedFormula(model) })
  }
  const stale = rendered && rendered.key !== modelKey

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* ─────────── Columna izquierda: ensamblado ─────────── */}
      <div className="space-y-4">
        <ChainEditor model={model} setModel={setModel} selected={selected} setSelected={setSelected} onReset={() => setRendered(null)}>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Sparkles size={13} /> Ejemplos para empezar
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setModel(sanitize(p.model()))
                    setSelected(0)
                  }}
                  className="chip border-slate-200 text-slate-600 hover:border-teal-500 hover:bg-teal-500/10 dark:border-slate-700 dark:text-slate-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </ChainEditor>

        {onPractice && (
          <button
            type="button"
            onClick={() => onPractice()}
            className="card flex w-full items-center gap-3 p-4 text-left transition-colors hover:border-teal-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <ClipboardCheck size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white">¿Practicamos para el parcial?</span>
              <span className="block text-xs text-slate-500">Ejercicios aleatorios: clasifica, nombra fórmulas y construye nombres en este mismo espacio.</span>
            </span>
          </button>
        )}
      </div>

      {/* ─────────── Columna derecha: resultado + 3D ─────────── */}
      <div className="space-y-4">
        <NamePanel model={model} onOpenCompound={onOpenCompound} />

        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Box size={18} className="text-indigo-500" /> 3 · Estructura 3D
            </h2>
            <button type="button" className="btn btn-primary" disabled={!result.ok} onClick={renderNow}>
              <Box size={16} /> {rendered ? 'Actualizar en 3D' : 'Renderizar en 3D'}
            </button>
          </div>
          {stale && (
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              La estructura cambió desde el último renderizado. Pulsa «Actualizar en 3D» para proyectar la versión actual.
            </p>
          )}
          {rendered ? (
            <MoleculeStage
              key={rendered.key}
              molecule={rendered.molecule}
              className="mt-4 h-[420px]"
              overlay={
                <div className="pointer-events-none absolute left-3 top-14 max-w-[70%] rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 backdrop-blur">
                  <div className="truncate text-sm font-semibold text-white">{rendered.name}</div>
                  <Formula className="font-mono text-xs text-teal-300">{rendered.formula}</Formula>
                </div>
              }
            />
          ) : (
            <div className="canvas-stage mt-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-600 px-6 text-center text-sm text-slate-400">
              Arma una cadena y pulsa «Renderizar en 3D» para ver la molécula con sus hidrógenos, enlaces múltiples y geometría.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
