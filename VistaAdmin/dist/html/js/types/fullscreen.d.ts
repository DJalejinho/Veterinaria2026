/**
 * --------------------------------------------
 * @file AdminLTE fullscreen.ts
 * @description Complemento de pantalla completa de AdminLTE.
 * @license MIT
 * --------------------------------------------
 */
import { BaseComponent } from './base-component';
/**
 * Definición de la clase.
 * ============================================================================
 */
declare class FullScreen extends BaseComponent {
    static get NAME(): string;
    static getInstance(element: Element | null | undefined): FullScreen | null;
    static getOrCreateInstance(element: HTMLElement): FullScreen;
    inFullScreen(): void;
    outFullscreen(): void;
    toggleFullScreen(): void;
}
export default FullScreen;
