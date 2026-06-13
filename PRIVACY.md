# Modelo de Privacidad

OpenDICOM Convert está diseñado para procesar todos los archivos DICOM completamente dentro de tu navegador.

## Lo que NO hacemos

- No subimos tus archivos ni su contenido a ningún servidor
- No almacenamos datos del paciente en localStorage, sessionStorage ni IndexedDB
- No usamos cookies
- No usamos SDKs de analíticas ni reportes de errores
- No cargamos scripts desde CDNs externos (todas las dependencias se incluyen en el bundle en tiempo de compilación)
- No realizamos ninguna petición de red con datos del paciente

## ¿Qué pasa con tus datos?

1. Seleccionas los archivos DICOM desde tu dispositivo local usando la File API del navegador
2. Los archivos se leen en la memoria del navegador — nunca salen de tu máquina
3. Los datos de píxeles son decodificados y renderizados por Cornerstone3D usando WebGL
4. Las exportaciones se generan desde el canvas WebGL y se descargan directamente a tu dispositivo
5. Todos los datos se eliminan cuando haces clic en "Empezar de nuevo" o cierras la pestaña

## Metadatos

La aplicación lee metadatos no identificatorios para agrupar imágenes (Study UID, Series UID, Número de instancia, Modalidad, Descripciones). Nombre del paciente, ID del paciente, Fecha de nacimiento, Número de acceso, Médico referente y Nombre de la institución **nunca se leen** en el estado de la aplicación.

## Política de Seguridad de Contenido (CSP)

Para despliegues en producción, agrega este encabezado de respuesta (ver `apps/web/public/_headers`):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:;
  img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'none';
  object-src 'none'; base-uri 'none'; form-action 'none';
```

Esto bloquea todas las llamadas de red externas desde la página.

## Prueba de privacidad

Una prueba E2E con Playwright (`tests/e2e/noUpload.spec.ts`) intercepta todas las peticiones de red durante el procesamiento de archivos DICOM y verifica que no se realiza ninguna petición POST/PUT binaria.
Ejecútala con: `cd apps/web && npx playwright test tests/e2e/noUpload.spec.ts`
