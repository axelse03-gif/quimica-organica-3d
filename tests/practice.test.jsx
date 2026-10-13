import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../src/components/MoleculeStage.jsx', () => ({
  default: ({ molecule, overlay }) => (
    <div data-testid="stage" data-atoms={molecule.graph.atoms.length}>
      {overlay}
    </div>
  ),
}))

import App from '../src/App.jsx'

const tab = (name) => within(screen.getByRole('navigation', { name: 'Módulos' })).getByRole('button', { name })

beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    /* sin almacenamiento */
  }
})

describe('Manual de estudio', () => {
  it('navega por secciones y marca progreso', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Manual/))
    expect(screen.getByRole('heading', { level: 2, name: 'Cómo estudiar con esta app' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Marcar como estudiada/ }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
    expect(screen.getByRole('button', { name: /Estudiada/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un ejemplo del manual se arma en el Constructor con el mismo nombre', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Manual/))
    await user.click(within(screen.getByRole('navigation', { name: 'Secciones del manual' })).getByRole('button', { name: /^Cetonas/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Cetonas' })).toBeInTheDocument()
    // 3er ejemplo: pentan-2-ona
    const card = screen.getByText('pentan-2-ona').closest('div.rounded-xl')
    await user.click(within(card).getByRole('button', { name: /Armar en el Constructor/ }))
    expect(screen.getByRole('button', { name: 'Renderizar en 3D' })).toBeVisible()
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('pentan-2-ona')
  })

  it('«Practicar esta familia» abre la práctica con esa familia', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Manual/))
    await user.click(within(screen.getByRole('navigation', { name: 'Secciones del manual' })).getByRole('button', { name: /^Éteres/ }))
    await user.click(screen.getByRole('button', { name: /Practicar esta familia/ }))
    expect(screen.getByRole('heading', { name: 'Práctica de parcial' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Éteres', pressed: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alcoholes', pressed: false })).toBeInTheDocument()
  })
})

describe('Constructor ampliado', () => {
  it('arma un éter y un éster con los grupos nuevos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Constructor/))
    await user.click(screen.getByRole('button', { name: 'Etoxietano' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('etoxietano')
    await user.click(screen.getByRole('button', { name: 'Etanoato de etilo' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('etanoato de etilo')
    await user.click(screen.getByRole('button', { name: 'N-metilpropan-1-amina' }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('N-metilpropan-1-amina')
  })
})

describe('Práctica de parcial', () => {
  it('una sesión aleatoria arma el número de ejercicios pedido', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: '5' }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(screen.getByText(/Ejercicio 1 de 5/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Ir al ejercicio/ })).toHaveLength(5)
    expect(screen.getByText('1 · ¿A qué familia pertenece?')).toBeInTheDocument()
  })

  it('la misma semilla produce los mismos ejercicios', async () => {
    const first = async () => {
      const user = userEvent.setup()
      const { unmount } = render(<App />)
      await user.click(tab(/^Práctica/))
      await user.type(screen.getByPlaceholderText(/Misma semilla/), 'parcial-1')
      await user.click(screen.getByRole('button', { name: /Empezar/ }))
      const dado = screen.getByTestId('dado').textContent
      unmount()
      return dado
    }
    expect(await first()).toBe(await first())
  })

  it('hoja Tema A: corrige una fórmula → nombre con ayuda inmediata', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: /Hojas fijas/ }))
    await user.click(screen.getByRole('button', { name: /Tema A \(curso\)/ }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(screen.getByTestId('dado').textContent).toBe('CH3-CO-CH2-CH3')
    await user.click(screen.getByRole('button', { name: /^Cetona/ }))
    await user.type(screen.getByLabelText('Nombre IUPAC'), '2-butanona')
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!')
    expect(screen.getByRole('status')).toHaveTextContent('100 / 100 pts')
  })

  it('hoja Tema A: se construye «2-Pentino» en el espacio del Constructor', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: /Hojas fijas/ }))
    await user.click(screen.getByRole('button', { name: /Tema A \(curso\)/ }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    await user.click(screen.getByRole('button', { name: 'Ir al ejercicio 2' }))
    expect(screen.getByTestId('dado').textContent).toBe('2-Pentino')

    // 4 → 5 carbonos; el 2.º enlace (C2–C3) pasa a triple
    await user.click(screen.getByRole('button', { name: 'Añadir un carbono' }))
    const bonds = screen.getAllByRole('button', { name: /Enlace de orden/ })
    await user.click(bonds[1])
    await user.click(screen.getAllByRole('button', { name: /Enlace de orden/ })[1])
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('pent-2-ino')

    await user.click(screen.getByRole('button', { name: /^Alquino/ }))
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    expect(screen.getByRole('status')).toHaveTextContent('¡Correcto!')
  })

  it('una estructura equivocada recibe una pista y se puede cargar la solución', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: /Hojas fijas/ }))
    await user.click(screen.getByRole('button', { name: /Tema A \(curso\)/ }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    await user.click(screen.getByRole('button', { name: 'Ir al ejercicio 2' }))
    await user.click(screen.getByRole('button', { name: 'Añadir un carbono' })) // 5 C pero todo simple: pentano
    await user.click(screen.getByRole('button', { name: /^Alcano/ }))
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    const fb = screen.getByRole('status')
    expect(fb).toHaveTextContent(/Incorrecto|Parcialmente/)
    expect(fb).toHaveTextContent(/C5H12/)
    await user.click(within(fb).getByRole('button', { name: /Cargar solución en el Constructor/ }))
    expect(document.querySelector('[aria-live="polite"]').textContent).toBe('pent-2-ino')
  })

  it('simulacro: sin ayudas, entrega con nota 0 si no se responde y guarda el estado', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: /Hojas fijas/ }))
    await user.click(screen.getByRole('button', { name: /Tema B/ }))
    await user.click(screen.getByRole('button', { name: /Simulacro de parcial/ }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(screen.queryByRole('button', { name: /Comprobar/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Entregar y ver nota/ }))
    expect(screen.getByTestId('nota')).toHaveTextContent('0.0')
    expect(screen.getByRole('button', { name: /Repetir los 10 que fallé/ })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(11)
  })

  it('al cargar la solución en el Constructor la sesión de práctica no se pierde', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(tab(/^Práctica/))
    await user.click(screen.getByRole('button', { name: /Hojas fijas/ }))
    await user.click(screen.getByRole('button', { name: /Empezar/ }))
    await user.click(screen.getByRole('button', { name: /^Cetona/ }))
    await user.click(screen.getByRole('button', { name: /Comprobar/ }))
    await user.click(screen.getByRole('button', { name: /Cargar solución en el Constructor/ }))
    expect(screen.getByRole('button', { name: 'Renderizar en 3D' })).toBeVisible()
    await user.click(tab(/^Práctica/))
    expect(screen.getByText(/Ejercicio 1 de 10/)).toBeVisible()
    expect(screen.getByRole('status')).toBeVisible()
  })
})
