# Declaración de accesibilidad de AdminLTE

## Descripción general

AdminLTE 4 se desarrolla teniendo en cuenta la accesibilidad y aspira a cumplir **WCAG 2.1 AA**. Este documento describe con transparencia qué está implementado, qué está parcialmente implementado y qué sigue en la hoja de ruta, para que sepas qué ofrece la plantilla y qué debe aportar tu aplicación.

> **Importante:** una plantilla solo puede ser un punto de partida. El marcado accesible de las páginas de demostración no garantiza que tu aplicación cumpla las pautas; tú eres responsable de probar las páginas que crees.

## ✅ Implementado

### Marcado (páginas de demostración)

- Estructura semántica de regiones en la aplicación (`<nav>`, `<main>`, `<aside>`, `<footer>`); los contenedores `.nav` que no son listas reciben automáticamente `role="navigation"` (#6038).
- Exactamente un `<h1>` por página (el título en el encabezado del contenido).
- Migas de pan dentro de `<nav aria-label="breadcrumb">` con `aria-current="page"`.
- Atributo `aria-label` en todos los controles que solo muestran un icono (herramientas de tarjeta, controles de la barra superior y botón de la barra lateral).
- Campos de formulario asociados a elementos `<label>` (ocultos visualmente cuando el diseño depende de marcadores de posición; etiquetas flotantes en las páginas de autenticación v2).
- Encabezados de tabla con atributos `scope`.
- Idioma declarado mediante `lang="es"`, títulos descriptivos de página y `meta name="color-scheme"`.

### Comportamiento (`accessibility.ts` y componentes)

- **Anuncios en regiones activas** (WCAG 4.1.3): una única región cortés `#live-region` con una API pública `announce()`; los avisos insertados en el DOM se anuncian automáticamente.
- **Enlaces para saltar contenido** y llegar al contenido principal y a la navegación; se insertan una vez y se reutilizan durante las navegaciones de Turbo (WCAG 2.4.1).
- **Exposición del estado de Treeview:** los controles de submenús de la barra lateral incluyen `aria-expanded`, que el componente Treeview mantiene sincronizado.
- **Restauración del foco en modales:** el elemento que abre el modal se captura en `show.bs.modal` y recupera el foco al cerrarlo (si sigue dentro del documento).
- **Escape** cierra los menús desplegables abiertos; se conserva el manejo de teclado propio de los modales de Bootstrap.
- **Navegación con flechas** en menús y listas desplegables, solo cuando el foco está en un elemento del menú; las teclas no se interceptan dentro de campos, áreas de texto, selectores ni elementos editables.
- **Movimiento reducido:** `prefers-reduced-motion` desactiva el desplazamiento suave y acorta las animaciones; CSS también aplica estilos para `prefers-contrast: more`.
- **Prevención del destello del tema** y modo oscuro mediante los modos de color de Bootstrap, respetando `prefers-color-scheme` (#6043).
- **Identificación de errores de formulario** (WCAG 3.3.1/3.3.2): los errores de validación reciben un nodo `invalid-feedback` asociado mediante `aria-describedby` (se añade a las descripciones existentes, sin reemplazarlas) y se anuncian de forma asertiva.

### Exclusiones explícitas

- **No se fuerza el foco a recorrer la página en bucle.** El foco no queda atrapado en los límites de la página: hacer que Tab vuelva al inicio al llegar al final del documento infringiría WCAG 2.1.2 (sin trampas de teclado). El foco solo se atrapa dentro de diálogos modales.

## ⚠️ Implementación parcial y limitaciones conocidas

Estas limitaciones conocidas están registradas; se aceptan solicitudes de cambios:

- **Treeview y PushMenu no tienen un patrón de interacción de teclado específico** más allá del comportamiento normal de Tab y Enter en los enlaces (no hay `roving tabindex` ni teclas Home/End dentro del árbol). JavaScript establece `aria-expanded`; el marcado estático no lo incluye si JavaScript no se ejecuta.
- **Las demostraciones de arrastrar y soltar** (kanban y tarjetas ordenables del panel) no tienen alternativa de teclado. SortableJS no ofrece una; considera estas demostraciones solo como ejemplos visuales (limitación de WCAG 2.5.7).
- **No se imponen tamaños mínimos globales a los objetivos táctiles.** Los botones de herramientas de las tarjetas miden menos de 44 × 44 px; `_accessibility.scss` incluye la clase opcional `.touch-target`.
- **No se garantiza el contraste de todas las combinaciones de utilidades de color de Bootstrap** que puedas crear. La función `accessibilityUtils.checkColorContrast()` (compatible con `rgb()` y hexadecimal) permite comprobarlas.
- **CI todavía no ejecuta pruebas automatizadas de accesibilidad** (la integración de axe/pa11y está en la hoja de ruta). Las afirmaciones de este documento se verificaron manualmente y reflejan el estado actual.

## 🔧 API de JavaScript

```typescript
import { initAccessibility, accessibilityUtils } from 'admin-lte'

const accessibility = initAccessibility({
  announcements: true,      // región activa y anuncios automáticos de avisos
  skipLinks: true,          // insertar enlaces para saltar contenido
  focusManagement: true,    // restaurar el foco de modales y gestionar Escape
  keyboardNavigation: true, // flechas en menús
  reducedMotion: true       // respetar prefers-reduced-motion
})

accessibility.announce('Data saved successfully', 'polite')
accessibility.focusElement('#error-summary')
accessibility.trapFocus(customDialogElement) // para diálogos que no son de Bootstrap

// Comprobar contraste (compatible con rgb() y hexadecimal)
accessibilityUtils.checkColorContrast('#000000', '#ffffff') // { ratio: 21, passes: true }
```

El módulo se inicializa automáticamente desde `adminlte.js`. Todos los controladores de eventos del documento se registran mediante la señal del ciclo de vida de Turbo; así, las navegaciones de Hotwired Turbo no filtran controladores ni duplican los nodos insertados.

## 🧪 Cómo probar tus páginas

- **Automatización:** [axe-core](https://github.com/dequelabs/axe-core), [WAVE](https://wave.webaim.org/) y la auditoría de accesibilidad de Lighthouse.
- **Teclado:** recorre todo el flujo usando solo Tab, Shift+Tab, Enter y Escape; confirma que el foco siempre sea visible y no quede atrapado.
- **Lectores de pantalla:** [NVDA](https://www.nvaccess.org/) (Windows, gratuito), VoiceOver (macOS/iOS) y JAWS.
- **Zoom:** comprueba los diseños con zoom del 200 % y un ancho de ventana de 320 px.
- **Movimiento:** activa la opción «reducir movimiento» del sistema operativo y confirma que las animaciones se reduzcan.

## 🗺️ Hoja de ruta

- Comprobaciones de axe/pa11y en CI para las páginas de demostración compiladas.
- Patrón de interacción de teclado (`roving tabindex`) para el árbol Treeview de la barra lateral.
- Atributos `aria-expanded` y `aria-controls` en el marcado estático de demostración, no solo añadidos por JavaScript.
- Auditoría y documentación del contraste de todas las variantes de color incluidas.
- Revisión de accesibilidad RTL.

## 📚 Recursos

- [Pautas WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Guía de prácticas de creación de ARIA](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
