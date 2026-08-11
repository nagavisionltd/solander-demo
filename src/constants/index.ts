/**
 * Global Constants for Solander Garden Project
 * Centralized configuration to avoid magic numbers
 */

// Physics & Movement
export const PHYSICS = {
  GRAVITY: -28.0,
  GROUND_FRICTION: 0.82,
  AIR_FRICTION: 0.92,
  TERMINAL_VELOCITY: -45.0,
} as const;

// Player Speed Stages (Sonic-inspired)
export const SPEED_STAGES = {
  JOG: { maxSpeed: 16.0, acceleration: 35.0, name: 'STAGE 1: JOG' },
  RUN: { maxSpeed: 28.0, acceleration: 45.0, name: 'STAGE 2: RUN' },
  SUPER_RUN: { maxSpeed: 42.0, acceleration: 55.0, name: 'STAGE 3: SUPER RUN' },
  TOP_SPEED: { maxSpeed: 60.0, acceleration: 70.0, name: 'STAGE 4: TOP SPEED' },
  MACH_RUN: { maxSpeed: 88.0, acceleration: 85.0, name: 'STAGE 5: MACH RUN' },
} as const;

// Jump Mechanics
export const JUMP = {
  BASE_FORCE: 14.5,
  APEX_THRESHOLD: 0.15,
  LANDING_THRESHOLD: 0.1,
  DOUBLE_JUMP_ENABLED: false,
} as const;

// Roll & Dash
export const ROLL = {
  DURATION: 0.65,
  SPEED_MULTIPLIER: 1.4,
  INVINCIBILITY_FRAMES: 12,
} as const;

export const DASH = {
  GROUND_DURATION: 0.22,
  AIR_DURATION: 0.35,
  SPEED_BOOST: 35.0,
  COOLDOWN: 0.8,
} as const;

// Animation Timings (seconds)
export const ANIMATION = {
  WALK_CYCLE: 0.5,
  RUN_CYCLE: 0.35,
  LAND_RECOVERY: 0.25,
  MELEE_COMBO_WINDOW: 0.4,
  SPINDASH_CHARGE_TIME: 1.2,
} as const;

// Garden World Constants
export const GARDEN = {
  POOL_CENTER: { x: 0, y: -0.2, z: -6.5 },
  POOL_RADIUS: 13.5,
  SMALL_POOL_CENTER: { x: 12.5, y: -0.2, z: 9.0 },
  SMALL_POOL_RADIUS: 6.2,
  TERRAIN_SIZE: 100,
  CLOUD_COUNT: 12,
  FIREFLY_COUNT: 60,
  MIST_PARTICLE_COUNT: 180,
} as const;

// Rendering & LOD
export const RENDERING = {
  LOD_DISTANCE_LOW: 15,
  LOD_DISTANCE_MEDIUM: 35,
  LOD_DISTANCE_HIGH: 60,
  FRUSTUM_CULLING_ENABLED: true,
  SHADOW_MAP_SIZE: 2048,
  PIXEL_RATIO_MAX: 2,
} as const;

// Audio
export const AUDIO = {
  MASTER_VOLUME: 0.7,
  SFX_VOLUME: 0.8,
  MUSIC_VOLUME: 0.5,
  FOOTSTEP_INTERVAL: 0.35,
} as const;

// Interaction
export const INTERACTION = {
  REACH_DISTANCE: 3.5,
  PETTING_DURATION: 2.0,
  CARRY_HEIGHT_OFFSET: 1.2,
} as const;

// Performance
export const PERFORMANCE = {
  MAX_PARTICLES: 500,
  BATCH_SIZE: 100,
  UPDATE_DELTA_LIMIT: 0.1,
} as const;

