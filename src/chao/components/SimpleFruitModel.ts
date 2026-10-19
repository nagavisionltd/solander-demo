import * as THREE from 'three';
import { CHAO_BEHAVIOR, COLLECTIBLES } from '../../constants';

/**
 * Simple procedural fruit model for MVP.
 * Represents food items that Chao can eat.
 */
export class SimpleFruitModel {
  public mesh: THREE.Group;
  private baseScale: number = 1;
  private currentScale: number = 1;
  private isEaten: boolean = false;

  constructor(type: 'apple' | 'banana' | 'cherry' = 'apple') {
    this.mesh = new THREE.Group();
    
    let color = 0xff3333; // Apple red
    let geometry = new THREE.SphereGeometry(0.3, 16, 16);

    if (type === 'banana') {
      color = 0xffff33;
      geometry = new THREE.CapsuleGeometry(0.15, 0.6, 8, 16);
    } else if (type === 'cherry') {
      color = 0xcc0066;
      geometry = new THREE.SphereGeometry(0.2, 16, 16);
    }

    const material = new THREE.MeshToonMaterial({ color });
    const fruitMesh = new THREE.Mesh(geometry, material);
    
    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0x663300 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = type === 'banana' ? 0.4 : 0.35;
    
    this.mesh.add(fruitMesh);
    this.mesh.add(stem);
    
    // Leaf (optional)
    if (type !== 'cherry') {
      const leafGeo = new THREE.CircleGeometry(0.15, 8);
      const leafMat = new THREE.MeshBasicMaterial({ color: 0x33cc33 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0.1, 0.4, 0);
      leaf.rotation.z = -Math.PI / 4;
      this.mesh.add(leaf);
    }

    this.baseScale = type === 'banana' ? 1.2 : 1.0;
    this.currentScale = this.baseScale;
  }

  /**
   * Simulate eating: shrink over time until disappearance
   * @param delta Time delta
   * @returns true if fully eaten, false otherwise
   */
  public update(delta: number): boolean {
    if (this.isEaten) return true;

    // Shrink speed
    const shrinkRate = CHAO_BEHAVIOR.EAT_DURATION > 0 
      ? this.baseScale / CHAO_BEHAVIOR.EAT_DURATION 
      : 0.5;
    
    this.currentScale -= shrinkRate * delta;

    if (this.currentScale <= 0.1) {
      this.isEaten = true;
      this.mesh.visible = false;
      return true; // Fully eaten
    }

    this.mesh.scale.setScalar(this.currentScale);
    return false;
  }

  public reset(): void {
    this.isEaten = false;
    this.currentScale = this.baseScale;
    this.mesh.visible = true;
    this.mesh.scale.setScalar(1);
  }

  public dispose(): void {
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}
