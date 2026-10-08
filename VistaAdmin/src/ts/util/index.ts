/**
 * Gestión del ciclo de vida
 * ============================================================================
 *
 * Los complementos registran su inicialización mediante `onDOMContentLoaded`.
 * Además de la primera carga, cada callback registrado vuelve a ejecutarse al
 * navegar con Hotwired Turbo (`turbo:load`). Turbo Drive reemplaza <body> sin
 * recargar la página completa; si no se reinicializan, complementos como
 * PushMenu y TreeView dejan de funcionar después del primer clic en un enlace
 * interno (#563, #5890).
 *
 * La reinicialización podría dejar listeners duplicados, porque los callbacks
 * también se asocian a `window` y `document`, que sobreviven al reemplazo de
 * <body> de Turbo. Para evitarlo, cada ciclo tiene su propio `AbortController`:
 * los callbacks deben asociar sus listeners de window/document a la señal que
 * devuelve `getLifecycleSignal()`. La señal se aborta en `turbo:before-render`
 * y elimina los listeners del ciclo anterior antes de volver a ejecutar los
 * callbacks. Los listeners de elementos dentro de <body> no necesitan la señal:
 * Turbo descarta el <body> anterior y los limpia automáticamente.
 *
 * Turbo no es el único entorno que dibuja contenido después de
 * `DOMContentLoaded`. Los frameworks del lado del cliente que construyen el
 * diseño (GWT y otros kits de widgets imperativos) tienen un <body> vacío cuando
 * se ejecuta el primer lote, por lo que la inicialización de la página no
 * encuentra la barra lateral ni el menú. Esos proyectos llaman a `initialize()`
 * una vez conectado el diseño; el método reinicia y vuelve a ejecutar el ciclo
 * igual que Turbo, sin simular eventos de Turbo.
 *
 * A diferencia de Turbo, esos frameworks conservan el mismo <body> al
 * reinicializar, por lo que no descartan los listeners asociados a elementos.
 * Por eso, los callbacks deben pasar `getLifecycleSignal()` a cada llamada a
 * `addEventListener`, incluso en elementos, cuando estos puedan sobrevivir al
 * ciclo.
 */

const lifecycleCallbacks: Array<() => void> = []

// El estado mutable se guarda en un objeto para que los hooks del ciclo de vida
// puedan actualizarlo sin reasignar variables de nivel superior.
const lifecycleState = {
  controller: new AbortController(),
  hasInitialized: false,
  // Es true mientras se ejecuta el lote de callbacks. Así initialize() puede
  // rechazar llamadas reentrantes desde un callback del ciclo de vida.
  isReplaying: false
}

/**
 * Señal AbortSignal del ciclo de vida actual. Pásala como opción `{ signal }` a
 * los listeners de `window` o `document` que registres durante la inicialización
 * para que se eliminen automáticamente durante la siguiente renderización de Turbo.
 */
const getLifecycleSignal = (): AbortSignal => lifecycleState.controller.signal

const runLifecycleCallbacks = (): void => {
  if (lifecycleState.hasInitialized) {
    return
  }

  lifecycleState.hasInitialized = true
  lifecycleState.isReplaying = true

  try {
    for (const callback of lifecycleCallbacks) {
      callback()
    }
  } finally {
    lifecycleState.isReplaying = false
  }
}

const onDOMContentLoaded = (callback: () => void): void => {
  lifecycleCallbacks.push(callback)

  // Registro tardío: el lote del ciclo actual ya se ejecutó (el script se cargó
  // después de DOMContentLoaded o el callback se registró tras una visita de
  // Turbo). Ejecuta de inmediato el nuevo callback en vez de esperar hasta la
  // siguiente navegación. Así se conserva el comportamiento original cuando
  // el documento ya terminó de cargar.
  if (lifecycleState.hasInitialized) {
    callback()
  }
}

/**
 * Finaliza el ciclo de vida actual: aborta su señal para eliminar los listeners
 * asociados y prepara un ciclo nuevo para la siguiente ejecución.
 *
 * Se exporta para contenedores SPA que desmontan el diseño de AdminLTE. Al
 * llamarlo, elimina los listeners de window/document agregados en el ciclo
 * actual sin reinicializar inmediatamente. Internamente, también constituye la
 * primera mitad de `initialize()` y del listener `turbo:before-render`.
 */
const teardown = (): void => {
  lifecycleState.controller.abort()
  lifecycleState.controller = new AbortController()
  lifecycleState.hasInitialized = false
}

/**
 * Vuelve a inicializar todos los complementos con el DOM tal como está ahora.
 *
 * Está pensado para frameworks que dibujan el diseño después de que se haya
 * disparado `DOMContentLoaded`. Llámalo cuando la barra lateral y el menú ya
 * estén conectados; PushMenu, Treeview y ColorMode los detectarán como si
 * hubieran estado en el HTML inicial. La gestión delegada de clics no lo
 * necesita; solo se vuelve a ejecutar la inicialización por página.
 *
 * Primero se elimina el ciclo anterior, así que llamarlo varias veces no
 * duplica listeners registrados con `getLifecycleSignal()`. Si se llama antes
 * de ejecutarse el lote inicial (mientras `document.readyState === 'loading'`),
 * ese lote se ejecuta de inmediato sobre el DOM disponible. La pasada inicial
 * de `DOMContentLoaded` de abajo volverá a ejecutarlo con el DOM completo.
 */
const initialize = (): void => {
  // Evita llamadas reentrantes: si un callback llama a initialize(), eliminaría
  // su propio ciclo durante la ejecución y provocaría una recursión infinita.
  if (lifecycleState.isReplaying) {
    return
  }

  teardown()
  runLifecycleCallbacks()
}

