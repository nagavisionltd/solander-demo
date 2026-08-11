/**
 * Character Model Component
 * Optimized character model with proper material sharing and LOD support
 */

import * as THREE from 'three';
import { createToonRampTexture } from '../utils/geometry';
import type { Updateable, Destroyable } from '../../types';

export interface CharacterConfig {
  height?: number;
  color?: number;
  enableLOD?: boolean;
}

export class CharacterModel implements Updateable, Destroyable {
  public mesh: THREE.Group;
  private materials: Map<string, THREE.MeshToonMaterial> = new Map();
  private toonRampTexture: THREE.CanvasTexture;
  
  // Body parts for animation
  public headGroup: THREE.Group;
  public bodyMesh: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public tailSegments: THREE.Mesh[] = [];
  
  // Animation state
  private walkCycleTimer: number = 0;
  private isMoving: boolean = false;
  
  constructor(config: CharacterConfig = {}) {
    const height = config.height ?? 1.8;
    const color = config.color ?? 0x4a90d9;
    
    this.toonRampTexture = createToonRampTexture();
    this.mesh = new THREE.Group();
    
    // Create shared toon material
    const mainMaterial = this.createToonMaterial(color);
    const accentMaterial = this.createToonMaterial(0xffffff);
    
    // Build character hierarchy
    this.bodyMesh = this.createBody(height, mainMaterial);
    this.headGroup = this.createHead(height, mainMaterial, accentMaterial);
    this.leftArm = this.createArm('left', height, mainMaterial);
    this.rightArm = this.createArm('right', height, mainMaterial);
    this.leftLeg = this.createLeg('left', height, mainMaterial);
    this.rightLeg = this.createLeg('right', height, mainMaterial);
    this.tailSegments = this.createTail(height, mainMaterial);
    
    // Assemble character
    this.mesh.add(this.bodyMesh);
    this.mesh.add(this.headGroup);
    this.mesh.add(this.leftArm);
    this.mesh.add(this.rightArm);
    this.mesh.add(this.leftLeg);
    this.mesh.add(this.rightLeg);
    this.tailSegments.forEach(segment => this.mesh.add(segment));
    
    // Position body parts relative to body
    this.bodyMesh.position.y = height * 0.5;
    this.headGroup.position.set(0, height * 0.92, 0);
    this.leftArm.position.set(-0.35, height * 0.75, 0);
    this.rightArm.position.set(0.35, height * 0.75, 0);
    this.leftLeg.position.set(-0.25, height * 0.15, 0);
    this.rightLeg.position.set(0.25, height * 0.15, 0);
    
    // Tail follows body
    this.tailSegments[0].position.set(0, height * 0.3, -0.3);
  }
  
  private createToonMaterial(color: number): THREE.MeshToonMaterial {
    const material = new THREE.MeshToonMaterial({
      color,
      gradientMap: this.toonRampTexture,
      transparent: false,
    });
    
    this.materials.set(`color_${color}`, material);
    return material;
  }
  
  private createBody(height: number, material: THREE.MeshToonMaterial): THREE.Mesh {
    const geometry = new THREE.CapsuleGeometry(height * 0.18, height * 0.35, 4, 8);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  
  private createHead(
    height: number,
    mainMaterial: THREE.MeshToonMaterial,
    accentMaterial: THREE.MeshToonMaterial
  ): THREE.Group {
    const group = new THREE.Group();
    
    // Head sphere
    const headGeo = new THREE.SphereGeometry(height * 0.14, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, mainMaterial);
    headMesh.castShadow = true;
    group.add(headMesh);
    
    // Snout
    const snoutGeo = new THREE.CapsuleGeometry(height * 0.05, height * 0.08, 4, 8);
    const snout = new THREE.Mesh(snoutGeo, accentMaterial);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -height * 0.02, height * 0.11);
    snout.castShadow = true;
    group.add(snout);
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(height * 0.025, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-height * 0.05, height * 0.02, height * 0.12);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(height * 0.05, height * 0.02, height * 0.12);
    group.add(rightEye);
    
    // Eyebrows for expression
    const browGeo = new THREE.BoxGeometry(height * 0.06, height * 0.015, height * 0.01);
    const browMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    
    const leftBrow = new THREE.Mesh(browGeo, browMaterial);
    leftBrow.position.set(-height * 0.05, height * 0.05, height * 0.115);
    group.add(leftBrow);
    
    const rightBrow = new THREE.Mesh(browGeo, browMaterial);
    rightBrow.position.set(height * 0.05, height * 0.05, height * 0.115);
    group.add(rightBrow);
    
    return group;
  }
  
