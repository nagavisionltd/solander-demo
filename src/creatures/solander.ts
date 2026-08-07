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

    // --- EVOLUTION FORM VISUALS ---
    // Crystal Crown / Halo
    const haloGeo = new THREE.TorusGeometry(0.28, 0.04, 12, 24);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8
    });
    this.crystalHalo = new THREE.Mesh(haloGeo, crystalMat);
    this.crystalHalo.rotation.x = Math.PI / 2;
    this.crystalHalo.position.set(0, 0.85, 0);
    this.crystalHalo.visible = this.data.form === 'CRYSTAL';
    this.mesh.add(this.crystalHalo);

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
  }

  public syncFormVisuals() {
    if (this.crystalHalo) {
      this.crystalHalo.visible = this.data.form === 'CRYSTAL';
    }
    if (this.skyWingsGroup) {
      this.skyWingsGroup.visible = this.data.form === 'SKY';
    }
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

    // Smooth movement position update
    this.position.addScaledVector(this.velocity, deltaTime);
    const groundY = getGroundHeight(this.position.x, this.position.z);

    // Happy Hop Animation
    let hopY = 0;
    if (this.isHappyJump) {
      this.happyJumpTimer -= deltaTime;
      hopY = Math.abs(Math.sin(this.happyJumpTimer * 12)) * 0.4;
      if (this.happyJumpTimer <= 0) {
        this.isHappyJump = false;
        this.heartParticles.children.forEach(p => p.visible = false);
      }
    } else if (this.velocity.lengthSq() > 0.05) {
      // Walking hop cycle
      hopY = Math.abs(Math.sin(time * 8)) * 0.15;
    }

    this.position.y = groundY + 0.45 + hopY;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // Breathing squish & stretch
    this.mesh.scale.y = 1 + Math.sin(time * 3) * 0.03;
    this.mesh.scale.x = 1 - Math.sin(time * 3) * 0.02;

    // Head tilt
    this.headGroup.rotation.z = Math.sin(time * 1.5) * 0.08;

    // Arm and wing flutter
    const isMoving = this.velocity.lengthSq() > 0.05;
    if (isMoving) {
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
