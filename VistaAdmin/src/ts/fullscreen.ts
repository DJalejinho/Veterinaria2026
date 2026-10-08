/**
 * --------------------------------------------
 * @file AdminLTE fullscreen.ts
 * @description Complemento de pantalla completa de AdminLTE.
 * @license MIT
 * --------------------------------------------
 */

import { BaseComponent, dispatchCustomEvent } from './base-component'
import {
  getLifecycleSignal,
  onDOMContentLoaded
} from './util/index'

/**
 * Constantes
 * ============================================================================
 */
const NAME = 'fullscreen'
const EVENT_KEY = `.lte.${NAME}`
const EVENT_MAXIMIZED = `maximized${EVENT_KEY}`
const EVENT_MINIMIZED = `minimized${EVENT_KEY}`

const SELECTOR_FULLSCREEN_TOGGLE = '[data-lte-toggle="fullscreen"]'
const SELECTOR_MAXIMIZE_ICON = '[data-lte-icon="maximize"]'
const SELECTOR_MINIMIZE_ICON = '[data-lte-icon="minimize"]'

/**
 * Mantiene sincronizados los iconos y eventos personalizados con el estado real
 * de pantalla completa del navegador. Usar el evento `fullscreenchange` en vez
 * de las llamadas para entrar o salir mantiene la interfaz correcta sin
 * importar cómo ocurrió el cambio. También cubre los casos que el enfoque
 * imperativo no detectaría: solicitudes rechazadas por la política de permisos,
 * falta de `allowfullscreen` en un iframe, pérdida de la interacción del usuario
 * o salida mediante las teclas ESC o F11.
 */
function syncFullScreenState(): void {
  const iconMaximize = document.querySelector<HTMLElement>(SELECTOR_MAXIMIZE_ICON)
  const iconMinimize = document.querySelector<HTMLElement>(SELECTOR_MINIMIZE_ICON)
  const isFullScreen = Boolean(document.fullscreenElement)

  // Alterna la utilidad .d-none de Bootstrap en vez de asignar display:block en
  // línea. El método anterior sobrescribía el valor de visualización natural de
  // la biblioteca de iconos (algunas fuentes usan inline-block) y desplazaba el
  // icono. Corrige #6021.
  iconMaximize?.classList.toggle('d-none', isFullScreen)
  iconMinimize?.classList.toggle('d-none', !isFullScreen)

  const eventName = isFullScreen ? EVENT_MAXIMIZED : EVENT_MINIMIZED

  document.querySelectorAll(SELECTOR_FULLSCREEN_TOGGLE).forEach(button => {
    dispatchCustomEvent(button, eventName)
  })
}

/**
 * Definición de la clase.
 * ============================================================================
 */
class FullScreen extends BaseComponent {
  static get NAME(): string {
    return NAME
  }

  static getInstance(element: Element | null | undefined): FullScreen | null {
    return this._getInstance(element) as FullScreen | null
  }

  static getOrCreateInstance(element: HTMLElement): FullScreen {
    return this.getInstance(element) ?? new this(element)
  }

  inFullScreen(): void {
    // No espera una respuesta: el evento `fullscreenchange` actualiza los
    // iconos y dispara `maximized.lte.fullscreen`. Si se rechaza la solicitud,
    // el evento no se dispara y la interfaz permanece sin cambios.
    void document.documentElement.requestFullscreen().catch(() => {
      // Se rechazó la solicitud; no hay nada que revertir.
    })
  }

  outFullscreen(): void {
    void document.exitFullscreen().catch(() => {
      // No se pudo salir del modo; no hay nada que revertir.
    })
  }

  toggleFullScreen(): void {
    if (!document.fullscreenEnabled) {
      return
    }

    if (document.fullscreenElement) {
      this.outFullscreen()
    } else {
      this.inFullScreen()
    }
  }
}

/**
 * Implementación de la API de datos
 * ============================================================================
 * Los clics de alternancia se delegan en `document`. El listener de
 * fullscreenchange se vuelve a registrar en cada carga de página mediante la
 * señal del ciclo de vida.
 */

document.addEventListener('click', event => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const button = target.closest(SELECTOR_FULLSCREEN_TOGGLE) as HTMLElement | null

  if (!button) {
    return
  }

  event.preventDefault()
  FullScreen.getOrCreateInstance(button).toggleFullScreen()
})

onDOMContentLoaded(() => {
  document.addEventListener('fullscreenchange', syncFullScreenState, { signal: getLifecycleSignal() })
})

export default FullScreen
