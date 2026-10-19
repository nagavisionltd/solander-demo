import * as THREE from 'three';
import { RENDERING } from '../../constants';

/**
 * LOD (Level of Detail) System for efficient rendering
 * Manages multiple detail levels for meshes based on camera distance
 */
export interface LODLevel {
  distance: number;
  mesh: THREE.Mesh | THREE.Group | null;
  visible: boolean;
}

export class LODSystem {
  private lodLevels: LODLevel[] = [];
  private currentLOD: number = 0;
  private group: THREE.Group;
  private baseMesh: THREE.Mesh | THREE.Group | null = null;
  
  constructor(baseMesh?: THREE.Mesh | THREE.Group) {
    this.group = new THREE.Group();
    if (baseMesh) {
      this.baseMesh = baseMesh;
      this.group.add(baseMesh);
    }
  }
  
  /**
   * Add a LOD level with specific distance threshold
   * @param distance - Distance at which this LOD becomes active
   * @param mesh - The mesh for this LOD level (null to hide)
   */
  addLODLevel(distance: number, mesh: THREE.Mesh | THREE.Group | null = null): void {
    const level: LODLevel = {
      distance,
      mesh,
      visible: false
    };
    
    if (mesh && mesh !== this.baseMesh) {
      this.group.add(mesh);
      mesh.visible = false;
    }
    
    this.lodLevels.push(level);
  }
  
  /**
   * Create standard LOD levels automatically based on RENDERING constants
   * @param highDetailMesh - High detail mesh (closest)
   * @param mediumDetailMesh - Medium detail mesh
   * @param lowDetailMesh - Low detail mesh (farthest)
   */
  createStandardLODs(
    highDetailMesh?: THREE.Mesh | THREE.Group,
    mediumDetailMesh?: THREE.Mesh | THREE.Group,
    lowDetailMesh?: THREE.Mesh | THREE.Group
  ): void {
    // Clear existing
    this.lodLevels = [];
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child !== this.baseMesh) {
        child.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
          if ((obj as THREE.Mesh).material) {
            const material = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
            if (Array.isArray(material)) {
              material.forEach(m => m.dispose());
            } else {
              material.dispose();
            }
          }
        });
      }
    }
    
    // Add LOD levels using RENDERING constants
    if (highDetailMesh) {
      this.baseMesh = highDetailMesh;
      this.group.add(highDetailMesh);
      this.lodLevels.push({
        distance: 0,
        mesh: highDetailMesh,
        visible: true
      });
    }
    
    if (mediumDetailMesh) {
      this.group.add(mediumDetailMesh);
      mediumDetailMesh.visible = false;
      this.lodLevels.push({
        distance: RENDERING.LOD_DISTANCE_MEDIUM,
        mesh: mediumDetailMesh,
        visible: false
      });
    }
    
    if (lowDetailMesh) {
      this.group.add(lowDetailMesh);
      lowDetailMesh.visible = false;
      this.lodLevels.push({
        distance: RENDERING.LOD_DISTANCE_HIGH,
        mesh: lowDetailMesh,
        visible: false
      });
    }
  }
  
  /**
   * Update LOD based on camera distance
   * @param cameraPosition - Camera world position
   * @param worldPosition - Object world position
   */
  update(cameraPosition: THREE.Vector3, worldPosition: THREE.Vector3): void {
    if (this.lodLevels.length === 0) return;
    
    const distance = cameraPosition.distanceTo(worldPosition);
    
    // Find appropriate LOD level
    let newLOD = 0;
    for (let i = this.lodLevels.length - 1; i >= 0; i--) {
      if (distance >= this.lodLevels[i].distance) {
        newLOD = i;
        break;
      }
    }
    
    // Clamp to max LOD
    if (newLOD >= this.lodLevels.length) {
      newLOD = this.lodLevels.length - 1;
    }
    
    // Switch LOD if changed
    if (newLOD !== this.currentLOD) {
      this.switchLOD(newLOD);
    }
  }
  
  /**
   * Get the current LOD group to add to scene
   */
  getGroup(): THREE.Group {
    return this.group;
  }
  
  /**
   * Force a specific LOD level
   */
  forceLOD(level: number): void {
    if (level >= 0 && level < this.lodLevels.length) {
      this.switchLOD(level);
    }
  }
  
  /**
   * Get current LOD level index
   */
  getCurrentLOD(): number {
    return this.currentLOD;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this.lodLevels.forEach(level => {
      if (level.mesh && level.mesh !== this.baseMesh) {
        level.mesh.traverse((obj) => {
          if ((obj as THREE.Mesh).geometry) {
            (obj as THREE.Mesh).geometry.dispose();
          }
          if ((obj as THREE.Mesh).material) {
            const material = (obj as THREE.Mesh).material as THREE.Material | THREE.Material[];
            if (Array.isArray(material)) {
              material.forEach(m => m.dispose());
            } else {
              material.dispose();
            }
          }
        });
      }
    });
    
    this.lodLevels = [];
    this.currentLOD = 0;
  }
  
  private switchLOD(newLevel: number): void {
    // Hide all levels
    this.lodLevels.forEach((level, idx) => {
      if (level.mesh) {
        level.mesh.visible = idx === newLevel;
      }
      level.visible = idx === newLevel;
    });
    
    this.currentLOD = newLevel;
  }
}

/**
 * Simple LOD helper for single mesh replacement
 * Creates a simplified version of a mesh automatically
 */
export function createSimplifiedMesh(
  originalMesh: THREE.Mesh,
  reductionFactor: number = 0.5
): THREE.Mesh {
  const geometry = originalMesh.geometry.clone() as THREE.BufferGeometry;
  const material = originalMesh.material.clone();
  
  // Simple vertex reduction (can be enhanced with proper decimation)
  const positions = geometry.attributes.position.array;
  const reducedCount = Math.floor(positions.length / 9); // Reduce triangles
  
  if (reductionFactor < 1.0 && reducedCount > 12) {
    // Create simplified geometry
    const simplifiedGeo = new THREE.BufferGeometry();
    const reducedPositions = new Float32Array(reducedCount * 3);
    
    for (let i = 0; i < reducedCount * 3; i++) {
      reducedPositions[i] = positions[i];
    }
    
    simplifiedGeo.setAttribute('position', new THREE.BufferAttribute(reducedPositions, 3));
    simplifiedGeo.computeVertexNormals();
    
    return new THREE.Mesh(simplifiedGeo, material);
  }
  
  return new THREE.Mesh(geometry, material);
}
