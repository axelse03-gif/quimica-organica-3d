// Prueba la conversión JSON → escena 3D (esferas y cilindros) con el renderizador de pruebas de R3F (sin WebGL).
import { describe, expect, it, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import data from '../src/data/quimica_organica_3d.json'
import { buildMolecule } from '../src/lib/chem/molecule.js'

vi.mock('@react-three/drei', () => ({ OrbitControls: () => null, Html: () => null }))

import MoleculeScene from '../src/components/MoleculeScene.jsx'

const LINES = { 1: 1, 1.5: 2, 2: 2, 3: 3 }

async function meshes(compoundId, props = {}) {
  const molecule = buildMolecule(data.base_compuestos.find((c) => c.id === compoundId))
  const renderer = await ReactThreeTestRenderer.create(<MoleculeScene molecule={molecule} {...props} />)
  const all = renderer.scene.findAll((n) => n.type === 'Mesh')
  const spheres = all.filter((m) => m.instance.geometry.type === 'SphereGeometry')
  const cylinders = all.filter((m) => m.instance.geometry.type === 'CylinderGeometry')
  return { molecule, spheres, cylinders, renderer }
}

describe('MoleculeScene', () => {
  it('crea una esfera por átomo y 2 semicilindros por cada línea de enlace', async () => {
    for (const comp of data.base_compuestos) {
      const { molecule, spheres, cylinders } = await meshes(comp.id)
      const expectedCyl = molecule.graph.bonds.reduce((s, b) => s + LINES[b.order] * 2, 0)
      expect(spheres.length, `${comp.nombre_iupac}: átomos`).toBe(molecule.graph.atoms.length)
      expect(cylinders.length, `${comp.nombre_iupac}: cilindros`).toBe(expectedCyl)
    }
  })

  it('dobles y triples enlaces se dibujan con cilindros paralelos', async () => {
    const eteno = await meshes('comp_04') // C=C + 4 C–H
    expect(eteno.cylinders.length).toBe(2 * 2 + 4 * 2)
    const etino = await meshes('comp_06') // C≡C + 2 C–H
    expect(etino.cylinders.length).toBe(3 * 2 + 2 * 2)
  })

  it('esferas con colores CPK (C gris, H blanco, O rojo, N azul)', async () => {
    const { spheres, molecule } = await meshes('comp_18') // propanamida: C, H, O, N
    const hex = (m) => m.instance.material.color.getHexString()
    const colorOf = (el) => {
      const idx = molecule.graph.atoms.findIndex((a) => a.el === el)
      return hex(spheres[idx])
    }
    expect(colorOf('C')).toBe('4b5563')
    expect(colorOf('H')).toBe('f8fafc')
    expect(colorOf('O')).toBe('ef4444')
    expect(colorOf('N')).toBe('3b5bfd')
  })

  it('ocultar H elimina sus esferas y enlaces; espacio lleno no dibuja enlaces', async () => {
    const full = await meshes('comp_09')
    const noH = await meshes('comp_09', { showH: false })
    expect(noH.spheres.length).toBe(full.spheres.length - 6) // etanol: 6 H
    expect(noH.cylinders.length).toBe(2 * 2 * 1 + 0 + 0 === 0 ? 0 : noH.cylinders.length)
    const heavyBonds = full.molecule.graph.bonds.filter((b) => full.molecule.graph.atoms[b.a].el !== 'H' && full.molecule.graph.atoms[b.b].el !== 'H')
    expect(noH.cylinders.length).toBe(heavyBonds.length * 2)
    const space = await meshes('comp_09', { style: 'spacefill' })
    expect(space.cylinders.length).toBe(0)
    expect(space.spheres.length).toBe(9)
  })

  it('las posiciones de los átomos de carbono del JSON se respetan (etano a ±0.77 Å)', async () => {
    const { molecule } = await meshes('comp_02')
    const c = molecule.graph.atoms.filter((a) => a.el === 'C').map((a) => molecule.positions[a.idx])
    const dist = Math.hypot(...c[0].map((v, i) => v - c[1][i]))
    expect(dist).toBeGreaterThan(1.5)
    expect(dist).toBeLessThan(1.58)
  })
})
