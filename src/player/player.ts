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
  private tailGroup: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;

  private spinTrail: THREE.Mesh;
  private energyBallMesh: THREE.Mesh;

  private walkCycleTimer: number = 0;
  private isGrounded: boolean = true;
  private stepSoundTimer: number = 0;

  public moveSpeed: number = 7.2; // Fast Sonic/Sonic Adventure hero speed!

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

    // Color Palette based on Neelo character art
    const furMat = new THREE.MeshToonMaterial({ color: 0x3b0764 }); // Deep purple panther fur
    const spotGoldMat = new THREE.MeshBasicMaterial({ color: 0xeab308 }); // Gold spots
    const spotCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Cyan spots
    const innerEarMat = new THREE.MeshToonMaterial({ color: 0x8b5cf6 }); // Light purple inner ear
    const muzzleMat = new THREE.MeshToonMaterial({ color: 0x2e1065 }); // Muzzle/snout
    const noseMat = new THREE.MeshToonMaterial({ color: 0xf43f5e }); // Pinkish feline nose
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White sharp fangs
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Golden/hazel hero eye
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 }); // Dark eye pupil
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Apparel - Cool Fitted T-Shirt
    const tShirtMat = new THREE.MeshToonMaterial({ color: 0x0284c7 }); // Vibrant teal/cyan T-shirt
    const neckMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 }); // T-shirt crewneck trim
    const shortsMat = new THREE.MeshToonMaterial({ color: 0x78350f }); // Brown shorts
    const shoeMat = new THREE.MeshToonMaterial({ color: 0x581c87 }); // Purple sneaker
    const soleMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc }); // White shoe soles

    // 1. Torso / Body (Fitted T-Shirt)
    const bodyGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.72, 20);
    this.bodyMesh = new THREE.Mesh(bodyGeo, tShirtMat);
    this.bodyMesh.position.y = 0.95;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // T-shirt Crewneck Collar Trim
    const neckGeo = new THREE.TorusGeometry(0.28, 0.045, 12, 24);
    neckGeo.rotateX(Math.PI / 2);
    const neckCollar = new THREE.Mesh(neckGeo, neckMat);
    neckCollar.position.set(0, 1.31, 0);
    this.mesh.add(neckCollar);

    // T-shirt Short Sleeves
    const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.19, 0.28, 16);
    const leftSleeve = new THREE.Mesh(sleeveGeo, tShirtMat);
    leftSleeve.position.set(-0.42, 1.15, 0);
    leftSleeve.rotation.z = -0.4;

    const rightSleeve = new THREE.Mesh(sleeveGeo, tShirtMat);
    rightSleeve.position.set(0.42, 1.15, 0);
    rightSleeve.rotation.z = 0.4;

    this.mesh.add(leftSleeve, rightSleeve);

    // Shorts
    const shortsGeo = new THREE.CylinderGeometry(0.46, 0.42, 0.35, 16);
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.set(0, 0.55, 0);
    this.mesh.add(shorts);

    // 2. Head Group (Neelo Panther Head)
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.48;

    // Head Base Sphere
    const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Panther Ear L & R
    const earOuterGeo = new THREE.SphereGeometry(0.18, 12, 12);
    earOuterGeo.scale(1.0, 1.2, 0.6);
    const earInnerGeo = new THREE.SphereGeometry(0.13, 12, 12);
    earInnerGeo.scale(0.8, 1.0, 0.5);

    const leftEar = new THREE.Mesh(earOuterGeo, furMat);
    leftEar.position.set(-0.36, 0.38, -0.05);
    leftEar.rotation.z = -0.3;
    const leftInnerEar = new THREE.Mesh(earInnerGeo, innerEarMat);
    leftInnerEar.position.set(-0.35, 0.38, 0.02);
    leftInnerEar.rotation.z = -0.3;

    const rightEar = new THREE.Mesh(earOuterGeo, furMat);
    rightEar.position.set(0.36, 0.38, -0.05);
    rightEar.rotation.z = 0.3;
    const rightInnerEar = new THREE.Mesh(earInnerGeo, innerEarMat);
    rightInnerEar.position.set(0.35, 0.38, 0.02);
    rightInnerEar.rotation.z = 0.3;

    this.headGroup.add(leftEar, leftInnerEar, rightEar, rightInnerEar);

    // Muzzle / Snout
    const muzzleGeo = new THREE.BoxGeometry(0.32, 0.22, 0.24);
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.set(0, -0.08, 0.36);

    // Feline Nose
    const noseGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.02, 0.48);

    // White Fangs
    const fangGeo = new THREE.ConeGeometry(0.035, 0.1, 8);
    fangGeo.rotateX(Math.PI);
    const leftFang = new THREE.Mesh(fangGeo, fangMat);
    leftFang.position.set(-0.09, -0.15, 0.46);
    const rightFang = new THREE.Mesh(fangGeo, fangMat);
    rightFang.position.set(0.09, -0.15, 0.46);

    this.headGroup.add(muzzle, nose, leftFang, rightFang);

    // Expressive Feline Eyes
    const eyeGeo = new THREE.SphereGeometry(0.11, 12, 12);
    eyeGeo.scale(1.1, 0.9, 0.4);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.17, 0.08, 0.38);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.17, 0.08, 0.38);

    const pupilGeo = new THREE.SphereGeometry(0.06, 8, 8);
    pupilGeo.scale(0.5, 1.1, 0.3); // Slit pupil
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.16, 0.08, 0.42);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.16, 0.08, 0.42);

    const glintGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    leftGlint.position.set(-0.14, 0.11, 0.44);
    const rightGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    rightGlint.position.set(0.18, 0.11, 0.44);

    this.headGroup.add(leftEye, rightEye, leftPupil, rightPupil, leftGlint, rightGlint);

    // Gold & Cyan Spots on forehead & shoulders
    const spotGeo = new THREE.SphereGeometry(0.04, 8, 8);
    spotGeo.scale(1.2, 0.8, 0.3);

    const spot1 = new THREE.Mesh(spotGeo, spotGoldMat);
    spot1.position.set(-0.18, 0.28, 0.38);
    const spot2 = new THREE.Mesh(spotGeo, spotCyanMat);
    spot2.position.set(0.14, 0.32, 0.37);
    const spot3 = new THREE.Mesh(spotGeo, spotGoldMat);
    spot3.position.set(0, 0.36, 0.38);

    this.headGroup.add(spot1, spot2, spot3);
    this.mesh.add(this.headGroup);

    // 3. Panther Curved Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.55, -0.38);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.1, -0.3),
      new THREE.Vector3(0.15, 0.1, -0.6),
      new THREE.Vector3(0.25, 0.35, -0.75)
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 12, 0.05, 8, false);
    const tailMesh = new THREE.Mesh(tailGeo, furMat);
    this.tailGroup.add(tailMesh);
    this.mesh.add(this.tailGroup);

    // 4. Arms & Purple Sneakers
    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 12);

    // Left Arm
    this.leftArm = new THREE.Group();
    const lArmMesh = new THREE.Mesh(armGeo, furMat);
    lArmMesh.position.y = -0.2;
    // Shoulder spot
    const lSpot = new THREE.Mesh(spotGeo, spotGoldMat);
    lSpot.position.set(-0.06, -0.1, 0);
    this.leftArm.add(lArmMesh, lSpot);
    this.leftArm.position.set(-0.48, 1.1, 0);
    this.mesh.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    const rArmMesh = new THREE.Mesh(armGeo, furMat);
    rArmMesh.position.y = -0.2;
    const rSpot = new THREE.Mesh(spotGeo, spotCyanMat);
    rSpot.position.set(0.06, -0.1, 0);
    this.rightArm.add(rArmMesh, rSpot);
    this.rightArm.position.set(0.48, 1.1, 0);
    this.mesh.add(this.rightArm);

    // Legs & Sneakers
    const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.4, 12);
    const shoeGeo = new THREE.BoxGeometry(0.24, 0.22, 0.42);
    const soleGeo = new THREE.BoxGeometry(0.26, 0.06, 0.44);

    // Left Leg
    this.leftLeg = new THREE.Group();
    const lLegMesh = new THREE.Mesh(legGeo, furMat);
    lLegMesh.position.y = -0.2;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(0, -0.32, 0.06);
    const lSole = new THREE.Mesh(soleGeo, soleMat);
    lSole.position.set(0, -0.42, 0.06);
    this.leftLeg.add(lLegMesh, lShoe, lSole);
    this.leftLeg.position.set(-0.22, 0.45, 0);
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    const rLegMesh = new THREE.Mesh(legGeo, furMat);
    rLegMesh.position.y = -0.2;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0, -0.32, 0.06);
    const rSole = new THREE.Mesh(soleGeo, soleMat);
    rSole.position.set(0, -0.42, 0.06);
    this.rightLeg.add(rLegMesh, rShoe, rSole);
    this.rightLeg.position.set(0.22, 0.45, 0);
    this.mesh.add(this.rightLeg);

    // 5. Spin Attack & Energy Projectile Aura
    const spinGeo = new THREE.TorusGeometry(0.9, 0.14, 16, 28);
    const spinMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0xa855f7,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0
    });
    this.spinTrail = new THREE.Mesh(spinGeo, spinMat);
    this.spinTrail.rotation.x = Math.PI / 2;
    this.spinTrail.position.y = 0.9;
    this.mesh.add(this.spinTrail);

    // Energy Ball Shield Mesh for Spin Dash / Energy Attack
    const eBallGeo = new THREE.SphereGeometry(0.85, 20, 20);
    const eBallMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x9333ea,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    this.energyBallMesh = new THREE.Mesh(eBallGeo, eBallMat);
    this.energyBallMesh.position.y = 0.9;
    this.mesh.add(this.energyBallMesh);
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

    // Tail Swish Animation
    const tailWiggle = Math.sin(Date.now() * 0.006) * 0.25;
    this.tailGroup.rotation.y = tailWiggle;

    // Handle Attack Spin & Energy Aura Animation
    if (this.isAttacking) {
      this.attackTimer -= deltaTime;
      this.mesh.rotation.y += deltaTime * 28; // High speed spin roll!
      const op = Math.sin((0.45 - this.attackTimer) / 0.45 * Math.PI);
      (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = op;
      (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = op * 0.85;
      this.energyBallMesh.rotation.y += deltaTime * 12;

      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = 0;
        (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = 0;
        this.mesh.rotation.y = this.rotationY;
      }
    }

    // Handle Petting Pose
    if (this.isPetting) {
      this.pettingTimer -= deltaTime;
      this.bodyMesh.rotation.x = 0.35;
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

        this.rotationY += angleDiff * Math.min(1, deltaTime * 14);
        this.mesh.rotation.y = this.rotationY;
      }

      const speed = this.isSwimming ? this.moveSpeed * 0.6 : this.moveSpeed;
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      this.walkCycleTimer += deltaTime * (this.isSwimming ? 6 : 14);

      if (!this.isSwimming) {
        this.stepSoundTimer += deltaTime;
        if (this.stepSoundTimer > 0.28) {
          sound.playStep();
          this.stepSoundTimer = 0;
        }
      }
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      this.walkCycleTimer = 0;
    }

    // Apply Velocity to Position with Collision Checks
    const nextX = this.position.x + this.velocity.x * deltaTime;
    const nextZ = this.position.z + this.velocity.z * deltaTime;

    // 1. World Boundary Perimeter Constraint (Island Radius Limit)
    const maxIslandRadius = 27.2;
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter > maxIslandRadius) {
      const angle = Math.atan2(nextZ, nextX);
      this.position.x = Math.cos(angle) * maxIslandRadius;
      this.position.z = Math.sin(angle) * maxIslandRadius;
    } else {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // 2. Obstacle Collision Resolution (Portal Shrine & Rocks)
    // Portal Shrine Collision at (0, -18)
    const distToPortal = Math.hypot(this.position.x - 0, this.position.z - (-18));
    if (distToPortal < 1.8) {
      const angle = Math.atan2(this.position.z - (-18), this.position.x - 0);
      this.position.x = Math.cos(angle) * 1.8;
      this.position.z = -18 + Math.sin(angle) * 1.8;
    }

    // Waterfall Cliff Solid Wall in Garden World (z < -13.5 and |x| < 6.5)
    if (this.position.z < -13.2 && Math.abs(this.position.x) < 6.5) {
      this.position.z = -13.2; // Block player from clipping through waterfall wall
    }

    // 3. Ground Height & Swimming Physics
    const groundHeight = getGroundHeight(this.position.x, this.position.z);

    if (this.isSwimming) {
      const waterSurfaceY = 0.25;
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterSurfaceY + Math.sin(Date.now() * 0.005) * 0.08, deltaTime * 5);
      this.velocity.y = 0;
      this.isGrounded = true;

      if (doJump) {
        this.velocity.y = 7.5;
        this.isGrounded = false;
        // Light jump hop out of water
        sound.playStep();
      }
    } else {
      if (doJump && this.isGrounded) {
        this.velocity.y = 9.0;
        this.isGrounded = false;
        sound.playStep();
      }

      this.velocity.y -= 23.0 * deltaTime;
      this.position.y += this.velocity.y * deltaTime;

      if (this.position.y <= groundHeight) {
        this.position.y = groundHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.mesh.position.copy(this.position);

    // Carried Chao Position Update
    if (this.isCarrying && this.carriedCreature) {
      this.carriedCreature.position.set(this.position.x, this.position.y + 1.8, this.position.z);
      this.carriedCreature.mesh.position.copy(this.carriedCreature.position);
    }

    // Limb Animations
    if (this.isCarrying) {
      this.leftArm.rotation.x = -Math.PI * 0.85;
      this.leftArm.rotation.z = -0.2;
      this.rightArm.rotation.x = -Math.PI * 0.85;
      this.rightArm.rotation.z = 0.2;
    } else if (this.isSwimming) {
      const swimPaddle = Math.sin(this.walkCycleTimer) * 0.8;
      this.leftArm.rotation.x = -Math.PI / 2 + swimPaddle;
      this.rightArm.rotation.x = -Math.PI / 2 - swimPaddle;
      this.leftLeg.rotation.x = 0.8 + swimPaddle * 0.3;
      this.rightLeg.rotation.x = 0.8 - swimPaddle * 0.3;
    } else if (isMoving) {
      const swing = Math.sin(this.walkCycleTimer) * 0.8;
      this.leftArm.rotation.x = swing;
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.x = -swing;
      this.rightArm.rotation.z = 0;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
    } else {
      const idleBob = Math.sin(Date.now() * 0.004) * 0.04;
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.z = 0;
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.headGroup.position.y = 1.48 + idleBob;
    }
  }
}

