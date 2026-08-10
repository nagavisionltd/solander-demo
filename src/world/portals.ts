import * as THREE from 'three';

export type TargetWorldType = 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD';

export class PortalCave {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public targetWorld: TargetWorldType;

  private vortexMesh: THREE.Mesh;
  private ringMesh: THREE.Mesh;

  constructor(position: THREE.Vector3, targetWorld: TargetWorldType) {
    this.position = position;
    this.targetWorld = targetWorld;
    this.mesh = new THREE.Group();

    // 1. GRAND MOUNTAIN CAVE SHELL (Large Rocky Mountain Structure)
    const caveShellGeo = new THREE.CylinderGeometry(4.2, 5.8, 5.5, 12, 1);
    const caveShellMat = new THREE.MeshToonMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0x451a03 : (targetWorld === 'MYSTIC_VALLEY' ? 0x1e1b4b : 0x1e293b),
    });
    const caveShell = new THREE.Mesh(caveShellGeo, caveShellMat);
    caveShell.position.set(0, 2.75, -2.5);
    caveShell.castShadow = true;
    caveShell.receiveShadow = true;
    this.mesh.add(caveShell);

    // Natural Rock Boulders around Mountain Base
    const rockMat = new THREE.MeshToonMaterial({ color: 0x334155 });
    for (let i = 0; i < 7; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.7);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 7) * Math.PI * 1.3 - Math.PI * 0.65;
      rock.position.set(Math.cos(angle) * 4.6, 0.6, Math.sin(angle) * 2.5 - 2.5);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.mesh.add(rock);
    }

    // 2. DARK CAVERN INNER VOID (Open Cave Mouth)
    const caveInteriorGeo = new THREE.CylinderGeometry(2.4, 2.8, 4.8, 12, 1, true);
    const caveInteriorMat = new THREE.MeshToonMaterial({ color: 0x020617, side: THREE.BackSide });
    const caveInterior = new THREE.Mesh(caveInteriorGeo, caveInteriorMat);
    caveInterior.rotation.x = Math.PI / 2;
    caveInterior.position.set(0, 2.2, -2.0);
    this.mesh.add(caveInterior);

    // Stone Archway Frame around Cavern Entrance
    const archGeo = new THREE.TorusGeometry(2.6, 0.5, 12, 24, Math.PI);
    const archMat = new THREE.MeshToonMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0x78350f : (targetWorld === 'MYSTIC_VALLEY' ? 0x312e81 : 0x334155)
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 0.2, 0);
    arch.castShadow = true;
    this.mesh.add(arch);

    // 3. GLOWING PORTAL RING & SWIRLING VORTEX DISK (Inside Cave Entrance)
    const ringGeo = new THREE.TorusGeometry(2.1, 0.12, 12, 24, Math.PI);
    const ringMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0xfacc15 : (targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8),
      emissive: targetWorld === 'HUB_WORLD' ? 0xd97706 : (targetWorld === 'MYSTIC_VALLEY' ? 0x9333ea : 0x0284c7),
      emissiveIntensity: 0.6
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.set(0, 0.2, -0.4);
    this.mesh.add(this.ringMesh);

    const vortexGeo = new THREE.CircleGeometry(2.0, 32);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0xfde047 : (targetWorld === 'MYSTIC_VALLEY' ? 0xa855f7 : 0x38bdf8),
      emissive: targetWorld === 'HUB_WORLD' ? 0xca8a04 : (targetWorld === 'MYSTIC_VALLEY' ? 0x7e22ce : 0x0369a1),
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
    this.vortexMesh.position.set(0, 2.2, -0.6);
    this.mesh.add(this.vortexMesh);

    // 4. PROMINENT CAVE SIGNBOARD ABOVE ENTRANCE
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 3.6, 0.3);

    const signBoardGeo = new THREE.BoxGeometry(5.2, 1.3, 0.25);
    const signBoardMat = new THREE.MeshToonMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0x713f12 : (targetWorld === 'MYSTIC_VALLEY' ? 0x2e1065 : 0x075985)
    });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signGroup.add(signBoard);

    // Canvas Texture Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = targetWorld === 'HUB_WORLD' ? '#854d0e' : (targetWorld === 'MYSTIC_VALLEY' ? '#3b0764' : '#0369a1');
      ctx.fillRect(0, 0, 512, 128);
      ctx.lineWidth = 10;
      ctx.strokeStyle = targetWorld === 'HUB_WORLD' ? '#fef08a' : (targetWorld === 'MYSTIC_VALLEY' ? '#e9d5ff' : '#bae6fd');
      ctx.strokeRect(6, 6, 500, 116);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let text = '🌸 SOLANDER GARDEN CAVE';
      if (targetWorld === 'MYSTIC_VALLEY') {
        text = '⚡ ADVENTURE MODE CAVE';
      } else if (targetWorld === 'HUB_WORLD') {
        text = '🏫 CHAO WORLD HUB CAVE';
      }
      ctx.fillText(text, 256, 64);
    }
    const canvasTex = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(5.0, 1.2);
    const labelMat = new THREE.MeshBasicMaterial({ map: canvasTex, transparent: true });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.z = 0.14;
    signGroup.add(labelMesh);

    // Glowing Sign Border
    const borderGeo = new THREE.BoxGeometry(5.4, 1.5, 0.15);
    const borderMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0xfacc15 : (targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8),
      emissive: targetWorld === 'HUB_WORLD' ? 0xca8a04 : (targetWorld === 'MYSTIC_VALLEY' ? 0x9333ea : 0x0284c7),
      emissiveIntensity: 0.5
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = -0.05;
    signGroup.add(border);

    this.mesh.add(signGroup);

    // 5. ENTRANCE LANTERN BEACONS
    const lanternMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'HUB_WORLD' ? 0xfacc15 : (targetWorld === 'MYSTIC_VALLEY' ? 0xd8b4fe : 0x7dd3fc),
      emissive: targetWorld === 'HUB_WORLD' ? 0xeab308 : (targetWorld === 'MYSTIC_VALLEY' ? 0x9333ea : 0x0284c7),
      emissiveIntensity: 0.8
    });
    [-2.8, 2.8].forEach(x => {
      const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.2);
      const post = new THREE.Mesh(postGeo, rockMat);
      post.position.set(x, 1.1, 0.3);

      const lampGeo = new THREE.OctahedronGeometry(0.35);
      const lamp = new THREE.Mesh(lampGeo, lanternMat);
      lamp.position.set(x, 2.2, 0.3);

      this.mesh.add(post, lamp);
    });

    // Set world position
    this.mesh.position.copy(position);
  }

  public update(time: number) {
    // Spin vortex surface
    this.vortexMesh.rotation.z = time * 1.2;
    this.vortexMesh.scale.setScalar(1 + Math.sin(time * 2.5) * 0.04);

    // Pulse glow
    if (this.ringMesh.material instanceof THREE.MeshStandardMaterial) {
      this.ringMesh.material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.2;
    }
  }

  public checkTrigger(playerPosition: THREE.Vector3): boolean {
    const dist = this.mesh.position.distanceTo(playerPosition);
    return dist < 2.8;
  }
}
