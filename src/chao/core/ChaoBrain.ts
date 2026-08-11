/**
 * Chao Brain - AI State Machine for Chao Behavior
 * Implements needs-based decision making and action selection
 */

import { ChaoData } from '../core/GameStore';
import { CHAO_STATS, CHAO_BEHAVIOR } from '../../constants';

export enum ChaoState {
  IDLE = 'idle',
  HUNGRY = 'hungry',
  SLEEPY = 'sleepy',
  HAPPY = 'happy',
  TRAINING = 'training',
  PLAYING = 'playing',
  RESTING = 'resting',
  EXPLORING = 'exploring',
}

export interface ChaoAction {
  type: 'eat' | 'sleep' | 'train' | 'play' | 'rest' | 'wander';
  priority: number;
  duration: number; // ms
  targetStat?: keyof ChaoData['stats'];
}

export class ChaoBrain {
  private chao: ChaoData;
  private currentState: ChaoState;
  private currentAction: ChaoAction | null;
  private stateTimer: number;
  private personalitySeed: number;

  constructor(chao: ChaoData) {
    this.chao = chao;
    this.currentState = ChaoState.IDLE;
    this.currentAction = null;
    this.stateTimer = 0;
    this.personalitySeed = Math.random();
  }

  updateChao(chao: ChaoData) {
    this.chao = chao;
  }

  /**
   * Update Chao brain logic - call every frame or at interval
   */
  update(deltaTime: number): ChaoAction | null {
    this.stateTimer += deltaTime;

    // Check if current action is complete
    if (this.currentAction && this.stateTimer >= this.currentAction.duration) {
      this.completeAction();
    }

    // Evaluate needs and decide on action
    if (!this.currentAction) {
      this.decideNextAction();
    }

    // Decay needs over time
    this.decayNeeds(deltaTime);

    return this.currentAction;
  }

  /**
   * Decide next action based on needs and personality
   */
  private decideNextAction(): void {
    const actions: ChaoAction[] = [];

    // Hunger-driven action
    if (this.chao.needs.hunger < CHAO_BEHAVIOR.HUNGER_THRESHOLD) {
      actions.push({
        type: 'eat',
        priority: this.calculateHungerPriority(),
        duration: CHAO_BEHAVIOR.EAT_DURATION,
      });
    }

    // Energy-driven action
    if (this.chao.needs.energy < CHAO_BEHAVIOR.ENERGY_THRESHOLD) {
      actions.push({
        type: 'sleep',
        priority: this.calculateEnergyPriority(),
        duration: CHAO_BEHAVIOR.SLEEP_DURATION,
      });
    }

    // Training actions based on stats and evolution
    if (this.shouldTrain()) {
      const trainingActions = this.getTrainingActions();
      actions.push(...trainingActions);
    }

    // Play action for happiness
    if (this.chao.needs.happiness < CHAO_BEHAVIOR.HAPPINESS_THRESHOLD) {
      actions.push({
        type: 'play',
        priority: this.calculateHappinessPriority(),
        duration: CHAO_BEHAVIOR.PLAY_DURATION,
      });
    }

    // Default rest/wander actions
    if (actions.length === 0) {
      if (this.chao.needs.energy < 80) {
        actions.push({
          type: 'rest',
          priority: 0.3,
          duration: CHAO_BEHAVIOR.REST_DURATION,
        });
      } else {
        actions.push({
          type: 'wander',
          priority: 0.2,
          duration: CHAO_BEHAVIOR.WANDER_DURATION,
        });
      }
    }

    // Select highest priority action
    if (actions.length > 0) {
      actions.sort((a, b) => b.priority - a.priority);
      this.currentAction = actions[0];
      this.stateTimer = 0;
      this.updateStateFromAction(this.currentAction);
    }
  }

  /**
   * Calculate hunger priority (higher when more hungry)
   */
  private calculateHungerPriority(): number {
    const hungerFactor = (100 - this.chao.needs.hunger) / 100;
    return hungerFactor * CHAO_BEHAVIOR.HUNGER_PRIORITY_MULTIPLIER;
  }

