import * as THREE from 'three';
import { InputVector, InputManager } from '../engine/input';
import { ThirdPersonCamera } from '../engine/camera';
import { sound } from '../systems/audio';
import { SolanderCreature } from '../creatures/solander';
import { SolanderLaserGun } from '../combat/weapons';

export type PlayerState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'SPRINT'
  | 'JUMP'
  | 'FALL'
  | 'LAND'
  | 'ROLL'
  | 'DASH'
  | 'MELEE_COMBO'
  | 'LASER_ATTACK';

export class Player {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public currentState: PlayerState = 'IDLE';

  // Body Parts & Mesh Hierarchy
  private headGroup: THREE.Group;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private vestGroup: THREE.Group;
  private tailSegments: THREE.Mesh[] = [];
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftForearm: THREE.Group;
  private rightForearm: THREE.Group;
  private leftHandSocket: THREE.Group;
  private rightHandSocket: THREE.Group;
  private holsterSocket: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftShin: THREE.Group;
  private rightShin: THREE.Group;

  // Facial Expressions
  private leftEyebrow: THREE.Mesh;
  private rightEyebrow: THREE.Mesh;

  // Weapon & Combat
  public laserGun: SolanderLaserGun;
  public comboStep: number = 0; // 1, 2, 3, 4
  public comboTimer: number = 0;
  public comboWindowTimer: number = 0;
  public isMeleeAttacking: boolean = false;
  private slashArcMesh: THREE.Mesh;

  // Roll & Dash
  public isRolling: boolean = false;
  public rollTimer: number = 0;
  public spinTrail: THREE.Mesh;
  public energyBallMesh: THREE.Mesh;

  // Carrying & Petting
  public isCarrying: boolean = false;
  public carriedCreature: SolanderCreature | null = null;
  public isPetting: boolean = false;
  public pettingTimer: number = 0;
  public isSwimming: boolean = false;

  // SA2 & Sonic Universe Agility Physics Parameters
  public currentHorizontalSpeed: number = 0;
  public targetHorizontalSpeed: number = 0;
  public isGrounded: boolean = true;
  public canAirDash: boolean = true;
  public isAirDashing: boolean = false;
  public airDashTimer: number = 0;
  private walkCycleTimer: number = 0;
  private stepSoundTimer: number = 0;
  private squashStretch: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  // Dust Particle System
  private dustParticles!: THREE.Points;
  private dustGeo!: THREE.BufferGeometry;
  private dustPositions!: Float32Array;
  private dustVelocities: THREE.Vector3[] = [];

