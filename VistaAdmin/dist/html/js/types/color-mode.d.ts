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
type Theme = 'light' | 'dark' | 'auto';
/**
 * Definición de la clase
 * ====================================================
 */
declare class ColorMode {
    /**
     * Lee el tema guardado, o devuelve null si no hay ninguno o localStorage no
     * está disponible (navegación privada o iframe aislado).
     */
    getStoredTheme(): Theme | null;
    /**
     * Tema declarado en el marcado por aplicaciones que lo generan en el servidor
     * a partir de una cookie o los datos del usuario. Devuelve null si la página
     * no declaró ninguno o si el valor es un tema personalizado de Bootstrap que
     * ColorMode no puede resolver. En este último caso, consulta `isDisabled`.
     */
    getMarkupTheme(): Theme | null;
    /**
     * Elección efectiva del usuario: primero el tema guardado; luego, el tema
     * declarado en el marcado; y, si no hay ninguno, la preferencia del sistema.
     * El tema guardado tiene prioridad porque refleja una elección del visitante
     * en este dispositivo; el del marcado es solo el valor predeterminado de la página.
     */
    getPreferredTheme(): Theme;
    /**
     * Resuelve el valor «auto» según la preferencia del sistema operativo.
     */
    resolveTheme(theme: Theme): 'light' | 'dark';
    /**
     * Aplica un tema y guarda la elección. Envía `changed.lte.color-mode` en el
     * documento con { theme, resolved }.
     */
    setTheme(theme: Theme): void;
    /**
     * Aplica el tema sin guardarlo. Se usa al iniciar y cuando cambia la
     * preferencia del sistema en modo «auto».
     */
    _applyTheme(theme: Theme): void;
    /**
     * Indica si el sistema operativo tiene seleccionada la apariencia oscura.
     */
    _prefersDark(): boolean;
    /**
     * Sincroniza los controles [data-bs-theme-value] (estado activo, estado
     * pulsado y marca de selección) y los iconos [data-lte-theme-icon].
     */
    _showActiveTheme(theme: Theme): void;
    /**
     * Aplica el tema preferido y sincroniza la interfaz sin guardar cambios.
     */
    init(): void;
}
export default ColorMode;
