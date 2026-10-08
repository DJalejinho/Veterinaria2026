/**
 * --------------------------------------------
 * @file AdminLTE direct-chat.ts
 * @description Chat directo de AdminLTE.
 * @license MIT
 * --------------------------------------------
 */
import { BaseComponent } from './base-component';
/**
 * Definición de la clase
 * ====================================================
 */
declare class DirectChat extends BaseComponent {
    static get NAME(): string;
    static getInstance(element: Element | null | undefined): DirectChat | null;
    static getOrCreateInstance(element: HTMLElement): DirectChat;
    toggle(): void;
}
export default DirectChat;
