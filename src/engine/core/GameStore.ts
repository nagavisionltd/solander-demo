/**
 * Game Store - Central State Management
 * Implements the Sonic Adventure 2 game loop data flow:
 * Adventure Mode → Earn Materials → Garden Mode → Spend Materials → Competition Mode
 */

import { EVENT_TYPES, type GameEvent } from './EventManager';
import { MATERIALS, CHAO_STATS, RANKINGS, GAME_MODES } from '../constants';

export interface MaterialInventory {
  rings: number;
  smallAnimals: number;
  chaosDrives: number;
  fruits: number;
}

export interface ChaoData {
  id: string;
  name: string;
  stats: {
    swim: number;
    fly: number;
    run: number;
    power: number;
    stamina: number;
    intelligence: number;
    luck: number;
  };
  evolution: {
    stage: number; // 0: Egg, 1: Baby, 2: Child, 3: Adult
    type: 'neutral' | 'run' | 'power' | 'swim' | 'fly' | 'dark' | 'hero';
    progress: number; // 0-100% to next evolution
  };
  needs: {
    hunger: number; // 0-100
    energy: number; // 0-100
    happiness: number; // 0-100
  };
  level: number;
  exp: number;
  expToNextLevel: number;
}

export interface GameState {
  mode: 'adventure' | 'garden' | 'competition' | 'menu';
  currentLevel: string | null;
  inventory: MaterialInventory;
  chaoList: ChaoData[];
  activeChaoId: string | null;
  unlockedLevels: string[];
  totalPlayTime: number;
  lastSaveTime: number;
}

const DEFAULT_INVENTORY: MaterialInventory = {
  rings: 0,
  smallAnimals: 0,
  chaosDrives: 0,
  fruits: 0,
};

const DEFAULT_CHAO: Omit<ChaoData, 'id' | 'name'> = {
  stats: {
    swim: CHAO_STATS.BASE_SWIM,
    fly: CHAO_STATS.BASE_FLY,
    run: CHAO_STATS.BASE_RUN,
    power: CHAO_STATS.BASE_POWER,
    stamina: CHAO_STATS.BASE_STAMINA,
    intelligence: CHAO_STATS.BASE_INTELLIGENCE,
    luck: CHAO_STATS.BASE_LUCK,
  },
  evolution: {
    stage: 0,
    type: 'neutral',
    progress: 0,
  },
  needs: {
    hunger: 100,
    energy: 100,
    happiness: 100,
  },
  level: 1,
  exp: 0,
  expToNextLevel: CHAO_STATS.EXP_TO_LEVEL_2,
};

export class GameStore {
  private state: GameState;
  private listeners: Map<string, Set<(state: GameState) => void>>;
  private eventManager: import('./EventManager').EventManager | null = null;

  constructor() {
    this.state = {
      mode: 'menu',
      currentLevel: null,
      inventory: { ...DEFAULT_INVENTORY },
      chaoList: [],
      activeChaoId: null,
      unlockedLevels: ['mystic-valley'],
      totalPlayTime: 0,
      lastSaveTime: Date.now(),
    };
    
    this.listeners = new Map();
    
    // Load saved state if available
    this.loadState();
  }

  setEventManager(em: import('./EventManager').EventManager) {
    this.eventManager = em;
  }

  // === State Accessors ===
  
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  getInventory(): Readonly<MaterialInventory> {
    return { ...this.state.inventory };
  }

  getActiveChao(): ChaoData | null {
    if (!this.state.activeChaoId) return null;
    return this.state.chaoList.find(c => c.id === this.state.activeChaoId) || null;
  }

  getChaoById(id: string): ChaoData | null {
    return this.state.chaoList.find(c => c.id === id) || null;
  }

  getAllChao(): Readonly<ChaoData[]> {
    return [...this.state.chaoList];
  }

  // === Mode Transitions ===

  switchMode(mode: GameState['mode'], levelId?: string) {
    const previousMode = this.state.mode;
    this.state.mode = mode;
    this.state.currentLevel = levelId || null;
    
    this.notifyListeners('mode_change');
    
    if (this.eventManager) {
      this.eventManager.emit({
        type: EVENT_TYPES.MODE_SWITCH,
        payload: { from: previousMode, to: mode, levelId },
      });
    }

    // Auto-save on mode switch
    if (mode !== 'menu') {
      this.saveState();
    }
  }

  // === Inventory Management ===

