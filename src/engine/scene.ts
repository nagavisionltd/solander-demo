import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ThirdPersonCamera } from './camera';
import { inputManager } from './input';
import { Player } from '../player/player';
import { SolanderGardenWorld } from '../world/garden';
import { MysticValleyWorld } from '../world/mysticValley';
import { HubWorld } from '../world/hubWorld';
import { PortalCave } from '../world/portals';
import { SolanderCreature } from '../creatures/solander';
import { CompanionAIController } from '../creatures/companionAI';
import { InteractionManager, ActivePrompt } from '../systems/interaction';
import { saveSystem, SolanderCreatureData } from '../systems/save';
import { sound } from '../systems/audio';

export interface CombatInfo {
  inCombat: boolean;
  comboCount: number;
  enemyName: string | null;
  enemyHp: number;
  enemyMaxHp: number;
}

export class GameSceneManager {
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  public scene: THREE.Scene;
  public cameraSystem: ThirdPersonCamera;
  public player: Player;

  public combatTimer: number = 0;
  public activeCombatInfo: CombatInfo = {
    inCombat: false,
    comboCount: 0,
    enemyName: null,
    enemyHp: 3,
    enemyMaxHp: 3
  };
  private onCombatStateChange?: (info: CombatInfo) => void;

  public gardenWorld: SolanderGardenWorld;
  public mysticValleyWorld: MysticValleyWorld;
  public hubWorld: HubWorld;
  public portalToValley: PortalCave;
  public portalToGarden: PortalCave;
  public portalToHub: PortalCave;

  public creatures: SolanderCreature[] = [];
  public aiControllers: CompanionAIController[] = [];
  public companionCreature: SolanderCreature | null = null;

  public interactionManager: InteractionManager;

  private clock: THREE.Clock;
  private currentWorld: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD' = 'HUB_WORLD';
  public isFading: boolean = false;
  public fadeOpacity: number = 0;
  private onPromptChange: (prompt: ActivePrompt | null) => void;
  private onFadeUpdate: (opacity: number) => void;
  public onWorldChange?: (world: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD') => void;

  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(
    container: HTMLElement,
    onPromptChange: (prompt: ActivePrompt | null) => void,
    onFadeUpdate: (opacity: number) => void,
    onCombatStateChange?: (info: CombatInfo) => void,
    onWorldChange?: (world: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD') => void
  ) {
    this.onPromptChange = onPromptChange;
    this.onFadeUpdate = onFadeUpdate;
    this.onCombatStateChange = onCombatStateChange;
    this.onWorldChange = onWorldChange;
    this.clock = new THREE.Clock();

    // Three.js Scene & Renderer Setup
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xbfe0ff); // Sky: Soft crisp sky blue
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0xbfe0ff, 0.005);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    container.appendChild(this.renderer.domElement);

    // Camera
    this.cameraSystem = new ThirdPersonCamera();
    this.cameraSystem.updateAspectRatio(container.clientWidth / container.clientHeight);

    // Post-Processing Bloom Pipeline - Controlled, Subtle Glow (No Blinding Whiteout!)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.cameraSystem.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.28, // Soft subtle bloom strength
      0.30, // Controlled blur radius
      0.92  // High bloom threshold so ground/sky never bloom
    );
    this.composer.addPass(bloomPass);

