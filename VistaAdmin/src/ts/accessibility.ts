/**
 * Módulo de accesibilidad de AdminLTE
 * Funciones para cumplir con WCAG 2.1 AA
 */

import { getLifecycleSignal } from './util/index'

export interface AccessibilityConfig {
  announcements: boolean
  skipLinks: boolean
  focusManagement: boolean
  keyboardNavigation: boolean
  reducedMotion: boolean
}

export class AccessibilityManager {
  private config: AccessibilityConfig
  private liveRegion: HTMLElement | null = null
  private focusHistory: HTMLElement[] = []
  // Los listeners asociados a `document` sobreviven al reemplazo de <body> que
  // hace Turbo. Se registran con esta señal y se eliminan antes de reiniciar.
  private readonly signal: AbortSignal = getLifecycleSignal()

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      announcements: true,
      skipLinks: true,
      focusManagement: true,
      keyboardNavigation: true,
      reducedMotion: true,
      ...config
    }

    this.init()
  }

  private init(): void {
    if (this.config.announcements) {
      this.createLiveRegion()
    }

    if (this.config.skipLinks) {
      this.addSkipLinks()
    }

    if (this.config.focusManagement) {
      this.initFocusManagement()
    }

    if (this.config.keyboardNavigation) {
      this.initKeyboardNavigation()
    }

    if (this.config.reducedMotion) {
      this.respectReducedMotion()
    }

    this.initErrorAnnouncements()
    this.initTableAccessibility()
    this.initFormAccessibility()
  }

  // WCAG 4.1.3: mensajes de estado
  private createLiveRegion(): void {
    if (this.liveRegion) return

    // Reutiliza una región existente para no duplicarla: Turbo guarda en caché
    // <body>, incluidos los nodos agregados por JavaScript, y restaura la región
    // junto con la página al navegar.
    const existingRegion = document.getElementById('live-region')
    if (existingRegion) {
      this.liveRegion = existingRegion
      return
    }

    this.liveRegion = document.createElement('div')
    this.liveRegion.id = 'live-region'
    this.liveRegion.className = 'live-region'
    this.liveRegion.setAttribute('aria-live', 'polite')
    this.liveRegion.setAttribute('aria-atomic', 'true')
    this.liveRegion.setAttribute('role', 'status')

    document.body.append(this.liveRegion)
  }

  // WCAG 2.4.1: permitir saltar bloques
  private addSkipLinks(): void {
    // Se aplica la misma precaución que en createLiveRegion: no vuelvas a
    // insertar enlaces para saltar contenido que Turbo restaura desde la caché.
    if (document.querySelector('.skip-links')) {
      this.ensureSkipTargets()
      return
    }

    const skipLinksContainer = document.createElement('div')
    skipLinksContainer.className = 'skip-links'
    
    const skipToMain = document.createElement('a')
    skipToMain.href = '#main'
    skipToMain.className = 'skip-link'
    skipToMain.textContent = 'Saltar al contenido principal'
    
    const skipToNav = document.createElement('a')
    skipToNav.href = '#navigation'
    skipToNav.className = 'skip-link'
    skipToNav.textContent = 'Saltar a la navegación'

    skipLinksContainer.append(skipToMain)
    skipLinksContainer.append(skipToNav)
    
    document.body.insertBefore(skipLinksContainer, document.body.firstChild)

    // Comprueba que existan los destinos y que puedan recibir el foco.
    this.ensureSkipTargets()
  }

  private ensureSkipTargets(): void {
    // Se respeta siempre el id que la página ya asignó. Antes se consultaba
    // `#navigation, nav, [role="navigation"]` en una sola llamada; una lista de
    // selectores devuelve el primer elemento en el orden del documento, no el
    // primer selector que coincide. Si el menú lateral ya tenía
    // `id="navigation"`, también se asignaba el mismo id al <nav> del encabezado,
    // que aparece antes. Esto duplicaba el id y dirigía el enlace para saltar
    // contenido y las consultas `#navigation` al elemento equivocado.
    const targets: Array<[string, string]> = [
      ['main', 'main, [role="main"]'],
      ['navigation', 'nav, [role="navigation"]']
    ]

    for (const [id, fallbackSelector] of targets) {
      const target = document.getElementById(id) ?? document.querySelector(fallbackSelector)

      if (!target) {
        continue
      }

      if (!target.id) {
        target.id = id
      }

      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }
    }
  }

  // WCAG 2.4.3: orden del foco; 2.4.7: foco visible
  private initFocusManagement(): void {
    // El foco nunca debe quedar atrapado en los extremos del documento. Si Tab
    // no permite salir de la página, las personas que usan teclado no pueden
    // acceder a los controles del navegador, lo cual incumple WCAG 2.1.2. Solo
    // se debe atrapar el foco dentro de un diálogo modal activo; Bootstrap ya
    // se encarga de ese comportamiento.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.handleEscapeKey(event)
      }
    }, { signal: this.signal })

    // Gestión del foco en cuadros modales y menús desplegables.
    this.initModalFocusManagement()
    this.initDropdownFocusManagement()
  }

  private handleEscapeKey(event: KeyboardEvent): void {
    // Cierra los menús desplegables y deja que Bootstrap gestione el teclado de los modales.
    const activeModal = document.querySelector('.modal.show')

    if (activeModal) {
      // No interviene: Bootstrap gestiona Escape en los modales, respeta
      // keyboard: false y admite modales apilados.
      return
    }

    const activeDropdown = document.querySelector('.dropdown-menu.show')
    if (activeDropdown) {
      const toggleButton = document.querySelector('[data-bs-toggle="dropdown"][aria-expanded="true"]') as HTMLElement
      toggleButton?.click()
      event.preventDefault()
    }
  }

  // WCAG 2.1.1: acceso mediante teclado
  private initKeyboardNavigation(): void {
    // Añade compatibilidad con teclado para los componentes personalizados.
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement

      // No intercepta teclas dentro de controles editables: las flechas deben
      // seguir moviendo el cursor, por ejemplo, en el buscador de la barra superior.
      if (target.matches('input, textarea, select, [contenteditable], [contenteditable] *')) {
        return
      }

      // Gestiona la navegación de menús con las teclas de flecha.
      if (target.closest('.nav, .navbar-nav, .dropdown-menu')) {
        this.handleMenuNavigation(event)
      }

      // Gestiona Enter y Espacio en botones personalizados.
      if ((event.key === 'Enter' || event.key === ' ') && target.hasAttribute('role') && target.getAttribute('role') === 'button' && !target.matches('button, input[type="button"], input[type="submit"]')) {
        event.preventDefault()
        target.click()
      }
    }, { signal: this.signal })
  }

  private handleMenuNavigation(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return
    }

    const currentElement = event.target as HTMLElement
    const menuItems = (Array.from(currentElement.closest('.nav, .navbar-nav, .dropdown-menu')?.querySelectorAll('a, button') || []) as HTMLElement[])
      // Omite los elementos ocultos en submenús plegados o menús desplegables cerrados.
      .filter(item => item.offsetParent !== null)
    const currentIndex = menuItems.indexOf(currentElement)

    // Solo controla la navegación cuando el foco está en un elemento del menú.
    // De lo contrario, las teclas de flecha apartarían el foco de otros controles
    // que simplemente están dentro de un contenedor de navegación.
    if (currentIndex === -1) {
      return
    }

    let nextIndex: number
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0
        break
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1
        break
      }
      case 'Home': {
        nextIndex = 0
        break
      }
      case 'End': {
        nextIndex = menuItems.length - 1
        break
      }
      default: {
        return
      }
    }
    
    event.preventDefault()
    menuItems[nextIndex]?.focus()
  }

  // WCAG 2.3.3: animaciones activadas por interacciones
  private respectReducedMotion(): void {
    const prefersReducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      document.body.classList.add('reduce-motion')
      
      // Desactiva el desplazamiento suave.
      document.documentElement.style.scrollBehavior = 'auto'
      
      // Reduce la duración de las animaciones. <head> sobrevive a la navegación
      // de Turbo, así que la hoja de estilos se agrega una sola vez para evitar duplicados.
      if (!document.getElementById('adminlte-reduce-motion')) {
        const style = document.createElement('style')
        style.id = 'adminlte-reduce-motion'
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        `
        document.head.append(style)
      }
    }
  }

  // WCAG 3.3.1: identificación de errores
  private initErrorAnnouncements(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            
            // Comprueba si hay mensajes de error.
            if (element.matches('.alert-danger, .invalid-feedback, .error')) {
              this.announce(element.textContent || 'Ocurrió un error', 'assertive')
            }
            
            // Comprueba si hay mensajes de éxito.
            if (element.matches('.alert-success, .success')) {
              this.announce(element.textContent || 'Operación exitosa', 'polite')
            }
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Deja de observar el <body> anterior antes de que Turbo lo reemplace.
    this.signal.addEventListener('abort', () => {
      observer.disconnect()
    }, { once: true })
  }

  // WCAG 1.3.1: información y relaciones
  private initTableAccessibility(): void {
    document.querySelectorAll('table').forEach((table) => {
      // Agrega el rol de tabla si hace falta.
      if (!table.hasAttribute('role')) {
        table.setAttribute('role', 'table')
      }

      // Comprueba que los encabezados tengan el ámbito adecuado.
      table.querySelectorAll('th').forEach((th) => {
        if (!th.hasAttribute('scope')) {
          const isInThead = th.closest('thead')
          const isFirstColumn = th.cellIndex === 0
          
          if (isInThead) {
            th.setAttribute('scope', 'col')
          } else if (isFirstColumn) {
            th.setAttribute('scope', 'row')
          }
        }
      })

      // Agrega un título a la tabla si falta y existe un atributo title.
      if (!table.querySelector('caption') && table.hasAttribute('title')) {
        const caption = document.createElement('caption')
        caption.textContent = table.getAttribute('title') || ''
        table.insertBefore(caption, table.firstChild)
      }
    })
  }

  // WCAG 3.3.2: etiquetas e instrucciones
  private initFormAccessibility(): void {
    document.querySelectorAll('input, select, textarea').forEach((input) => {
      const htmlInput = input as HTMLInputElement
      
      // Comprueba que todos los campos tengan etiquetas.
      if (!htmlInput.labels?.length && !htmlInput.hasAttribute('aria-label') && !htmlInput.hasAttribute('aria-labelledby')) {
        const placeholder = htmlInput.getAttribute('placeholder')
        if (placeholder) {
          htmlInput.setAttribute('aria-label', placeholder)
        }
      }

      // Agrega indicadores de campos obligatorios.
      if (htmlInput.hasAttribute('required')) {
        const label = htmlInput.labels?.[0]
        if (label && !label.querySelector('.required-indicator')) {
          const indicator = document.createElement('span')
          indicator.className = 'required-indicator sr-only'
          indicator.textContent = ' (obligatorio)'
          label.append(indicator)
        }
      }

      // Gestiona el estado no válido, salvo que el elemento lo desactive con la
      // clase 'disable-adminlte-validations'. Usa la señal del ciclo de vida:
      // bajo frameworks que reinicializan sobre un <body> persistente mediante
      // initialize(), los campos sobreviven al ciclo. Sin la señal se acumularía
      // un listener en cada campo con cada reinicialización.
      if (!htmlInput.classList.contains('disable-adminlte-validations')) {
        htmlInput.addEventListener('invalid', () => {
          this.handleFormError(htmlInput)
        }, { signal: this.signal })
      }
    })
  }

  private handleFormError(input: HTMLInputElement): void {
    // Si un campo no tiene id ni name, varios errores podrían compartir un único
    // id terminado en "-error". Genera un id estable y guárdalo en el elemento
    // para que los eventos `invalid` reutilicen el mismo nodo en lugar de crear
    // nodos huérfanos repetidos.
    if (!input.id && !input.name) {
      input.id = accessibilityUtils.generateId('field')
    }

    const errorId = `${input.id || input.name}-error`
    let errorElement = document.getElementById(errorId)
    
    if (!errorElement) {
      errorElement = document.createElement('div')
      errorElement.id = errorId
      errorElement.className = 'invalid-feedback'
      errorElement.setAttribute('role', 'alert')

      // Agrega el mensaje de error al final del elemento padre. Así no se
      // desarma el diseño de grupos de entrada de Bootstrap con adornos
      // `.input-group-text`, y el mensaje queda debajo de todo el grupo.
      input.parentNode?.append(errorElement)
    }
    
    errorElement.textContent = input.validationMessage
    // Conserva cualquier aria-describedby existente (por ejemplo, el texto de
    // ayuda) y agrega el id del error sin sobrescribirlo.
    const describedBy = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
    if (!describedBy.includes(errorId)) {
      describedBy.push(errorId)
    }

    input.setAttribute('aria-describedby', describedBy.join(' '))
    input.classList.add('is-invalid')
    
    this.announce(`Error in ${input.labels?.[0]?.textContent || input.name}: ${input.validationMessage}`, 'assertive')
  }

  // Gestión del foco en modales.
  private initModalFocusManagement(): void {
    // Guarda el elemento que abrió el modal durante `show`, antes de que
    // Bootstrap (o el listener `shown`) mueva el foco al modal. Si se guardara
    // durante `shown`, se almacenaría un elemento del propio modal y, al cerrarlo,
    // el foco volvería a un nodo oculto y terminaría en <body>.
    document.addEventListener('show.bs.modal', () => {
      this.focusHistory.push(document.activeElement as HTMLElement)
    }, { signal: this.signal })

    document.addEventListener('shown.bs.modal', (event) => {
      const modal = event.target as HTMLElement
      // Respeta [autofocus] si existe; de lo contrario, enfoca el primer control
      // que pueda recibir el foco.
      const autofocusElement = modal.querySelector('[autofocus]') as HTMLElement | null
      const firstFocusable = autofocusElement ||
        (modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement | null)

      firstFocusable?.focus()
    }, { signal: this.signal })

    document.addEventListener('hidden.bs.modal', () => {
      // Restaura el foco anterior, salvo que el elemento que abrió el modal ya
      // no esté en el documento (por ejemplo, si un modal de confirmación eliminó su fila).
      const previousElement = this.focusHistory.pop()
      if (previousElement?.isConnected) {
        previousElement.focus()
      }
    }, { signal: this.signal })
  }

  // Gestión del foco en menús desplegables.
  private initDropdownFocusManagement(): void {
    document.addEventListener('shown.bs.dropdown', (event) => {
      const dropdown = event.target as HTMLElement
      const menu = dropdown.querySelector('.dropdown-menu')
      const firstItem = menu?.querySelector('a, button') as HTMLElement
      
      if (firstItem) {
        firstItem.focus()
      }
    }, { signal: this.signal })
  }

  // Métodos de la API pública.
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) {
      this.createLiveRegion()
    }
    
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority)
      this.liveRegion.textContent = message
      
      // Limpia el mensaje después de anunciarlo.
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = ''
        }
      }, 1000)
    }
  }

  public focusElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      
      // Comprueba que el elemento esté visible.
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  public trapFocus(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const focusableArray = Array.from(focusableElements)
    const firstElement = focusableArray[0]
    const lastElement = focusableArray.at(-1)
    
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            event.preventDefault()
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus()
          event.preventDefault()
        }
      }
    }, { signal: this.signal })
  }

  public addLandmarks(): void {
    // Agrega la región principal si falta.
    const main = document.querySelector('main')
    if (!main) {
      const appMain = document.querySelector('.app-main')
      if (appMain) {
        appMain.setAttribute('role', 'main')
        if (!appMain.id) {
          appMain.id = 'main'
        }
      }
    }

    // Agrega regiones de navegación. Omite <ul>/<ol>: asignar role="navigation"
    // a una lista elimina su semántica de lista. Sus elementos <li> quedarían
    // desconectados para los lectores de pantalla y fallaría la comprobación de
    // Lighthouse «los elementos de lista deben estar dentro de una lista» (#6038).
    // Las listas de navegación deben estar dentro de <nav>, que ya proporciona
    // la región y su nombre accesible.
    document.querySelectorAll('.navbar-nav, .nav').forEach((nav, index) => {
      if (nav.tagName === 'UL' || nav.tagName === 'OL') {
        return
      }
      if (!nav.hasAttribute('role')) {
        nav.setAttribute('role', 'navigation')
      }
      if (!nav.hasAttribute('aria-label')) {
        nav.setAttribute('aria-label', `Navegación ${index + 1}`)
      }
    })

    // Agrega la región de búsqueda.
    const searchForm = document.querySelector('form[role="search"], .navbar-search')
    if (searchForm && !searchForm.hasAttribute('role')) {
      searchForm.setAttribute('role', 'search')
    }
  }
}

// Inicializa la accesibilidad cuando el DOM está listo.
export const initAccessibility = (config?: Partial<AccessibilityConfig>): AccessibilityManager => {
  return new AccessibilityManager(config)
}

// Convierte un color CSS en canales RGB. Acepta cadenas rgb()/rgba() y valores
// hexadecimales de 3 o 6 dígitos; para cualquier otro formato usa el negro.
const parseColorChannels = (color: string): number[] => {
  const hexMatch = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim())
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) {
      hex = [...hex].map(character => character + character).join('')
    }

    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16)
    ]
  }

  return color.match(/\d+/g)?.map(Number) || [0, 0, 0]
}

// Función auxiliar para calcular la luminancia.
const getLuminance = (color: string): number => {
  const [r, g, b] = parseColorChannels(color).map(c => {
    c = c / 255
    return c <= 0.039_28 ? c / 12.92 : (c + 0.055) ** 2.4 / (1.055 ** 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Exporta funciones auxiliares.
export const accessibilityUtils = {
  // WCAG 1.4.3: función para comprobar el contraste.
  checkColorContrast: (foreground: string, background: string): { ratio: number; passes: boolean } => {
    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      passes: ratio >= 4.5
    }
  },

  // Genera ids únicos para la accesibilidad.
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
  },

  // Comprueba si el elemento puede recibir el foco.
  isFocusable: (element: HTMLElement): boolean => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ]
    
    return focusableSelectors.some(selector => element.matches(selector))
  }
} 
