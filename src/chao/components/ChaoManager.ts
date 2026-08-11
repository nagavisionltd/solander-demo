import * as THREE from 'three';
import { GameStore } from '../../engine/core/GameStore';
import { ChaoData, ChaoEmotion, ChaoState } from '../../engine/core/GameStore';
import { SimpleChaoModel } from './SimpleChaoModel';
import { SimpleFruitModel } from './SimpleFruitModel';
import { CHAO_BEHAVIOR, CHAO_STATS } from '../../constants';

export interface ChaoEntity {
  id: string;
  data: ChaoData;
  model: SimpleChaoModel;
  currentFruit: SimpleFruitModel | null;
  isBeingHeld: boolean;
  isEating: boolean;
  emotion: ChaoEmotion;
}

/**
 * Manages all Chao in the garden scene.
 * Handles rendering, interaction (pickup, feed, pet), and state synchronization.
 */
export class ChaoManager {
  private scene: THREE.Scene;
  private store: GameStore;
  private chaoList: Map<string, ChaoEntity> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // Interaction state
  private heldChaoId: string | null = null;
  private hoveredChaoId: string | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  
  // Camera reference for raycasting
  private camera: THREE.Camera | null = null;

  constructor(scene: THREE.Scene, store: GameStore) {
    this.scene = scene;
    this.store = store;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Load existing Chao from store
    this.syncFromStore();
  }

  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Sync Chao entities with the GameStore
   */
  private syncFromStore(): void {
    const chaoArray = this.store.getChaoArray();
    
    // Remove deleted Chao
    for (const [id, entity] of this.chaoList) {
      if (!chaoArray.find(c => c.id === id)) {
        this.removeChao(id);
      }
    }
    
    // Add new Chao
    for (const chaoData of chaoArray) {
      if (!this.chaoList.has(chaoData.id)) {
        this.createChao(chaoData);
      }
    }
  }

  /**
   * Create a new Chao entity
   */
  private createChao(data: ChaoData): void {
    const model = new SimpleChaoModel(this.getChaoColor(data));
    this.scene.add(model.mesh);
    
    const entity: ChaoEntity = {
      id: data.id,
      data,
      model,
      currentFruit: null,
      isBeingHeld: false,
      isEating: false,
      emotion: 'neutral'
    };
    
    this.chaoList.set(data.id, entity);
  }

  /**
   * Remove a Chao entity
   */
  private removeChao(id: string): void {
    const entity = this.chaoList.get(id);
    if (entity) {
      this.scene.remove(entity.model.mesh);
      if (entity.currentFruit) {
        entity.currentFruit.dispose();
      }
      this.chaoList.delete(id);
    }
  }

  /**
   * Get Chao color based on type/stats (simplified for MVP)
   */
  private getChaoColor(data: ChaoData): number {
    // Basic color mapping - can be expanded later
    if (data.type === 'hero') return 0xffccaa;
    if (data.type === 'dark') return 0x663399;
    if (data.type === 'run') return 0xff6666;
    if (data.type === 'fly') return 0x66ccff;
    return 0x99ccff; // Default blue
  }

  /**
   * Update all Chao
   */
  public update(delta: number): void {
    this.syncFromStore();
    
    for (const [id, entity] of this.chaoList) {
      // Update emotion based on needs
      entity.emotion = this.calculateEmotion(entity.data);
      
      // Update eating
      if (entity.isEating && entity.currentFruit) {
        const finished = entity.currentFruit.update(delta);
        if (finished) {
          this.finishEating(id);
        }
        entity.model.update(delta, entity.emotion, true);
      } else {
        entity.model.update(delta, entity.emotion, false);
      }
      
      // Held animation
      if (entity.isBeingHeld) {
        entity.model.playPickupAnimation(Date.now() * 0.001);
      } else {
        entity.model.resetPosition();
        // Simple idle bobbing
        entity.model.mesh.position.y = Math.sin(Date.now() * 0.002 + entity.data.id.charCodeAt(0)) * 0.1;
      }
    }
  }

  /**
   * Calculate emotion based on Chao needs
   */
  private calculateEmotion(data: ChaoData): ChaoEmotion {
    const { hunger, energy, happiness } = data.needs;
    
    if (happiness > 70 && hunger > 50) return 'happy';
    if (hunger < 30 || energy < 30 || happiness < 30) return 'sad';
    return 'neutral';
  }

