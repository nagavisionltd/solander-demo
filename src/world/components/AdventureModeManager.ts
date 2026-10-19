/**
 * Adventure Mode Manager
 * Controls level flow, objectives, and completion conditions
 */

import { getGameStore } from '../core/GameStore';
import { getEventManager } from '../core/EventManager';
import { EVENT_TYPES } from '../core/EventManager';
import { MYSTIC_VALLEY, GAME_MODES, RANKINGS } from '../../constants';

export interface LevelObjective {
  id: string;
  type: 'collect' | 'defeat' | 'reach' | 'time' | 'score';
  description: string;
  target: number;
  current: number;
  completed: boolean;
  required: boolean;
}

export interface LevelResult {
  completed: boolean;
  rank: 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
  score: number;
  timeBonus: number;
  ringBonus: number;
  objectiveBonuses: number[];
  totalScore: number;
  materialsEarned: {
    rings: number;
    smallAnimals: number;
    chaosDrives: number;
  };
  chaoExpEarned: number;
}

export class AdventureModeManager {
  private currentLevelId: string | null;
  private objectives: Map<string, LevelObjective>;
  private startTime: number;
  private isLevelActive: boolean;
  private collectedRings: number;
  private defeatedEnemies: number;
  private checkpointsReached: number;

  constructor() {
    this.currentLevelId = null;
    this.objectives = new Map();
    this.startTime = 0;
    this.isLevelActive = false;
    this.collectedRings = 0;
    this.defeatedEnemies = 0;
    this.checkpointsReached = 0;
  }

  /**
   * Start a level
   */
  startLevel(levelId: string): void {
    const store = getGameStore();
    const eventManager = getEventManager();

    // Check if level is unlocked
    if (!store.getState().unlockedLevels.includes(levelId)) {
      console.warn(`Level ${levelId} is not unlocked`);
      return;
    }

    this.currentLevelId = levelId;
    this.objectives.clear();
    this.startTime = Date.now();
    this.isLevelActive = true;
    this.collectedRings = 0;
    this.defeatedEnemies = 0;
    this.checkpointsReached = 0;

    // Create level-specific objectives
    this.setupLevelObjectives(levelId);

    // Switch to adventure mode
    store.switchMode('adventure', levelId);

    // Emit event
    eventManager.emit({
      type: EVENT_TYPES.LEVEL_STARTED,
      payload: { levelId, objectives: this.getObjectivesList() },
    });
  }

  /**
   * Setup objectives for specific level
   */
  private setupLevelObjectives(levelId: string): void {
    switch (levelId) {
      case 'mystic-valley':
        this.setupMysticValleyObjectives();
        break;
      default:
        this.setupGenericObjectives();
    }
  }

  /**
   * Setup Mystic Valley objectives
   */
  private setupMysticValleyObjectives(): void {
    this.objectives.set('rings', {
      id: 'rings',
      type: 'collect',
      description: `Collect ${MYSTIC_VALLEY.TOTAL_RINGS} rings`,
      target: MYSTIC_VALLEY.TOTAL_RINGS,
      current: 0,
      completed: false,
      required: false,
    });

    this.objectives.set('animals', {
      id: 'animals',
      type: 'collect',
      description: `Free ${MYSTIC_VALLEY.TOTAL_ANIMALS} small animals`,
      target: MYSTIC_VALLEY.TOTAL_ANIMALS,
      current: 0,
      completed: false,
      required: true,
    });

    this.objectives.set('goal', {
      id: 'goal',
      type: 'reach',
      description: 'Reach the goal ring',
      target: 1,
      current: 0,
      completed: false,
      required: true,
    });

    this.objectives.set('time', {
      id: 'time',
      type: 'time',
      description: `Complete within ${MYSTIC_VALLEY.TIME_LIMIT_S} seconds`,
      target: MYSTIC_VALLEY.TIME_LIMIT_S,
      current: 0,
      completed: false,
      required: false,
    });
  }

  /**
   * Setup generic objectives for other levels
   */
  private setupGenericObjectives(): void {
    this.objectives.set('goal', {
      id: 'goal',
      type: 'reach',
      description: 'Reach the goal',
      target: 1,
      current: 0,
      completed: false,
      required: true,
    });
  }

