/**
 * Event Manager - Centralized Event Bus for Game Systems
 * Handles communication between Adventure, Garden, and Competition modes
 */

export const EVENT_TYPES = {
  // Mode Transitions
  MODE_SWITCH: 'mode_switch',
  
  // Inventory & Materials
  MATERIAL_COLLECTED: 'material_collected',
  MATERIAL_SPENT: 'material_spent',
  INVENTORY_UPDATED: 'inventory_updated',
  
  // Chao Events
  CHAO_CREATED: 'chao_created',
  CHAO_SELECTED: 'chao_selected',
  CHAO_STATS_CHANGED: 'chao_stats_changed',
  CHAO_NEEDS_CHANGED: 'chao_needs_changed',
  CHAO_EXP_GAINED: 'chao_exp_gained',
  CHAO_LEVEL_UP: 'chao_level_up',
  CHAO_EVOLVED: 'chao_evolved',
  CHAO_FED: 'chao_fed',
  CHAO_TRAINED: 'chao_trained',
  CHAO_SLEEP: 'chao_sleep',
  CHAO_WAKE: 'chao_wake',
  
  // Adventure Mode
  LEVEL_STARTED: 'level_started',
  LEVEL_COMPLETED: 'level_completed',
  LEVEL_FAILED: 'level_failed',
  COLLECTIBLE_PICKED: 'collectible_picked',
  ENEMY_DEFEATED: 'enemy_defeated',
  CHECKPOINT_REACHED: 'checkpoint_reached',
  TIME_BONUS: 'time_bonus',
  RANK_AWARDED: 'rank_awarded',
  LEVEL_UNLOCKED: 'level_unlocked',
  
  // Garden Mode
  GARDEN_ITEM_PLACED: 'garden_item_placed',
  GARDEN_ITEM_REMOVED: 'garden_item_removed',
  CHAO_INTERACTION: 'chao_interaction',
  GARDEN_DECORATION_BOUGHT: 'garden_decoration_bought',
  
  // Competition Mode
  RACE_STARTED: 'race_started',
  RACE_FINISHED: 'race_finished',
  COMPETITION_RANK: 'competition_rank',
  PRIZE_AWARDED: 'prize_awarded',
  
  // System
  GAME_SAVED: 'game_saved',
  GAME_LOADED: 'game_loaded',
  SETTINGS_CHANGED: 'settings_changed',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export interface GameEvent {
  type: EventType;
  payload?: any;
  timestamp?: number;
  source?: string;
}

type EventCallback = (event: GameEvent) => void;

export class EventManager {
  private listeners: Map<EventType, Set<EventCallback>>;
  private eventHistory: GameEvent[];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Subscribe once to an event
   */
  once(eventType: EventType, callback: EventCallback): () => void {
    const wrappedCallback = (event: GameEvent) => {
      callback(event);
      this.off(eventType, wrappedCallback);
    };
    
    return this.on(eventType, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(eventType: EventType, callback: EventCallback): void {
    this.listeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit an event
   */
  emit(event: GameEvent): void {
    const eventWithMeta = {
      ...event,
      timestamp: Date.now(),
      source: event.source || 'unknown',
    };

    // Add to history
    this.eventHistory.push(eventWithMeta);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(eventWithMeta);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      });
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EVENT] ${event.type}`, event.payload);
    }
  }

  /**
   * Get event history
   */
  getHistory(eventType?: EventType): GameEvent[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event type
   */
  getListenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): EventType[] {
    return Array.from(this.listeners.keys());
  }
}

// Singleton instance
let eventManagerInstance: EventManager | null = null;

export function getEventManager(): EventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = new EventManager();
  }
  return eventManagerInstance;
}

export function resetEventManager() {
  eventManagerInstance = null;
}
