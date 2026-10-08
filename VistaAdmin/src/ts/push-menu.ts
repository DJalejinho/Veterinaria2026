/**
 * ----------------------------------------------------------------------------
 * @file AdminLTE push-menu.ts
 * @description Menú lateral PushMenu de AdminLTE.
 * @license MIT
 * ----------------------------------------------------------------------------
 */

import { BaseComponent, dispatchCustomEvent } from './base-component'
import {
  getLifecycleSignal,
  onDOMContentLoaded
} from './util/index'

/**
 * ----------------------------------------------------------------------------
 * Constantes
 * ----------------------------------------------------------------------------
 */

const NAME = 'push-menu'
const EVENT_KEY = `.lte.${NAME}`

// Eventos «before» cancelables: preventDefault() cancela el cambio de estado.
const EVENT_OPEN = `open${EVENT_KEY}`
const EVENT_COLLAPSE = `collapse${EVENT_KEY}`

// Eventos «after»: se envían una vez aplicadas las clases.
const EVENT_OPENED = `opened${EVENT_KEY}`
const EVENT_COLLAPSED = `collapsed${EVENT_KEY}`

const CLASS_NAME_SIDEBAR_MINI = 'sidebar-mini'
const CLASS_NAME_SIDEBAR_EXPAND = 'sidebar-expand'
const CLASS_NAME_SIDEBAR_OVERLAY = 'sidebar-overlay'

// Clases que indican explícitamente el estado de la barra lateral.
// - sidebar-collapse: la barra lateral se encuentra plegada.
// - sidebar-open: la barra lateral se abrió explícitamente en dispositivos móviles.
const CLASS_NAME_SIDEBAR_COLLAPSE = 'sidebar-collapse'
const CLASS_NAME_SIDEBAR_OPEN = 'sidebar-open'

const SELECTOR_APP_SIDEBAR = '.app-sidebar'
const SELECTOR_APP_WRAPPER = '.app-wrapper'
const SELECTOR_SIDEBAR_EXPAND = `[class*="${CLASS_NAME_SIDEBAR_EXPAND}"]`
const SELECTOR_SIDEBAR_TOGGLE = '[data-lte-toggle="sidebar"]'

const STORAGE_KEY_SIDEBAR_STATE = 'lte.sidebar.state'

/**
 * ----------------------------------------------------------------------------
 * Interfaz del objeto de configuración
 * - sidebarBreakpoint: ancho de pantalla en píxeles por debajo del cual la
 *   barra lateral se considera en modo móvil y se pliega de forma predeterminada,
 *   salvo que se abra explícitamente.
 * - enablePersistence: indica si se guarda el estado de la barra lateral
 *   (plegada/abierta) en localStorage y se restaura al cargar la página.
 * ----------------------------------------------------------------------------
 */

type Config = {
  sidebarBreakpoint: number;
  enablePersistence: boolean;
}

const Defaults: Config = {
  // Coincide con la convención CSS (breakpoint-max = breakpoint - .02) para que
  // una ventana de exactamente 992 px se considere de escritorio tanto en JS como en CSS.
  sidebarBreakpoint: 991.98,
  enablePersistence: false
}

/**
 * ----------------------------------------------------------------------------
 * Definición de la clase
 * ----------------------------------------------------------------------------
 */

class PushMenu extends BaseComponent {
  static get NAME(): string {
    return NAME
  }

  /**
   * Busca la instancia de PushMenu asociada al elemento indicado.
   *
   * @param element Elemento de la barra lateral que se desea buscar.
   * @returns Instancia existente o null si todavía no hay una asociada.
   */
  static getInstance(element: Element | null | undefined): PushMenu | null {
    return this._getInstance(element) as PushMenu | null
  }

  /**
   * Busca la instancia de PushMenu asociada al elemento y crea una si no existe.
   * Si ya existe una instancia, se ignora `config`.
   *
   * @param element Elemento de la barra lateral.
   * @param config Opciones que se combinan con los valores predeterminados al crear una instancia.
   * @returns Instancia existente o recién creada.
   */
  static getOrCreateInstance(element: HTMLElement, config: Partial<Config> = {}): PushMenu {
    return this.getInstance(element) ?? new this(element, config)
  }

  /**
   * Valores predeterminados combinados con las opciones usadas para crear esta instancia.
   */
  _config: Config