  addMaterial(type: keyof MaterialInventory, amount: number) {
    if (amount <= 0) return;
    
    const current = this.state.inventory[type];
    const max = this.getMaxMaterial(type);
    const newValue = Math.min(current + amount, max);
    const actualAdded = newValue - current;
    
    this.state.inventory[type] = newValue;
    
    this.notifyListeners('inventory');
    
    if (this.eventManager && actualAdded > 0) {
      this.eventManager.emit({
        type: EVENT_TYPES.MATERIAL_COLLECTED,
        payload: { type, amount: actualAdded, total: newValue },
      });
    }
  }

  spendMaterial(type: keyof MaterialInventory, amount: number): boolean {
    if (amount <= 0) return false;
    
    const current = this.state.inventory[type];
    if (current < amount) return false;
    
    this.state.inventory[type] = current - amount;
    
    this.notifyListeners('inventory');
    
    if (this.eventManager) {
      this.eventManager.emit({
        type: EVENT_TYPES.MATERIAL_SPENT,
        payload: { type, amount, remaining: this.state.inventory[type] },
      });
    }
    
    return true;
  }

  hasMaterial(type: keyof MaterialInventory, amount: number): boolean {
    return this.state.inventory[type] >= amount;
  }

  private getMaxMaterial(type: keyof MaterialInventory): number {
    switch (type) {
      case 'rings': return MATERIALS.MAX_RINGS;
      case 'smallAnimals': return MATERIALS.MAX_SMALL_ANIMALS;
      case 'chaosDrives': return MATERIALS.MAX_CHAOS_DRIVES;
      case 'fruits': return MATERIALS.MAX_FRUITS;
      default: return 999;
    }
  }

  // === Chao Management ===

