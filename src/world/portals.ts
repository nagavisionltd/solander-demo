import * as THREE from 'three';

export class PortalCave {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public targetWorld: 'GARDEN' | 'MYSTIC_VALLEY';

  private vortexMesh: THREE.Mesh;
  private ringMesh: THREE.Mesh;

  constructor(position: THREE.Vector3, targetWorld: 'GARDEN' | 'MYSTIC_VALLEY') {
    this.position = position;
    this.targetWorld = targetWorld;
    this.mesh = new THREE.Group();

    // Archway Stone Frame
    const archGeo = new THREE.TorusGeometry(2.2, 0.45, 12, 24, Math.PI);
    const archMat = new THREE.MeshToonMaterial({ color: 0x475569 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.y = 0;
    arch.castShadow = true;
    this.mesh.add(arch);

    // Glowing Arch Ring
    const ringGeo = new THREE.TorusGeometry(2.0, 0.1, 12, 24, Math.PI);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.0
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.ringMesh);

    // Swirling Portal Vortex Disk
    const vortexGeo = new THREE.CircleGeometry(1.9, 32);
    const vortexMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xa855f7 : 0x38bdf8,
      emissive: targetWorld === 'MYSTIC_VALLEY' ? 0x9333ea : 0x0284c7,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88
    });
    this.vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
    this.vortexMesh.position.y = 0;
    this.mesh.add(this.vortexMesh);

    // Obvious World Gateway Sign Board & Canvas Text Banner
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 2.8, 0);

    const signBoardGeo = new THREE.BoxGeometry(4.2, 1.1, 0.2);
    const signBoardMat = new THREE.MeshToonMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0x3b0764 : 0x0369a1
    });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signGroup.add(signBoard);

    // Canvas Text Texture Banner
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = targetWorld === 'MYSTIC_VALLEY' ? '#2e1065' : '#075985';
      ctx.fillRect(0, 0, 512, 128);
      ctx.lineWidth = 8;
      ctx.strokeStyle = targetWorld === 'MYSTIC_VALLEY' ? '#e9d5ff' : '#bae6fd';
      ctx.strokeRect(6, 6, 500, 116);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = targetWorld === 'MYSTIC_VALLEY' ? '⚡ ADVENTURE MODE ⚡' : '🌸 SOLANDER GARDEN 🌸';
      ctx.fillText(text, 256, 64);
    }
    const canvasTex = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(4.0, 1.0);
    const labelMat = new THREE.MeshBasicMaterial({ map: canvasTex, transparent: true });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.z = 0.11;
    signGroup.add(labelMesh);

    // Glowing Sign Border Frame
    const borderGeo = new THREE.BoxGeometry(4.4, 1.3, 0.15);
    const borderMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8,
      emissive: targetWorld === 'MYSTIC_VALLEY' ? 0xa855f7 : 0x0284c7,
      emissiveIntensity: 1.4
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = -0.05;
    signGroup.add(border);

    // Vertical Sky Light Beam Pillar
    const beamGeo = new THREE.CylinderGeometry(1.8, 2.6, 22, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xd8b4fe : 0x7dd3fc,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 10.0, -0.2);
    this.mesh.add(beam);

    // Floating Crystal Beacon Top
    const beaconGeo = new THREE.OctahedronGeometry(0.55, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xf3e8ff : 0xe0f2fe,
      emissive: targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8,
      emissiveIntensity: 1.8
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.95;
    signGroup.add(beacon);

    this.mesh.add(signGroup);

    // Position cave archway on ground
    this.mesh.position.copy(position);
  }

  public update(time: number) {
    // Spin vortex surface
    this.vortexMesh.rotation.z = time * 1.5;
    this.vortexMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.05);

    // Pulse glow
    if (this.ringMesh.material instanceof THREE.MeshStandardMaterial) {
      this.ringMesh.material.emissiveIntensity = 0.7 + Math.sin(time * 4) * 0.3;
    }
  }

  public checkTrigger(playerPosition: THREE.Vector3): boolean {
    const dist = this.mesh.position.distanceTo(playerPosition);
    return dist < 2.2;
  }
}