  /**
   * @param element Elemento de la barra lateral al que se asociará la instancia.
   * @param config Opciones que se combinan con los valores predeterminados.
   */
  constructor(element: HTMLElement, config: Partial<Config> = {}) {
    super(element)
    this._config = { ...Defaults, ...config }
  }

  /**
   * Comprueba si la barra lateral está plegada.
   *
   * @returns true si la barra lateral está plegada; en caso contrario, false.
   */
  isCollapsed(): boolean {
    return document.body.classList.contains(CLASS_NAME_SIDEBAR_COLLAPSE)
  }

  /**
   * Comprueba si la barra lateral se abrió explícitamente en una pantalla móvil.
   *
   * @returns true si la barra lateral está abierta explícitamente; en caso contrario, false.
   */
  isExplicitlyOpen(): boolean {
    return document.body.classList.contains(CLASS_NAME_SIDEBAR_OPEN)
  }

  /**
   * Comprueba si la barra lateral está en modo compacto.
   *
   * @returns true si la barra lateral está en modo compacto; en caso contrario, false.
   */
  isMiniMode(): boolean {
    return document.body.classList.contains(CLASS_NAME_SIDEBAR_MINI)
  }

  /**
   * Comprueba si el tamaño de pantalla actual se considera móvil según el valor
   * sidebarBreakpoint de la configuración.
   *
   * @returns true si el tamaño de pantalla es móvil; en caso contrario, false.
   */
  isMobileSize(): boolean {
    return globalThis.innerWidth <= this._config.sidebarBreakpoint
  }

  /**
   * Expande el menú lateral.
   */
  expand(): void {
    // El evento «open» se puede cancelar: preventDefault() mantiene la barra
    // lateral en su estado actual.
    if (dispatchCustomEvent(this._element, EVENT_OPEN, { cancelable: true }).defaultPrevented) {
      return
    }

    // Quita la clase sidebar-collapse. Solo en móviles agrega sidebar-open para
    // indicar que la barra lateral está abierta explícitamente.

    document.body.classList.remove(CLASS_NAME_SIDEBAR_COLLAPSE)

    if (this.isMobileSize()) {
      document.body.classList.add(CLASS_NAME_SIDEBAR_OPEN)
    }

    dispatchCustomEvent(this._element, EVENT_OPENED)
  }

  /**
   * Pliega el menú lateral.
   */
  collapse(): void {
    // El evento «collapse» se puede cancelar: preventDefault() mantiene la barra
    // lateral en su estado actual.
    if (dispatchCustomEvent(this._element, EVENT_COLLAPSE, { cancelable: true }).defaultPrevented) {
      return
    }

    // Quita la clase sidebar-open, si existe, y agrega sidebar-collapse.

    document.body.classList.remove(CLASS_NAME_SIDEBAR_OPEN)
    document.body.classList.add(CLASS_NAME_SIDEBAR_COLLAPSE)

    dispatchCustomEvent(this._element, EVENT_COLLAPSED)
  }

  /**
   * Alterna el estado del menú lateral.
   */
  toggle(): void {
    // Alterna el estado de la barra lateral.

    const isCollapsed = this.isCollapsed()

    if (isCollapsed) {
      this.expand()
    } else {
      this.collapse()
    }

    // Si la persistencia está activada, guarda el estado nuevo en localStorage.

    if (this._config.enablePersistence) {
      this.saveSidebarState(
        isCollapsed ? CLASS_NAME_SIDEBAR_OPEN : CLASS_NAME_SIDEBAR_COLLAPSE
      )
    }
  }

  /**
   * Lee del DOM el punto de quiebre CSS de la barra lateral y actualiza
   * sidebarBreakpoint. El punto de quiebre se define mediante el pseudoelemento
   * CSS ::before del elemento sidebar-expand, cuando las consultas @media
   * modifican el comportamiento según el tamaño de pantalla.
   */
  setupSidebarBreakPoint(): void {
    // Busca el elemento sidebar-expand en el DOM.

    const sidebarExpand = document.querySelector(SELECTOR_SIDEBAR_EXPAND)

    if (!sidebarExpand) {
      return
    }

    // Lee la propiedad content del pseudoelemento ::before para obtener el
    // valor del punto de quiebre.

    const content = globalThis.getComputedStyle(sidebarExpand, '::before')
      .getPropertyValue('content')

    // Actualiza config.sidebarBreakpoint al extraer el valor numérico de la
    // cadena content.

    if (!content || content === 'none') {
      return
    }

    const breakpointValue = Number(content.replace(/[^\d.-]/g, ''))

    if (Number.isNaN(breakpointValue)) {
      return
    }

    this._config = { ...this._config, sidebarBreakpoint: breakpointValue }
  }

