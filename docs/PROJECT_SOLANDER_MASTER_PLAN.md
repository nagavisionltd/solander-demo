# Project Solander — Master Plan
**Working edition:** 0.3 · **Last consolidated:** 18 October 2026  
**Owner / Creative Director:** Curtis Soul · NagaVision Ltd  
**Planning status:** Source audit completed; runtime/build audit still outstanding.

> **North star:** Every system should strengthen the player's bond with Lumi or make the world more meaningful to explore.

## 1. Executive direction

Project Solander is an original 3D creature-raising adventure IP built around a living ecosystem. The near-term job is to prove a small, emotionally convincing game loop in the browser, then package that evidence into a credible opportunity for partners, publishers or investors.

**Sequence:** Prove the game → test with players → capture evidence → package the opportunity.  
Do not reverse this sequence by polishing a pitch around unverified features.

The garden is home. Lumi is the emotional anchor. Exploration creates discoveries. Raising and bonding should change what the player can do next.

Long-term opportunities may include PC/console, mobile companion features, social play, arcade experiences, competitions and physical collectibles. These are options, not launch commitments.

## 2. Decisions now set

- **Immediate objective:** both, in sequence — playable proof first, opportunity package second.
- **First companion:** Lumi.
- **First platform:** browser-playable, for fast iteration.
- **Technical direction:** preserve the current Next.js + React + TypeScript + Three.js stack unless the build audit identifies a concrete blocker.
- **Scope principle:** prove one complete loop before adding breadth.

The code currently uses the names **Solander**, **Lumi**, **Nova**, **Terra**, and several **Chao** labels. The HUD labels the player as **Neelo** during combat. Confirm the canonical naming and original identity before pitch materials are produced.

## 3. What makes Solander distinct

1. **Bond before stats:** care should create visible, understandable reactions.
2. **Adaptation as progression:** what a companion becomes should change how the player explores.
3. **A home worth returning to:** adventures should leave a lasting consequence in the garden.
4. **A living ecosystem:** companions should feel like individuals, not interchangeable collectibles.
5. **Discovery over checklisting:** teach through behaviour, landmarks, sound, light and environmental clues.

Every proposed feature must answer: does it deepen attachment, create meaningful discovery, connect systems, provide clear feedback, and fit the current proof budget?

## 4. Current repository audit

This status is based on source inspection of the default-branch files and commit history. It is **not** a claim that a production build or live playtest has passed. Until a browser run and build are completed, implementation statuses below mean “visible in source”, not “verified working end-to-end”.

| System / feature | Source audit status | Notes / next verification |
|---|---|---|
| Browser app shell | **Implemented in source; runtime unverified** | Next.js client page mounts a Three.js scene and React HUD. Run install, lint and production build. |
| 3D scene and camera | **Implemented in source; runtime unverified** | Three.js renderer, third-person camera, lighting, fog and bloom are wired in scene manager. |
| Garden world | **Implemented in source; runtime unverified** | Garden world and environment systems are instantiated. Check spawn, collisions, readability and frame rate. |
| Lumi as default companion | **Implemented in source; runtime unverified** | Save model creates Lumi with a persistent ID, baseline stats, personality, bond and initial memory. Verify on a clean browser profile. |
| Other garden creatures | **Implemented in source; runtime unverified** | Nova and Terra are seeded as additional creatures; AI controllers are created for the initial roster. |
| Companion interaction | **Implemented in source; runtime unverified** | Source includes feeding, petting/carrying pathways, emotion feedback and bond/stat changes across relevant systems. Test each action and its feedback. |
| Local save/load | **Implemented in source; needs robustness test** | Uses browser localStorage key `solander_save` for game state and creature records. No versioned migration is evident in inspected code; test corrupted/old saves and reload continuity. |
| Resources and inventory data | **Implemented in source; loop needs validation** | Essence, seeds, crystals and several fruit resources are tracked. Confirm collection, spending and reward balance in play. |
| Eggs / hatching | **Implemented in source; runtime unverified** | Save system contains hatch logic and new-creature creation. Verify discovery, hatch trigger and scene/AI registration together. |
| Mystic Valley | **Implemented in source; runtime unverified** | Separate world, stage selection, portal transitions and resource/enemy systems are wired. Verify entry/exit, spawn points and return-to-garden continuity. |
| Hub World | **Implemented in source; runtime unverified** | Hub world and portal are instantiated. Decide whether it belongs in the first proof or is deferred. |
| Movement and input | **Implemented in source; feel unverified** | Keyboard, mouse, gamepad and touch joystick pathways exist; movement includes speed stages, jump, roll/dash and combat inputs. Prioritise movement feel and accessibility over more moves. |
| Combat | **Implemented in source; defer from core proof** | Melee and laser paths plus Mystic Valley enemy handling exist. Keep only if they support Solander’s identity; avoid letting action mechanics overwhelm bonding and discovery. |
| Races / karate | **Partially implemented / likely placeholder** | UI progress advances on timers and records wins; this is not yet evidence of a meaningful skill-based competition system. Do not present as a finished game mode. |
| Evolution / stats | **Partially implemented** | Stat progression and threshold-based form changes exist in save logic. Verify that visible transformation, player choice and traversal consequences are real and coherent. |
| Creature memories | **Partially implemented** | Memory entries are recorded in save data for selected events. This is an event log, not yet proof of a rich memory/personality system. |
| Breeding / genetics | **Basic code path exists; not validated as a feature** | Offspring data is generated from parent values. No claim of deep genetics, inherited visual traits or balanced breeding until tested. |
| Rabbit / Wolf / Dragon / Phoenix traversal DNA | **Planned / not verified** | These remain the design framework for ability-led exploration. No inspected evidence confirms these archetypes or ability-gated routes are implemented. |
| Adventure outcome changes home | **Not yet verified** | This is essential to the target loop. Define and build one persistent consequence rather than adding another world. |
| Automated tests / build status | **Unknown** | Package scripts include dev, build and lint; no test script is defined in package.json. Run the commands and record results. |
| README and product metadata | **Needs update** | README's documented directory structure/features do not fully match the current file paths, and app metadata still says “My Google AI Studio App”. Update after build verification. |

