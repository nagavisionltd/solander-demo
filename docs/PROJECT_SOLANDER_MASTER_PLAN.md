# Project Solander — Master Plan
**Working edition:** 0.2 · **Last consolidated:** 18 October 2026  
**Project owner / Creative Director:** Curtis Soul · NagaVision Ltd  
**Status:** Strategic working document — implementation status must be verified against the playable build.

> **North star:** Every system should strengthen the player's bond with their companion, or make the world more meaningful to explore.

## 1. Executive vision

Project Solander is an original 3D creature-raising adventure IP built around a living ecosystem. Players explore a world, discover and rescue creatures, bring them home, form relationships, train and evolve them, then use what they learn and become to access new places and experiences.

The ambition is bigger than a garden simulator and more emotionally grounded than a creature collection checklist. The garden is the player's home; the companion is the emotional anchor; the wider world is a playground for curiosity, adaptation and discovery.

Long-term opportunities may include PC and console releases, companion-linked mobile features, social play, arcade experiences, competitions, and physical collectibles. These are strategic possibilities, not launch commitments.

## 2. Product identity

### What makes Solander distinct
- **Bond before stats:** care, personality, memory and shared experiences matter.
- **An ecosystem, not a menu of modes:** exploration feeds raising; raising changes traversal; traversal reveals secrets; competition celebrates growth.
- **Adaptation as progression:** creature traits and DNA-inspired abilities change how players understand and move through the same world.
- **A home worth returning to:** the garden visibly changes as the player and companions grow.
- **Stories emerge from play:** companions develop preferences, relationships and memorable moments through understandable systems.

### Design test
For each proposed feature, ask:
1. Does it strengthen attachment to a companion?
2. Does it create an interesting choice, discovery or player-authored story?
3. Does it connect to another system rather than exist in isolation?
4. Can the player understand the feedback without reading a wall of text?
5. Is it feasible for the current team and target platform?

If the answer is mostly no, defer it.

## 3. Core player loop

**Discover → Rescue / collect → Return home → Care and bond → Train / adapt → Explore further → Find new resources and stories → Repeat.**

A fuller franchise loop can later add evolution, races, trials, tactical encounters, festivals and community events. These should be layered on only after the smaller loop is satisfying.

## 4. Pillars and modes

### Garden / Home
The emotional hub. Feed, pet, carry, observe and play with companions; collect resources; hatch eggs; customise a small space; see the effects of care and time. The garden should feel alive even when the player is not pursuing a mission.

### Adventure
Authored routes, environmental puzzles, secrets and selective combat. Levels are built around verbs and discoveries, not long empty corridors. A central hub connects distinct regions, and returning with new abilities should reveal new routes.

### Explore
A lower-pressure activity loop: gathering, fishing, mining, archaeology, tracking and rare discoveries, introduced only when they can support the core game.

### Trials / Festival
Short, repeatable races, obstacle courses and skill challenges that let companions demonstrate their development. Tactical battles and larger tournaments are later-stage candidates, not prerequisites for the first compelling build.

## 5. Companion system

### First playable companion
Use one companion to prove the full emotional loop before scaling species count. Lumi is the working companion name in earlier planning; confirm whether this remains the chosen name in the current build.

### Minimum companion behaviour
- Clear emotional states with visible reactions.
- Follow, wander, approach and idle behaviours.
- Feeding, petting and carrying interactions with responsive animation.
- A small set of needs/preferences and a readable bond/progression signal.
- Persistent identity and basic save/load.
- Reliable feedback when the player does something meaningful.

### Growth and identity — later layers
- Personality traits, favourite foods, toys and locations.
- Memory of selected meaningful events, not a transcript of every action.
- Friendship, rivalry and social behaviour.
- Trait inheritance / breeding and rare lineages.
- Visual evolution and environmental influence.

Do not build a complex genetics simulator until players care about the base companion.

## 6. Adaptation and creature DNA

The early archetypes are **Rabbit, Wolf, Dragon and Phoenix**. Treat these as a design framework, not a promise that all four are fully implemented.

