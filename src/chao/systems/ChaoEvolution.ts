/**
 * Chao Evolution System
 * Handles stat-to-evolution mapping and transformation logic
 */

import { ChaoData } from '../core/GameStore';
import { CHAO_STATS, CHAO_EVOLUTION } from '../../constants';

export interface EvolutionResult {
  evolved: boolean;
  previousStage: number;
  newStage: number;
  previousType: string;
  newType: string;
  reason?: string;
}

export class ChaoEvolutionSystem {
  /**
   * Check if a Chao should evolve and perform evolution
   */
  static checkAndEvolve(chao: ChaoData): EvolutionResult | null {
    const { stage } = chao.evolution;
    
    // Max evolution reached
    if (stage >= 3) {
      return null;
    }

    // Get threshold for next stage
    const threshold = this.getStageThreshold(stage);
    
    // Check if level requirement is met
    if (chao.level < threshold) {
      return null;
    }

    // Determine new evolution type based on stats
    const newType = this.determineEvolutionType(chao.stats, chao.evolution.type);
    
    // Perform evolution
    const previousStage = chao.evolution.stage;
    const previousType = chao.evolution.type;
    
    chao.evolution.stage++;
    chao.evolution.type = newType;
    chao.evolution.progress = 0;

    // Apply evolution bonuses
    this.applyEvolutionBonuses(chao, newType);

    return {
      evolved: true,
      previousStage,
      newStage: chao.evolution.stage,
      previousType,
      newType,
      reason: `Reached level ${chao.level} with dominant stats`,
    };
  }

  /**
   * Get level threshold for next evolution stage
   */
  private static getStageThreshold(stage: number): number {
    switch (stage) {
      case 0: // Egg to Baby
        return CHAO_STATS.EVOLUTION_EGG_TO_BABY;
      case 1: // Baby to Child
        return CHAO_STATS.EVOLUTION_BABY_TO_CHILD;
      case 2: // Child to Adult
        return CHAO_STATS.EVOLUTION_CHILD_TO_ADULT;
      default:
        return Infinity;
    }
  }

  /**
   * Determine evolution type based on stats
   */
  static determineEvolutionType(
    stats: ChaoData['stats'],
    currentType: string
  ): ChaoData['evolution']['type'] {
    // Calculate stat scores including weighted bonuses
    const scores = this.calculateStatScores(stats);
    
    // Find dominant stat
    let maxScore = 0;
    let dominantStat: keyof ChaoData['stats'] = 'swim';
    
    for (const [stat, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantStat = stat as keyof ChaoData['stats'];
      }
    }

    // Check for hero/dark alignment
    const alignment = this.calculateAlignment(stats);
    
    // Determine final type
    if (alignment === 'hero' && maxScore > CHAO_EVOLUTION.HERO_ALIGNMENT_THRESHOLD) {
      return 'hero';
    }
    if (alignment === 'dark' && maxScore > CHAO_EVOLUTION.DARK_ALIGNMENT_THRESHOLD) {
      return 'dark';
    }

    // Map dominant stat to evolution type
    switch (dominantStat) {
      case 'swim':
        return 'swim';
      case 'fly':
        return 'fly';
      case 'run':
        return 'run';
      case 'power':
        return 'power';
      default:
        return 'neutral';
    }
  }

  /**
   * Calculate weighted stat scores
   */
  private static calculateStatScores(stats: ChaoData['stats']): Record<string, number> {
    const weights = CHAO_EVOLUTION.STAT_WEIGHTS;
    const scores: Record<string, number> = {};

    for (const [stat, value] of Object.entries(stats)) {
      const weight = weights[stat as keyof typeof weights] || 1.0;
      scores[stat] = value * weight;
    }

    return scores;
  }

  /**
   * Calculate hero/dark alignment based on stat balance
   */
  private static calculateAlignment(stats: ChaoData['stats']): 'hero' | 'dark' | 'neutral' {
    // Hero: balanced high stats
    // Dark: extreme focus on one stat
    
    const values = Object.values(stats);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const variance = max - min;
    const balance = avg / max; // Higher means more balanced
    
    // Hero threshold: well-balanced with high average
    if (balance > CHAO_EVOLUTION.HERO_BALANCE_THRESHOLD && avg > CHAO_EVOLUTION.HERO_STAT_AVERAGE) {
      return 'hero';
    }
    
    // Dark threshold: high variance (specialized)
    if (variance > CHAO_EVOLUTION.DARK_VARIANCE_THRESHOLD && max > CHAO_EVOLUTION.DARK_STAT_MAXIMUM) {
      return 'dark';
    }
    
    return 'neutral';
  }