  createChao(name: string): ChaoData {
    const id = `chao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChao: ChaoData = {
      id,
      name,
      ...DEFAULT_CHAO,
    };
    
    this.state.chaoList.push(newChao);
    this.state.activeChaoId = id;
    
    this.notifyListeners('chao_list');
    
    if (this.eventManager) {
      this.eventManager.emit({
        type: EVENT_TYPES.CHAO_CREATED,
        payload: { chao: newChao },
      });
    }
    
    return newChao;
  }

  setActiveChao(id: string): boolean {
    const chao = this.getChaoById(id);
    if (!chao) return false;
    
    const previousId = this.state.activeChaoId;
    this.state.activeChaoId = id;
    
    this.notifyListeners('active_chao');
    
    if (this.eventManager) {
      this.eventManager.emit({
        type: EVENT_TYPES.CHAO_SELECTED,
        payload: { chao, previousId },
      });
    }
    
    return true;
  }

  updateChaoStats(id: string, statUpdates: Partial<ChaoData['stats']>) {
    const chao = this.getChaoById(id);
    if (!chao) return;
    
    Object.assign(chao.stats, statUpdates);
    
    // Check for evolution triggers
    this.checkEvolution(chao);
    
    this.notifyListeners('chao_stats');
    
    if (this.eventManager) {
      this.eventManager.emit({
        type: EVENT_TYPES.CHAO_STATS_CHANGED,
        payload: { chao, updates: statUpdates },
      });
    }
  }

  updateChaoNeeds(id: string, needUpdates: Partial<ChaoData['needs']>) {
    const chao = this.getChaoById(id);
    if (!chao) return;
    
    Object.assign(chao.needs, needUpdates);
    
    // Clamp values
    for (const key of Object.keys(chao.needs) as Array<keyof ChaoData['needs']>) {
      chao.needs[key] = Math.max(0, Math.min(100, chao.needs[key]));
    }
    
    this.notifyListeners('chao_needs');
  }

  addChaoExp(id: string, exp: number) {
    const chao = this.getChaoById(id);
    if (!chao) return;
    
    chao.exp += exp;
    
    // Level up check
    while (chao.exp >= chao.expToNextLevel) {
      chao.exp -= chao.expToNextLevel;
      chao.level++;
      chao.expToNextLevel = Math.floor(chao.expToNextLevel * CHAO_STATS.EXP_GROWTH_FACTOR);
      
      // Stat points on level up
      this.distributeLevelUpStats(chao);
      
      if (this.eventManager) {
        this.eventManager.emit({
          type: EVENT_TYPES.CHAO_LEVEL_UP,
          payload: { chao, newLevel: chao.level },
        });
      }
    }
    
    this.checkEvolution(chao);
    this.notifyListeners('chao_exp');
  }

  private distributeLevelUpStats(chao: ChaoData) {
    const pointsToDistribute = CHAO_STATS.STATS_PER_LEVEL;
    const stats = Object.keys(chao.stats) as Array<keyof ChaoData['stats']>;
    
    for (let i = 0; i < pointsToDistribute; i++) {
      const randomStat = stats[Math.floor(Math.random() * stats.length)];
      chao.stats[randomStat] += CHAO_STATS.POINTS_PER_STAT;
    }
  }

  private checkEvolution(chao: ChaoData) {
    const { stage, progress } = chao.evolution;
    
    // Evolution thresholds based on constants
    let nextStageThreshold: number;
    switch (stage) {
      case 0: // Egg to Baby
        nextStageThreshold = CHAO_STATS.EVOLUTION_EGG_TO_BABY;
        break;
      case 1: // Baby to Child
        nextStageThreshold = CHAO_STATS.EVOLUTION_BABY_TO_CHILD;
        break;
      case 2: // Child to Adult
        nextStageThreshold = CHAO_STATS.EVOLUTION_CHILD_TO_ADULT;
        break;
      default:
        return; // Max evolution reached
    }
    
    // Calculate dominant stat for evolution type
    const dominantStat = this.getDominantStat(chao.stats);
    const newType = this.determineEvolutionType(chao.stats, dominantStat);
    
    chao.evolution.progress = Math.min(100, (chao.level / nextStageThreshold) * 100);
    
    if (chao.evolution.progress >= 100 && stage < 3) {
      chao.evolution.stage++;
      chao.evolution.type = newType;
      chao.evolution.progress = 0;
      
      if (this.eventManager) {
        this.eventManager.emit({
          type: EVENT_TYPES.CHAO_EVOLVED,
          payload: { chao, newStage: chao.evolution.stage, newType },
        });
      }
    }
  }

  private getDominantStat(stats: ChaoData['stats']): keyof ChaoData['stats'] {
    let max = 0;
    let dominant: keyof ChaoData['stats'] = 'swim';
    
    for (const [key, value] of Object.entries(stats)) {
      if (value > max) {
        max = value;
        dominant = key as keyof ChaoData['stats'];
      }
    }
    
    return dominant;
  }

  private determineEvolutionType(
    stats: ChaoData['stats'],
    dominant: keyof ChaoData['stats']
  ): ChaoData['evolution']['type'] {
    // Simple evolution logic based on dominant stat
    switch (dominant) {
      case 'swim': return 'swim';
      case 'fly': return 'fly';
      case 'run': return 'run';
      case 'power': return 'power';
      default: return 'neutral';
    }
  }

  // === Progress Tracking ===

  unlockLevel(levelId: string) {
    if (!this.state.unlockedLevels.includes(levelId)) {
      this.state.unlockedLevels.push(levelId);
      this.notifyListeners('unlocks');
      
      if (this.eventManager) {
        this.eventManager.emit({
          type: EVENT_TYPES.LEVEL_UNLOCKED,
          payload: { levelId },
        });
      }
    }
  }

  recordPlayTime(ms: number) {
    this.state.totalPlayTime += ms;
  }

  // === Persistence ===

  saveState() {
    try {
      this.state.lastSaveTime = Date.now();
      localStorage.setItem('solander_game_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  }

  loadState(): boolean {
    try {
      const saved = localStorage.getItem('solander_game_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
        this.notifyListeners('all');
        return true;
      }
    } catch (e) {
      console.warn('Failed to load game state:', e);
    }
    return false;
  }

  resetState() {
    this.state = {
      mode: 'menu',
      currentLevel: null,
      inventory: { ...DEFAULT_INVENTORY },
      chaoList: [],
      activeChaoId: null,
      unlockedLevels: ['mystic-valley'],
      totalPlayTime: 0,
      lastSaveTime: Date.now(),
    };
    
    this.notifyListeners('all');
    localStorage.removeItem('solander_game_state');
  }

  // === Event System ===

  subscribe(eventType: string, callback: (state: GameState) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    return () => this.unsubscribe(eventType, callback);
  }

  unsubscribe(eventType: string, callback: (state: GameState) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  private notifyListeners(eventType: string) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => cb(this.getState()));
    }
    
    // Also notify 'all' listeners
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(cb => cb(this.getState()));
    }
  }
}

// Singleton instance
let gameStoreInstance: GameStore | null = null;

export function getGameStore(): GameStore {
  if (!gameStoreInstance) {
    gameStoreInstance = new GameStore();
  }
  return gameStoreInstance;
}

export function resetGameStore() {
  gameStoreInstance = null;
}