### Source references inspected
- [Game page and HUD](../app/page.tsx)
- [Scene manager and world transitions](../src/engine/scene.ts)
- [Save system, Lumi defaults, interactions and localStorage](../src/systems/save.ts)
- [Input manager](../src/engine/input.ts)
- [Central constants](../src/constants/index.ts)
- [Package scripts and dependencies](../package.json)
- [Current README](../README.md)

## 5. The first proof: Lumi's garden loop

The first playable slice should make one small experience memorable:

1. **Arrive:** player understands movement and sees Lumi clearly.
2. **Connect:** approach Lumi, interact, feed or pet; Lumi responds visibly and bond changes.
3. **Discover:** find one resource, egg or environmental secret that feels worth noticing.
4. **Use the discovery:** spend or return with it to unlock one meaningful change.
5. **Adapt:** one simple companion-related ability or trait reveals a route previously inaccessible.
6. **Return:** come back to the garden and see the consequence persist.
7. **Remember:** reload the browser and confirm essential state remains.

This loop is the first success criterion. Combat, a hub, multiple stage variants, breeding, races, karate, a large roster and cross-platform systems are not prerequisites.

### Vertical-slice definition of done
- A first-time player can move and interact without coaching.
- Lumi feels responsive through animation, timing and readable feedback.
- One discovery creates a visible, understandable change.
- One ability or companion trait opens a new route or option.
- The player can return home and observe a persistent consequence.
- Save/load preserves the important state after refresh.
- No blocker-level console errors; build and lint results are recorded.
- Performance is acceptable on an agreed reference laptop/browser.
- At least five external testers complete a short moderated playtest; confusion and delight points are recorded.

## 6. Roadmap gates

### Gate 0 — Verify and stabilise (**next**)
- Install dependencies from the lockfile; run lint and production build.
- Launch the browser app and test the actual current branch.
- Record a short screen capture of the baseline.
- Create a bug list and classify issues by blocker / high / medium / low.
- Test a clean save, interaction, world transition and refresh persistence.
- Fix the README and metadata after confirming the actual app entry points.

**Exit:** reproducible build, verified baseline, truthful feature matrix and prioritised blockers.

### Gate 1 — Feel and bond
- Tune player speed, acceleration, camera, collisions and interaction distance.
- Make Lumi's idle/follow/approach/care responses expressive and reliable.
- Reduce HUD clutter and make controls easy to discover.
- Ensure every care interaction has immediate visual/audio/state feedback.

**Exit:** testers naturally try to interact with Lumi and understand the response.

### Gate 2 — Discover and return
- Choose one compact discovery and one small adventure area.
- Connect a resource or secret to a meaningful ability/route.
- Make the return to the garden change something persistent.
- Remove dead ends and unclear portal/stage navigation.

**Exit:** a complete garden → discovery → return loop works on repeat play.

### Gate 3 — Remember and adapt
- Harden local save/load and add a save schema version.
- Define one simple adaptation or evolution outcome that changes traversal or interaction.
- Confirm the visual change matches the underlying state.
- Add migration and graceful fallback for invalid save data.

**Exit:** the player's progress survives reload and changes what they can do.

