import * as THREE from 'three';

export interface LaserProjectile {
  id: string;
  mesh: THREE.Group;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  life: number;
  damage: number;
  type: 'BASE_SHOT' | 'CHARGED_BLAST' | 'SCATTER_PULSE' | 'TRACKER_BEAM' | 'PIERCING_SHOT';
}

export interface ImpactEffect {
  mesh: THREE.Group;
  life: number;
}

export class SolanderLaserGun {
  public mesh: THREE.Group;
  public gunBody: THREE.Group;
  public coreMesh: THREE.Mesh;
  public muzzlePoint: THREE.Vector3 = new THREE.Vector3();

  public isHolstered: boolean = true;
  public holsterTimer: number = 0; // Automatically holster after 2.5s out of combat

  public projectiles: LaserProjectile[] = [];
  public impactEffects: ImpactEffect[] = [];

  constructor() {
    this.mesh = new THREE.Group();
    this.gunBody = new THREE.Group();

    // Cel-shaded & Emissive Gun Materials
    const bodyMat = new THREE.MeshToonMaterial({ color: 0x1e293b }); // Dark slate futuristic alloy
    const accentMat = new THREE.MeshToonMaterial({ color: 0x334155 }); // Metal trim
    const gripMat = new THREE.MeshToonMaterial({ color: 0x0f172a }); // Non-slip grip
    const energyCoreMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xf43f5e,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    const cyanTrimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.5
    });

    // Main Gun Barrel
    const barrelGeo = new THREE.BoxGeometry(0.12, 0.18, 0.65);
    const barrel = new THREE.Mesh(barrelGeo, bodyMat);
    barrel.position.set(0, 0, 0.2);
    this.gunBody.add(barrel);

    // Top Receiver Sight
    const sightGeo = new THREE.BoxGeometry(0.08, 0.08, 0.4);
    const sight = new THREE.Mesh(sightGeo, accentMat);
    sight.position.set(0, 0.12, 0.15);
    this.gunBody.add(sight);

    // Glowing Circular Energy Core (Solander Ring)
    const coreGeo = new THREE.TorusGeometry(0.09, 0.025, 12, 20);
    this.coreMesh = new THREE.Mesh(coreGeo, energyCoreMat);
    this.coreMesh.rotation.y = Math.PI / 2;
    this.coreMesh.position.set(0.065, 0.02, 0.1);
    this.gunBody.add(this.coreMesh);

    const coreMeshLeft = new THREE.Mesh(coreGeo, energyCoreMat);
    coreMeshLeft.rotation.y = Math.PI / 2;
    coreMeshLeft.position.set(-0.065, 0.02, 0.1);
    this.gunBody.add(coreMeshLeft);

    // Front Muzzle Nozzle
    const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, cyanTrimMat);
    muzzle.position.set(0, 0.01, 0.52);
    this.gunBody.add(muzzle);

    // Pistol Grip & Trigger Guard
    const gripGeo = new THREE.BoxGeometry(0.09, 0.26, 0.12);
    gripGeo.rotateX(0.3);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.15, -0.05);
    this.gunBody.add(grip);

    // Scale & Orient for character hand holding
    this.gunBody.scale.set(1.1, 1.1, 1.1);
    this.mesh.add(this.gunBody);
  }

  public fire(
    startPos: THREE.Vector3,
    direction: THREE.Vector3,
    type: 'BASE_SHOT' | 'CHARGED_BLAST' | 'SCATTER_PULSE' = 'BASE_SHOT'
  ) {
    this.isHolstered = false;
    this.holsterTimer = 2.5; // Stay drawn for 2.5 seconds

    const projectileGroup = new THREE.Group();

    if (type === 'BASE_SHOT') {
      // Fast glowing plasma cylinder
      const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
      boltGeo.rotateX(Math.PI / 2);
      const boltMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 3.0
      });
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      projectileGroup.add(bolt);

      // Core glow sphere
      const glowGeo = new THREE.SphereGeometry(0.16, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      projectileGroup.add(glow);

      projectileGroup.position.copy(startPos);
      projectileGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());

      this.projectiles.push({
        id: Math.random().toString(),
        mesh: projectileGroup,
        position: startPos.clone(),
        direction: direction.clone().normalize(),
        speed: 38.0,
        life: 1.5,
        damage: 1,
        type: 'BASE_SHOT'
      });
    } else if (type === 'SCATTER_PULSE') {
      // 3-way spread pulse
      const angles = [-0.15, 0, 0.15];
      angles.forEach(angle => {
        const pGroup = new THREE.Group();
        const boltGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const boltMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xef4444,
          emissiveIntensity: 3.0
        });
        pGroup.add(new THREE.Mesh(boltGeo, boltMat));

        const dir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
        pGroup.position.copy(startPos);

        this.projectiles.push({
          id: Math.random().toString(),
          mesh: pGroup,
          position: startPos.clone(),
          direction: dir,
          speed: 32.0,
          life: 1.2,
          damage: 1,
          type: 'SCATTER_PULSE'
        });
      });
    }
  }

  public createImpact(pos: THREE.Vector3) {
    const impactGroup = new THREE.Group();

    // Starburst spark geometry
    const sparkGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 1.0
    });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    impactGroup.add(spark);

    impactGroup.position.copy(pos);
    this.impactEffects.push({
      mesh: impactGroup,
      life: 0.25
    });
  }

  public update(deltaTime: number, sceneGroup: THREE.Object3D) {
    // Holster timer decay
    if (!this.isHolstered) {
      this.holsterTimer -= deltaTime;
      if (this.holsterTimer <= 0) {
        this.isHolstered = true;
      }
    }

    // Pulse core
    if (this.coreMesh) {
      this.coreMesh.rotation.z += deltaTime * 6;
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= deltaTime;
      p.position.addScaledVector(p.direction, p.speed * deltaTime);
      p.mesh.position.copy(p.position);

      if (p.life <= 0) {
        sceneGroup.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Update Impact Effects
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const fx = this.impactEffects[i];
      fx.life -= deltaTime;
      fx.mesh.scale.addScalar(deltaTime * 8.0);

      if (fx.life <= 0) {
        sceneGroup.remove(fx.mesh);
        this.impactEffects.splice(i, 1);
      }
    }
  }
}