- **Rabbit:** agility, longer jumps and nimble traversal.
- **Wolf:** scent, tracking and hidden-route discovery.
- **Dragon:** gliding / aerial traversal and possible elemental interactions.
- **Phoenix:** heat-related interactions, aerial movement or regeneration.

The defining rule: a traversal obstacle should ideally be solved through what the player or companion has become, not simply by finding a key. Abilities should combine and unlock new readings of previously visited spaces.

## 7. World structure

Start with a small, coherent geography:
1. **Solander Garden:** safe home, first companion interactions and onboarding.
2. **First adventure region:** one visually distinct area with a clear landmark, a resource loop, a secret route and one adaptation-gated discovery.
3. **Return path:** a reason to go back to the garden and see a consequence of the adventure.
4. **Cave / portal transition:** retain only if it supports clear navigation and a meaningful destination.
5. **Second region:** expand only after the first region's movement, interaction and return loop works reliably.

Potential future biomes include Meadow, Forest, Beach, Volcano, Crystal Cave, Cloud, Dream, Ancient and Haunted Gardens. These are expansion vocabulary, not first-slice scope.

## 8. First vertical slice: definition of done

The first slice should prove one complete player experience, not the number of features in the repository.

- The player can enter and navigate the garden with reliable controls.
- At least one companion behaves believably and responds to care.
- One meaningful resource / egg / discovery can be found and used.
- A clear transition leads to a compact adventure area.
- One creature trait or ability enables a new route or discovery.
- The player can return home and observe a persistent consequence.
- Save/load preserves essential player and companion state.
- A first-time player can understand the loop with minimal text.
- The build runs consistently in the target browser and has no blocker-level console errors.
- Performance and asset loading are acceptable on an agreed reference device.

**Do not expand scope** until these criteria are tested in a playable build.

## 9. Production roadmap and gates

### Gate 0 — Audit and stabilise
- Confirm the current default branch and working demo.
- Run install, development server and production build.
- Map implemented, partial, broken and planned systems.
- Record controls, known bugs, asset licences and performance baseline.
- Keep the current demo reproducible.

**Exit:** a verified build and a truthful implementation inventory.

### Gate 1 — Feel
- Polish player movement, camera, collisions and interaction prompts.
- Make the companion feel responsive through animation, timing and feedback.
- Remove major friction from the garden loop.

**Exit:** a new tester can move, interact and form an initial attachment without coaching.

### Gate 2 — Remember
- Implement the smallest dependable save/load system.
- Persist companion identity, state and a few meaningful milestones.
- Establish a data model that can be extended without premature backend complexity.

**Exit:** returning to the game feels continuous rather than reset.

### Gate 3 — Discover
- Build one compact adventure region.
- Add a resource / secret loop and one adaptation-gated route.
- Connect adventure outcomes back to the garden.

**Exit:** players have a reason to explore, return and try something new.

### Gate 4 — Demonstrate growth
- Prototype one clear progression or evolution consequence.
- Add one short trial or race only if the core loop is already strong.
- Test comprehension, enjoyment and replay intent with external players.

**Exit:** playtest feedback supports the core fantasy, not just the visuals.

### Gate 5 — Vertical-slice presentation
- Fix priority bugs, optimise assets and controls, capture clean footage.
- Prepare a concise pitch, gameplay trailer and production estimate.
- Decide whether the next investment is prototype expansion, a funding/publishing approach or a narrower product.

**Exit:** a repeatable demo that communicates the game's unique appeal in minutes.

## 10. Technical direction

The repository currently documents a browser-first Three.js / Next.js / TypeScript architecture. Preserve the existing stack unless an audit demonstrates a concrete reason to change it.

