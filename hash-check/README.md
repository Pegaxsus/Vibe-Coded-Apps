# Hash Check

Comparador local de archivos con la estética de `qr-generator`. Abre `index.html` en un navegador moderno. No requiere instalación, compilación ni conexión a Internet. También puede servirse como web estática mediante HTTPS o localhost.

- Dos zonas de arrastrar y soltar, también accesibles con teclado y selector de archivos.
- SHA-256, SHA-384 y SHA-512 mediante Web Crypto en trabajadores independientes.
- Comparación del tamaño y del hash del contenido; nombres y fechas no afectan al resultado.
- Cambio de algoritmo con recálculo automático, cancelación al reemplazar o limpiar y copia de hashes.
- Informe HTML imprimible (usa Imprimir → Guardar como PDF), TXT y JSON.
- Tema oscuro/claro y diseño adaptable.

Límite: 256 MiB por archivo. Web Crypto necesita cargar cada archivo completo en memoria; los trabajadores mantienen la interfaz disponible y se cancelan cuando dejan de ser necesarios. Si el navegador o la política del servidor bloquean los trabajadores o Web Crypto, la aplicación muestra un error. El portapapeles depende de los permisos del navegador.

Los hashes coincidentes aportan una evidencia muy sólida de igualdad, no una garantía matemática ni una firma digital. El informe refleja los archivos seleccionados en el momento de exportarlo e incluye sus nombres y metadatos.

Pruebas: `node --test hash-check/core.test.cjs` desde la carpeta superior.