// Garden World Extended Constants
export const GARDEN_EXTENDED = {
  // Terrain
  TERRAIN_SIZE: 480,
  TERRAIN_SEGMENTS: 160,
  BOUNDARY_DISTANCE: 230,
  
  // Water pools
  POOL_WATER_DEPTH: 2.8,
  POOL_DEPTH_FACTOR: 0.12,
  SMALL_POOL_DEPTH: 1.8,
  SMALL_POOL_DEPTH_FACTOR: 0.1,
  
  // Clouds
  CLOUD_COUNT: 12,
  CLOUD_HEIGHT_MIN: 18,
  CLOUD_HEIGHT_MAX: 28,
  
  // Fireflies
  FIREFLY_COUNT: 60,
  FIREFLY_COLOR: 0xfacc15,
  FIREFLY_SIZE: 0.15,
  FIREFLY_OPACITY: 0.8,
  FIREFLY_Y_MIN: 0.5,
  FIREFLY_Y_MAX: 3.5,
  FIREFLY_SPREAD: 45,
  
  // Mist particles
  MIST_COUNT: 180,
  MIST_SIZE: 0.88,
  MIST_OPACITY: 0.65,
  MIST_COLOR: 0xe0f2fe,
  
  // Spores
  SPORE_COUNT: 200,
  SPORE_SIZE: 0.28,
  SPORE_COLOR: 0xa7f3d0,
  
  // God rays
  GOD_RAY_COUNT: 7,
  GOD_RAY_COLOR: 0xfef3c7,
  GOD_RAY_OPACITY: 0.02,
  
  // Lily pads
  LILY_PAD_COUNT_MAIN: 8,
  LILY_PAD_COUNT_SMALL: 5,
  LILY_PAD_RADIUS: 0.5,
  LILY_PAD_COLOR: 0x15803d,
  FLOWER_COLOR: 0xf472b6,
  FLOWER_SIZE: 0.18,
  
  // Waterfall
  WATERFALL_WIDTH: 3.2,
  WATERFALL_HEIGHT: 5.2,
  WATERFALL_COLOR: 0x38bdf8,
  WATERFALL_EMISSIVE: 0x38bdf8,
  WATERFALL_EMISSIVE_INTENSITY: 0.8,
  
  // Rocks
  ROCK_COLOR: 0x475569,
  ROCK_SCALE_X: 1.5,
  ROCK_SCALE_Y: 1.8,
  ROCK_SCALE_Z: 1.2,
  
  // Mist puffs
  MIST_PUFF_COUNT: 38,
  MIST_PUFF_SIZE: 0.75,
  MIST_PUFF_COLOR: 0xe0f2fe,
  MIST_PUFF_EMISSIVE: 0x0284c7,
  MIST_PUFF_EMISSIVE_INTENSITY: 0.1,
  MIST_PUFF_OPACITY: 0.2,
  
  // Eggs
  EGG_COUNT: 6,
  EGG_COLOR: 0xfde68a,
  EGG_EMISSIVE: 0xfbbf24,
  EGG_EMISSIVE_INTENSITY: 0.6,
} as const;

// Player Extended Constants
export const PLAYER_EXTENDED = {
  // Speed stages (extended details)
  SPEED_STAGE_1_MAX: 16.0,
  SPEED_STAGE_2_MAX: 28.0,
  SPEED_STAGE_3_MAX: 42.0,
  SPEED_STAGE_4_MAX: 60.0,
  SPEED_STAGE_5_MAX: 88.0,
  
  // Jump mechanics
  JUMP_BASE_FORCE: 14.5,
  JUMP_APEX_THRESHOLD: 0.15,
  JUMP_LANDING_THRESHOLD: 0.1,
  SPRING_PAD_UPWARD_FORCE: 28.0,
  SPRING_PAD_FORWARD_SPEED: 18.0,
  
  // Physics modifiers
  GROUND_FRICTION: 0.82,
  AIR_FRICTION: 0.92,
  DRIFT_FRICTION: 0.82,
  
  // Spindash
  SPINDASH_CHARGE_TIME: 1.2,
  SPINDASH_LAUNCH_BASE: 42.0,
  SPINDASH_TIER_MULTIPLIER: 11.0,
  SPINDASH_MAX_TIERS: 3,
  
  // Slope physics
  SLOPE_MOMENTUM_FACTOR: 28.0,
  SLOPE_HEIGHT_DIFF_THRESHOLD: 0.8,
  
  // Animation speeds
  ANIMATION_ROTATION_SPEED_AIR_DASH: 42.0,
  ANIMATION_ROTATION_SPEED_NORMAL: 30.0,
  
  // Position thresholds
  WATERFALL_CLIFF_Z_MIN: -13.2,
  WATERFALL_CLIFF_Z_MAX: -16.0,
  WATERFALL_CLIFF_X_RANGE: 3.5,
  WATERFALL_CLIFF_HEIGHT: 4.0,
  
  // Character dimensions
  HEAD_SIZE: 1.15,
  BODY_WIDTH: 1.0,
  BODY_HEIGHT: 1.6,
  BODY_DEPTH: 0.7,
  TAIL_SEGMENT_COUNT: 8,
  TAIL_SEGMENT_SIZE_BASE: 0.55,
  
  // Toon ramp colors (hex values as strings for reference)
  TOON_RAMP_SHADOW: '#323242',
  TOON_RAMP_PENUMBRA: '#6b6b80',
  TOON_RAMP_MIDTONE: '#b8b8cc',
  TOON_RAMP_DIFFUSE: '#f0f0f8',
  TOON_RAMP_SPECULAR: '#ffffff',
} as const;

