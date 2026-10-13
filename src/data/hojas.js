// Hojas de ejercicios armadas a mano (las del curso y la práctica de 20 ejercicios).
// Cada ítem: { tipo: 'formula' | 'nombre', model, formula?, nombre? }
//  · tipo 'formula': se muestra la fórmula y se pide el nombre IUPAC (`formula` reproduce cómo está escrita en la hoja).
//  · tipo 'nombre': se muestra el nombre (`nombre`, tal como figura en la hoja) y se pide construir la estructura.
import { emptyModel } from '../lib/chem/chainModel.js'

function mk(n, { bonds = {}, at = {} } = {}) {
  const m = emptyModel(n)
  Object.entries(bonds).forEach(([i, o]) => (m.bonds[i] = o))
  Object.entries(at).forEach(([i, v]) => {
    if (v.term) m.carbons[i].term = v.term
    if (v.subs) m.carbons[i].subs = [...v.subs]
  })
  return m
}
const F = (formula, model) => ({ tipo: 'formula', formula, model })
const N = (nombre, model) => ({ tipo: 'nombre', nombre, model })

export const HOJAS = [
  {
    id: 'tema-a',
    titulo: 'Nomenclatura orgánica · Curso 4 · Tema A',
    corto: 'Tema A (curso)',
    origen: 'Hoja de tu curso',
    items: [
      F('CH3-CO-CH2-CH3', mk(4, { at: { 1: { subs: ['oxo'] } } })),
      N('2-Pentino', mk(5, { bonds: { 1: 3 } })),
      F('CH3-CH(OH)-CH2-CH3', mk(4, { at: { 1: { subs: ['OH'] } } })),
      N('2-Hexeno', mk(6, { bonds: { 1: 2 } })),
      F('CH3-CH2-O-CH2-CH2-CH3', mk(3, { at: { 0: { subs: ['OC2H5'] } } })),
      N('Ácido 2-metilpropanoico', mk(3, { at: { 0: { term: 'COOH' }, 1: { subs: ['CH3'] } } })),
      F('CH3-C≡C-CH(CH3)2', mk(5, { bonds: { 1: 3 }, at: { 3: { subs: ['CH3'] } } })),
      N('3-metil 2-pentanona', mk(5, { at: { 1: { subs: ['oxo'] }, 2: { subs: ['CH3'] } } })),
      F('CH3-CH2-NH-CH3', mk(2, { at: { 1: { subs: ['NHCH3'] } } })),
      N('1-Buteno', mk(4, { bonds: { 0: 2 } })),
    ],
  },
  {
    id: 'tema-b',
    titulo: 'Nomenclatura orgánica · Curso 4 · Tema B',
    corto: 'Tema B (curso)',
    origen: 'Hoja de tu curso',
    items: [
      F('CH3-CH2-CO-CH2-CH3', mk(5, { at: { 2: { subs: ['oxo'] } } })),
      N('3-Hexino', mk(6, { bonds: { 2: 3 } })),
      F('CH3-CH2-CH2-CH(OH)-CH3', mk(5, { at: { 3: { subs: ['OH'] } } })),
      N('2-Penteno', mk(5, { bonds: { 1: 2 } })),
      F('CH3-O-CH(CH3)2', mk(3, { at: { 1: { subs: ['OCH3'] } } })),
      N('Ácido 3-metilbutanoico', mk(4, { at: { 0: { term: 'COOH' }, 2: { subs: ['CH3'] } } })),
      F('CH3-CH=C(CH3)-CH2-CH3', mk(5, { bonds: { 1: 2 }, at: { 2: { subs: ['CH3'] } } })),
      N('2-Pentanona', mk(5, { at: { 1: { subs: ['oxo'] } } })),
      F('CH3-NH2', mk(1, { at: { 0: { subs: ['NH2'] } } })),
      N('Etino', mk(2, { bonds: { 0: 3 } })),
    ],
  },
  {
    id: 'practica-a',
    titulo: 'Práctica de nomenclatura · Hoja A',
    corto: 'Práctica A',
    origen: 'Ejercicios 1 a 10 del documento',
    items: [
      F('CH3-CH(CH3)-CH2-CH2-CH3', mk(5, { at: { 1: { subs: ['CH3'] } } })),
      N('3-Metil-1-buteno', mk(4, { bonds: { 0: 2 }, at: { 2: { subs: ['CH3'] } } })),
      F('CH3-CH(CH3)-CH2-CH2-OH', mk(4, { at: { 1: { subs: ['CH3'] }, 3: { subs: ['OH'] } } })),
      N('4-Metil-2-pentino', mk(5, { bonds: { 1: 3 }, at: { 3: { subs: ['CH3'] } } })),
      F('CH3-CH(CH3)-CH2-CHO', mk(4, { at: { 1: { subs: ['CH3'] }, 3: { term: 'CHO' } } })),
      N('4-Metil-2-pentanona', mk(5, { at: { 1: { subs: ['oxo'] }, 3: { subs: ['CH3'] } } })),
      F('CH3-CH2-CH2-O-CH3', mk(3, { at: { 2: { subs: ['OCH3'] } } })),
      N('Ácido 4-metilpentanoico', mk(5, { at: { 1: { subs: ['CH3'] }, 4: { term: 'COOH' } } })),
      F('CH3-COO-CH2-CH2-CH3', mk(2, { at: { 1: { term: 'COOC3H7' } } })),
      N('N-Metil-1-propanamina', mk(3, { at: { 2: { subs: ['NHCH3'] } } })),
    ],
  },
  {
    id: 'practica-b',
    titulo: 'Práctica de nomenclatura · Hoja B',
    corto: 'Práctica B',
    origen: 'Ejercicios 11 a 20 del documento',
    items: [
      F('CH2=C(CH3)-CH2-CH3', mk(4, { bonds: { 0: 2 }, at: { 1: { subs: ['CH3'] } } })),
      N('2,3-Dimetilbutano', mk(4, { at: { 1: { subs: ['CH3'] }, 2: { subs: ['CH3'] } } })),
      F('CH≡C-CH(CH3)-CH2-CH3', mk(5, { bonds: { 0: 3 }, at: { 2: { subs: ['CH3'] } } })),
      N('2-Metil-2-butanol', mk(4, { at: { 1: { subs: ['CH3', 'OH'] } } })),
      F('CH3-CH2-CO-CH2-CH2-CH3', mk(6, { at: { 2: { subs: ['oxo'] } } })),
      N('2-Metilbutanal', mk(4, { at: { 2: { subs: ['CH3'] }, 3: { term: 'CHO' } } })),
      F('CH3-CH2-CH(CH3)-COOH', mk(4, { at: { 2: { subs: ['CH3'] }, 3: { term: 'COOH' } } })),
      N('2-Etoxipropano', mk(3, { at: { 1: { subs: ['OC2H5'] } } })),
      F('CH3-CH(NH2)-CH2-CH3', mk(4, { at: { 1: { subs: ['NH2'] } } })),
      N('Butanoato de metilo', mk(4, { at: { 3: { term: 'COOCH3' } } })),
    ],
  },
]

export const HOJA_BY_ID = Object.fromEntries(HOJAS.map((h) => [h.id, h]))
