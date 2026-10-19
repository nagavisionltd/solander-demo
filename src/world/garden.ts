import * as THREE from 'three';
import { GARDEN, GARDEN_EXTENDED, RENDERING } from '../constants';

export interface SolanderEggMesh {
  id: string;
  mesh: THREE.Group;
  hatched: boolean;
  name: string;
}

export interface PalmFruit {
  id: string;
  mesh: THREE.Group;
  initialLocalPos: THREE.Vector3;
  worldPos: THREE.Vector3;
  velocity: THREE.Vector3;
  isDropped: boolean;
  dropInterval: number;
  dropTimer: number;
  respawnTimer: number;
  floorY: number;
  parentTree: THREE.Group;
}

export class SolanderGardenWorld {
  public group: THREE.Group;
  public eggs: SolanderEggMesh[] = [];
  public palmFruits: PalmFruit[] = [];
  private clouds: THREE.Group[] = [];
  private fireflies!: THREE.Points;
  private airborneSpores!: THREE.Points;
  private mistPuffs: THREE.Mesh[] = [];
  private waterfallMistParticles!: THREE.Points;
  private waterfallMistLight1!: THREE.PointLight;
  private waterfallMistLight2!: THREE.PointLight;
  private godRays: THREE.Mesh[] = [];
  public waterMesh!: THREE.Mesh;
  public smallWaterMesh!: THREE.Mesh;
  private waterfallStream!: THREE.Mesh;
  
  // Use constants for pool configuration
  public poolCenter: THREE.Vector3 = new THREE.Vector3(
    GARDEN.POOL_CENTER.x, 
    GARDEN.POOL_CENTER.y, 
    GARDEN.POOL_CENTER.z
  );
  public poolRadius: number = GARDEN.POOL_RADIUS;
  public smallPoolCenter: THREE.Vector3 = new THREE.Vector3(
    GARDEN.SMALL_POOL_CENTER.x,
    GARDEN.SMALL_POOL_CENTER.y,
    GARDEN.SMALL_POOL_CENTER.z
  );
  public smallPoolRadius: number = GARDEN.SMALL_POOL_RADIUS;

  constructor() {
    this.group = new THREE.Group();

    // Terrain & Environment
    this.buildTerrain();
    this.buildWaterFeature();
    this.buildPaths();
    this.buildClouds();
    this.buildFoliageAndProps();
    this.buildEggs();
    this.buildEtherealAtmosphere();

    // Fireflies using constants - optimized with instancing
    this.fireflies = this.createFireflies();
    this.group.add(this.fireflies);
  }
  
  /**
   * Create fireflies particle system using constants
   */
  private createFireflies(): THREE.Points {
    const particleGeo = new THREE.BufferGeometry();
    const count = GARDEN.FIREFLY_COUNT;
    const posArray = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * GARDEN_EXTENDED.FIREFLY_SPREAD;
      posArray[i + 1] = GARDEN_EXTENDED.FIREFLY_Y_MIN + Math.random() * (GARDEN_EXTENDED.FIREFLY_Y_MAX - GARDEN_EXTENDED.FIREFLY_Y_MIN);
      posArray[i + 2] = (Math.random() - 0.5) * GARDEN_EXTENDED.FIREFLY_SPREAD;
    }
    
