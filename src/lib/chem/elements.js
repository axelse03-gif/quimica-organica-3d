// Datos de elementos para el renderizado (colores CPK) y la geometría.
export const ELEMENTS = {
  H: { name: 'Hidrógeno', color: '#f8fafc', radius: 0.26, vdw: 1.1, valence: 1 },
  C: { name: 'Carbono', color: '#4b5563', radius: 0.38, vdw: 1.7, valence: 4 },
  O: { name: 'Oxígeno', color: '#ef4444', radius: 0.36, vdw: 1.52, valence: 2 },
  N: { name: 'Nitrógeno', color: '#3b5bfd', radius: 0.37, vdw: 1.55, valence: 3 },
  S: { name: 'Azufre', color: '#facc15', radius: 0.42, vdw: 1.8, valence: 2 },
  P: { name: 'Fósforo', color: '#fb923c', radius: 0.42, vdw: 1.8, valence: 3 },
  F: { name: 'Flúor', color: '#86efac', radius: 0.32, vdw: 1.47, valence: 1 },
  Cl: { name: 'Cloro', color: '#22c55e', radius: 0.42, vdw: 1.75, valence: 1 },
  Br: { name: 'Bromo', color: '#b45309', radius: 0.46, vdw: 1.85, valence: 1 },
  I: { name: 'Yodo', color: '#8b5cf6', radius: 0.5, vdw: 1.98, valence: 1 },
}

export function el(symbol) {
  return ELEMENTS[symbol] ?? { name: symbol, color: '#a855f7', radius: 0.4, vdw: 1.7, valence: 0 }
}

// Longitudes de enlace típicas (Å) por par de elementos y orden de enlace.
const LEN = {
  'C-C': { 1: 1.54, 1.5: 1.4, 2: 1.34, 3: 1.2 },
  'C-H': { 1: 1.09 },
  'C-O': { 1: 1.43, 2: 1.22 },
  'H-O': { 1: 0.96 },
  'C-N': { 1: 1.47, 2: 1.28, 3: 1.16 },
  'H-N': { 1: 1.01 },
  'C-F': { 1: 1.35 },
  'C-Cl': { 1: 1.77 },
  'Br-C': { 1: 1.94 },
  'C-I': { 1: 2.14 },
}

export function bondLength(symA, symB, order, hybA, hybB) {
  const key = [symA, symB].sort().join('-')
  const table = LEN[key]
  let len = table ? table[order] ?? table[1] : 1.5
  // Ajustes por hibridación: los enlaces simples con carbonos sp2/sp son más cortos.
  if (order === 1 && key === 'C-C') {
    if (hybA === 'sp' || hybB === 'sp') len = 1.46
    else if (hybA === 'sp2' || hybB === 'sp2') len = 1.5
  }
  if (order === 1 && key === 'C-O' && (hybA === 'sp2' || hybB === 'sp2')) len = 1.35
  if (order === 1 && key === 'C-N' && (hybA === 'sp2' || hybB === 'sp2')) len = 1.34
  if (order === 1 && key === 'C-N' && (hybA === 'sp' || hybB === 'sp')) len = 1.45
  return len
}

// Ángulo ideal (grados) centrado en un átomo según su hibridación.
export function idealAngle(symbol, hyb) {
  if (hyb === 'sp') return 180
  if (hyb === 'sp2') return 120
  if (symbol === 'O') return 108
  if (symbol === 'N') return 108
  return 109.5
}
