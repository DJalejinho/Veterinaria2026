/**
 * ----------------------------------------------------------------------------
 * @file AdminLTE push-menu.ts
 * @description Menú lateral PushMenu de AdminLTE.
 * @license MIT
 * ----------------------------------------------------------------------------
 */
import { BaseComponent } from './base-component';
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
};
/**
 * ----------------------------------------------------------------------------
 * Definición de la clase
 * ----------------------------------------------------------------------------
 */
declare class PushMenu extends BaseComponent {
    static get NAME(): string;
    /**
     * Busca la instancia de PushMenu asociada al elemento indicado.
     *
     * @param element Elemento de la barra lateral que se desea buscar.
     * @returns Instancia existente o null si todavía no hay una asociada.
     */
    static getInstance(element: Element | null | undefined): PushMenu | null;
    /**
     * Busca la instancia de PushMenu asociada al elemento y crea una si no existe.
     * Si ya existe una instancia, se ignora `config`.
     *
     * @param element Elemento de la barra lateral.
     * @param config Opciones que se combinan con los valores predeterminados al crear una instancia.
     * @returns Instancia existente o recién creada.
     */
    static getOrCreateInstance(element: HTMLElement, config?: Partial<Config>): PushMenu;
    /**
     * Valores predeterminados combinados con las opciones usadas para crear esta instancia.
     */
    _config: Config;
    /**
     * @param element Elemento de la barra lateral al que se asociará la instancia.
     * @param config Opciones que se combinan con los valores predeterminados.
     */
    constructor(element: HTMLElement, config?: Partial<Config>);
    /**
     * Comprueba si la barra lateral está plegada.
     *
     * @returns true si la barra lateral está plegada; en caso contrario, false.
     */
    isCollapsed(): boolean;
    /**
     * Comprueba si la barra lateral se abrió explícitamente en una pantalla móvil.
     *
     * @returns true si la barra lateral está abierta explícitamente; en caso contrario, false.
     */
    isExplicitlyOpen(): boolean;
    /**
     * Comprueba si la barra lateral está en modo compacto.
     *
     * @returns true si la barra lateral está en modo compacto; en caso contrario, false.
     */
    isMiniMode(): boolean;
    /**
     * Comprueba si el tamaño de pantalla actual se considera móvil según el valor
     * sidebarBreakpoint de la configuración.
     *
     * @returns true si el tamaño de pantalla es móvil; en caso contrario, false.
     */
    isMobileSize(): boolean;
    /**
     * Expande el menú lateral.
     */
    expand(): void;
    /**
     * Pliega el menú lateral.
     */
    collapse(): void;
    /**
     * Alterna el estado del menú lateral.
     */
    toggle(): void;
    /**
     * Lee del DOM el punto de quiebre CSS de la barra lateral y actualiza
     * sidebarBreakpoint. El punto de quiebre se define mediante el pseudoelemento
     * CSS ::before del elemento sidebar-expand, cuando las consultas @media
     * modifican el comportamiento según el tamaño de pantalla.
     */
    setupSidebarBreakPoint(): void;
    /**
     * Actualiza el estado de la barra lateral según el tamaño de pantalla actual
     * y el valor sidebarBreakpoint de la configuración.
     */
    updateStateByResponsiveLogic(): void;
    /**
     * Guarda el estado de la barra lateral en localStorage.
     *
     * @param state Estado que se guardará ('sidebar-open' o 'sidebar-collapse').
     */
    saveSidebarState(state: string): void;
    /**
     * Carga el estado de la barra lateral desde localStorage.
     */
    loadSidebarState(): void;
    /**
     * Elimina el estado de la barra lateral de localStorage.
     */
    clearSidebarState(): void;
    /**
     * Inicializa el complemento PushMenu y establece el estado inicial de la barra lateral.
     */
    init(): void;
}
export default PushMenu;