// Mystic Valley / Adventure Mode Constants
export const MYSTIC_VALLEY = {
  // Stage selection
  STAGE_TYPES: ['TRON', 'ORIGINAL'] as const,
  
  // TRON stage geometry
  TRON_START_Z: 30,
  TRON_END_Z: -1820,
  TRON_TRACK_WIDTH_START: 32,
  TRON_TRACK_WIDTH_CHECKPOINT: 36,
  TRON_TRACK_WIDTH_GOAL: 40,
  TRON_LANE_WIDTH: 28,
  TRON_SHORT_LANE_WIDTH: 24,
  TRON_LONG_LANE_WIDTH: 28,
  
  // TRON fork positions
  TRON_FORK1_START_Z: -220,
  TRON_FORK1_END_Z: -680,
  TRON_FORK1_SPLIT_DISTANCE: 38,
  TRON_FORK2_START_Z: -920,
  TRON_FORK2_END_Z: -1580,
  TRON_SHORT_PATH_X: -32,
  TRON_LONG_PATH_MAX_X: 55,
  
  // TRON segment spacing
  TRON_SEGMENT_LENGTH: 52,
  TRON_SEGMENT_SPACING: 50,
  TRON_FLOOR_THICKNESS: 0.4,
  TRON_RAIL_HEIGHT: 0.6,
  TRON_RAIL_WIDTH: 0.5,
  
  // TRON scenery
  TRON_PILLAR_SPACING: 80,
  TRON_PILLAR_WIDTH: 3,
  TRON_PILLAR_HEIGHT: 30,
  TRON_PILLAR_SIDE_OFFSET: 65,
  TRON_ARCHWAY_PILLAR_HEIGHT: 12,
  TRON_ARCHWAY_WIDTH: 36,
  TRON_ARCHWAY_HEADER_HEIGHT: 11.8,
  TRON_CHECKPOINT_HEIGHT: 14,
  TRON_CHECKPOINT_BEAM_OPACITY: 0.35,
  
  // TRON colors
  TRON_BASE_COLOR: 0x030712,
  TRON_CYAN_LIGHT: 0x06b6d4,
  TRON_MAGENTA_LIGHT: 0xd946ef,
  TRON_AMBER_LIGHT: 0xf97316,
  TRON_EMERALD_LIGHT: 0x10b981,
  TRON_WIREFRAME_COLOR: 0x0284c7,
  TRON_BEAM_COLOR: 0x38bdf8,
  TRON_ROUGHNESS: 0.15,
  TRON_METALNESS: 0.85,
  TRON_EMISSIVE_INTENSITY: 1.2,
  
  // Original valley terrain
  VALLEY_START_Z: 20,
  VALLEY_END_Z: -2500,
  VALLEY_SEGMENT_LENGTH: 32,
  VALLEY_SEGMENT_SPACING: 30,
  VALLEY_TRACK_WIDTH: 70,
  VALLEY_TRACK_HEIGHT: 2.0,
  VALLEY_CRYSTAL_RIM_WIDTH: 2.0,
  VALLEY_CRYSTAL_RIM_HEIGHT: 1.2,
  VALLEY_CRYSTAL_RIM_OFFSET: 34,
  
  // Original valley scenery
  VALLEY_TREE_SPACING: 60,
  VALLEY_TREE_SIDE_OFFSET: 42,
  VALLEY_TREE_TRUNK_RADIUS_BOTTOM: 1.2,
  VALLEY_TREE_TRUNK_RADIUS_TOP: 0.8,
  VALLEY_TREE_TRUNK_HEIGHT: 7.0,
  VALLEY_TREE_FOLIAGE_RADIUS: 3.5,
  
  // Original valley colors
  VALLEY_CANYON_COLOR: 0x1e1b4b,
  VALLEY_CRYSTAL_COLOR: 0xc084fc,
  VALLEY_CRYSTAL_EMISSIVE: 0x9333ea,
  VALLEY_CRYSTAL_EMISSIVE_INTENSITY: 0.6,
  VALLEY_TREE_TRUNK_COLOR: 0x311b92,
  VALLEY_TREE_FOLIAGE_COLOR: 0xa855f7,
  VALLEY_TREE_FOLIAGE_EMISSIVE: 0x7e22ce,
  VALLEY_TREE_FOLIAGE_EMISSIVE_INTENSITY: 0.7,
  
  // Discovery points
  DISCOVERY_POINT_CORE_RADIUS: 2.8,
  DISCOVERY_POINT_CORE_COLOR: 0x38bdf8,
  DISCOVERY_POINT_CORE_EMISSIVE: 0x0284c7,
  DISCOVERY_POINT_CORE_EMISSIVE_INTENSITY: 1.0,
  
  // Resource nodes
  RESOURCE_ESSENCE_SIZE: 0.45,
  RESOURCE_ESSENCE_COLOR: 0x38bdf8,
  RESOURCE_ESSENCE_EMISSIVE: 0x0284c7,
  RESOURCE_ESSENCE_EMISSIVE_INTENSITY: 0.9,
  RESOURCE_SPAWN_SPACING: 45,
  RESOURCE_HEIGHT_OFFSET: 0.8,
  
  // Void enemies
  ENEMY_BODY_RADIUS: 1.2,
  ENEMY_SPIKE_COUNT: 12,
  ENEMY_SPIKE_LENGTH: 1.8,
  ENEMY_EYE_RADIUS: 0.35,
  ENEMY_COLOR: 0x1e1b4b,
  ENEMY_EYE_COLOR: 0xef4444,
  ENEMY_EYE_EMISSIVE: 0xb91c1c,
  ENEMY_EYE_EMISSIVE_INTENSITY: 1.5,
  ENEMY_SPAWN_SPACING: 120,
  ENEMY_HP_BASE: 3,
  
  // Dash panels
  DASH_PANEL_WIDTH: 4,
  DASH_PANEL_LENGTH: 6,
  DASH_PANEL_HEIGHT: 0.3,
  DASH_PANEL_ARROW_COLOR: 0xfbbf24,
  DASH_PANEL_GLOW_COLOR: 0xf59e0b,
  DASH_PANEL_BOOST_MULTIPLIER: 2.2,
  DASH_PANEL_COOLDOWN: 1.5,
  
  // Spring pads
  SPRING_PAD_RADIUS: 2.5,
  SPRING_PAD_COLOR: 0xef4444,
  SPRING_PAD_RING_COLOR: 0xfca5a5,
  SPRING_PAD_UPWARD_FORCE: 28.0,
  SPRING_PAD_FORWARD_SPEED: 18.0,
  SPRING_PAD_COOLDOWN: 1.2,
  
  // Speed rings
  SPEED_RING_RADIUS: 1.8,
  SPEED_RING_TUBE_RADIUS: 0.15,
  SPEED_RING_COLOR: 0xfbbf24,
  SPEED_RING_EMISSIVE: 0xf59e0b,
  SPEED_RING_EMISSIVE_INTENSITY: 1.3,
  SPEED_RING_ROTATION_SPEED: 2.5,
  
  // Goal ring
  GOAL_RING_RADIUS: 4.5,
  GOAL_RING_COLOR: 0xfbbf24,
  GOAL_RING_EMISSIVE: 0xf59e0b,
  GOAL_RING_EMISSIVE_INTENSITY: 2.0,
  
  // Trial pedestal
  TRIAL_PEDESTAL_HEIGHT: 3.5,
  TRIAL_PEDESTAL_RADIUS: 2.0,
  TRIAL_PEDESTAL_COLOR: 0x6366f1,
  TRIAL_PEDESTAL_EMISSIVE: 0x4338ca,
  TRIAL_PEDESTAL_EMISSIVE_INTENSITY: 0.8,
  
  // Checkpoint
  CHECKPOINT_PILLAR_RADIUS: 0.8,
  CHECKPOINT_PILLAR_HEIGHT: 14,
  CHECKPOINT_WIDTH: 28,
  CHECKPOINT_HEADER_HEIGHT: 13.5,
  CHECKPOINT_BEAM_OPACITY: 0.35,
  CHECKPOINT_COLOR: 0x06b6d4,
  CHECKPOINT_BEAM_COLOR: 0x38bdf8,
} as const;

