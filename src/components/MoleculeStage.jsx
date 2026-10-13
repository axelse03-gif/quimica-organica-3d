// Escenario 3D con barra de herramientas: estilo, H, etiquetas, auto-rotación y reset de vista.
import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Eye, EyeOff, Pause, Play, RotateCcw, Tag } from 'lucide-react'
import MoleculeScene from './MoleculeScene.jsx'
import { el } from '../lib/chem/elements.js'

const STYLES = [
  { id: 'ballstick', label: 'Bolas y varillas' },
  { id: 'spacefill', label: 'Espacio lleno' },
  { id: 'sticks', label: 'Varillas' },
]

function ToolButton({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-slate-200 backdrop-blur transition-colors ${
        active ? 'border-teal-400/60 bg-teal-500/25 text-teal-200' : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80'
      }`}
    >
      {children}
    </button>
  )
}

export default function MoleculeStage({ molecule, className = '', overlay = null }) {
  const [style, setStyle] = useState('ballstick')
  const [showH, setShowH] = useState(true)
  const [labels, setLabels] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)

  const legend = useMemo(() => [...new Set(molecule.graph.atoms.map((a) => a.el))], [molecule])

  return (
    <div className={`canvas-stage relative overflow-hidden rounded-2xl border border-slate-700/60 ${className}`}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <MoleculeScene molecule={molecule} style={style} showH={showH} labels={labels} autoRotate={autoRotate} resetSignal={resetSignal} />
        </Suspense>
      </Canvas>

      {/* Barra superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex rounded-xl border border-white/10 bg-slate-900/60 p-0.5 backdrop-blur">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                style === s.id ? 'bg-teal-500/30 text-teal-100' : 'text-slate-300 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-1.5">
          <ToolButton active={showH} onClick={() => setShowH((v) => !v)} title={showH ? 'Ocultar hidrógenos' : 'Mostrar hidrógenos'}>
            {showH ? <Eye size={16} /> : <EyeOff size={16} />}
          </ToolButton>
          <ToolButton active={labels} onClick={() => setLabels((v) => !v)} title="Etiquetas de elemento">
            <Tag size={16} />
          </ToolButton>
          <ToolButton active={autoRotate} onClick={() => setAutoRotate((v) => !v)} title={autoRotate ? 'Detener rotación' : 'Rotación automática'}>
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
          </ToolButton>
          <ToolButton onClick={() => setResetSignal((v) => v + 1)} title="Restablecer vista">
            <RotateCcw size={16} />
          </ToolButton>
        </div>
      </div>

      {overlay}

      {/* Leyenda CPK y ayuda */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3 text-[11px] text-slate-300">
        <div className="flex flex-wrap gap-1.5">
          {legend.map((s) => (
            <span key={s} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-2 py-0.5 backdrop-blur">
              <i className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/30" style={{ background: el(s).color }} />
              {el(s).name}
            </span>
          ))}
        </div>
        <span className="hidden rounded-full bg-slate-900/50 px-2 py-0.5 backdrop-blur sm:inline">
          Arrastrar: rotar · Rueda: zoom · Clic derecho: mover
        </span>
      </div>
    </div>
  )
}