  constructor() {
    this.mesh = new THREE.Group();

    // High Definition Palette & Cel-Shaded Materials
    const furMat = new THREE.MeshToonMaterial({ color: 0x3b0764 }); // Deep purple cosmic panther fur
    const spotGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8
    }); // Glowing gold spots
    const spotCyanMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8
    }); // Glowing cyan spots

    const innerEarMat = new THREE.MeshToonMaterial({ color: 0xc084fc }); // Light lavender inner ear
    const muzzleMat = new THREE.MeshToonMaterial({ color: 0x581c87 }); // Soft purple feline muzzle
    const noseMat = new THREE.MeshToonMaterial({ color: 0xf43f5e }); // Pink feline nose
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Sharp white fangs
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5
    }); // Glowing hero eyes
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a }); // Deep pupil
    const eyeGlintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Neelo's Explorer Outfit Materials
    const vestMat = new THREE.MeshToonMaterial({ color: 0x0284c7 }); // Explorer cyan-blue vest
    const vestDarkMat = new THREE.MeshToonMaterial({ color: 0x0369a1 }); // Pocket flaps & lining
    const goldTrimMat = new THREE.MeshToonMaterial({ color: 0xfacc15 }); // Zipper, buttons, buckles
    const shortsMat = new THREE.MeshToonMaterial({ color: 0x78350f }); // Brown adventurer shorts
    const beltMat = new THREE.MeshToonMaterial({ color: 0x451a03 }); // Dark leather belt & pouches
    const armorPadMat = new THREE.MeshToonMaterial({ color: 0x475569 }); // Knee armor plates
    const armorTrimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6
    }); // Cyan armor edge trim
    const gloveMat = new THREE.MeshToonMaterial({ color: 0x1e293b }); // Tactical wrist cuffs / gloves
    const shoeMat = new THREE.MeshToonMaterial({ color: 0x4c1d95 }); // Purple explorer boots
    const shoeCollarMat = new THREE.MeshToonMaterial({ color: 0x06b6d4 }); // Cyan boot top collar
    const soleMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc }); // Thick white boot soles

    // ==========================================
    // 1. ORGANIC SMOOTH TORSO & EXPLORER VEST
    // ==========================================
    const torsoGroup = new THREE.Group();

    // Upper Torso / Chest (Smooth organic capsule, no flat cylinders!)
    const chestGeo = new THREE.CapsuleGeometry(0.36, 0.42, 16, 24);
    this.bodyMesh = new THREE.Mesh(chestGeo, furMat);
    this.bodyMesh.position.y = 0.95;
    this.bodyMesh.castShadow = true;
    torsoGroup.add(this.bodyMesh);

    // Explorer Vest Layer (Contoured smooth capsule wrap)
    this.vestGroup = new THREE.Group();
    const vestMainGeo = new THREE.CapsuleGeometry(0.39, 0.38, 16, 24);
    const vestMain = new THREE.Mesh(vestMainGeo, vestMat);
    vestMain.position.y = 0.96;
    vestMain.castShadow = true;
    this.vestGroup.add(vestMain);

    // Vest High Collar
    const collarGeo = new THREE.TorusGeometry(0.34, 0.07, 16, 24, Math.PI * 1.2);
    const collar = new THREE.Mesh(collarGeo, vestMat);
    collar.position.set(0, 1.24, -0.02);
    collar.rotation.x = Math.PI / 2;
    this.vestGroup.add(collar);

    // Vest Gold Zipper & Rails (3D rounded capsule rail)
    const zipGeo = new THREE.CapsuleGeometry(0.025, 0.48, 8, 12);
    const zip = new THREE.Mesh(zipGeo, goldTrimMat);
    zip.position.set(0, 0.96, 0.4);
    this.vestGroup.add(zip);

    // Dual Front Pockets (Rounded 3D Pockets)
    const pocketGeo = new THREE.CapsuleGeometry(0.07, 0.08, 8, 12);
    const leftPocket = new THREE.Mesh(pocketGeo, vestDarkMat);
    leftPocket.position.set(-0.2, 0.88, 0.38);
    const rightPocket = new THREE.Mesh(pocketGeo, vestDarkMat);
    rightPocket.position.set(0.2, 0.88, 0.38);

    const pocketButtonGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const leftBtn = new THREE.Mesh(pocketButtonGeo, goldTrimMat);
    leftBtn.position.set(-0.2, 0.94, 0.42);
    const rightBtn = new THREE.Mesh(pocketButtonGeo, goldTrimMat);
    rightBtn.position.set(0.2, 0.94, 0.42);

    this.vestGroup.add(leftPocket, rightPocket, leftBtn, rightBtn);

    // Soft Shoulder Epaulets
    const epauletGeo = new THREE.CapsuleGeometry(0.06, 0.14, 8, 12);
    const leftEp = new THREE.Mesh(epauletGeo, vestDarkMat);
    leftEp.position.set(-0.38, 1.22, 0);
    leftEp.rotation.z = Math.PI / 2;
    const rightEp = new THREE.Mesh(epauletGeo, vestDarkMat);
    rightEp.position.set(0.38, 1.22, 0);
    rightEp.rotation.z = Math.PI / 2;
    this.vestGroup.add(leftEp, rightEp);

    torsoGroup.add(this.vestGroup);

    // Brown Cargo Shorts & Tactical Utility Belt (Smooth organic hips & waist)
    const shortsGeo = new THREE.CapsuleGeometry(0.37, 0.24, 16, 24);
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.set(0, 0.54, 0);

    const beltGeo = new THREE.TorusGeometry(0.38, 0.045, 12, 24);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.68, 0);
    belt.rotation.x = Math.PI / 2;

    const buckleGeo = new THREE.SphereGeometry(0.06, 12, 12);
    buckleGeo.scale(1.2, 0.8, 0.5);
    const buckle = new THREE.Mesh(buckleGeo, goldTrimMat);
    buckle.position.set(0, 0.68, 0.41);

    // Side Hip Pouches
    const pouchGeo = new THREE.CapsuleGeometry(0.06, 0.1, 8, 12);
    const leftPouch = new THREE.Mesh(pouchGeo, beltMat);
    leftPouch.position.set(-0.38, 0.62, 0);
    const rightPouch = new THREE.Mesh(pouchGeo, beltMat);
    rightPouch.position.set(0.38, 0.62, 0);

    torsoGroup.add(shorts, belt, buckle, leftPouch, rightPouch);
    this.mesh.add(torsoGroup);

    // ==========================================
    // 2. NEELO PANTHER HEAD & FACE DETAILS
    // ==========================================
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.48;

    // Smooth Feline Head Mesh
    const headGeo = new THREE.SphereGeometry(0.46, 32, 32);
    headGeo.scale(1.05, 0.95, 1.0);
    this.headMesh = new THREE.Mesh(headGeo, furMat);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Sleek Tapered Pointed Panther Ears (Sonic-Universe Feline Style)
    const earOuterGeo = new THREE.ConeGeometry(0.18, 0.54, 16);
    earOuterGeo.rotateX(-Math.PI / 8); // Tilted backwards
    const earInnerGeo = new THREE.ConeGeometry(0.13, 0.48, 16);
    earInnerGeo.rotateX(-Math.PI / 8);

    const leftEar = new THREE.Mesh(earOuterGeo, furMat);
    leftEar.position.set(-0.32, 0.48, -0.05);
    leftEar.rotation.z = -0.42;
    leftEar.rotation.y = 0.2;

    const leftInnerEar = new THREE.Mesh(earInnerGeo, innerEarMat);
    leftInnerEar.position.set(-0.31, 0.48, 0.02);
    leftInnerEar.rotation.z = -0.42;
    leftInnerEar.rotation.y = 0.2;

    const rightEar = new THREE.Mesh(earOuterGeo, furMat);
    rightEar.position.set(0.32, 0.48, -0.05);
    rightEar.rotation.z = 0.42;
    rightEar.rotation.y = -0.2;

    const rightInnerEar = new THREE.Mesh(earInnerGeo, innerEarMat);
    rightInnerEar.position.set(0.31, 0.48, 0.02);
    rightInnerEar.rotation.z = 0.42;
    rightInnerEar.rotation.y = -0.2;

    // Gold Star Spot on Ear Tips
    const earTipGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const lEarTip = new THREE.Mesh(earTipGeo, spotGoldMat);
    lEarTip.position.set(-0.44, 0.72, -0.12);
    const rEarTip = new THREE.Mesh(earTipGeo, spotCyanMat);
    rEarTip.position.set(0.44, 0.72, -0.12);

    this.headGroup.add(leftEar, leftInnerEar, rightEar, rightInnerEar, lEarTip, rEarTip);

    // Smooth Muzzle / Snout & Feline Nose
    const muzzleGeo = new THREE.SphereGeometry(0.2, 20, 20);
    muzzleGeo.scale(1.2, 0.85, 0.9);
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.set(0, -0.08, 0.34);

    const noseGeo = new THREE.SphereGeometry(0.065, 12, 12);
    noseGeo.scale(1.2, 0.8, 0.8);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.01, 0.46);

    const fangGeo = new THREE.ConeGeometry(0.03, 0.09, 12);
    fangGeo.rotateX(Math.PI);
    const leftFang = new THREE.Mesh(fangGeo, fangMat);
    leftFang.position.set(-0.09, -0.16, 0.44);
    const rightFang = new THREE.Mesh(fangGeo, fangMat);
    rightFang.position.set(0.09, -0.16, 0.44);

    this.headGroup.add(muzzle, nose, leftFang, rightFang);

    // Expressive Hero Eyes with Iris & Pupil
    const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    eyeGeo.scale(1.1, 0.95, 0.35);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.18, 0.08, 0.38);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.18, 0.08, 0.38);

    const pupilGeo = new THREE.SphereGeometry(0.065, 12, 12);
    pupilGeo.scale(0.5, 1.1, 0.3);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.17, 0.08, 0.42);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.17, 0.08, 0.42);

    const glintGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    leftGlint.position.set(-0.14, 0.11, 0.44);
    const rightGlint = new THREE.Mesh(glintGeo, eyeGlintMat);
    rightGlint.position.set(0.19, 0.11, 0.44);

    // Eyebrows / Eyelids for Expressions
    const eyebrowGeo = new THREE.CapsuleGeometry(0.02, 0.12, 8, 8);
    this.leftEyebrow = new THREE.Mesh(eyebrowGeo, furMat);
    this.leftEyebrow.position.set(-0.18, 0.22, 0.41);
    this.leftEyebrow.rotation.z = Math.PI / 2 + 0.1;

    this.rightEyebrow = new THREE.Mesh(eyebrowGeo, furMat);
    this.rightEyebrow.position.set(0.18, 0.22, 0.41);
    this.rightEyebrow.rotation.z = Math.PI / 2 - 0.1;

    this.headGroup.add(leftEye, rightEye, leftPupil, rightPupil, leftGlint, rightGlint, this.leftEyebrow, this.rightEyebrow);

    // Star Constellation Spots on Forehead & Cheeks
    const spotGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const spot1 = new THREE.Mesh(spotGeo, spotGoldMat);
    spot1.position.set(-0.18, 0.28, 0.38);
    const spot2 = new THREE.Mesh(spotGeo, spotCyanMat);
    spot2.position.set(0.14, 0.32, 0.37);
    const spot3 = new THREE.Mesh(spotGeo, spotGoldMat);
    spot3.position.set(0, 0.36, 0.38);
    const spot4 = new THREE.Mesh(spotGeo, spotCyanMat);
    spot4.position.set(-0.28, -0.02, 0.34);
    const spot5 = new THREE.Mesh(spotGeo, spotGoldMat);
    spot5.position.set(0.28, -0.02, 0.34);

    this.headGroup.add(spot1, spot2, spot3, spot4, spot5);
    this.mesh.add(this.headGroup);

    // ==========================================
    // 3. ARTICULATED CURVING PANTHER TAIL
    // ==========================================
    const tailBase = new THREE.Group();
    tailBase.position.set(0, 0.55, -0.38);

    let parentJoint: THREE.Group = tailBase;
    const numTailSegments = 5;
    for (let i = 0; i < numTailSegments; i++) {
      const joint = new THREE.Group();
      joint.position.set(0, 0, -0.18);

      const segRadius = 0.05 - i * 0.006;
      const segGeo = new THREE.CapsuleGeometry(segRadius, 0.14, 8, 12);
      segGeo.rotateX(Math.PI / 2);

      // Tip gets cyan galaxy glow!
      const segMat = i === numTailSegments - 1 ? spotCyanMat : furMat;
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.position.set(0, 0, -0.1);

      joint.add(segMesh);
      parentJoint.add(joint);
      parentJoint = joint;
      this.tailSegments.push(segMesh);
    }
    this.mesh.add(tailBase);

    // ==========================================
    // 4. OVERSIZED HERO PAWS & WRIST CUFFS (Sonic Proportion)
    // ==========================================
    const upperArmGeo = new THREE.CapsuleGeometry(0.08, 0.22, 12, 12);
    const forearmGeo = new THREE.CapsuleGeometry(0.075, 0.22, 12, 12);
    const gloveGeo = new THREE.TorusGeometry(0.12, 0.04, 16, 24);

    // Oversized Hero Paw Geometry with Finger Pads
    const pawGeo = new THREE.SphereGeometry(0.18, 20, 20);
    pawGeo.scale(1.1, 0.95, 1.2);
    const padGeo = new THREE.SphereGeometry(0.045, 12, 12);
    padGeo.scale(1.0, 0.8, 0.5);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.44, 1.15, 0);
    const lUpper = new THREE.Mesh(upperArmGeo, furMat);
    lUpper.position.y = -0.14;

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.set(0, -0.28, 0);
    const lLower = new THREE.Mesh(forearmGeo, furMat);
    lLower.position.y = -0.14;
    const lGlove = new THREE.Mesh(gloveGeo, gloveMat);
    lGlove.position.y = -0.22;
    lGlove.rotation.x = Math.PI / 2;

    const lPawGroup = new THREE.Group();
    const lPawMesh = new THREE.Mesh(pawGeo, furMat);
    lPawGroup.add(lPawMesh);
    // Paw Finger Pads
    for (let p = 0; p < 3; p++) {
      const pad = new THREE.Mesh(padGeo, spotCyanMat);
      pad.position.set((p - 1) * 0.08, -0.12, 0.12);
      lPawGroup.add(pad);
    }
    const lThumb = new THREE.Mesh(padGeo, spotGoldMat);
    lThumb.position.set(0.12, -0.06, 0.08);
    lPawGroup.add(lThumb);
    lPawGroup.position.y = -0.34;

    this.leftHandSocket = new THREE.Group();
    this.leftHandSocket.position.set(0, -0.34, 0);

    this.leftForearm.add(lLower, lGlove, lPawGroup, this.leftHandSocket);
    this.leftArm.add(lUpper, this.leftForearm);
    this.mesh.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.44, 1.15, 0);
    const rUpper = new THREE.Mesh(upperArmGeo, furMat);
    rUpper.position.y = -0.14;

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.set(0, -0.28, 0);
    const rLower = new THREE.Mesh(forearmGeo, furMat);
    rLower.position.y = -0.14;
    const rGlove = new THREE.Mesh(gloveGeo, gloveMat);
    rGlove.position.y = -0.22;
    rGlove.rotation.x = Math.PI / 2;

    const rPawGroup = new THREE.Group();
    const rPawMesh = new THREE.Mesh(pawGeo, furMat);
    rPawGroup.add(rPawMesh);
    for (let p = 0; p < 3; p++) {
      const pad = new THREE.Mesh(padGeo, spotCyanMat);
      pad.position.set((p - 1) * 0.08, -0.12, 0.12);
      rPawGroup.add(pad);
    }
    const rThumb = new THREE.Mesh(padGeo, spotGoldMat);
    rThumb.position.set(-0.12, -0.06, 0.08);
    rPawGroup.add(rThumb);
    rPawGroup.position.y = -0.34;

    this.rightHandSocket = new THREE.Group();
    this.rightHandSocket.position.set(0, -0.34, 0);

    this.rightForearm.add(rLower, rGlove, rPawGroup, this.rightHandSocket);
    this.rightArm.add(rUpper, this.rightForearm);
    this.mesh.add(this.rightArm);

    // Back Holster Socket for Solander Laser Gun
    this.holsterSocket = new THREE.Group();
    this.holsterSocket.position.set(0.2, 0.85, -0.32);
    this.holsterSocket.rotation.set(-0.4, 0.2, 0.5);
    this.mesh.add(this.holsterSocket);

    // Initialize Laser Gun
    this.laserGun = new SolanderLaserGun();
    this.holsterSocket.add(this.laserGun.mesh);

    // ==========================================
    // 5. ICONIC OVERSIZED HERO ADVENTURE BOOTS (Sonic Universe Style)
    // ==========================================
    const thighGeo = new THREE.CapsuleGeometry(0.1, 0.24, 12, 12);
    const shinGeo = new THREE.CapsuleGeometry(0.09, 0.24, 12, 12);

    // Rounded Metallic Knee Armor Plate
    const armorGeo = new THREE.SphereGeometry(0.12, 16, 16);
    armorGeo.scale(1.0, 1.1, 0.4);

    // Stylish Oversized Sneakers / High-Top Boots
    const bootUpperGeo = new THREE.CapsuleGeometry(0.16, 0.28, 16, 20);
    const bootToeGeo = new THREE.SphereGeometry(0.24, 20, 20);
    bootToeGeo.scale(1.15, 0.9, 1.45); // Rounded feline toe box!

    const shoeCollarGeo = new THREE.TorusGeometry(0.17, 0.05, 16, 24); // White cuff collar
    const soleGeo = new THREE.CapsuleGeometry(0.22, 0.38, 16, 20);
    soleGeo.rotateX(Math.PI / 2);

    const strapGeo = new THREE.TorusGeometry(0.2, 0.035, 12, 20); // Gold strap buckle across boots

    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.21, 0.45, 0);
    const lThigh = new THREE.Mesh(thighGeo, furMat);
    lThigh.position.y = -0.16;

    this.leftShin = new THREE.Group();
    this.leftShin.position.set(0, -0.32, 0);
    const lShin = new THREE.Mesh(shinGeo, furMat);
    lShin.position.y = -0.16;

    // Knee Armor Pad
    const lPad = new THREE.Mesh(armorGeo, armorPadMat);
    lPad.position.set(0, 0.02, 0.08);
    const lPadRim = new THREE.Mesh(armorGeo, armorTrimMat);
    lPadRim.position.set(0, 0.02, 0.07);
    lPadRim.scale.setScalar(1.08);
    this.leftShin.add(lShin, lPadRim, lPad);

    // High-Top Boot (Hero Oversized Style)
    const lCollar = new THREE.Mesh(shoeCollarGeo, shoeCollarMat);
    lCollar.position.set(0, -0.18, 0.02);
    lCollar.rotation.x = Math.PI / 2;

    const lShoeUpper = new THREE.Mesh(bootUpperGeo, shoeMat);
    lShoeUpper.position.set(0, -0.28, 0.03);

    const lShoeToe = new THREE.Mesh(bootToeGeo, shoeMat);
    lShoeToe.position.set(0, -0.38, 0.12);

    const lStrap = new THREE.Mesh(strapGeo, goldTrimMat);
    lStrap.position.set(0, -0.32, 0.12);
    lStrap.rotation.x = Math.PI / 2;

    const lSole = new THREE.Mesh(soleGeo, soleMat);
    lSole.position.set(0, -0.46, 0.1);
    this.leftShin.add(lCollar, lShoeUpper, lShoeToe, lStrap, lSole);

    this.leftLeg.add(lThigh, this.leftShin);
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.21, 0.45, 0);
    const rThigh = new THREE.Mesh(thighGeo, furMat);
    rThigh.position.y = -0.16;

    this.rightShin = new THREE.Group();
    this.rightShin.position.set(0, -0.32, 0);
    const rShin = new THREE.Mesh(shinGeo, furMat);
    rShin.position.y = -0.16;

    // Knee Armor Pad
    const rPad = new THREE.Mesh(armorGeo, armorPadMat);
    rPad.position.set(0, 0.02, 0.08);
    const rPadRim = new THREE.Mesh(armorGeo, armorTrimMat);
    rPadRim.position.set(0, 0.02, 0.07);
    rPadRim.scale.setScalar(1.08);
    this.rightShin.add(rShin, rPadRim, rPad);

    // High-Top Boot
    const rCollar = new THREE.Mesh(shoeCollarGeo, shoeCollarMat);
    rCollar.position.set(0, -0.18, 0.02);
    rCollar.rotation.x = Math.PI / 2;

    const rShoeUpper = new THREE.Mesh(bootUpperGeo, shoeMat);
    rShoeUpper.position.set(0, -0.28, 0.03);

    const rShoeToe = new THREE.Mesh(bootToeGeo, shoeMat);
    rShoeToe.position.set(0, -0.38, 0.12);

    const rStrap = new THREE.Mesh(strapGeo, goldTrimMat);
    rStrap.position.set(0, -0.32, 0.12);
    rStrap.rotation.x = Math.PI / 2;

    const rSole = new THREE.Mesh(soleGeo, soleMat);
    rSole.position.set(0, -0.46, 0.1);
    this.rightShin.add(rCollar, rShoeUpper, rShoeToe, rStrap, rSole);

    this.rightLeg.add(rThigh, this.rightShin);
    this.mesh.add(this.rightLeg);

    // ==========================================
    // 6. DUST PARTICLE SYSTEM FOR JUMPS & SPRINTING
    // ==========================================
    const dustCount = 40;
    this.dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustVelocities.push(new THREE.Vector3());
    }
    this.dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.28,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.dustParticles = new THREE.Points(this.dustGeo, dustMat);
    this.mesh.add(this.dustParticles);

    // ==========================================
    // 6. COMBAT & MOMENTUM VISUAL EFFECTS
    // ==========================================
    const arcGeo = new THREE.TorusGeometry(1.2, 0.12, 12, 24, Math.PI * 0.7);
    const arcMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0xa855f7,
      emissiveIntensity: 3.0,
      transparent: true,
      opacity: 0
    });
    this.slashArcMesh = new THREE.Mesh(arcGeo, arcMat);
    this.slashArcMesh.position.set(0, 1.1, 0.6);
    this.slashArcMesh.rotation.x = Math.PI / 2;
    this.mesh.add(this.slashArcMesh);

    // Spin Roll Aura Effect
    const spinGeo = new THREE.TorusGeometry(0.9, 0.14, 16, 28);
    const spinMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0xa855f7,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0
    });
    this.spinTrail = new THREE.Mesh(spinGeo, spinMat);
    this.spinTrail.rotation.x = Math.PI / 2;
    this.spinTrail.position.y = 0.9;
    this.mesh.add(this.spinTrail);

    const eBallGeo = new THREE.SphereGeometry(0.85, 20, 20);
    const eBallMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x9333ea,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    this.energyBallMesh = new THREE.Mesh(eBallGeo, eBallMat);
    this.energyBallMesh.position.y = 0.9;
    this.mesh.add(this.energyBallMesh);
  }

  public triggerMeleeCombo(): boolean {
    if (this.isMeleeAttacking) return false;

    // Advance combo step (1 -> 2 -> 3 -> 4)
    if (this.comboWindowTimer > 0) {
      this.comboStep = (this.comboStep % 4) + 1;
    } else {
      this.comboStep = 1;
    }

    this.isMeleeAttacking = true;
    this.comboTimer = 0.35;
    this.comboWindowTimer = 0.7; // Window to chain next hit
    this.currentState = 'MELEE_COMBO';

    sound.playSpinAttackSound();

    // Trigger slash arc visual effect
    (this.slashArcMesh.material as THREE.MeshStandardMaterial).opacity = 1.0;
    this.slashArcMesh.rotation.z = (this.comboStep - 1) * (Math.PI / 3);
    this.slashArcMesh.scale.setScalar(this.comboStep === 4 ? 1.5 : 1.0); // Bigger finisher!

    return true;
  }

  public triggerLaserFire(camera: ThirdPersonCamera, sceneGroup: THREE.Object3D): boolean {
    // Draw weapon from holster to right hand
    if (this.laserGun.isHolstered) {
      this.holsterSocket.remove(this.laserGun.mesh);
      this.rightHandSocket.add(this.laserGun.mesh);
      this.laserGun.mesh.position.set(0, 0, 0);
      this.laserGun.mesh.rotation.set(-Math.PI / 2, 0, 0);
    }

    const forward = camera.getForwardVector();
    const startPos = this.position.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(forward, 0.6);

    this.laserGun.fire(startPos, forward, 'BASE_SHOT');
    sceneGroup.add(this.laserGun.projectiles[this.laserGun.projectiles.length - 1].mesh);

    sound.playZap();
    this.currentState = 'LASER_ATTACK';
    return true;
  }

  public triggerRoll(): boolean {
    if (this.isRolling || !this.isGrounded) return false;
    this.isRolling = true;
    this.rollTimer = 0.55;
    this.currentState = 'ROLL';
    sound.playSpinAttackSound();
    return true;
  }

  public startPetting() {
    this.isPetting = true;
    this.pettingTimer = 1.2;
  }

  public emitDustBurst(scale: number = 1.0) {
    if (!this.dustPositions) return;
    const count = this.dustPositions.length / 3;
    for (let i = 0; i < count; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * 0.4 * scale;
      this.dustPositions[i * 3 + 1] = 0.05 + Math.random() * 0.2;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.4 * scale;

      this.dustVelocities[i].set(
        (Math.random() - 0.5) * 2.5 * scale,
        1.2 + Math.random() * 2.0 * scale,
        (Math.random() - 0.5) * 2.5 * scale
      );
    }
    (this.dustParticles.material as THREE.PointsMaterial).opacity = 0.95;
    this.dustGeo.attributes.position.needsUpdate = true;
  }

  public update(
    inputVec: InputVector,
    inputManager: InputManager,
    camera: ThirdPersonCamera,
    deltaTime: number,
    getGroundHeight: (x: number, z: number) => number,
    sceneGroup: THREE.Object3D,
    isInWater: boolean = false
  ) {
    this.isSwimming = isInWater;

    // Dust Particles Update
    const dustMat = this.dustParticles.material as THREE.PointsMaterial;
    if (dustMat.opacity > 0.01) {
      dustMat.opacity = Math.max(0, dustMat.opacity - deltaTime * 2.8);
      const count = this.dustPositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.dustPositions[i * 3] += this.dustVelocities[i].x * deltaTime;
        this.dustPositions[i * 3 + 1] += this.dustVelocities[i].y * deltaTime;
        this.dustPositions[i * 3 + 2] += this.dustVelocities[i].z * deltaTime;
        this.dustVelocities[i].y -= 4.0 * deltaTime; // Gravity on dust
      }
      this.dustGeo.attributes.position.needsUpdate = true;
    }

    // Tail Swish Animation
    const tailWiggle = Math.sin(Date.now() * 0.006) * 0.3;
    this.tailSegments.forEach((seg, idx) => {
      seg.rotation.y = tailWiggle * (idx + 1) * 0.2;
    });

    // Update Laser Gun Holster Management
    this.laserGun.update(deltaTime, sceneGroup);
    if (this.laserGun.isHolstered && this.laserGun.mesh.parent === this.rightHandSocket) {
      this.rightHandSocket.remove(this.laserGun.mesh);
      this.holsterSocket.add(this.laserGun.mesh);
      this.laserGun.mesh.position.set(0, 0, 0);
      this.laserGun.mesh.rotation.set(0, 0, 0);
    }

    // Decay Combo Timers
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= deltaTime;
    }

    if (this.isMeleeAttacking) {
      this.comboTimer -= deltaTime;
      const op = Math.max(0, this.comboTimer / 0.35);
      (this.slashArcMesh.material as THREE.MeshStandardMaterial).opacity = op;

      if (this.comboTimer <= 0) {
        this.isMeleeAttacking = false;
        (this.slashArcMesh.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    }

    // Handle Momentum Roll
    if (this.isRolling) {
      this.rollTimer -= deltaTime;
      this.mesh.rotation.x += deltaTime * 26; // Ball spin
      const op = Math.sin((0.55 - this.rollTimer) / 0.55 * Math.PI);
      (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = op;
      (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = op * 0.85;

      if (this.rollTimer <= 0) {
        this.isRolling = false;
        (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = 0;
        (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = 0;
        this.mesh.rotation.x = 0;
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

    // SA2 & SONIC UNIVERSE MOMENTUM PHYSICS ENGINE
    const forward = camera.getForwardVector();
    const right = camera.getRightVector();

    const moveDir = new THREE.Vector3()
      .addScaledVector(right, inputVec.x)
      .addScaledVector(forward, -inputVec.y);

    const isInputtingMove = moveDir.lengthSq() > 0.01;

    // Calculate Ground Slope Response
    const currentH = getGroundHeight(this.position.x, this.position.z);
    const sampleDist = 0.5;
    const nextH = getGroundHeight(
      this.position.x + (this.velocity.x !== 0 ? Math.sign(this.velocity.x) * sampleDist : 0),
      this.position.z + (this.velocity.z !== 0 ? Math.sign(this.velocity.z) * sampleDist : 0)
    );
    const slopeHeightDiff = nextH - currentH;

    // Determine Base Target Speed
    let maxTopSpeed = 12.0; // Normal Run Speed
    if (inputManager.isSprintHeld) maxTopSpeed = 18.5; // Sprint Speed
    if (this.isRolling) maxTopSpeed = 23.0; // Roll Speed

    // Slope influence
    if (slopeHeightDiff < -0.05) {
      maxTopSpeed += Math.abs(slopeHeightDiff) * 15.0; // Downhill boost
    } else if (slopeHeightDiff > 0.05) {
      maxTopSpeed = Math.max(4.5, maxTopSpeed - slopeHeightDiff * 9.0); // Uphill drag
    }

    if (this.isSwimming) maxTopSpeed *= 0.5;

    // Acceleration & Friction
    if (isInputtingMove) {
      moveDir.normalize();

      const speedRatio = Math.min(1, this.currentHorizontalSpeed / 18.0);
      const turnRate = THREE.MathUtils.lerp(15.0, 4.5, speedRatio);

      if (!this.isRolling && this.isGrounded) {
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let angleDiff = targetAngle - this.rotationY;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        this.rotationY += angleDiff * Math.min(1, deltaTime * turnRate);
        this.mesh.rotation.y = this.rotationY;

        // Dynamic Bank/Lean into turns (SA2 style!)
        const bankAngle = THREE.MathUtils.clamp(-angleDiff * speedRatio * 0.45, -0.4, 0.4);
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, bankAngle, deltaTime * 9.0);
      }

      // Accelerate towards target speed
      const accelRate = this.isGrounded ? (inputManager.isSprintHeld ? 26.0 : 20.0) : 12.0; // High air control
      this.targetHorizontalSpeed = maxTopSpeed;
      this.currentHorizontalSpeed = THREE.MathUtils.lerp(
        this.currentHorizontalSpeed,
        this.targetHorizontalSpeed,
        deltaTime * (accelRate / 10.0)
      );

      const moveFacing = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
      this.velocity.x = moveFacing.x * this.currentHorizontalSpeed;
      this.velocity.z = moveFacing.z * this.currentHorizontalSpeed;

      this.walkCycleTimer += deltaTime * (this.currentHorizontalSpeed * 1.15);

      if (!this.isSwimming && this.isGrounded) {
        this.stepSoundTimer += deltaTime;
        const stepInterval = Math.max(0.1, 0.3 - (this.currentHorizontalSpeed / 18.0) * 0.18);
        if (this.stepSoundTimer > stepInterval) {
          sound.playStep();
          this.stepSoundTimer = 0;
          if (this.currentHorizontalSpeed > 14.0) {
            this.emitDustBurst(0.4); // Sprint dust trails!
          }
        }
      }
    } else {
      const friction = this.isGrounded ? 9.0 : 2.5;
      this.currentHorizontalSpeed = Math.max(0, this.currentHorizontalSpeed - friction * deltaTime);
      this.velocity.x *= Math.max(0, 1 - friction * deltaTime * 0.5);
      this.velocity.z *= Math.max(0, 1 - friction * deltaTime * 0.5);
      this.walkCycleTimer = 0;
      this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, deltaTime * 10.0);
    }

    // Apply Velocity with Collision Resolution
    const nextX = this.position.x + this.velocity.x * deltaTime;
    const nextZ = this.position.z + this.velocity.z * deltaTime;

    const maxIslandRadius = 34.0;
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter > maxIslandRadius) {
      const angle = Math.atan2(nextZ, nextX);
      this.position.x = Math.cos(angle) * maxIslandRadius;
      this.position.z = Math.sin(angle) * maxIslandRadius;
    } else {
      this.position.x = nextX;
      this.position.z = nextZ;
    }

    // Waterfall Cliff Solid Wall in Garden World
    if (this.position.z < -13.2 && Math.abs(this.position.x) < 6.5) {
      this.position.z = -13.2;
    }

    // ==========================================
    // AGILITY JUMP PHYSICS & VARIABLE SPACEBAR JUMP
    // ==========================================
    const groundHeight = getGroundHeight(this.position.x, this.position.z);
    const doJump = inputManager.consumeJump();

    if (this.isSwimming) {
      const waterSurfaceY = 0.25;
      this.position.y = THREE.MathUtils.lerp(this.position.y, waterSurfaceY + Math.sin(Date.now() * 0.005) * 0.08, deltaTime * 5);
      this.velocity.y = 0;
      this.isGrounded = true;

      if (doJump) {
        this.velocity.y = 9.5;
        this.isGrounded = false;
        sound.playStep();
      }
    } else {
      // Grounded High Sonic Jump
      if (doJump && this.isGrounded) {
        this.velocity.y = 12.2; // High, snappy responsive jump
        this.isGrounded = false;
        this.canAirDash = true;
        this.isAirDashing = false;
        sound.playStep();
        this.emitDustBurst(0.8);
      }
      // Mid-Air Sonic Air Dash / Spin Bounce!
      else if (doJump && !this.isGrounded && this.canAirDash) {
        this.canAirDash = false;
        this.isAirDashing = true;
        this.airDashTimer = 0.35;
        this.velocity.y = Math.max(7.5, this.velocity.y + 5.5);
        this.currentHorizontalSpeed = Math.max(22.0, this.currentHorizontalSpeed + 8.0);
        sound.playSpinAttackSound();
        this.emitDustBurst(1.2);
      }

      // Variable Jump Height: Releasing Space early reduces ascent velocity!
      if (!this.isGrounded && this.velocity.y > 0 && !inputManager.keys['Space']) {
        this.velocity.y *= 0.84;
      }

      this.velocity.y -= 28.0 * deltaTime; // Responsive snappy gravity
      this.position.y += this.velocity.y * deltaTime;

      if (this.position.y <= groundHeight) {
        if (!this.isGrounded) {
          // Springy landing compression + dust burst!
          this.squashStretch.set(1.26, 0.74, 1.26);
          this.emitDustBurst(1.0);
          sound.playStep();
        }
        this.position.y = groundHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isAirDashing = false;
      }
    }

    // Smoothly spring squash & stretch back to 1.0
    this.squashStretch.lerp(new THREE.Vector3(1, 1, 1), deltaTime * 12.0);
    this.mesh.scale.copy(this.squashStretch);

    // Spin Jump / Airborne Somersault Rotation (Sonic SA2 Style)
    if (!this.isGrounded) {
      this.mesh.rotation.x += deltaTime * (this.isAirDashing ? 38.0 : 28.0);
      const op = 0.88;
      (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = op;
      (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = op * 0.75;
    } else if (!this.isRolling) {
      this.mesh.rotation.x = 0;
      if (!this.isMeleeAttacking) {
        (this.spinTrail.material as THREE.MeshStandardMaterial).opacity = 0;
        (this.energyBallMesh.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    }

    this.mesh.position.copy(this.position);

    // Update Camera FOV and Distance based on Speed!
    camera.update(this.position, deltaTime, this.currentHorizontalSpeed);

    // Carried Chao Position Update
    if (this.isCarrying && this.carriedCreature) {
      this.carriedCreature.position.set(this.position.x, this.position.y + 1.8, this.position.z);
      this.carriedCreature.mesh.position.copy(this.carriedCreature.position);
    }

    // State Determination
    if (!this.isGrounded) {
      this.currentState = this.velocity.y > 0 ? 'JUMP' : 'FALL';
    } else if (this.isRolling) {
      this.currentState = 'ROLL';
    } else if (this.isMeleeAttacking) {
      this.currentState = 'MELEE_COMBO';
    } else if (this.currentHorizontalSpeed > 13.0) {
      this.currentState = 'SPRINT';
    } else if (this.currentHorizontalSpeed > 6.0) {
      this.currentState = 'RUN';
    } else if (this.currentHorizontalSpeed > 0.5) {
      this.currentState = 'WALK';
    } else {
      this.currentState = 'IDLE';
    }

    // Athletic Limb Animations
    if (this.isCarrying) {
      this.leftArm.rotation.x = -Math.PI * 0.85;
      this.rightArm.rotation.x = -Math.PI * 0.85;
    } else if (this.isMeleeAttacking) {
      if (this.comboStep === 1) {
        this.rightArm.rotation.set(-0.8, 1.2, 0);
        this.leftArm.rotation.set(0.4, -0.4, 0);
      } else if (this.comboStep === 2) {
        this.leftArm.rotation.set(-0.8, -1.2, 0);
        this.rightArm.rotation.set(0.4, 0.4, 0);
      } else if (this.comboStep === 3) {
        this.rightArm.rotation.set(-1.8, 0, 0);
        this.leftArm.rotation.set(-1.8, 0, 0);
      } else {
        this.rightArm.rotation.set(-1.2, 0.8, 0);
        this.leftArm.rotation.set(-1.2, -0.8, 0);
      }
    } else if (this.currentState === 'SPRINT' || this.currentState === 'RUN') {
      const swing = Math.sin(this.walkCycleTimer) * 0.95;
      this.leftArm.rotation.x = swing;
      this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;

      this.leftShin.rotation.x = Math.max(0, -swing * 0.8);
      this.rightShin.rotation.x = Math.max(0, swing * 0.8);

      this.bodyMesh.rotation.x = 0.22; // Forward lean into run
      this.headGroup.rotation.x = -0.15; // Keep eyes forward
    } else if (this.currentState === 'WALK') {
      const swing = Math.sin(this.walkCycleTimer) * 0.55;
      this.leftArm.rotation.x = swing;
      this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;

      this.leftShin.rotation.x = Math.max(0, -swing * 0.5);
      this.rightShin.rotation.x = Math.max(0, swing * 0.5);

      this.bodyMesh.rotation.x = 0.08;
      this.headGroup.rotation.x = 0;
    } else if (!this.isGrounded) {
      // Jump / Fall Athletic Pose
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = 0.4;
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.2;
      this.bodyMesh.rotation.x = 0.15;
    } else {
      // Idle Breath Pose
      const idleBob = Math.sin(Date.now() * 0.004) * 0.03;
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.leftShin.rotation.x = THREE.MathUtils.lerp(this.leftShin.rotation.x, 0, 0.1);
      this.rightShin.rotation.x = THREE.MathUtils.lerp(this.rightShin.rotation.x, 0, 0.1);

      this.headGroup.position.y = 1.48 + idleBob;
      this.bodyMesh.rotation.x = 0;
      this.headGroup.rotation.x = 0;
    }
  }
}

