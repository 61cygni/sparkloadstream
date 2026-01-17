import * as THREE from "three";
import { NewSparkRenderer, SplatMesh, SparkControls, SparkXr } from "@sparkjsdev/spark";
import { initMobileControls, getMobileInput, isMobileDevice, setMobileControlsEnabled } from "./mobile-controls.js";

// Scene setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// Local frame for camera control and WebXR reference
const localFrame = new THREE.Group();
localFrame.position.set(-7.33, 6.05, -0.31);
localFrame.rotation.set(0, -Math.PI, 0);
scene.add(localFrame);
localFrame.add(camera);

// Spark renderer
const spark = new NewSparkRenderer({
  renderer: renderer,
  maxStdDev: Math.sqrt(5),
  lodSplatScale: 2.0,
});
scene.add(spark);

// For streaming: use paged: true with a -lod-0.spz file
// The system will automatically fetch -lod-1.spz, -lod-2.spz, etc.
const splat = new SplatMesh({ 
  //url: "https://public-spz.t3.storage.dev/cozyship/splats/cozy_ship-lod-0.spz",
  url: "https://public-spz.t3.storage.dev/cozyspaceship2/cozy-spaceship_2-lod-0.spz",
  paged: true,  // Enable streaming
});
scene.add(splat);

// Controls
const controls = new SparkControls({
  renderer: renderer,
  canvas: renderer.domElement,
});
controls.fpsMovement.moveSpeed = 5.0; // Increase movement speed

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

// Initialize mobile controls if on touch device
if (isMobileDevice()) {
  initMobileControls();
}

// Hide mobile controls when entering VR, show when exiting
const originalOnEnterXr = xr.options?.onEnterXr;
const originalOnExitXr = xr.options?.onExitXr;
xr.onEnterXr = () => {
  setMobileControlsEnabled(false);
  originalOnEnterXr?.();
};
xr.onExitXr = () => {
  if (isMobileDevice()) setMobileControlsEnabled(true);
  originalOnExitXr?.();
};

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const CAMERA_DISCONTINUITY_THRESHOLD = 0.5;
let lastCameraPos = new THREE.Vector3(0, 0, 0);
let lastTime = 0;
const MOVE_SPEED = 5.0; // Units per second

renderer.setAnimationLoop((time, xrFrame) => {
  const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;

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

  // Apply mobile joystick input
  const mobileInput = getMobileInput();
  if (mobileInput.active) {
    // Get camera's world-space orientation (accounts for localFrame rotation + camera rotation)
    const worldQuat = camera.getWorldQuaternion(new THREE.Quaternion());
    
    // Get forward and right vectors (ignore Y for horizontal movement)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(worldQuat);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(worldQuat);
    right.y = 0;
    right.normalize();
    
    // Move based on joystick input (y positive = backward)
    const moveDistance = MOVE_SPEED * deltaTime;
    localFrame.position.addScaledVector(right, mobileInput.x * moveDistance);
    localFrame.position.addScaledVector(forward, -mobileInput.y * moveDistance);
  }

  // Update XR hands if presenting
  if (xr?.updateHands && renderer.xr.isPresenting) {
    xr.updateHands({ xrFrame });
  }

  renderer.render(scene, camera);
});