  /**
   * Update objective progress
   */
  updateObjective(objectiveId: string, amount: number = 1): void {
    const objective = this.objectives.get(objectiveId);
    if (!objective) return;

    objective.current = Math.min(objective.target, objective.current + amount);
    objective.completed = objective.current >= objective.target;

    // Emit event
    const eventManager = getEventManager();
    eventManager.emit({
      type: EVENT_TYPES.CHECKPOINT_REACHED,
      payload: { objectiveId, current: objective.current, target: objective.target },
    });
  }

  /**
   * Record ring collection
   */
  collectRing(amount: number = 1): void {
    this.collectedRings += amount;
    this.updateObjective('rings', amount);
  }

  /**
   * Record enemy defeat
   */
  defeatEnemy(amount: number = 1): void {
    this.defeatedEnemies += amount;
  }

  /**
   * Record checkpoint reached
   */
  reachCheckpoint(): void {
    this.checkpointsReached++;
  }

  /**
   * Complete the level
   */
  completeLevel(): LevelResult {
    const eventManager = getEventManager();
    const store = getGameStore();

    if (!this.isLevelActive || !this.currentLevelId) {
      throw new Error('No active level to complete');
    }

    const endTime = Date.now();
    const timeTaken = (endTime - this.startTime) / 1000; // seconds

    // Mark goal as reached
    this.updateObjective('goal', 1);

    // Calculate time bonus
    const timeBonus = this.calculateTimeBonus(timeTaken);

    // Calculate ring bonus
    const ringBonus = this.collectedRings * RANKINGS.RING_POINT_VALUE;

    // Calculate objective bonuses
    const objectiveBonuses: number[] = [];
    let totalObjectiveBonus = 0;
    
    for (const objective of this.objectives.values()) {
      if (objective.completed) {
        const bonus = this.getObjectiveBonus(objective);
        objectiveBonuses.push(bonus);
        totalObjectiveBonus += bonus;
      }
    }

    // Calculate base score
    const baseScore = ringBonus + timeBonus + totalObjectiveBonus;

    // Determine rank
    const rank = this.calculateRank(baseScore, timeTaken);

    // Calculate total score with rank multiplier
    const rankMultiplier = RANKINGS.SCORE_MULTIPLIERS[rank];
    const totalScore = Math.floor(baseScore * rankMultiplier);

    // Calculate material rewards
    const materialsEarned = this.calculateMaterialRewards(rank);

    // Calculate Chao EXP
    const chaoExpEarned = this.calculateChaoExp(rank, timeTaken);

    const result: LevelResult = {
      completed: true,
      rank,
      score: baseScore,
      timeBonus,
      ringBonus,
      objectiveBonuses,
      totalScore,
      materialsEarned,
      chaoExpEarned,
    };

    // Award materials
    store.addMaterial('rings', materialsEarned.rings);
    store.addMaterial('smallAnimals', materialsEarned.smallAnimals);
    store.addMaterial('chaosDrives', materialsEarned.chaosDrives);

    // Award Chao EXP
    const activeChao = store.getActiveChao();
    if (activeChao) {
      store.addChaoExp(activeChao.id, chaoExpEarned);
    }

    // Unlock next level if applicable
    this.unlockNextLevel();

    // End level
    this.isLevelActive = false;

    // Emit events
    eventManager.emit({
      type: EVENT_TYPES.LEVEL_COMPLETED,
      payload: { levelId: this.currentLevelId, result },
    });

    eventManager.emit({
      type: EVENT_TYPES.RANK_AWARDED,
      payload: { rank, totalScore, levelId: this.currentLevelId },
    });

    return result;
  }

  /**
   * Fail the level
   */
  failLevel(reason: string): void {
    const eventManager = getEventManager();

    if (!this.isLevelActive || !this.currentLevelId) {
      throw new Error('No active level to fail');
    }

    this.isLevelActive = false;

    eventManager.emit({
      type: EVENT_TYPES.LEVEL_FAILED,
      payload: { levelId: this.currentLevelId, reason },
    });
  }

  /**
   * Calculate time bonus
   */
  private calculateTimeBonus(timeTaken: number): number {
    const timeLimit = MYSTIC_VALLEY.TIME_LIMIT_S;
    
    if (timeTaken > timeLimit) {
      return 0;
    }

    const timeRemaining = timeLimit - timeTaken;
    const bonusPerSecond = RANKINGS.TIME_BONUS_PER_SECOND;
    
    return Math.floor(timeRemaining * bonusPerSecond);
  }

