import * as THREE from 'three';
import { Player } from '../player/player';
import { SolanderGardenWorld, SolanderEggMesh } from '../world/garden';
import { MysticValleyWorld, DiscoveryPoint } from '../world/mysticValley';
import { PortalCave } from '../world/portals';
import { SolanderCreature } from '../creatures/solander';
import { saveSystem } from './save';
import { sound } from './audio';

export interface ActivePrompt {
  type: 'EGG' | 'COMPANION' | 'PORTAL' | 'DISCOVERY' | 'RESOURCE' | 'TRIAL';
  title: string;
  subtitle: string;
  actionText: string;
  targetId: string;
  position: THREE.Vector3;
}

export class InteractionManager {
  public currentPrompt: ActivePrompt | null = null;

  public update(
    player: Player,
    garden: SolanderGardenWorld,
    mysticValley: MysticValleyWorld,
    portalToValley: PortalCave,
    portalToGarden: PortalCave,
    companionCreature: SolanderCreature | null,
    allCreatures: SolanderCreature[],
    currentWorld: 'GARDEN' | 'MYSTIC_VALLEY'
  ): ActivePrompt | null {
    const playerPos = player.position;
    this.currentPrompt = null;

    if (currentWorld === 'GARDEN') {
      // 1. Check Cave Portal Trigger
      const distToCave = portalToValley.position.distanceTo(playerPos);
      if (distToCave < 3.8) {
        this.currentPrompt = {
          type: 'PORTAL',
          title: 'Waterfall Cliff Portal',
          subtitle: 'Ancient passage to Destination Hub & Mystic Valley',
          actionText: 'Enter Destination Hub',
          targetId: 'portal_valley',
          position: portalToValley.position
        };
        return this.currentPrompt;
      }

      // 2. Check Eggs
      for (const egg of garden.eggs) {
        if (!egg.hatched) {
          const dist = egg.mesh.position.distanceTo(playerPos);
          if (dist < 2.5) {
            const creatureName = egg.name.replace(' Egg', '');
            this.currentPrompt = {
              type: 'EGG',
              title: egg.name,
              subtitle: 'An ancient Solander egg glows softly...',
              actionText: `Hatch ${creatureName} Egg`,
              targetId: egg.id,
              position: egg.mesh.position
            };
            return this.currentPrompt;
          }
        }
      }
    } else {
      // MYSTIC VALLEY
      // 1. Check Portal back to Garden
      const distToReturn = portalToGarden.position.distanceTo(playerPos);
      if (distToReturn < 3.2) {
        this.currentPrompt = {
          type: 'PORTAL',
          title: 'Garden Portal',
          subtitle: 'Return to the serene Solander Garden',
          actionText: 'Return to Garden',
          targetId: 'portal_garden',
          position: portalToGarden.position
        };
        return this.currentPrompt;
      }

      // 2. Check Resource Pickup Nodes
      for (const resNode of mysticValley.resourceNodes) {
        if (!resNode.collected) {
          const dist = resNode.position.distanceTo(playerPos);
          if (dist < 2.4) {
            this.currentPrompt = {
              type: 'RESOURCE',
              title: resNode.name,
              subtitle: 'Shimmering natural resource',
              actionText: `Collect ${resNode.name}`,
              targetId: resNode.id,
              position: resNode.position
            };
            return this.currentPrompt;
          }
        }
      }

      // 3. Check Trial Pedestal
      if (mysticValley.trialPedestal) {
        const dist = mysticValley.trialPedestal.position.distanceTo(playerPos);
        if (dist < 3.0) {
          this.currentPrompt = {
            type: 'TRIAL',
            title: 'Ancient Trial Altar',
            subtitle: 'Test your companion\'s stats & bond',
            actionText: 'Begin Solander Trial',
            targetId: 'trial_altar',
            position: mysticValley.trialPedestal.position
          };
          return this.currentPrompt;
        }
      }

      // 4. Check Discovery Points
      for (const point of mysticValley.discoveryPoints) {
        const dist = point.position.distanceTo(playerPos);
        if (dist < 3.5) {
          this.currentPrompt = {
            type: 'DISCOVERY',
            title: point.name,
            subtitle: point.discovered ? 'Ancient Memory recorded' : 'Unexplored Celestial Memory',
            actionText: point.discovered ? 'Commune with Memory' : 'Discover Memory',
            targetId: point.id,
            position: point.position
          };
          return this.currentPrompt;
        }
      }
    }

    // 5. Check Creature Interactions (nearby companion or garden creatures)
    if (currentWorld === 'GARDEN') {
      for (const creature of allCreatures) {
        const dist = creature.position.distanceTo(playerPos);
        if (dist < 2.8) {
          this.currentPrompt = {
            type: 'COMPANION',
            title: creature.data.name,
            subtitle: `Bond: ${creature.data.bond}% • ${creature.data.personality}`,
            actionText: `Interact with ${creature.data.name}`,
            targetId: creature.data.id,
            position: creature.position
          };
          return this.currentPrompt;
        }
      }
    } else if (companionCreature) {
      const distToCompanion = companionCreature.position.distanceTo(playerPos);
      if (distToCompanion < 2.8) {
        this.currentPrompt = {
          type: 'COMPANION',
          title: companionCreature.data.name,
          subtitle: `Bond: ${companionCreature.data.bond}% • ${companionCreature.data.personality}`,
          actionText: `Interact with ${companionCreature.data.name}`,
          targetId: companionCreature.data.id,
          position: companionCreature.position
        };
        return this.currentPrompt;
      }
    }

    return null;
  }

