# Política de Seguridad

## Reportar una Vulnerabilidad

Por favor, abre un issue en GitHub con la etiqueta `security` o contacta directamente a los mantenedores.
No divulgues la vulnerabilidad públicamente hasta que haya un parche disponible.

## Diseño de Seguridad

La preocupación principal es prevenir la filtración de datos del paciente:

- Ningún contenido DICOM ni metadato se transmite por la red
- Las etiquetas DICOM identificatorias del paciente nunca se leen en el estado de la aplicación
- El tipo de archivo se valida (bytes mágicos DICM) antes de procesarlo
- Todas las dependencias se incluyen en el bundle en tiempo de compilación — sin scripts de CDN externos
- La Política de Seguridad de Contenido bloquea las llamadas de red externas en producción
- `connect-src 'none'` en la CSP impide cualquier llamada fetch/XHR
- Una prueba con Playwright verifica que no ocurre ninguna subida binaria durante el uso normal

## Escaneo de Dependencias

Ejecuta `npm audit` para verificar vulnerabilidades conocidas en las dependencias.
