# Constants Module

Centralized configuration constants for the Solander Garden project.

## Usage

```typescript
import { PHYSICS, SPEED_STAGES, GARDEN } from '@/src/constants';

// Use in physics calculations
velocity.y += PHYSICS.GRAVITY * deltaTime;

// Check speed stage
if (speed >= SPEED_STAGES.MACH_RUN.maxSpeed) {
  // Mach run achieved!
}

// Access garden parameters
const poolCenter = new Vector3(
  GARDEN.POOL_CENTER.x,
  GARDEN.POOL_CENTER.y,
  GARDEN.POOL_CENTER.z
);
```

## Categories

- **PHYSICS**: Gravity, friction, terminal velocity
- **SPEED_STAGES**: Jog, Run, Super Run, Top Speed, Mach Run
- **JUMP**: Base force, thresholds
- **ROLL/DASH**: Durations, multipliers, cooldowns
- **ANIMATION**: Cycle timings, combo windows
- **GARDEN**: Pool positions, particle counts
- **RENDERING**: LOD distances, shadow settings
- **AUDIO**: Volume levels, intervals
- **INTERACTION**: Reach distance, carry offsets
- **PERFORMANCE**: Max particles, batch sizes