// Game Loop / Economy Constants (Sonic Adventure 2 style)
export const GAME_LOOP = {
  // Material types for grinding
  MATERIAL_TYPES: ['essence', 'seeds', 'crystals', 'shards', 'relics'] as const,
  
  // Material values
  MATERIAL_VALUES: {
    essence: 1,
    seeds: 2,
    crystals: 5,
    shards: 10,
    relics: 25,
  },
  
  // Chao garden economy
  CHAO_FEED_COST: {
    basic: 5,
    premium: 15,
    special: 30,
  },
  
  CHAO_TRAINING_COST: {
    run: 10,
    fly: 10,
    power: 10,
    swim: 10,
  },
  
  // Adventure mode rewards
  LEVEL_COMPLETION_REWARDS: {
    time_bonus_threshold: 120, // seconds
    ring_bonus_threshold: 50,
    exploration_bonus_threshold: 3, // discovery points
  },
  
  // Ring system
  RING_VALUE: 1,
  RING_RESPAWN_TIME: 30, // seconds
  MAX_HOLDABLE_RINGS: 999,
  
  // Life system
  STARTING_LIVES: 3,
  LIFE_LOST_ON_FALL: true,
  LIFE_LOST_ON_ENEMY: true,
  CONTINUE_COST: 5, // rings
  
  // Score multipliers
  SPEED_COMBO_MULTIPLIER: {
    tier1: 1.5, // 10+ speed
    tier2: 2.0, // 30+ speed
    tier3: 3.0, // 50+ speed
    tier4: 5.0, // 70+ speed
  },
  
  TRICK_SCORE_BASE: 100,
  COMBO_WINDOW: 2.0, // seconds
  
  // Rank thresholds
  RANK_THRESHOLDS: {
    S: 50000,
    A: 40000,
    B: 30000,
    C: 20000,
    D: 10000,
    E: 0,
  },
} as const;

