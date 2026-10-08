# Política de seguridad

## Cómo informar problemas de seguridad

Si detectas una vulnerabilidad de seguridad en AdminLTE, informa a las personas mantenedoras por correo electrónico o crea un aviso privado de seguridad en GitHub. Nos tomamos la seguridad en serio y responderemos cuanto antes.

## Versiones con soporte

| Versión | Con soporte |
| ------- | ---------- |
| 4.x | :white_check_mark: |
| 3.x | :x: |
| < 3.0 | :x: |

## Buenas prácticas de seguridad

AdminLTE es una plantilla de panel de administración para el frontend. Al publicar aplicaciones creadas con AdminLTE, sigue estas prácticas:

### 1. Publicación en producción

- **No expongas el directorio `node_modules`** en producción.
- **Quita los archivos de demostración y ejemplo** (como `index2.html` e `index3.html`) de la publicación.
- **Usa un proceso de compilación adecuado** que incluya solo los recursos necesarios para producción.
- **Configura correctamente el servidor web** para evitar ataques de recorrido de directorios.

### 2. Proceso de compilación

Al preparar una publicación de producción:

```bash
# Compila solo los recursos de producción
npm run production

# Publica solo los archivos necesarios de dist/
# Normalmente: dist/js/adminlte.min.js y dist/css/adminlte.min.css
```

### 3. Archivos que no se deben publicar

No publiques lo siguiente en producción:

- El directorio `node_modules/`.
- Archivos HTML de ejemplo o demostración (`index.html`, `index2.html`, `index3.html`, etc.).
- Archivos fuente (directorio `src/`).
- Archivos de configuración de desarrollo.
- Archivos de documentación.

## Vulnerabilidades CVE conocidas

### CVE-2021-36471 (en disputa)

**Estado:** esta CVE está **en disputa** y no representa una vulnerabilidad del propio AdminLTE.

**Problema:** CVE-2021-36471 afirma que AdminLTE 3.1.0 tiene una «vulnerabilidad de recorrido de directorios» que permitiría a atacantes remotos ver páginas de demostración a través de `/admin/index2.html` y `/admin/index3.html`.

**Aclaración:**

- `index2.html` e `index3.html` son **páginas de ejemplo y demostración** para que los desarrolladores las consulten durante el desarrollo.
- **No es una vulnerabilidad de AdminLTE**, sino una **configuración incorrecta de la publicación** del sitio.
- El problema aparece cuando los desarrolladores publican por error:
  - Toda la carpeta `node_modules` de forma pública.
  - Archivos de demostración o ejemplo en entornos de producción.
  - El sitio sin configurar correctamente el servidor web.

**Resolución:**

- AdminLTE 4 reorganizó la arquitectura del proyecto y separó claramente las demostraciones de desarrollo de los recursos de producción.
- Sigue las buenas prácticas de publicación indicadas anteriormente.
- Publica solo los recursos compilados de producción de `dist/js/` y `dist/css/`.
- La persona que informó de la CVE reconoció que debía clasificarse como una incidencia de gravedad baja o informativa, no crítica.

**Más información:**

- [Incidencia de GitHub n.º 4948](https://github.com/ColorlibHQ/AdminLTE/issues/4948)
- [Registro de CVE](https://www.cve.org/CVERecord?id=CVE-2021-36471) (marcada como «en disputa»)

## Desarrollo seguro

### Política de seguridad del contenido (CSP)

Al integrar AdminLTE en tu aplicación, considera agregar encabezados de Content Security Policy adecuados para prevenir ataques XSS.

### Autenticación y autorización

AdminLTE es **solo una plantilla de interfaz**; no incluye autenticación ni autorización. Debes:

- Implementar una autenticación adecuada en tu backend.
- Proteger todos los endpoints de la API.
- Usar HTTPS en producción.
- Implementar una gestión de sesiones adecuada.
- Seguir las pautas de seguridad de OWASP.

### Dependencias

- Mantén AdminLTE y sus dependencias actualizados.
- Ejecuta `npm audit` con regularidad para comprobar si hay vulnerabilidades.
- Revisa los avisos de seguridad de Bootstrap y de las demás dependencias.

## Contacto

Para informar de problemas de seguridad, comunícate con las personas responsables mediante:

- GitHub Issues para consultas generales.
- GitHub Security Advisories para problemas de seguridad confidenciales.
- El correo electrónico de la persona mantenedora del proyecto (consulta `package.json`).
