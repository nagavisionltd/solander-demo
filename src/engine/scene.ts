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
import { saveSystem } from '../systems/save';
import { sound } from '../systems/audio';

export class GameSceneManager {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public cameraSystem: ThirdPersonCamera;
  public player: Player;

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
    onFadeUpdate: (opacity: number) => void
  ) {
    this.onPromptChange = onPromptChange;
    this.onFadeUpdate = onFadeUpdate;
    this.clock = new THREE.Clock();

    // Three.js Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.02);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Camera
    this.cameraSystem = new ThirdPersonCamera();
    this.cameraSystem.updateAspectRatio(container.clientWidth / container.clientHeight);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(12, 20, 15);
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
    const cavePos1 = new THREE.Vector3(0, this.gardenWorld.getGroundHeight(0, -18), -18);
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

  public handlePlayerAttack() {
    if (this.player.isAttacking) return;
    this.player.isAttacking = true;
    sound.playSpinAttackSound();

    setTimeout(() => {
      this.player.isAttacking = false;
    }, 450);

    // In Mystic Valley, check collision with Void Enemies
    if (this.currentWorld === 'MYSTIC_VALLEY') {
      this.mysticValleyWorld.enemies.forEach(enemy => {
        if (enemy.alive) {
          const dist = this.player.position.distanceTo(enemy.position);
          if (dist < 2.8) {
            enemy.hp -= 1;
            sound.playChirp();
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
              saveSystem.collectResource('essence', 2);
              saveSystem.setMessage(`💥 Defeated Void Shade! Gained +2 ✨ Solander Essence!`);
            }
          }
        }
      });
    }
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

  public handleInteractAction() {
    if (this.interactionManager.currentPrompt) {
      this.interactionManager.executeInteraction(
        this.interactionManager.currentPrompt,
        this.gardenWorld,
        this.mysticValleyWorld,
        this.creatures,
        (targetWorld) => this.switchWorld(targetWorld)
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

    // Player Attack / Spin Attack Action
    if (inputManager.consumeAttack()) {
      this.handlePlayerAttack();
    }

    // Player Movement Update
    this.player.update(inputVec, this.cameraSystem, deltaTime, this.getGroundHeight, doJump);

    // Player Water Detection & Swimming
    const inWater = this.gardenWorld.isPosInWater(this.player.position.x, this.player.position.z);
    if (inWater !== this.player.isSwimming) {
      this.player.isSwimming = inWater;
      if (inWater) sound.playSplash();
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
