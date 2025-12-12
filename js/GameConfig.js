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

    // === LEVEL SYSTEM (with Hook difficulty curve) ===
    levels: {
        transitionDuration: 900, // frames (15 seconds)
        maxLevels: 100,
        tileSize: 40,

        // Dynamic enemy count based on level (Hook curve: easy start, harder later)
        getEnemyCount: function (levelIndex) {
            const level = levelIndex + 1; // Convert 0-indexed to 1-indexed
            if (level <= 3) return 1;      // Tutorial: 1 enemy (impossible to lose)
            if (level <= 10) return 2;     // Easy: 2 enemies
            if (level <= 20) return 3;     // Normal: 3 enemies
            if (level <= 35) return 4;     // Challenge starts: 4 enemies
            if (level <= 50) return 5;     // Difficult: 5 enemies
            if (level <= 70) return 6;     // Very difficult: 6 enemies
            if (level <= 85) return 7;     // Hardcore: 7 enemies
            return 8;                       // Expert: 8 enemies (max)
        },

        // Dynamic enemy speed multiplier (Hook curve)
        getSpeedMultiplier: function (levelIndex) {
            const level = levelIndex + 1;
            if (level <= 3) return 0.6;    // Tutorial: very slow
            if (level <= 10) return 0.8;   // Easy: slow
            if (level <= 20) return 1.0;   // Normal: base speed
            if (level <= 35) return 1.1;   // Challenge: slightly faster
            if (level <= 50) return 1.2;   // Difficult: faster
            if (level <= 70) return 1.4;   // Very difficult: much faster
            if (level <= 85) return 1.5;   // Hardcore: very fast
            return 1.6;                     // Expert: extreme speed
        }
    },

    // === XP & LEVELING (Dynamic "Hook" System) ===
    progression: {
        bonusPerLevel: 0.001, // 0.1% per level
        xpFromFruit: 25,
        xpFromEnemy: 50,

        // XP required per level range (Hook curve: easy at start, harder later)
        // Returns XP needed to complete a specific level
        getXPForLevel: function (level) {
            if (level <= 5) return 100;       // Very fast (1-5)
            if (level <= 10) return 200;      // Fast (6-10)
            if (level <= 20) return 350;      // Starting to slow (11-20)
            if (level <= 40) return 500;      // Normal (21-40)
            if (level <= 60) return 750;      // Slow (41-60)
            if (level <= 80) return 1000;     // Very slow (61-80)
            return 1500;                       // Hardcore (81-100+)
        },

        // Total XP needed to reach a specific level
        getTotalXPForLevel: function (targetLevel) {
            let total = 0;
            for (let lvl = 1; lvl < targetLevel; lvl++) {
                total += this.getXPForLevel(lvl);
            }
            return total;
        },

        // Calculate current level from total XP
        getLevelFromTotalXP: function (totalXP) {
            let level = 1;
            let xpRemaining = totalXP;
            while (xpRemaining >= this.getXPForLevel(level)) {
                xpRemaining -= this.getXPForLevel(level);
                level++;
            }
            return level;
        },

        // XP progress within current level (for progress bar)
        getXPProgressInLevel: function (totalXP) {
            const currentLevel = this.getLevelFromTotalXP(totalXP);
            const xpForCurrentLevel = this.getTotalXPForLevel(currentLevel);
            return totalXP - xpForCurrentLevel;
        }
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
