/**
 * --------------------------------------------
 * @file AdminLTE card-widget.ts
 * @description Widget de tarjetas de AdminLTE.
 * @license MIT
 * --------------------------------------------
 */

import { BaseComponent, dispatchCustomEvent } from './base-component'
import {
  slideUp,
  slideDown
} from './util/index'

/**
 * Constantes
 * ====================================================
 */

const NAME = 'card-widget'
const EVENT_KEY = `.lte.${NAME}`

// Eventos «before» cancelables: se envían a la tarjeta cuando comienza una acción.
const EVENT_COLLAPSE = `collapse${EVENT_KEY}`
const EVENT_EXPAND = `expand${EVENT_KEY}`
const EVENT_REMOVE = `remove${EVENT_KEY}`

// Eventos «after»: se envían a la tarjeta cuando termina una acción.
const EVENT_COLLAPSED = `collapsed${EVENT_KEY}`
const EVENT_EXPANDED = `expanded${EVENT_KEY}`
const EVENT_REMOVED = `removed${EVENT_KEY}`
const EVENT_MAXIMIZED = `maximized${EVENT_KEY}`
const EVENT_MINIMIZED = `minimized${EVENT_KEY}`

const CLASS_NAME_CARD = 'card'
const CLASS_NAME_COLLAPSED = 'collapsed-card'
const CLASS_NAME_COLLAPSING = 'collapsing-card'
const CLASS_NAME_EXPANDING = 'expanding-card'
const CLASS_NAME_WAS_COLLAPSED = 'was-collapsed'
const CLASS_NAME_MAXIMIZED = 'maximized-card'

const SELECTOR_DATA_REMOVE = '[data-lte-toggle="card-remove"]'
const SELECTOR_DATA_COLLAPSE = '[data-lte-toggle="card-collapse"]'
const SELECTOR_DATA_MAXIMIZE = '[data-lte-toggle="card-maximize"]'
const SELECTOR_CARD = `.${CLASS_NAME_CARD}`
const SELECTOR_CARD_BODY = '.card-body'
const SELECTOR_CARD_FOOTER = '.card-footer'

type Config = {
  animationSpeed: number;
  collapseTrigger: string;
  removeTrigger: string;
  maximizeTrigger: string;
}

const Default: Config = {
  animationSpeed: 500,
  collapseTrigger: SELECTOR_DATA_COLLAPSE,
  removeTrigger: SELECTOR_DATA_REMOVE,
  maximizeTrigger: SELECTOR_DATA_MAXIMIZE
}

class CardWidget extends BaseComponent {
  static get NAME(): string {
    return NAME
  }

  static getInstance(element: Element | null | undefined): CardWidget | null {
    return this._getInstance(element) as CardWidget | null
  }

  static getOrCreateInstance(element: HTMLElement, config: Partial<Config> = {}): CardWidget {
    return this.getInstance(element) ?? new this(element, config)
  }

  _parent: HTMLElement | undefined
  _config: Config

  constructor(element: HTMLElement, config: Partial<Config> = {}) {
    super(element)
    this._parent = element.closest(SELECTOR_CARD) as HTMLElement | undefined

    if (element.classList.contains(CLASS_NAME_CARD)) {
      this._parent = element
    }

    this._config = { ...Default, ...config }
  }

  collapse() {
    if (!this._parent) {
      return
    }

    if (dispatchCustomEvent(this._parent, EVENT_COLLAPSE, { cancelable: true }).defaultPrevented) {
      return
    }

    this._parent.classList.add(CLASS_NAME_COLLAPSING)
    this._parent.classList.remove(CLASS_NAME_EXPANDING)

    // Solo selecciona los elementos secundarios directos para no afectar tarjetas anidadas.
    const elm = this._parent.querySelectorAll(`:scope > ${SELECTOR_CARD_BODY}, :scope > ${SELECTOR_CARD_FOOTER}`)

    elm.forEach(el => {
      if (el instanceof HTMLElement) {
        slideUp(el, this._config.animationSpeed)
      }
    })

    setTimeout(() => {
      // Evita un temporizador obsoleto: si expand() se ejecutó mientras la
      // tarjeta aún se plegaba, no debe quedar marcada como plegada.
      if (this._parent?.classList.contains(CLASS_NAME_COLLAPSING)) {
        this._parent.classList.add(CLASS_NAME_COLLAPSED)
        this._parent.classList.remove(CLASS_NAME_COLLAPSING)
        dispatchCustomEvent(this._parent, EVENT_COLLAPSED)
      }
    }, this._config.animationSpeed)
  }

