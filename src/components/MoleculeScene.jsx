// Escena R3F: convierte {graph, positions} en esferas (átomos) y cilindros (enlaces).
import { useEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { el } from '../lib/chem/elements.js'

const SPHERE = new THREE.SphereGeometry(1, 28, 20)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false)
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const materialCache = new Map()

function material(color, opacity = 1) {
  const key = `${color}|${opacity}`
  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.06,
        transparent: opacity < 1,
        opacity,
      }),
    )
  }
  return materialCache.get(key)
}

const bondColor = (symbol) => (symbol === 'C' ? '#94a3b8' : el(symbol).color)
const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

export function atomRadius(symbol, style) {
  const e = el(symbol)
  if (style === 'spacefill') return e.vdw * 0.62
  if (style === 'sticks') return 0.11
  return e.radius
}

function visibleAtoms(molecule, showH) {
  return molecule.graph.atoms.filter((a) => showH || a.el !== 'H')
}

function buildCylinders(molecule, showH, style) {
  const { graph, positions } = molecule
  const P = positions.map((p) => new THREE.Vector3(...p))
  const bondCentroid = new Map()
  for (const ring of graph.findRings()) {
    const c = new THREE.Vector3()
    ring.forEach((v) => c.add(P[v]))
    c.multiplyScalar(1 / ring.length)
    ring.forEach((v, k) => bondCentroid.set(pairKey(v, ring[(k + 1) % ring.length]), c))
  }

  const baseR = style === 'sticks' ? 0.11 : 0.075
  const out = []
  graph.bonds.forEach((bond, bi) => {
    const A = graph.atoms[bond.a]
    const B = graph.atoms[bond.b]
    if (!showH && (A.el === 'H' || B.el === 'H')) return
    const pa = P[bond.a]
    const pb = P[bond.b]
    const u = pb.clone().sub(pa).normalize()

    // Dirección perpendicular dentro del plano de los sustituyentes
    let perp = null
    const ref = graph.adj[bond.a].find((x) => x.n !== bond.b) ?? graph.adj[bond.b].find((x) => x.n !== bond.a)
    if (ref) {
      const origin = graph.adj[bond.a].some((x) => x.n === ref.n) ? pa : pb
      const v = P[ref.n].clone().sub(origin)
      const N = new THREE.Vector3().crossVectors(u, v)
      if (N.length() > 1e-3) perp = new THREE.Vector3().crossVectors(N, u).normalize()
    }
    if (!perp) {
      const axis = Math.abs(u.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      perp = new THREE.Vector3().crossVectors(u, axis).normalize()
    }
    const aromatic = bond.order === 1.5
    if (aromatic) {
      const c = bondCentroid.get(pairKey(bond.a, bond.b))
      if (c) {
        const mid = pa.clone().add(pb).multiplyScalar(0.5)
        if (perp.dot(c.clone().sub(mid)) < 0) perp.negate()
      }
    }

    let lines
    if (bond.order === 2) lines = [{ o: -0.1, r: baseR * 0.8, op: 1 }, { o: 0.1, r: baseR * 0.8, op: 1 }]
    else if (bond.order === 3) lines = [{ o: -0.16, r: baseR * 0.72, op: 1 }, { o: 0, r: baseR * 0.72, op: 1 }, { o: 0.16, r: baseR * 0.72, op: 1 }]
    else if (aromatic) lines = [{ o: -0.06, r: baseR, op: 1 }, { o: 0.17, r: baseR * 0.6, op: 0.55 }]
    else lines = [{ o: 0, r: baseR, op: 1 }]

    lines.forEach((ln, li) => {
      const s = pa.clone().addScaledVector(perp, ln.o)
      const e = pb.clone().addScaledVector(perp, ln.o)
      const m = s.clone().add(e).multiplyScalar(0.5)
      const halves = [
        { from: s, to: m, color: bondColor(A.el) },
        { from: m, to: e, color: bondColor(B.el) },
      ]
      halves.forEach((h, hi) => {
        const dir = h.to.clone().sub(h.from)
        const len = dir.length()
        const q = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.clone().normalize())
        const pos = h.from.clone().add(h.to).multiplyScalar(0.5)
        out.push({
          key: `${bi}-${li}-${hi}`,
          position: pos.toArray(),
          quaternion: q.toArray(),
          length: len,
          radius: ln.r,
          color: h.color,
          opacity: ln.op,
        })
      })
    })
  })
  return out
}

