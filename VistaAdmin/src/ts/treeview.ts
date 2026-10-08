/**
 * --------------------------------------------
 * @file AdminLTE treeview.ts
 * @description Complemento Treeview de AdminLTE.
 * @license MIT
 * --------------------------------------------
 */

import { BaseComponent, dispatchCustomEvent } from './base-component'
import {
  onDOMContentLoaded,
  slideDown,
  slideUp
} from './util/index'

/**
 * ------------------------------------------------------------------------
 * Constantes
 * ------------------------------------------------------------------------
 */

const NAME = 'treeview'
const EVENT_KEY = `.lte.${NAME}`

// Eventos «before» cancelables (se envían al elemento de navegación al iniciar una acción).
const EVENT_EXPAND = `expand${EVENT_KEY}`
const EVENT_COLLAPSE = `collapse${EVENT_KEY}`

// Eventos «after» (se envían al elemento de navegación cuando termina la animación).
const EVENT_EXPANDED = `expanded${EVENT_KEY}`
const EVENT_COLLAPSED = `collapsed${EVENT_KEY}`
const EVENT_LOAD_DATA_API = `load${EVENT_KEY}`

const CLASS_NAME_MENU_OPEN = 'menu-open'
const SELECTOR_NAV_ITEM = '.nav-item'
const SELECTOR_NAV_LINK = '.nav-link'
const SELECTOR_TREEVIEW_MENU = '.nav-treeview'
const SELECTOR_DATA_TOGGLE = '[data-lte-toggle="treeview"]'

const Default = {
  animationSpeed: 300,
  accordion: true
}

type Config = {
  animationSpeed: number;
  accordion: boolean;
}

/**
 * Refleja el estado abierto del submenú en su enlace de alternancia, para que
 * los lectores de pantalla indiquen si Treeview se puede expandir o ya está
 * expandido (WCAG 4.1.2).
 */
const setAriaExpanded = (navItem: Element, expanded: boolean): void => {
  const link = navItem.querySelector(`:scope > ${SELECTOR_NAV_LINK}`)
  link?.setAttribute('aria-expanded', String(expanded))
}

/**
 * Definición de la clase
 * ====================================================
 */

class Treeview extends BaseComponent {
  static get NAME(): string {
    return NAME
  }

  static getInstance(element: Element | null | undefined): Treeview | null {
    return this._getInstance(element) as Treeview | null
  }

  static getOrCreateInstance(element: HTMLElement, config: Partial<Config> = {}): Treeview {
    return this.getInstance(element) ?? new this(element, config)
  }

  _config: Config

  constructor(element: HTMLElement, config: Partial<Config> = {}) {
    super(element)
    this._config = { ...Default, ...config }
  }

  open(): void {
    if (dispatchCustomEvent(this._element, EVENT_EXPAND, { cancelable: true }).defaultPrevented) {
      return
    }

    if (this._config.accordion) {
      const openMenuList = this._element.parentElement?.querySelectorAll(`${SELECTOR_NAV_ITEM}.${CLASS_NAME_MENU_OPEN}`)

      openMenuList?.forEach(openMenu => {
        // Omite el elemento que se está abriendo y sus elementos anidados. La
        // comprobación anterior lo comparaba con el <ul> principal, que nunca
        // coincide con un elemento de navegación; por eso, al llamar open() en
        // un elemento abierto, se plegaba su propio menú.
        if (!this._element.contains(openMenu)) {
          openMenu.classList.remove(CLASS_NAME_MENU_OPEN)
          setAriaExpanded(openMenu, false)
          const childElement = openMenu?.querySelector(SELECTOR_TREEVIEW_MENU) as HTMLElement | undefined
          if (childElement) {
            slideUp(childElement, this._config.animationSpeed)
          }
        }
      })
    }

    this._element.classList.add(CLASS_NAME_MENU_OPEN)
    setAriaExpanded(this._element, true)

    const childElement = this._element.querySelector(SELECTOR_TREEVIEW_MENU) as HTMLElement | undefined
    if (childElement) {
      slideDown(childElement, this._config.animationSpeed)
    }

    setTimeout(() => {
      if (this._element.classList.contains(CLASS_NAME_MENU_OPEN)) {
        dispatchCustomEvent(this._element, EVENT_EXPANDED)
      }
    }, this._config.animationSpeed)
  }