  expand() {
    if (!this._parent) {
      return
    }

    if (dispatchCustomEvent(this._parent, EVENT_EXPAND, { cancelable: true }).defaultPrevented) {
      return
    }

    this._parent.classList.add(CLASS_NAME_EXPANDING)
    this._parent.classList.remove(CLASS_NAME_COLLAPSING, CLASS_NAME_COLLAPSED)

    // Seleccionar solo los hijos directos para no afectar las tarjetas anidadas.
    const elm = this._parent.querySelectorAll(`:scope > ${SELECTOR_CARD_BODY}, :scope > ${SELECTOR_CARD_FOOTER}`)

    elm.forEach(el => {
      if (el instanceof HTMLElement) {
        slideDown(el, this._config.animationSpeed)
      }
    })

    setTimeout(() => {
      // La misma protección contra temporizadores obsoletos que en collapse(), en sentido inverso.
      if (this._parent?.classList.contains(CLASS_NAME_EXPANDING)) {
        this._parent.classList.remove(CLASS_NAME_EXPANDING)
        dispatchCustomEvent(this._parent, EVENT_EXPANDED)
      }
    }, this._config.animationSpeed)
  }

  remove() {
    if (!this._parent) {
      return
    }

    if (dispatchCustomEvent(this._parent, EVENT_REMOVE, { cancelable: true }).defaultPrevented) {
      return
    }

    const parent = this._parent
    slideUp(parent, this._config.animationSpeed)

    // Eliminar la tarjeta cuando termine la animación: si solo se ocultara,
    // sus campos seguirían enviándose y sus ids permanecerían en el documento.
    // `removed` se emite justo antes de separarla para que el evento se propague.
    setTimeout(() => {
      dispatchCustomEvent(parent, EVENT_REMOVED)
      parent.remove()
      this.dispose()
    }, this._config.animationSpeed)
  }

  toggle() {
    // Una tarjeta que se contrae ya cuenta como contraída; un segundo clic invierte la animación.
    if (this._parent?.classList.contains(CLASS_NAME_COLLAPSED) || this._parent?.classList.contains(CLASS_NAME_COLLAPSING)) {
      this.expand()
      return
    }

    this.collapse()
  }

  maximize() {
    if (this._parent) {
      this._parent.style.height = `${this._parent.offsetHeight}px`
      this._parent.style.width = `${this._parent.offsetWidth}px`
      this._parent.style.transition = 'all .15s'

      setTimeout(() => {
        const htmlTag = document.querySelector('html')

        if (htmlTag) {
          htmlTag.classList.add(CLASS_NAME_MAXIMIZED)
        }

        if (this._parent) {
          this._parent.classList.add(CLASS_NAME_MAXIMIZED)

          if (this._parent.classList.contains(CLASS_NAME_COLLAPSED)) {
            this._parent.classList.add(CLASS_NAME_WAS_COLLAPSED)
          }

          dispatchCustomEvent(this._parent, EVENT_MAXIMIZED)
        }
      }, 150)
    }
  }

  minimize() {
    if (this._parent) {
      this._parent.style.height = 'auto'
      this._parent.style.width = 'auto'
      this._parent.style.transition = 'all .15s'

      setTimeout(() => {
        const htmlTag = document.querySelector('html')

        if (htmlTag) {
          htmlTag.classList.remove(CLASS_NAME_MAXIMIZED)
        }

        if (this._parent) {
          this._parent.classList.remove(CLASS_NAME_MAXIMIZED)

          if (this._parent?.classList.contains(CLASS_NAME_WAS_COLLAPSED)) {
            this._parent.classList.remove(CLASS_NAME_WAS_COLLAPSED)
          }

          dispatchCustomEvent(this._parent, EVENT_MINIMIZED)

          // Quitar el tamaño y la transición en línea cuando termine la animación
          // de restauración para que no queden estilos obsoletos.
          setTimeout(() => {
            this._parent?.style.removeProperty('height')
            this._parent?.style.removeProperty('width')
            this._parent?.style.removeProperty('transition')
          }, 150)
        }
      }, 10)
    }
  }

  toggleMaximize() {
    if (this._parent?.classList.contains(CLASS_NAME_MAXIMIZED)) {
      this.minimize()
      return
    }

    this.maximize()
  }
}

/**
 *
 * Implementación de la API de datos
 * ====================================================
 * Un único listener delegado en `document` gestiona todos los controles de tarjetas, por lo que
 * las tarjetas insertadas después (AJAX, Turbo Frames) funcionan sin reinicialización,
 * y el listener sigue activo cuando Turbo reemplaza <body>.
 */

document.addEventListener('click', event => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const collapseTrigger = target.closest(SELECTOR_DATA_COLLAPSE)
  const removeTrigger = target.closest(SELECTOR_DATA_REMOVE)
  const maximizeTrigger = target.closest(SELECTOR_DATA_MAXIMIZE)
  const trigger = collapseTrigger ?? removeTrigger ?? maximizeTrigger

  if (!trigger) {
    return
  }

  event.preventDefault()

  const card = trigger.closest(SELECTOR_CARD) as HTMLElement | null

  if (!card) {
    return
  }

  const widget = CardWidget.getOrCreateInstance(card)

  if (collapseTrigger) {
    widget.toggle()
  } else if (removeTrigger) {
    widget.remove()
  } else {
    widget.toggleMaximize()
  }
})

export default CardWidget