    particleGeo.userData.basePositions = posArray.slice();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particleMat = new THREE.PointsMaterial({
      color: GARDEN_EXTENDED.FIREFLY_COLOR,
      size: GARDEN_EXTENDED.FIREFLY_SIZE,
      transparent: true,
      opacity: GARDEN_EXTENDED.FIREFLY_OPACITY,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Points(particleGeo, particleMat);
  }

  private buildEtherealAtmosphere() {
    // 1. VOLUMETRIC MIST PARTICLE SYSTEM AT WATERFALL BASE
    const mistCount = GARDEN_EXTENDED.MIST_COUNT;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    const mistScales = new Float32Array(mistCount);

    for (let i = 0; i < mistCount; i++) {
      const idx = i * 3;
      mistPos[idx] = (Math.random() - 0.5) * 5.8; // Spans width of waterfall base
      mistPos[idx + 1] = 0.1 + Math.random() * 3.6; // Vertical mist column
      mistPos[idx + 2] = -13.0 + (Math.random() - 0.5) * 3.2; // Base splash zone
      mistScales[i] = 0.6 + Math.random() * 0.9;
    }

    mistGeo.userData.basePositions = mistPos.slice();
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    // Soft particle canvas texture for volumetric glow
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.35, 'rgba(186, 230, 253, 0.75)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const softParticleTex = new THREE.CanvasTexture(canvas);

    const mistMat = new THREE.PointsMaterial({
      color: GARDEN_EXTENDED.MIST_COLOR,
      size: GARDEN_EXTENDED.MIST_SIZE,
      map: softParticleTex,
      transparent: true,
      opacity: GARDEN_EXTENDED.MIST_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.waterfallMistParticles = new THREE.Points(mistGeo, mistMat);
    this.group.add(this.waterfallMistParticles);

    // Interactive Celestial Point Lights at Base of Waterfall
    this.waterfallMistLight1 = new THREE.PointLight(0x38bdf8, 0.8, 12.0);
    this.waterfallMistLight1.position.set(0, 1.4, -12.8);
    this.group.add(this.waterfallMistLight1);

    this.waterfallMistLight2 = new THREE.PointLight(0xfef08a, 0.5, 9.0);
    this.waterfallMistLight2.position.set(-2.0, 2.0, -13.2);
    this.group.add(this.waterfallMistLight2);

    // Billowing Mist Mesh Puffs
    const puffGeo = new THREE.SphereGeometry(GARDEN_EXTENDED.MIST_PUFF_SIZE, 12, 12);
    const puffMat = new THREE.MeshStandardMaterial({
      color: GARDEN_EXTENDED.MIST_PUFF_COLOR,
      emissive: GARDEN_EXTENDED.MIST_PUFF_EMISSIVE,
      emissiveIntensity: GARDEN_EXTENDED.MIST_PUFF_EMISSIVE_INTENSITY,
      transparent: true,
      opacity: GARDEN_EXTENDED.MIST_PUFF_OPACITY,
      depthWrite: false
    });

    for (let i = 0; i < GARDEN_EXTENDED.MIST_PUFF_COUNT; i++) {
      // Each puff animates its own opacity, so it needs its own material instance.
      const puff = new THREE.Mesh(puffGeo, puffMat.clone());
      puff.position.set(
        (Math.random() - 0.5) * 5.2,
        0.1 + Math.random() * 2.8,
        -13.2 + (Math.random() - 0.5) * 3.0
      );
      puff.scale.setScalar(0.6 + Math.random() * 0.8);
      puff.userData = {
        baseX: puff.position.x,
        baseY: puff.position.y,
        baseZ: puff.position.z,
        baseScale: puff.scale.x,
        speed: 0.4 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2
      };
      this.group.add(puff);
      this.mistPuffs.push(puff);
    }

    // 2. VOLUMETRIC GOD RAYS / SKY LIGHT SHAFTS
    const rayGeo = new THREE.CylinderGeometry(0.8, 11.0, 42, 16, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: GARDEN_EXTENDED.GOD_RAY_COLOR,
      transparent: true,
      opacity: GARDEN_EXTENDED.GOD_RAY_OPACITY,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    const rayPositions = [
      { x: 0, y: 22.0, z: -12.2, rx: 0.12, rz: -0.05 },
      { x: -14.0, y: 22.0, z: -18.5, rx: 0.14, rz: 0.12 },
      { x: 14.0, y: 22.0, z: -16.2, rx: 0.08, rz: -0.14 },
      { x: 22.0, y: 20.0, z: 12.5, rx: 0.18, rz: -0.16 },
      { x: -22.0, y: 20.0, z: 14.5, rx: 0.16, rz: 0.18 },
      { x: -8.5, y: 24.0, z: 22.0, rx: 0.10, rz: -0.10 },
      { x: 10.5, y: 24.0, z: 24.0, rx: -0.10, rz: 0.12 }
    ];

    rayPositions.forEach((rp, idx) => {
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(rp.x, rp.y, rp.z);
      ray.rotation.set(rp.rx, 0, rp.rz);
      ray.userData = { index: idx };
      this.group.add(ray);
      this.godRays.push(ray);
    });

    // 3. AIRBORNE LIGHT SPORES & FAIRY WISPS (Sky / Zelda Lost Woods Style)
    const sporeCount = GARDEN_EXTENDED.SPORE_COUNT;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePos = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount * 3; i += 3) {
      sporePos[i] = (Math.random() - 0.5) * 100;
      sporePos[i + 1] = 0.2 + Math.random() * 12.0;
      sporePos[i + 2] = (Math.random() - 0.5) * 100;
    }
    sporeGeo.userData.basePositions = sporePos.slice();
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));

    const sporeMat = new THREE.PointsMaterial({
      color: GARDEN_EXTENDED.SPORE_COLOR,
      size: GARDEN_EXTENDED.SPORE_SIZE,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.airborneSpores = new THREE.Points(sporeGeo, sporeMat);
    this.group.add(this.airborneSpores);
  }

  public isPosInWater(x: number, z: number): boolean {
    const distToPool1 = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    const distToPool2 = Math.hypot(x - this.smallPoolCenter.x, z - this.smallPoolCenter.z);
    return (distToPool1 < this.poolRadius - 0.4) || (distToPool2 < this.smallPoolRadius - 0.4);
  }

  public getGroundHeight(x: number, z: number): number {
    const d = Math.hypot(x, z);
    if (d > 230) return -2.0; // Boundary cliff drop into sea

    // Winding Stone Stair Platforms to top of Waterfall Cliff
    if (x >= 3.0 && x <= 6.8 && z <= -10.0 && z >= -16.0) {
      if (z > -11.2) return 0.8;
      if (z > -12.6) return 1.6;
      if (z > -14.0) return 2.6;
      if (z > -15.2) return 3.6;
      return 4.6; // Top Stair Ledge
    }

    // Top Waterfall Lookout Ledge
    if (z <= -14.8 && Math.abs(x) < 3.5) {
      return 4.8;
    }

    // Central Waterfall Swimming Lake - Deep Pool (2.5x - 3x deeper!)
    const distToPool = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    if (distToPool < this.poolRadius) {
      return -2.8 - (this.poolRadius - distToPool) * 0.12;
    }

    // East Garden Tranquil Lotus Pool
    const distToSmallPool = Math.hypot(x - this.smallPoolCenter.x, z - this.smallPoolCenter.z);
    if (distToSmallPool < this.smallPoolRadius) {
      return -1.8 - (this.smallPoolRadius - distToSmallPool) * 0.1;
    }

    // Waterfall Cliff behind pool
    if (z < -13.5 && Math.abs(x) < 7) {
      return 4.5 + (-13.5 - z) * 0.8;
    }

    // Left Cavern Cliff Wall (Adventure Cave Opening on Left of Map)
    if (x <= -18.0 && x >= -38.0 && z >= 2.0 && z <= 18.0) {
      const distToCaveEntrance = Math.hypot(x - (-24.0), z - 10.0);
      if (distToCaveEntrance <= 4.2) {
        return 0.1; // Smooth cavern entrance threshold
      }
      return Math.min(8.5, 1.8 + Math.pow(Math.abs(x - (-24.0)) * 0.45, 1.8));
    }

    const h1 = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.5;
    const h2 = Math.sin(x * 0.09 + z * 0.06) * 0.6;
    return Math.max(0, h1 + h2);
  }

  private buildTerrain() {
    // Ground Mesh - Expanded 480x480 for massive exploration (4x area!)
    const geo = new THREE.PlaneGeometry(
      GARDEN_EXTENDED.TERRAIN_SIZE, 
      GARDEN_EXTENDED.TERRAIN_SIZE, 
      GARDEN_EXTENDED.TERRAIN_SEGMENTS, 
      GARDEN_EXTENDED.TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getGroundHeight(x, z));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshToonMaterial({ color: 0x86efac }); // Lush grass green
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.group.add(terrain);
  }

  private buildWaterFeature() {
    // 1. Central Massive Swimming Lake
    const poolWaterGeo = new THREE.CylinderGeometry(this.poolRadius, this.poolRadius, 0.15, 36);
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(poolWaterGeo, poolWaterMat);
    this.waterMesh.position.copy(this.poolCenter);
    this.group.add(this.waterMesh);

    // Lake Sand Shore Line Ring
    const shoreGeo = new THREE.RingGeometry(this.poolRadius - 0.2, this.poolRadius + 1.4, 36);
    const shoreMat = new THREE.MeshToonMaterial({ color: 0xfef08a, side: THREE.DoubleSide });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.rotation.x = Math.PI / 2;
    shore.position.set(this.poolCenter.x, 0.02, this.poolCenter.z);
    this.group.add(shore);

    // 2. East Garden Tranquil Lotus Pool
    const smallWaterGeo = new THREE.CylinderGeometry(this.smallPoolRadius, this.smallPoolRadius, 0.15, 28);
    const smallWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.08,
      transparent: true,
      opacity: 0.82
    });
    this.smallWaterMesh = new THREE.Mesh(smallWaterGeo, smallWaterMat);
    this.smallWaterMesh.position.copy(this.smallPoolCenter);
    this.group.add(this.smallWaterMesh);

    // Small Pool Sand Shore Ring
    const smallShoreGeo = new THREE.RingGeometry(this.smallPoolRadius - 0.2, this.smallPoolRadius + 1.2, 28);
    const smallShore = new THREE.Mesh(smallShoreGeo, shoreMat);
    smallShore.rotation.x = Math.PI / 2;
    smallShore.position.set(this.smallPoolCenter.x, 0.02, this.smallPoolCenter.z);
    this.group.add(smallShore);

    // Floating Lotus Lily Pads & Flowers on Both Pools - Using instanced rendering
    const padMat = new THREE.MeshToonMaterial({ color: GARDEN_EXTENDED.LILY_PAD_COLOR });
    const flowerMat = new THREE.MeshToonMaterial({ color: GARDEN_EXTENDED.FLOWER_COLOR });

    // Main lake lily pads using instancing for better performance
    const mainLilies = this.createInstancedLilyPads(
      GARDEN_EXTENDED.LILY_PAD_COUNT_MAIN,
      this.poolCenter,
      this.poolRadius,
      padMat,
      flowerMat
    );
    this.group.add(mainLilies.pads);
    if (mainLilies.flowers) {
      this.group.add(mainLilies.flowers);
    }

    // Small lotus pool lily pads
    const smallLilies = this.createInstancedLilyPads(
      GARDEN_EXTENDED.LILY_PAD_COUNT_SMALL,
      this.smallPoolCenter,
      this.smallPoolRadius,
      padMat,
      flowerMat
    );
    this.group.add(smallLilies.pads);
    if (smallLilies.flowers) {
      this.group.add(smallLilies.flowers);
    }

    // 2. High Rock Cliff Waterfall Centerpiece
    const cliffGroup = new THREE.Group();

    // Large Rock Formation
    const rockGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const rockMat = new THREE.MeshToonMaterial({ color: GARDEN_EXTENDED.ROCK_COLOR });

    const rock1 = new THREE.Mesh(rockGeo, rockMat);
    rock1.position.set(-3, 2.5, -15);
    rock1.scale.set(
      GARDEN_EXTENDED.ROCK_SCALE_X,
      GARDEN_EXTENDED.ROCK_SCALE_Y,
      GARDEN_EXTENDED.ROCK_SCALE_Z
    );

    const rock2 = new THREE.Mesh(rockGeo, rockMat);
    rock2.position.set(3, 2.5, -15);
    rock2.scale.set(
      GARDEN_EXTENDED.ROCK_SCALE_X,
      GARDEN_EXTENDED.ROCK_SCALE_Y,
      GARDEN_EXTENDED.ROCK_SCALE_Z
    );

    const rockCenter = new THREE.Mesh(rockGeo, rockMat);
    rockCenter.position.set(0, 3.2, -15.5);
    rockCenter.scale.set(2.2, 1.4, 1.0);

    cliffGroup.add(rock1, rock2, rockCenter);

    // Waterfall Animated Water Stream Sheet
    const fallGeo = new THREE.PlaneGeometry(
      GARDEN_EXTENDED.WATERFALL_WIDTH,
      GARDEN_EXTENDED.WATERFALL_HEIGHT,
      16, 16
    );
    const fallMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.waterfallStream = new THREE.Mesh(fallGeo, fallMat);
    this.waterfallStream.position.set(0, 2.2, -13.8);
    this.waterfallStream.rotation.x = 0.15;
    cliffGroup.add(this.waterfallStream);

    // Splash Foam Ring at base
    const foamGeo = new THREE.TorusGeometry(1.8, 0.25, 12, 24);
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.rotation.x = Math.PI / 2;
    foam.position.set(0, -0.1, -13.2);
    cliffGroup.add(foam);

    // 3. Winding Carved Stone Stair Platforms up the Waterfall Cliff
    const stairGeo = new THREE.BoxGeometry(2.2, 0.4, 1.4);
    const stairMat = new THREE.MeshToonMaterial({ color: 0x64748b });
    const mossMat = new THREE.MeshToonMaterial({ color: 0x4ade80 });

    const stairSteps = [
      { x: 4.5, y: 0.6, z: -10.6, rotY: 0.1 },
      { x: 5.4, y: 1.4, z: -11.9, rotY: 0.25 },
      { x: 5.8, y: 2.4, z: -13.3, rotY: 0.4 },
      { x: 4.8, y: 3.4, z: -14.6, rotY: -0.2 },
      { x: 2.2, y: 4.4, z: -15.2, rotY: -0.5 }
    ];

    stairSteps.forEach((s, idx) => {
      const step = new THREE.Mesh(stairGeo, stairMat);
      step.position.set(s.x, s.y, s.z);
      step.rotation.y = s.rotY;
      step.castShadow = true;
      step.receiveShadow = true;

      // Moss patch on top of step
      const patchGeo = new THREE.BoxGeometry(1.8, 0.05, 1.0);
      const patch = new THREE.Mesh(patchGeo, mossMat);
      patch.position.set(0, 0.21, 0);
      step.add(patch);

      cliffGroup.add(step);
    });

    // 4. Grand Dark Cave Hole Entrance Cut into Stone Cliff (Left Side x: -4.5, z: -14.2)
    const caveGroup = new THREE.Group();

    // Dark Obsidian Hole Arch Outer Rim
    const caveRimGeo = new THREE.TorusGeometry(2.4, 0.5, 12, 24, Math.PI);
    const caveRimMat = new THREE.MeshToonMaterial({ color: 0x1e293b });
    const caveRim = new THREE.Mesh(caveRimGeo, caveRimMat);
    caveRim.position.set(0, 0, 0);
    caveGroup.add(caveRim);

    // Deep Dark Portal Hole (Pitch black cylinder interior)
    const holeGeo = new THREE.CylinderGeometry(2.1, 2.1, 2.8, 24, 1, false, 0, Math.PI);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x020617 }); // Void black
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, 0, -1.0);
    caveGroup.add(hole);

    // Glowing Ancient Blue Rune Ring
    const runeRingGeo = new THREE.TorusGeometry(2.0, 0.08, 12, 24, Math.PI);
    const runeRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2
    });
    const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
    runeRing.position.set(0, 0, 0.1);
    caveGroup.add(runeRing);

    caveGroup.position.set(-4.5, 1.6, -14.2);
    cliffGroup.add(caveGroup);

    this.group.add(cliffGroup);

    // Wooden Swimming Pier / Dock extending into the Lake
    const dockGroup = new THREE.Group();
    const plankMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const poleMat = new THREE.MeshToonMaterial({ color: 0x451a03 });

    for (let p = 0; p < 6; p++) {
      const plankGeo = new THREE.BoxGeometry(2.4, 0.12, 0.6);
      const plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(0, 0.08, p * 0.7);
      plank.castShadow = true;
      dockGroup.add(plank);

      if (p % 2 === 0) {
        const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
        const lPost = new THREE.Mesh(postGeo, poleMat);
        lPost.position.set(-1.1, -0.5, p * 0.7);
        const rPost = new THREE.Mesh(postGeo, poleMat);
        rPost.position.set(1.1, -0.5, p * 0.7);
        dockGroup.add(lPost, rPost);
      }
    }
    dockGroup.position.set(0, 0, 3.5);
    this.group.add(dockGroup);
  }

  private buildPaths() {
    // Small cobblestone / dirt path tiles leading towards center & portal cave
    const stoneGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.08, 8);
    const stoneMat = new THREE.MeshToonMaterial({ color: 0xe2e8f0 });

    for (let i = -12; i <= 10; i += 1.8) {
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      const offsetX = Math.sin(i * 0.4) * 0.8;
      const height = this.getGroundHeight(offsetX, i) + 0.02;
      stone.position.set(offsetX, height, i);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      this.group.add(stone);
    }
  }

  private buildGardenToys() {
    // 1. Grand Piano
    const pianoGroup = new THREE.Group();
    const pianoBodyGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const pianoMat = new THREE.MeshToonMaterial({ color: 0x0f172a }); // Dark lacquer
    const pianoBody = new THREE.Mesh(pianoBodyGeo, pianoMat);
    pianoBody.position.y = 0.8;
    pianoGroup.add(pianoBody);

    // Keyboard
    const keyGeo = new THREE.BoxGeometry(1.3, 0.1, 0.35);
    const keyMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const keys = new THREE.Mesh(keyGeo, keyMat);
    keys.position.set(0, 0.85, 0.5);
    pianoGroup.add(keys);

    // Bench
    const benchGeo = new THREE.BoxGeometry(1.0, 0.45, 0.4);
    const benchMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.22, 1.0);
    pianoGroup.add(bench);

    const pianoH = this.getGroundHeight(6, 2);
    pianoGroup.position.set(6, pianoH, 2);
    this.group.add(pianoGroup);

    // 2. Water Slide winding into the pool
    const slideGroup = new THREE.Group();
    const ladderGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    const ladderMat = new THREE.MeshToonMaterial({ color: 0x38bdf8 });
    const leftPole = new THREE.Mesh(ladderGeo, ladderMat);
    leftPole.position.set(-0.6, 1.6, 0);
    const rightPole = new THREE.Mesh(ladderGeo, ladderMat);
    rightPole.position.set(0.6, 1.6, 0);
    slideGroup.add(leftPole, rightPole);

    // Slide Chute
    const chuteGeo = new THREE.CylinderGeometry(0.7, 0.7, 5.5, 16, 1, true, 0, Math.PI);
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2
    });
    const chute = new THREE.Mesh(chuteGeo, chuteMat);
    chute.rotation.x = -Math.PI / 3;
    chute.position.set(0, 1.6, -2.2);
    slideGroup.add(chute);

    slideGroup.position.set(-5, 0, -10);
    this.group.add(slideGroup);

    // 3. Bouncy Beach Ball
    const ballGeo = new THREE.SphereGeometry(0.45, 24, 24);
    const ballMat = new THREE.MeshToonMaterial({ color: 0xf43f5e }); // Red & White stripes
    const beachBall = new THREE.Mesh(ballGeo, ballMat);
    const ballH = this.getGroundHeight(-1, 4);
    beachBall.position.set(-1, ballH + 0.45, 4);
    beachBall.castShadow = true;
    this.group.add(beachBall);

    // 4. Nap Hammock
    const hammockGroup = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 2.5, 8);
    const postMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(-1.8, 1.25, 0);
    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(1.8, 1.25, 0);
    hammockGroup.add(post1, post2);

    // Cloth Net
    const netGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.2, 12, 1, true, 0, Math.PI);
    const netMat = new THREE.MeshToonMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const net = new THREE.Mesh(netGeo, netMat);
    net.rotation.z = Math.PI / 2;
    net.position.set(0, 0.6, 0);
    hammockGroup.add(net);

    const hammockH = this.getGroundHeight(9, -4);
    hammockGroup.position.set(9, hammockH, -4);
    this.group.add(hammockGroup);
  }

  private buildClouds() {
    const cloudMat = new THREE.MeshToonMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92
    });

    for (let i = 0; i < 16; i++) {
      const cloudGroup = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 4);

      for (let j = 0; j < puffCount; j++) {
        const r = 2.2 + Math.random() * 2.5;
        const puffGeo = new THREE.SphereGeometry(r, 12, 12);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(
          (j - puffCount / 2) * 2.4,
          Math.sin(j * 0.8) * 0.8,
          (Math.random() - 0.5) * 1.8
        );
        cloudGroup.add(puff);
      }

      const x = (Math.random() - 0.5) * 70;
      const y = 20 + Math.random() * 12;
      const z = (Math.random() - 0.5) * 70;
      cloudGroup.position.set(x, y, z);
      cloudGroup.scale.setScalar(0.7 + Math.random() * 0.8);
      cloudGroup.userData = { speed: 1.2 + Math.random() * 1.8 };

      this.group.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }

  private buildFoliageAndProps() {
    this.buildGardenToys();

    // 1. MAJESTIC TALL TREES (Taller trunks & multi-tier lush canopies!)
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x582f0e });
    const barkRingGeo = new THREE.CylinderGeometry(0.55, 0.75, 6.5, 10);
    const foliageColors = [0x15803d, 0x16a34a, 0x22c55e, 0x4ade80];

    const treePositions = [
      { x: -10, z: -8, height: 6.8 },
      { x: -15, z: 2, height: 7.2 },
      { x: 12, z: 10, height: 6.5 },
      { x: 14, z: -10, height: 7.5 },
      { x: -8, z: 15, height: 6.2 },
      { x: 10, z: -16, height: 7.0 },
      { x: -16, z: -14, height: 7.8 },
      { x: 16, z: 4, height: 6.6 },
      { x: -4, z: 18, height: 6.0 },
      { x: 18, z: -4, height: 7.4 }
    ];

    treePositions.forEach((p, tIdx) => {
      const tree = new THREE.Group();
      const h = this.getGroundHeight(p.x, p.z);

      // Trunk
      const trunk = new THREE.Mesh(barkRingGeo, trunkMat);
      trunk.position.y = p.height * 0.5;
      trunk.scale.set(1, p.height / 6.5, 1);
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 Multi-stage layered foliage caps
      const stages = [
        { y: p.height - 0.2, scale: 2.8, color: foliageColors[tIdx % 4] },
        { y: p.height + 1.8, scale: 2.2, color: foliageColors[(tIdx + 1) % 4] },
        { y: p.height + 3.4, scale: 1.5, color: foliageColors[(tIdx + 2) % 4] }
      ];

      stages.forEach(s => {
        const fGeo = new THREE.DodecahedronGeometry(s.scale, 1);
        const fMat = new THREE.MeshToonMaterial({ color: s.color });
        const foliage = new THREE.Mesh(fGeo, fMat);
        foliage.position.y = s.y;
        foliage.castShadow = true;
        tree.add(foliage);
      });

      tree.position.set(p.x, h, p.z);
      this.group.add(tree);
    });

    // 2. TROPICAL PALM TREES WITH DROPPING & REGENERATING FRUIT!
    const palmPositions = [
      { x: -8.5, z: -4.5 },
      { x: 8.5, z: -5.0 },
      { x: -9.0, z: -11.0 },
      { x: 9.5, z: -11.5 }
    ];

    const palmTrunkMat = new THREE.MeshToonMaterial({ color: 0x78350f });
    const palmLeafMat = new THREE.MeshToonMaterial({ color: 0x16a34a, side: THREE.DoubleSide });
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const starFruitMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, emissive: 0xca8a04, emissiveIntensity: 0.2 });

    palmPositions.forEach((p, pIdx) => {
      const palmGroup = new THREE.Group();
      const baseH = this.getGroundHeight(p.x, p.z);

      // Curved segmented trunk
      const trunkSegCount = 7;
      let currY = 0;
      for (let s = 0; s < trunkSegCount; s++) {
        const segGeo = new THREE.CylinderGeometry(0.35 - s * 0.02, 0.42 - s * 0.02, 1.0, 8);
        const seg = new THREE.Mesh(segGeo, palmTrunkMat);
        seg.position.set(Math.sin(s * 0.2) * 0.25, currY + 0.5, 0);
        seg.rotation.z = -s * 0.04;
        seg.castShadow = true;
        palmGroup.add(seg);
        currY += 0.92;
      }

      // Crown Palm Fronds (6 arching leaves)
      const frondGeo = new THREE.PlaneGeometry(0.8, 3.8, 4, 8);
      for (let f = 0; f < 7; f++) {
        const frond = new THREE.Mesh(frondGeo, palmLeafMat);
        const angle = (f / 7) * Math.PI * 2;
        frond.rotation.set(-0.6, angle, 0, 'YXZ');
        frond.position.set(Math.cos(angle) * 0.4, currY, Math.sin(angle) * 0.4);
        frond.castShadow = true;
        palmGroup.add(frond);
      }

      palmGroup.position.set(p.x, baseH, p.z);
      this.group.add(palmGroup);

      // 3-4 Fruits hanging underneath the palm leaves
      const fruitCount = 3 + (pIdx % 2);
      for (let fr = 0; fr < fruitCount; fr++) {
        const fruitGroup = new THREE.Group();
        const isCoconut = fr % 2 === 0;

        if (isCoconut) {
          const cocoGeo = new THREE.SphereGeometry(0.28, 12, 12);
          const coco = new THREE.Mesh(cocoGeo, coconutMat);
          coco.castShadow = true;
          fruitGroup.add(coco);
        } else {
          const starGeo = new THREE.OctahedronGeometry(0.32, 1);
          const star = new THREE.Mesh(starGeo, starFruitMat);
          star.castShadow = true;
          fruitGroup.add(star);
        }

        const angle = (fr / fruitCount) * Math.PI * 2;
        const localPos = new THREE.Vector3(
          Math.cos(angle) * 0.65,
          currY - 0.2,
          Math.sin(angle) * 0.65
        );
        fruitGroup.position.copy(localPos);
        palmGroup.add(fruitGroup);

        const worldPos = localPos.clone().add(palmGroup.position);

        this.palmFruits.push({
          id: `fruit_${pIdx}_${fr}`,
          mesh: fruitGroup,
          initialLocalPos: localPos.clone(),
          worldPos: worldPos.clone(),
          velocity: new THREE.Vector3(),
          isDropped: false,
          dropInterval: 8.0 + Math.random() * 16.0,
          dropTimer: Math.random() * 6.0,
          respawnTimer: 0,
          floorY: this.getGroundHeight(worldPos.x, worldPos.z) + 0.25,
          parentTree: palmGroup
        });
      }
    });

    // 3. ANCIENT NATURAL STRUCTURES & PLANTS
    // A. Ruined Ancient Mossy Stone Archway
    const archGroup = new THREE.Group();
    const pillarMat = new THREE.MeshToonMaterial({ color: 0x475569 });
    const mossCapMat = new THREE.MeshToonMaterial({ color: 0x22c55e });

    const leftPillarGeo = new THREE.BoxGeometry(0.9, 3.8, 0.9);
    const lPillar = new THREE.Mesh(leftPillarGeo, pillarMat);
    lPillar.position.set(-1.8, 1.9, 0);

    const rPillar = new THREE.Mesh(leftPillarGeo, pillarMat);
    rPillar.position.set(1.8, 1.9, 0);

    const lintelGeo = new THREE.BoxGeometry(4.8, 0.8, 1.1);
    const lintel = new THREE.Mesh(lintelGeo, pillarMat);
    lintel.position.set(0, 3.8, 0);

    const mossTopGeo = new THREE.BoxGeometry(5.0, 0.2, 1.3);
    const mossTop = new THREE.Mesh(mossTopGeo, mossCapMat);
    mossTop.position.set(0, 4.3, 0);

    archGroup.add(lPillar, rPillar, lintel, mossTop);
    const archH = this.getGroundHeight(-3, 3);
    archGroup.position.set(-3, archH, 3);
    archGroup.rotation.y = 0.35;
    this.group.add(archGroup);

    // B. Bioluminescent Giant Mushrooms
    const shroomGeo = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const shroomMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const stemGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.6, 8);
    const stemMat = new THREE.MeshToonMaterial({ color: 0xf8fafc });

    [
      { x: -11, z: 6, s: 1.2 },
      { x: -10, z: 7.2, s: 0.8 },
      { x: 11, z: -4, s: 1.4 },
      { x: 12.2, z: -3.2, s: 0.9 }
    ].forEach(sh => {
      const shroomGroup = new THREE.Group();
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.8;
      const cap = new THREE.Mesh(shroomGeo, shroomMat);
      cap.position.y = 1.5;
      shroomGroup.add(stem, cap);

      const h = this.getGroundHeight(sh.x, sh.z);
      shroomGroup.position.set(sh.x, h, sh.z);
      shroomGroup.scale.setScalar(sh.s);
      this.group.add(shroomGroup);
    });

    // C. Bamboo Grove
    const bambooStemGeo = new THREE.CylinderGeometry(0.12, 0.15, 5.5, 8);
    const bambooMat = new THREE.MeshToonMaterial({ color: 0x16a34a });
    for (let b = 0; b < 10; b++) {
      const bx = -13 + (b % 4) * 0.9 + Math.random() * 0.4;
      const bz = -10 + Math.floor(b / 4) * 1.1 + Math.random() * 0.4;
      const bh = this.getGroundHeight(bx, bz);

      const bamboo = new THREE.Mesh(bambooStemGeo, bambooMat);
      bamboo.position.set(bx, bh + 2.75, bz);
      bamboo.castShadow = true;
      this.group.add(bamboo);
    }

    // Mossy Rocks
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const rockMat = new THREE.MeshToonMaterial({ color: 0x64748b });
    [
      { x: -4, z: -3, s: 0.9 },
      { x: 8, z: 2, s: 1.2 },
      { x: -2, z: 8, s: 0.7 },
      { x: -12, z: -6, s: 1.5 }
    ].forEach(r => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const h = this.getGroundHeight(r.x, r.z);
      rock.position.set(r.x, h + 0.3, r.z);
      rock.scale.setScalar(r.s);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.group.add(rock);
    });

    // Colorful Flowers & Fern Bush Patches
    const flowerGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0x38bdf8, 0xf472b6];

    for (let i = 0; i < 45; i++) {
      const x = (Math.random() - 0.5) * 32;
      const z = (Math.random() - 0.5) * 32;
      const h = this.getGroundHeight(x, z);

      const color = flowerColors[i % flowerColors.length];
      const mat = new THREE.MeshToonMaterial({ color });
      const flower = new THREE.Mesh(flowerGeo, mat);
      flower.position.set(x, h + 0.14, z);
      this.group.add(flower);
    }
  }

  private buildEggs() {
    const eggDataList = [
      { id: 'solander_lumi', name: 'Lumi Egg', x: -3, z: -2, color: 0x38bdf8, pattern: 0xfacc15 },
      { id: 'egg_star', name: 'Aura Egg', x: 4, z: 3, color: 0xa855f7, pattern: 0x38bdf8 },
      { id: 'egg_flora', name: 'Sprout Egg', x: -5, z: 6, color: 0x34d399, pattern: 0xf43f5e }
    ];

    const eggGeo = new THREE.SphereGeometry(0.38, 24, 24);
    eggGeo.scale(1, 1.35, 1); // Oval egg shape

    eggDataList.forEach(e => {
      const eggGroup = new THREE.Group();

      const eggMat = new THREE.MeshStandardMaterial({
        color: e.color,
        roughness: 0.3,
        metalness: 0.1,
        emissive: e.color,
        emissiveIntensity: 0.3
      });

      const eggMesh = new THREE.Mesh(eggGeo, eggMat);
      eggMesh.castShadow = true;
      eggGroup.add(eggMesh);

      // Spots / Pattern
      const spotGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const spotMat = new THREE.MeshBasicMaterial({ color: e.pattern });
      for (let i = 0; i < 4; i++) {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        const angle = (i / 4) * Math.PI * 2;
        spot.position.set(Math.cos(angle) * 0.28, (i - 1.5) * 0.12, Math.sin(angle) * 0.28);
        eggGroup.add(spot);
      }

      const h = this.getGroundHeight(e.x, e.z);
      eggGroup.position.set(e.x, h + 0.35, e.z);
      eggGroup.userData.baseY = eggGroup.position.y;

      this.group.add(eggGroup);
      this.eggs.push({
        id: e.id,
        mesh: eggGroup,
        hatched: false,
        name: e.name
      });
    });
  }

  public update(time: number, deltaTime: number = 0.016, playerPos?: THREE.Vector3) {
    // 1. Animate drifting clouds
    this.clouds.forEach(cloud => {
      const speed = cloud.userData.speed as number;
      cloud.position.x += speed * deltaTime;
      if (cloud.position.x > 38) {
        cloud.position.x = -38;
      }
    });

    // 2. Animate Palm Fruits Dropping, Physics Bouncing & Regeneration
    this.palmFruits.forEach(fruit => {
      if (!fruit.isDropped) {
        fruit.dropTimer += deltaTime;
        // Keep fruit attached to tree canopy
        fruit.mesh.position.copy(fruit.initialLocalPos);

        // Smooth regeneration pop scale animation
        if (fruit.mesh.scale.x < 1.0) {
          const newS = Math.min(1.0, fruit.mesh.scale.x + deltaTime * 1.5);
          fruit.mesh.scale.setScalar(newS);
        }

        if (fruit.dropTimer >= fruit.dropInterval) {
          // DETACH FRUIT!
          fruit.isDropped = true;
          fruit.dropTimer = 0;
          fruit.respawnTimer = 0;

          // Convert local tree position to world coordinates
          const worldPos = fruit.initialLocalPos.clone().add(fruit.parentTree.position);
          fruit.worldPos.copy(worldPos);

          // Detach mesh to main world group for free falling
          this.group.add(fruit.mesh);
          fruit.mesh.position.copy(fruit.worldPos);

          // Initial drop velocity push
          fruit.velocity.set(
            (Math.random() - 0.5) * 2.2,
            1.2,
            (Math.random() - 0.5) * 2.2
          );
          fruit.floorY = this.getGroundHeight(worldPos.x, worldPos.z) + 0.28;
        }
      } else {
        // Fruit in dropped state - apply gravity and physics
        fruit.velocity.y -= 16.0 * deltaTime;
        fruit.worldPos.x += fruit.velocity.x * deltaTime;
        fruit.worldPos.y += fruit.velocity.y * deltaTime;
        fruit.worldPos.z += fruit.velocity.z * deltaTime;

        // Ground collision & bouncing
        fruit.floorY = this.getGroundHeight(fruit.worldPos.x, fruit.worldPos.z) + 0.28;
        if (fruit.worldPos.y <= fruit.floorY) {
          fruit.worldPos.y = fruit.floorY;
          if (Math.abs(fruit.velocity.y) > 0.8) {
            fruit.velocity.y = -fruit.velocity.y * 0.38; // Soft bounce
            fruit.velocity.x *= 0.6;
            fruit.velocity.z *= 0.6;
          } else {
            fruit.velocity.y = 0;
            fruit.velocity.x *= 0.88;
            fruit.velocity.z *= 0.88;
          }
        }

        fruit.mesh.position.copy(fruit.worldPos);
        fruit.mesh.rotation.x += fruit.velocity.z * deltaTime * 2.0;
        fruit.mesh.rotation.z -= fruit.velocity.x * deltaTime * 2.0;

        // Collection / Regeneration timer
        fruit.respawnTimer += deltaTime;
        const distToPlayer = playerPos ? fruit.worldPos.distanceTo(playerPos) : 999;

        if (distToPlayer < 2.2 || fruit.respawnTimer > 20.0) {
          // Collect / re-attach fruit to parent tree to regenerate!
          fruit.isDropped = false;
          fruit.dropTimer = 0;
          fruit.respawnTimer = 0;
          fruit.dropInterval = 10.0 + Math.random() * 18.0;

          fruit.parentTree.add(fruit.mesh);
          fruit.mesh.position.copy(fruit.initialLocalPos);
          fruit.mesh.rotation.set(0, 0, 0);
          fruit.mesh.scale.set(0.01, 0.01, 0.01); // Shrink for scale-in regen
        }
      }
    });

    // Animate waterfall stream texture / scale pulse
    if (this.waterfallStream) {
      this.waterfallStream.scale.x = 1.0 + Math.sin(time * 8) * 0.05;
    }

    // Animate pool water surface pulse
    if (this.waterMesh) {
      this.waterMesh.position.y = this.poolCenter.y + Math.sin(time * 2) * 0.03;
    }

    // Animate Volumetric Waterfall Mist Particle Cloud & Light Glow Interaction
    if (this.waterfallMistParticles) {
      const pos = this.waterfallMistParticles.geometry.attributes.position as THREE.BufferAttribute;
      const base = this.waterfallMistParticles.geometry.userData.basePositions as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const offset = i * 3;
        const baseY = base[offset + 1];
        const rise = (baseY - 0.1 + time * (0.45 + (i % 5) * 0.06)) % 4.1;
        pos.setY(i, 0.1 + rise);
        pos.setX(i, base[offset] + Math.sin(time * 2.2 + i * 0.8) * 0.18);
        pos.setZ(i, base[offset + 2] + Math.cos(time * 1.8 + i * 0.5) * 0.12);
      }
      pos.needsUpdate = true;
    }

    if (this.waterfallMistLight1) {
      this.waterfallMistLight1.intensity = 3.6 + Math.sin(time * 2.8) * 0.9;
    }
    if (this.waterfallMistLight2) {
      this.waterfallMistLight2.intensity = 2.6 + Math.cos(time * 2.2) * 0.7;
    }

    // Animate Waterfall Mist Puffs
    this.mistPuffs.forEach((puff) => {
      const data = puff.userData;
      const rise = (time * data.speed) % 2.8;
      const heightProgress = rise / 2.8;
      puff.position.set(
        data.baseX + Math.sin(time * 1.5 + data.swayPhase) * 0.3,
        data.baseY + rise,
        data.baseZ + Math.cos(time * 1.2 + data.swayPhase) * 0.2
      );
      const mat = puff.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.lerp(0.38, 0, heightProgress);
      puff.scale.setScalar(data.baseScale * (1 + heightProgress * 0.7));
    });

    // Animate Volumetric God Rays
    this.godRays.forEach((ray, idx) => {
      const mat = ray.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.18 + Math.sin(time * 1.8 + idx * 1.2) * 0.08;
      ray.rotation.z = Math.sin(time * 0.5 + idx) * 0.03;
    });

    // Animate Airborne Light Spores (Sky: Children of the Light Style)
    if (this.airborneSpores) {
      const pos = this.airborneSpores.geometry.attributes.position as THREE.BufferAttribute;
      const base = this.airborneSpores.geometry.userData.basePositions as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const offset = i * 3;
        pos.setX(i, base[offset] + Math.cos(time * 0.5 + i) * 0.25);
        pos.setY(i, 0.2 + ((base[offset + 1] - 0.2 + time * (0.12 + (i % 7) * 0.01)) % 8.8));
        pos.setZ(i, base[offset + 2] + Math.sin(time * 0.35 + i * 0.7) * 0.2);
      }
      pos.needsUpdate = true;
    }

    // Animate glowing eggs gentle bobbing & wobble
    this.eggs.forEach((egg, idx) => {
      if (!egg.hatched) {
        egg.mesh.position.y = egg.mesh.userData.baseY + Math.sin(time * 3 + idx) * 0.08;
        egg.mesh.rotation.z = Math.sin(time * 2 + idx) * 0.08;
      }
    });

    // Fireflies slow float - using constants
    if (this.fireflies) {
      const pos = this.fireflies.geometry.attributes.position as THREE.BufferAttribute;
      const base = this.fireflies.geometry.userData.basePositions as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const offset = i * 3;
        const span = GARDEN_EXTENDED.FIREFLY_Y_MAX - GARDEN_EXTENDED.FIREFLY_Y_MIN;
        const baseY = base[offset + 1];
        pos.setY(i, Math.max(GARDEN_EXTENDED.FIREFLY_Y_MIN, Math.min(GARDEN_EXTENDED.FIREFLY_Y_MAX, baseY + Math.sin(time + i) * Math.min(0.18, span * 0.08))));
      }
      pos.needsUpdate = true;
    }
  }

  /**
   * Create instanced lily pads for efficient rendering
   */
  private createInstancedLilyPads(
    count: number,
    poolCenter: THREE.Vector3,
    poolRadius: number,
    padMaterial: THREE.Material,
    flowerMaterial?: THREE.Material
  ): { pads: THREE.InstancedMesh; flowers?: THREE.InstancedMesh } {
    const dummy = new THREE.Object3D();
    
    // Create lily pad geometry
    const padGeo = new THREE.CylinderGeometry(
      GARDEN_EXTENDED.LILY_PAD_RADIUS,
      GARDEN_EXTENDED.LILY_PAD_RADIUS,
      0.04, 12
    );
    
    // Create instanced mesh for pads
    const pads = new THREE.InstancedMesh(padGeo, padMaterial, count);
    pads.castShadow = false;
    pads.receiveShadow = true;
    
    const positions: THREE.Vector3[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.2 + Math.random() * (poolRadius - 2);
      const x = poolCenter.x + Math.cos(angle) * r;
      const z = poolCenter.z + Math.sin(angle) * r;
      
      positions.push(new THREE.Vector3(x, 0.08, z));
    }
    
    // Update all instances
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pads.setMatrixAt(i, dummy.matrix);
    });
    
    pads.instanceMatrix.needsUpdate = true;
    
    let flowers: THREE.InstancedMesh | undefined;
    
    if (flowerMaterial) {
      const flowerGeo = new THREE.DodecahedronGeometry(GARDEN_EXTENDED.FLOWER_SIZE, 1);
      const flowerCount = Math.floor(count / 2); // Every other pad has a flower
      
      flowers = new THREE.InstancedMesh(flowerGeo, flowerMaterial, flowerCount);
      
      for (let i = 0; i < flowerCount; i++) {
        const pos = positions[i * 2]; // Every other position
        dummy.position.copy(pos);
        dummy.position.y += 0.12;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        flowers.setMatrixAt(i, dummy.matrix);
      }
      
      flowers.instanceMatrix.needsUpdate = true;
    }
    
    return { pads, flowers };
  }
  
  /**
   * Dispose resources to prevent memory leaks
   */
  public dispose(): void {
    // Dispose fireflies
    if (this.fireflies) {
      this.fireflies.geometry.dispose();
      (this.fireflies.material as THREE.Material).dispose();
    }
    
    // Dispose airborne spores
    if (this.airborneSpores) {
      this.airborneSpores.geometry.dispose();
      (this.airborneSpores.material as THREE.Material).dispose();
    }
    
    // Dispose waterfall mist particles
    if (this.waterfallMistParticles) {
      this.waterfallMistParticles.geometry.dispose();
      (this.waterfallMistParticles.material as THREE.Material).dispose();
    }
    
    // Dispose mist puffs
    this.mistPuffs.forEach(puff => {
      puff.geometry.dispose();
      (puff.material as THREE.Material).dispose();
    });
    
    // Dispose god rays
    this.godRays.forEach(ray => {
      ray.geometry.dispose();
      (ray.material as THREE.Material).dispose();
    });
    
    // Dispose water meshes
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      (this.waterMesh.material as THREE.Material).dispose();
    }
    
    if (this.smallWaterMesh) {
      this.smallWaterMesh.geometry.dispose();
      (this.smallWaterMesh.material as THREE.Material).dispose();
    }
    
    // Dispose eggs
    this.eggs.forEach(egg => {
      egg.mesh.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
    });
    
    // Clear arrays
    this.clouds = [];
    this.mistPuffs = [];
    this.godRays = [];
    this.eggs = [];
    this.palmFruits = [];
  }
}
