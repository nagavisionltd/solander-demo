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
  public waterMesh!: THREE.Mesh;
  private waterfallStream!: THREE.Mesh;
  public poolCenter: THREE.Vector3 = new THREE.Vector3(0, -0.2, -8);
  public poolRadius: number = 6.8;

  constructor() {
    this.group = new THREE.Group();

    // Terrain & Environment
    this.buildTerrain();
    this.buildWaterFeature();
    this.buildPaths();
    this.buildFoliageAndProps();
    this.buildEggs();

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

    const dummyGeo = new THREE.PlaneGeometry(1, 1);
    this.waterfallStream = new THREE.Mesh(dummyGeo);
  }

  public isPosInWater(x: number, z: number): boolean {
    const distToPool = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    return distToPool < this.poolRadius - 0.5;
  }

  public getGroundHeight(x: number, z: number): number {
    const d = Math.hypot(x, z);
    if (d > 28) return -2.0; // Boundary drop

    // Central Waterfall Swimming Pool (Center: x: 0, z: -8)
    const distToPool = Math.hypot(x - this.poolCenter.x, z - this.poolCenter.z);
    if (distToPool < this.poolRadius) {
      return -0.8 - (this.poolRadius - distToPool) * 0.12; // Underwater bed!
    }

    // Waterfall Cliff behind pool (z < -14)
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

    this.group.add(cliffGroup);

    // Lilypads in Pool
    const padGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.02, 12);
    const padMat = new THREE.MeshToonMaterial({ color: 0x15803d });
    [
      { x: -2.5, z: -7.2 },
      { x: 3.2, z: -9.1 },
      { x: -1.2, z: -5.8 },
      { x: 2.8, z: -6.5 }
    ].forEach(p => {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(p.x, -0.12, p.z);
      this.group.add(pad);
    });
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

  private buildFoliageAndProps() {
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
