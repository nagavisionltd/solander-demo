import * as THREE from 'three';

export interface DiscoveryPoint {
  id: string;
  name: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  memoryTitle: string;
  memoryText: string;
  discovered: boolean;
}

export interface ResourceNode {
  id: string;
  type: 'essence' | 'seeds' | 'crystals';
  name: string;
  position: THREE.Vector3;
  mesh: THREE.Group;
  collected: boolean;
}

export interface VoidEnemy {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  alive: boolean;
  eyeMesh: THREE.Mesh;
}

export interface DashPanel {
  id: string;
  position: THREE.Vector3;
  directionAngle: number;
  mesh: THREE.Group;
  cooldowned: boolean;
}

export interface SpringPad {
  id: string;
  position: THREE.Vector3;
  upwardForce: number;
  forwardSpeed: number;
  mesh: THREE.Group;
  cooldowned: boolean;
}

export interface SpeedRing {
  id: string;
  position: THREE.Vector3;
  collected: boolean;
  mesh: THREE.Group;
}

export class MysticValleyWorld {
  public group: THREE.Group;
  public discoveryPoints: DiscoveryPoint[] = [];
  public resourceNodes: ResourceNode[] = [];
  public enemies: VoidEnemy[] = [];
  public dashPanels: DashPanel[] = [];
  public springPads: SpringPad[] = [];
  public speedRings: SpeedRing[] = [];
  public checkpoint: { position: THREE.Vector3; mesh: THREE.Group; activated: boolean } | null = null;
  public goalRing: { position: THREE.Vector3; mesh: THREE.Group; activated: boolean } | null = null;
  public trialPedestal: { position: THREE.Vector3; mesh: THREE.Group } | null = null;

  public activeStage: 'TRON' | 'ORIGINAL' = 'TRON';

  constructor() {
    this.group = new THREE.Group();
    this.loadStage('TRON');
  }

  public loadStage(stage: 'TRON' | 'ORIGINAL') {
    this.activeStage = stage;
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.discoveryPoints = [];
    this.resourceNodes = [];
    this.enemies = [];
    this.dashPanels = [];
    this.springPads = [];
    this.speedRings = [];
    this.checkpoint = null;
    this.goalRing = null;
    this.trialPedestal = null;

    if (stage === 'TRON') {
      this.buildTronTrackGeometry();
      this.buildTronSceneryAndArches();
    } else {
      this.buildOriginalValleyTerrain();
      this.buildOriginalValleyScenery();
    }

    this.buildDiscoveryPoints();
    this.buildResourceNodes();
    this.buildTrialPedestal();
    this.spawnVoidEnemies();
    this.buildSonicCourse();
  }

