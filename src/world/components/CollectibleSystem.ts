/**
 * Collectible System for Adventure Mode
 * Handles spawning, pickup, and rewards for collectibles in levels
 */

import * as BABYLON from '@babylonjs/core';
import { getGameStore } from '../../engine/core/GameStore';
import { getEventManager } from '../../engine/core/EventManager';
import { EVENT_TYPES } from '../../engine/core/EventManager';
import { COLLECTIBLES, MYSTIC_VALLEY } from '../../constants';

export type CollectibleType = 'ring' | 'smallAnimal' | 'chaosDrive' | 'fruit';

export interface CollectibleConfig {
  type: CollectibleType;
  position: BABYLON.Vector3;
  rotation?: BABYLON.Vector3;
  scale?: number;
  respawnTime?: number; // ms, 0 = no respawn
  requiredAction?: 'jump' | 'attack' | 'speed' | 'none';
}

export interface CollectibleData {
  id: string;
  config: CollectibleConfig;
  mesh: BABYLON.Mesh | null;
  collected: boolean;
  lastCollectedTime: number;
  value: number;
}

export class CollectibleSystem {
  private scene: BABYLON.Scene;
  private collectibles: Map<string, CollectibleData>;
  private pickupHandlers: Map<CollectibleType, (data: CollectibleData) => void>;
  private animationGroup: BABYLON.AnimationGroup | null;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.collectibles = new Map();
    this.pickupHandlers = new Map();
    this.animationGroup = null;
    
