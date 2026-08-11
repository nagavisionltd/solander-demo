/**
 * Geometry Utilities for Three.js
 * Provides reusable geometry creation and optimization functions
 */

import * as THREE from 'three';

/**
 * Creates a reusable soft particle texture for volumetric effects
 */
export function createSoftParticleTexture(size: number = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  return texture;
}

/**
 * Creates a toon ramp texture for NPR shading
 */
export function createToonRampTexture(colors?: string[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    
    const defaultColors = [
      { pos: 0.00, color: '#323242' },
      { pos: 0.32, color: '#6b6b80' },
      { pos: 0.58, color: '#b8b8cc' },
      { pos: 0.88, color: '#f0f0f8' },
      { pos: 1.00, color: '#ffffff' },
    ];
    
    const stops = colors?.length ? colors : defaultColors.map(c => c.color);
    const positions = colors?.length ? [0, 0.32, 0.58, 0.88, 1] : defaultColors.map(c => c.pos);
    
    stops.forEach((color, i) => {
      gradient.addColorStop(positions[i] || i / stops.length, color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  
  return texture;
}

/**
 * Merges multiple geometries into a single optimized geometry
 * Reduces draw calls by combining static meshes
 */
export function mergeGeometries(geometries: THREE.BufferGeometry[], disposeOriginals: boolean = true): THREE.BufferGeometry {
  const mergedGeometry = THREE.BufferGeometryUtils.mergeGeometries(geometries, disposeOriginals);
  mergedGeometry.computeVertexNormals();
  return mergedGeometry;
}

/**
 * Creates instanced geometry for repeated objects (grass, rocks, etc.)
 * Significantly improves performance for large quantities
 */
export function createInstancedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  count: number,
  positions: THREE.Vector3[]
): THREE.InstancedMesh {
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  
  const dummy = new THREE.Object3D();
  positions.forEach((pos, i) => {
    dummy.position.copy(pos);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  });
  
  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}

/**
 * Safely disposes of Three.js resources to prevent memory leaks
 */
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose();
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach(m => m.dispose());
  } else {
    material.dispose();
  }
}

export function disposeObject3D(object: THREE.Object3D, deep: boolean = true): void {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      disposeGeometry(mesh.geometry);
      disposeMaterial(mesh.material);
    }
    if ((child as THREE.Points).isPoints) {
      const points = child as THREE.Points;
      disposeGeometry(points.geometry);
      disposeMaterial(points.material);
    }
    if ((child as THREE.InstancedMesh).isInstancedMesh) {
      const instanced = child as THREE.InstancedMesh;
      disposeGeometry(instanced.geometry);
      disposeMaterial(instanced.material);
    }
  });
  
  if (deep) {
    while (object.children.length > 0) {
      const child = object.children[0];
      object.remove(child);
      disposeObject3D(child, false);
    }
  }
}

/**
 * Properly dispose of Points resources
 */
export function disposePoints(points: THREE.Points): void {
  if (points.geometry) {
    points.geometry.dispose();
  }
  if (points.material) {
    const material = points.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose());
    } else {
      material.dispose();
    }
  }
}

/**
 * Clean up canvas textures to prevent memory leaks
 */
export function disposeCanvasTexture(texture: THREE.CanvasTexture): void {
  texture.dispose();
  // Also dispose the underlying canvas if it exists
  const image = texture.image as HTMLCanvasElement;
  if (image && image.getContext) {
    // Clear canvas context
    const ctx = image.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, image.width, image.height);
    }
  }
}
