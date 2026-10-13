import { describe, expect, it, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// El escenario WebGL no existe en jsdom: se sustituye por un marcador que expone el nº de átomos.
vi.mock('../src/components/MoleculeStage.jsx', () => ({
  default: ({ molecule, overlay }) => (
    <div data-testid="stage" data-atoms={molecule.graph.atoms.length} data-bonds={molecule.graph.bonds.length}>
      {overlay}
    </div>
  ),
}))

import App from '../src/App.jsx'

const nav = (name) => screen.getByRole('button', { name })

describe('Módulo A · Visor', () => {
  it('carga el primer compuesto con su ficha y escena', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: 'Metano' })).toBeInTheDocument()
    expect(screen.getByTestId('stage')).toHaveAttribute('data-atoms', '5')
    expect(screen.getByText(/Ficha didáctica/)).toBeInTheDocument()
    expect(screen.getByText(/Tetraédrica perfecta/)).toBeInTheDocument()
  })

  it('busca en tiempo real por fórmula, nombre y grupo funcional', async () => {
    const user = userEvent.setup()
    render(<App />)
    const box = screen.getByPlaceholderText(/Nombre, fórmula/)
    await user.type(box, 'c2h6o')
    const list = screen.getByRole('listbox', { name: 'Compuestos' })
    expect(within(list).getAllByRole('option')).toHaveLength(1) // sólo el etanol tiene C2H6O en la base
    expect(within(list).getByText('Etanol')).toBeInTheDocument()

    await user.clear(box)
    await user.type(box, 'carbonilo')
    const names = within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
    expect(names.some((t) => t.includes('Metanal'))).toBe(true)
    expect(names.some((t) => t.includes('Propanona'))).toBe(true)

    await user.clear(box)
    await user.type(box, 'zzzz')
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument()
  })

  it('filtra por familia y muestra el compuesto elegido', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Alcoholes · 2/ }))
    const opts = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(opts).toHaveLength(2)
    await user.click(opts[1])
    expect(screen.getByRole('heading', { level: 2, name: '2-propanol' })).toBeInTheDocument()
    expect(screen.getByTestId('stage')).toHaveAttribute('data-atoms', '12')
  })

  it('muestra la ficha completa del ácido láctico', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByPlaceholderText(/Nombre, fórmula/), 'láctico')
    await user.click(within(screen.getByRole('listbox')).getAllByRole('option')[0])
    expect(screen.getByText('Quiralidad')).toBeInTheDocument()
    expect(screen.getByText(/centro quiral/)).toBeInTheDocument()
    expect(screen.getByText(/Prioridad IUPAC 1/)).toBeInTheDocument()
  })

  it('todos los compuestos se pueden abrir sin errores', async () => {
    const user = userEvent.setup()
    render(<App />)
    const total = within(screen.getByRole('listbox')).getAllByRole('option').length
    expect(total).toBe(19)
    for (let i = 0; i < total; i++) {
      await user.click(within(screen.getByRole('listbox')).getAllByRole('option')[i])
      expect(screen.getAllByTestId('stage'), 'una sola escena montada').toHaveLength(1)
      expect(Number(screen.getByTestId('stage').dataset.atoms)).toBeGreaterThan(3)
    }
  })
})

describe('Módulo B · Familias y nomenclatura', () => {
  it('lista las 14 familias y muestra datos de la seleccionada', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Familias/))
    const familias = within(screen.getByRole('navigation', { name: 'Familias' })).getAllByRole('button')
    expect(familias).toHaveLength(14)
    await user.click(familias[1]) // alquenos
    expect(screen.getByRole('heading', { level: 2, name: /Alquenos/ })).toBeInTheDocument()
    expect(screen.getByText(/Triangular Plana/)).toBeInTheDocument()
    expect(screen.getByText(/Compuestos de la base \(2\)/)).toBeInTheDocument()
  })

  it('"Ver en 3D" abre el compuesto en el visor', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Familias/))
    await user.click(within(screen.getByRole('navigation', { name: 'Familias' })).getAllByRole('button')[2]) // alquinos
    await user.click(screen.getByRole('button', { name: /Etino/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Etino' })).toBeInTheDocument()
    expect(screen.getByTestId('stage')).toHaveAttribute('data-atoms', '4')
  })

  it('la teoría muestra el algoritmo, los prefijos y la jerarquía del JSON', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Familias/))
    await user.click(screen.getByRole('button', { name: 'Teoría de nomenclatura' }))
    expect(screen.getByText(/Identificar el grupo funcional principal/)).toBeInTheDocument()
    expect(screen.getByText('tetradec-')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(13) // encabezado + 12 grupos
    expect(screen.getByText('carboxi-')).toBeInTheDocument()
  })
})

