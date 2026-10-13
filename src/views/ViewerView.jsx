// Módulo A: visor molecular 3D + panel informativo.
import { useMemo } from 'react'
import { COMPOUND_BY_ID, COMPOUNDS } from '../data/index.js'
import { buildMolecule } from '../lib/chem/molecule.js'
import MoleculeStage from '../components/MoleculeStage.jsx'
import CompoundList from '../components/CompoundList.jsx'
import CompoundInfo from '../components/CompoundInfo.jsx'
import Formula from '../components/Formula.jsx'

export default function ViewerView({ query, setQuery, family, setFamily, selectedId, setSelectedId }) {
  const compound = COMPOUND_BY_ID[selectedId] ?? COMPOUNDS[0]
  const molecule = useMemo(() => buildMolecule(compound), [compound])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <CompoundList
        query={query}
        setQuery={setQuery}
        family={family}
        setFamily={setFamily}
        selectedId={compound.id}
        onSelect={setSelectedId}
        className="max-h-[420px] lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]"
      />
      <div className="min-w-0 space-y-4">
        <MoleculeStage
          key={`stage-${compound.id}`}
          molecule={molecule}
          className="h-[52vh] min-h-[360px]"
          overlay={
            <div className="pointer-events-none absolute left-3 top-14 rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 backdrop-blur">
              <div className="text-sm font-semibold text-white">{compound.nombre_iupac}</div>
              <Formula className="font-mono text-xs text-teal-300">{compound.formula_semidesarrollada}</Formula>
            </div>
          }
        />
        <CompoundInfo key={`info-${compound.id}`} compound={compound} />
      </div>
    </div>
  )
}