  /**
   * Actualiza el estado de la barra lateral según el tamaño de pantalla actual
   * y el valor sidebarBreakpoint de la configuración.
   */
  updateStateByResponsiveLogic(): void {
    if (this.isMobileSize()) {
      // En pantallas móviles, mantiene la barra plegada salvo que el usuario la
      // haya abierto explícitamente. Así evita cambios no deseados al desplazarse
      // o cambiar el tamaño de la ventana.

      if (!this.isExplicitlyOpen()) {
        this.collapse()
      }
    } else {
      // En pantallas grandes, mantiene la barra expandida salvo que esté en modo
      // compacto y se haya plegado explícitamente.

      if (!(this.isMiniMode() && this.isCollapsed())) {
        this.expand()
      }
    }
  }

  /**
   * Guarda el estado de la barra lateral en localStorage.
   *
   * @param state Estado que se guardará ('sidebar-open' o 'sidebar-collapse').
   */
  saveSidebarState(state: string): void {
    // Comprueba que localStorage esté disponible (no se ejecuta en un entorno SSR).

    if (globalThis.localStorage === undefined) {
      return
    }

    // Guarda el estado de la barra lateral en localStorage.

    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_STATE, state)
    } catch {
      // localStorage puede no estar disponible (navegación privada, cuota
      // excedida, etc.). En esos casos, no genera errores.
    }
  }

  /**
   * Carga el estado de la barra lateral desde localStorage.
   */
  loadSidebarState(): void {
    // Comprobar si localStorage está disponible (no estamos en un entorno SSR).

    if (globalThis.localStorage === undefined) {
      return
    }

    // Carga el estado de la barra lateral desde localStorage.

    try {
      const storedState = localStorage.getItem(STORAGE_KEY_SIDEBAR_STATE)

      if (storedState === CLASS_NAME_SIDEBAR_COLLAPSE) {
        this.collapse()
      } else if (storedState === CLASS_NAME_SIDEBAR_OPEN) {
        this.expand()
      } else {
        // Si es null (nunca se guardó), deja que se aplique la lógica adaptable.
        this.updateStateByResponsiveLogic()
      }
    } catch {
      // Si localStorage no está disponible, deja que se aplique la lógica adaptable.
      this.updateStateByResponsiveLogic()
    }
  }

  /**
   * Elimina el estado de la barra lateral de localStorage.
   */
  clearSidebarState(): void {
    // Comprobar si localStorage está disponible (no estamos en un entorno SSR).

    if (globalThis.localStorage === undefined) {
      return
    }

    // Elimina el estado de la barra lateral de localStorage.

    try {
      localStorage.removeItem(STORAGE_KEY_SIDEBAR_STATE)
    } catch {
      // localStorage puede no estar disponible. En esos casos, no genera errores.
    }
  }

  /**
   * Inicializa el complemento PushMenu y establece el estado inicial de la barra lateral.
   */
  init(): void {
    // Lee y configura el punto de quiebre de la barra lateral desde el DOM. Se
    // usa para distinguir entre los modos móvil y escritorio.

    this.setupSidebarBreakPoint()

    // Si la persistencia está desactivada, elimina cualquier estado guardado.

    if (!this._config.enablePersistence) {
      this.clearSidebarState()
    }

    // Si la persistencia está activada y la pantalla supera el punto de quiebre,
    // carga de localStorage el estado guardado. En caso contrario, determina el
    // estado inicial con la lógica adaptable, salvo que ya se haya especificado
    // que debe permanecer plegada durante la inicialización.

    if (this._config.enablePersistence && !this.isMobileSize()) {
      this.loadSidebarState()
    } else if (!this.isCollapsed()) {
      this.updateStateByResponsiveLogic()
    }
  }
}

/**
 * ----------------------------------------------------------------------------
 * Implementación de la API de datos
 * ----------------------------------------------------------------------------
 * Un listener delegado en `document` gestiona los clics de alternancia, así que
 * funcionan los botones agregados más tarde y el listener sobrevive a los
 * reemplazos de <body> de Turbo. La instancia se crea por página más abajo y se
 * puede obtener desde cualquier parte con:
 *
 *   PushMenu.getInstance(document.querySelector('.app-sidebar'))
 */

