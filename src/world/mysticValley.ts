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

export class MysticValleyWorld {
  public group: THREE.Group;
  public discoveryPoints: DiscoveryPoint[] = [];
  public resourceNodes: ResourceNode[] = [];
  public trialPedestal: { position: THREE.Vector3; mesh: THREE.Group } | null = null;
  private floatingCrystals: THREE.Mesh[] = [];

  constructor() {
    this.group = new THREE.Group();

    // Build Mystic Environment
    this.buildTerrain();
    this.buildMountains();
    this.buildBioluminescentFlora();
    this.buildDiscoveryPoints();
    this.buildResourceNodes();
    this.buildTrialPedestal();
  }

  public getGroundHeight(x: number, z: number): number {
    const d = Math.hypot(x, z);
    if (d > 35) return -2.0;

    // Valley terrain with central plateau and surrounding ridges
    const h1 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.2;
    const h2 = Math.cos(x * 0.2 + z * 0.15) * 0.6;
    return Math.max(0, h1 + h2);
  }

  private buildTerrain() {
    const geo = new THREE.PlaneGeometry(70, 70, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getGroundHeight(x, z));
    }
    geo.computeVertexNormals();

    // Mystic Violet/Slate Terrain
    const mat = new THREE.MeshToonMaterial({ color: 0x3b0764 }); // Deep purple slate
    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.group.add(terrain);
  }

  private buildMountains() {
    // Backdrop jagged mountain peaks surrounding the valley
    const mountainGeo = new THREE.ConeGeometry(8, 16, 6);
    const mountainMat = new THREE.MeshToonMaterial({ color: 0x1e1b4b }); // Dark midnight indigo

    const angles = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8, 5.6];
    angles.forEach(a => {
      const r = 32;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const peak = new THREE.Mesh(mountainGeo, mountainMat);
      peak.position.set(x, 6, z);
      this.group.add(peak);
    });
  }

  private buildBioluminescentFlora() {
    // Floating Glowing Crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });

    for (let i = 0; i < 15; i++) {
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      const h = this.getGroundHeight(x, z);

      crystal.position.set(x, h + 1.5 + Math.random() * 1.5, z);
      crystal.rotation.set(Math.random(), Math.random(), Math.random());
      this.group.add(crystal);
      this.floatingCrystals.push(crystal);
    }

    // Glowing Mushrooms & Plants
    const shroomCapGeo = new THREE.ConeGeometry(0.5, 0.4, 12);
    const shroomCapMat = new THREE.MeshToonMaterial({ color: 0xf43f5e });
    const shroomStemGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
    const shroomStemMat = new THREE.MeshToonMaterial({ color: 0xf1f5f9 });

    for (let i = 0; i < 20; i++) {
      const shroom = new THREE.Group();
      const stem = new THREE.Mesh(shroomStemGeo, shroomStemMat);
      stem.position.y = 0.3;

      const cap = new THREE.Mesh(shroomCapGeo, shroomCapMat);
      cap.position.y = 0.7;

      shroom.add(stem, cap);

      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const h = this.getGroundHeight(x, z);
      shroom.position.set(x, h, z);

      this.group.add(shroom);
    }
  }

  private buildDiscoveryPoints() {
    // 1. Ancient Crystal Tree
    const crystalTreeGroup = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3.5, 8);
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x475569 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.75;

    const crownGeo = new THREE.DodecahedronGeometry(2.0, 1);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 4.2;

    crystalTreeGroup.add(trunk, crown);
    const pos1 = new THREE.Vector3(0, this.getGroundHeight(0, -12), -12);
    crystalTreeGroup.position.copy(pos1);
    this.group.add(crystalTreeGroup);

    this.discoveryPoints.push({
      id: 'point_crystal_tree',
      name: 'Ancient Crystal Tree',
      position: pos1,
      mesh: crystalTreeGroup,
      memoryTitle: 'Crystal Tree Whispers',
      memoryText: 'Lumi discovered an ancient memory! "In primordial times, Solanders sang in resonance with the star crystals."',
      discovered: false
    });

    // 2. Starfall Shrine
    const shrineGroup = new THREE.Group();

    const pillarGeo = new THREE.BoxGeometry(0.6, 2.5, 0.6);
    const pillarMat = new THREE.MeshToonMaterial({ color: 0x94a3b8 });

    [-1, 1].forEach(dx => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(dx * 1.2, 1.25, 0);
      shrineGroup.add(p);
    });

    const orbGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 1.0
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0, 2.0, 0);
    shrineGroup.add(orb);

    const pos2 = new THREE.Vector3(12, this.getGroundHeight(12, 6), 6);
    shrineGroup.position.copy(pos2);
    this.group.add(shrineGroup);

    this.discoveryPoints.push({
      id: 'point_starfall_shrine',
      name: 'Starfall Shrine',
      position: pos2,
      mesh: shrineGroup,
      memoryTitle: 'Starfall Rune',
      memoryText: 'Lumi discovered an ancient memory! "A falling star granted warmth to the first garden egg."',
      discovered: false
    });
  }

  private buildResourceNodes() {
    // 1. Essence Orbs (Glowing golden/cyan spheres)
    const essenceGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const essenceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9
    });

    const essenceCoords = [
      [-6, 4], [8, -8], [-12, -5], [14, 12], [-4, 15], [6, 18], [-15, 10]
    ];

    essenceCoords.forEach(([x, z], idx) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(essenceGeo, essenceMat);
      m.position.y = 0.5;
      g.add(m);

      const h = this.getGroundHeight(x, z);
      const pos = new THREE.Vector3(x, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.resourceNodes.push({
        id: `res_essence_${idx}`,
        type: 'essence',
        name: '✨ Solander Essence',
        position: pos,
        mesh: g,
        collected: false
      });
    });

    // 2. Seeds (Sprouting green nodes)
    const seedStemGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 8);
    const seedStemMat = new THREE.MeshToonMaterial({ color: 0x22c55e });
    const seedLeafGeo = new THREE.SphereGeometry(0.2, 8, 8);
    seedLeafGeo.scale(1, 0.4, 0.6);

    const seedCoords = [
      [5, 3], [-8, -10], [10, -14], [-10, 8], [2, -18]
    ];

    seedCoords.forEach(([x, z], idx) => {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(seedStemGeo, seedStemMat);
      stem.position.y = 0.2;
      const leaf1 = new THREE.Mesh(seedLeafGeo, seedStemMat);
      leaf1.position.set(-0.1, 0.35, 0);
      leaf1.rotation.z = -0.4;
      const leaf2 = new THREE.Mesh(seedLeafGeo, seedStemMat);
      leaf2.position.set(0.1, 0.35, 0);
      leaf2.rotation.z = 0.4;
      g.add(stem, leaf1, leaf2);

      const h = this.getGroundHeight(x, z);
      const pos = new THREE.Vector3(x, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.resourceNodes.push({
        id: `res_seed_${idx}`,
        type: 'seeds',
        name: '🌱 Ancient Seed',
        position: pos,
        mesh: g,
        collected: false
      });
    });

    // 3. Crystal Cluster Nodes (💎)
    const crystalGeo = new THREE.ConeGeometry(0.25, 0.6, 5);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x6366f1,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });

    const crystalCoords = [
      [-2, -8], [15, -4], [-16, -14], [8, -20], [-12, 16]
    ];

    crystalCoords.forEach(([x, z], idx) => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(crystalGeo, crystalMat);
        c.position.set((i - 1) * 0.18, 0.3, (i % 2) * 0.1);
        c.rotation.set((Math.random() - 0.5) * 0.3, Math.random(), (Math.random() - 0.5) * 0.3);
        g.add(c);
      }

      const h = this.getGroundHeight(x, z);
      const pos = new THREE.Vector3(x, h, z);
      g.position.copy(pos);
      this.group.add(g);

      this.resourceNodes.push({
        id: `res_crystal_${idx}`,
        type: 'crystals',
        name: '💎 Shimmering Crystal',
        position: pos,
        mesh: g,
        collected: false
      });
    });
  }

  private buildTrialPedestal() {
    const group = new THREE.Group();

    // Ancient Stone Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 12);
    const stoneMat = new THREE.MeshToonMaterial({ color: 0x64748b });
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.3;

    // Glowing Trial Ring
    const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 12, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 1.0
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.65;

    // Floating Crest
    const crestGeo = new THREE.OctahedronGeometry(0.4, 0);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xf43f5e,
      emissiveIntensity: 0.9
    });
    const crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.y = 1.6;

    group.add(base, ring, crest);

    const pos = new THREE.Vector3(-8, this.getGroundHeight(-8, -15), -15);
    group.position.copy(pos);
    this.group.add(group);

    this.trialPedestal = {
      position: pos,
      mesh: group
    };
  }

  public update(time: number) {
    // Animate floating crystals bobbing & rotating
    this.floatingCrystals.forEach((c, i) => {
      c.rotation.x += 0.01;
      c.rotation.y += 0.015;
      c.position.y += Math.sin(time * 2 + i) * 0.002;
    });

    // Bobbing resource nodes
    this.resourceNodes.forEach((node, i) => {
      if (!node.collected) {
        node.mesh.position.y = node.position.y + Math.sin(time * 3 + i) * 0.08;
        node.mesh.rotation.y += 0.015;
      }
    });
  }
}