  /**
   * Calculate energy priority (higher when more tired)
   */
  private calculateEnergyPriority(): number {
    const energyFactor = (100 - this.chao.needs.energy) / 100;
    return energyFactor * CHAO_BEHAVIOR.ENERGY_PRIORITY_MULTIPLIER;
  }

  /**
   * Calculate happiness priority
   */
  private calculateHappinessPriority(): number {
    const happinessFactor = (100 - this.chao.needs.happiness) / 100;
    return happinessFactor * CHAO_BEHAVIOR.HAPPINESS_PRIORITY_MULTIPLIER;
  }

  /**
   * Determine if Chao should train
   */
  private shouldTrain(): boolean {
    // Don't train if hungry or tired
    if (this.chao.needs.hunger < CHAO_BEHAVIOR.HUNGER_THRESHOLD) return false;
    if (this.chao.needs.energy < CHAO_BEHAVIOR.ENERGY_THRESHOLD) return false;

    // Train if happiness is high enough
    return this.chao.needs.happiness >= CHAO_BEHAVIOR.TRAIN_HAPPINESS_REQUIREMENT;
  }

  /**
   * Get available training actions based on evolution type
   */
  private getTrainingActions(): ChaoAction[] {
    const actions: ChaoAction[] = [];
    const { type } = this.chao.evolution;

    // Base training options
    const availableStats: Array<keyof ChaoData['stats']> = ['swim', 'fly', 'run', 'power', 'stamina'];

    // Add stat-specific training based on evolution type
    switch (type) {
      case 'swim':
        actions.push({
          type: 'train',
          priority: 0.6 + (this.personalitySeed * 0.2),
          duration: CHAO_BEHAVIOR.TRAIN_DURATION,
          targetStat: 'swim',
        });
        break;
      case 'fly':
        actions.push({
          type: 'train',
          priority: 0.6 + (this.personalitySeed * 0.2),
          duration: CHAO_BEHAVIOR.TRAIN_DURATION,
          targetStat: 'fly',
        });
        break;
      case 'run':
        actions.push({
          type: 'train',
          priority: 0.6 + (this.personalitySeed * 0.2),
          duration: CHAO_BEHAVIOR.TRAIN_DURATION,
          targetStat: 'run',
        });
        break;
      case 'power':
        actions.push({
          type: 'train',
          priority: 0.6 + (this.personalitySeed * 0.2),
          duration: CHAO_BEHAVIOR.TRAIN_DURATION,
          targetStat: 'power',
        });
        break;
      default:
        // Neutral - random training
        const randomStat = availableStats[Math.floor(this.personalitySeed * availableStats.length)];
        actions.push({
          type: 'train',
          priority: 0.5,
          duration: CHAO_BEHAVIOR.TRAIN_DURATION,
          targetStat: randomStat,
        });
    }

    return actions;
  }

  /**
   * Update internal state based on action
   */
  private updateStateFromAction(action: ChaoAction): void {
    switch (action.type) {
      case 'eat':
        this.currentState = ChaoState.HUNGRY;
        break;
      case 'sleep':
        this.currentState = ChaoState.SLEEPY;
        break;
      case 'train':
        this.currentState = ChaoState.TRAINING;
        break;
      case 'play':
        this.currentState = ChaoState.PLAYING;
        break;
      case 'rest':
        this.currentState = ChaoState.RESTING;
        break;
      case 'wander':
        this.currentState = ChaoState.EXPLORING;
        break;
    }
  }

  /**
   * Complete current action and apply effects
   */
  private completeAction(): void {
    if (!this.currentAction) return;

    switch (this.currentAction.type) {
      case 'eat':
        this.applyEatEffect();
        break;
      case 'sleep':
        this.applySleepEffect();
        break;
      case 'train':
        this.applyTrainEffect();
        break;
      case 'play':
        this.applyPlayEffect();
        break;
      case 'rest':
        this.applyRestEffect();
        break;
      case 'wander':
        this.applyWanderEffect();
        break;
    }

    this.currentAction = null;
    this.currentState = ChaoState.IDLE;
    this.stateTimer = 0;
  }

  /**
   * Apply eating effects
   */
  private applyEatEffect(): void {
    const hungerRestore = CHAO_BEHAVIOR.HUNGER_RESTORE_RATE;
    this.chao.needs.hunger = Math.min(100, this.chao.needs.hunger + hungerRestore);
    
    // Small happiness boost from eating
    this.chao.needs.happiness = Math.min(100, this.chao.needs.happiness + 5);
  }