// Chao System Constants
export const CHAO = {
  // Stats
  STATS: ['run', 'fly', 'power', 'swim'] as const,
  MAX_STAT_LEVEL: 99,
  STAT_GAIN_PER_TRAINING: 1,
  
  // Evolution
  EVOLUTION_STAGES: ['egg', 'baby', 'child', 'teen', 'adult'] as const,
  BABY_DURATION: 180, // seconds
  CHILD_DURATION: 300,
  TEEN_DURATION: 600,
  
  // Happiness/Needs
  MAX_HUNGER: 100,
  MAX_HAPPINESS: 100,
  MAX_ENERGY: 100,
  HUNGER_DECAY_RATE: 0.5, // per minute
  HAPPINESS_DECAY_RATE: 0.3, // per minute
  ENERGY_DECAY_RATE: 0.2, // per minute
  
  // Genetics
  GENETIC_TRAITS: ['color', 'pattern', 'size', 'special'] as const,
  MUTATION_CHANCE: 0.15, // 15%
  
  // Breeding
  BREEDING_COOLDOWN: 600, // seconds
  EGG_HATCH_TIME: 120, // seconds
  
  // Garden capacity
  MAX_CHAO_PER_GARDEN: 8,
  MAX_CHAO_TOTAL: 20,
  
  // Interactions
  PETTING_HAPPINESS_GAIN: 5,
  FEEDING_HUNGER_REDUCTION: 30,
  SLEEPING_ENERGY_RECOVERY: 50,
} as const;

