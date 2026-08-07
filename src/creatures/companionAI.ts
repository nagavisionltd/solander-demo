import * as THREE from 'three';
import { SolanderCreature } from './solander';

export enum AIState {
  IDLE = 'IDLE',
  WANDER = 'WANDER',
  FOLLOW = 'FOLLOW',
  INTERACT = 'INTERACT',
  SLEEP = 'SLEEP',
  SWIMMING = 'SWIMMING'
}

export class CompanionAIController {
  public creature: SolanderCreature;
  public state: AIState = AIState.IDLE;

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private stateTimer: number = 0;
  public isCompanion: boolean;

  constructor(creature: SolanderCreature, isCompanion: boolean = false) {
    this.creature = creature;
    this.isCompanion = isCompanion;
    if (this.isCompanion) {
      this.state = AIState.FOLLOW;
    } else {
      this.pickNewGardenActivity();
    }
  }

  public setCompanionStatus(isComp: boolean) {
    this.isCompanion = isComp;
    if (isComp) {
      this.state = AIState.FOLLOW;
      this.creature.isSleeping = false;
      this.creature.isSwimming = false;
    }
  }

  private pickNewGardenActivity() {
    const roll = Math.random();
    if (roll < 0.35) {
      // Wander to a random spot
      const radius = 9.0;
      this.targetPosition.set(
        (Math.random() - 0.5) * radius * 2,
        0,
        (Math.random() - 0.5) * radius * 2
      );
      this.state = AIState.WANDER;
      this.stateTimer = 4.0 + Math.random() * 4.0;
      this.creature.isSleeping = false;
      this.creature.isSwimming = false;
    } else if (roll < 0.6) {
      // Go take a nap / sleep
      this.state = AIState.SLEEP;
      this.stateTimer = 6.0 + Math.random() * 6.0;
      this.creature.isSleeping = true;
      this.creature.isSwimming = false;
      this.creature.velocity.set(0, 0, 0);
    } else if (roll < 0.85) {
      // Go swim in central pool (Pool Center x: 0, z: -8)
      this.targetPosition.set((Math.random() - 0.5) * 4.0, 0, -8 + (Math.random() - 0.5) * 4.0);
      this.state = AIState.SWIMMING;
      this.stateTimer = 8.0 + Math.random() * 6.0;
      this.creature.isSleeping = false;
      this.creature.isSwimming = true;
      this.creature.position.copy(this.targetPosition);
    } else {
      // Idle / Play
      this.state = AIState.IDLE;
      this.stateTimer = 3.0 + Math.random() * 4.0;
      this.creature.isSleeping = false;
      this.creature.isSwimming = false;
      this.creature.velocity.set(0, 0, 0);
    }
  }

  public update(
    deltaTime: number,
    playerPosition: THREE.Vector3,
    getGroundHeight: (x: number, z: number) => number,
    isPoolWater: (x: number, z: number) => boolean = () => false
  ) {
    if (this.creature.isCarried) {
      this.creature.update(deltaTime, getGroundHeight);
      return;
    }

    this.stateTimer -= deltaTime;

    const distToPlayer = this.creature.position.distanceTo(playerPosition);

    if (this.isCompanion) {
      // Active Follower Companion Behavior
      this.creature.isSleeping = false;
      this.creature.isSwimming = isPoolWater(this.creature.position.x, this.creature.position.z);

      if (distToPlayer > 14.0) {
        // Teleport if player gets too far
        const offset = new THREE.Vector3(1.5, 0, 1.5);
        this.creature.position.copy(playerPosition).add(offset);
        this.creature.velocity.set(0, 0, 0);
      } else if (distToPlayer > 2.8) {
        this.state = AIState.FOLLOW;
        const dir = new THREE.Vector3().subVectors(playerPosition, this.creature.position);
        dir.y = 0;
        dir.normalize();

        const moveSpeed = Math.min(6.0, distToPlayer * 1.9);
        this.creature.velocity.x = dir.x * moveSpeed;
        this.creature.velocity.z = dir.z * moveSpeed;

        const targetRotation = Math.atan2(dir.x, dir.z);
        this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 8);
      } else {
        this.state = AIState.IDLE;
        this.creature.velocity.x *= 0.8;
        this.creature.velocity.z *= 0.8;

        const dir = new THREE.Vector3().subVectors(playerPosition, this.creature.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.01) {
          const targetRotation = Math.atan2(dir.x, dir.z);
          this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 5);
        }
      }
    } else {
      // Wild / Garden Chao Behavior
      if (this.stateTimer <= 0) {
        this.pickNewGardenActivity();
      }

      if (this.state === AIState.WANDER) {
        const dir = new THREE.Vector3().subVectors(this.targetPosition, this.creature.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 0.6) {
          this.state = AIState.IDLE;
          this.stateTimer = 2.0 + Math.random() * 3.0;
          this.creature.velocity.set(0, 0, 0);
        } else {
          dir.normalize();
          this.creature.velocity.x = dir.x * 2.0;
          this.creature.velocity.z = dir.z * 2.0;

          const targetRotation = Math.atan2(dir.x, dir.z);
          this.creature.rotationY = THREE.MathUtils.lerp(this.creature.rotationY, targetRotation, deltaTime * 6);
        }
      } else if (this.state === AIState.SWIMMING) {
        this.creature.isSwimming = true;
        this.creature.velocity.x = Math.sin(Date.now() * 0.002) * 0.5;
        this.creature.velocity.z = Math.cos(Date.now() * 0.002) * 0.5;
      }
    }

    this.creature.update(deltaTime, getGroundHeight);
  }
}