  /**
   * Apply sleeping effects
   */
  private applySleepEffect(): void {
    const energyRestore = CHAO_BEHAVIOR.ENERGY_RESTORE_RATE;
    this.chao.needs.energy = Math.min(100, this.chao.needs.energy + energyRestore);
    
    // Small happiness boost from rest
    this.chao.needs.happiness = Math.min(100, this.chao.needs.happiness + 3);
  }

  /**
   * Apply training effects
   */
  private applyTrainEffect(): void {
    if (this.currentAction?.targetStat) {
      const statGain = CHAO_BEHAVIOR.TRAIN_STAT_GAIN;
      this.chao.stats[this.currentAction.targetStat] += statGain;
      
      // Grant experience
      const expGain = CHAO_BEHAVIOR.TRAIN_EXP_GAIN;
      // Note: Exp addition handled by GameStore
    }

    // Training costs energy and slightly reduces happiness
    this.chao.needs.energy = Math.max(0, this.chao.needs.energy - CHAO_BEHAVIOR.ENERGY_TRAIN_COST);
    this.chao.needs.happiness = Math.max(0, this.chao.needs.happiness - CHAO_BEHAVIOR.HAPPINESS_TRAIN_COST);
  }

  /**
   * Apply play effects
   */
  private applyPlayEffect(): void {
    const happinessGain = CHAO_BEHAVIOR.PLAY_HAPPINESS_GAIN;
    this.chao.needs.happiness = Math.min(100, this.chao.needs.happiness + happinessGain);
    
    // Playing costs some energy
    this.chao.needs.energy = Math.max(0, this.chao.needs.energy - CHAO_BEHAVIOR.ENERGY_PLAY_COST);
  }

  /**
   * Apply rest effects
   */
  private applyRestEffect(): void {
    const energyGain = CHAO_BEHAVIOR.ENERGY_REST_GAIN;
    this.chao.needs.energy = Math.min(100, this.chao.needs.energy + energyGain);
  }

  /**
   * Apply wander/exploration effects
   */
  private applyWanderEffect(): void {
    // Small random stat increases from exploration
    const stats = Object.keys(this.chao.stats) as Array<keyof ChaoData['stats']>;
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    this.chao.stats[randomStat] += CHAO_BEHAVIOR.WANDER_STAT_GAIN;
    
    // Small happiness gain
    this.chao.needs.happiness = Math.min(100, this.chao.needs.happiness + CHAO_BEHAVIOR.HAPPINESS_WANDER_GAIN);
  }

  /**
   * Decay needs over time
   */
  private decayNeeds(deltaTime: number): void {
    const decayRate = deltaTime / 1000; // Convert to seconds

    // Hunger decays continuously
    this.chao.needs.hunger = Math.max(0, 
      this.chao.needs.hunger - (CHAO_BEHAVIOR.HUNGER_DECAY_RATE * decayRate)
    );

    // Energy decays when active
    if (this.currentState !== ChaoState.SLEEPY && this.currentState !== ChaoState.RESTING) {
      this.chao.needs.energy = Math.max(0,
        this.chao.needs.energy - (CHAO_BEHAVIOR.ENERGY_DECAY_RATE * decayRate)
      );
    }

    // Happiness decays slowly
    this.chao.needs.happiness = Math.max(0,
      this.chao.needs.happiness - (CHAO_BEHAVIOR.HAPPINESS_DECAY_RATE * decayRate)
    );
  }

  /**
   * Force a specific action (for player interaction)
   */
  forceAction(action: ChaoAction): void {
    this.currentAction = action;
    this.stateTimer = 0;
    this.updateStateFromAction(action);
  }

  /**
   * Get current state
   */
  getState(): ChaoState {
    return this.currentState;
  }

  /**
   * Get current action
   */
  getCurrentAction(): ChaoAction | null {
    return this.currentAction;
  }

  /**
   * Interrupt current action
   */
  interrupt(): void {
    this.currentAction = null;
    this.currentState = ChaoState.IDLE;
    this.stateTimer = 0;
  }
}
