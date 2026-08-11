import * as THREE from 'three';
import { CHAO_BEHAVIOR, CHAO_STATS } from '../../constants';

/**
 * Simple procedural Chao model for MVP.
 * Uses basic geometries to represent the character without external assets.
 */
export class SimpleChaoModel {
  public mesh: THREE.Group;
  public body: THREE.Mesh;
  public head: THREE.Mesh;
  public eyes: THREE.Group;
  public mouth: THREE.Mesh;
  public arms: THREE.Group;
  public legs: THREE.Group;
  
  // Animation state
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private chompTimer: number = 0;
  private isChomping: boolean = false;
  private originalMouthScaleY: number = 1;

  constructor(color: number = 0x99ccff) {
    this.mesh = new THREE.Group();

    // Body (Capsule-like using scaled sphere/cylinder)
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const bodyMat = new THREE.MeshToonMaterial({ color });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.scale.set(1, 1.2, 0.8);
    this.body.position.y = 1.2;
    this.mesh.add(this.body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const headMat = new THREE.MeshToonMaterial({ color });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 2.4;
    this.mesh.add(this.head);

    // Eyes Group
    this.eyes = new THREE.Group();
    
    // Left Eye
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 2.5, 0.75);
    
    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.3, 2.5, 0.75);

    // Eyebrows (for emotion)
    const browGeo = new THREE.CapsuleGeometry(0.05, 0.3, 4, 8);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.3, 2.7, 0.7);
    leftBrow.rotation.z = 0.2;
    
    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.3, 2.7, 0.7);
    rightBrow.rotation.z = -0.2;

    this.eyes.add(leftEye, rightEye, leftBrow, rightBrow);
    this.mesh.add(this.eyes);

    // Mouth (Simple plane that scales for chomp)
    const mouthGeo = new THREE.PlaneGeometry(0.4, 0.1);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.mouth = new THREE.Mesh(mouthGeo, mouthMat);
    this.mouth.position.set(0, 2.2, 0.8);
    this.originalMouthScaleY = 1;
    this.mesh.add(this.mouth);

    // Arms
    this.arms = new THREE.Group();
    const limbGeo = new THREE.CapsuleGeometry(0.15, 0.6, 4, 8);
    const limbMat = new THREE.MeshToonMaterial({ color });
    
    const leftArm = new THREE.Mesh(limbGeo, limbMat);
    leftArm.position.set(-0.8, 1.5, 0);
    leftArm.rotation.z = 0.5;
    
    const rightArm = new THREE.Mesh(limbGeo, limbMat);
    rightArm.position.set(0.8, 1.5, 0);
    rightArm.rotation.z = -0.5;
    
    this.arms.add(leftArm, rightArm);
    this.mesh.add(this.arms);

    // Legs
    this.legs = new THREE.Group();
    const leftLeg = new THREE.Mesh(limbGeo, limbMat);
    leftLeg.position.set(-0.4, 0.3, 0);
    leftLeg.rotation.z = 0.2;
    
    const rightLeg = new THREE.Mesh(limbGeo, limbMat);
    rightLeg.position.set(0.4, 0.3, 0);
    rightLeg.rotation.z = -0.2;
    
    this.legs.add(leftLeg, rightLeg);
    this.mesh.add(this.legs);

    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.3 
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.mesh.add(shadow);
  }

  /**
   * Update animation states based on emotion and actions
   */
  public update(delta: number, emotion: 'happy' | 'sad' | 'neutral', isEating: boolean): void {
    // Blink logic
    this.blinkTimer += delta;
    if (!this.isBlinking && this.blinkTimer > 2 + Math.random() * 2) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      setTimeout(() => { this.isBlinking = false; }, 150);
    }

    // Apply blink
    const scaleY = this.isBlinking ? 0.1 : 1;
    this.eyes.children[0].scale.y = scaleY; // Left Eye
    this.eyes.children[1].scale.y = scaleY; // Right Eye

    // Emotion logic (Eyebrows)
    const leftBrow = this.eyes.children[2] as THREE.Mesh;
    const rightBrow = this.eyes.children[3] as THREE.Mesh;

    if (emotion === 'happy') {
      leftBrow.rotation.z = -0.2;
      rightBrow.rotation.z = 0.2;
      leftBrow.position.y = 2.6;
      rightBrow.position.y = 2.6;
    } else if (emotion === 'sad') {
      leftBrow.rotation.z = 0.4;
      rightBrow.rotation.z = -0.4;
      leftBrow.position.y = 2.5;
      rightBrow.position.y = 2.5;
    } else {
      // Neutral
      leftBrow.rotation.z = 0.2;
      rightBrow.rotation.z = -0.2;
      leftBrow.position.y = 2.7;
      rightBrow.position.y = 2.7;
    }

    // Eating/Chomping logic
    if (isEating) {
      this.chompTimer += delta * 10;
      const scale = 1 + Math.sin(this.chompTimer) * 0.5;
      this.mouth.scale.set(1, Math.max(0.1, scale), 1);
    } else {
      this.mouth.scale.set(1, this.originalMouthScaleY, 1);
    }
  }

  /**
   * Simple jump animation for pickup
   */
  public playPickupAnimation(time: number): void {
    this.mesh.position.y = Math.abs(Math.sin(time * 10)) * 0.5;
    this.mesh.rotation.z = Math.sin(time * 5) * 0.2;
  }

  public resetPosition(): void {
    this.mesh.position.y = 0;
    this.mesh.rotation.z = 0;
  }
}
