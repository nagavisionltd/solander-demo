# Project Solander — Master Plan
**Version:** 0.5 · **Date:** 19 October 2026  
**Goal:** Prove the game in-browser, then package the opportunity.  
**First companion:** Lumi · **First platform:** Browser

## The game in one sentence
Raise and evolve Chao, explore worlds together, take on action stages, and compete using the abilities you develop.

## Five modes

### 1. Chao Garden — Home and care
Care for Chao, build bonds, plant seeds, grow the garden, and check stats, mood and development. This is the home base.

### 2. Adventure — Action stages
Sonic-style action levels: run, jump, platform, take routes, overcome obstacles and collect stage items. Lumi accompanies the player. This mode is about movement and action.

### 3. Explore — Worlds, battles and loot
Phantasy Star Online-inspired third-person worlds. Walk around with your Chao, battle enemies, discover areas, find items, gain experience and improve stats. This mode is about discovery and RPG progression.

### 4. Competitions — Chao sports
Playable events that test developed abilities: start with one solid event, then expand into racing, karate, swimming, flying and other sports.

### 5. Chao Lab — Evolution and collection
View Chao passports, stages, types, stats and memories; explore collection and customisation; witness cocoon-to-adult evolution. Keep this focused rather than turning it into a large management system.

## Main progression loop
**Garden → Adventure or Explore → Earn items/experience → Return to Garden → Care, plant and upgrade → Evolve → Competitions → Explore again**

Adventure and Explore are different modes, not two names for the same level.

## Current repository status
“Present in source” does not mean verified in a running browser build. Playtest each feature before calling it done.

| Feature | Known status |
|---|---|
| Browser-based 3D scene and Garden | Present in source; runtime needs checking |
| Procedural Chao model, multiple Chao and basic animation | Present in source; visuals are placeholder quality |
| Player movement and Chao following | Present in source; needs playtesting |
| Chao stats, emotions and level progression | Present in source; needs end-to-end testing |
| Sonic-style action level/world transition | Rough level present; needs playtesting |
| Explore-style combat, loot and world progression | Verify current implementation; build only what is missing |
| Evolution rules and stat-based types | Evolution system exists in source; verify gameplay wiring and transformation presentation |
| Playable competitions | Basic race/karate logic exists; verify and make one event genuinely playable |
| Save/load across refresh | Local storage code exists; needs testing |

## Work one mode at a time
Do not attempt to polish all five at once. Choose one mode, make it feel and play well, test it, then move to the next. Keep shared systems such as Chao stats, inventory, saves and companion behaviour reusable across modes.

Recommended order:
1. **Chao Garden** — establish the visual quality bar and make the home/care loop satisfying.
2. **Adventure** — make the existing action stage fun and reliable.
3. **Explore** — build a small world with combat, loot and XP.
4. **Chao Lab** — connect evolution, collection and visible transformation.
5. **Competitions** — deliver one complete event, then expand.

## Chao visual approach
Keep gameplay logic, stats, AI, interaction and animation control in code. For higher-quality character visuals, use a proper 3D model asset (ideally GLB/glTF) created in Blender or with an AI 3D modelling workflow, then load and animate it in Three.js. Claude can help write Blender scripts, model-loading code and rig/animation integration, but basic procedural spheres and capsules alone will keep looking like prototypes. Preserve a procedural fallback while testing a model asset. Keep the Solander design original.

## Demo target
Prove one coherent playable slice with Lumi: a polished Garden, one Adventure stage, one small Explore zone with combat and loot, visible progression/evolution, and one playable competition. Build this incrementally; do not fake unfinished modes with menu text.

## Rules
- Keep the current browser stack; make targeted changes rather than rewriting working systems.
- Preserve and test existing functionality before replacing it.
- Separate working features from planned ones.
- Use the attached game loop and Chao Sanctuary model as references.
- Draw inspiration from creature-raising, Sonic-style action and PSO-style exploration, but create an original Solander identity and assets.

**Success means:** the player forms a bond with Lumi, explores and earns progression, sees their Chao develop, and has a reason to keep playing.