  /**
   * Get objective bonus points
   */
  private getObjectiveBonus(objective: LevelObjective): number {
    switch (objective.type) {
      case 'collect':
        return objective.target * RANKINGS.COLLECTIBLE_POINT_VALUE;
      case 'defeat':
        return objective.target * RANKINGS.ENEMY_POINT_VALUE;
      case 'reach':
        return RANKINGS.GOAL_POINT_VALUE;
      case 'time':
        return RANKINGS.TIME_GOAL_POINT_VALUE;
      default:
        return 0;
    }
  }

  /**
   * Calculate rank based on score and time
   */
  private calculateRank(score: number, timeTaken: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' {
    const thresholds = RANKINGS.SCORE_THRESHOLDS;

    if (score >= thresholds.S && timeTaken < MYSTIC_VALLEY.TIME_LIMIT_S) {
      return 'S';
    } else if (score >= thresholds.A) {
      return 'A';
    } else if (score >= thresholds.B) {
      return 'B';
    } else if (score >= thresholds.C) {
      return 'C';
    } else if (score >= thresholds.D) {
      return 'D';
    } else {
      return 'E';
    }
  }

  /**
   * Calculate material rewards based on rank
   */
  private calculateMaterialRewards(rank: string): {
    rings: number;
    smallAnimals: number;
    chaosDrives: number;
  } {
    const baseRewards = RANKINGS.MATERIAL_REWARDS[rank] || RANKINGS.MATERIAL_REWARDS.E;

    return {
      rings: baseRewards.rings,
      smallAnimals: baseRewards.smallAnimals,
      chaosDrives: baseRewards.chaosDrives,
    };
  }

  /**
   * Calculate Chao EXP based on performance
   */
  private calculateChaoExp(rank: string, timeTaken: number): number {
    const baseExp = RANKINGS.CHAO_EXP_BASE[rank] || RANKINGS.CHAO_EXP_BASE.E;
    
    // Time bonus for completing under par time
    const parTime = MYSTIC_VALLEY.PAR_TIME_S;
    let timeBonus = 0;
    
    if (timeTaken < parTime) {
      timeBonus = Math.floor((parTime - timeTaken) * RANKINGS.CHAO_EXP_TIME_BONUS);
    }

    return baseExp + timeBonus;
  }

  /**
   * Unlock next level
   */
  private unlockNextLevel(): void {
    const store = getGameStore();
    
    // Simple progression: mystic-valley unlocks next level
    if (this.currentLevelId === 'mystic-valley') {
      store.unlockLevel('next-level-placeholder');
    }
  }

  /**
   * Get current objectives
   */
  getObjectivesList(): LevelObjective[] {
    return Array.from(this.objectives.values());
  }

  /**
   * Get level progress
   */
  getProgress(): {
    completedObjectives: number;
    totalObjectives: number;
    percentage: number;
  } {
    const objectives = this.getObjectivesList();
    const completed = objectives.filter(o => o.completed).length;
    
    return {
      completedObjectives: completed,
      totalObjectives: objectives.length,
      percentage: (completed / objectives.length) * 100,
    };
  }

  /**
   * Get elapsed time
   */
  getElapsedTime(): number {
    if (!this.isLevelActive) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Check if level is active
   */
  isActive(): boolean {
    return this.isLevelActive;
  }

  /**
   * Get current level ID
   */
  getCurrentLevelId(): string | null {
    return this.currentLevelId;
  }

  /**
   * Reset manager state
   */
  reset(): void {
    this.currentLevelId = null;
    this.objectives.clear();
    this.startTime = 0;
    this.isLevelActive = false;
    this.collectedRings = 0;
    this.defeatedEnemies = 0;
    this.checkpointsReached = 0;
  }
}

// Singleton instance
let adventureModeInstance: AdventureModeManager | null = null;

export function getAdventureModeManager(): AdventureModeManager {
  if (!adventureModeInstance) {
    adventureModeInstance = new AdventureModeManager();
  }
  return adventureModeInstance;
}

export function resetAdventureModeManager() {
  adventureModeInstance = null;
}
