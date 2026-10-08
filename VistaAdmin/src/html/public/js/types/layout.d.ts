/**
 * ----------------------------------------------------------------------------
 * @file AdminLTE layout.ts
 * @description Gestión del diseño de AdminLTE.
 * @license MIT
 * ----------------------------------------------------------------------------
 */
/**
 * ----------------------------------------------------------------------------
 * Definición de la clase
 * ----------------------------------------------------------------------------
 */
declare class Layout {
    _element: HTMLElement;
    _holdTransitionTimer: ReturnType<typeof setTimeout> | undefined;
    constructor(element: HTMLElement);
    holdTransition(time?: number): void;
}
export default Layout;