  /**
   * Calculates ground height at any (X, Z) coordinate based on active level stage.
   */
  public getGroundHeight(x: number, z: number): number {
    if (this.activeStage === 'ORIGINAL') {
      if (z > 30 || z < -2520) return -10.0;
      const dist = Math.max(0, -z);
      const centerX = Math.sin(dist * 0.008) * 45.0 + Math.sin(dist * 0.02) * 20.0;
      const centerY = Math.sin(dist * 0.006) * 12.0 + Math.cos(dist * 0.015) * 6.0;
      const distFromCenter = Math.abs(x - centerX);
      if (distFromCenter <= 35.0) return centerY;
      return -10.0;
    }

    // TRON STAGE OVERHEAD LAYOUT
    if (z > 30 || z < -1820) return -10.0;

    // 1. START TRACK (z: 30 -> -220, centered at X = 0)
    if (z <= 30 && z > -220) {
      const distFromCenter = Math.abs(x - 0);
      if (distFromCenter <= 18.0) return 0.0;
    }

    // 2. FORK 1 SPLIT (z: -220 -> -680)
    else if (z <= -220 && z > -680) {
      let leftX = -38.0;
      let rightX = 38.0;
      const leftY = 0.0 + Math.sin((z + 220) * 0.01) * 2.5;
      const rightY = 0.0 + Math.cos((z + 220) * 0.01) * 2.5;

      if (z > -280) {
        const t = (-220 - z) / 60.0; // 0 to 1
        leftX = 0 + t * (-38.0);
        rightX = 0 + t * (38.0);
      } else if (z < -620) {
        const t = (-620 - z) / 60.0; // 0 to 1
        leftX = -38.0 + t * (38.0);
        rightX = 38.0 + t * (-38.0);
      }

      const distLeft = Math.abs(x - leftX);
      const distRight = Math.abs(x - rightX);
      const trackWidth = 14.0; // 28-unit wide lanes

      if (distLeft <= trackWidth) return leftY;
      if (distRight <= trackWidth) return rightY;
    }

    // 3. CHECKPOINT TRACK (z: -680 -> -920, centered at X = 0)
    else if (z <= -680 && z > -920) {
      const distFromCenter = Math.abs(x - 0);
      if (distFromCenter <= 20.0) return 2.0;
    }

    // 4. FORK 2 SPLIT (SHORT vs LONG) (z: -920 -> -1580)
    else if (z <= -920 && z > -1580) {
      // SHORT PATH (Direct left branch, finishes faster)
      let shortX = -32.0;
      const shortY = 2.0 + Math.sin((z + 920) * 0.015) * 3.5;

      if (z > -980) {
        const t = (-920 - z) / 60.0;
        shortX = 0 + t * (-32.0);
      } else if (z < -1360) {
        const t = Math.min(1.0, (-1360 - z) / 60.0);
        shortX = -32.0 + t * (32.0);
      }

      // LONG PATH (Wider right loop swinging out to X = +55)
      let longX = 55.0 * Math.sin(((-920 - z) / 600.0) * Math.PI);
      const longY = 2.0 + Math.cos((z + 920) * 0.01) * 3.0;

      if (z > -980) {
        const t = (-920 - z) / 60.0;
        longX = t * (45.0);
      } else if (z < -1520) {
        const t = Math.min(1.0, (-1520 - z) / 60.0);
        longX = 45.0 * (1 - t);
      }

      const distShort = Math.abs(x - shortX);
      const distLong = Math.abs(x - longX);

      if (z >= -1420 && distShort <= 13.0) return shortY;
      if (distLong <= 16.0) return longY;
    }

    // 5. GOAL TRACK (z: -1580 -> -1820, centered at X = 0)
    else if (z <= -1580 && z >= -1820) {
      const distFromCenter = Math.abs(x - 0);
      if (distFromCenter <= 22.0) return 4.0;
    }

    // Off-track abyss drop
    return -10.0;
  }