  public executeInteraction(
    prompt: ActivePrompt,
    garden: SolanderGardenWorld,
    mysticValley: MysticValleyWorld,
    allCreatures: SolanderCreature[],
    onWorldSwitch: (targetWorld: 'GARDEN' | 'MYSTIC_VALLEY') => void,
    onOpenDestinationHub?: () => void,
    onInspectChao?: (creatureId: string) => void
  ) {
    if (prompt.type === 'EGG') {
      const egg = garden.eggs.find(e => e.id === prompt.targetId);
      if (egg) {
        egg.hatched = true;
        egg.mesh.visible = false;
        sound.playHatchChime();
        const creatureName = egg.name.replace(' Egg', '');
        saveSystem.hatchEgg(egg.id, creatureName);
        saveSystem.setMessage(`✨ ${creatureName} hatched from the glowing egg! ${creatureName} is now your companion.`);
      }
    } else if (prompt.type === 'RESOURCE') {
      const resNode = mysticValley.resourceNodes.find(r => r.id === prompt.targetId);
      if (resNode && !resNode.collected) {
        resNode.collected = true;
        resNode.mesh.visible = false;
        sound.playChirp();
        saveSystem.collectResource(resNode.type, 1);
        saveSystem.setMessage(`✨ Collected +1 ${resNode.name}! Feed it to your companion in the Garden.`);
      }
    } else if (prompt.type === 'TRIAL') {
      const companion = saveSystem.getCompanion();
      if (companion) {
        sound.playMemorySound();
        const score = companion.curiosity + companion.bravery + companion.energy;
        const rewardCrystals = score > 150 ? 3 : 1;
        saveSystem.collectResource('crystals', rewardCrystals);
        saveSystem.increaseBond(10);
        saveSystem.addMemory('Trial Victory', `${companion.name} completed the Trial of the Stars with a score of ${score}!`);
        saveSystem.setMessage(`🏆 TRIAL PASSED! ${companion.name} scored ${score}! Won +${rewardCrystals} 💎 Crystals & +10% Bond!`);
      }
    } else if (prompt.type === 'COMPANION') {
      const creature = allCreatures.find(c => c.data.id === prompt.targetId);
      if (creature) {
        creature.triggerHappyReaction();
        sound.playChirp();
        saveSystem.increaseBond(5);
        if (onInspectChao) {
          onInspectChao(prompt.targetId);
        } else {
          saveSystem.setMessage(`❤️ You petted ${creature.data.name}! Bond & happiness increased.`);
        }
      }
    } else if (prompt.type === 'PORTAL') {
      if (prompt.targetId === 'portal_valley') {
        sound.playTeleport();
        if (onOpenDestinationHub) {
          onOpenDestinationHub();
        } else {
          onWorldSwitch('MYSTIC_VALLEY');
        }
      } else {
        sound.playTeleport();
        onWorldSwitch('GARDEN');
      }
    } else if (prompt.type === 'DISCOVERY') {
      const point = mysticValley.discoveryPoints.find(p => p.id === prompt.targetId);
      if (point) {
        point.discovered = true;
        sound.playMemorySound();
        saveSystem.addMemory(point.memoryTitle, point.memoryText);
        saveSystem.setMessage(point.memoryText);
      }
    }
  }
}
