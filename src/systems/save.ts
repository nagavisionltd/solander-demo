// State & Save System for Solander Demo
export interface SolanderCreatureData {
  id: string;
  name: string;
  species: string;
  personality: string;
  happiness: number; // 0 - 100
  curiosity: number; // 0 - 100
  bravery: number; // 0 - 100
  energy: number; // 0 - 100
  creativity: number; // 0 - 100
  bond: number; // 0 - 100
  bodyColor: number;
  accentColor: number;
  isCompanion: boolean;
  hatched: boolean;
  originWorld: string;
  form: 'DEFAULT' | 'CRYSTAL' | 'SKY' | 'GUARDIAN';
}

export interface PlayerResources {
  essence: number;
  seeds: number;
  crystals: number;
}

export interface GameState {
  currentWorld: 'GARDEN' | 'MYSTIC_VALLEY';
  companionId: string | null;
  hatchedEggs: string[];
  resources: PlayerResources;
  discoveredMemories: { id: string; title: string; text: string; date: string }[];
  activeMessage: string | null;
}

export class SaveSystem {
  private state: GameState;
  private creatures: Map<string, SolanderCreatureData>;
  private listeners: Array<() => void> = [];

  constructor() {
    this.creatures = new Map();

    // Default Lumi (the main companion)
    const lumi: SolanderCreatureData = {
      id: 'solander_lumi',
      name: 'Lumi',
      species: 'Light Solander',
      personality: 'Playful & Loyal',
      happiness: 85,
      curiosity: 92,
      bravery: 30,
      energy: 75,
      creativity: 50,
      bond: 25,
      bodyColor: 0x38bdf8, // Cyan
      accentColor: 0xfacc15, // Golden yellow
      isCompanion: true,
      hatched: true,
      originWorld: 'Solander Garden',
      form: 'DEFAULT'
    };

    // Other Garden Creatures
    const nova: SolanderCreatureData = {
      id: 'solander_nova',
      name: 'Nova',
      species: 'Star Solander',
      personality: 'Dreamy & Calm',
      happiness: 70,
      curiosity: 88,
      bravery: 40,
      energy: 60,
      creativity: 80,
      bond: 10,
      bodyColor: 0xa855f7, // Violet
      accentColor: 0x38bdf8,
      isCompanion: false,
      hatched: true,
      originWorld: 'Solander Garden',
      form: 'DEFAULT'
    };

    const terra: SolanderCreatureData = {
      id: 'solander_terra',
      name: 'Terra',
      species: 'Flora Solander',
      personality: 'Gentle & Shy',
      happiness: 90,
      curiosity: 60,
      bravery: 20,
      energy: 85,
      creativity: 45,
      bond: 15,
      bodyColor: 0x34d399, // Emerald
      accentColor: 0xf43f5e, // Pink
      isCompanion: false,
      hatched: true,
      originWorld: 'Solander Garden',
      form: 'DEFAULT'
    };

    this.creatures.set(lumi.id, lumi);
    this.creatures.set(nova.id, nova);
    this.creatures.set(terra.id, terra);

    this.state = {
      currentWorld: 'GARDEN',
      companionId: 'solander_lumi',
      hatchedEggs: ['solander_lumi'],
      resources: {
        essence: 12,
        seeds: 5,
        crystals: 3
      },
      discoveredMemories: [
        {
          id: 'mem_1',
          title: 'Garden Awakening',
          text: 'Lumi awoke in the peaceful Solander Garden and bonded with you.',
          date: 'Day 1'
        }
      ],
      activeMessage: null
    };

    this.loadFromLocalStorage();
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
    this.saveToLocalStorage();
  }

  public getState(): GameState {
    return this.state;
  }

  public getCompanion(): SolanderCreatureData | null {
    if (!this.state.companionId) return null;
    return this.creatures.get(this.state.companionId) || null;
  }

  public getAllCreatures(): SolanderCreatureData[] {
    return Array.from(this.creatures.values());
  }

  public getCreature(id: string): SolanderCreatureData | undefined {
    return this.creatures.get(id);
  }

  public collectResource(type: 'essence' | 'seeds' | 'crystals', amount: number = 1) {
    if (!this.state.resources) {
      this.state.resources = { essence: 0, seeds: 0, crystals: 0 };
    }
    this.state.resources[type] += amount;
    this.notify();
  }

