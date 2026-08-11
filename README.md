/**
 * README - Solander Garden Project
 * 
 * A 3D interactive garden experience built with Three.js and Next.js
 */

# Solander Garden

## Overview
An interactive 3D garden world featuring a customizable character companion, dynamic environments, and Sonic-inspired movement mechanics.

## Project Structure

```
/workspace
├── src/
│   ├── character/          # Character model and animation systems
│   │   ├── components/     # Reusable character components
│   │   └── utils/          # Character utilities
│   ├── combat/             # Combat system (weapons, attacks)
│   ├── creatures/          # Creature AI and behaviors
│   ├── engine/             # Core engine systems
│   │   ├── components/     # Reusable engine components
│   │   └── utils/          # Engine utilities (geometry, assets)
│   ├── player/             # Player controller
│   ├── systems/            # Global systems (audio, save, interaction)
│   ├── world/              # World environments
│   │   └── components/     # World building components
│   ├── constants/          # Centralized configuration
│   └── types/              # Shared TypeScript types
├── assets/
│   ├── models/             # 3D model files (.gltf, .glb)
│   ├── textures/           # Texture images
│   └── sounds/             # Audio files
└── app/                    # Next.js application
```

## Key Features

### Character System
- **Optimized Model**: Uses shared materials and toon shading
- **Procedural Animation**: Walk cycles, tail wagging, facial expressions
- **Sonic-inspired Movement**: Multi-stage speed system, spindash, air dash
- **LOD Support**: Level-of-detail rendering for performance

### Garden World
- **Dynamic Atmosphere**: Fireflies, mist particles, volumetric effects
- **Interactive Elements**: Collectible fruits, hatchable eggs
- **Water Features**: Waterfall with mist effects, reflective pools
- **Procedural Clouds**: Animated cloud formations

### Performance Optimizations
- **Instanced Rendering**: For repeated objects (grass, rocks)
- **Particle Systems**: Reusable, efficient particle effects
- **Geometry Merging**: Reduces draw calls for static meshes
- **Asset Caching**: Prevents redundant loading

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Modern browser with WebGL support

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build
```

### Configuration

Edit `src/constants/index.ts` to customize:
- Physics parameters (gravity, friction)
- Speed stages and movement values
- Animation timings
- Garden world settings
- Rendering options (LOD distances, shadow quality)

## Usage Examples

### Creating a Particle System

```typescript
import { ParticleSystem } from '@/src/engine/components/ParticleSystem';
import { createSoftParticleTexture } from '@/src/engine/utils/geometry';

const texture = createSoftParticleTexture(64);
const fireflies = new ParticleSystem({
  count: 60,
  size: 0.15,
  color: 0xfacc15,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  texture,
});

sceneGroup.add(fireflies.points);

// In your animation loop
fireflies.update(deltaTime);
```

### Using the Character Model

```typescript
import { CharacterModel } from '@/src/character/components/CharacterModel';

const character = new CharacterModel({
  height: 1.8,
  color: 0x4a90d9,
  enableLOD: true,
});

scene.add(character.mesh);

// In your animation loop
character.setMoving(isMoving);
character.update(deltaTime);
```

### Loading Assets

```typescript
import { assetLoader } from '@/src/engine/utils/AssetLoader';

// Load a texture
const texture = await assetLoader.loadTexture('/assets/textures/grass.jpg');

// Load a model
const gltf = await assetLoader.loadModel('/assets/models/tree.glb');

// Preload all assets from manifest
await assetLoader.preloadAll();
```

## Architecture Principles

1. **Component-Based Design**: Reusable, composable components
2. **Centralized Configuration**: All magic numbers in constants
3. **Resource Management**: Proper disposal to prevent memory leaks
4. **Type Safety**: Comprehensive TypeScript types
5. **Performance First**: LOD, instancing, culling

## Development Guidelines

### Adding New Components
1. Create component in appropriate `components/` folder
2. Implement `Updateable` and/or `Destroyable` interfaces
3. Add proper cleanup in `destroy()` method
4. Export from folder's index file

### Adding Constants
1. Add to `src/constants/index.ts` in appropriate category
2. Use descriptive names
3. Add comments explaining purpose

### Asset Management
1. Place assets in appropriate `assets/` subfolder
2. Use asset loader for caching
3. Dispose of unused assets

## Performance Tips

- Use `THREE.InstancedMesh` for repeated objects
- Limit particle counts based on target platform
- Enable frustum culling (`RENDERING.FRUSTUM_CULLING_ENABLED`)
- Adjust LOD distances for your scene scale
- Monitor cache stats with `assetLoader.getStats()`

## Troubleshooting

### Memory Leaks
Ensure all geometries and materials are disposed:
```typescript
// When removing objects
geometry.dispose();
material.dispose();
```

### Low FPS
- Reduce particle counts
- Lower shadow map size
- Enable more aggressive LOD
- Check for unnecessary updates in animation loop

### Asset Loading Failures
- Verify asset paths are correct
- Check CORS headers for external assets
- Use asset loader's error handling

## License

MIT
