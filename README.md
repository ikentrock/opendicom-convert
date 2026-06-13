# OpenDICOM Convert

Abre archivos DICOM de imágenes médicas directamente en tu navegador y expórtalos a PNG o JPG.

**Sin subida de archivos. Sin servidor. Los datos del paciente nunca salen de tu dispositivo.**

---

## Inicio rápido

```bash
cd apps/web
npm install
npm run dev
```

Abre http://localhost:5173, selecciona tus archivos DICOM (.dcm), previsualízalos y expórtalos.

## ¿Qué hace?

- Abre archivos `.dcm` (formato DICOM Parte 10)
- Agrupa los archivos por estudio y serie automáticamente
- Muestra las imágenes usando el renderizador WebGL de Cornerstone3D
- Exporta la imagen actual como PNG o JPG, o exporta en lote series completas como ZIP
- Funciona completamente en el navegador — no se sube nada a ningún servidor

## Privacidad

Todo el procesamiento ocurre localmente en tu navegador usando la File API y WebGL.
Sin analíticas, sin cookies, sin llamadas de red. Consulta [PRIVACY.md](PRIVACY.md) para más detalles.

## Caso de uso típico

Tienes un CD médico con imágenes de resonancia magnética (u otro estudio) y un visor que solo funciona en Windows. Con OpenDICOM Convert puedes:

1. Insertar el CD y seleccionar la carpeta DICOM desde el navegador
2. Previsualizar las imágenes en cualquier sistema operativo
3. Exportarlas como PNG o JPG para compartirlas fácilmente con tu médico

## Ejecutar pruebas

```bash
# Pruebas unitarias
cd apps/web && npm test

# Pruebas E2E (incluye prueba de privacidad — verifica que no se sube nada)
cd apps/web && npx playwright test
```

## Compilar para producción

```bash
cd apps/web && npm run build
```

Los archivos estáticos se generan en `apps/web/dist/`. Despliega en cualquier hosting estático (Netlify, Vercel, GitHub Pages, nginx).

## Navegadores compatibles

Chrome, Edge, Firefox, Safari (versiones recientes). La carga de carpetas completas requiere Chrome o Edge.

## Limitaciones

Consulta [docs/limitations.md](docs/limitations.md).

## Licencia

[Apache 2.0](LICENSE)

## Aviso importante

**Este software no es un dispositivo médico.** No está diseñado para diagnóstico, decisiones de tratamiento ni interpretación clínica. Consulta siempre a un profesional de la salud calificado para obtener consejo médico.