// Extended Chao Stats & Behavior Constants
export const CHAO_STATS = {
  // Base stats for new Chao
  BASE_SWIM: 10,
  BASE_FLY: 10,
  BASE_RUN: 10,
  BASE_POWER: 10,
  BASE_STAMINA: 10,
  BASE_INTELLIGENCE: 10,
  BASE_LUCK: 10,

  // Level progression
  EXP_TO_LEVEL_2: 100,
  EXP_GROWTH_FACTOR: 1.5,
  STATS_PER_LEVEL: 3,
  POINTS_PER_STAT: 1,

  // Evolution thresholds (levels)
  EVOLUTION_EGG_TO_BABY: 1,
  EVOLUTION_BABY_TO_CHILD: 10,
  EVOLUTION_CHILD_TO_ADULT: 20,

  // Stat caps
  MAX_STAT_VALUE: 999,
  SOFT_CAP_STAT: 500,
  HARD_CAP_STAT: 999,
} as const;

// Chao Behavior Configuration
export const CHAO_BEHAVIOR = {
  // Need thresholds
  HUNGER_THRESHOLD: 40,
  ENERGY_THRESHOLD: 30,
  HAPPINESS_THRESHOLD: 50,

  // Priority multipliers
  HUNGER_PRIORITY_MULTIPLIER: 1.5,
  ENERGY_PRIORITY_MULTIPLIER: 1.4,
  HAPPINESS_PRIORITY_MULTIPLIER: 1.2,

  // Action durations (ms)
  EAT_DURATION: 3000,
  SLEEP_DURATION: 10000,
  TRAIN_DURATION: 5000,
  PLAY_DURATION: 4000,
  REST_DURATION: 3000,
  WANDER_DURATION: 5000,

  // Training requirements
  TRAIN_HAPPINESS_REQUIREMENT: 60,

  // Effect rates
  HUNGER_RESTORE_RATE: 40,
  ENERGY_RESTORE_RATE: 50,
  HAPPINESS_RESTORE_RATE: 20,

  // Training gains
  TRAIN_STAT_GAIN: 2,
  TRAIN_EXP_GAIN: 15,
  ENERGY_TRAIN_COST: 15,
  HAPPINESS_TRAIN_COST: 5,

  // Play gains
  PLAY_HAPPINESS_GAIN: 25,
  ENERGY_PLAY_COST: 10,

  // Rest gains
  ENERGY_REST_GAIN: 20,

  // Wander gains
  WANDER_STAT_GAIN: 1,
  HAPPINESS_WANDER_GAIN: 5,

  // Decay rates (per second)
  HUNGER_DECAY_RATE: 0.8,
  ENERGY_DECAY_RATE: 0.5,
  HAPPINESS_DECAY_RATE: 0.3,
} as const;

// Chao Evolution Rules
export const CHAO_EVOLUTION = {
  // Stat weights for evolution calculation
  STAT_WEIGHTS: {
    swim: 1.0,
    fly: 1.0,
    run: 1.0,
    power: 1.0,
    stamina: 0.8,
    intelligence: 0.7,
    luck: 0.5,
  },

  // Hero alignment thresholds
  HERO_BALANCE_THRESHOLD: 0.75, // avg/max ratio
  HERO_STAT_AVERAGE: 200,
  HERO_ALIGNMENT_THRESHOLD: 150,

  // Dark alignment thresholds
  DARK_VARIANCE_THRESHOLD: 150, // max-min difference
  DARK_STAT_MAXIMUM: 300,
  DARK_ALIGNMENT_THRESHOLD: 200,

  // Evolution bonuses
  EVOLUTION_STAT_BONUS: 0.15, // 15% bonus to relevant stats
} as const;

