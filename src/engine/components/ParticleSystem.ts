/**
 * Particle System Component
 * Reusable particle system for effects like fireflies, mist, dust, etc.
 */

import * as THREE from 'three';
import type { ParticleConfig, Updateable, Destroyable } from '../../types';

export class ParticleSystem implements Updateable, Destroyable {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private velocities: THREE.Vector3[];
  private scales: Float32Array;
  private count: number;
  
  constructor(config: ParticleConfig) {
    this.count = config.count;
    
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.velocities = [];
    this.scales = new Float32Array(this.count);
    
    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      this.velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        Math.random() * 0.01,
        (Math.random() - 0.5) * 0.02
      ));
      
      this.scales[i] = 0.5 + Math.random() * 0.5;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('scale', new THREE.BufferAttribute(this.scales, 1));
    
    this.material = new THREE.PointsMaterial({
      color: config.color,
      size: config.size,
      transparent: true,
      opacity: config.opacity,
      blending: config.blending ?? THREE.AdditiveBlending,
      map: config.texture,
      depthWrite: false,
    });
    
    this.points = new THREE.Points(this.geometry, this.material);
  }
  
  update(deltaTime: number): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      
      // Update position with velocity
      positions[idx] += this.velocities[i].x;
      positions[idx + 1] += this.velocities[i].y;
      positions[idx + 2] += this.velocities[i].z;
      
      // Add some noise/wander
      this.velocities[i].x += (Math.random() - 0.5) * 0.001;
      this.velocities[i].z += (Math.random() - 0.5) * 0.001;
      
      // Clamp velocity
      this.velocities[i].clampLength(0, 0.05);
      
      // Boundary check - wrap around
      if (positions[idx] < -5) positions[idx] = 5;
      if (positions[idx] > 5) positions[idx] = -5;
      if (positions[idx + 2] < -5) positions[idx + 2] = 5;
      if (positions[idx + 2] > 5) positions[idx + 2] = -5;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
  }
  
  destroy(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
  
  setParent(parent: THREE.Object3D): void {
    parent.add(this.points);
  }
}