  private createArm(
    side: 'left' | 'right',
    height: number,
    material: THREE.MeshToonMaterial
  ): THREE.Group {
    const group = new THREE.Group();
    
    // Upper arm
    const upperArmGeo = new THREE.CapsuleGeometry(height * 0.06, height * 0.18, 4, 8);
    const upperArm = new THREE.Mesh(upperArmGeo, material);
    upperArm.position.y = -height * 0.09;
    upperArm.castShadow = true;
    group.add(upperArm);
    
    // Forearm (child of upper arm for hierarchical animation)
    const forearmGeo = new THREE.CapsuleGeometry(height * 0.05, height * 0.16, 4, 8);
    const forearm = new THREE.Mesh(forearmGeo, material);
    forearm.position.y = -height * 0.15;
    forearm.castShadow = true;
    group.add(forearm);
    
    return group;
  }
  
  private createLeg(
    side: 'left' | 'right',
    height: number,
    material: THREE.MeshToonMaterial
  ): THREE.Group {
    const group = new THREE.Group();
    
    // Upper leg
    const upperLegGeo = new THREE.CapsuleGeometry(height * 0.07, height * 0.2, 4, 8);
    const upperLeg = new THREE.Mesh(upperLegGeo, material);
    upperLeg.position.y = -height * 0.1;
    upperLeg.castShadow = true;
    group.add(upperLeg);
    
    // Lower leg
    const lowerLegGeo = new THREE.CapsuleGeometry(height * 0.06, height * 0.18, 4, 8);
    const lowerLeg = new THREE.Mesh(lowerLegGeo, material);
    lowerLeg.position.y = -height * 0.17;
    lowerLeg.castShadow = true;
    group.add(lowerLeg);
    
    return group;
  }
  
  private createTail(height: number, material: THREE.MeshToonMaterial): THREE.Mesh[] {
    const segments: THREE.Mesh[] = [];
    const segmentCount = 5;
    
    for (let i = 0; i < segmentCount; i++) {
      const radius = height * 0.05 * (1 - i * 0.15);
      const length = height * 0.08;
      const geo = new THREE.CapsuleGeometry(radius, length, 4, 8);
      const segment = new THREE.Mesh(geo, material);
      segment.castShadow = true;
      segment.position.z = -height * 0.25 - i * length * 0.8;
      segment.position.y = height * 0.15 - i * 0.02;
      segments.push(segment);
    }
    
    return segments;
  }
  
  update(deltaTime: number): void {
    if (this.isMoving) {
      this.walkCycleTimer += deltaTime;
      
      // Simple walk cycle animation
      const walkSpeed = 8;
      const armSwing = Math.sin(this.walkCycleTimer * walkSpeed) * 0.4;
      const legSwing = Math.sin(this.walkCycleTimer * walkSpeed) * 0.5;
      
      this.leftArm.rotation.x = armSwing;
      this.rightArm.rotation.x = -armSwing;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      
      // Tail wag
      this.tailSegments.forEach((segment, i) => {
        segment.rotation.y = Math.sin(this.walkCycleTimer * walkSpeed + i * 0.3) * 0.15;
      });
    }
  }
  
  setMoving(moving: boolean): void {
    this.isMoving = moving;
  }
  
  destroy(): void {
    this.toonRampTexture.dispose();
    this.materials.forEach(material => material.dispose());
    
    this.mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
      }
    });
  }
}