  close(): void {
    if (dispatchCustomEvent(this._element, EVENT_COLLAPSE, { cancelable: true }).defaultPrevented) {
      return
    }

    this._element.classList.remove(CLASS_NAME_MENU_OPEN)
    setAriaExpanded(this._element, false)

    const childElement = this._element.querySelector(SELECTOR_TREEVIEW_MENU) as HTMLElement | undefined
    if (childElement) {
      slideUp(childElement, this._config.animationSpeed)
    }

    setTimeout(() => {
      if (!this._element.classList.contains(CLASS_NAME_MENU_OPEN)) {
        dispatchCustomEvent(this._element, EVENT_COLLAPSED)
      }
    }, this._config.animationSpeed)
  }

  toggle(): void {
    if (this._element.classList.contains(CLASS_NAME_MENU_OPEN)) {
      this.close()
    } else {
      this.open()
    }
  }
}

/**
 * ------------------------------------------------------------------------
 * Implementación de la API de datos
 * ------------------------------------------------------------------------
 * Un listener delegado en `document` gestiona los clics, por lo que los
 * elementos agregados después de la carga (menús dinámicos y Turbo Frames)
 * funcionan sin reinicializar. El estado inicial (menús abiertos e
 * inicialización de ARIA) se aplica por página más abajo.
 */

document.addEventListener('click', event => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const toggleRoot = target.closest(SELECTOR_DATA_TOGGLE) as HTMLElement | null

  if (!toggleRoot) {
    return
  }

  const targetItem = target.closest(SELECTOR_NAV_ITEM) as HTMLElement | null
  const targetLink = target.closest(SELECTOR_NAV_LINK)

  // Evita crear instancias de Treeview en elementos que no sean menús.
  if (!targetItem?.querySelector(SELECTOR_TREEVIEW_MENU)) {
    return
  }

  if (target.getAttribute('href') === '#' || targetLink?.getAttribute('href') === '#') {
    event.preventDefault()
  }

  // Lee la configuración de los atributos de datos en la raíz de Treeview y,
  // si no existen, usa los valores predeterminados. La configuración de la
  // primera interacción se conserva en la instancia.
  const accordionAttr = toggleRoot.dataset.accordion
  const animationSpeedAttr = toggleRoot.dataset.animationSpeed

  const config: Config = {
    accordion: accordionAttr === undefined ? Default.accordion : accordionAttr === 'true',
    animationSpeed: animationSpeedAttr === undefined ? Default.animationSpeed : Number(animationSpeedAttr)
  }

  Treeview.getOrCreateInstance(targetItem, config).toggle()
})

onDOMContentLoaded(() => {
  const openMenuItems = document.querySelectorAll(`${SELECTOR_NAV_ITEM}.${CLASS_NAME_MENU_OPEN}`)

  openMenuItems.forEach(menuItem => {
    const childElement = menuItem.querySelector(SELECTOR_TREEVIEW_MENU) as HTMLElement | undefined
    if (childElement) {
      slideDown(childElement, 0)

      const event = new Event(EVENT_LOAD_DATA_API)
      menuItem.dispatchEvent(event)
    }
  })

  // Establece el estado ARIA inicial en cada control del submenú para que las
  // tecnologías de asistencia sepan que los elementos se pueden expandir
  // antes de que el usuario interactúe.
  document.querySelectorAll(SELECTOR_DATA_TOGGLE).forEach(root => {
    root.querySelectorAll(SELECTOR_NAV_ITEM).forEach(item => {
      if (item.querySelector(`:scope > ${SELECTOR_TREEVIEW_MENU}`)) {
        setAriaExpanded(item, item.classList.contains(CLASS_NAME_MENU_OPEN))
      }
    })
  })
})

export default Treeview