// Primera carga de la página. Se procesa mediante initialize() para que una
// llamada anticipada (de un framework que inicializa antes de terminar la carga)
// no marque el ciclo como completado ni omita esta pasada. La nueva ejecución
// elimina el ciclo temprano y vuelve a procesar los callbacks con el DOM completo.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true })
} else {
  runLifecycleCallbacks()
}

// Hotwired Turbo: elimina los listeners de window/document del ciclo anterior y
// vuelve a inicializar con el nuevo <body>. La limpieza debe ocurrir en
// `before-render`, antes de la nueva ejecución, para quitar los listeners del
// <body> saliente antes de que Turbo lo reemplace. Por eso se usan dos pasos en
// vez de llamar directamente a initialize().
document.addEventListener('turbo:before-render', teardown)

document.addEventListener('turbo:load', runLifecycleCallbacks)

// FUNCIONES AUXILIARES DE ES2022

/**
 * Comprueba si un elemento tiene un atributo de datos específico mediante
 * Object.hasOwn() de ES2022.
 */
const hasDataAttribute = (element: HTMLElement, attribute: string): boolean => {
  return Object.hasOwn(element.dataset, attribute)
}

/**
 * Obtiene el último elemento de un NodeList mediante Array.at() de ES2022.
 */
const getLastElement = <T extends Element>(elements: NodeListOf<T> | T[]): T | undefined => {
  const elementsArray = Array.from(elements)
  return elementsArray.at(-1)
}

/**
 * Acceso seguro a propiedades con una gestión de errores más clara.
 */
const safePropertyAccess = (obj: Record<string, unknown>, property: string): unknown => {
  try {
    return Object.hasOwn(obj, property) ? obj[property] : undefined
  } catch (error) {
    // Causa del error de ES2022.
    throw new Error(`No se pudo acceder a la propiedad '${property}'`, { cause: error })
  }
}

/* CONTROL DE ANIMACIONES DE DESLIZAMIENTO
 * Los temporizadores pendientes se registran por elemento para que una nueva
 * animación cancele los pasos de la anterior. Sin esto, alternar rápidamente
 * un árbol o una tarjeta deja un temporizador de limpieza obsoleto que elimina
 * la altura y la transición a mitad de la animación, desincronizando la
 * visibilidad del elemento y las clases de su componente. */
const slideTimers = new WeakMap<HTMLElement, Array<ReturnType<typeof globalThis.setTimeout>>>()

const cancelSlide = (target: HTMLElement): void => {
  const timers = slideTimers.get(target) ?? []
  for (const timer of timers) {
    globalThis.clearTimeout(timer)
  }

  slideTimers.delete(target)
}

const clearSlideStyles = (target: HTMLElement): void => {
  for (const property of ['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom', 'overflow', 'transition-duration', 'transition-property']) {
    target.style.removeProperty(property)
  }
}

// DESLIZAR HACIA ARRIBA
const slideUp = (target: HTMLElement, duration = 500) => {
  cancelSlide(target)

  if (duration <= 1) {
    target.style.display = 'none'
    clearSlideStyles(target)
    return
  }

  target.style.transitionProperty = 'height, margin, padding'
  target.style.transitionDuration = `${duration}ms`
  target.style.boxSizing = 'border-box'
  target.style.height = `${target.offsetHeight}px`
  target.style.overflow = 'hidden'

  const stepTimer = globalThis.setTimeout(() => {
    target.style.height = '0'
    target.style.paddingTop = '0'
    target.style.paddingBottom = '0'
    target.style.marginTop = '0'
    target.style.marginBottom = '0'
  }, 1)

  const cleanupTimer = globalThis.setTimeout(() => {
    target.style.display = 'none'
    clearSlideStyles(target)
    slideTimers.delete(target)
  }, duration)

  slideTimers.set(target, [stepTimer, cleanupTimer])
}

// DESLIZAR HACIA ABAJO
const slideDown = (target: HTMLElement, duration = 500) => {
  cancelSlide(target)
  // Quita los estilos en línea que pudo dejar un slideUp cancelado (height: 0,
  // overflow: hidden, etc.) antes de medir. De lo contrario, la altura natural
  // del elemento sería 0.
  clearSlideStyles(target)

  target.style.removeProperty('display')
  let { display } = globalThis.getComputedStyle(target)

  if (display === 'none') {
    display = 'block'
  }

  target.style.display = display

  if (duration <= 1) {
    return
  }

  const height = target.offsetHeight
  target.style.overflow = 'hidden'
  target.style.height = '0'
  target.style.paddingTop = '0'
  target.style.paddingBottom = '0'
  target.style.marginTop = '0'
  target.style.marginBottom = '0'

  const stepTimer = globalThis.setTimeout(() => {
    target.style.boxSizing = 'border-box'
    target.style.transitionProperty = 'height, margin, padding'
    target.style.transitionDuration = `${duration}ms`
    target.style.height = `${height}px`
    target.style.removeProperty('padding-top')
    target.style.removeProperty('padding-bottom')
    target.style.removeProperty('margin-top')
    target.style.removeProperty('margin-bottom')
  }, 1)

  const cleanupTimer = globalThis.setTimeout(() => {
    clearSlideStyles(target)
    slideTimers.delete(target)
  }, duration)

  slideTimers.set(target, [stepTimer, cleanupTimer])
}

// ALTERNAR
const slideToggle = (target: HTMLElement, duration = 500) => {
  if (globalThis.getComputedStyle(target).display === 'none') {
    slideDown(target, duration)
    return
  }

  slideUp(target, duration)
}

export {
  onDOMContentLoaded,
  getLifecycleSignal,
  initialize,
  teardown,
  slideUp,
  slideDown,
  slideToggle,
  hasDataAttribute,
  getLastElement,
  safePropertyAccess
}
