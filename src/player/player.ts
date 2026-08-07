import * as THREE from 'three';
import { InputVector } from '../engine/input';
import { ThirdPersonCamera } from '../engine/camera';
import { sound } from '../systems/audio';

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;

  private headGroup: THREE.Group;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;

  private walkCycleTimer: number = 0;
  private isGrounded: boolean = true;
  private stepSoundTimer: number = 0;

  public moveSpeed: number = 6.0;

  constructor() {
    this.mesh = new THREE.Group();

    // Material setup (Cute explorer aesthetic)
    const shirtMat = new THREE.MeshToonMaterial({ color: 0x0284c7 }); // Bright sky blue shirt
    const pantsMat = new THREE.MeshToonMaterial({ color: 0x334155 }); // Dark slate pants
    const skinMat = new THREE.MeshToonMaterial({ color: 0xffdbac }); // Warm skin
    const hairMat = new THREE.MeshToonMaterial({ color: 0x78350f }); // Brown hair / cap
    const backpackMat = new THREE.MeshToonMaterial({ color: 0xd97706 }); // Orange backpack

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.7, 0.35);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Backpack
    const backpackGeo = new THREE.BoxGeometry(0.35, 0.45, 0.2);
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 0.85, -0.25);
    backpack.castShadow = true;
    this.mesh.add(backpack);

    // Head
    this.headGroup = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Hair Cap
    const capGeo = new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const cap = new THREE.Mesh(capGeo, hairMat);
    cap.position.y = 0.02;
    this.headGroup.add(cap);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.04, 0.25);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.04, 0.25);

    this.headGroup.add(leftEye, rightEye);
    this.headGroup.position.y = 1.4;
    this.mesh.add(this.headGroup);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.4, 8, 8);

    this.leftArm = new THREE.Mesh(armGeo, skinMat);
    this.leftArm.position.set(-0.35, 0.8, 0);
    this.leftArm.castShadow = true;

    this.rightArm = new THREE.Mesh(armGeo, skinMat);
    this.rightArm.position.set(0.35, 0.8, 0);
    this.rightArm.castShadow = true;

    this.mesh.add(this.leftArm, this.rightArm);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.09, 0.45, 8, 8);

    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.15, 0.3, 0);
    this.leftLeg.castShadow = true;

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.15, 0.3, 0);
    this.rightLeg.castShadow = true;

    this.mesh.add(this.leftLeg, this.rightLeg);
  }

  public update(
    inputVec: InputVector,
    camera: ThirdPersonCamera,
    deltaTime: number,
    getGroundHeight: (x: number, z: number) => number,
    doJump: boolean
  ) {
    const forward = camera.getForwardVector();
    const right = camera.getRightVector();

    // Movement direction vector relative to camera yaw
    const moveDir = new THREE.Vector3()
      .addScaledVector(right, inputVec.x)
      .addScaledVector(forward, -inputVec.y);

    const isMoving = moveDir.lengthSq() > 0.01;

    if (isMoving) {
      moveDir.normalize();

      // Smooth rotation towards movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      // Shortest angle interpolation
      let angleDiff = targetAngle - this.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.rotationY += angleDiff * Math.min(1, deltaTime * 12);
      this.mesh.rotation.y = this.rotationY;

      // Apply horizontal movement
      this.velocity.x = moveDir.x * this.moveSpeed;
      this.velocity.z = moveDir.z * this.moveSpeed;

      // Walk cycle timer
      this.walkCycleTimer += deltaTime * 10;

      // Step audio sound
      this.stepSoundTimer += deltaTime;
      if (this.stepSoundTimer > 0.35) {
        sound.playStep();
        this.stepSoundTimer = 0;
      }
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      this.walkCycleTimer = 0;
    }

    // Jump / Gravity physics
    const groundHeight = getGroundHeight(this.position.x, this.position.z);

    if (doJump && this.isGrounded) {
      this.velocity.y = 8.0;
      this.isGrounded = false;
      sound.playStep();
    }

    // Apply Gravity
    this.velocity.y -= 22.0 * deltaTime;
    this.position.addScaledVector(this.velocity, deltaTime);

    // Ground collision
    if (this.position.y <= groundHeight) {
      this.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.mesh.position.copy(this.position);

    // Animate limbs
    if (isMoving) {
      const swing = Math.sin(this.walkCycleTimer) * 0.6;
      this.leftArm.rotation.x = swing;
      this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
    } else {
      // Idle animation
      const idleBob = Math.sin(Date.now() * 0.003) * 0.05;
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.headGroup.position.y = 1.4 + idleBob;
    }
  }
}
