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

  // --- Core Chao Alignment & Evolutionary Stats ---
  alignment: 'HERO' | 'NEUTRAL' | 'DARK';
  alignmentScore: number; // -100 (Pure Dark) to +100 (Pure Hero)

  // --- Primary Performance Stats & Leveling (1-99) ---
  swimStat: number;
  swimLv: number;
  swimExp: number;

  flyStat: number;
  flyLv: number;
  flyExp: number;

  runStat: number;
  runLv: number;
  runExp: number;

  powerStat: number;
  powerLv: number;
  powerExp: number;

  staminaStat: number;
  staminaLv: number;
  staminaExp: number;

  accessories?: string[];
  activeAccessory?: string | null;

  // --- Kindergarten Classroom Skills ---
  dancingSkill: number; // 0 - 100
  singingSkill: number; // 0 - 100
  drawingSkill: number; // 0 - 100

  // --- Competition & Accomplishments ---
  raceTrophies: number;
  karateBelts: number;
}

export interface PlayerResources {
  essence: number;
  seeds: number;
  crystals: number;
  swimFruit: number;
  flyFruit: number;
  runFruit: number;
  powerFruit: number;
  staminaFruit: number;
  heroFruit: number;
  darkFruit: number;
}

export interface GameState {
  currentWorld: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD';
  companionId: string | null;
  hatchedEggs: string[];
  resources: PlayerResources;
  discoveredMemories: { id: string; title: string; text: string; date: string }[];
  activeMessage: string | null;
  unlockedToys: string[]; // e.g. ['piano', 'slide', 'bouncy_ball', 'hammock']
  weather: 'SUNNY' | 'RAIN' | 'BLOSSOMS';
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
      species: 'Hero Chao Solander',
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
      form: 'DEFAULT',
      alignment: 'HERO',
      alignmentScore: 45,
      swimStat: 22,
      swimLv: 5,
      swimExp: 40,
      flyStat: 35,
      flyLv: 8,
      flyExp: 60,
      runStat: 28,
      runLv: 7,
      runExp: 15,
      powerStat: 18,
      powerLv: 4,
      powerExp: 50,
      staminaStat: 30,
      staminaLv: 6,
      staminaExp: 30,
      accessories: ['bowtie', 'crown', 'halo'],
      activeAccessory: 'halo',
      dancingSkill: 40,
      singingSkill: 25,
      drawingSkill: 15,
      raceTrophies: 1,
      karateBelts: 0
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
      form: 'DEFAULT',
      alignment: 'NEUTRAL',
      alignmentScore: 0,
      swimStat: 15,
      swimLv: 3,
      swimExp: 10,
      flyStat: 48,
      flyLv: 11,
      flyExp: 25,
      runStat: 12,
      runLv: 2,
      runExp: 50,
      powerStat: 10,
      powerLv: 2,
      powerExp: 0,
      staminaStat: 20,
      staminaLv: 4,
      staminaExp: 20,
      dancingSkill: 10,
      singingSkill: 50,
      drawingSkill: 60,
      raceTrophies: 0,
      karateBelts: 0
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
      form: 'DEFAULT',
      alignment: 'DARK',
      alignmentScore: -40,
      swimStat: 40,
      swimLv: 9,
      swimExp: 80,
      flyStat: 10,
      flyLv: 2,
      flyExp: 0,
      runStat: 25,
      runLv: 6,
      runExp: 10,
      powerStat: 42,
      powerLv: 10,
      powerExp: 40,
      staminaStat: 38,
      staminaLv: 8,
      staminaExp: 90,
      dancingSkill: 20,
      singingSkill: 10,
      drawingSkill: 10,
      raceTrophies: 0,
      karateBelts: 1
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
        seeds: 8,
        crystals: 5,
        swimFruit: 3,
        flyFruit: 3,
        runFruit: 3,
        powerFruit: 3,
        staminaFruit: 3,
        heroFruit: 2,
        darkFruit: 2
      },
      discoveredMemories: [
        {
          id: 'mem_1',
          title: 'Garden Awakening',
          text: 'Lumi awoke in the peaceful Solander Garden and bonded with you.',
          date: 'Day 1'
        }
      ],
      activeMessage: null,
      unlockedToys: ['piano', 'slide', 'bouncy_ball', 'hammock'],
      weather: 'SUNNY'
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
      this.state.resources = {
        essence: 0,
        seeds: 0,
        crystals: 0,
        swimFruit: 5,
        flyFruit: 5,
        runFruit: 5,
        powerFruit: 5,
        staminaFruit: 5,
        heroFruit: 3,
        darkFruit: 3
      };
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

  public setWorld(world: 'GARDEN' | 'MYSTIC_VALLEY' | 'HUB_WORLD') {
    this.state.currentWorld = world;
    this.notify();
  }

  public increaseBond(amount: number = 5) {
    const companion = this.getCompanion();
    if (companion) {
      companion.bond = Math.min(100, companion.bond + amount);
      companion.happiness = Math.min(100, companion.happiness + amount);
      this.notify();
    }
  }

  public gainStatExp(stat: 'swim' | 'fly' | 'run' | 'power' | 'stamina', expAmount: number, creatureId?: string) {
    const companion = creatureId ? this.getCreature(creatureId) : this.getCompanion();
    if (!companion) return;

    const statKey = `${stat}Stat` as keyof SolanderCreatureData;
    const lvKey = `${stat}Lv` as keyof SolanderCreatureData;
    const expKey = `${stat}Exp` as keyof SolanderCreatureData;

    let currentLv = (companion[lvKey] as number) || 1;
    let currentExp = (companion[expKey] as number) || 0;
    let currentVal = (companion[statKey] as number) || 10;

    currentExp += expAmount;
    let leveledUp = false;

    while (currentExp >= 100 && currentLv < 99) {
      currentExp -= 100;
      currentLv += 1;
      currentVal = Math.min(99, currentVal + 4);
      leveledUp = true;
    }

    (companion[lvKey] as number) = currentLv;
    (companion[expKey] as number) = currentExp;
    (companion[statKey] as number) = currentVal;

    if (leveledUp) {
      this.setMessage(`🌟 LEVEL UP! ${companion.name}'s ${stat.toUpperCase()} reached Lv.${currentLv}! (Stat: ${currentVal})`);
      this.addMemory(`${companion.name} Level Up`, `${companion.name} trained hard and leveled up ${stat.toUpperCase()} to Lv.${currentLv}!`);
      this.checkEvolution(companion);
    }

    this.notify();
  }

  public feedFruit(fruitType: 'swimFruit' | 'flyFruit' | 'runFruit' | 'powerFruit' | 'staminaFruit' | 'heroFruit' | 'darkFruit'): boolean {
    if (!this.state.resources || (this.state.resources[fruitType] || 0) <= 0) return false;

    const companion = this.getCompanion();
    if (!companion) return false;

    this.state.resources[fruitType] = (this.state.resources[fruitType] || 1) - 1;
    companion.happiness = Math.min(100, companion.happiness + 15);
    companion.bond = Math.min(100, companion.bond + 5);

    switch (fruitType) {
      case 'swimFruit':
        this.gainStatExp('swim', 45);
        this.setMessage(`🌊 ${companion.name} ate a Swim Fruit! Swim EXP +45!`);
        break;
      case 'flyFruit':
        this.gainStatExp('fly', 45);
        this.setMessage(`🪽 ${companion.name} ate a Fly Fruit! Fly EXP +45!`);
        break;
      case 'runFruit':
        this.gainStatExp('run', 45);
        this.setMessage(`🏃 ${companion.name} ate a Run Fruit! Run EXP +45!`);
        break;
      case 'powerFruit':
        this.gainStatExp('power', 45);
        this.setMessage(`💪 ${companion.name} ate a Power Fruit! Power EXP +45!`);
        break;
      case 'staminaFruit':
        this.gainStatExp('stamina', 45);
        this.setMessage(`⚡ ${companion.name} ate a Stamina Fruit! Stamina EXP +45!`);
        break;
      case 'heroFruit':
        companion.alignmentScore = Math.min(100, companion.alignmentScore + 30);
        if (companion.alignmentScore > 15) {
          companion.alignment = 'HERO';
          companion.species = 'Hero Chao Solander';
        }
        this.setMessage(`😇 ${companion.name} ate a Hero Fruit! Angelic halo glowing brightly!`);
        break;
      case 'darkFruit':
        companion.alignmentScore = Math.max(-100, companion.alignmentScore - 30);
        if (companion.alignmentScore < -15) {
          companion.alignment = 'DARK';
          companion.species = 'Dark Chao Solander';
        }
        this.setMessage(`😈 ${companion.name} ate a Dark Fruit! Spiked devil horns & dark aura expanding!`);
        break;
    }

    this.notify();
    return true;
  }

  public equipAccessory(creatureId: string, accessoryId: string | null) {
    const creature = this.getCreature(creatureId);
    if (creature) {
      creature.activeAccessory = accessoryId;
      this.notify();
    }
  }

  public trainClassroomSkill(skill: 'dancing' | 'singing' | 'drawing') {
    const companion = this.getCompanion();
    if (!companion) return;

    if (skill === 'dancing') {
      companion.dancingSkill = Math.min(100, companion.dancingSkill + 15);
      this.setMessage(`💃 ${companion.name} learned a new dance routine at Chao Kindergarten!`);
    } else if (skill === 'singing') {
      companion.singingSkill = Math.min(100, companion.singingSkill + 15);
      this.setMessage(`🎶 ${companion.name} mastered vocal harmony at Chao Kindergarten!`);
    } else if (skill === 'drawing') {
      companion.drawingSkill = Math.min(100, companion.drawingSkill + 15);
      this.setMessage(`🎨 ${companion.name} painted a cute garden landscape at Chao Kindergarten!`);
    }
    this.notify();
  }

  public breedChao(parent1Id: string, parent2Id: string): SolanderCreatureData | null {
    const p1 = this.creatures.get(parent1Id);
    const p2 = this.creatures.get(parent2Id);
    if (!p1 || !p2) return null;

    const childId = `chao_offspring_${Date.now()}`;
    const childName = `${p1.name.slice(0, 3)}${p2.name.slice(-3)}`;

    const child: SolanderCreatureData = {
      id: childId,
      name: childName,
      species: 'Bred Solander',
      personality: 'Talented & Cherished',
      happiness: 100,
      curiosity: Math.round((p1.curiosity + p2.curiosity) / 2),
      bravery: Math.round((p1.bravery + p2.bravery) / 2),
      energy: 90,
      creativity: Math.round((p1.creativity + p2.creativity) / 2),
      bond: 50,
      bodyColor: p1.bodyColor,
      accentColor: p2.accentColor,
      isCompanion: false,
      hatched: true,
      originWorld: 'Fortune Teller Love Nest',
      form: 'DEFAULT',
      alignment: 'NEUTRAL',
      alignmentScore: 0,
      swimStat: Math.min(99, Math.round((p1.swimStat + p2.swimStat) / 2 + 5)),
      swimLv: 1,
      swimExp: 0,
      flyStat: Math.min(99, Math.round((p1.flyStat + p2.flyStat) / 2 + 5)),
      flyLv: 1,
      flyExp: 0,
      runStat: Math.min(99, Math.round((p1.runStat + p2.runStat) / 2 + 5)),
      runLv: 1,
      runExp: 0,
      powerStat: Math.min(99, Math.round((p1.powerStat + p2.powerStat) / 2 + 5)),
      powerLv: 1,
      powerExp: 0,
      staminaStat: Math.min(99, Math.round((p1.staminaStat + p2.staminaStat) / 2 + 5)),
      staminaLv: 1,
      staminaExp: 0,
      dancingSkill: Math.round((p1.dancingSkill + p2.dancingSkill) / 2),
      singingSkill: Math.round((p1.singingSkill + p2.singingSkill) / 2),
      drawingSkill: Math.round((p1.drawingSkill + p2.drawingSkill) / 2),
      raceTrophies: 0,
      karateBelts: 0
    };

    this.creatures.set(childId, child);
    this.addMemory(`New Generation: ${child.name}`, `${p1.name} and ${p2.name} bred a talented new offspring!`);
    this.setMessage(`💖 Breeding Success! ${child.name} was born with boosted parent stats!`);
    this.notify();
    return child;
  }

  public setWeather(weather: 'SUNNY' | 'RAIN' | 'BLOSSOMS') {
    this.state.weather = weather;
    this.notify();
  }

  public recordWin(type: 'RACE' | 'KARATE') {
    const companion = this.getCompanion();
    if (companion) {
      if (type === 'RACE') {
        companion.raceTrophies += 1;
        this.state.resources.essence += 20;
        this.state.resources.crystals += 5;
        this.setMessage(`🏆 CHAMPION! ${companion.name} won the Grand Prix Trophy!`);
      } else {
        companion.karateBelts += 1;
        this.state.resources.essence += 25;
        this.state.resources.crystals += 8;
        this.setMessage(`🥋 KARATE MASTER! ${companion.name} awarded the Black Belt!`);
      }
      this.notify();
    }
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
        form: 'DEFAULT',
        alignment: 'NEUTRAL',
        alignmentScore: 0,
        swimStat: 18,
        swimLv: 1,
        swimExp: 0,
        flyStat: 18,
        flyLv: 1,
        flyExp: 0,
        runStat: 18,
        runLv: 1,
        runExp: 0,
        powerStat: 18,
        powerLv: 1,
        powerExp: 0,
        staminaStat: 18,
        staminaLv: 1,
        staminaExp: 0,
        dancingSkill: 0,
        singingSkill: 0,
        drawingSkill: 0,
        raceTrophies: 0,
        karateBelts: 0
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
