// Renderiza fórmulas químicas con subíndices: C2H6O, CH3-CH(CH3)-CH2-CH3, CnH2n+2…
const RE = /([A-Z)])(\d*n[+-]?\d*|\d+)/g

export default function Formula({ children, className = '' }) {
  const text = String(children ?? '')
  const nodes = []
  let last = 0
  let m
  RE.lastIndex = 0
  while ((m = RE.exec(text))) {
    nodes.push(text.slice(last, m.index), m[1], <sub key={m.index} className="text-[0.75em]">{m[2]}</sub>)
    last = m.index + m[0].length
  }
  nodes.push(text.slice(last))
  return <span className={className}>{nodes}</span>
}
