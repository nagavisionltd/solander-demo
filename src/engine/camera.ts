import * as THREE from 'three';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0; // Horizontal rotation angle in radians
  public pitch: number = 0.35; // Vertical rotation angle in radians
  public distance: number = 7.5;
  public heightOffset: number = 1.6;

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
    this.camera.position.set(0, 5, 10);
  }

  public updateAspectRatio(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public rotate(deltaX: number, deltaY: number) {
    const sensitivity = 0.003;
    this.yaw -= deltaX * sensitivity;
    this.pitch = Math.max(0.1, Math.min(1.2, this.pitch + deltaY * sensitivity));
  }

  public update(playerPos: THREE.Vector3, deltaTime: number) {
    // Target position (player center height)
    this.targetPosition.copy(playerPos).add(new THREE.Vector3(0, this.heightOffset, 0));

    // Calculate desired camera position based on spherical coordinates from yaw & pitch
    const dx = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const dy = Math.sin(this.pitch) * this.distance;
    const dz = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

    const desiredPosition = new THREE.Vector3(
      this.targetPosition.x + dx,
      this.targetPosition.y + dy,
      this.targetPosition.z + dz
    );

    // Smooth camera lerp
    const lerpSpeed = Math.min(1, deltaTime * 8);
    this.currentPosition.lerp(desiredPosition, lerpSpeed);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.targetPosition);
  }

  public getForwardVector(): THREE.Vector3 {
    // Return ground forward vector based on camera's current yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    return forward.normalize();
  }

  public getRightVector(): THREE.Vector3 {
    // Return ground right vector based on camera's current yaw
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    return right.normalize();
  }
}
