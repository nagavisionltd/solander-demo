import * as THREE from 'three';
import { MYSTIC_VALLEY, GAME_LOOP } from '../constants';

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
      color: MYSTIC_VALLEY.TRON_BASE_COLOR,
      roughness: MYSTIC_VALLEY.TRON_ROUGHNESS,
      metalness: MYSTIC_VALLEY.TRON_METALNESS
    });

    // Neon Edge Materials
    const cyanLightMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.TRON_CYAN_LIGHT,
      emissive: MYSTIC_VALLEY.TRON_CYAN_LIGHT,
      emissiveIntensity: MYSTIC_VALLEY.TRON_EMISSIVE_INTENSITY
    });
    const magentaLightMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.TRON_MAGENTA_LIGHT,
      emissive: MYSTIC_VALLEY.TRON_MAGENTA_LIGHT,
      emissiveIntensity: MYSTIC_VALLEY.TRON_EMISSIVE_INTENSITY
    });
    const amberLightMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.TRON_AMBER_LIGHT,
      emissive: MYSTIC_VALLEY.TRON_AMBER_LIGHT,
      emissiveIntensity: MYSTIC_VALLEY.TRON_EMISSIVE_INTENSITY
    });
    const emeraldLightMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.TRON_EMERALD_LIGHT,
      emissive: MYSTIC_VALLEY.TRON_EMERALD_LIGHT,
      emissiveIntensity: MYSTIC_VALLEY.TRON_EMISSIVE_INTENSITY
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
      const slabGeo = new THREE.BoxGeometry(width, MYSTIC_VALLEY.TRON_FLOOR_THICKNESS, length);
      const slab = new THREE.Mesh(slabGeo, darkFloorMat);
      slab.receiveShadow = true;
      group.add(slab);

      // Glowing Side Light Strips
      const railGeo = new THREE.BoxGeometry(MYSTIC_VALLEY.TRON_RAIL_WIDTH, MYSTIC_VALLEY.TRON_RAIL_HEIGHT, length);
      const leftRail = new THREE.Mesh(railGeo, lightMat);
      leftRail.position.set(-width / 2 + MYSTIC_VALLEY.TRON_RAIL_WIDTH / 2, MYSTIC_VALLEY.TRON_RAIL_HEIGHT / 2 - 0.1, 0);

      const rightRail = new THREE.Mesh(railGeo, lightMat);
      rightRail.position.set(width / 2 - MYSTIC_VALLEY.TRON_RAIL_WIDTH / 2, MYSTIC_VALLEY.TRON_RAIL_HEIGHT / 2 - 0.1, 0);

      group.add(leftRail, rightRail);
      group.position.set(posX, posY, posZ);
      this.group.add(group);
    };

    // 1. START HIGHWAY (Z = TRON_START_Z to TRON_FORK1_START_Z)
    createTronSegment(MYSTIC_VALLEY.TRON_TRACK_WIDTH_START, 240, 0, -0.2, -100, cyanLightMat);

    // 2. FORK 1 BRANCHES (Z = TRON_FORK1_START_Z to TRON_FORK1_END_Z)
    // Left Path (Magenta Light Rails)
    for (let z = MYSTIC_VALLEY.TRON_FORK1_START_Z - 30; z >= MYSTIC_VALLEY.TRON_FORK1_END_Z + 30; z -= MYSTIC_VALLEY.TRON_SEGMENT_SPACING) {
      let x = -MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;
      if (z > MYSTIC_VALLEY.TRON_FORK1_START_Z + 60) x = ((MYSTIC_VALLEY.TRON_FORK1_START_Z + 30 - z) / 60) * -MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;
      else if (z < MYSTIC_VALLEY.TRON_FORK1_END_Z + 90) x = -MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE + ((MYSTIC_VALLEY.TRON_FORK1_END_Z + 90 - z) / 60) * MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;

      const y = Math.sin((z + 220) * 0.01) * 2.5;
      createTronSegment(MYSTIC_VALLEY.TRON_LANE_WIDTH, MYSTIC_VALLEY.TRON_SEGMENT_LENGTH, x, y - 0.2, z, magentaLightMat);
    }

    // Right Path (Amber Light Rails)
    for (let z = MYSTIC_VALLEY.TRON_FORK1_START_Z - 30; z >= MYSTIC_VALLEY.TRON_FORK1_END_Z + 30; z -= MYSTIC_VALLEY.TRON_SEGMENT_SPACING) {
      let x = MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;
      if (z > MYSTIC_VALLEY.TRON_FORK1_START_Z + 60) x = ((MYSTIC_VALLEY.TRON_FORK1_START_Z + 30 - z) / 60) * MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;
      else if (z < MYSTIC_VALLEY.TRON_FORK1_END_Z + 90) x = MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE + ((MYSTIC_VALLEY.TRON_FORK1_END_Z + 90 - z) / 60) * -MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE;

      const y = Math.cos((z + 220) * 0.01) * 2.5;
      createTronSegment(MYSTIC_VALLEY.TRON_LANE_WIDTH, MYSTIC_VALLEY.TRON_SEGMENT_LENGTH, x, y - 0.2, z, amberLightMat);
    }

    // 3. CHECKPOINT HIGHWAY (Z = TRON_FORK1_END_Z to TRON_FORK2_START_Z)
    createTronSegment(MYSTIC_VALLEY.TRON_TRACK_WIDTH_CHECKPOINT, 240, 0, 1.8, -800, cyanLightMat);

    // 4. FORK 2 BRANCHES (Z = TRON_FORK2_START_Z to TRON_FORK2_END_Z)
    // Short Path (Left Branch - High-Speed Cyan Light Rails)
    for (let z = MYSTIC_VALLEY.TRON_FORK2_START_Z - 30; z >= MYSTIC_VALLEY.TRON_FORK2_END_Z + 260; z -= MYSTIC_VALLEY.TRON_SEGMENT_SPACING) {
      let x = MYSTIC_VALLEY.TRON_SHORT_PATH_X;
      if (z > MYSTIC_VALLEY.TRON_FORK2_START_Z + 60) x = ((MYSTIC_VALLEY.TRON_FORK2_START_Z + 30 - z) / 60) * MYSTIC_VALLEY.TRON_SHORT_PATH_X;
      else if (z < MYSTIC_VALLEY.TRON_FORK2_END_Z + 260) x = MYSTIC_VALLEY.TRON_SHORT_PATH_X + ((MYSTIC_VALLEY.TRON_FORK2_END_Z + 260 - z) / 60) * -MYSTIC_VALLEY.TRON_SHORT_PATH_X;

      const y = 2.0 + Math.sin((z + 920) * 0.015) * 3.5;
      createTronSegment(MYSTIC_VALLEY.TRON_SHORT_LANE_WIDTH, MYSTIC_VALLEY.TRON_SEGMENT_LENGTH, x, y - 0.2, z, cyanLightMat);
    }

    // Long Path (Right Branch - Emerald Scenic Curve)
    for (let z = MYSTIC_VALLEY.TRON_FORK2_START_Z - 30; z >= MYSTIC_VALLEY.TRON_FORK2_END_Z - 30; z -= MYSTIC_VALLEY.TRON_SEGMENT_SPACING) {
      let x = MYSTIC_VALLEY.TRON_LONG_PATH_MAX_X * Math.sin(((-920 - z) / 600.0) * Math.PI);
      if (z > MYSTIC_VALLEY.TRON_FORK2_START_Z + 60) x = ((MYSTIC_VALLEY.TRON_FORK2_START_Z + 30 - z) / 60) * 45;
      else if (z < MYSTIC_VALLEY.TRON_FORK2_END_Z + 60) x = 45 * (1 - (MYSTIC_VALLEY.TRON_FORK2_END_Z + 60 - z) / 60);

      const y = 2.0 + Math.cos((z + 920) * 0.01) * 3.0;
      createTronSegment(MYSTIC_VALLEY.TRON_LONG_LANE_WIDTH, MYSTIC_VALLEY.TRON_SEGMENT_LENGTH, x, y - 0.2, z, emeraldLightMat);
    }

    // 5. GOAL HIGHWAY (Z = TRON_FORK2_END_Z to TRON_END_Z)
    createTronSegment(MYSTIC_VALLEY.TRON_TRACK_WIDTH_GOAL, 240, 0, 3.8, -1700, cyanLightMat);
  }

  private buildOriginalValleyTerrain() {
    const canyonMat = new THREE.MeshToonMaterial({ color: MYSTIC_VALLEY.VALLEY_CANYON_COLOR });
    const crystalRimMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.VALLEY_CRYSTAL_COLOR,
      emissive: MYSTIC_VALLEY.VALLEY_CRYSTAL_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.VALLEY_CRYSTAL_EMISSIVE_INTENSITY
    });

    // Build serpentine valley track from VALLEY_START_Z to VALLEY_END_Z
    for (let z = MYSTIC_VALLEY.VALLEY_START_Z; z >= MYSTIC_VALLEY.VALLEY_END_Z; z -= MYSTIC_VALLEY.VALLEY_SEGMENT_SPACING) {
      const dist = Math.max(0, -z);
      const centerX = Math.sin(dist * 0.008) * 45.0 + Math.sin(dist * 0.02) * 20.0;
      const centerY = Math.sin(dist * 0.006) * 12.0 + Math.cos(dist * 0.015) * 6.0;

      const segGeo = new THREE.BoxGeometry(MYSTIC_VALLEY.VALLEY_TRACK_WIDTH, MYSTIC_VALLEY.VALLEY_TRACK_HEIGHT, MYSTIC_VALLEY.VALLEY_SEGMENT_LENGTH);
      const seg = new THREE.Mesh(segGeo, canyonMat);
      seg.position.set(centerX, centerY - 1.0, z);
      seg.receiveShadow = true;
      this.group.add(seg);

      // Bioluminescent Crystal Border Rails along path edges
      [-MYSTIC_VALLEY.VALLEY_CRYSTAL_RIM_OFFSET, MYSTIC_VALLEY.VALLEY_CRYSTAL_RIM_OFFSET].forEach(offset => {
        const borderGeo = new THREE.BoxGeometry(MYSTIC_VALLEY.VALLEY_CRYSTAL_RIM_WIDTH, MYSTIC_VALLEY.VALLEY_CRYSTAL_RIM_HEIGHT, MYSTIC_VALLEY.VALLEY_SEGMENT_LENGTH);
        const border = new THREE.Mesh(borderGeo, crystalRimMat);
        border.position.set(centerX + offset, centerY + 0.6, z);
        this.group.add(border);
      });
    }
  }

  private buildOriginalValleyScenery() {
    // Bioluminescent Valley Scenery (Crystal Trees, Glowing Minerals, Sky Islands)
    const treeTrunkMat = new THREE.MeshToonMaterial({ color: MYSTIC_VALLEY.VALLEY_TREE_TRUNK_COLOR });
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.VALLEY_TREE_FOLIAGE_COLOR,
      emissive: MYSTIC_VALLEY.VALLEY_TREE_FOLIAGE_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.VALLEY_TREE_FOLIAGE_EMISSIVE_INTENSITY
    });

    for (let z = MYSTIC_VALLEY.VALLEY_START_Z; z >= MYSTIC_VALLEY.VALLEY_END_Z + 100; z -= MYSTIC_VALLEY.VALLEY_TREE_SPACING) {
      const dist = Math.max(0, -z);
      const centerX = Math.sin(dist * 0.008) * 45.0 + Math.sin(dist * 0.02) * 20.0;
      const centerY = Math.sin(dist * 0.006) * 12.0 + Math.cos(dist * 0.015) * 6.0;

      [-MYSTIC_VALLEY.VALLEY_TREE_SIDE_OFFSET, MYSTIC_VALLEY.VALLEY_TREE_SIDE_OFFSET].forEach(side => {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(
            MYSTIC_VALLEY.VALLEY_TREE_TRUNK_RADIUS_TOP,
            MYSTIC_VALLEY.VALLEY_TREE_TRUNK_RADIUS_BOTTOM,
            MYSTIC_VALLEY.VALLEY_TREE_TRUNK_HEIGHT,
            8
          ),
          treeTrunkMat
        );
        trunk.position.y = MYSTIC_VALLEY.VALLEY_TREE_TRUNK_HEIGHT / 2;
        const foliage = new THREE.Mesh(
          new THREE.IcosahedronGeometry(MYSTIC_VALLEY.VALLEY_TREE_FOLIAGE_RADIUS, 1),
          treeFoliageMat
        );
        foliage.position.y = MYSTIC_VALLEY.VALLEY_TREE_TRUNK_HEIGHT + MYSTIC_VALLEY.VALLEY_TREE_FOLIAGE_RADIUS / 2;

        treeGroup.add(trunk, foliage);
        treeGroup.position.set(centerX + side, centerY, z);
        this.group.add(treeGroup);
      });
    }
  }

  private buildTronSceneryAndArches() {
    // 1. Digital Wireframe Cyber Pillars along the void sides
    const pillarGeo = new THREE.BoxGeometry(
      MYSTIC_VALLEY.TRON_PILLAR_WIDTH,
      MYSTIC_VALLEY.TRON_PILLAR_HEIGHT,
      MYSTIC_VALLEY.TRON_PILLAR_WIDTH
    );
    const pillarMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.TRON_WIREFRAME_COLOR,
      emissive: MYSTIC_VALLEY.TRON_WIREFRAME_COLOR,
      emissiveIntensity: 0.6,
      wireframe: true
    });

    for (let z = MYSTIC_VALLEY.TRON_START_Z; z >= MYSTIC_VALLEY.TRON_END_Z + 20; z -= MYSTIC_VALLEY.TRON_PILLAR_SPACING) {
      [-MYSTIC_VALLEY.TRON_PILLAR_SIDE_OFFSET, MYSTIC_VALLEY.TRON_PILLAR_SIDE_OFFSET].forEach(sideX => {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(sideX, MYSTIC_VALLEY.TRON_PILLAR_HEIGHT / 3, z);
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

      const leftPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, MYSTIC_VALLEY.TRON_ARCHWAY_PILLAR_HEIGHT),
        pillarMat
      );
      leftPillar.position.set(-MYSTIC_VALLEY.TRON_ARCHWAY_WIDTH / 2, MYSTIC_VALLEY.TRON_ARCHWAY_PILLAR_HEIGHT / 2, 0);

      const rightPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, MYSTIC_VALLEY.TRON_ARCHWAY_PILLAR_HEIGHT),
        pillarMat
      );
      rightPillar.position.set(MYSTIC_VALLEY.TRON_ARCHWAY_WIDTH / 2, MYSTIC_VALLEY.TRON_ARCHWAY_PILLAR_HEIGHT / 2, 0);

      const headerBar = new THREE.Mesh(
        new THREE.BoxGeometry(MYSTIC_VALLEY.TRON_ARCHWAY_WIDTH, 0.6, 0.6),
        pillarMat
      );
      headerBar.position.set(0, MYSTIC_VALLEY.TRON_ARCHWAY_HEADER_HEIGHT, 0);

      group.add(leftPillar, rightPillar, headerBar);
      group.position.set(x, y, z);
      this.group.add(group);
    };

    // Spawn Tron Archways at key junctions
    createArchway(10, 0, 0, MYSTIC_VALLEY.TRON_CYAN_LIGHT, 'START LINE');
    createArchway(MYSTIC_VALLEY.TRON_FORK1_START_Z - 10, 0, 0, MYSTIC_VALLEY.TRON_MAGENTA_LIGHT, 'FORK 1: LEFT vs RIGHT');
    createArchway(MYSTIC_VALLEY.TRON_FORK2_START_Z + 10, 0, 2, MYSTIC_VALLEY.TRON_EMERALD_LIGHT, 'FORK 2: SHORT vs LONG');

    // 3. TRON CHECKPOINT GATE at Z = -800
    const cpGroup = new THREE.Group();
    const cpMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.CHECKPOINT_COLOR,
      emissive: MYSTIC_VALLEY.CHECKPOINT_COLOR,
      emissiveIntensity: 1.5
    });

    const cpLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_RADIUS,
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_RADIUS,
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_HEIGHT
      ),
      cpMat
    );
    cpLeft.position.set(-MYSTIC_VALLEY.CHECKPOINT_WIDTH / 2, MYSTIC_VALLEY.CHECKPOINT_PILLAR_HEIGHT / 2, 0);

    const cpRight = new THREE.Mesh(
      new THREE.CylinderGeometry(
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_RADIUS,
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_RADIUS,
        MYSTIC_VALLEY.CHECKPOINT_PILLAR_HEIGHT
      ),
      cpMat
    );
    cpRight.position.set(MYSTIC_VALLEY.CHECKPOINT_WIDTH / 2, MYSTIC_VALLEY.CHECKPOINT_PILLAR_HEIGHT / 2, 0);

    const cpHeader = new THREE.Mesh(
      new THREE.BoxGeometry(MYSTIC_VALLEY.CHECKPOINT_WIDTH, 1.2, 1.2),
      cpMat
    );
    cpHeader.position.set(0, MYSTIC_VALLEY.CHECKPOINT_HEADER_HEIGHT, 0);

    // Scanner beam curtain
    const beamMat = new THREE.MeshBasicMaterial({
      color: MYSTIC_VALLEY.CHECKPOINT_BEAM_COLOR,
      transparent: true,
      opacity: MYSTIC_VALLEY.TRON_CHECKPOINT_BEAM_OPACITY,
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
    const coreGeo = new THREE.OctahedronGeometry(MYSTIC_VALLEY.DISCOVERY_POINT_CORE_RADIUS, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.DISCOVERY_POINT_CORE_COLOR,
      emissive: MYSTIC_VALLEY.DISCOVERY_POINT_CORE_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.DISCOVERY_POINT_CORE_EMISSIVE_INTENSITY,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 4.0;

    crystalGroup.add(core);
    const pos = new THREE.Vector3(-MYSTIC_VALLEY.TRON_FORK1_SPLIT_DISTANCE, 2.0, -500); // Left path discovery core
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
    const essenceGeo = new THREE.OctahedronGeometry(MYSTIC_VALLEY.RESOURCE_ESSENCE_SIZE, 0);
    const essenceMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.RESOURCE_ESSENCE_COLOR,
      emissive: MYSTIC_VALLEY.RESOURCE_ESSENCE_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.RESOURCE_ESSENCE_EMISSIVE_INTENSITY
    });

    for (let z = MYSTIC_VALLEY.VALLEY_START_Z; z >= MYSTIC_VALLEY.TRON_END_Z + 120; z -= MYSTIC_VALLEY.RESOURCE_SPAWN_SPACING) {
      const h = this.getGroundHeight(0, z);
      if (h > -5.0) {
        const g = new THREE.Group();
        const m = new THREE.Mesh(essenceGeo, essenceMat);
        m.position.y = MYSTIC_VALLEY.RESOURCE_HEIGHT_OFFSET;
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
    const baseGeo = new THREE.CylinderGeometry(
      MYSTIC_VALLEY.TRIAL_PEDESTAL_RADIUS,
      MYSTIC_VALLEY.TRIAL_PEDESTAL_RADIUS + 0.4,
      0.6,
      16
    );
    const baseMat = new THREE.MeshToonMaterial({ color: MYSTIC_VALLEY.TRIAL_PEDESTAL_COLOR });
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

    const bodyGeo = new THREE.OctahedronGeometry(MYSTIC_VALLEY.ENEMY_BODY_RADIUS, 0);
    const bodyMat = new THREE.MeshToonMaterial({ color: MYSTIC_VALLEY.ENEMY_COLOR });
    const eyeGeo = new THREE.SphereGeometry(MYSTIC_VALLEY.ENEMY_EYE_RADIUS, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.ENEMY_EYE_COLOR,
      emissive: MYSTIC_VALLEY.ENEMY_EYE_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.ENEMY_EYE_EMISSIVE_INTENSITY
    });

    enemyZList.forEach((z, idx) => {
      const h = this.getGroundHeight(0, z);
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = MYSTIC_VALLEY.ENEMY_BODY_RADIUS;

      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, MYSTIC_VALLEY.ENEMY_EYE_RADIUS + 0.05, 0.65);

      g.add(body, eye);

      const pos = new THREE.Vector3(idx % 2 === 0 ? -6 : 6, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.enemies.push({
        id: `void_sentinel_${idx}`,
        position: pos,
        velocity: new THREE.Vector3(),
        mesh: g,
        hp: MYSTIC_VALLEY.ENEMY_HP_BASE - 1,
        maxHp: MYSTIC_VALLEY.ENEMY_HP_BASE - 1,
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
    const arrowGeo = new THREE.ConeGeometry(0.9, MYSTIC_VALLEY.DASH_PANEL_LENGTH / 2, 3);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.DASH_PANEL_ARROW_COLOR,
      emissive: MYSTIC_VALLEY.DASH_PANEL_GLOW_COLOR,
      emissiveIntensity: 1.2
    });
    const panelBaseGeo = new THREE.BoxGeometry(MYSTIC_VALLEY.DASH_PANEL_WIDTH, MYSTIC_VALLEY.DASH_PANEL_HEIGHT, MYSTIC_VALLEY.DASH_PANEL_LENGTH);
    const panelBaseMat = new THREE.MeshToonMaterial({ color: 0x0f172a });

    const dashZList = [-80, -320, -520, -740, -1020, -1250, -1620];

    dashZList.forEach((z, idx) => {
      const h = this.getGroundHeight(0, z);
      const g = new THREE.Group();
      const base = new THREE.Mesh(panelBaseGeo, panelBaseMat);
      base.position.y = MYSTIC_VALLEY.DASH_PANEL_HEIGHT / 2;
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(0, MYSTIC_VALLEY.DASH_PANEL_HEIGHT + 0.04, 0);

      g.add(base, arrow);

      const pos = new THREE.Vector3(0, h + MYSTIC_VALLEY.DASH_PANEL_HEIGHT / 2, z);
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
    const coilGeo = new THREE.CylinderGeometry(
      MYSTIC_VALLEY.SPRING_PAD_RADIUS - 0.1,
      MYSTIC_VALLEY.SPRING_PAD_RADIUS,
      0.45,
      16
    );
    const coilMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.SPRING_PAD_COLOR,
      roughness: 0.2
    });
    const topCapGeo = new THREE.CylinderGeometry(
      MYSTIC_VALLEY.SPRING_PAD_RADIUS,
      MYSTIC_VALLEY.SPRING_PAD_RADIUS,
      0.1,
      16
    );
    const topCapMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.SPRING_PAD_RING_COLOR,
      emissive: 0xca8a04,
      emissiveIntensity: 0.8
    });

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
        upwardForce: MYSTIC_VALLEY.SPRING_PAD_UPWARD_FORCE,
        forwardSpeed: MYSTIC_VALLEY.SPRING_PAD_FORWARD_SPEED,
        mesh: g,
        cooldowned: false
      });
    });

    // 3. SPEED RINGS
    const ringGeo = new THREE.TorusGeometry(
      MYSTIC_VALLEY.SPEED_RING_RADIUS,
      MYSTIC_VALLEY.SPEED_RING_TUBE_RADIUS,
      12,
      24
    );
    const ringMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.SPEED_RING_COLOR,
      emissive: MYSTIC_VALLEY.SPEED_RING_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.SPEED_RING_EMISSIVE_INTENSITY,
      metalness: 0.9,
      roughness: 0.1
    });

    for (let z = MYSTIC_VALLEY.VALLEY_START_Z; z >= MYSTIC_VALLEY.TRON_END_Z + 140; z -= 25) {
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
    const goalRingGeo = new THREE.TorusGeometry(
      MYSTIC_VALLEY.GOAL_RING_RADIUS,
      0.4,
      16,
      32
    );
    const goalRingMat = new THREE.MeshStandardMaterial({
      color: MYSTIC_VALLEY.GOAL_RING_COLOR,
      emissive: MYSTIC_VALLEY.GOAL_RING_EMISSIVE,
      emissiveIntensity: MYSTIC_VALLEY.GOAL_RING_EMISSIVE_INTENSITY,
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
