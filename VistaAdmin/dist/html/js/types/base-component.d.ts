/**
 * --------------------------------------------
 * @file AdminLTE base-component.ts
 * @description Ciclo de vida compartido para los complementos de AdminLTE:
 * registro de instancias por elemento (getInstance / getOrCreateInstance /
 * dispose) y un contrato uniforme para eventos personalizados, basado en la
 * API de componentes de Bootstrap.
 * @license MIT
 * --------------------------------------------
 */
declare class BaseComponent {
    /**
     * Las subclases deben redefinir este getter para declarar su propio nombre.
     */
    static get NAME(): string;
    /**
     * Clave con la que se registra este componente: `lte.<name>`.
     */
    static get DATA_KEY(): string;
    /**
     * Búsqueda sin tipado en el registro. Cada componente ofrece un método
     * tipado (por ejemplo, CardWidget.getInstance()) que se apoya en este.
     *
     * @param element Elemento que se desea buscar.
     * @returns Instancia de este componente o null si no existe.
     */
    protected static _getInstance(element: Element | null | undefined): BaseComponent | null;
    /**
     * Elemento al que está asociada esta instancia.
     */
    _element: HTMLElement;
    /**
     * Asocia una nueva instancia al elemento indicado y la registra con la
     * DATA_KEY de la subclase.
     *
     * @param element Elemento al que se asociará esta instancia.
     */
    constructor(element: HTMLElement);
    /**
     * Quita esta instancia del registro para que getInstance() deje de
     * devolverla. Las subclases liberan sus propios recursos y luego llaman a
     * super.dispose().
     */
    dispose(): void;
}
/**
 * Envía un evento personalizado con espacio de nombres y propagación, para
 * que las aplicaciones puedan escucharlo desde `document`. Opcionalmente,
 * puede incluir datos o cancelarse. Devuelve el evento para que quien llama
 * pueda comprobar `defaultPrevented`.
 *
 * @param element Elemento en el que se enviará el evento.
 * @param name Nombre del evento con espacio de nombres, por ejemplo,
 *   `collapse.lte.push-menu`.
 * @param options `cancelable` permite cancelar el evento con preventDefault();
 *   `detail` contiene los datos que recibirán quienes lo escuchen.
 * @returns Evento enviado, después de que se ejecuten sus listeners.
 */
declare const dispatchCustomEvent: <T = undefined>(element: Element, name: string, options?: {
    cancelable?: boolean;
    detail?: T;
}) => CustomEvent<T | undefined>;
export { BaseComponent, dispatchCustomEvent };
