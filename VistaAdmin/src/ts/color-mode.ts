/**
 * --------------------------------------------
 * @file AdminLTE color-mode.ts
 * @description Selector de modo de color (claro/oscuro/automático) de AdminLTE.
 * Resuelve el tema en este orden: elección guardada del visitante, tema
 * declarado por la página en <html data-bs-theme="…"> y, por último,
 * preferencia del sistema operativo. Mantiene sincronizados los controles
 * [data-bs-theme-value] y los iconos indicadores [data-lte-theme-icon].
 *
 * Se incluye en el paquete para que las aplicaciones no tengan que copiar el
 * script en línea de la demostración. El pequeño fragmento de <head> que evita
 * el destello (consulta _head.astro) se mantiene en línea porque debe ejecutarse
 * antes del primer renderizado. Marca los valores que calcula con
 * [data-lte-theme-resolved], para distinguirlos de los temas definidos en el
 * marcado.
 *
 * Las aplicaciones que gestionan sus propios temas pueden desactivar esta
 * función con
 * <html data-lte-color-mode="off">.
 * @license MIT
 * --------------------------------------------
 */

import { getLifecycleSignal, onDOMContentLoaded } from './util/index'

/**
 * Constantes
 * ====================================================
 */

const DATA_KEY = 'lte.color-mode'
const EVENT_KEY = `.${DATA_KEY}`
const EVENT_CHANGED = `changed${EVENT_KEY}`

const STORAGE_KEY = 'lte-theme'

const ATTRIBUTE_THEME = 'data-bs-theme'
const ATTRIBUTE_TOGGLE = 'data-bs-theme-value'
const ATTRIBUTE_DISABLED = 'data-lte-color-mode'
const ATTRIBUTE_RESOLVED = 'data-lte-theme-resolved'

const SELECTOR_TOGGLE = `[${ATTRIBUTE_TOGGLE}]`
const SELECTOR_ICON = '[data-lte-theme-icon]'

type Theme = 'light' | 'dark' | 'auto'

const THEMES = new Set<string>(['light', 'dark', 'auto'])

const isValidTheme = (value: string): value is Theme => THEMES.has(value)

/**
 * Las aplicaciones que administran su propio tema pueden agregar
 * `data-lte-color-mode="off"` a <html>. En ese caso, ColorMode nunca modifica
 * `data-bs-theme`: ni durante la carga, ni al pulsar un control, ni cuando cambia
 * la preferencia del sistema. También permite usar temas personalizados de
 * Bootstrap cuyos nombres ColorMode no puede resolver (#6084).
 *
 * Se consulta en tiempo real, no se captura, para poder cambiarlo durante la ejecución.
 */
const isDisabled = (): boolean =>
  document.documentElement.getAttribute(ATTRIBUTE_DISABLED) === 'off'

/**
 * Tema declarado por la página en <html data-bs-theme="…">, o null si no declaró
 * ninguno.
 *
 * Se captura una sola vez al evaluar el módulo, porque el atributo sirve tanto
 * de entrada como de salida. Después de la primera llamada a `_applyTheme()`
 * contiene el valor escrito por ColorMode y no debe confundirse con la
 * intención de la página en ciclos posteriores (Turbo, `initialize()`). Aquí
 * se lee antes de cualquiera de ellos.
 *
 * El fragmento previo al renderizado de <head> escribe antes de que se cargue
 * este módulo, así que marca los valores calculados por sí mismo con
 * [data-lte-theme-resolved]. Esos valores no se consideran declarados en el
 * marcado y se ignoran.
 */
const readMarkupTheme = (): Theme | null => {
  const { documentElement } = document

  if (documentElement.hasAttribute(ATTRIBUTE_RESOLVED)) {
    return null
  }

  const declared = documentElement.getAttribute(ATTRIBUTE_THEME)

  return declared && isValidTheme(declared) ? declared : null
}

const MARKUP_THEME = readMarkupTheme()

/**
 * Definición de la clase
 * ====================================================
 */

