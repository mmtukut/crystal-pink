const canvasSketch = require("canvas-sketch");

// Import ThreeJS and assign it to global scope
// This way examples/ folder can use it too
const THREE = require("three");
global.THREE = THREE;

// Import extra THREE plugins
require("three/examples/js/controls/OrbitControls");
require("three/examples/js/geometries/RoundedBoxGeometry.js");
require("three/examples/js/loaders/GLTFLoader.js");
require("three/examples/js/loaders/RGBELoader.js");
require("three/examples/js/postprocessing/EffectComposer.js");
require("three/examples/js/postprocessing/RenderPass.js");
require("three/examples/js/postprocessing/ShaderPass.js");
require("three/examples/js/postprocessing/UnrealBloomPass.js");
require("three/examples/js/shaders/LuminosityHighPassShader.js");
require("three/examples/js/shaders/CopyShader.js");

// const Stats = require("stats-js");
// const { GUI } = require("dat.gui");

const settings = {
  animate: true,
  context: "webgl",
  resizeCanvas: false,
};

const sketch = ({ context, canvas, width, height }) => {
  // const stats = new Stats();
  // document.body.appendChild(stats.dom);
  // const gui = new GUI();


  const options = {
    enableSwoopingCamera: false,
    enableRotation: false,
    color: 0xffbc54,
    metalness: 0.63,
    roughness: 0.05,
    transmission: 1,
    ior: 3.3,
    reflectivity: 1,
    thickness: 5,
    envMapIntensity: 1.2,
    clearcoat: 0,
    clearcoatRoughness: 3,
    normalScale: 5,
    clearcoatNormalScale: 5,
    normalRepeat: 1,
    bloomThreshold: 0.85,
    bloomStrength: 0.35,
    bloomRadius: 0.33,
  };

  // Setup
  // -----

  const renderer = new THREE.WebGLRenderer({
    context,
    antialias: false,
  });
  renderer.setClearColor(0x000000, 1);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 35);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enabled = !options.enableSwoopingCamera;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 9;
  controls.enableDamping = true;
  controls.dampingFactor = 1.25;
  controls.enableZoom = true;
  controls.minDistance = 10;
  controls.maxDistance = 60;
  controls.enablePan = false;
  const scene = new THREE.Scene();

  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(width, height),
    options.bloomStrength,
    options.bloomRadius,
    options.bloomThreshold
  );

  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  // Content
  // -------

  const textureLoader = new THREE.TextureLoader();

  const hdrEquirect = new THREE.RGBELoader().load(
    "src/reflection.hdr",
    () => {
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
    }
  );

  const normalMapTexture = textureLoader.load("src/Black_Normal.jpg");
  normalMapTexture.wrapS = THREE.RepeatWrapping;
  normalMapTexture.wrapT = THREE.RepeatWrapping;
  normalMapTexture.repeat.set(options.normalRepeat, options.normalRepeat);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xa0a0a0,
    metalness: options.metalness,
    roughness: options.roughness,
    transmission: options.transmission,
    ior: options.ior,
    reflectivity: options.reflectivity,
    thickness: options.thickness,
    envMap: hdrEquirect,
    envMapIntensity: options.envMapIntensity,
    clearcoat: options.clearcoat,
    clearcoatRoughness: options.clearcoatRoughness,
    normalScale: new THREE.Vector2(options.normalScale),
    normalMap: normalMapTexture,
    clearcoatNormalMap: normalMapTexture,
    clearcoatNormalScale: new THREE.Vector2(options.clearcoatNormalScale),
    // attenuationTint: options.attenuationTint,
    // attenuationDistance: options.attenuationDistance,
  });

  let mesh = null;

  // Load dragon GLTF model
  new THREE.GLTFLoader().load("src/black.glb", (gltf) => {
    const dragon = gltf.scene.children.find((mesh) => mesh.name === "dragon");
    const geometry = dragon.geometry.clone();
    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(0.25, 0.25, 0.25);
    scene.add(mesh);
    // Discard the loaded model
    gltf.scene.children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  });

  //Load GLTF model from the local directory
  const loader = new THREE.GLTFLoader();
  loader.load('/src/black.glb', function(gltf) {
    const model = gltf.scene;
    model.scale.set(0.245, 0.245, 0.245);

    // Change emissive material to MeshPhysicalMaterial
    model.traverse((child) => {
      if (child.isMesh) {
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xd23e3e,
          metalness: 0.7,
          roughness: 0,
          opacity: 0.1,
          envMap: hdrEquirect,
          envMapIntensity: options.envMapIntensity,
          ior: 2.5,
          reflectivity: 0.5,
          thickness: 2.5,
          envMapIntensity: 2.5,
        });
        child.material = material;
      }
    });
    scene.add(model);
  });

  //Load GLTF model from the local directory
  loader.load('/src/gs.glb', function(gltf) {
    const model = gltf.scene;
    model.scale.set(0.251, 0.251, 0.251);
    model.traverse((child) => {
      if (child.isMesh) {
        const material = new THREE.MeshStandardMaterial({
          color: 0xa0a0a0,
          metalness: 0.6,
          roughness: 0.6,
          envMap: hdrEquirect, // Set the HDR environment map
          envMapIntensity: 1, // Adjust the intensity of the environment map
        });
        child.material = material;
      }
    });
    scene.add(model);
  });

  // GUI

  /** gui.add(options, "enableSwoopingCamera").onChange((val) => {
    controls.enabled = !val;
    controls.reset();
  });

  gui.addColor(options, "color").onChange((val) => {
    material.color.set(val);
  });

  gui.add(options, "roughness", 0, 1, 0.01).onChange((val) => {
    material.roughness = val;
  });

  gui.add(options, "metalness", 0, 1, 0.01).onChange((val) => {
    material.metalness = val;
  });

  gui.add(options, "transmission", 0, 1, 0.01).onChange((val) => {
    material.transmission = val;
  });

  gui.add(options, "ior", 1, 2.33, 0.01).onChange((val) => {
    material.ior = val;
  });

  gui.add(options, "reflectivity", 0, 1, 0.01).onChange((val) => {
    material.reflectivity = val;
  });

  gui.add(options, "thickness", 0, 5, 0.1).onChange((val) => {
    material.thickness = val;
  });

  gui.add(options, "envMapIntensity", 0, 3, 0.1).onChange((val) => {
    material.envMapIntensity = val;
  });

  gui.add(options, "clearcoat", 0, 1, 0.01).onChange((val) => {
    material.clearcoat = val;
  });

  gui.add(options, "clearcoatRoughness", 0, 1, 0.01).onChange((val) => {
    material.clearcoatRoughness = val;
  });

  gui.add(options, "normalScale", 0, 5, 0.01).onChange((val) => {
    material.normalScale.set(val, val);
  });

  gui.add(options, "clearcoatNormalScale", 0, 5, 0.01).onChange((val) => {
    material.clearcoatNormalScale.set(val, val);
  });

  gui.add(options, "normalRepeat", 1, 4, 1).onChange((val) => {
    normalMapTexture.repeat.set(val, val);
  });

  // gui.addColor(options, "attenuationTint").onChange((val) => {
  //   material.attenuationTint.set(val);
  // });

  // gui.add(options, "attenuationDistance", 0, 1, 0.01).onChange((val) => {
  //   material.attenuationDistance = val;
  // });

  const postprocessing = gui.addFolder("Post Processing");

  postprocessing.add(options, "bloomThreshold", 0, 1, 0.01).onChange((val) => {
    bloomPass.threshold = val;
  });

  postprocessing.add(options, "bloomStrength", 0, 5, 0.01).onChange((val) => {
    bloomPass.strength = val;
  });

  postprocessing.add(options, "bloomRadius", 0, 1, 0.01).onChange((val) => {
    bloomPass.radius = val;
  });
  **/
  // Update
  // ------
  const update = (time, deltaTime) => {
    if (options.enableSwoopingCamera) {
      camera.position.x = Math.sin((time / 10) * Math.PI * 2) * 2;
      camera.position.y = Math.cos((time / 10) * Math.PI * 2) * 2;
      camera.position.z = 4;
      camera.lookAt(scene.position);
    }
  };

  // Lifecycle
  // ---------

  return {
    resize({ canvas, pixelRatio, viewportWidth, viewportHeight }) {
      const dpr = Math.min(pixelRatio, 2); // Cap DPR scaling to 2x

      canvas.width = viewportWidth * dpr;
      canvas.height = viewportHeight * dpr;
      canvas.style.width = viewportWidth + "px";
      canvas.style.height = viewportHeight + "px";

      bloomPass.resolution.set(viewportWidth, viewportHeight);

      renderer.setPixelRatio(dpr);
      renderer.setSize(viewportWidth, viewportHeight);

      composer.setPixelRatio(dpr);
      composer.setSize(viewportWidth, viewportHeight);

      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time, deltaTime }) {
      // stats.begin();
      controls.update();
      update(time, deltaTime);
      composer.render();
      // stats.end();
    },
    unload() {
      mesh.geometry.dispose();
      material.dispose();
      hdrEquirect.dispose();
      controls.dispose();
      renderer.dispose();
      bloomPass.dispose();
      // gui.destroy();
      // document.body.removeChild(stats.dom);
    },
  };
};

canvasSketch(sketch, settings);