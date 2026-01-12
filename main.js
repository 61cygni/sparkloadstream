import * as THREE from "three";
import { NewSparkRenderer, SplatMesh, SparkControls, SparkXr } from "@sparkjsdev/spark";

// Scene setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Local frame for camera control and WebXR reference
const localFrame = new THREE.Group();
scene.add(localFrame);
localFrame.add(camera);

// Spark renderer
const spark = new NewSparkRenderer({
  renderer: renderer,
  maxStdDev: Math.sqrt(5),
  lodSplatScale: 2.0,
});
scene.add(spark);

const splat = new SplatMesh({ url: "/splats/cozy_ship-lod-0.spz" });
scene.add(splat);

// Controls
const controls = new SparkControls({
  renderer: renderer,
  canvas: renderer.domElement,
});

// VR support
const xr = new SparkXr({
  renderer: renderer,
  onMouseLeaveOpacity: 0.5,
  onReady: (supported) => console.log(`VR ${supported ? "supported" : "not supported"}`),
  onEnterXr: () => console.log("Enter XR"),
  onExitXr: () => console.log("Exit XR"),
  enableHands: true,
  controllers: {},
});

// Reduce XR resolution for performance (splats hide the difference)
renderer.xr.setFramebufferScaleFactor(0.5);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const CAMERA_DISCONTINUITY_THRESHOLD = 0.5;
let lastCameraPos = new THREE.Vector3(0, 0, 0);

renderer.setAnimationLoop((time, xrFrame) => {
  // Local frame compensation for WebXR
  if (lastCameraPos.distanceTo(camera.position) > CAMERA_DISCONTINUITY_THRESHOLD) {
    localFrame.position.copy(camera.position).multiplyScalar(-1);
  }
  lastCameraPos.copy(camera.position);

  // Update XR controllers
  if (xr?.updateControllers) {
    xr.updateControllers(camera);
  }

  controls.update(localFrame);

  // Update XR hands if presenting
  if (xr?.updateHands && renderer.xr.isPresenting) {
    xr.updateHands({ xrFrame });
  }

  renderer.render(scene, camera);
});
