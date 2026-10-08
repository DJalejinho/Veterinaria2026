/**
 * --------------------------------------------
 * @file AdminLTE sidebar-search.ts
 * @description Filtro en vivo para el menú lateral.
 * @license MIT
 * --------------------------------------------
 */
import { BaseComponent } from './base-component';
/**
 * Guarda el estado original del submenú antes de la primera tecla para que,
 * al limpiar el campo, el menú vuelva al estado en que lo dejó el usuario. Se
 * conserva tanto el estilo `display` en línea como la clase: la animación de
 * Treeview escribe ese estilo y, de otro modo, prevalecería sobre
 * `.menu-open > .nav-treeview`.
 */
type SubmenuState = {
    open: boolean;
    display: string;
};
/**
 * Definición de la clase
 * ============================================================================
 */
declare class SidebarSearch extends BaseComponent {
    static get NAME(): string;
    static getInstance(element: Element | null | undefined): SidebarSearch | null;
    static getOrCreateInstance(element: HTMLElement): SidebarSearch;
    _menu: HTMLElement | null;
    _emptyState: HTMLElement | null;
    _snapshot: Map<HTMLElement, SubmenuState> | null;
    constructor(element: HTMLElement);
    /**
     * Muestra solo las entradas del menú que coinciden con `term` y expande los
     * elementos necesarios para revelarlas. Si el término está vacío, restaura el menú.
     *
     * @param term Texto que se comparará sin distinguir mayúsculas con las etiquetas de los enlaces.
     */
    search(term: string): void;
    /**
     * Quita el filtro, vuelve a mostrar todas las entradas y restaura el estado
     * abierto o cerrado de cada submenú previo a la búsqueda.
     */
    clear(): void;
    dispose(): void;
    _takeSnapshot(menu: HTMLElement): Map<HTMLElement, SubmenuState>;
}
export default SidebarSearch;
