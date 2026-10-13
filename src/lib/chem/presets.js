// Ejemplos listos para cargar en el constructor.
import { emptyModel } from './chainModel.js'

function mk(n, { bonds = {}, at = {} } = {}) {
  const m = emptyModel(n)
  Object.entries(bonds).forEach(([i, o]) => (m.bonds[i] = o))
  Object.entries(at).forEach(([i, v]) => {
    if (v.term) m.carbons[i].term = v.term
    if (v.subs) m.carbons[i].subs = [...v.subs]
  })
  return m
}

export const PRESETS = [
  { label: 'Ácido láctico', model: () => mk(3, { at: { 0: { term: 'COOH' }, 1: { subs: ['OH'] } } }) },
  { label: '2-metilbutano', model: () => mk(4, { at: { 1: { subs: ['CH3'] } } }) },
  { label: 'trans-2-penteno', model: () => mk(5, { bonds: { 1: 2 } }) },
  { label: 'Propanona', model: () => mk(3, { at: { 1: { subs: ['oxo'] } } }) },
  { label: '2-propanol', model: () => mk(3, { at: { 1: { subs: ['OH'] } } }) },
  { label: 'Propanamida', model: () => mk(3, { at: { 0: { term: 'CONH2' } } }) },
  { label: 'But-3-en-1-ol', model: () => mk(4, { bonds: { 2: 2 }, at: { 0: { subs: ['OH'] } } }) },
  { label: 'Ácido butanodioico', model: () => mk(4, { at: { 0: { term: 'COOH' }, 3: { term: 'COOH' } } }) },
  { label: 'Hex-1-en-4-ino', model: () => mk(6, { bonds: { 0: 2, 3: 3 } }) },
  { label: '3-aminobutan-2-ol', model: () => mk(4, { at: { 1: { subs: ['OH'] }, 2: { subs: ['NH2'] } } }) },
  { label: 'Etoxietano', model: () => mk(2, { at: { 1: { subs: ['OC2H5'] } } }) },
  { label: 'Etanoato de etilo', model: () => mk(2, { at: { 1: { term: 'COOC2H5' } } }) },
  { label: 'N-metilpropan-1-amina', model: () => mk(3, { at: { 2: { subs: ['NHCH3'] } } }) },
  { label: '2-bromopropano', model: () => mk(3, { at: { 1: { subs: ['Br'] } } }) },
  { label: '3-etilpentano', model: () => mk(5, { at: { 2: { subs: ['C2H5'] } } }) },
]
