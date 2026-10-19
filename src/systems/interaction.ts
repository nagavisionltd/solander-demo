import * as THREE from 'three';
import { Player } from '../player/player';
import { SolanderGardenWorld, SolanderEggMesh } from '../world/garden';
import { MysticValleyWorld, DiscoveryPoint } from '../world/mysticValley';
import { PortalCave } from '../world/portals';
import { SolanderCreature } from '../creatures/solander';
import { saveSystem } from './save';
import { sound } from './audio';

export interface ActivePrompt {
  type: 'EGG' | 'COMPANION' | 'PORTAL' | 'DISCOVERY' | 'RESOURCE' | 'TRIAL' | 'SHOP' | 'SCHOOL';
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
    portalToHub: PortalCave | null,
    companionCreature: SolanderCreature | null,
    allCreatures: SolanderCreature[],
    currentWorld: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD',
    hubGardenPortal?: PortalCave,
    hubAdventurePortalArg?: PortalCave
  ): ActivePrompt | null {
    const playerPos = player.position;
    this.currentPrompt = null;

    if (currentWorld === 'GARDEN') {
      // 1. Check Adventure Mode Cave Portal Trigger
      const distToValley = portalToValley.position.distanceTo(playerPos);
      if (distToValley < 4.2) {
        this.currentPrompt = {
          type: 'PORTAL',
          title: '⚡ ADVENTURE MODE PORTAL ⚡',
          subtitle: 'Gateway to Sonic-style Mystic Valley Course & Action Quests',
          actionText: 'Enter Adventure Mode',
          targetId: 'portal_valley',
          position: portalToValley.position
        };
        return this.currentPrompt;
      }

      // 2. Check Chao World Hub Portal Trigger
      if (portalToHub) {
        const distToHub = portalToHub.position.distanceTo(playerPos);
        if (distToHub < 4.2) {
          this.currentPrompt = {
            type: 'PORTAL',
            title: '🏫 CHAO WORLD HUB PORTAL 🏫',
            subtitle: 'Gateway to Chao Item Shop, Kindergarten School & Dojo',
            actionText: 'Enter Chao Hub',
            targetId: 'portal_hub',
            position: portalToHub.position
          };
          return this.currentPrompt;
        }
      }

      // 3. Check Eggs
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
    } else if (currentWorld === 'HUB_WORLD') {
      // Use the portals that physically belong to the hub. The global
      // Garden/Valley portals are located in other worlds and must not be
      // used for hub proximity checks.
      const hubReturnPortal = hubGardenPortal ?? portalToGarden;
      const hubAdventurePortal = hubAdventurePortalArg ?? portalToValley;

      if (hubReturnPortal) {
        const dist = hubReturnPortal.position.distanceTo(playerPos);
        if (dist < 3.8) {
          this.currentPrompt = {
            type: 'PORTAL',
            title: '🌸 SOLANDER GARDEN 🌸',
            subtitle: 'Return to the main peaceful sanctuary garden',
            actionText: 'Return to Garden',
            targetId: 'portal_garden',
            position: hubReturnPortal.position
          };
          return this.currentPrompt;
        }
      }

      if (hubAdventurePortal) {
        const dist = hubAdventurePortal.position.distanceTo(playerPos);
        if (dist < 4.2) {
          this.currentPrompt = {
            type: 'PORTAL',
            title: '⚡ ADVENTURE STAGE SELECT ⚡',
            subtitle: 'Enter the Adventure portal to choose a stage',
            actionText: 'Open Stage Select',
            targetId: 'portal_valley',
            position: hubAdventurePortal.position
          };
          return this.currentPrompt;
        }
      }

      // 2. Check Item Shop Counter
      const shopPos = new THREE.Vector3(-18, 0, -6.8);
      if (playerPos.distanceTo(shopPos) < 4.5) {
        this.currentPrompt = {
          type: 'SHOP',
          title: '🛍️ CHAO ITEM SHOP',
          subtitle: 'Buy rare fruits, seeds, toy balls, and accessories',
          actionText: 'Open Item Shop',
          targetId: 'chao_shop',
          position: shopPos
        };
        return this.currentPrompt;
      }

      // 3. Check School Desk
      const schoolPos = new THREE.Vector3(18, 0, -6.4);
      if (playerPos.distanceTo(schoolPos) < 4.5) {
        this.currentPrompt = {
          type: 'SCHOOL',
          title: '🏫 CHAO KINDERGARTEN & LESSONS',
          subtitle: 'Enroll Chao in Music, Drawing, Dance, & Martial Arts classes',
          actionText: 'Enter Kindergarten',
          targetId: 'chao_school',
          position: schoolPos
        };
        return this.currentPrompt;
      }
    } else {
      // MYSTIC VALLEY
      // 1. Check Portal back to Garden
      const distToReturn = portalToGarden.position.distanceTo(playerPos);
      if (distToReturn < 5.0) {
        this.currentPrompt = {
          type: 'PORTAL',
          title: '🌸 Garden Portal',
          subtitle: 'Return to Solander Garden',
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
    onWorldSwitch: (targetWorld: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD') => void,
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
    } else if (prompt.type === 'SHOP') {
      sound.playHatchChime();
      if (onOpenDestinationHub) {
        onOpenDestinationHub();
      } else {
        saveSystem.setMessage('🛍️ Chao Item Shop Counter: Purchased +3 Solander Fruits & +1 Star Seed!');
      }
    } else if (prompt.type === 'SCHOOL') {
      sound.playMemorySound();
      if (onOpenDestinationHub) {
        onOpenDestinationHub();
      } else {
        saveSystem.setMessage('🏫 Chao Kindergarten: Chao finished Music & Dance lessons! Stats boosted!');
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
      sound.playTeleport();
      if (prompt.targetId === 'portal_valley') {
        onWorldSwitch('MYSTIC_VALLEY');
      } else if (prompt.targetId === 'portal_hub') {
        onWorldSwitch('HUB_WORLD');
      } else {
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
