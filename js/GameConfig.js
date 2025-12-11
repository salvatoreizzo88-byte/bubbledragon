/**
 * GameConfig.js - Centralized game configuration and constants
 * 
 * This file contains all game balance values, making tuning easier.
 * Import and use these constants instead of magic numbers.
 */

const GameConfig = {
    // === PLAYER STATS ===
    player: {
        baseSpeed: 3,
        baseJumpForce: 10,
        baseGravity: 0.35,
        baseShootInterval: 20,
        invulnerabilityDuration: 180, // frames (3 seconds at 60fps)
        hitboxWidth: 32,
        hitboxHeight: 32,
        drawWidth: 64,
        drawHeight: 64
    },

    // === ENEMY STATS ===
    enemy: {
        baseSpeed: 1.2,
        gravity: 0.5,
        trappedDuration: 300, // frames (5 seconds)
        angrySpeedMultiplier: 1.5,
        hitboxSize: 32,
        drawSize: 64
    },

    // === BUBBLE STATS ===
    bubble: {
        speed: 8,
        floatSpeed: 0.5,
        lifetime: 300, // frames
        size: 32
    },

    // === LEVEL SYSTEM ===
    levels: {
        transitionDuration: 900, // frames (15 seconds)
        maxLevels: 100,
        tileSize: 40
    },

    // === XP & LEVELING ===
    progression: {
        xpPerLevel: 500,
        bonusPerLevel: 0.001, // 0.1% per level
        xpFromFruit: 25,
        xpFromEnemy: 50
    },

    // === ECONOMY ===
    economy: {
        coinsFromFruit: 10,
        coinsFromCoin: 5, // Base coin pickup value
        dragocoinFromAchievement: 5,
        xpBoostCost: 10, // Dragocoin
        xpBoostAmount: 500
    },

    // === DAILY REWARDS ===
    dailyRewards: {
        baseCoins: 50,
        baseXP: 25,
        streakBonusCoins: 10, // Extra per day streak
        streakBonusXP: 5,
        maxStreak: 7
    },

    // === SHOP PRICES (Coins) ===
    shopPrices: {
        extraLife: 100,
        speedBoost: 150,
        bubbleRain: 200,
        shield: 250,
        doublePoints: 300
    },

    // === PREMIUM SHOP (Dragocoin) ===
    premiumPrices: {
        megaSpeed: 500,
        superJump: 750,
        bubbleMaster: 1000,
        coinMagnet: 1250,
        xpBoost: 1500,
        tripleJump: 2000,
        immortalStart: 3000
    },

    // === POWERUP DURATIONS ===
    powerups: {
        speedBoostDuration: 600, // frames (10 seconds)
        shieldDuration: 900, // frames (15 seconds)
        doublePointsDuration: 1200 // frames (20 seconds)
    },

    // === AUDIO ===
    audio: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        musicVolume: 0.5
    },

    // === PARTICLES ===
    particles: {
        bubblePopCount: 20,
        enemyDefeatedCount: 48, // 8 per color * 6 colors
        collectItemCount: 18,
        maxParticles: 500
    },

    // === CANVAS ===
    canvas: {
        width: 800,
        height: 600,
        targetFPS: 60
    }
};

// Freeze to prevent accidental modification
Object.freeze(GameConfig);
Object.freeze(GameConfig.player);
Object.freeze(GameConfig.enemy);
Object.freeze(GameConfig.bubble);
Object.freeze(GameConfig.levels);
Object.freeze(GameConfig.progression);
Object.freeze(GameConfig.economy);
Object.freeze(GameConfig.dailyRewards);
Object.freeze(GameConfig.shopPrices);
Object.freeze(GameConfig.premiumPrices);
Object.freeze(GameConfig.powerups);
Object.freeze(GameConfig.audio);
Object.freeze(GameConfig.particles);
Object.freeze(GameConfig.canvas);

export default GameConfig;
