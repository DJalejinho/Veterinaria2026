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
/**
 * Señal AbortSignal del ciclo de vida actual. Pásala como opción `{ signal }` a
 * los listeners de `window` o `document` que registres durante la inicialización
 * para que se eliminen automáticamente durante la siguiente renderización de Turbo.
 */
declare const getLifecycleSignal: () => AbortSignal;
declare const onDOMContentLoaded: (callback: () => void) => void;
/**
 * Finaliza el ciclo de vida actual: aborta su señal para eliminar los listeners
 * asociados y prepara un ciclo nuevo para la siguiente ejecución.
 *
 * Se exporta para contenedores SPA que desmontan el diseño de AdminLTE. Al
 * llamarlo, elimina los listeners de window/document agregados en el ciclo
 * actual sin reinicializar inmediatamente. Internamente, también constituye la
 * primera mitad de `initialize()` y del listener `turbo:before-render`.
 */
declare const teardown: () => void;
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
declare const initialize: () => void;
/**
 * Comprueba si un elemento tiene un atributo de datos específico mediante
 * Object.hasOwn() de ES2022.
 */
declare const hasDataAttribute: (element: HTMLElement, attribute: string) => boolean;
/**
 * Obtiene el último elemento de un NodeList mediante Array.at() de ES2022.
 */
declare const getLastElement: <T extends Element>(elements: NodeListOf<T> | T[]) => T | undefined;
/**
 * Acceso seguro a propiedades con una gestión de errores más clara.
 */
declare const safePropertyAccess: (obj: Record<string, unknown>, property: string) => unknown;
declare const slideUp: (target: HTMLElement, duration?: number) => void;
declare const slideDown: (target: HTMLElement, duration?: number) => void;
declare const slideToggle: (target: HTMLElement, duration?: number) => void;
export { onDOMContentLoaded, getLifecycleSignal, initialize, teardown, slideUp, slideDown, slideToggle, hasDataAttribute, getLastElement, safePropertyAccess };
