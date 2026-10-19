import * as THREE from 'three';
import { SolanderCreatureData } from '../systems/save';

export class SolanderCreature {
  public mesh: THREE.Group;
  public data: SolanderCreatureData;
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;

  // Parts for animations
  private headGroup: THREE.Group;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftWing: THREE.Mesh;
  private rightWing: THREE.Mesh;
  private emoteBall: THREE.Mesh;
  private heartParticles: THREE.Group;
  private crystalHalo: THREE.Mesh | null = null;
  private skyWingsGroup: THREE.Group | null = null;

  public animationTime: number = Math.random() * 10;
  public isHappyJump: boolean = false;
  private happyJumpTimer: number = 0;

  // New Behavioral States
  public isCarried: boolean = false;
  public isSleeping: boolean = false;
  public isSwimming: boolean = false;

  private zzzTextGroup: THREE.Group;

  constructor(data: SolanderCreatureData) {
    this.data = data;
    this.mesh = new THREE.Group();
    this.mesh.userData = { creatureId: data.id, creature: this };

    // Toon Materials
    const bodyMat = new THREE.MeshToonMaterial({ color: data.bodyColor });
    const accentMat = new THREE.MeshToonMaterial({ color: data.accentColor });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    const emoteBallMat = new THREE.MeshStandardMaterial({
      color: data.accentColor,
      emissive: data.accentColor,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    // --- HEAD & EYES ---
    this.headGroup = new THREE.Group();
    const headGeo = new THREE.SphereGeometry(0.5, 32, 16);
    headGeo.scale(1, 0.92, 0.95);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.castShadow = true;
    this.headGroup.add(head);

    // Cute Ears / Horns
    const earGeo = new THREE.ConeGeometry(0.12, 0.3, 12);
    const leftEar = new THREE.Mesh(earGeo, accentMat);
    leftEar.position.set(-0.3, 0.4, 0);
    leftEar.rotation.z = 0.4;

    const rightEar = new THREE.Mesh(earGeo, accentMat);
    rightEar.position.set(0.3, 0.4, 0);
    rightEar.rotation.z = -0.4;

    this.headGroup.add(leftEar, rightEar);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    eyeGeo.scale(0.5, 1.8, 0.3);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 0.02, 0.44);
    leftEye.rotation.y = -0.2;

    const rightEye = leftEye.clone();
    rightEye.position.set(0.16, 0.02, 0.44);
    rightEye.rotation.y = 0.2;

    this.headGroup.add(leftEye, rightEye);
    this.headGroup.position.y = 0.45;
    this.mesh.add(this.headGroup);

    // --- TORSO ---
    const torsoGeo = new THREE.SphereGeometry(0.32, 24, 16);
    torsoGeo.scale(0.9, 1.1, 0.85);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = -0.05;
    torso.castShadow = true;
    this.mesh.add(torso);

    // --- ARMS ---
    const armGeo = new THREE.CapsuleGeometry(0.07, 0.18, 8, 8);

    this.leftArm = new THREE.Mesh(armGeo, bodyMat);
    this.leftArm.position.set(-0.32, -0.05, 0.05);
    this.leftArm.rotation.z = Math.PI / 4;

    this.rightArm = new THREE.Mesh(armGeo, bodyMat);
    this.rightArm.position.set(0.32, -0.05, 0.05);
    this.rightArm.rotation.z = -Math.PI / 4;

    this.mesh.add(this.leftArm, this.rightArm);

    // --- FEET ---
    const footGeo = new THREE.CapsuleGeometry(0.09, 0.16, 8, 8);

    const leftFoot = new THREE.Mesh(footGeo, accentMat);
    leftFoot.position.set(-0.18, -0.38, 0.08);
    leftFoot.rotation.x = Math.PI / 2.5;

    const rightFoot = new THREE.Mesh(footGeo, accentMat);
    rightFoot.position.set(0.18, -0.38, 0.08);
    rightFoot.rotation.x = Math.PI / 2.5;

    this.mesh.add(leftFoot, rightFoot);

    // --- WINGS ---
    const wingGeo = new THREE.ConeGeometry(0.12, 0.25, 4);

    this.leftWing = new THREE.Mesh(wingGeo, accentMat);
    this.leftWing.position.set(-0.15, 0.05, -0.28);
    this.leftWing.rotation.set(-0.3, -0.5, -0.8);

    this.rightWing = new THREE.Mesh(wingGeo, accentMat);
    this.rightWing.position.set(0.15, 0.05, -0.28);
    this.rightWing.rotation.set(-0.3, 0.5, 0.8);

    this.mesh.add(this.leftWing, this.rightWing);

    // --- FLOATING EMOTE BALL ---
    const emoteBallGeo = new THREE.SphereGeometry(0.11, 16, 16);
    this.emoteBall = new THREE.Mesh(emoteBallGeo, emoteBallMat);
    this.emoteBall.position.set(0, 1.05, 0);
    this.mesh.add(this.emoteBall);

    // --- SLEEPING ZZZ PARTICLES ---
    this.zzzTextGroup = new THREE.Group();
    const zMat = new THREE.MeshBasicMaterial({ color: 0x9333ea });
    const zGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    for (let i = 0; i < 3; i++) {
      const zMesh = new THREE.Mesh(zGeo, zMat);
      zMesh.position.set(0.2 + i * 0.1, 0.7 + i * 0.2, 0);
      zMesh.visible = false;
      this.zzzTextGroup.add(zMesh);
    }
    this.mesh.add(this.zzzTextGroup);

    // --- HEART PARTICLES CONTAINER ---
    this.heartParticles = new THREE.Group();
    const heartMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide });
    const heartGeo = new THREE.CircleGeometry(0.08, 6);

    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(heartGeo, heartMat);
      p.visible = false;
      this.heartParticles.add(p);
    }
    this.mesh.add(this.heartParticles);

    // --- HERO & DARK ALIGNMENT VISUAL ATTACHMENTS ---
    // Hero Golden Halo
    const heroHaloGeo = new THREE.TorusGeometry(0.24, 0.035, 12, 24);
    const heroHaloMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfef08a,
      emissiveIntensity: 1.0
    });
    const heroHalo = new THREE.Mesh(heroHaloGeo, heroHaloMat);
    heroHalo.rotation.x = Math.PI / 2;
    heroHalo.position.set(0, 0.95, 0);
    heroHalo.visible = data.alignment === 'HERO';
    this.headGroup.add(heroHalo);

    // Dark Spiked Horns & Crimson Emote Ball
    if (data.alignment === 'DARK') {
      const darkHornGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
      const darkHornMat = new THREE.MeshToonMaterial({ color: 0x9f1239 });
      const leftDarkHorn = new THREE.Mesh(darkHornGeo, darkHornMat);
      leftDarkHorn.position.set(-0.25, 0.45, 0.1);
      leftDarkHorn.rotation.z = 0.5;

      const rightDarkHorn = new THREE.Mesh(darkHornGeo, darkHornMat);
      rightDarkHorn.position.set(0.25, 0.45, 0.1);
      rightDarkHorn.rotation.z = -0.5;

      this.headGroup.add(leftDarkHorn, rightDarkHorn);

      // Crimson emissive emote ball
      emoteBallMat.color.setHex(0xe11d48);
      emoteBallMat.emissive.setHex(0xf43f5e);
    } else if (data.alignment === 'HERO') {
      emoteBallMat.color.setHex(0x38bdf8);
      emoteBallMat.emissive.setHex(0x7dd3fc);
    }

    // --- STAT-DRIVEN PHYSICAL GROWTH & SCALING ---
    // High Swim stat expands flippers/feet width
    const swimScale = 1 + (data.swimStat || 0) * 0.008;
    leftFoot.scale.set(swimScale * 1.2, swimScale, swimScale * 1.3);
    rightFoot.scale.set(swimScale * 1.2, swimScale, swimScale * 1.3);

    // High Power stat expands shoulders/torso and arms
    const powerScale = 1 + (data.powerStat || 0) * 0.007;
    torso.scale.set(0.9 * powerScale, 1.1 * powerScale, 0.85 * powerScale);
    this.leftArm.scale.set(powerScale, powerScale * 1.2, powerScale);
    this.rightArm.scale.set(powerScale, powerScale * 1.2, powerScale);

    // High Fly stat expands wing size
    const flyScale = 1 + (data.flyStat || 0) * 0.012;
    this.leftWing.scale.set(flyScale, flyScale * 1.4, flyScale);
    this.rightWing.scale.set(flyScale, flyScale * 1.4, flyScale);

    // Sky Wings expansion
    this.skyWingsGroup = new THREE.Group();
    const skyWingMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.6
    });
    const featherGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
    const leftFeather = new THREE.Mesh(featherGeo, skyWingMat);
    leftFeather.position.set(-0.35, 0.2, -0.28);
    leftFeather.rotation.z = -0.9;
    const rightFeather = new THREE.Mesh(featherGeo, skyWingMat);
    rightFeather.position.set(0.35, 0.2, -0.28);
    rightFeather.rotation.z = 0.9;

    this.skyWingsGroup.add(leftFeather, rightFeather);
    this.skyWingsGroup.visible = this.data.form === 'SKY';
    this.mesh.add(this.skyWingsGroup);

    // --- ACCESSORIES ATTACHMENT GROUP ---
    this.buildAccessoryMeshes();
  }

  private crownMesh: THREE.Group | null = null;
  private bowtieMesh: THREE.Mesh | null = null;
  private glassesMesh: THREE.Group | null = null;

  private buildAccessoryMeshes() {
    // 1. Royal Gold Crown
    this.crownMesh = new THREE.Group();
    const crownBaseGeo = new THREE.CylinderGeometry(0.22, 0.2, 0.15, 8, 1, true);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const crownBase = new THREE.Mesh(crownBaseGeo, crownMat);
    this.crownMesh.add(crownBase);

    const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeo, crownMat);
      spike.position.set(Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2);
      this.crownMesh.add(spike);
    }
    this.crownMesh.position.set(0, 0.52, 0);
    this.headGroup.add(this.crownMesh);

    // 2. Red Bowtie
    const bowGeo = new THREE.ConeGeometry(0.1, 0.18, 4);
    const bowMat = new THREE.MeshToonMaterial({ color: 0xef4444 });
    const leftBow = new THREE.Mesh(bowGeo, bowMat);
    leftBow.rotation.z = Math.PI / 2;
    leftBow.position.set(-0.08, -0.22, 0.35);
    const rightBow = new THREE.Mesh(bowGeo, bowMat);
    rightBow.rotation.z = -Math.PI / 2;
    rightBow.position.set(0.08, -0.22, 0.35);
    const bowKnot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), bowMat);
    bowKnot.position.set(0, -0.22, 0.37);

    const bowGroup = new THREE.Group();
    bowGroup.add(leftBow, rightBow, bowKnot);
    this.bowtieMesh = bowKnot;
    this.headGroup.add(bowGroup);

    // 3. Cool Glasses
    this.glassesMesh = new THREE.Group();
    const glassLensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12);
    glassLensGeo.rotateX(Math.PI / 2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const leftLens = new THREE.Mesh(glassLensGeo, glassMat);
    leftLens.position.set(-0.16, 0.02, 0.46);
    const rightLens = new THREE.Mesh(glassLensGeo, glassMat);
    rightLens.position.set(0.16, 0.02, 0.46);

    const bridgeGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
    const bridge = new THREE.Mesh(bridgeGeo, glassMat);
    bridge.position.set(0, 0.02, 0.46);

    this.glassesMesh.add(leftLens, rightLens, bridge);
    this.headGroup.add(this.glassesMesh);
  }

  public syncFormVisuals() {
    if (this.crystalHalo) {
      this.crystalHalo.visible = this.data.form === 'CRYSTAL';
    }
    if (this.skyWingsGroup) {
      this.skyWingsGroup.visible = this.data.form === 'SKY';
    }

    // Accessory visibility sync
    const activeAcc = this.data.activeAccessory;
    if (this.crownMesh) this.crownMesh.visible = activeAcc === 'crown';
    if (this.bowtieMesh && this.bowtieMesh.parent) this.bowtieMesh.parent.visible = activeAcc === 'bowtie';
    if (this.glassesMesh) this.glassesMesh.visible = activeAcc === 'glasses';
  }

  public triggerHappyReaction() {
    this.isHappyJump = true;
    this.happyJumpTimer = 1.0;

    // Show heart particles floating up
    this.heartParticles.children.forEach((p, idx) => {
      p.visible = true;
      p.position.set((Math.random() - 0.5) * 0.5, 0.8 + idx * 0.2, (Math.random() - 0.5) * 0.5);
    });
  }

  public update(deltaTime: number, getGroundHeight: (x: number, z: number) => number) {
    this.animationTime += deltaTime;
    const time = this.animationTime;

    this.syncFormVisuals();

    if (this.crystalHalo && this.crystalHalo.visible) {
      this.crystalHalo.rotation.z += deltaTime * 1.5;
    }

    // Toggle Zzz Sleeping Visuals
    this.zzzTextGroup.children.forEach((z, idx) => {
      z.visible = this.isSleeping;
      if (this.isSleeping) {
        z.position.y = 0.6 + ((time * 1.5 + idx * 0.4) % 0.8);
        z.position.x = 0.15 + Math.sin(time * 2 + idx) * 0.08;
      }
    });

    if (this.isCarried) {
      // Held above player head
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.rotationY;

      // Legs wiggle happily in air
      this.leftArm.rotation.z = Math.PI / 2;
      this.rightArm.rotation.z = -Math.PI / 2;
      this.leftWing.rotation.z = -1.2 + Math.sin(time * 15) * 0.3;
      this.rightWing.rotation.z = 1.2 - Math.sin(time * 15) * 0.3;
      return;
    }

    if (this.isSleeping) {
      const groundY = getGroundHeight(this.position.x, this.position.z);
      this.position.y = groundY + 0.42;
      this.mesh.position.copy(this.position);
      this.mesh.rotation.z = 0.4; // Curled up on side sleeping
      return;
    } else {
      this.mesh.rotation.z = 0;
    }

    // Smooth movement position update with high ground friction to prevent slipping
    if (!this.isSwimming) {
      this.position.addScaledVector(this.velocity, deltaTime);
      // High terrain friction on ground
      this.velocity.x *= Math.max(0, 1 - 12.0 * deltaTime);
      this.velocity.z *= Math.max(0, 1 - 12.0 * deltaTime);
    }
    const groundY = getGroundHeight(this.position.x, this.position.z);

    let hopY = 0;
    if (this.isSwimming) {
      // Floating in pool water
      this.position.y = -0.1 + Math.sin(time * 4) * 0.06;
    } else if (this.isHappyJump) {
      this.happyJumpTimer -= deltaTime;
      hopY = Math.abs(Math.sin(this.happyJumpTimer * 12)) * 0.4;
      if (this.happyJumpTimer <= 0) {
        this.isHappyJump = false;
        this.heartParticles.children.forEach(p => p.visible = false);
      }
      this.position.y = groundY + 0.48 + hopY;
    } else if (this.velocity.lengthSq() > 0.05) {
      hopY = Math.abs(Math.sin(time * 8)) * 0.15;
      this.position.y = groundY + 0.48 + hopY;
    } else {
      this.position.y = groundY + 0.48;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // Breathing squish & stretch
    this.mesh.scale.y = 1 + Math.sin(time * 3) * 0.03;
    this.mesh.scale.x = 1 - Math.sin(time * 3) * 0.02;

    // Head tilt
    this.headGroup.rotation.z = Math.sin(time * 1.5) * 0.08;

    // Arm and wing flutter
    const isMoving = this.velocity.lengthSq() > 0.05;
    if (this.isSwimming) {
      // Swimming Paddle Arms
      this.leftArm.rotation.z = Math.PI / 3 + Math.sin(time * 10) * 0.4;
      this.rightArm.rotation.z = -Math.PI / 3 - Math.sin(time * 10) * 0.4;
    } else if (isMoving) {
      this.leftArm.rotation.z = (Math.PI / 4) + Math.sin(time * 8) * 0.25;
      this.rightArm.rotation.z = (-Math.PI / 4) - Math.sin(time * 8) * 0.25;
    } else {
      this.leftArm.rotation.z = (Math.PI / 4) + Math.sin(time * 2.5) * 0.1;
      this.rightArm.rotation.z = (-Math.PI / 4) - Math.sin(time * 2.5) * 0.1;
    }

    this.leftWing.rotation.z = -0.8 + Math.sin(time * 12) * 0.18;
    this.rightWing.rotation.z = 0.8 - Math.sin(time * 12) * 0.18;

    // Floating Emote Ball Bobbing & Pulsing
    this.emoteBall.position.y = 1.08 + Math.sin(time * 4) * 0.08;
    this.emoteBall.scale.setScalar(1 + Math.sin(time * 6) * 0.1);

    // Heart particles floating effect
    if (this.isHappyJump) {
      this.heartParticles.children.forEach((p, idx) => {
        p.position.y += deltaTime * 0.8;
        p.rotation.z += deltaTime * 2;
      });
    }
  }
}