  private buildTronTrackGeometry() {
    // Dark Glossy Metallic Tron Base Material
    const darkFloorMat = new THREE.MeshStandardMaterial({
      color: 0x030712,
      roughness: 0.15,
      metalness: 0.85
    });

    // Neon Edge Materials
    const cyanLightMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2
    });
    const magentaLightMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 1.2
    });
    const amberLightMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.2
    });
    const emeraldLightMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.2
    });

    // Helper to spawn a Tron Track Segment with Glowing Border Rails
    const createTronSegment = (
      width: number,
      length: number,
      posX: number,
      posY: number,
      posZ: number,
      lightMat: THREE.Material
    ) => {
      const group = new THREE.Group();

      // Main Grid Slab
      const slabGeo = new THREE.BoxGeometry(width, 0.4, length);
      const slab = new THREE.Mesh(slabGeo, darkFloorMat);
      slab.receiveShadow = true;
      group.add(slab);

      // Glowing Side Light Strips
      const railGeo = new THREE.BoxGeometry(0.5, 0.6, length);
      const leftRail = new THREE.Mesh(railGeo, lightMat);
      leftRail.position.set(-width / 2 + 0.25, 0.2, 0);

      const rightRail = new THREE.Mesh(railGeo, lightMat);
      rightRail.position.set(width / 2 - 0.25, 0.2, 0);

      group.add(leftRail, rightRail);
      group.position.set(posX, posY, posZ);
      this.group.add(group);
    };

    // 1. START HIGHWAY (Z = 20 to -220)
    createTronSegment(32, 240, 0, -0.2, -100, cyanLightMat);

    // 2. FORK 1 BRANCHES (Z = -220 to -680)
    // Left Path (Magenta Light Rails)
    for (let z = -250; z >= -650; z -= 50) {
      let x = -38;
      if (z > -310) x = ((-250 - z) / 60) * -38;
      else if (z < -590) x = -38 + ((-590 - z) / 60) * 38;

      const y = Math.sin((z + 220) * 0.01) * 2.5;
      createTronSegment(26, 52, x, y - 0.2, z, magentaLightMat);
    }

    // Right Path (Amber Light Rails)
    for (let z = -250; z >= -650; z -= 50) {
      let x = 38;
      if (z > -310) x = ((-250 - z) / 60) * 38;
      else if (z < -590) x = 38 + ((-590 - z) / 60) * -38;

      const y = Math.cos((z + 220) * 0.01) * 2.5;
      createTronSegment(26, 52, x, y - 0.2, z, amberLightMat);
    }

    // 3. CHECKPOINT HIGHWAY (Z = -680 to -920)
    createTronSegment(36, 240, 0, 1.8, -800, cyanLightMat);

    // 4. FORK 2 BRANCHES (Z = -920 to -1580)
    // Short Path (Left Branch - High-Speed Cyan Light Rails)
    for (let z = -950; z >= -1380; z -= 50) {
      let x = -32;
      if (z > -1010) x = ((-950 - z) / 60) * -32;
      else if (z < -1320) x = -32 + ((-1320 - z) / 60) * 32;

      const y = 2.0 + Math.sin((z + 920) * 0.015) * 3.5;
      createTronSegment(24, 52, x, y - 0.2, z, cyanLightMat);
    }

    // Long Path (Right Branch - Emerald Scenic Curve)
    for (let z = -950; z >= -1550; z -= 50) {
      let x = 55.0 * Math.sin(((-920 - z) / 600.0) * Math.PI);
      if (z > -1010) x = ((-950 - z) / 60) * 45;
      else if (z < -1490) x = 45 * (1 - (-1490 - z) / 60);

      const y = 2.0 + Math.cos((z + 920) * 0.01) * 3.0;
      createTronSegment(28, 52, x, y - 0.2, z, emeraldLightMat);
    }

    // 5. GOAL HIGHWAY (Z = -1580 to -1820)
    createTronSegment(40, 240, 0, 3.8, -1700, cyanLightMat);
  }

  private buildOriginalValleyTerrain() {
    const canyonMat = new THREE.MeshToonMaterial({ color: 0x1e1b4b });
    const crystalRimMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6
    });

    // Build serpentine 2500-unit mountain valley track
    for (let z = 20; z >= -2500; z -= 30) {
      const dist = Math.max(0, -z);
      const centerX = Math.sin(dist * 0.008) * 45.0 + Math.sin(dist * 0.02) * 20.0;
      const centerY = Math.sin(dist * 0.006) * 12.0 + Math.cos(dist * 0.015) * 6.0;

      const segGeo = new THREE.BoxGeometry(70, 2.0, 32);
      const seg = new THREE.Mesh(segGeo, canyonMat);
      seg.position.set(centerX, centerY - 1.0, z);
      seg.receiveShadow = true;
      this.group.add(seg);

      // Bioluminescent Crystal Border Rails along path edges
      [-34, 34].forEach(offset => {
        const borderGeo = new THREE.BoxGeometry(2.0, 1.2, 32);
        const border = new THREE.Mesh(borderGeo, crystalRimMat);
        border.position.set(centerX + offset, centerY + 0.6, z);
        this.group.add(border);
      });
    }
  }

  private buildOriginalValleyScenery() {
    // Bioluminescent Valley Scenery (Crystal Trees, Glowing Minerals, Sky Islands)
    const treeTrunkMat = new THREE.MeshToonMaterial({ color: 0x311b92 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.7
    });

    for (let z = 0; z >= -2400; z -= 60) {
      const dist = Math.max(0, -z);
      const centerX = Math.sin(dist * 0.008) * 45.0 + Math.sin(dist * 0.02) * 20.0;
      const centerY = Math.sin(dist * 0.006) * 12.0 + Math.cos(dist * 0.015) * 6.0;

      [-42, 42].forEach(side => {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 7.0, 8), treeTrunkMat);
        trunk.position.y = 3.5;
        const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5, 1), treeFoliageMat);
        foliage.position.y = 8.0;

        treeGroup.add(trunk, foliage);
        treeGroup.position.set(centerX + side, centerY, z);
        this.group.add(treeGroup);
      });
    }
  }

  private buildTronSceneryAndArches() {
    // 1. Digital Wireframe Cyber Pillars along the void sides
    const pillarGeo = new THREE.BoxGeometry(3, 30, 3);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.6,
      wireframe: true
    });

    for (let z = 20; z >= -1800; z -= 80) {
      [-65, 65].forEach(sideX => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(sideX, 10, z);
        this.group.add(pillar);
      });
    }

    // 2. Holographic Archway Sign helpers
    const createArchway = (z: number, x: number, y: number, labelColor: number, labelText: string) => {
      const group = new THREE.Group();

      const pillarMat = new THREE.MeshStandardMaterial({
        color: labelColor,
        emissive: labelColor,
        emissiveIntensity: 0.9
      });

      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12), pillarMat);
      leftPillar.position.set(-18, 6, 0);

      const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 12), pillarMat);
      rightPillar.position.set(18, 6, 0);

      const headerBar = new THREE.Mesh(new THREE.BoxGeometry(36, 0.6, 0.6), pillarMat);
      headerBar.position.set(0, 11.8, 0);

      group.add(leftPillar, rightPillar, headerBar);
      group.position.set(x, y, z);
      this.group.add(group);
    };

    // Spawn Tron Archways at key junctions
    createArchway(10, 0, 0, 0x06b6d4, 'START LINE');
    createArchway(-210, 0, 0, 0xd946ef, 'FORK 1: LEFT vs RIGHT');
    createArchway(-910, 0, 2, 0x10b981, 'FORK 2: SHORT vs LONG');

    // 3. TRON CHECKPOINT GATE at Z = -800
    const cpGroup = new THREE.Group();
    const cpMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5
    });

    const cpLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 14), cpMat);
    cpLeft.position.set(-14, 7, 0);

    const cpRight = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 14), cpMat);
    cpRight.position.set(14, 7, 0);

    const cpHeader = new THREE.Mesh(new THREE.BoxGeometry(28, 1.2, 1.2), cpMat);
    cpHeader.position.set(0, 13.5, 0);

    // Scanner beam curtain
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(new THREE.PlaneGeometry(26, 12), beamMat);
    beamMesh.position.set(0, 6, 0);

    cpGroup.add(cpLeft, cpRight, cpHeader, beamMesh);
    const cpPos = new THREE.Vector3(0, 2.0, -800);
    cpGroup.position.copy(cpPos);
    this.group.add(cpGroup);

    this.checkpoint = {
      position: cpPos,
      mesh: cpGroup,
      activated: false
    };
  }

  private buildDiscoveryPoints() {
    // Tron Memory Core Landmark at Z = -500
    const crystalGroup = new THREE.Group();
    const coreGeo = new THREE.OctahedronGeometry(2.8, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.0,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 4.0;

    crystalGroup.add(core);
    const pos = new THREE.Vector3(-38, 2.0, -500); // Left path discovery core
    crystalGroup.position.copy(pos);
    this.group.add(crystalGroup);

    this.discoveryPoints.push({
      id: 'point_tron_core',
      name: 'Tron System Core',
      position: pos,
      mesh: crystalGroup,
      memoryTitle: 'Digital Grid Archives',
      memoryText: 'Lumi accessed the Grid Archives! "High speed and rapid agility open pathways through the digital realm!"',
      discovered: false
    });
  }

  private buildResourceNodes() {
    const essenceGeo = new THREE.OctahedronGeometry(0.45, 0);
    const essenceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9
    });

    for (let z = 0; z >= -1700; z -= 45) {
      const h = this.getGroundHeight(0, z);
      if (h > -5.0) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(essenceGeo, essenceMat);
        m.position.y = 0.8;
        g.add(m);

        const pos = new THREE.Vector3(0, h + 0.2, z);
        g.position.copy(pos);
        this.group.add(g);

        this.resourceNodes.push({
          id: `res_essence_${z}`,
          type: 'essence',
          name: '✨ Solander Data Essence',
          position: pos,
          mesh: g,
          collected: false
        });
      }
    }
  }

  private buildTrialPedestal() {
    const group = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.6, 16);
    const baseMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;

    group.add(base);
    const pos = new THREE.Vector3(-12, 0, -120);
    group.position.copy(pos);
    this.group.add(group);

    this.trialPedestal = { position: pos, mesh: group };
  }

  public spawnVoidEnemies() {
    const enemyZList = [
      -180, -380, -550, -840, -1120, -1450, -1650
    ];

    const bodyGeo = new THREE.OctahedronGeometry(0.9, 0);
    const bodyMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.0
    });

    enemyZList.forEach((z, idx) => {
      const h = this.getGroundHeight(0, z);
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;

      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0.95, 0.65);

      g.add(body, eye);

      const pos = new THREE.Vector3(idx % 2 === 0 ? -6 : 6, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.enemies.push({
        id: `void_sentinel_${idx}`,
        position: pos,
        velocity: new THREE.Vector3(),
        mesh: g,
        hp: 2,
        maxHp: 2,
        alive: true,
        eyeMesh: eye
      });
    });
  }

  public update(time: number) {
    this.resourceNodes.forEach((node, i) => {
      if (!node.collected) {
        node.mesh.position.y = node.position.y + Math.sin(time * 3 + i) * 0.12;
        node.mesh.rotation.y += 0.025;
      }
    });

    this.enemies.forEach((enemy, i) => {
      if (enemy.alive) {
        enemy.mesh.position.y = enemy.position.y + Math.sin(time * 4 + i) * 0.14;
        enemy.mesh.rotation.y = Math.sin(time * 1.5 + i) * 0.5;
      }
    });

    this.speedRings.forEach(ring => {
      if (!ring.collected) {
        ring.mesh.rotation.y += 0.04;
      }
    });

    if (this.goalRing && this.goalRing.mesh) {
      this.goalRing.mesh.rotation.y += 0.03;
    }
  }

  private buildSonicCourse() {
    // 1. DASH PANELS
    const arrowGeo = new THREE.ConeGeometry(0.9, 2.0, 3);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2
    });
    const panelBaseGeo = new THREE.BoxGeometry(2.4, 0.1, 3.0);
    const panelBaseMat = new THREE.MeshToonMaterial({ color: 0x0f172a });

    const dashZList = [-80, -320, -520, -740, -1020, -1250, -1620];

    dashZList.forEach((z, idx) => {
      const h = this.getGroundHeight(0, z);
      const g = new THREE.Group();
      const base = new THREE.Mesh(panelBaseGeo, panelBaseMat);
      base.position.y = 0.05;
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0, 0.14, 0);

      g.add(base, arrow);

      const pos = new THREE.Vector3(0, h + 0.05, z);
      g.position.copy(pos);
      this.group.add(g);

      this.dashPanels.push({
        id: `dash_panel_${idx}`,
        position: pos,
        directionAngle: Math.PI,
        mesh: g,
        cooldowned: false
      });
    });

    // 2. SPRING LAUNCH PADS
    const coilGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.45, 16);
    const coilMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.2 });
    const topCapGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.1, 16);
    const topCapMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.8 });

    const springZList = [-420, -1180, -1480];

    springZList.forEach((z, idx) => {
      const h = this.getGroundHeight(0, z);
      const g = new THREE.Group();
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.y = 0.22;
      const cap = new THREE.Mesh(topCapGeo, topCapMat);
      cap.position.y = 0.45;

      g.add(coil, cap);
      const pos = new THREE.Vector3(0, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.springPads.push({
        id: `spring_pad_${idx}`,
        position: pos,
        upwardForce: 38,
        forwardSpeed: 32,
        mesh: g,
        cooldowned: false
      });
    });

    // 3. SPEED RINGS
    const ringGeo = new THREE.TorusGeometry(0.8, 0.12, 12, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1
    });

    for (let z = 0; z >= -1680; z -= 25) {
      const h = this.getGroundHeight(0, z);
      if (h > -5.0) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(ringGeo, ringMat);
        g.add(ring);

        const pos = new THREE.Vector3(0, h + 1.5, z);
        g.position.copy(pos);
        this.group.add(g);

        this.speedRings.push({
          id: `speed_ring_${z}`,
          position: pos,
          collected: false,
          mesh: g
        });
      }
    }

    // 4. TRON GOAL PORTAL AT FINISH LINE (Z = -1700)
    const goalGroup = new THREE.Group();
    const goalRingGeo = new THREE.TorusGeometry(3.5, 0.4, 16, 32);
    const goalRingMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
      metalness: 0.9,
      roughness: 0.1
    });
    const goalMesh = new THREE.Mesh(goalRingGeo, goalRingMat);
    goalMesh.position.y = 4.0;

    const baseGeo = new THREE.CylinderGeometry(3.0, 3.8, 1.2, 16);
    const baseMat = new THREE.MeshToonMaterial({ color: 0x0f172a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.6;

    goalGroup.add(base, goalMesh);

    const goalPos = new THREE.Vector3(0, 4.0, -1700);
    goalGroup.position.copy(goalPos);
    this.group.add(goalGroup);

    this.goalRing = {
      position: goalPos,
      mesh: goalGroup,
      activated: false
    };
  }
}
