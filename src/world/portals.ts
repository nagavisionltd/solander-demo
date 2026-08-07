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

    // Obvious World Gateway Sign Board & Beacon
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 2.8, 0);

    const signBoardGeo = new THREE.BoxGeometry(3.6, 0.9, 0.2);
    const signBoardMat = new THREE.MeshToonMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0x581c87 : 0x0369a1
    });
    const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signGroup.add(signBoard);

    // Glowing Sign Border
    const borderGeo = new THREE.BoxGeometry(3.8, 1.1, 0.15);
    const borderMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8,
      emissive: targetWorld === 'MYSTIC_VALLEY' ? 0xa855f7 : 0x0284c7,
      emissiveIntensity: 1.2
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = -0.05;
    signGroup.add(border);

    // Floating Crystal Beacon Top
    const beaconGeo = new THREE.OctahedronGeometry(0.45, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: targetWorld === 'MYSTIC_VALLEY' ? 0xe9d5ff : 0xe0f2fe,
      emissive: targetWorld === 'MYSTIC_VALLEY' ? 0xc084fc : 0x38bdf8,
      emissiveIntensity: 1.5
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 0.8;
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
