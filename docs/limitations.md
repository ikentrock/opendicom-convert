# Limitaciones Conocidas

## MVP (v0.1–v0.2) — Versión Actual

- **Sin soporte de ZIP como entrada**: Los archivos ZIP que contienen imágenes DICOM no se pueden abrir directamente.
  El usuario debe extraer los archivos primero, o usar la carga de carpeta.
- **Sin análisis de DICOMDIR**: El archivo índice DICOMDIR presente en los CDs médicos se ignora.
  Los archivos deben seleccionarse individualmente o mediante el selector de carpetas.
- **Sin DICOM multi-frame**: Solo se muestra el primer frame de los archivos DICOM multi-frame.
  Esto afecta a algunos protocolos de TC/RM que almacenan múltiples frames por archivo.
- **Sin sintaxis de transferencia comprimida**: Los archivos comprimidos con JPEG 2000 (J2K) y JPEG-LS
  pueden no decodificarse correctamente según la versión del navegador y Cornerstone3D.
- **Carga de carpeta dependiente del navegador**: El atributo `webkitdirectory` funciona en
  Chrome y Edge. Tiene soporte parcial en Firefox y no funciona en Safari.
- **Rendimiento con series grandes**: Cargar más de 200 imágenes a la vez puede ser lento en
  dispositivos con poca memoria. Considera exportar en lotes más pequeños.
- **No apto para diagnóstico**: Esta herramienta no está validada para uso clínico y no debe
  utilizarse para tomar decisiones médicas.

## Mejoras Planificadas

- v0.3: Soporte de carpetas/CD con análisis de DICOMDIR
- v0.4: Controles de ventana/nivel, inversión de imagen, mejoras en el desplazamiento de series
- v1.0: DICOM multi-frame, soporte de sintaxis de transferencia comprimida