class ColorMode {
  /**
   * Lee el tema guardado, o devuelve null si no hay ninguno o localStorage no
   * está disponible (navegación privada o iframe aislado).
   */
  getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored && isValidTheme(stored) ? stored : null
    } catch {
      return null
    }
  }

  /**
   * Tema declarado en el marcado por aplicaciones que lo generan en el servidor
   * a partir de una cookie o los datos del usuario. Devuelve null si la página
   * no declaró ninguno o si el valor es un tema personalizado de Bootstrap que
   * ColorMode no puede resolver. En este último caso, consulta `isDisabled`.
   */
  getMarkupTheme(): Theme | null {
    return MARKUP_THEME
  }

  /**
   * Elección efectiva del usuario: primero el tema guardado; luego, el tema
   * declarado en el marcado; y, si no hay ninguno, la preferencia del sistema.
   * El tema guardado tiene prioridad porque refleja una elección del visitante
   * en este dispositivo; el del marcado es solo el valor predeterminado de la página.
   */
  getPreferredTheme(): Theme {
    const preferred = this.getStoredTheme() ?? this.getMarkupTheme()
    if (preferred) {
      return preferred
    }

    return this._prefersDark() ? 'dark' : 'light'
  }

  /**
   * Resuelve el valor «auto» según la preferencia del sistema operativo.
   */
  resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'auto') {
      return this._prefersDark() ? 'dark' : 'light'
    }

    return theme
  }

  /**
   * Aplica un tema y guarda la elección. Envía `changed.lte.color-mode` en el
   * documento con { theme, resolved }.
   */
  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Es posible que localStorage no esté disponible; el tema se aplica de todos modos a esta página.
    }

    this._applyTheme(theme)
    this._showActiveTheme(theme)

    document.dispatchEvent(new CustomEvent(EVENT_CHANGED, {
      detail: { theme, resolved: this.resolveTheme(theme) }
    }))
  }

  /**
   * Aplica el tema sin guardarlo. Se usa al iniciar y cuando cambia la
   * preferencia del sistema en modo «auto».
   */
  _applyTheme(theme: Theme): void {
    const resolved = this.resolveTheme(theme)
    document.documentElement.setAttribute(ATTRIBUTE_THEME, resolved)
    document.documentElement.style.colorScheme = resolved
  }

  /**
   * Indica si el sistema operativo tiene seleccionada la apariencia oscura.
   */
  _prefersDark(): boolean {
    return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * Sincroniza los controles [data-bs-theme-value] (estado activo, estado
   * pulsado y marca de selección) y los iconos [data-lte-theme-icon].
   */
  _showActiveTheme(theme: Theme): void {
    document.querySelectorAll(SELECTOR_TOGGLE).forEach(toggle => {
      const isActive = toggle.getAttribute(ATTRIBUTE_TOGGLE) === theme
      toggle.classList.toggle('active', isActive)
      toggle.setAttribute('aria-pressed', String(isActive))
      toggle.querySelector('.bi-check-lg')?.classList.toggle('d-none', !isActive)
    })

    document.querySelectorAll(SELECTOR_ICON).forEach(icon => {
      icon.classList.toggle('d-none', (icon as HTMLElement).dataset.lteThemeIcon !== theme)
    })
  }

  /**
   * Aplica el tema preferido y sincroniza la interfaz sin guardar cambios.
   */
  init(): void {
    if (isDisabled()) {
      return
    }

    const theme = this.getPreferredTheme()
    this._applyTheme(theme)
    this._showActiveTheme(theme)
  }
}

/**
 * Implementación de la API de datos
 * ====================================================
 * Los clics se delegan en `document`, de modo que funcionan los controles
 * agregados después de la carga y el listener sobrevive a los reemplazos de
 * <body> de Turbo. La clase no conserva estado: todo se guarda en localStorage
 * y en el DOM.
 */

document.addEventListener('click', event => {
  const target = event.target

  if (!(target instanceof Element) || isDisabled()) {
    return
  }

  const toggle = target.closest(SELECTOR_TOGGLE)
  const theme = toggle?.getAttribute(ATTRIBUTE_TOGGLE)

  if (theme && isValidTheme(theme)) {
    new ColorMode().setTheme(theme)
  }
})

onDOMContentLoaded(() => {
  const colorMode = new ColorMode()
  colorMode.init()

  // Sigue la preferencia del sistema solo cuando esta es la elección efectiva:
  // no hay un tema guardado ni uno declarado en el marcado, o se eligió «auto».
  // El tema declarado por la página también es una preferencia y prevalece ante
  // los cambios del sistema (#6093).
  globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (isDisabled()) {
      return
    }

    const preferred = colorMode.getStoredTheme() ?? colorMode.getMarkupTheme()

    if (!preferred || preferred === 'auto') {
      colorMode._applyTheme('auto')
      colorMode._showActiveTheme(preferred ?? 'auto')
    }
  }, { signal: getLifecycleSignal() })
})

export default ColorMode