  /**
   * Handle mouse/touch input for interactions
   */
  public handleInput(clientX: number, clientY: number, isClicked: boolean, screenWidth: number, screenHeight: number): void {
    if (!this.camera) return;
    
    // Normalize mouse coordinates
    this.mouse.x = (clientX / screenWidth) * 2 - 1;
    this.mouse.y = -(clientY / screenHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get all Chao meshes
    const intersects = this.raycaster.intersectObjects(
      Array.from(this.chaoList.values()).map(e => e.model.mesh),
      true
    );
    
    if (intersects.length > 0) {
      // Find which Chao was clicked
      let clickedEntity: ChaoEntity | null = null;
      for (const [id, entity] of this.chaoList) {
        if (entity.model.mesh === intersects[0].object || 
            entity.model.mesh === (intersects[0].object as THREE.Object3D).parent) {
          clickedEntity = entity;
          break;
        }
      }
      
      if (clickedEntity && isClicked) {
        if (this.heldChaoId) {
          // Drop currently held Chao
          this.dropChao();
        }
        
        if (clickedEntity.id !== this.heldChaoId) {
          // Pick up new Chao
          this.pickupChao(clickedEntity.id);
        }
      } else if (!isClicked && !this.heldChaoId && clickedEntity) {
        // Hover effect (could add highlight later)
        this.hoveredChaoId = clickedEntity.id;
      } else {
        this.hoveredChaoId = null;
      }
    } else {
      this.hoveredChaoId = null;
    }
    
    // Dragging
    if (this.heldChaoId && this.camera) {
      this.moveHeldChao();
    }
  }

  /**
   * Pick up a Chao
   */
  private pickupChao(id: string): void {
    const entity = this.chaoList.get(id);
    if (!entity) return;
    
    entity.isBeingHeld = true;
    this.heldChaoId = id;
    
    // Calculate offset so Chao doesn't snap to center
    if (this.camera) {
      const chaoPos = entity.model.mesh.position.clone();
      const cameraPos = this.camera.position.clone();
      this.dragOffset.subVectors(chaoPos, cameraPos).multiplyScalar(0.5);
    }
    
    // Increase happiness when picked up
    this.store.updateChaoNeeds(id, { happiness: Math.min(100, entity.data.needs.happiness + 10) });
  }

  /**
   * Drop the held Chao
   */
  private dropChao(): void {
    if (!this.heldChaoId) return;
    
    const entity = this.chaoList.get(this.heldChaoId);
    if (entity) {
      entity.isBeingHeld = false;
      entity.model.resetPosition();
    }
    
    this.heldChaoId = null;
  }

  /**
   * Move held Chao with camera/mouse
   */
  private moveHeldChao(): void {
    if (!this.heldChaoId || !this.camera) return;
    
    const entity = this.chaoList.get(this.heldChaoId);
    if (!entity) return;
    
    // Position Chao in front of camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const distance = 3; // Hold distance
    const targetPos = this.camera.position.clone().add(direction.multiplyScalar(distance));
    
    // Smooth follow
    entity.model.mesh.position.lerp(targetPos, 0.2);
    entity.model.mesh.lookAt(this.camera.position);
  }

  /**
   * Feed a Chao (called from UI or key press)
   */
  public feedChao(id: string, fruitType: 'apple' | 'banana' | 'cherry'): void {
    const entity = this.chaoList.get(id);
    if (!entity || entity.isEating) return;
    
    // Check inventory
    const inventory = this.store.getInventory();
    const fruitKey = `${fruitType}_fruit` as keyof typeof inventory;
    
    if ((inventory[fruitKey] || 0) <= 0) {
      console.warn('No fruit in inventory');
      return;
    }
    
    // Consume fruit from inventory
    this.store.removeFromInventory(fruitKey, 1);
    
    // Create fruit model
    entity.currentFruit = new SimpleFruitModel(fruitType);
    entity.currentFruit.mesh.position.set(0.5, 1.5, 0.8);
    entity.model.mesh.add(entity.currentFruit.mesh);
    
    entity.isEating = true;
    
    // Update Chao stats
    const expGain = CHAO_STATS.BASE_EXP_GAIN;
    this.store.gainChaoExp(id, expGain);
    this.store.updateChaoNeeds(id, { 
      hunger: Math.min(100, entity.data.needs.hunger + 30),
      happiness: Math.min(100, entity.data.needs.happiness + 15)
    });
  }

  /**
   * Finish eating
   */
  private finishEating(id: string): void {
    const entity = this.chaoList.get(id);
    if (!entity) return;
    
    if (entity.currentFruit) {
      entity.model.mesh.remove(entity.currentFruit.mesh);
      entity.currentFruit.dispose();
      entity.currentFruit = null;
    }
    
    entity.isEating = false;
  }

  /**
   * Pet a Chao (increase happiness)
   */
  public petChao(id: string): void {
    const entity = this.chaoList.get(id);
    if (!entity) return;
    
    this.store.updateChaoNeeds(id, { 
      happiness: Math.min(100, entity.data.needs.happiness + 20)
    });
    
    // Show happy emotion briefly
    entity.emotion = 'happy';
    setTimeout(() => {
      if (entity) entity.emotion = this.calculateEmotion(entity.data);
    }, 2000);
  }

  /**
   * Get all Chao meshes for collision/raycasting
   */
  public getChaoMeshes(): THREE.Object3D[] {
    return Array.from(this.chaoList.values()).map(e => e.model.mesh);
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    for (const [, entity] of this.chaoList) {
      this.scene.remove(entity.model.mesh);
      if (entity.currentFruit) {
        entity.currentFruit.dispose();
      }
    }
    this.chaoList.clear();
  }
}
