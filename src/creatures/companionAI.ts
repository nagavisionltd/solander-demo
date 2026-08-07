import * as THREE from 'three';
import { SolanderCreature } from './solander';

export enum AIState {
  IDLE = 'IDLE',
  WANDER = 'WANDER',
  FOLLOW = 'FOLLOW',
  INTERACT = 'INTERACT'
}

export class CompanionAIController {
  private creature: SolanderCreature;
  public state: AIState = AIState.IDLE;

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private stateTimer: number = 0;
  private isCompanion: boolean;

  constructor(creature: SolanderCreature, isCompanion: boolean = false) {
    this.creature = creature;
    this.isCompanion = isCompanion;
    if (this.isCompanion) {
      this.state = AIState.FOLLOW;
    } else {
      this.pickNewWanderTarget();
    }
  }

  private pickNewWanderTarget() {
    const origin = this.creature.position;
    const radius = this.isCompanion ? 4.0 : 8.0;
    this.targetPosition.set(
      origin.x + (Math.random() - 0.5) * radius * 2,
      origin.y,
      origin.z + (Math.random() - 0.5) * radius * 2
    );
    this.state = AIState.WANDER;
    this.stateTimer = 4.0 + Math.random() * 4.0;
  }

  public update(
    deltaTime: number,
    playerPosition: THREE.Vector3,
    getGroundHeight: (x: number, z: number) => number
  ) {
    this.stateTimer -= deltaTime;

    const distToPlayer = this.creature.position.distanceTo(playerPosition);

    if (this.isCompanion) {
      // Companion (Lumi) Behavior
      if (distToPlayer > 12.0) {
        // Teleport if player gets too far away (e.g. on portal teleport)
        const offset = new THREE.Vector3(1.5, 0, 1.5);
        this.creature.position.copy(playerPosition).add(offset);
        this.creature.velocity.set(0, 0, 0);
      } else if (distToPlayer > 2.8) {
        // Follow player smoothly
        this.state = AIState.FOLLOW;
        const dir = new THREE.Vector3().subVectors(playerPosition, this.creature.position);
        dir.y = 0;
        dir.normalize();

        const moveSpeed = Math.min(5.5, distToPlayer * 1.8);
        this.creature.velocity.x = dir.x * moveSpeed;
        this.creature.velocity.z = dir.z * moveSpeed;

        const targetRotation = Math.atan2(dir.x, dir.z);
        this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 8);
      } else {
        // Close to player - IDLE / LOOK AT PLAYER
        this.state = AIState.IDLE;
        this.creature.velocity.x *= 0.8;
        this.creature.velocity.z *= 0.8;

        // Face player
        const dir = new THREE.Vector3().subVectors(playerPosition, this.creature.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.01) {
          const targetRotation = Math.atan2(dir.x, dir.z);
          this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 5);
        }
      }
    } else {
      // Non-companion wild garden creatures
      if (this.stateTimer <= 0) {
        if (this.state === AIState.WANDER) {
          this.state = AIState.IDLE;
          this.stateTimer = 2.0 + Math.random() * 3.0;
          this.creature.velocity.set(0, 0, 0);
        } else {
          this.pickNewWanderTarget();
        }
      }

      if (this.state === AIState.WANDER) {
        const dir = new THREE.Vector3().subVectors(this.targetPosition, this.creature.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 0.5) {
          this.state = AIState.IDLE;
          this.stateTimer = 2.0 + Math.random() * 3.0;
          this.creature.velocity.set(0, 0, 0);
        } else {
          dir.normalize();
          this.creature.velocity.x = dir.x * 1.8;
          this.creature.velocity.z = dir.z * 1.8;

          const targetRotation = Math.atan2(dir.x, dir.z);
          this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 6);
        }
      }
    }

    this.creature.update(deltaTime, getGroundHeight);
  }
}
