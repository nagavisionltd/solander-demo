import * as THREE from 'three';

export interface SolanderEggMesh {
  id: string;
  mesh: THREE.Group;
  hatched: boolean;
  name: string;
}

export class SolanderGardenWorld {
  public group: THREE.Group;
  public eggs: SolanderEggMesh[] = [];
  private fireflies!: THREE.Points;
  private airborneSpores!: THREE.Points;
  private mistPuffs: THREE.Mesh[] = [];
  private godRays: THREE.Mesh[] = [];
  public waterMesh!: THREE.Mesh;
  private waterfallStream!: THREE.Mesh;
  public poolCenter: THREE.Vector3 = new THREE.Vector3(0, -0.2, -7.5);
  public poolRadius: number = 13.5;

  constructor() {
    this.group = new THREE.Group();

    // Terrain & Environment
    this.buildTerrain();
    this.buildWaterFeature();
    this.buildPaths();
    this.buildFoliageAndProps();
    this.buildEggs();
    this.buildEtherealAtmosphere();

    // Fireflies / Floating sparkles
    const particleGeo = new THREE.BufferGeometry();
    const count = 60;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 45;
      posArray[i + 1] = 0.5 + Math.random() * 3.5;
      posArray[i + 2] = (Math.random() - 0.5) * 45;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.fireflies = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.fireflies);
  }

  private buildEtherealAtmosphere() {
    // 1. WATERFALL MIST PARTICLES SYSTEM
    const puffGeo = new THREE.SphereGeometry(0.75, 12, 12);
    const puffMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    });

    for (let i = 0; i < 38; i++) {
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(
        (Math.random() - 0.5) * 5.2,
        0.1 + Math.random() * 2.8,
        -13.2 + (Math.random() - 0.5) * 3.0
      );
      puff.scale.setScalar(0.6 + Math.random() * 0.8);
      puff.userData = {
        baseY: puff.position.y,
        speed: 0.4 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2
      };
      this.group.add(puff);
      this.mistPuffs.push(puff);
    }

    // 2. VOLUMETRIC GOD RAYS / SKY LIGHT SHAFTS (Sky: Children of the Light Style)
    const rayGeo = new THREE.CylinderGeometry(0.3, 3.2, 22, 16, 1, true);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rayPositions = [
      { x: 0, y: 7.5, z: -12.2, rx: 0.1, rz: -0.05 },
      { x: -2.8, y: 7.0, z: -9.5, rx: 0.14, rz: 0.12 },
      { x: 2.8, y: 7.2, z: -10.2, rx: 0.08, rz: -0.14 },
      { x: 6.5, y: 6.8, z: -5.5, rx: 0.18, rz: -0.16 },
      { x: -6.5, y: 6.8, z: -4.5, rx: 0.16, rz: 0.18 }
    ];

    rayPositions.forEach((rp, idx) => {
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(rp.x, rp.y, rp.z);
      ray.rotation.set(rp.rx, 0, rp.rz);
      ray.userData = { index: idx };
      this.group.add(ray);
      this.godRays.push(ray);
    });

    // 3. AIRBORNE LIGHT SPORES / DANDELION SEEDS (Sky: Children of the Light Style)
    const sporeCount = 120;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePos = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount * 3; i += 3) {
      sporePos[i] = (Math.random() - 0.5) * 50;
      sporePos[i + 1] = 0.2 + Math.random() * 8.0;
      sporePos[i + 2] = (Math.random() - 0.5) * 50;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePos, 3));

    const sporeMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.airborneSpores = new THREE.Points(sporeGeo, sporeMat);
    this.group.add(this.airborneSpores);
  }

  public isPosInWater(x: number, z: number): boolean {
    const distToPool = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    return distToPool < this.poolRadius - 0.5;
  }

  public getGroundHeight(x: number, z: number): number {
    const d = Math.hypot(x, z);
    if (d > 28) return -2.0; // Boundary drop

    // Winding Stone Stair Platforms to top of Waterfall Cliff (Right side x: 3.5 to 6.5, z: -10 to -16)
    if (x >= 3.0 && x <= 6.8 && z <= -10.0 && z >= -16.0) {
      if (z > -11.2) return 0.8;
      if (z > -12.6) return 1.6;
      if (z > -14.0) return 2.6;
      if (z > -15.2) return 3.6;
      return 4.6; // Top Stair Ledge
    }

    // Top Waterfall Lookout Ledge (z <= -14.8, x between -3 and 3)
    if (z <= -14.8 && Math.abs(x) < 3.5) {
      return 4.8;
    }

    // Central Waterfall Swimming Pool (Center: x: 0, z: -7.5)
    const distToPool = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    if (distToPool < this.poolRadius) {
      return -0.9 - (this.poolRadius - distToPool) * 0.1; // Underwater bed!
    }

    // Waterfall Cliff behind pool (z < -13.5)
    if (z < -13.5 && Math.abs(x) < 7) {
      return 4.5 + ( -13.5 - z ) * 0.8;
    }

    const h1 = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.5;
    const h2 = Math.sin(x * 0.3 + z * 0.2) * 0.3;
    return Math.max(0, h1 + h2);
  }

  private buildTerrain() {
    // Ground Mesh
    const geo = new THREE.PlaneGeometry(60, 60, 64, 64);
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
    // 1. Central Large Swimming Pool (Radius ~ 6.8m)
    const poolWaterGeo = new THREE.CylinderGeometry(this.poolRadius, this.poolRadius, 0.15, 36);
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.3,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82
    });
    this.waterMesh = new THREE.Mesh(poolWaterGeo, poolWaterMat);
    this.waterMesh.position.copy(this.poolCenter);
    this.group.add(this.waterMesh);

    // Pool Sand Shore Line Ring
    const shoreGeo = new THREE.RingGeometry(this.poolRadius - 0.2, this.poolRadius + 1.2, 36);
    const shoreMat = new THREE.MeshToonMaterial({ color: 0xfef08a, side: THREE.DoubleSide });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.rotation.x = Math.PI / 2;
    shore.position.set(this.poolCenter.x, 0.02, this.poolCenter.z);
    this.group.add(shore);

    // 2. High Rock Cliff Waterfall Centerpiece
    const cliffGroup = new THREE.Group();

    // Large Rock Formation
    const rockGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const rockMat = new THREE.MeshToonMaterial({ color: 0x475569 });

    const rock1 = new THREE.Mesh(rockGeo, rockMat);
    rock1.position.set(-3, 2.5, -15);
    rock1.scale.set(1.5, 1.8, 1.2);

    const rock2 = new THREE.Mesh(rockGeo, rockMat);
    rock2.position.set(3, 2.5, -15);
    rock2.scale.set(1.5, 1.8, 1.2);

    const rockCenter = new THREE.Mesh(rockGeo, rockMat);
    rockCenter.position.set(0, 3.2, -15.5);
    rockCenter.scale.set(2.2, 1.4, 1.0);

    cliffGroup.add(rock1, rock2, rockCenter);

    // Waterfall Animated Water Stream Sheet
    const fallGeo = new THREE.PlaneGeometry(3.2, 5.2, 16, 16);
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

    // Lilypads & Floating Lotus Flowers in Pool
    const padGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.02, 16);
    const padMat = new THREE.MeshToonMaterial({ color: 0x15803d });
    const lotusMat = new THREE.MeshToonMaterial({ color: 0xf43f5e });

    [
      { x: -5.5, z: -8.2 },
      { x: 6.2, z: -10.1 },
      { x: -3.2, z: -4.8 },
      { x: 5.8, z: -5.5 },
      { x: -7.0, z: -6.0 },
      { x: 7.5, z: -8.5 }
    ].forEach((p, idx) => {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(p.x, -0.12, p.z);

      if (idx % 2 === 0) {
        const lotusGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const lotus = new THREE.Mesh(lotusGeo, lotusMat);
        lotus.position.set(0, 0.15, 0);
        pad.add(lotus);
      }
      this.group.add(pad);
    });

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

  private buildFoliageAndProps() {
    this.buildGardenToys();

    // Stylized Low-Poly Trees
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8);
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x78350f });

    const foliageGeo = new THREE.SphereGeometry(1.4, 12, 10);
    const foliageMat = new THREE.MeshToonMaterial({ color: 0x22c55e });

    const treePositions = [
      { x: -8, z: -6 }, { x: -12, z: 4 }, { x: 10, z: 8 },
      { x: 12, z: -8 }, { x: -6, z: 12 }, { x: 8, z: -14 },
      { x: -14, z: -12 }
    ];

    treePositions.forEach(p => {
      const tree = new THREE.Group();
      const h = this.getGroundHeight(p.x, p.z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 2.4;
      foliage.castShadow = true;

      tree.add(trunk, foliage);
      tree.position.set(p.x, h, p.z);
      this.group.add(tree);
    });

    // Mossy Rocks
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
    const rockMat = new THREE.MeshToonMaterial({ color: 0x64748b });
    [
      { x: -4, z: -3, s: 0.9 },
      { x: 8, z: 2, s: 1.2 },
      { x: -2, z: 8, s: 0.7 }
    ].forEach(r => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const h = this.getGroundHeight(r.x, r.z);
      rock.position.set(r.x, h + 0.3, r.z);
      rock.scale.setScalar(r.s);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.group.add(rock);
    });

    // Colorful Flowers
    const flowerGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0x38bdf8];

    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 25;
      const z = (Math.random() - 0.5) * 25;
      const h = this.getGroundHeight(x, z);

      const color = flowerColors[i % flowerColors.length];
      const mat = new THREE.MeshToonMaterial({ color });
      const flower = new THREE.Mesh(flowerGeo, mat);
      flower.position.set(x, h + 0.12, z);
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

      this.group.add(eggGroup);
      this.eggs.push({
        id: e.id,
        mesh: eggGroup,
        hatched: false,
        name: e.name
      });
    });
  }

  public update(time: number) {
    // Animate waterfall stream texture / scale pulse
    if (this.waterfallStream) {
      this.waterfallStream.scale.x = 1.0 + Math.sin(time * 8) * 0.05;
    }

    // Animate pool water surface pulse
    if (this.waterMesh) {
      this.waterMesh.position.y = this.poolCenter.y + Math.sin(time * 2) * 0.03;
    }

    // Animate Waterfall Mist Puffs
    this.mistPuffs.forEach((puff, idx) => {
      const data = puff.userData;
      puff.position.y += data.speed * 0.008;
      puff.position.x += Math.sin(time * 1.5 + data.swayPhase) * 0.006;
      puff.position.z += Math.cos(time * 1.2 + data.swayPhase) * 0.006;
      const mat = puff.material as THREE.MeshStandardMaterial;

      // Expand puff as it rises, then reset when high
      if (puff.position.y > data.baseY + 2.8) {
        puff.position.y = data.baseY;
        mat.opacity = 0.38;
      } else {
        const heightProgress = (puff.position.y - data.baseY) / 2.8;
        mat.opacity = THREE.MathUtils.lerp(0.38, 0, heightProgress);
        puff.scale.setScalar(0.6 + heightProgress * 1.2);
      }
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
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + Math.sin(time * 0.8 + i) * 0.004 + 0.003;
        let x = pos.getX(i) + Math.cos(time * 0.5 + i) * 0.003;
        if (y > 9.0) y = 0.2;
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }

    // Animate glowing eggs gentle bobbing & wobble
    this.eggs.forEach((egg, idx) => {
      if (!egg.hatched) {
        egg.mesh.position.y += Math.sin(time * 3 + idx) * 0.0015;
        egg.mesh.rotation.z = Math.sin(time * 2 + idx) * 0.08;
      }
    });

    // Fireflies slow float
    if (this.fireflies) {
      const pos = this.fireflies.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + Math.sin(time + i) * 0.003;
        if (y > 4) y = 0.5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }
}