### Gate 4 — External proof
- Run moderated playtests with at least five people; include people unfamiliar with the project.
- Track time to first interaction, loop completion, points of confusion and desire to return.
- Fix the biggest friction points, not every requested feature.
- Capture a clean 60–120 second gameplay sequence only after the loop is reliable.

**Exit:** evidence that players understand and value the core fantasy.

### Gate 5 — Package the opportunity
- Produce a concise one-page overview, short pitch deck and gameplay video.
- Explain the unique proposition, audience hypothesis, current proof, roadmap, team needs, budget assumptions and key risks.
- Separate existing proof from future franchise opportunities.
- Prepare a realistic next-phase scope and cost range; do not invent traction or player metrics.

**Exit:** a credible, evidence-led conversation starter for partners, publishers or investors.

## 7. Technical direction

Keep the current browser-first stack unless verification shows it is a blocker: Next.js, React, TypeScript and Three.js. Prefer small changes over a rewrite.

- Separate gameplay state from rendering/UI.
- Keep tunables centralised and reduce duplicate or conflicting constants.
- Add cleanup for renderer, animation loops, timers, resize handlers and event listeners.
- Version save data and handle unavailable/corrupt localStorage safely.
- Use keyboard/mouse as the primary desktop path; keep touch as a useful iteration path.
- Add lightweight diagnostics for frame rate, asset failures and state transitions.
- Do not add accounts, multiplayer, backend services or cross-device passport infrastructure until playtests demonstrate a need.

## 8. Product, art and UX principles

- Bright, magical, colourful world with strong silhouettes and memorable landmarks.
- Lumi must read clearly against the environment; prioritise expressive animation and proximity behaviour.
- Keep the HUD minimal and contextual. The current HUD exposes many resources, combat states and menu systems; simplify for the first proof.
- Teach through environment and companion behaviour before text-heavy tutorials.
- Use sound, animation and restrained visual effects to make interactions feel rewarding.
- Keep the design language original. Inspirations are reference points, not assets, branding or mechanics to copy wholesale.

## 9. Commercial path

**Near term:** prove a small browser game, collect playtest evidence and make a short gameplay capture.

**Next:** use the evidence to decide whether to expand the browser slice, package a PC-first prototype, seek a publishing/funding conversation or narrow the concept.

**Long term possibilities:** larger biomes, more creature lineages, races/trials, mobile companion features, a cross-experience Companion Passport, social play, arcade installations and physical collectibles. None should be presented as delivered functionality until implemented and tested.

Do not make monetisation depend on pay-to-win advantages or exploitative rarity systems. If the project later targets children or introduces accounts/community features, privacy, safety and compliance need dedicated design.

## 10. Measures that matter

Record:
- Time to first meaningful interaction with Lumi.
- Percentage of testers who understand how to interact and care.
- Percentage who find the first discovery without help.
- Percentage who complete the full garden → discovery → return loop.
- Save/load success after refresh and browser restart.
- Performance and loading behaviour on reference hardware.
- The words testers use to describe Lumi and what they want to do next.
- Whether testers choose to continue playing after the guided task.

Feature count, screenshots and developer enthusiasm are not substitutes for player evidence.

## 11. Risks and guardrails

- **Scope creep:** the current source contains many systems; do not mistake breadth for a proven core game.
- **Identity drift:** code and UI currently contain Chao terminology and Sonic-inspired movement. Confirm Solander's original identity and avoid an overly derivative pitch or presentation.
- **False completion claims:** code presence is not runtime verification. Keep statuses explicit until tested.
- **Fragile persistence:** localStorage has no obvious versioning in the inspected implementation; harden before relying on saved progress.
- **Placeholder modes:** timer-driven race progress should not be marketed as a complete competition system.
- **Pitch before proof:** package the opportunity after player evidence, not instead of it.

## 12. Immediate action list

1. **Run the current project:** install from the lockfile; execute lint and production build; capture exact results.
2. **Play the baseline:** test controls, Lumi interactions, resource collection, portal transition, return and reload.
3. **Create a blocker list:** prioritise build/runtime issues, movement feel, companion feedback, and save continuity.
4. **Choose the smallest discovery loop:** one resource or egg, one meaningful use, one persistent return consequence.
5. **Trim the first-run HUD:** surface the controls and interactions that support the loop; defer secondary modes from the initial onboarding.
6. **Refresh project documentation:** align README, app metadata and this master plan with the verified branch.
7. **Playtest before pitch:** gather evidence, then build the opportunity package.

---

**Master principle:** Solander should not ask players to care because the game tells them to. It should give them a companion that earns that care, a world that rewards curiosity, and a history that feels like their own.