Architecture principles:
- Keep gameplay systems modular and state ownership explicit.
- Separate game state from presentation and animation.
- Centralise tunable values; avoid scattered magic numbers.
- Use shared assets, instancing and level-of-detail where appropriate.
- Dispose of GPU resources and listeners correctly.
- Load assets predictably and expose useful failure states.
- Keep save data versioned and migrate it deliberately.
- Design for keyboard first in the prototype; add controller/touch only when a target and UX are defined.
- Avoid backend, multiplayer and cross-platform-account infrastructure until the vertical slice proves a need.

Suggested system boundaries: player controller, camera, interaction, companion AI/state, world/level, progression/save, asset loading, audio, UI and diagnostics. Match these boundaries to the actual repository after audit rather than forcing a rewrite to fit this document.

## 11. UX and art direction

- Strong, readable silhouettes for player and creatures.
- Warm, magical, colourful environments with clear landmarks and navigable paths.
- Important interactables must read at a glance.
- Teach through creature behaviour, footprints, framing, light and environmental clues before adding tutorial paragraphs.
- Feedback should be immediate: animation, sound, particles or a simple UI response.
- Keep HUD minimal; show the information needed for the current action.
- Use accessibility options for camera sensitivity, audio levels, input remapping and motion comfort as the project matures.
- Originalise the visual language. Inspirations are reference points, not assets or designs to copy.

## 12. Commercial and franchise strategy

Build proof before promises.

**Near term:** playable browser demo, original visual identity, clear gameplay capture, playtest evidence and a concise pitch package.

**Mid term:** expand the vertical slice based on player evidence; evaluate PC distribution and community-building; establish a realistic production budget and team plan.

**Long term opportunities:** console/mobile adaptations, companion passport across experiences, social play, arcade integrations, seasonal events, physical merchandise and QR/NFC-linked extras.

Do not build monetisation around breeding, rarity or competitive advantage before the game has demonstrated trust and fun. Avoid pay-to-win assumptions. Any account, privacy, child-safety or cross-device feature requires a deliberate product and compliance plan.

## 13. Evidence and success measures

Track a small set of observable measures:
- Time to first meaningful companion interaction.
- Percentage of testers who understand how to care for the companion.
- Percentage who discover the first secret or resource without help.
- Successful completion of the garden → adventure → return loop.
- Save/load reliability.
- Session stability and frame-time / loading performance on reference hardware.
- Tester descriptions of what made their companion feel distinctive.
- Desire to return and what they want to do next.

Use short moderated playtests and record confusion, delight and abandonment points. Do not mistake feature count or developer enthusiasm for evidence of player attachment.

## 14. Risks and guardrails

- **Scope creep:** the world vision is large; the first slice must stay small.
- **Feature-first development:** more systems cannot compensate for an unconvincing companion.
- **Premature infrastructure:** multiplayer, complex genetics, accounts and cross-platform services add cost before value is proven.
- **Prototype fragility:** document how to run, build and test the project; maintain reproducible checkpoints.
- **IP confusion:** keep Solander's identity and mechanics distinct from its inspirations and from other Naga games.
- **Unverified implementation claims:** mark features as implemented only after testing them in the current branch.

## 15. Decisions to confirm

1. Is **Lumi** still the first companion's name?
2. Is **Neelo** the player character for Solander, or does that name belong to a separate game / shared character universe?
3. Is the first target a browser-playable proof of concept, or a PC-first vertical slice that happens to use web technology?
4. Which current build URL is the trusted live demo, if one exists?
5. Is the immediate goal a playable prototype, a publisher/investor pitch, or both in sequence?
6. Which existing mechanics are genuinely working today, versus planned or partially implemented?

## 16. Immediate next actions

1. Audit the current main branch and run the build.
2. Create a feature-status matrix: **working / partial / broken / planned**.
3. Test the complete garden → companion interaction → discovery → adventure → return loop.
4. Fix the highest-impact blockers before adding new features.
5. Update this document with verified status and assign each roadmap item a priority and acceptance test.
6. Create a short capture-ready build and use external playtest evidence to decide the next milestone.

---

**Master principle:** Solander should not ask players to care because the game tells them to. It should give them a companion that earns that care, a world that rewards curiosity, and a history that feels like their own.