  public feedCompanion(resourceType: 'essence' | 'seeds' | 'crystals'): boolean {
    if (!this.state.resources || this.state.resources[resourceType] <= 0) return false;

    const companion = this.getCompanion();
    if (!companion) return false;

    this.state.resources[resourceType] -= 1;

    if (resourceType === 'essence') {
      companion.energy = Math.min(100, companion.energy + 15);
      companion.creativity = Math.min(100, companion.creativity + 10);
      companion.happiness = Math.min(100, companion.happiness + 8);
      companion.bond = Math.min(100, companion.bond + 4);
    } else if (resourceType === 'seeds') {
      companion.curiosity = Math.min(100, companion.curiosity + 15);
      companion.happiness = Math.min(100, companion.happiness + 12);
      companion.bond = Math.min(100, companion.bond + 5);
    } else if (resourceType === 'crystals') {
      companion.bravery = Math.min(100, companion.bravery + 20);
      companion.creativity = Math.min(100, companion.creativity + 15);
      companion.bond = Math.min(100, companion.bond + 8);
    }

    // Evolution Check
    this.checkEvolution(companion);

    this.notify();
    return true;
  }

  private checkEvolution(companion: SolanderCreatureData) {
    if (companion.form === 'DEFAULT') {
      if (companion.bravery >= 60 && companion.creativity >= 60) {
        companion.form = 'CRYSTAL';
        companion.species = 'Crystal Solander';
        companion.bodyColor = 0x38bdf8;
        companion.accentColor = 0xe0f2fe; // Shimmering light blue
        this.addMemory('Crystal Evolution', `${companion.name} absorbed ancient crystals and evolved into a Crystal Solander!`);
        this.setMessage(`✨ EVOLUTION! ${companion.name} evolved into a Crystal Solander!`);
      } else if (companion.curiosity >= 80 && companion.energy >= 80) {
        companion.form = 'SKY';
        companion.species = 'Sky Solander';
        companion.bodyColor = 0xc084fc; // Purple sky
        companion.accentColor = 0xfacc15;
        this.addMemory('Sky Evolution', `${companion.name} reached high energy and evolved into a Sky Solander!`);
        this.setMessage(`✨ EVOLUTION! ${companion.name} evolved into a Sky Solander!`);
      }
    }
  }

  public increaseBond(amount: number = 5) {
    const companion = this.getCompanion();
    if (companion) {
      companion.bond = Math.min(100, companion.bond + amount);
      companion.happiness = Math.min(100, companion.happiness + amount);
      this.notify();
    }
  }

  public setWorld(world: 'GARDEN' | 'MYSTIC_VALLEY') {
    this.state.currentWorld = world;
    this.notify();
  }

  public setCompanion(creatureId: string) {
    if (this.creatures.has(creatureId)) {
      this.state.companionId = creatureId;
      this.creatures.forEach((c) => {
        c.isCompanion = (c.id === creatureId);
      });
      this.notify();
    }
  }

  public hatchEgg(eggId: string, creatureName: string): SolanderCreatureData {
    if (!this.state.hatchedEggs.includes(eggId)) {
      this.state.hatchedEggs.push(eggId);
    }

    let creature = this.creatures.get(eggId);
    if (!creature) {
      creature = {
        id: eggId,
        name: creatureName,
        species: 'Mythic Solander',
        personality: 'Curious & Energetic',
        happiness: 95,
        curiosity: 100,
        bravery: 40,
        energy: 90,
        creativity: 70,
        bond: 40,
        bodyColor: 0xf43f5e, // Coral pink
        accentColor: 0xfacc15,
        isCompanion: true,
        hatched: true,
        originWorld: 'Solander Egg',
        form: 'DEFAULT'
      };
      this.creatures.set(eggId, creature);
    } else {
      creature.hatched = true;
    }

    // Set as active companion
    this.state.companionId = creature.id;
    this.addMemory('Hatched ' + creature.name, `${creature.name} emerged from a glowing egg!`);
    this.notify();
    return creature;
  }

  public addMemory(title: string, text: string) {
    const exists = this.state.discoveredMemories.some(m => m.title === title);
    if (!exists) {
      this.state.discoveredMemories.unshift({
        id: 'mem_' + Date.now(),
        title,
        text,
        date: 'Day ' + (this.state.discoveredMemories.length + 1)
      });
      this.notify();
    }
  }

  public setMessage(msg: string | null) {
    this.state.activeMessage = msg;
    this.notify();
  }

  private saveToLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('solander_save', JSON.stringify({
          state: this.state,
          creatures: Array.from(this.creatures.entries())
        }));
      }
    } catch {
      // ignore
    }
  }

  private loadFromLocalStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('solander_save');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.state) this.state = parsed.state;
          if (parsed.creatures) {
            this.creatures = new Map(parsed.creatures);
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

export const saveSystem = new SaveSystem();
