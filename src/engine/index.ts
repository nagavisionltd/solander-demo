/**
 * Index exports for engine module
 */

// Components
export { ParticleSystem } from './components/ParticleSystem';

// Utils
export {
  createSoftParticleTexture,
  createToonRampTexture,
  mergeGeometries,
  createInstancedMesh,
  disposeGeometry,
  disposeMaterial,
  disposeObject3D,
} from './utils/geometry';

export { AssetLoader, assetLoader } from './utils/AssetLoader';

// Core
export { ThirdPersonCamera } from './camera';
export { InputManager, InputVector } from './input';
export { SceneManager } from './scene';