describe('Módulo C · Constructor', () => {
  it('nombra el ejemplo inicial y encuentra el compuesto en la base', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Constructor/))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('ácido 2-hidroxipropanoico')
    expect(screen.getByText(/Está en la base/)).toBeInTheDocument()
    expect(screen.getAllByText(/Grupo principal/).length).toBeGreaterThan(0)
  })

  it('cambia el nombre al cargar ejemplos y al editar la cadena', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Constructor/))
    await user.click(screen.getByRole('button', { name: 'Propanona' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('propanona')

    await user.click(screen.getByRole('button', { name: '2-propanol' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('propan-2-ol')

    // añadir un carbono → butan-2-ol
    await user.click(screen.getByRole('button', { name: 'Añadir un carbono' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('butan-2-ol')

    // convertir el enlace C3–C4 en doble: but-3-en-2-ol
    const bonds = screen.getAllByRole('button', { name: /Enlace de orden/ })
    await user.click(bonds[2])
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('but-3-en-2-ol')
  })

  it('renderiza en 3D la estructura armada y avisa si cambia', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Constructor/))
    expect(screen.queryByTestId('stage')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Renderizar en 3D/ }))
    expect(screen.getByTestId('stage')).toHaveAttribute('data-atoms', '12') // C3H6O3
    await user.click(screen.getByRole('button', { name: 'Quitar un carbono' }))
    expect(screen.getByText(/La estructura cambió/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Actualizar en 3D/ }))
    await waitFor(() => expect(screen.queryByText(/La estructura cambió/)).not.toBeInTheDocument())
  })

  it('respeta las valencias: no permite un doble enlace junto a un grupo terminal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Constructor/))
    await user.click(screen.getByRole('button', { name: 'Hex-1-en-4-ino' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('hex-1-en-4-ino')
    await user.click(screen.getByRole('button', { name: 'Ácido butanodioico' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('ácido butanodioico')
    // los enlaces junto a carbonos -COOH no admiten otro orden
    const bonds = screen.getAllByRole('button', { name: /Enlace de orden/ })
    expect(bonds[0]).toBeDisabled()
    expect(bonds[1]).not.toBeDisabled()
  })
})

describe('Módulo D · Desafíos', () => {
  it('permite jugar una partida completa con puntaje y explicación', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(nav(/Desafíos/))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /Comenzar \(5 preguntas\)/ }))
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Pregunta ${i + 1} de 5`)).toBeInTheDocument()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(4)
      await user.click(radios[0])
      // feedback inmediato con explicación
      expect(screen.getByText(/¡Correcto!|No es esa/)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Siguiente|Ver resultado/ }))
    }
    expect(screen.getByText('Puntaje')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jugar de nuevo/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Jugar de nuevo/ }))
    expect(screen.getByText('Pregunta 1 de 5')).toBeInTheDocument()
  })

  it('suma puntos al responder bien los desafíos del JSON', async () => {
    const { buildQuestionBank } = await import('../src/lib/quiz.js')
    const { DATA } = await import('../src/data/index.js')
    const bank = buildQuestionBank(DATA)
    const json = bank.filter((q) => q.fuente === 'json')
    expect(json.map((q) => q.id)).toEqual(['desafio_01', 'desafio_02', 'desafio_03'])
    json.forEach((q) => expect(q.opciones).toContain(q.correcta))
  })
})

describe('Tema', () => {
  it('alterna modo oscuro', async () => {
    const user = userEvent.setup()
    render(<App />)
    const before = document.documentElement.classList.contains('dark')
    await user.click(screen.getByRole('button', { name: /Cambiar a modo/ }))
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })
})