    // Balanced Natural Lighting
    this.ambientLight = new THREE.AmbientLight(0xd1e9ff, 0.45);
    this.scene.add(this.ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xd97706, 0.3);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 0.85);
    this.dirLight.position.set(12, 22, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    const d = 35;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Player
    this.player = new Player();
    this.scene.add(this.player.mesh);

    // Worlds
    this.gardenWorld = new SolanderGardenWorld();
    this.mysticValleyWorld = new MysticValleyWorld();
    this.hubWorld = new HubWorld();
    this.gardenWorld.group.visible = false;
    this.mysticValleyWorld.group.visible = false;
    this.hubWorld.sceneGroup.visible = true;

    this.scene.add(this.gardenWorld.group);
    this.scene.add(this.mysticValleyWorld.group);
    this.scene.add(this.hubWorld.sceneGroup);

    // Portals - Placed on Open Ground with Clear Visibility
    const cavePos1 = new THREE.Vector3(-24.0, this.gardenWorld.getGroundHeight(-24.0, 10.0), 10.0);
    this.portalToValley = new PortalCave(cavePos1, 'MYSTIC_VALLEY');
    this.portalToValley.mesh.rotation.y = Math.PI * 0.25; // Face inward towards center spawn
    this.gardenWorld.group.add(this.portalToValley.mesh);

    const cavePosHub = new THREE.Vector3(24.0, this.gardenWorld.getGroundHeight(24.0, 10.0), 10.0);
    this.portalToHub = new PortalCave(cavePosHub, 'HUB_WORLD');
    this.portalToHub.mesh.rotation.y = -Math.PI * 0.25; // Face inward towards center spawn
    this.gardenWorld.group.add(this.portalToHub.mesh);

    const cavePos2 = new THREE.Vector3(0, this.mysticValleyWorld.getGroundHeight(0, 18.0), 18.0);
    this.portalToGarden = new PortalCave(cavePos2, 'GARDEN');
    this.portalToGarden.mesh.rotation.y = Math.PI; // Facing down course track
    this.mysticValleyWorld.group.add(this.portalToGarden.mesh);

    // Creatures
    this.initCreatures();

    // Start directly in the asset-based lobby; preserve Lumi as the active companion.
    this.player.position.set(0, 0.43, 0);
    this.player.mesh.position.copy(this.player.position);
    if (this.companionCreature) {
      this.gardenWorld.group.remove(this.companionCreature.mesh);
      this.hubWorld.sceneGroup.add(this.companionCreature.mesh);
      this.companionCreature.position.set(1.5, 0, 0);
    }

    // Interaction Manager
    this.interactionManager = new InteractionManager();

    // Window Resize Handler
    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
      this.cameraSystem.updateAspectRatio(w / h);
    });

    // Start loop
    this.animate();
  }

  private initCreatures() {
    const allCreatureData = saveSystem.getAllCreatures();

    allCreatureData.forEach((data, index) => {
      const creature = new SolanderCreature(data);

      if (data.id === 'solander_lumi') {
        // Lumi companion position near player
        creature.position.set(1.8, this.gardenWorld.getGroundHeight(1.8, 1.8), 1.8);
        this.companionCreature = creature;
        const ai = new CompanionAIController(creature, true);
        this.aiControllers.push(ai);
      } else {
        // Wandering garden creatures
        const offsetAngles = [1.2, 2.8, 4.5];
        const angle = offsetAngles[index % offsetAngles.length];
        const r = 5.0 + index * 2.0;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        creature.position.set(x, this.gardenWorld.getGroundHeight(x, z), z);
        const ai = new CompanionAIController(creature, false);
        this.aiControllers.push(ai);
      }

      this.creatures.push(creature);
      this.gardenWorld.group.add(creature.mesh);
    });
  }

  public getGroundHeight = (x: number, z: number): number => {
    if (this.currentWorld === 'GARDEN') {
      return this.gardenWorld.getGroundHeight(x, z);
    } else if (this.currentWorld === 'HUB_WORLD') {
      return 0; // Flat plaza cobblestone floor
    } else {
      return this.mysticValleyWorld.getGroundHeight(x, z);
    }
  };

  public handlePlayerMeleeAttack() {
    const success = this.player.triggerMeleeCombo();
    if (!success) return;
    this.combatTimer = 4.0;

    // Check hit detection with Void Enemies in Mystic Valley
    if (this.currentWorld === 'MYSTIC_VALLEY') {
      this.mysticValleyWorld.enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = this.player.position.distanceTo(enemy.position);
          if (dist < 3.2) {
            enemy.hp -= 1;
            sound.playChirp();
            this.player.laserGun.createImpact(enemy.position.clone().add(new THREE.Vector3(0, 0.6, 0)));

            if (enemy.eyeMesh.material instanceof THREE.MeshStandardMaterial) {
              enemy.eyeMesh.material.emissive.setHex(0xffffff);
              setTimeout(() => {
                if (enemy.eyeMesh.material instanceof THREE.MeshStandardMaterial) {
                  enemy.eyeMesh.material.emissive.setHex(0xd97706);
                }
              }, 200);
            }

            if (enemy.hp <= 0) {
              enemy.alive = false;
              enemy.mesh.visible = false;
              sound.playEnemyDefeat();
              saveSystem.collectResource('essence', 3);
              saveSystem.collectResource('crystals', 1);
              saveSystem.setMessage(`💥 Defeated Void Shade! Gained +3 ✨ Essence & +1 💎 Crystal!`);
            }
          }
        }
      });
    }
  }

  public handlePlayerLaserFire() {
    this.combatTimer = 4.0;
    this.player.triggerLaserFire(this.cameraSystem, this.scene);
  }

  public toggleCarryCompanion() {
    if (this.player.isCarrying) {
      // Put down
      this.player.isCarrying = false;
      if (this.companionCreature) {
        this.companionCreature.isCarried = false;
        this.companionCreature.position.copy(this.player.position);
        this.companionCreature.position.x += 0.8;
      }
      sound.playChirp();
      saveSystem.setMessage('Gently set down your Solander.');
    } else {
      // Pick up nearest companion
      let nearest: SolanderCreature | null = null;
      let minDist = 3.0;
      this.creatures.forEach(c => {
        const d = this.player.position.distanceTo(c.position);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      });

      if (nearest) {
        this.player.isCarrying = true;
        (nearest as SolanderCreature).isCarried = true;
        this.companionCreature = nearest;
        sound.playChirp();
        saveSystem.setMessage(`Picked up ${(nearest as SolanderCreature).data.name}!`);
      }
    }
  }

  public selectCompanion(creatureId: string) {
    const target = this.creatures.find(c => c.data.id === creatureId);
    if (!target) return;

    this.aiControllers.forEach(ai => {
      const isTarget = ai.creature.data.id === creatureId;
      ai.setCompanionStatus(isTarget);
    });

    this.companionCreature = target;
    saveSystem.setCompanion(target.data.id);
    sound.playHatchChime();
    saveSystem.setMessage(`🌟 ${target.data.name} is now your active companion!`);
  }

  public handleInteractAction(onOpenDestinationHub?: () => void, onInspectChao?: (creatureId: string) => void) {
    if (this.interactionManager.currentPrompt) {
      this.interactionManager.executeInteraction(
        this.interactionManager.currentPrompt,
        this.gardenWorld,
        this.mysticValleyWorld,
        this.creatures,
        (targetWorld) => this.switchWorld(targetWorld),
        onOpenDestinationHub,
        onInspectChao
      );

      // Check if egg hatching added new creature
      const allData = saveSystem.getAllCreatures();
      allData.forEach(data => {
        if (!this.creatures.some(c => c.data.id === data.id)) {
          const creature = new SolanderCreature(data);
          creature.position.set(this.player.position.x + 1.5, this.getGroundHeight(this.player.position.x + 1.5, this.player.position.z + 1.5), this.player.position.z + 1.5);
          const ai = new CompanionAIController(creature, true);
          this.aiControllers.push(ai);
          this.creatures.push(creature);
          this.gardenWorld.group.add(creature.mesh);
        }
      });
    }
  }

  public switchWorld(targetWorld: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD', selectedStage?: 'TRON' | 'ORIGINAL') {
    if (this.isFading) return;
    if (targetWorld === this.currentWorld && !selectedStage) return;

    this.isFading = true;
    let fadeProgress = 0;

    const fadeInterval = setInterval(() => {
      fadeProgress += 0.05;
      this.fadeOpacity = Math.min(1, fadeProgress);
      this.onFadeUpdate(this.fadeOpacity);

      if (fadeProgress >= 1.0) {
        clearInterval(fadeInterval);

        // Perform Teleport
        this.currentWorld = targetWorld;
        saveSystem.setWorld(targetWorld);
        this.onWorldChange?.(targetWorld);

        this.gardenWorld.group.visible = false;
        this.mysticValleyWorld.group.visible = false;
        this.hubWorld.sceneGroup.visible = false;

        if (targetWorld === 'MYSTIC_VALLEY') {
          if (selectedStage) {
            this.mysticValleyWorld.loadStage(selectedStage);
          }
          this.mysticValleyWorld.group.visible = true;

          // Soft Atmospheric Lighting for Mystic Valley (No blinding glare!)
          this.scene.background = new THREE.Color(0x2e1065); // Deep violet night
          this.scene.fog = new THREE.FogExp2(0x2e1065, 0.004);
          this.ambientLight.color.setHex(0xa855f7);
          this.ambientLight.intensity = 0.5;
          this.dirLight.color.setHex(0xc084fc);
          this.dirLight.intensity = 0.8;

          // Spawn player in Mystic Valley facing down course track
          const spawnX = this.mysticValleyWorld.activeStage === 'ORIGINAL' ? Math.sin(12.0 * 0.008) * 45.0 : 0;
          this.player.position.set(spawnX, this.mysticValleyWorld.getGroundHeight(spawnX, 12.0) + 0.43, 12.0);
          this.player.rotationY = Math.PI;
          this.player.mesh.position.copy(this.player.position);
          this.player.mesh.rotation.y = this.player.rotationY;

          // Move Lumi to Mystic Valley scene
          if (this.companionCreature) {
            this.gardenWorld.group.remove(this.companionCreature.mesh);
            this.hubWorld.sceneGroup.remove(this.companionCreature.mesh);
            this.mysticValleyWorld.group.add(this.companionCreature.mesh);
            this.companionCreature.position.set(1.5, this.mysticValleyWorld.getGroundHeight(1.5, 12.0), 12.0);
          }
        } else if (targetWorld === 'HUB_WORLD') {
          this.hubWorld.sceneGroup.visible = true;

          // Warm Golden Sunset Sky for Chao World Hub
          this.scene.background = new THREE.Color(0xfde047);
          this.scene.fog = new THREE.FogExp2(0xfde047, 0.005);
          this.ambientLight.color.setHex(0xfef08a);
          this.ambientLight.intensity = 0.55;
          this.dirLight.color.setHex(0xeab308);
          this.dirLight.intensity = 0.8;

          this.player.position.set(0, 0.43, 12);
          this.player.mesh.position.copy(this.player.position);

          if (this.companionCreature) {
            this.gardenWorld.group.remove(this.companionCreature.mesh);
            this.mysticValleyWorld.group.remove(this.companionCreature.mesh);
            this.hubWorld.sceneGroup.add(this.companionCreature.mesh);
            this.companionCreature.position.set(1.5, 0, 12);
          }
        } else {
          // Return to Solander Garden
          this.gardenWorld.group.visible = true;

          this.scene.background = new THREE.Color(0xbfe0ff);
          this.scene.fog = new THREE.FogExp2(0xbfe0ff, 0.005);
          this.ambientLight.color.setHex(0xd1e9ff);
          this.ambientLight.intensity = 0.45;
          this.dirLight.color.setHex(0xfff7ed);
          this.dirLight.intensity = 0.85;

          this.player.position.set(0, this.gardenWorld.getGroundHeight(0, 0) + 0.43, 0);
          this.player.mesh.position.copy(this.player.position);

          if (this.companionCreature) {
            this.mysticValleyWorld.group.remove(this.companionCreature.mesh);
            this.hubWorld.sceneGroup.remove(this.companionCreature.mesh);
            this.gardenWorld.group.add(this.companionCreature.mesh);
            this.companionCreature.position.set(1.5, this.gardenWorld.getGroundHeight(1.5, 0), 0);
          }
        }

        // Fade back in
        const unfadeInterval = setInterval(() => {
          fadeProgress -= 0.05;
          this.fadeOpacity = Math.max(0, fadeProgress);
          this.onFadeUpdate(this.fadeOpacity);

          if (fadeProgress <= 0) {
            clearInterval(unfadeInterval);
            this.isFading = false;
          }
        }, 30);
      }
    }, 30);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(0.1, this.clock.getDelta());
    const elapsedTime = this.clock.getElapsedTime();

    // Input & Camera
    const inputVec = inputManager.update();
    const lookDelta = inputManager.consumeLookDelta();
    this.cameraSystem.rotate(lookDelta.x, lookDelta.y);

    const doInteract = inputManager.consumeInteract();

    if (doInteract) {
      this.handleInteractAction();
    }

    // Player Action Controls
    if (inputManager.consumeMelee()) {
      this.handlePlayerMeleeAttack();
    }

    if (inputManager.consumeLaser()) {
      this.handlePlayerLaserFire();
    }

    if (inputManager.consumeRoll()) {
      this.player.triggerRoll();
    }

    // Player Carry Action
    if (inputManager.consumeCarry()) {
      this.toggleCarryCompanion();
    }

    // Player Water Detection & Swimming
    const inWater = this.currentWorld === 'GARDEN' && this.gardenWorld.isPosInWater(this.player.position.x, this.player.position.z);
    if (inWater && !this.player.isSwimming) {
      sound.playSplash();
    }

    // Player Movement Update with SA2 Momentum Engine
    this.player.update(inputVec, inputManager, this.cameraSystem, deltaTime, this.getGroundHeight, this.scene, inWater);

    // Asset-based Chao hub: walking through a supplied entrance swaps to its real garden model.
    if (this.currentWorld === 'HUB_WORLD') {
      const activeGarden = this.hubWorld.activeAssetGarden;
      if (!activeGarden) {
        const doors: Array<{ id: 'NEUTRAL' | 'HERO' | 'DARK'; x: number }> = [
          { id: 'NEUTRAL', x: -12 }, { id: 'HERO', x: 0 }, { id: 'DARK', x: 12 }
        ];
        for (const door of doors) {
          const dx = this.player.position.x - door.x;
          const dz = this.player.position.z - 16;
          if (Math.hypot(dx, dz) < 3.6 && this.hubWorld.enterAssetGarden(door.id)) {
            this.player.position.set(0, 0.43, -10);
            this.player.velocity.set(0, 0, 0);
            this.player.currentHorizontalSpeed = 0;
            this.player.mesh.position.copy(this.player.position);
            break;
          }
        }
      } else {
        const exit = this.hubWorld.gardenExitModel;
        if (exit && Math.hypot(this.player.position.x - exit.position.x, this.player.position.z - exit.position.z) < 3.6) {
          this.hubWorld.exitAssetGarden();
          this.player.position.set(0, 0.43, 0);
          this.player.velocity.set(0, 0, 0);
          this.player.currentHorizontalSpeed = 0;
          this.player.mesh.position.copy(this.player.position);
        }
      }
    }

    // Laser Projectile Hit Detection in Mystic Valley
    if (this.currentWorld === 'MYSTIC_VALLEY') {
      const projectiles = this.player.laserGun.projectiles;
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        for (const enemy of this.mysticValleyWorld.enemies) {
          if (enemy.alive) {
            const dist = p.position.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
            if (dist < 1.6) {
              this.player.laserGun.createImpact(p.position);
              this.scene.remove(p.mesh);
              projectiles.splice(i, 1);

              enemy.hp -= p.damage;
              sound.playChirp();

              if (enemy.hp <= 0) {
                enemy.alive = false;
                enemy.mesh.visible = false;
                sound.playEnemyDefeat();
                saveSystem.collectResource('essence', 3);
                saveSystem.collectResource('crystals', 1);
                saveSystem.setMessage(`💥 Laser destroyed Void Shade! Gained +3 ✨ Essence & +1 💎 Crystal!`);
              }
              break;
            }
          }
        }
      }

      // Resource Nodes Pickup Check in Mystic Valley
      this.mysticValleyWorld.resourceNodes.forEach(node => {
        if (!node.collected) {
          const dist = this.player.position.distanceTo(node.position);
          if (dist < 1.8) {
            node.collected = true;
            node.mesh.visible = false;
            sound.playChirp();
            saveSystem.collectResource(node.type, 1);
            saveSystem.increaseBond(2);
            saveSystem.setMessage(`Collected ${node.name}! Companion bond +2%!`);
          }
        }
      });

      // Dash Panel Triggers in Mystic Valley
      this.mysticValleyWorld.dashPanels.forEach(panel => {
        const dist = this.player.position.distanceTo(panel.position);
        if (dist < 2.0) {
          this.player.triggerDashPanel(panel.directionAngle, 68.0);
        }
      });

      // Spring Launch Pad Triggers in Mystic Valley
      this.mysticValleyWorld.springPads.forEach(spring => {
        const dist = this.player.position.distanceTo(spring.position);
        if (dist < 1.8) {
          this.player.triggerSpringPad(spring.upwardForce, spring.forwardSpeed);
        }
      });

      // Speed Rings Pickup Check
      this.mysticValleyWorld.speedRings.forEach(ring => {
        if (!ring.collected) {
          const dist = this.player.position.distanceTo(ring.position);
          if (dist < 2.2) {
            ring.collected = true;
            ring.mesh.visible = false;
            sound.playRingCollect();
            saveSystem.collectResource('essence', 5);
            saveSystem.gainStatExp('run', 15);
            saveSystem.setMessage(`🟡 Golden Speed Ring! +5 Essence & +15 Run EXP!`);
          }
        }
      });

      // Checkpoint Gate Trigger in Mystic Valley
      if (this.mysticValleyWorld.checkpoint && !this.mysticValleyWorld.checkpoint.activated) {
        const dist = this.player.position.distanceTo(this.mysticValleyWorld.checkpoint.position);
        if (dist < 4.5) {
          this.mysticValleyWorld.checkpoint.activated = true;
          sound.playChirp();
          saveSystem.collectResource('essence', 25);
          saveSystem.setMessage(`⚡ TRON CHECKPOINT REACHED! Sector Data Saved! +25 Essence!`);
        }
      }

      // Goal Ring Level Finish Check
      if (this.mysticValleyWorld.goalRing && !this.mysticValleyWorld.goalRing.activated) {
        const dist = this.player.position.distanceTo(this.mysticValleyWorld.goalRing.position);
        if (dist < 3.8) {
          this.mysticValleyWorld.goalRing.activated = true;
          sound.playVictory();
          saveSystem.recordWin('RACE');
          saveSystem.collectResource('essence', 50);
          saveSystem.collectResource('crystals', 10);
          saveSystem.setMessage(`🏁 STAGE CLEAR! Sonic Adventure Level 1 Mastered! Gained Grand Trophy + 50 Essence + 10 Crystals! Returning to Garden...`);
          
          setTimeout(() => {
            this.switchWorld('GARDEN');
          }, 3200);
        }
      }
    }

    // Combat Timer & Enemy Proximity Check
    if (this.combatTimer > 0) {
      this.combatTimer -= deltaTime;
    }

    let nearbyEnemy: { name: string; hp: number; maxHp: number } | null = null;
    if (this.currentWorld === 'MYSTIC_VALLEY') {
      for (const enemy of this.mysticValleyWorld.enemies) {
        if (enemy.alive && this.player.position.distanceTo(enemy.position) < 8.5) {
          nearbyEnemy = { name: 'Void Shade', hp: enemy.hp, maxHp: 3 };
          this.combatTimer = Math.max(this.combatTimer, 2.0);
          break;
        }
      }
    }

    const inCombat = this.combatTimer > 0 || this.player.isMeleeAttacking;
    if (this.onCombatStateChange) {
      this.onCombatStateChange({
        inCombat,
        comboCount: this.player.isMeleeAttacking ? this.player.comboStep : 0,
        enemyName: nearbyEnemy ? nearbyEnemy.name : null,
        enemyHp: nearbyEnemy ? nearbyEnemy.hp : 0,
        enemyMaxHp: nearbyEnemy ? nearbyEnemy.maxHp : 3
      });
    }

    // Camera Follow
    this.cameraSystem.update(this.player.position, deltaTime);

    // Worlds Animations
    if (this.currentWorld === 'GARDEN') {
      this.gardenWorld.update(elapsedTime, deltaTime, this.player.position);
      this.portalToValley.update(elapsedTime);
      this.portalToHub.update(elapsedTime);
    } else if (this.currentWorld === 'HUB_WORLD') {
      this.hubWorld.update(elapsedTime, deltaTime);
    } else {
      this.mysticValleyWorld.update(elapsedTime);
      this.portalToGarden.update(elapsedTime);
    }

    // Creatures & Companion AI Update
    this.aiControllers.forEach(ai => {
      ai.update(
        deltaTime,
        this.player.position,
        this.getGroundHeight,
        (x, z) => this.currentWorld === 'GARDEN' && this.gardenWorld.isPosInWater(x, z)
      );
    });

    // Handle carrying attachment position
    if (this.player.isCarrying && this.companionCreature) {
      this.companionCreature.isCarried = true;
      this.companionCreature.position.copy(this.player.position);
      this.companionCreature.position.y += 1.4;
    }

    // Automatic Random Egg Hatching Over Time
    if (this.currentWorld === 'GARDEN') {
      const unhatchedEgg = this.gardenWorld.eggs.find(e => !e.hatched);
      if (unhatchedEgg) {
        if (!unhatchedEgg.mesh.userData.hatchTimer) {
          unhatchedEgg.mesh.userData.hatchTimer = 45 + Math.random() * 45; // 45-90 seconds
        }
        unhatchedEgg.mesh.userData.hatchTimer -= deltaTime;
        if (unhatchedEgg.mesh.userData.hatchTimer <= 0) {
          unhatchedEgg.hatched = true;
          unhatchedEgg.mesh.visible = false;
          sound.playHatchChime();

          const creatureName = unhatchedEgg.name.replace(' Egg', '');
          saveSystem.hatchEgg(unhatchedEgg.id, creatureName);

          // Spawn new Solander creature into world
          const newCreatureData: SolanderCreatureData = saveSystem.getAllCreatures().find(c => c.id === unhatchedEgg.id) || {
            id: unhatchedEgg.id,
            name: creatureName,
            species: 'Chao Solander',
            personality: 'Playful',
            happiness: 80,
            curiosity: 20,
            bravery: 18,
            energy: 25,
            creativity: 15,
            bond: 25,
            bodyColor: 0x38bdf8,
            accentColor: 0xfacc15,
            isCompanion: false,
            hatched: true,
            originWorld: 'Solander Garden',
            form: 'DEFAULT',
            alignment: 'NEUTRAL',
            alignmentScore: 0,
            swimStat: 15,
            swimLv: 1,
            swimExp: 0,
            flyStat: 15,
            flyLv: 1,
            flyExp: 0,
            runStat: 15,
            runLv: 1,
            runExp: 0,
            powerStat: 15,
            powerLv: 1,
            powerExp: 0,
            staminaStat: 15,
            staminaLv: 1,
            staminaExp: 0,
            dancingSkill: 0,
            singingSkill: 0,
            drawingSkill: 0,
            raceTrophies: 0,
            karateBelts: 0
          };

          const creature = new SolanderCreature(newCreatureData);
          const eggPos = unhatchedEgg.mesh.position;
          creature.position.set(eggPos.x, this.getGroundHeight(eggPos.x, eggPos.z), eggPos.z);
          const ai = new CompanionAIController(creature, false);
          this.aiControllers.push(ai);
          this.creatures.push(creature);
          this.gardenWorld.group.add(creature.mesh);

          creature.triggerHappyReaction();
          saveSystem.setMessage(`🐣 An egg in the garden naturally hatched into ${creatureName}! It is now exploring the garden.`);
        }
      }
    }

    // Check Interactive Proximity Prompt
    const prompt = this.interactionManager.update(
      this.player,
      this.gardenWorld,
      this.mysticValleyWorld,
      this.portalToValley,
      this.portalToGarden,
      this.portalToHub,
      this.companionCreature,
      this.creatures,
      this.currentWorld,
      this.hubWorld.gardenPortal,
      this.hubWorld.adventurePortal
    );

    this.onPromptChange(prompt);

    // Render Scene with Bloom Post-Processing
    this.composer.render();
  };
}