// Collectible Configuration
export const COLLECTIBLES = {
  // Values
  RING_VALUE: 1,
  SMALL_ANIMAL_VALUE: 1,
  CHAOS_DRIVE_VALUE: 1,
  FRUIT_VALUE: 1,

  // Respawn times (ms)
  RING_RESPAWN_TIME: 30000,
  FRUIT_RESPAWN_TIME: 60000,

  // Sizes
  RING_SIZE: 1.5,
  RING_THICKNESS: 0.2,
  ANIMAL_SIZE: 1.2,
  CHAOS_DRIVE_SIZE: 1.0,
  FRUIT_SIZE: 0.8,

  // Colors (hex)
  RING_COLOR: '#FFD700',
  RING_EMISSIVE: '#FFA500',
  ANIMAL_COLOR: '#FF6B6B',
  ANIMAL_EMISSIVE: '#FF8E8E',
  CHAOS_DRIVE_COLOR: '#4ECDC4',
  CHAOS_DRIVE_EMISSIVE: '#7EECE5',
  FRUIT_COLOR: '#95E1D3',
  FRUIT_EMISSIVE: '#B5F0E5',

  // Animation
  RING_FLOAT_SPEED: 1.0,
  RING_FLOAT_AMPLITUDE: 0.5,
  CHAOS_DRIVE_FLOAT_SPEED: 0.7,

  // Pickup
  PICKUP_RADIUS: 1.5,

  // EXP rewards for Chao
  EXP_REWARD_SMALL_ANIMAL: 25,
  EXP_REWARD_CHAOS_DRIVE: 50,
} as const;

// Mystic Valley Level Configuration
export const MYSTIC_VALLEY = {
  // Geometry
  START_POSITION: { x: 0, y: 2, z: 0 },
  GOAL_POSITION: { x: 150, y: 10, z: 50 },
  LEVEL_LENGTH: 200,
  LEVEL_WIDTH: 80,
  MAX_HEIGHT: 40,

  // Objectives
  TOTAL_RINGS: 100,
  TOTAL_ANIMALS: 10,
  TOTAL_CHAOS_DRIVES: 5,

  // Time limits
  TIME_LIMIT_S: 300, // 5 minutes
  PAR_TIME_S: 180, // 3 minutes

  // Enemy spawns
  ENEMY_SPAWN_COUNT: 15,
  ENEMY_RESPAWN_TIME: 10000,

  // Checkpoints
  CHECKPOINT_COUNT: 5,

  // Environment
  FOG_DENSITY: 0.02,
  FOG_COLOR: '#87CEEB',
  AMBIENT_LIGHT: 0.6,
  DIRECTIONAL_LIGHT_INTENSITY: 1.2,
} as const;

// Ranking & Scoring System
export const RANKINGS = {
  // Score thresholds
  SCORE_THRESHOLDS: {
    S: 50000,
    A: 40000,
    B: 30000,
    C: 20000,
    D: 10000,
    E: 0,
  },

  // Score multipliers
  SCORE_MULTIPLIERS: {
    S: 2.0,
    A: 1.5,
    B: 1.2,
    C: 1.0,
    D: 0.8,
    E: 0.5,
  },

  // Point values
  RING_POINT_VALUE: 10,
  ENEMY_POINT_VALUE: 100,
  COLLECTIBLE_POINT_VALUE: 50,
  GOAL_POINT_VALUE: 1000,
  TIME_GOAL_POINT_VALUE: 500,
  TIME_BONUS_PER_SECOND: 50,

  // Material rewards by rank
  MATERIAL_REWARDS: {
    S: { rings: 50, smallAnimals: 5, chaosDrives: 3 },
    A: { rings: 35, smallAnimals: 3, chaosDrives: 2 },
    B: { rings: 25, smallAnimals: 2, chaosDrives: 1 },
    C: { rings: 15, smallAnimals: 1, chaosDrives: 0 },
    D: { rings: 10, smallAnimals: 0, chaosDrives: 0 },
    E: { rings: 5, smallAnimals: 0, chaosDrives: 0 },
  },

  // Chao EXP rewards by rank
  CHAO_EXP_BASE: {
    S: 200,
    A: 150,
    B: 100,
    C: 75,
    D: 50,
    E: 25,
  },
  CHAO_EXP_TIME_BONUS: 2, // EXP per second under par time
} as const;