    this.setupDefaultPickupHandlers();
  }

  /**
   * Setup default handlers for each collectible type
   */
  private setupDefaultPickupHandlers(): void {
    const store = getGameStore();
    const eventManager = getEventManager();

    this.pickupHandlers.set('ring', (data) => {
      store.addMaterial('rings', data.value);
      eventManager.emit({
        type: EVENT_TYPES.COLLECTIBLE_PICKED,
        payload: { type: 'ring', amount: data.value, position: data.config.position },
      });
    });

    this.pickupHandlers.set('smallAnimal', (data) => {
      store.addMaterial('smallAnimals', data.value);
      eventManager.emit({
        type: EVENT_TYPES.COLLECTIBLE_PICKED,
        payload: { type: 'smallAnimal', amount: data.value, position: data.config.position },
      });
      
      // Award Chao EXP when collecting animals
      const activeChao = store.getActiveChao();
      if (activeChao) {
        store.addChaoExp(activeChao.id, COLLECTIBLES.EXP_REWARD_SMALL_ANIMAL);
      }
    });

    this.pickupHandlers.set('chaosDrive', (data) => {
      store.addMaterial('chaosDrives', data.value);
      eventManager.emit({
        type: EVENT_TYPES.COLLECTIBLE_PICKED,
        payload: { type: 'chaosDrive', amount: data.value, position: data.config.position },
      });
      
      // Award significant Chao EXP
      const activeChao = store.getActiveChao();
      if (activeChao) {
        store.addChaoExp(activeChao.id, COLLECTIBLES.EXP_REWARD_CHAOS_DRIVE);
      }
    });

    this.pickupHandlers.set('fruit', (data) => {
      store.addMaterial('fruits', data.value);
      eventManager.emit({
        type: EVENT_TYPES.COLLECTIBLE_PICKED,
        payload: { type: 'fruit', amount: data.value, position: data.config.position },
      });
    });
  }

  /**
   * Create a ring collectible
   */
  createRing(
    position: BABYLON.Vector3,
    options: Partial<CollectibleConfig> = {}
  ): string {
    const config: CollectibleConfig = {
      type: 'ring',
      position,
      scale: options.scale || 1,
      respawnTime: options.respawnTime ?? COLLECTIBLES.RING_RESPAWN_TIME,
      requiredAction: options.requiredAction || 'none',
      ...options,
    };

    return this.createCollectible(config, COLLECTIBLES.RING_VALUE);
  }

  /**
   * Create a small animal collectible
   */
  createSmallAnimal(
    position: BABYLON.Vector3,
    options: Partial<CollectibleConfig> = {}
  ): string {
    const config: CollectibleConfig = {
      type: 'smallAnimal',
      position,
      scale: options.scale || 1.5,
      respawnTime: options.respawnTime ?? 0, // No respawn by default
      requiredAction: options.requiredAction || 'attack',
      ...options,
    };

    return this.createCollectible(config, COLLECTIBLES.SMALL_ANIMAL_VALUE);
  }

  /**
   * Create a chaos drive collectible
   */
  createChaosDrive(
    position: BABYLON.Vector3,
    options: Partial<CollectibleConfig> = {}
  ): string {
    const config: CollectibleConfig = {
      type: 'chaosDrive',
      position,
      scale: options.scale || 1.2,
      respawnTime: options.respawnTime ?? 0,
      requiredAction: options.requiredAction || 'speed',
      ...options,
    };

    return this.createCollectible(config, COLLECTIBLES.CHAOS_DRIVE_VALUE);
  }

  /**
   * Create a fruit collectible
   */
  createFruit(
    position: BABYLON.Vector3,
    options: Partial<CollectibleConfig> = {}
  ): string {
    const config: CollectibleConfig = {
      type: 'fruit',
      position,
      scale: options.scale || 0.8,
      respawnTime: options.respawnTime ?? COLLECTIBLES.FRUIT_RESPAWN_TIME,
      requiredAction: options.requiredAction || 'jump',
      ...options,
    };

    return this.createCollectible(config, COLLECTIBLES.FRUIT_VALUE);
  }

  /**
   * Generic collectible creation
   */
  private createCollectible(config: CollectibleConfig, value: number): string {
    const id = `collectible_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const data: CollectibleData = {
      id,
      config,
      mesh: null,
      collected: false,
      lastCollectedTime: 0,
      value,
    };

    // Create mesh based on type
    data.mesh = this.createCollectibleMesh(config);
    
    this.collectibles.set(id, data);
    
    return id;
  }

  /**
   * Create visual mesh for collectible
   */
  private createCollectibleMesh(config: CollectibleConfig): BABYLON.Mesh {
    let mesh: BABYLON.Mesh;

    switch (config.type) {
      case 'ring':
        mesh = this.createRingMesh(config.position, config.scale || 1);
        break;
      case 'smallAnimal':
        mesh = this.createAnimalMesh(config.position, config.scale || 1.5);
        break;
      case 'chaosDrive':
        mesh = this.createChaosDriveMesh(config.position, config.scale || 1.2);
        break;
      case 'fruit':
        mesh = this.createFruitMesh(config.position, config.scale || 0.8);
        break;
    }

    // Add floating animation
    this.addFloatingAnimation(mesh, config.type);

    return mesh;
  }

  /**
   * Create ring mesh
   */
  private createRingMesh(position: BABYLON.Vector3, scale: number): BABYLON.Mesh {
    const ring = BABYLON.MeshBuilder.CreateTorus('ring', {
      diameter: COLLECTIBLES.RING_SIZE * scale,
      thickness: COLLECTIBLES.RING_THICKNESS * scale,
    }, this.scene);

    ring.position = position;
    
    const ringMaterial = new BABYLON.StandardMaterial('ringMat', this.scene);
    ringMaterial.diffuseColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.RING_COLOR);
    ringMaterial.emissiveColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.RING_EMISSIVE);
    ring.material = ringMaterial;

    return ring;
  }

  /**
   * Create small animal mesh (simplified as capsule)
   */
  private createAnimalMesh(position: BABYLON.Vector3, scale: number): BABYLON.Mesh {
    const animal = BABYLON.MeshBuilder.CreateCapsule('animal', {
      height: COLLECTIBLES.ANIMAL_SIZE * scale,
      radius: (COLLECTIBLES.ANIMAL_SIZE * scale) / 3,
    }, this.scene);

    animal.position = position;
    
    const animalMaterial = new BABYLON.StandardMaterial('animalMat', this.scene);
    animalMaterial.diffuseColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.ANIMAL_COLOR);
    animalMaterial.emissiveColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.ANIMAL_EMISSIVE);
    animal.material = animalMaterial;

    return animal;
  }

  /**
   * Create chaos drive mesh (box with glow)
   */
  private createChaosDriveMesh(position: BABYLON.Vector3, scale: number): BABYLON.Mesh {
    const drive = BABYLON.MeshBuilder.CreateBox('chaosDrive', {
      size: COLLECTIBLES.CHAOS_DRIVE_SIZE * scale,
    }, this.scene);

    drive.position = position;
    
    const driveMaterial = new BABYLON.StandardMaterial('driveMat', this.scene);
    driveMaterial.diffuseColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.CHAOS_DRIVE_COLOR);
    driveMaterial.emissiveColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.CHAOS_DRIVE_EMISSIVE);
    drive.material = driveMaterial;

    // Add point light for glow effect
    const light = new BABYLON.PointLight('driveLight', position, this.scene);
    light.diffuse = new BABYLON.Color3.FromHexString(COLLECTIBLES.CHAOS_DRIVE_EMISSIVE);
    light.intensity = 2;
    light.radius = COLLECTIBLES.CHAOS_DRIVE_SIZE * scale * 3;

    return drive;
  }

  /**
   * Create fruit mesh (sphere)
   */
  private createFruitMesh(position: BABYLON.Vector3, scale: number): BABYLON.Mesh {
    const fruit = BABYLON.MeshBuilder.CreateSphere('fruit', {
      diameter: COLLECTIBLES.FRUIT_SIZE * scale,
    }, this.scene);

    fruit.position = position;
    
    const fruitMaterial = new BABYLON.StandardMaterial('fruitMat', this.scene);
    fruitMaterial.diffuseColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.FRUIT_COLOR);
    fruitMaterial.emissiveColor = new BABYLON.Color3.FromHexString(COLLECTIBLES.FRUIT_EMISSIVE);
    fruit.material = fruitMaterial;

    return fruit;
  }

  /**
   * Add floating animation to collectible
   */
  private addFloatingAnimation(mesh: BABYLON.Mesh, type: CollectibleType): void {
    const speed = type === 'ring' ? COLLECTIBLES.RING_FLOAT_SPEED : 
                  type === 'chaosDrive' ? COLLECTIBLES.CHAOS_DRIVE_FLOAT_SPEED : 1;
    
    const amplitude = type === 'ring' ? COLLECTIBLES.RING_FLOAT_AMPLITUDE : 0.3;

    // Create animation
    const animation = new BABYLON.Animation(
      'floatAnim',
      'position.y',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [
      { frame: 0, value: mesh.position.y },
      { frame: 30, value: mesh.position.y + amplitude },
      { frame: 60, value: mesh.position.y },
    ];

    animation.setKeys(keys);
    mesh.animations.push(animation);

    // Start animation
    this.scene.beginAnimation(mesh, 0, 60, true);
  }

  /**
   * Check collision with player
   */
  checkCollisions(playerPosition: BABYLON.Vector3, playerRadius: number = 1): void {
    const currentTime = Date.now();

    for (const [id, data] of this.collectibles.entries()) {
      if (data.collected || !data.mesh) continue;

      // Check respawn
      if (data.config.respawnTime && currentTime - data.lastCollectedTime > data.config.respawnTime) {
        data.collected = false;
        data.mesh.setEnabled(true);
      }

      if (data.collected) continue;

      // Distance check
      const distance = BABYLON.Vector3.Distance(playerPosition, data.mesh.position);
      
      if (distance < playerRadius + COLLECTIBLES.PICKUP_RADIUS) {
        this.collect(id);
      }
    }
  }

  /**
   * Collect a specific collectible
   */
  collect(id: string): boolean {
    const data = this.collectibles.get(id);
    if (!data || data.collected || !data.mesh) return false;

    data.collected = true;
    data.lastCollectedTime = Date.now();

    // Execute pickup handler
    const handler = this.pickupHandlers.get(data.config.type);
    if (handler) {
      handler(data);
    }

    // Hide mesh
    data.mesh.setEnabled(false);

    // Schedule respawn if applicable
    if (data.config.respawnTime && data.config.respawnTime > 0) {
      setTimeout(() => {
        data.collected = false;
        if (data.mesh) {
          data.mesh.setEnabled(true);
        }
      }, data.config.respawnTime);
    }

    return true;
  }

  /**
   * Remove a collectible
   */
  remove(id: string): void {
    const data = this.collectibles.get(id);
    if (!data) return;

    if (data.mesh) {
      data.mesh.dispose();
    }

    this.collectibles.delete(id);
  }

  /**
   * Clear all collectibles
   */
  clear(): void {
    for (const [id, data] of this.collectibles.entries()) {
      if (data.mesh) {
        data.mesh.dispose();
      }
    }
    this.collectibles.clear();
  }

  /**
   * Get all collectibles
   */
  getAllCollectibles(): CollectibleData[] {
    return Array.from(this.collectibles.values());
  }

  /**
   * Get collected count
   */
  getCollectedCount(): number {
    let count = 0;
    for (const data of this.collectibles.values()) {
      if (data.collected) count++;
    }
    return count;
  }

  /**
   * Get total count
   */
  getTotalCount(): number {
    return this.collectibles.size;
  }

  /**
   * Register custom pickup handler
   */
  registerPickupHandler(type: CollectibleType, handler: (data: CollectibleData) => void): void {
    this.pickupHandlers.set(type, handler);
  }
}
