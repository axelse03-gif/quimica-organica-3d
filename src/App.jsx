import { useEffect, useState } from 'react'
import { Atom, BookOpen, ClipboardCheck, Gamepad2, Hammer, Library, Moon, Sun } from 'lucide-react'
import { COMPOUNDS, INFO } from './data/index.js'
import ViewerView from './views/ViewerView.jsx'
import ExplorerView from './views/ExplorerView.jsx'
import BuilderView from './views/BuilderView.jsx'
import QuizView from './views/QuizView.jsx'
import ManualView from './views/ManualView.jsx'
import PracticeView from './views/PracticeView.jsx'

const TABS = [
  { id: 'viewer', label: 'Visor 3D', icon: Atom },
  { id: 'explorer', label: 'Familias y nomenclatura', short: 'Familias', icon: Library },
  { id: 'builder', label: 'Constructor', icon: Hammer },
  { id: 'manual', label: 'Manual', icon: BookOpen },
  { id: 'practice', label: 'Práctica', icon: ClipboardCheck },
  { id: 'quiz', label: 'Desafíos', icon: Gamepad2 },
]

export default function App() {
  const [tab, setTab] = useState('viewer')
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState(null)
  const [selectedId, setSelectedId] = useState(COMPOUNDS[0].id)
  // Constructor y Práctica quedan montados una vez visitados, para no perder lo armado al cambiar de pestaña
  const [visited, setVisited] = useState({ builder: false, practice: false })
  const [builderInitial, setBuilderInitial] = useState(null) // { model, nonce }
  const [practicePreset, setPracticePreset] = useState(null) // { familias, nonce }
  const [manualJump, setManualJump] = useState(null) // { id, nonce }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('qo3d-theme', dark ? 'dark' : 'light')
    } catch {
      /* ignorar */
    }
  }, [dark])

  const go = (id) => {
    setTab(id)
    if (id === 'builder' || id === 'practice') setVisited((v) => ({ ...v, [id]: true }))
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }
  const buildInConstructor = (model) => {
    setBuilderInitial({ model, nonce: Date.now() })
    go('builder')
  }
  const practiceFamilies = (familias) => {
    setPracticePreset(familias?.length ? { familias, nonce: Date.now() } : null)
    go('practice')
  }
  const openManual = (familia) => {
    setManualJump(familia ? { id: `fam-${familia}`, nonce: Date.now() } : null)
    go('manual')
  }

  const openCompound = (id) => {
    setQuery('')
    setFamily(null)
    setSelectedId(id)
    setTab('viewer')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-[#070c17]/80">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 text-white shadow-sm">
              <Atom size={20} />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">Química Orgánica 3D</h1>
              <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 md:block">{INFO.titulo}</p>
            </div>
          </div>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto" aria-label="Módulos">
            {TABS.map(({ id, label, short, icon: Icon }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short ?? label}</span>
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-4">
        {tab === 'viewer' && (
          <ViewerView
            query={query}
            setQuery={setQuery}
            family={family}
            setFamily={setFamily}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
        )}
        {tab === 'explorer' && <ExplorerView onOpenCompound={openCompound} />}
        {visited.builder && (
          <div hidden={tab !== 'builder'}>
            <BuilderView onOpenCompound={openCompound} onPractice={() => practiceFamilies(null)} initial={builderInitial} />
          </div>
        )}
        {tab === 'manual' && <ManualView onBuild={buildInConstructor} onPractice={practiceFamilies} onOpenCompound={openCompound} jump={manualJump} />}
        {visited.practice && (
          <div hidden={tab !== 'practice'}>
            <PracticeView preset={practicePreset} onBuild={buildInConstructor} onManual={openManual} />
          </div>
        )}
        {tab === 'quiz' && <QuizView />}
      </main>

      <footer className="border-t border-slate-200 px-4 py-3 text-center text-[11px] text-slate-400 dark:border-slate-800">
        {INFO.titulo} · datos v{INFO.version} · {COMPOUNDS.length} compuestos
      </footer>
    </div>
  )
}
