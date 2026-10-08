/**
 * ----------------------------------------------------------------------------
 * @file AdminLTE layout.ts
 * @description Gestión del diseño de AdminLTE.
 * @license MIT
 * ----------------------------------------------------------------------------
 */

import {
  getLifecycleSignal,
  onDOMContentLoaded
} from './util/index'

/**
 * ----------------------------------------------------------------------------
 * Constantes
 * ----------------------------------------------------------------------------
 */

const CLASS_NAME_HOLD_TRANSITIONS = 'hold-transition'
const CLASS_NAME_APP_LOADED = 'app-loaded'

/**
 * ----------------------------------------------------------------------------
 * Definición de la clase
 * ----------------------------------------------------------------------------
 */

class Layout {
  _element: HTMLElement
  _holdTransitionTimer: ReturnType<typeof setTimeout> | undefined

  constructor(element: HTMLElement) {
    this._element = element
    this._holdTransitionTimer = undefined
  }

  /*
   * Pausa las transiciones del diseño durante el tiempo indicado. Esto
   * desactiva temporalmente las transiciones y animaciones CSS de sus elementos
   * principales (barra lateral, barra de navegación y contenido).
   *
   * @param time Duración de la pausa de las transiciones, en milisegundos.
   */
  holdTransition(time: number = 100): void {
    if (this._holdTransitionTimer) {
      clearTimeout(this._holdTransitionTimer)
    }

    document.body.classList.add(CLASS_NAME_HOLD_TRANSITIONS)

    this._holdTransitionTimer = setTimeout(() => {
      document.body.classList.remove(CLASS_NAME_HOLD_TRANSITIONS)
    }, time)
  }
}

/**
 * ----------------------------------------------------------------------------
 * Implementación de la API de datos
 * ----------------------------------------------------------------------------
 */

onDOMContentLoaded(() => {
  const layout = new Layout(document.body)
  window.addEventListener('resize', () => layout.holdTransition(200), { signal: getLifecycleSignal() })

  setTimeout(() => {
    document.body.classList.add(CLASS_NAME_APP_LOADED)
  }, 400)
})

export default Layout