document.addEventListener('click', event => {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const button = target.closest(SELECTOR_SIDEBAR_TOGGLE)

  if (!button) {
    return
  }

  event.preventDefault()

  const sidebar = document.querySelector(SELECTOR_APP_SIDEBAR) as HTMLElement | null

  if (sidebar) {
    PushMenu.getOrCreateInstance(sidebar).toggle()
  }
})

onDOMContentLoaded(() => {
  // Busca el elemento de la barra lateral en el DOM.

  const sidebar = document.querySelector(SELECTOR_APP_SIDEBAR) as HTMLElement | null

  if (!sidebar) {
    return
  }

  // Lee la configuración de los atributos de datos de la barra lateral y usa
  // los valores predeterminados si no se especifican.

  const sidebarBreakpointAttr = sidebar.dataset.sidebarBreakpoint
  const enablePersistenceAttr = sidebar.dataset.enablePersistence

  const config: Config = {
    sidebarBreakpoint: sidebarBreakpointAttr === undefined ?
      Defaults.sidebarBreakpoint :
      Number(sidebarBreakpointAttr),
    enablePersistence: enablePersistenceAttr === undefined ?
      Defaults.enablePersistence :
      enablePersistenceAttr === 'true'
  }

  // Inicializa PushMenu con una instancia única por barra lateral. Turbo
  // reemplaza el elemento al navegar, por lo que crea una instancia nueva y la
  // anterior se elimina junto con el <body> antiguo.

  const pushMenu = PushMenu.getOrCreateInstance(sidebar, config)
  pushMenu.init()

  // Actualiza el estado solo cuando la ventana cruza el punto de quiebre. matchMedia
  // se activa únicamente al cruzarlo, así que los cambios de altura (barra de URL
  // o teclado móvil) y los cambios de ancho en el mismo lado no alteran el estado
  // elegido. init() ya leyó el punto de quiebre efectivo del CSS.

  const breakpointQuery = globalThis.matchMedia(`(max-width: ${pushMenu._config.sidebarBreakpoint}px)`)

  breakpointQuery.addEventListener('change', () => {
    pushMenu.updateStateByResponsiveLogic()
  }, { signal: getLifecycleSignal() })

  // Crea la superposición de la barra lateral y la agrega al contenedor de la
  // aplicación. Si ya existe, la reutiliza: Turbo restaura desde la caché un
  // <body> que puede incluir el nodo insertado. Como la copia no conserva los
  // listeners, estos se vuelven a asociar más abajo.

  const appWrapper = document.querySelector(SELECTOR_APP_WRAPPER)
  let sidebarOverlay = appWrapper?.querySelector(`:scope > .${CLASS_NAME_SIDEBAR_OVERLAY}`) as HTMLElement | null

  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div')
    sidebarOverlay.className = CLASS_NAME_SIDEBAR_OVERLAY
    appWrapper?.append(sidebarOverlay)
  }

  // Gestiona los eventos táctiles de la superposición, que cubre el área fuera
  // de la barra lateral. En dispositivos móviles, un toque fuera de la barra
  // normalmente debe cerrarla.
  //
  // Se asocian a la señal del ciclo de vida aunque la superposición esté dentro
  // de <body>. Si se reutiliza el nodo al reinicializar un framework que conserva
  // el mismo <body>, los listeners sin señal se acumularían en cada ciclo.

  const overlaySignal = getLifecycleSignal()

  let overlayTouchMoved = false

  sidebarOverlay.addEventListener('touchstart', () => {
    overlayTouchMoved = false
  }, { passive: true, signal: overlaySignal })

  sidebarOverlay.addEventListener('touchmove', () => {
    overlayTouchMoved = true
  }, { passive: true, signal: overlaySignal })

  sidebarOverlay.addEventListener('touchend', event => {
    if (!overlayTouchMoved) {
      event.preventDefault()
      pushMenu.collapse()
    }

    overlayTouchMoved = false
  }, { passive: false, signal: overlaySignal })

  sidebarOverlay.addEventListener('click', event => {
    event.preventDefault()
    pushMenu.collapse()
  }, { signal: overlaySignal })
})

export default PushMenu
