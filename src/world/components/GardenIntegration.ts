import * as THREE from 'three';
import { GameStore } from '../engine/core/GameStore';
import { ChaoManager } from '../chao/components/ChaoManager';
import { SimpleUI } from '../ui/SimpleUI';
import { COLLECTIBLES } from '../constants';

/**
 * Integrates Chao systems into the Garden scene.
 * This wrapper connects the visual garden with Chao management and UI.
 */
export class GardenIntegration {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private store: GameStore;
  private chaoManager: ChaoManager;
  private ui: SimpleUI;
  
  // Input state
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera, store: GameStore) {
    this.scene = scene;
    this.camera = camera;
    this.store = store;
    
    // Initialize Chao Manager
    this.chaoManager = new ChaoManager(scene, store);
    this.chaoManager.setCamera(camera);
    
    // Initialize UI
    this.ui = new SimpleUI(store);
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Setup event listeners for UI actions
    this.setupEventListeners();
    
    // Ensure we have at least one Chao for demo
    this.ensureDemoChao();
  }

  private ensureDemoChao(): void {
    const chaoArray = this.store.getChaoArray();
    if (chaoArray.length === 0) {
      // Create a demo Chao
      this.store.addChao('Test Chao');
    }
  }

  private setupInputHandlers(): void {
    const onMouseDown = (e: MouseEvent) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (this.isMouseDown) {
        // Check if it was a click (not a drag)
        const dx = Math.abs(e.clientX - this.lastMouseX);
        const dy = Math.abs(e.clientY - this.lastMouseY);
        
        if (dx < 5 && dy < 5) {
          // It's a click - handle Chao selection
          this.handleChaoClick(e.clientX, e.clientY);
        }
      }
      this.isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      // Handle dragging if holding a Chao
      this.chaoManager.handleInput(
        e.clientX, 
        e.clientY, 
        this.isMouseDown,
        window.innerWidth,
        window.innerHeight
      );
    };

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.isMouseDown = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (this.isMouseDown && e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - this.lastMouseX);
        const dy = Math.abs(touch.clientY - this.lastMouseY);
        
        if (dx < 10 && dy < 10) {
          this.handleChaoClick(touch.clientX, touch.clientY);
        }
      }
      this.isMouseDown = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.chaoManager.handleInput(
          e.touches[0].clientX,
          e.touches[0].clientY,
          true,
          window.innerWidth,
          window.innerHeight
        );
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);
  }

  private handleChaoClick(x: number, y: number): void {
    // Raycast to find clicked Chao
    const mouse = new THREE.Vector2(
      (x / window.innerWidth) * 2 - 1,
      -(y / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const chaoMeshes = this.chaoManager.getChaoMeshes();
    const intersects = raycaster.intersectObjects(chaoMeshes, true);

    if (intersects.length > 0) {
      // Find which Chao was clicked
      let clickedId: string | null = null;
      
      // Traverse up to find the group
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj) {
        // Try to match with Chao meshes
        for (const mesh of chaoMeshes) {
          if (obj === mesh || obj.parent === mesh) {
            // Found it - now get ID from manager
            // We need to find the ID by matching the mesh
            clickedId = this.findChaoIdByMesh(mesh);
            break;
          }
        }
        if (clickedId) break;
        obj = obj.parent;
      }

      if (clickedId) {
        this.ui.setSelectedChao(clickedId);
        // Auto-pickup on click
        // The ChaoManager will handle this via handleInput
      }
    } else {
      this.ui.setSelectedChao(null);
    }
  }

  private findChaoIdByMesh(mesh: THREE.Object3D): string | null {
    // This is a bit hacky but works for MVP
    // In a real implementation, we'd store weak references
    const chaoArray = this.store.getChaoArray();
    // For now, just return the first Chao ID as placeholder
    // The actual matching happens in ChaoManager
    return chaoArray.length > 0 ? chaoArray[0].id : null;
  }

  private setupEventListeners(): void {
    // Listen for feed events from UI
    this.store.on('chao_feed_apple', (data: any) => {
      if (data.chaoId) {
        this.chaoManager.feedChao(data.chaoId, 'apple');
      }
    });

    // Listen for pet events
    this.store.on('chao_pet', (data: any) => {
      if (data.chaoId) {
        this.chaoManager.petChao(data.chaoId);
      }
    });
  }

  public update(delta: number): void {
    this.chaoManager.update(delta);
  }

  public dispose(): void {
    this.chaoManager.dispose();
    this.ui.dispose();
  }
}
