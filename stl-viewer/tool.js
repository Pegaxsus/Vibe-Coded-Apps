// Classic entry point keeps file:// usable; Three.js modules are loaded from the existing CDN.
(() => {
  'use strict';
  Object.assign(ToolShell.messages.en, {
  "dropTitle": "Drop your STL file here",
  "dropHint": "Or select it from your computer.",
  "upload": "Load STL",
  "center": "Center view",
  "rotation": "Automatic rotation",
  "speed": "Speed",
  "modelColor": "Model color",
  "orientation": "Orientation",
  "file": "File",
  "triangles": "Triangles",
  "dimensions": "Dimensions",
  "viewerControls": "STL viewer controls",
  "previewSettings": "Preview settings",
  "palette": "Model color palette",
  "axisGroup": "Rotate model by 90 degrees around an axis",
  "modelData": "Model data",
  "preview": "3D preview",
  "empty": "No STL loaded",
  "free": "Free",
  "notLoaded": "Not loaded",
  "gray": "Light gray",
  "green": "Green",
  "blue": "Blue",
  "coral": "Coral",
  "graphite": "Graphite",
  "waiting": "Waiting for an STL file.",
  "invalidExtension": "Select a file with the .stl extension.",
  "loading": "Loading {name}...",
  "loaded": "Model loaded. Drag to orbit and scroll to zoom.",
  "invalidSTL": "Unable to read the STL. Check that the file is not damaged.",
  "readError": "Unable to open the selected file.",
  "needModel": "Load an STL to center the view.",
  "centered": "View centered.",
  "positive": "positive",
  "negative": "negative",
  "axisStatus": "Model rotated {sign}90° around the {axis} axis.",
  "axisView": "Rotate model {sign}90° around {axis}",
  "needRotationModel": "Load an STL to rotate the model.",
  "startupError": "Unable to start the 3D preview. Check your internet connection and WebGL support."
});
  Object.assign(ToolShell.messages.es, {
  "dropTitle": "Arrastra aquí tu archivo STL",
  "dropHint": "O selecciónalo desde tu equipo.",
  "upload": "Cargar STL",
  "center": "Centrar vista",
  "rotation": "Rotación automática",
  "speed": "Velocidad",
  "modelColor": "Color del modelo",
  "orientation": "Orientación",
  "file": "Archivo",
  "triangles": "Triángulos",
  "dimensions": "Dimensiones",
  "viewerControls": "Controles del visor STL",
  "previewSettings": "Ajustes de previsualización",
  "palette": "Paleta de color del modelo",
  "axisGroup": "Girar el modelo 90 grados alrededor de un eje",
  "modelData": "Datos del modelo",
  "preview": "Previsualización 3D",
  "empty": "Ningún STL cargado",
  "free": "Libre",
  "notLoaded": "Sin cargar",
  "gray": "Gris claro",
  "green": "Verde",
  "blue": "Azul",
  "coral": "Coral",
  "graphite": "Grafito",
  "waiting": "Esperando archivo STL.",
  "invalidExtension": "Selecciona un archivo con extensión .stl.",
  "loading": "Cargando {name}...",
  "loaded": "Modelo cargado. Arrastra para girar la vista y usa la rueda para acercarte.",
  "invalidSTL": "No se ha podido leer el STL. Comprueba que el archivo no esté dañado.",
  "readError": "No se ha podido abrir el archivo seleccionado.",
  "needModel": "Carga un STL para centrar la vista.",
  "centered": "Vista centrada.",
  "positive": "positivo",
  "negative": "negativo",
  "axisStatus": "Modelo girado {sign}90° alrededor del eje {axis}.",
  "axisView": "Girar el modelo {sign}90° alrededor de {axis}",
  "needRotationModel": "Carga un STL para girar el modelo.",
  "startupError": "No se puede iniciar la vista 3D. Comprueba la conexión a internet y la compatibilidad con WebGL."
});
  const t = (key, values = {}) => {
    let message = ToolShell.messages[ToolShell.language][key] || key;
    for (const [name, value] of Object.entries(values)) message = message.replaceAll('{' + name + '}', value);
    return message;
  };
  let statusKey = 'waiting';
  let statusValues = {};
  function setStatus(key, values = {}) {
    statusKey = key;
    statusValues = values;
    document.querySelector('#status').textContent = t(key, values);
  }
  function translateBase() {
    // Keep dynamic statuses and axis tooltips in sync with the shared language controls.
    const values = {...statusValues};
    document.querySelector('#status').textContent = t(statusKey, values);
    document.querySelectorAll('#tool-root .axis-button').forEach(button => {
      const label = t('axisView', {axis: button.dataset.axis.toUpperCase(), sign: Number(button.dataset.sign) > 0 ? '+' : '-'});
      button.title = label;
      button.setAttribute('aria-label', label);
    });
    if (document.querySelector('#file-name').textContent === 'Sin cargar' || document.querySelector('#file-name').textContent === 'Not loaded') document.querySelector('#file-name').textContent = t('notLoaded');
  }
  document.addEventListener('tool:languagechange', translateBase);
  ToolShell.setLanguage(ToolShell.language);
  (async () => {
    const THREE = await import('three');
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    const { STLLoader } = await import('three/addons/loaders/STLLoader.js');

    const viewer = document.querySelector("#viewer");
    const dropZone = document.querySelector("#drop-zone");
    const fileInput = document.querySelector("#file-input");
    const status = document.querySelector("#status");
    const emptyState = document.querySelector("#empty-state");

    const autoRotate = document.querySelector("#auto-rotate");
    const speed = document.querySelector("#speed");
    const speedValue = document.querySelector("#speed-value");
    const palette = document.querySelector("#palette");
    const colorValue = document.querySelector("#color-value");
    const axisValue = document.querySelector("#axis-value");
    const resetView = document.querySelector("#reset-view");
    const fileName = document.querySelector("#file-name");
    const triangles = document.querySelector("#triangles");
    const dimensions = document.querySelector("#dimensions");

    const colors = [
      { name: "gray", value: 0xd8dde8 },
      { name: "green", value: 0x0f766e },
      { name: "blue", value: 0x2563eb },
      { name: "coral", value: 0xf97316 },
      { name: "graphite", value: 0x334155 }
    ];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewer.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    const material = new THREE.MeshStandardMaterial({
      color: colors[0].value,
      roughness: 0.56,
      metalness: 0.08
    });

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const ambientLight = new THREE.HemisphereLight(0xffffff, 0x5b6472, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdde8ff, 1.4);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(10, 20, 0x9aa6b8, 0xc8d0dc);
    grid.material.transparent = true;
    grid.material.opacity = 0.38;
    scene.add(grid);

    const loader = new STLLoader();
    let currentMesh = null;
    let modelRadius = 5;
    let currentModelSize = new THREE.Vector3(6, 6, 6);
    let selectedColorIndex = 0;
    const rotationQueue = [];
    const rotationAxes = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
    const rotationDuration = 280;
    let rotationTransition = null;



    function resizeRenderer() {
      const width = viewer.clientWidth;
      const height = viewer.clientHeight;
      camera.aspect = Math.max(width, 1) / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function distanceForSize(size) {
      const maxSide = Math.max(size.x, size.y, size.z, 1);
      return maxSide / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.min(camera.aspect, 1);
    }

    function applyCamera(position) {
      // Avoid the polar singularity when looking along the Y axis.
      camera.up.set(0, Math.abs(position.y) > 0 && position.x === 0 && position.z === 0 ? 0 : 1, Math.abs(position.y) > 0 && position.x === 0 && position.z === 0 ? -Math.sign(position.y) : 0);
      camera.position.copy(position);
      camera.near = Math.max(modelRadius / 800, 0.01);
      camera.far = Math.max(modelRadius * 160, 1000);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.maxDistance = Math.max(modelRadius * 12, 10);
      controls.minDistance = Math.max(modelRadius * 0.05, 0.01);
      controls.update();
    }

    function frameModel(size) {
      const maxSide = Math.max(size.x, size.y, size.z, 1);
      currentModelSize.copy(size);
      modelRadius = maxSide * 0.75;
      const distance = distanceForSize(size);
      applyCamera(new THREE.Vector3(distance * 0.88, distance * 0.64, distance * 1.15));
      grid.scale.setScalar(Math.max(maxSide / 10, 0.1));
    }

    function rotateModel(axis, sign) {
      if (!currentMesh) {
        setStatus("needRotationModel");
        return;
      }
      // Queue each click so fast input still produces complete, ordered quarter turns.
      rotationQueue.push({ axis, sign });
      controls.autoRotate = false;
      autoRotate.checked = false;
    }

    function updateModelRotation(now) {
      if (!rotationTransition && rotationQueue.length) {
        const { axis, sign } = rotationQueue.shift();
        const from = modelGroup.quaternion.clone();
        // Premultiplication rotates around fixed world axes, preserving previous turns.
        const turn = new THREE.Quaternion().setFromAxisAngle(rotationAxes[axis], sign * Math.PI / 2);
        rotationTransition = { from, to: turn.multiply(from).normalize(), start: now, axis, sign };
        axisValue.textContent = `${sign > 0 ? "+" : "-"}90° ${axis.toUpperCase()}`;
      }
      if (!rotationTransition) return;
      const { from, to, start, axis, sign } = rotationTransition;
      const progress = Math.min((now - start) / rotationDuration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      modelGroup.quaternion.slerpQuaternions(from, to, eased);
      if (progress === 1) {
        modelGroup.quaternion.copy(to);
        rotationTransition = null;
        setStatus("axisStatus", { axis: axis.toUpperCase(), sign: sign > 0 ? "+" : "-" });
      }
    }

    function updateStats(name, geometry, size) {
      const triangleCount = Math.round((geometry.index?.count ?? geometry.attributes.position.count) / 3);
      fileName.textContent = name;
      triangles.dataset.count = String(triangleCount);
      triangles.textContent = new Intl.NumberFormat(ToolShell.language).format(triangleCount);
      dimensions.textContent = `${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`;
    }

    function loadSTL(file) {
      if (!file || !file.name.toLowerCase().endsWith(".stl")) {
        setStatus("invalidExtension");
        return;
      }

      setStatus("loading", { name: file.name });
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        try {
          const geometry = loader.parse(reader.result);
          // Reject empty or non-finite meshes before replacing the current preview.
          const positions = geometry.attributes.position;
          if (!positions || positions.count < 3 || positions.count % 3 !== 0 || !positions.array.every(Number.isFinite)) {
            geometry.dispose();
            throw new Error("Invalid STL geometry");
          }
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();

          const box = geometry.boundingBox;
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          geometry.translate(-center.x, -center.y, -center.z);

          if (currentMesh) {
            modelGroup.remove(currentMesh);
            currentMesh.geometry.dispose();
          }

          currentMesh = new THREE.Mesh(geometry, material);
          // A newly loaded file starts in its original orientation, without pending turns.
          rotationQueue.length = 0;
          rotationTransition = null;
          modelGroup.quaternion.identity();
          modelGroup.add(currentMesh);
          axisValue.textContent = t("free");
          frameModel(size);
          updateStats(file.name, geometry, size);
          emptyState.classList.add("is-hidden");
          setStatus("loaded");
        } catch {
          // Malformed user files are reported in the localized status, preserving the current model.
          setStatus("invalidSTL");
        }
      });

      reader.addEventListener("error", () => {
        setStatus("readError");
      });

      reader.readAsArrayBuffer(file);
    }

    function syncSpeed() {
      const value = Number(speed.value);
      controls.autoRotateSpeed = THREE.MathUtils.lerp(0, 5, value / 100);
      speedValue.textContent = `${value}%`;
    }

    function selectColor(index) {
      selectedColorIndex = index;
      const selected = colors[selectedColorIndex];
      material.color.setHex(selected.value);
      colorValue.textContent = t(selected.name);

      for (const button of palette.querySelectorAll(".swatch")) {
        const isSelected = Number(button.dataset.index) === selectedColorIndex;
        button.setAttribute("aria-pressed", String(isSelected));
      }
    }

    function buildPalette() {
      colors.forEach((color, index) => {
        const button = document.createElement("button");
        button.className = "swatch";
        button.type = "button";
        button.dataset.index = String(index);
        button.style.setProperty("--swatch", `#${color.value.toString(16).padStart(6, "0")}`);
        button.setAttribute("aria-label", t(color.name));
        button.setAttribute("aria-pressed", "false");
        button.title = t(color.name);
        button.addEventListener("click", () => selectColor(index));
        palette.appendChild(button);
      });
    }

    fileInput.addEventListener("change", () => {
      loadSTL(fileInput.files[0]);
    });

    for (const eventName of ["dragenter", "dragover"]) {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.add("is-over");
      });
    }

    for (const eventName of ["dragleave", "drop"]) {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropZone.classList.remove("is-over");
      });
    }

    dropZone.addEventListener("drop", (event) => {
      loadSTL(event.dataTransfer.files[0]);
    });



    autoRotate.addEventListener("change", () => {
      controls.autoRotate = autoRotate.checked;
    });

    speed.addEventListener("input", syncSpeed);

    for (const button of document.querySelectorAll(".axis-button")) {
      button.addEventListener("click", () => {
        rotateModel(button.dataset.axis, Number(button.dataset.sign));
      });
    }

    resetView.addEventListener("click", () => {
      if (!currentMesh) {
        setStatus("needModel");
        return;
      }

      frameModel(currentModelSize);
      setStatus("centered");
    });

    // Observe the preview itself, including layout changes at mobile breakpoints.
    new ResizeObserver(resizeRenderer).observe(viewer);

    function animate(now = performance.now()) {
      requestAnimationFrame(animate);
      updateModelRotation(now);
      controls.update();
      renderer.render(scene, camera);
    }

    resizeRenderer();
    buildPalette();

    syncSpeed();
    selectColor(0);
    animate();
  
    function translateDynamic() {
      selectColor(selectedColorIndex);
      for (const button of palette.querySelectorAll('.swatch')) {
        const label = t(colors[Number(button.dataset.index)].name);
        button.title = label;
        button.setAttribute('aria-label', label);
      }
      if (!/^[+-]90° [XYZ]$/.test(axisValue.textContent)) axisValue.textContent = t('free');
      if (triangles.dataset.count) triangles.textContent = new Intl.NumberFormat(ToolShell.language).format(Number(triangles.dataset.count));
    }
    document.addEventListener('tool:languagechange', translateDynamic);
    translateDynamic();
  })().catch(error => {
    console.error(error);
    setStatus('startupError');
  });
})();