export function moleculeRadius(molecule) {
  let r = 1
  molecule.positions.forEach((p, i) => {
    r = Math.max(r, Math.hypot(...p) + atomRadius(molecule.graph.atoms[i].el, 'ballstick') + 0.3)
  })
  return r
}

function CameraRig({ radius, resetSignal }) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls)
  useEffect(() => {
    const d = Math.max(4.5, radius * 3.6 + 1.5)
    camera.position.set(0, 0, d)
    camera.near = 0.1
    camera.far = 200
    camera.updateProjectionMatrix()
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }, [radius, resetSignal, camera, controls])
  return null
}

export default function MoleculeScene({ molecule, style = 'ballstick', showH = true, labels = false, autoRotate = false, resetSignal = 0 }) {
  const [hover, setHover] = useState(null)
  const atoms = useMemo(() => visibleAtoms(molecule, showH), [molecule, showH])
  const cylinders = useMemo(() => (style === 'spacefill' ? [] : buildCylinders(molecule, showH, style)), [molecule, showH, style])
  const radius = useMemo(() => moleculeRadius(molecule), [molecule])

  return (
    <>
      <hemisphereLight args={['#ffffff', '#64748b', 0.9]} />
      <directionalLight position={[6, 8, 7]} intensity={1.6} />
      <directionalLight position={[-7, -4, -5]} intensity={0.55} color="#a5b4fc" />
      <ambientLight intensity={0.25} />

      <group>
        {atoms.map((a) => {
          const p = molecule.positions[a.idx]
          const r = atomRadius(a.el, style)
          const isHover = hover === a.idx
          return (
            <mesh
              key={a.id}
              geometry={SPHERE}
              material={material(el(a.el).color)}
              position={p}
              scale={isHover ? r * 1.14 : r}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHover(a.idx)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHover(null)
                document.body.style.cursor = 'auto'
              }}
            />
          )
        })}
        {cylinders.map((c) => (
          <mesh
            key={c.key}
            geometry={CYL}
            material={material(c.color, c.opacity)}
            position={c.position}
            quaternion={c.quaternion}
            scale={[c.radius, c.length, c.radius]}
          />
        ))}
        {labels &&
          atoms.map((a) => (
            <Html key={`l-${a.id}`} position={molecule.positions[a.idx]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <span className="select-none rounded px-1 text-[10px] font-bold leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">
                {a.el === 'H' ? '' : a.el}
              </span>
            </Html>
          ))}
        {hover !== null && (
          <Html
            position={molecule.positions[hover]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none', transform: 'translate(0, -42px)' }}
          >
            <div className="whitespace-nowrap rounded-lg border border-white/15 bg-slate-950/90 px-2.5 py-1.5 text-xs text-slate-100 shadow-xl">
              <b>{el(molecule.graph.atoms[hover].el).name}</b>{' '}
              <span className="text-slate-400">{molecule.graph.atoms[hover].id}</span>
              {molecule.graph.atoms[hover].hyb && (
                <span className="ml-1.5 rounded bg-teal-500/20 px-1.5 py-0.5 font-mono text-teal-300">{molecule.graph.atoms[hover].hyb}</span>
              )}
            </div>
          </Html>
        )}
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        enablePan
        autoRotate={autoRotate}
        autoRotateSpeed={1.6}
        minDistance={1.5}
        maxDistance={60}
      />
      <CameraRig radius={radius} resetSignal={resetSignal} />
    </>
  )
}
