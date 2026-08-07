import * as THREE from 'three';
import { InputVector } from '../engine/input';
import { ThirdPersonCamera } from '../engine/camera';
import { sound } from '../systems/audio';
import { SolanderCreature } from '../creatures/solander';

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;

  private headGroup: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;

  private spinTrail: THREE.Mesh;

  private walkCycleTimer: number = 0;
  private isGrounded: boolean = true;
  private stepSoundTimer: number = 0;

  public moveSpeed: number = 6.5;

  // Actions / States
  public isAttacking: boolean = false;
  public attackTimer: number = 0;

  public isCarrying: boolean = false;
  public carriedCreature: SolanderCreature | null = null;

  public isPetting: boolean = false;
  public pettingTimer: number = 0;

  public isSwimming: boolean = false;

  constructor() {
    this.mesh = new THREE.Group();

    // Materials - Vibrant mascot colors (Sky Blue & Coral Pink accents, Crisp White gloves/chest)
    const skinMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 }); // Sky blue Kirby-style hero body
    const chestMat = new THREE.MeshToonMaterial({ color: 0xfff1f2 }); // Soft white tummy
    const gloveMat = new THREE.MeshToonMaterial({ color: 0xffffff }); // White cartoon gloves
    const shoeMat = new THREE.MeshToonMaterial({ color: 0xf43f5e }); // Bright red/coral running boots
    const earSpikeMat = new THREE.MeshToonMaterial({ color: 0xfacc15 }); // Golden crest/ear spikes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a }); // Deep dark eye pupils
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Main Round Torso / Body (Tall Kirby / Mascot proportions)
    const bodyGeo = new THREE.SphereGeometry(0.55, 24, 24);
    bodyGeo.scale(0.9, 1.25, 0.9); // Tall round mascot shape
    this.bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
    this.bodyMesh.position.y = 0.95;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Tummy patch
    const tummyGeo = new THREE.SphereGeometry(0.38, 16, 16);
    tummyGeo.scale(0.8, 1.0, 0.5);
    const tummy = new THREE.Mesh(tummyGeo, chestMat);
    tummy.position.set(0, 0.92, 0.28);
    this.mesh.add(tummy);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.45;

    // Head Sphere
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Cute Mascot Ears / Spikes (Sonic/Kirby hybrid crest)
    const spikeGeo = new THREE.ConeGeometry(0.18, 0.5, 12);
    spikeGeo.rotateX(-0.4);

    const leftSpike = new THREE.Mesh(spikeGeo, earSpikeMat);
    leftSpike.position.set(-0.28, 0.35, -0.15);
    leftSpike.rotation.z = -0.35;

    const rightSpike = new THREE.Mesh(spikeGeo, earSpikeMat);
    rightSpike.position.set(0.28, 0.35, -0.15);
    rightSpike.rotation.z = 0.35;

    const centerSpike = new THREE.Mesh(spikeGeo, earSpikeMat);
    centerSpike.position.set(0, 0.45, -0.2);
    centerSpike.rotation.x = -0.3;

    this.headGroup.add(leftSpike, rightSpike, centerSpike);

    // Expressive Large Eyes
    const eyeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    eyeGeo.scale(0.65, 1.2, 0.4);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 0.06, 0.4);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.16, 0.06, 0.4);

    // Eye Glints
    const glintGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    leftGlint.position.set(-0.14, 0.1, 0.44);

    const rightGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    rightGlint.position.set(0.18, 0.1, 0.44);

    // Cheerful Smile Line
    const mouthGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.rotation.x = Math.PI;
    mouth.position.set(0, -0.12, 0.42);

    this.headGroup.add(leftEye, rightEye, leftGlint, rightGlint, mouth);
    this.mesh.add(this.headGroup);

    // 3. Cartoon Arms with White Gloves
    const armArmatureGeo = new THREE.SphereGeometry(0.12, 12, 12);
    armArmatureGeo.scale(0.8, 1.8, 0.8);
    const gloveGeo = new THREE.SphereGeometry(0.16, 12, 12);

    // Left Arm
    this.leftArm = new THREE.Group();
    const lArmMesh = new THREE.Mesh(armArmatureGeo, skinMat);
    lArmMesh.position.y = -0.15;
    const lGlove = new THREE.Mesh(gloveGeo, gloveMat);
    lGlove.position.y = -0.32;
    this.leftArm.add(lArmMesh, lGlove);
    this.leftArm.position.set(-0.48, 1.05, 0);
    this.mesh.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    const rArmMesh = new THREE.Mesh(armArmatureGeo, skinMat);
    rArmMesh.position.y = -0.15;
    const rGlove = new THREE.Mesh(gloveGeo, gloveMat);
    rGlove.position.y = -0.32;
    this.rightArm.add(rArmMesh, rGlove);
    this.rightArm.position.set(0.48, 1.05, 0);
    this.mesh.add(this.rightArm);

    // 4. Legs with Big Mascot Running Boots
    const legArmatureGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.3, 12);
    const shoeGeo = new THREE.SphereGeometry(0.22, 16, 16);
    shoeGeo.scale(0.9, 0.75, 1.4); // Chunky cartoon shoe

    // Left Leg
    this.leftLeg = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legArmatureGeo, skinMat);
    lLegMesh.position.y = -0.15;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.28, 0.08);
    lShoe.castShadow = true;
    this.leftLeg.add(lLegMesh, lShoe);
    this.leftLeg.position.set(-0.22, 0.35, 0);
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legArmatureGeo, skinMat);
    rLegMesh.position.y = -0.15;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.28, 0.08);
    rShoe.castShadow = true;
    this.rightLeg.add(rLegMesh, rShoe);
    this.rightLeg.position.set(0.22, 0.35, 0);
    this.mesh.add(this.rightLeg);

    // 5. Spin Attack Aura / Energy Trail
    const spinGeo = new THREE.TorusGeometry(0.85, 0.12, 12, 24);
    const spinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0
    });
    this.spinTrail = new THREE.Mesh(spinGeo, spinMat);
    this.spinTrail.rotation.x = Math.PI / 2;
    this.spinTrail.position.y = 0.9;
    this.mesh.add(this.spinTrail);
  }

  public triggerAttack(): boolean {
    if (this.isAttacking) return false;
    this.isAttacking = true;
    this.attackTimer = 0.45;
    sound.playSpinAttackSound();
    return true;
  }

  public startPetting() {
    this.isPetting = true;
    this.pettingTimer = 1.2;
  }

  public update(
    inputVec: InputVector,
    camera: ThirdPersonCamera,
    deltaTime: number,
    getGroundHeight: (x: number, z: number) => number,
    doJump: boolean,
    isInWater: boolean = false
  ) {
    this.isSwimming = isInWater;

    // Handle Attack Spin Animation
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;
      this.mesh.rotation.y += deltaTime * 25; // High speed spin roll!
      (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = Math.sin((0.45 - this.attackTimer) / 0.45 * Math.PI);
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = 0;
        this.mesh.rotation.y = this.rotationY;
      }
    }

    // Handle Petting Pose
    if (this.isPetting) {
      this.pettingTimer -= deltaTime;
      this.bodyMesh.rotation.x = 0.35; // Bending down towards Chao
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.2;
      if (this.pettingTimer <= 0) {
        this.isPetting = false;
        this.bodyMesh.rotation.x = 0;
      }
      return;
    }

    const forward = camera.getForwardVector();
    const right = camera.getRightVector();

    const moveDir = new THREE.Vector3()
      .addScaledVector(right, inputVec.x)
      .addScaledVector(forward, -inputVec.y);

    const isMoving = moveDir.lengthSq() > 0.01;

    if (isMoving) {
      moveDir.normalize();

      if (!this.isAttacking) {
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let angleDiff = targetAngle - this.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.rotationY += angleDiff * Math.min(1, deltaTime * 12);
        this.mesh.rotation.y = this.rotationY;
      }

      const speed = this.isSwimming ? this.moveSpeed * 0.6 : this.moveSpeed;
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      this.walkCycleTimer += deltaTime * (this.isSwimming ? 6 : 12);

      if (!this.isSwimming) {
        this.stepSoundTimer += deltaTime;
        if (this.stepSoundTimer > 0.32) {
          sound.playStep();
          this.stepSoundTimer = 0;
        }
      }
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      this.walkCycleTimer = 0;
    }

    // Ground Height & Water Level Physics
    const groundHeight = getGroundHeight(this.position.x, this.position.z);

    if (this.isSwimming) {
      // Water Floating physics
      const waterSurfaceY = 0.25;
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterSurfaceY + Math.sin(Date.now() * 0.005) * 0.08, deltaTime * 5);
      this.velocity.y = 0;
      this.isGrounded = true;

      if (doJump) {
        // Water hop out of pool!
        this.velocity.y = 7.0;
        this.isGrounded = false;
        sound.playSplash();
      }
    } else {
      // Regular Gravity / Jump
      if (doJump && this.isGrounded) {
        this.velocity.y = 8.5;
        this.isGrounded = false;
        sound.playStep();
      }

      this.velocity.y -= 22.0 * deltaTime;
      this.position.addScaledVector(this.velocity, deltaTime);

      if (this.position.y <= groundHeight) {
        this.position.y = groundHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.mesh.position.copy(this.position);

    // Carried Chao Position Update (holds carried Chao above player arms!)
    if (this.isCarrying && this.carriedCreature) {
      this.carriedCreature.position.set(this.position.x, this.position.y + 1.8, this.position.z);
      this.carriedCreature.mesh.position.copy(this.carriedCreature.position);
    }

    // Limb Animations
    if (this.isCarrying) {
      // Arms raised high holding Chao overhead!
      this.leftArm.rotation.x = -Math.PI * 0.85;
      this.leftArm.rotation.z = -0.2;
      this.rightArm.rotation.x = -Math.PI * 0.85;
      this.rightArm.rotation.z = 0.2;
    } else if (this.isSwimming) {
      // Swimming Paddle Arms & Floating Feet
      const swimPaddle = Math.sin(this.walkCycleTimer) * 0.8;
      this.leftArm.rotation.x = -Math.PI / 2 + swimPaddle;
      this.rightArm.rotation.x = -Math.PI / 2 - swimPaddle;
      this.leftLeg.rotation.x = 0.8 + swimPaddle * 0.3;
      this.rightLeg.rotation.x = 0.8 - swimPaddle * 0.3;
    } else if (isMoving) {
      // Dynamic Mascot Running Cycle
      const swing = Math.sin(this.walkCycleTimer) * 0.7;
      this.leftArm.rotation.x = swing;
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.x = -swing;
      this.rightArm.rotation.z = 0;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
    } else {
      // Idle Breathing / Bobbing
      const idleBob = Math.sin(Date.now() * 0.004) * 0.04;
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.z = 0;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.headGroup.position.y = 1.45 + idleBob;
    }
  }
}
