import * as THREE from 'three';

/**
 * Instanced rendering utilities for efficient batch rendering
 * Reduces draw calls by rendering multiple copies of the same geometry
 */

export interface InstancedRenderConfig {
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  initialPositions?: Float32Array;
  initialRotations?: Float32Array;
  initialScales?: Float32Array;
}

/**
 * Create an instanced mesh for efficient rendering of many identical objects
 */
export function createInstancedMesh(config: InstancedRenderConfig): THREE.InstancedMesh {
  const { count, geometry, material } = config;
  
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  
  // Initialize instance transforms
  const dummy = new THREE.Object3D();
  
  for (let i = 0; i < count; i++) {
    if (config.initialPositions) {
      dummy.position.set(
        config.initialPositions[i * 3],
        config.initialPositions[i * 3 + 1],
        config.initialPositions[i * 3 + 2]
      );
    } else {
      dummy.position.set(0, 0, 0);
    }
    
    if (config.initialRotations) {
      dummy.rotation.set(
        config.initialRotations[i * 3],
        config.initialRotations[i * 3 + 1],
        config.initialRotations[i * 3 + 2]
      );
    } else {
      dummy.rotation.set(0, 0, 0);
    }
    
    if (config.initialScales) {
      dummy.scale.set(
        config.initialScales[i * 3],
        config.initialScales[i * 3 + 1],
        config.initialScales[i * 3 + 2]
      );
    } else {
      dummy.scale.set(1, 1, 1);
    }
    
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;
  
  return instancedMesh;
}

/**
 * Update a single instance's transform in an instanced mesh
 */
export function updateInstanceTransform(
  instancedMesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  rotation?: THREE.Euler,
  scale?: THREE.Vector3
): void {
  const dummy = new THREE.Object3D();
  dummy.position.copy(position);
  
  if (rotation) {
    dummy.rotation.copy(rotation);
  }
  
  if (scale) {
    dummy.scale.copy(scale);
  } else {
    dummy.scale.set(1, 1, 1);
  }
  
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(index, dummy.matrix);
  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Batch update multiple instances efficiently
 */
export function updateInstancesBatch(
  instancedMesh: THREE.InstancedMesh,
  updates: Array<{
    index: number;
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
  }>
): void {
  const dummy = new THREE.Object3D();
  
  updates.forEach(update => {
    dummy.position.copy(update.position);
    
    if (update.rotation) {
      dummy.rotation.copy(update.rotation);
    } else {
      dummy.rotation.set(0, 0, 0);
    }
    
    if (update.scale) {
      dummy.scale.copy(update.scale);
    } else {
      dummy.scale.set(1, 1, 1);
    }
    
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(update.index, dummy.matrix);
  });
  
  instancedMesh.instanceMatrix.needsUpdate = true;
}

/**
 * Create instanced lily pads with optional flowers
 */
export function createInstancedLilyPads(
  count: number,
  poolCenter: THREE.Vector3,
  poolRadius: number,
  padMaterial: THREE.Material,
  flowerMaterial?: THREE.Material
): { pads: THREE.InstancedMesh; flowers?: THREE.InstancedMesh } {
  const padGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 12);
  const pads = createInstancedMesh({
    count,
    geometry: padGeo,
    material: padMaterial,
  });
  
  const dummy = new THREE.Object3D();
  const positions: THREE.Vector3[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 1.2 + Math.random() * (poolRadius - 2);
    const x = poolCenter.x + Math.cos(angle) * r;
    const z = poolCenter.z + Math.sin(angle) * r;
    
    positions.push(new THREE.Vector3(x, 0.08, z));
  }
  
  // Update all instances
  positions.forEach((pos, i) => {
    dummy.position.copy(pos);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    pads.setMatrixAt(i, dummy.matrix);
  });
  
  pads.instanceMatrix.needsUpdate = true;
  pads.castShadow = false;
  pads.receiveShadow = true;
  
  let flowers: THREE.InstancedMesh | undefined;
  
  if (flowerMaterial) {
    const flowerGeo = new THREE.DodecahedronGeometry(0.18, 1);
    const flowerCount = Math.floor(count / 2); // Every other pad has a flower
    
    flowers = createInstancedMesh({
      count: flowerCount,
      geometry: flowerGeo,
      material: flowerMaterial,
    });
    
    for (let i = 0; i < flowerCount; i++) {
      const pos = positions[i * 2]; // Every other position
      dummy.position.copy(pos);
      dummy.position.y += 0.12;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
    }
    
    flowers.instanceMatrix.needsUpdate = true;
  }
  
  return { pads, flowers };
}

/**
 * Create instanced fireflies/sparkles
 */
export function createInstancedFireflies(
  count: number,
  spread: number,
  yMin: number,
  yMax: number,
  color: number,
  size: number,
  opacity: number
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * spread;
    positions[i + 1] = yMin + Math.random() * (yMax - yMin);
    positions[i + 2] = (Math.random() - 0.5) * spread;
    
    const idx = i / 3;
    scales[idx] = 0.8 + Math.random() * 0.4;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
  });
  
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // Keep visible even when moving
  
  return points;
}

/**
 * Dispose instanced mesh resources properly
 */
export function disposeInstancedMesh(instancedMesh: THREE.InstancedMesh): void {
  instancedMesh.geometry.dispose();
  
  const material = instancedMesh.material;
  if (Array.isArray(material)) {
    material.forEach(m => m.dispose());
  } else {
    material.dispose();
  }
}
