import * as THREE from 'three';
import { ThirdPersonCamera } from './camera';
import { inputManager } from './input';
import { Player } from '../player/player';
import { SolanderGardenWorld } from '../world/garden';
import { MysticValleyWorld } from '../world/mysticValley';
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
  public portalToValley: PortalCave;
  public portalToGarden: PortalCave;

  public creatures: SolanderCreature[] = [];
  public aiControllers: CompanionAIController[] = [];
  public companionCreature: SolanderCreature | null = null;

  public interactionManager: InteractionManager;

  private clock: THREE.Clock;
  private currentWorld: 'GARDEN' | 'MYSTIC_VALLEY' = 'GARDEN';
  public isFading: boolean = false;
  public fadeOpacity: number = 0;
  private onPromptChange: (prompt: ActivePrompt | null) => void;
  private onFadeUpdate: (opacity: number) => void;

  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(
    container: HTMLElement,
    onPromptChange: (prompt: ActivePrompt | null) => void,
    onFadeUpdate: (opacity: number) => void,
    onCombatStateChange?: (info: CombatInfo) => void
  ) {
    this.onPromptChange = onPromptChange;
    this.onFadeUpdate = onFadeUpdate;
    this.onCombatStateChange = onCombatStateChange;
    this.clock = new THREE.Clock();

    // Three.js Scene & Renderer Setup
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xcfe8ff); // Sky: Children of the Light pastel blue
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0xcfe8ff, 0.015);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // Camera
    this.cameraSystem = new ThirdPersonCamera();
    this.cameraSystem.updateAspectRatio(container.clientWidth / container.clientHeight);

    // Lighting (Warm golden sunshine + Sky bounce)
    this.ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.75);
    this.scene.add(this.ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xd97706, 0.45);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffae0, 1.35);
    this.dirLight.position.set(12, 22, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    const d = 25;
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
    this.mysticValleyWorld.group.visible = false;

    this.scene.add(this.gardenWorld.group);
    this.scene.add(this.mysticValleyWorld.group);

    // Portals
    const cavePos1 = new THREE.Vector3(-4.5, this.gardenWorld.getGroundHeight(-4.5, -14.2), -14.2);
    this.portalToValley = new PortalCave(cavePos1, 'MYSTIC_VALLEY');
    this.gardenWorld.group.add(this.portalToValley.mesh);

    const cavePos2 = new THREE.Vector3(0, this.mysticValleyWorld.getGroundHeight(0, -18), -18);
    this.portalToGarden = new PortalCave(cavePos2, 'GARDEN');
    this.mysticValleyWorld.group.add(this.portalToGarden.mesh);

    // Creatures
    this.initCreatures();

    // Interaction Manager
    this.interactionManager = new InteractionManager();

    // Window Resize Handler
    window.addEventListener('resize', () => {
      if (!container) return;
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.cameraSystem.updateAspectRatio(container.clientWidth / container.clientHeight);
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

  public switchWorld(targetWorld: 'GARDEN' | 'MYSTIC_VALLEY') {
    if (this.isFading || targetWorld === this.currentWorld) return;

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

        if (targetWorld === 'MYSTIC_VALLEY') {
          this.gardenWorld.group.visible = false;
          this.mysticValleyWorld.group.visible = true;

          // Sky / Atmospheric Lighting for Mystic Valley
          this.scene.background = new THREE.Color(0x1e1b4b); // Midnight indigo
          this.scene.fog = new THREE.FogExp2(0x1e1b4b, 0.025);
          this.ambientLight.color.setHex(0x818cf8);
          this.ambientLight.intensity = 0.6;
          this.dirLight.color.setHex(0xc084fc);

          // Spawn player in Mystic Valley near entrance
          this.player.position.set(0, this.mysticValleyWorld.getGroundHeight(0, -15), -15);
          this.player.mesh.position.copy(this.player.position);

          // Move Lumi to Mystic Valley scene
          if (this.companionCreature) {
            this.gardenWorld.group.remove(this.companionCreature.mesh);
            this.mysticValleyWorld.group.add(this.companionCreature.mesh);
            this.companionCreature.position.set(1.5, this.mysticValleyWorld.getGroundHeight(1.5, -15), -15);
          }
        } else {
          // Return to Solander Garden
          this.mysticValleyWorld.group.visible = false;
          this.gardenWorld.group.visible = true;

          this.scene.background = new THREE.Color(0x87ceeb);
          this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.02);
          this.ambientLight.color.setHex(0xffffff);
          this.ambientLight.intensity = 0.7;
          this.dirLight.color.setHex(0xffffff);

          this.player.position.set(0, this.gardenWorld.getGroundHeight(0, -15), -15);
          this.player.mesh.position.copy(this.player.position);

          if (this.companionCreature) {
            this.mysticValleyWorld.group.remove(this.companionCreature.mesh);
            this.gardenWorld.group.add(this.companionCreature.mesh);
            this.companionCreature.position.set(1.5, this.gardenWorld.getGroundHeight(1.5, -15), -15);
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

    const doJump = inputManager.consumeJump();
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
      this.gardenWorld.update(elapsedTime);
      this.portalToValley.update(elapsedTime);
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
            flyStat: 15,
            runStat: 15,
            powerStat: 15,
            staminaStat: 15,
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
      this.companionCreature,
      this.creatures,
      this.currentWorld
    );

    this.onPromptChange(prompt);

    // Render Scene
    this.renderer.render(this.scene, this.cameraSystem.camera);
  };
}