  /**
   * Apply bonuses upon evolution
   */
  private static applyEvolutionBonuses(chao: ChaoData, newType: string): void {
    const bonusMultiplier = CHAO_EVOLUTION.EVOLUTION_STAT_BONUS;
    
    switch (newType) {
      case 'swim':
        chao.stats.swim += Math.floor(chao.stats.swim * bonusMultiplier);
        chao.stats.stamina += Math.floor(chao.stats.stamina * bonusMultiplier * 0.5);
        break;
      case 'fly':
        chao.stats.fly += Math.floor(chao.stats.fly * bonusMultiplier);
        chao.stats.intelligence += Math.floor(chao.stats.intelligence * bonusMultiplier * 0.5);
        break;
      case 'run':
        chao.stats.run += Math.floor(chao.stats.run * bonusMultiplier);
        chao.stats.stamina += Math.floor(chao.stats.stamina * bonusMultiplier * 0.5);
        break;
      case 'power':
        chao.stats.power += Math.floor(chao.stats.power * bonusMultiplier);
        chao.stats.luck += Math.floor(chao.stats.luck * bonusMultiplier * 0.3);
        break;
      case 'hero':
        // Balanced bonus to all stats
        for (const stat of Object.keys(chao.stats) as Array<keyof ChaoData['stats']>) {
          chao.stats[stat] += Math.floor(chao.stats[stat] * bonusMultiplier * 0.3);
        }
        break;
      case 'dark':
        // Large bonus to dominant stat
        const dominantStat = this.getDominantStat(chao.stats);
        chao.stats[dominantStat] += Math.floor(chao.stats[dominantStat] * bonusMultiplier * 1.5);
        break;
    }
  }

  /**
   * Get the dominant stat
   */
  private static getDominantStat(stats: ChaoData['stats']): keyof ChaoData['stats'] {
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

  /**
   * Get evolution description
   */
  static getEvolutionDescription(type: string, stage: number): string {
    const descriptions: Record<string, Record<number, string>> = {
      neutral: {
        1: 'Baby Chao - A curious young creature',
        2: 'Child Chao - Growing and learning',
        3: 'Adult Chao - A well-rounded companion',
      },
      run: {
        1: 'Baby Run Chao - Always on the move',
        2: 'Child Run Chao - Speedy little friend',
        3: 'Adult Run Chao - Master of speed',
      },
      power: {
        1: 'Baby Power Chao - Strong for its size',
        2: 'Child Power Chao - Building muscle',
        3: 'Adult Power Chao - Incredibly strong',
      },
      swim: {
        1: 'Baby Swim Chao - Loves the water',
        2: 'Child Swim Chao - Natural swimmer',
        3: 'Adult Swim Chao - Aquatic expert',
      },
      fly: {
        1: 'Baby Fly Chao - Flutters about',
        2: 'Child Fly Chao - Learning to soar',
        3: 'Adult Fly Chao - Master of the skies',
      },
      hero: {
        1: 'Baby Hero Chao - Radiates positivity',
        2: 'Child Hero Chao - Noble and kind',
        3: 'Adult Hero Chao - A beacon of hope',
      },
      dark: {
        1: 'Baby Dark Chao - Mysterious aura',
        2: 'Child Dark Chao - Developing power',
        3: 'Adult Dark Chao - Wields dark energy',
      },
    };

    return descriptions[type]?.[stage] || 'A mysterious Chao';
  }

  /**
   * Check if evolution is possible
   */
  static canEvolve(chao: ChaoData): boolean {
    if (chao.evolution.stage >= 3) return false;
    
    const threshold = this.getStageThreshold(chao.evolution.stage);
    return chao.level >= threshold;
  }

  /**
   * Get progress to next evolution
   */
  static getEvolutionProgress(chao: ChaoData): number {
    if (chao.evolution.stage >= 3) return 100;
    
    const threshold = this.getStageThreshold(chao.evolution.stage);
    return Math.min(100, (chao.level / threshold) * 100);
  }

  /**
   * Get all possible evolution types
   */
  static getPossibleEvolutions(): string[] {
    return ['neutral', 'run', 'power', 'swim', 'fly', 'hero', 'dark'];
  }
}
