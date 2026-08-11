/**
 * Shared Type Definitions
 */

import * as THREE from 'three';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface Disposable {
  dispose(): void;
}

export interface Updateable {
  update(deltaTime: number): void;
}

export interface Destroyable {
  destroy(): void;
}

export type Lifecycle = Updateable & Destroyable;

export interface MeshComponent extends Disposable, Updateable {
  mesh: THREE.Object3D;
  enabled: boolean;
}

export interface ParticleConfig {
  count: number;
  size: number;
  color: number;
  opacity: number;
  blending?: THREE.Blending;
  texture?: THREE.Texture;
}

export interface LODConfig {
  distances: { near: number; medium: number; far: number };
  meshes: { low: THREE.Object3D; medium?: THREE.Object3D; high?: THREE.Object3D };
}

export interface AssetManifest {
  models: Record<string, string>;
  textures: Record<string, string>;
  sounds: Record<string, string>;
}
