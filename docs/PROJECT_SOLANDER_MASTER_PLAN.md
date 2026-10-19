# Project Solander — Master Plan
**Version:** 0.4 · **Date:** 19 October 2026  
**Goal:** Prove the game in-browser, then package the opportunity.  
**First companion:** Lumi · **First platform:** Browser

## The game in one sentence
Raise a Chao in the Garden, explore with it to collect upgrades, evolve it into an adult, then compete in sports and adventure levels.

## Three modes

### 1. Chao Garden — Home
- Chao follow the player and can be cared for.
- View Chao level and stats.
- Plant seeds and grow the garden.
- Level progress leads to a cocoon, then adult evolution.

### 2. Explore — Gather and grow
- Leave the Garden with your Chao.
- Explore a compact zone inspired by classic Sonic and Knuckles levels.
- Find seeds and items that improve Chao stats and level.
- Return to the Garden to bank discoveries and plant seeds.

### 3. Competitions — Play
Take your Chao into skill-based events:
- Racing
- Karate
- Tennis
- Swimming
- Flying

These are planned modes, not assumed to be implemented. Start with one competition that can be made fun quickly, then expand.

## Main loop
**Garden → Explore with Chao → Collect seeds/items → Return → Upgrade Chao / grow Garden → Level up → Cocoon → Adult Chao → Compete → Explore again**

## Current repository status

| Feature | Status |
|---|---|
| Browser-based 3D scene and Garden | Present in source; runtime needs checking |
| Chao model and multiple Chao in Garden | Present in source |
| Player movement and Chao following | Present in source |
| Chao stats and level progression | Present in source |
| Rough Sonic-style level / world transition | Present in source; needs playtesting |
| Resource collection and Garden seed planting | Basic code paths present; needs end-to-end test |
| Chao cocoon and adult evolution | **Not implemented as a complete feature** |
| Proper playable sports competitions | **Not yet proven; race/karate logic is currently basic** |
| Reliable save/load across refresh | Local storage code exists; needs testing |

“Present in source” does not mean verified in a running browser build. Confirm by playing the current repository.

## Demo scope — keep it small

The first demo only needs to prove:

1. Move around the Garden with Lumi following.
2. Enter one Explore level.
3. Collect a seed and one stat-upgrade item.
4. Return and see the items banked; plant a seed.
5. Gain Chao levels from upgrades.
6. Trigger a visible cocoon → adult evolution.
7. Enter one simple competition.

Do not build every sport, many biomes, multiplayer, accounts or a full franchise system yet.

## Build order

1. **Verify existing build:** run it, check controls, Chao following, stats, resources and level transition.
2. **Complete Explore loop:** collect → return → bank → plant/upgrade.
3. **Implement evolution:** define the level threshold, cocoon state, short transformation, adult model/appearance and saved adult state.
4. **Build one competition:** choose the simplest mode to prototype and make it playable, not timer-only.
5. **Playtest:** see whether people understand the loop and want to keep raising their Chao.
6. **Package the opportunity:** short gameplay video, concise pitch deck, feature roadmap and realistic next-phase budget.

## Rules
- Keep the current browser stack; iterate rather than rewrite.
- Prioritise a fun loop over feature count.
- Clearly separate working features from planned ones.
- Use the attached loop and Chao model as the reference for the demo.
- The game is inspired by classic creature-raising, Sonic-style exploration and Wii Sports-style competition; develop an original Solander identity and assets.

**Success means:** a player can raise a Chao, explore for upgrades, see it evolve, and try a competition — in one coherent playable demo.
