import Database from './Database.js';

export default class GameState {
    constructor(storageKey = 'bubbleBobbleSave') {
        this.storageKey = storageKey;
        this.username = storageKey.replace('bubbleBobbleSave_', ''); // Extract username
        this.coins = 0;
        this.dragocoin = 0; // Rare premium currency
        this.inventory = [];
        this.achievements = [];
        this.unlockedAchievements = []; // IDs of unlocked achievements
        this.maxLevel = 1; // Default unlocked level (game levels)
        this.playerXP = 0; // Total accumulated XP
        this.playerLevel = 1; // Dragon level based on XP
        this.lastLoginDate = null; // For daily rewards
        this.loginStreak = 0; // Consecutive days logged in
        this.tutorialCompleted = false; // Has player completed tutorial
        this.stats = {
            speedLevel: 0,
            enemiesTrapped: 0,
            totalCoinsEarned: 0,
            totalFruitCollected: 0,
            gamesPlayed: 0,
            levelsCompleted: 0,
            powerupsCollected: 0,
            totalDeaths: 0
        };
        this.isLoaded = false; // Flag to track if data has been loaded from cloud
        // Data is loaded from cloud via syncFromCloud() called from main.js
    }

    // Load all data from Firebase cloud
    async syncFromCloud() {
        if (!this.username) return;

        try {
            let cloudData = await Database.loadProgress(this.username);

            if (cloudData) {
                console.log("📥 Caricamento dati da Firebase:", cloudData);

                // Load ALL fields from cloud (cloud is the only source of truth)
                this.coins = cloudData.coins || 0;
                this.dragocoin = cloudData.dragocoin || 0;
                this.inventory = cloudData.inventory || [];
                this.unlockedAchievements = cloudData.unlockedAchievements || [];
                this.maxLevel = cloudData.maxLevel || 1;
                this.playerXP = cloudData.playerXP || 0;
                this.playerLevel = cloudData.playerLevel || 1;
                this.lastLoginDate = cloudData.lastLoginDate || null;
                this.loginStreak = cloudData.loginStreak || 0;
                this.tutorialCompleted = cloudData.tutorialCompleted || false;
                this.stats = cloudData.stats || this.stats;

                this.isLoaded = true;
                console.log("✅ Dati caricati con successo dal cloud");
            } else {
                console.log("📭 Nessun dato trovato nel cloud per:", this.username);
                this.isLoaded = true; // Mark as loaded even if empty (new user)
            }
        } catch (error) {
            console.error("❌ Errore caricamento da cloud:", error);
        }
    }

    // Save data ONLY to Firebase cloud (no localStorage)
    save(syncToCloud = true) {
        // Sync to cloud for ALL users (including guests)
        if (syncToCloud && this.username) {
            Database.saveProgress(this.username, this);
        }
    }

    addCoins(amount) {
        this.coins += amount;
        this.save();
    }

    addXP(amount) {
        this.playerXP += amount;
        const newLevel = Math.floor(this.playerXP / 500) + 1; // 500 XP per level
        if (newLevel > this.playerLevel) {
            this.playerLevel = newLevel;
            console.log(`🎉 LEVEL UP! Now level ${this.playerLevel}`);
        }
        this.save();
        return this.playerLevel;
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    unlockItem(itemId) {
        if (!this.inventory.includes(itemId)) {
            this.inventory.push(itemId);
            this.save();
        }
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    upgradeStat(statName) {
        if (this.stats[statName] !== undefined) {
            this.stats[statName]++;
            this.save();
        }
    }

    unlockNextLevel(currentLevelIndex) {
        // levelIndex is 0-based. Level 1 is index 0.
        // If we finish index 0, we unlock index 1 (Level 2).
        // Check if we effectively advanced.
        const nextLevel = currentLevelIndex + 2; // +1 to get level number, +1 to get next
        if (nextLevel > this.maxLevel) {
            this.maxLevel = nextLevel;
            this.save();
            console.log("Unlocked Level:", this.maxLevel);
        }
    }

    // Increment a stat by amount
    incrementStat(statName, amount = 1) {
        if (this.stats[statName] !== undefined) {
            this.stats[statName] += amount;
            this.save();
        }
    }

    // Get stat value
    getStat(statName) {
        return this.stats[statName] || 0;
    }

    // === DRAGOCOIN METHODS ===
    addDragocoin(amount) {
        this.dragocoin += amount;
        this.save();
    }

    spendDragocoin(amount) {
        if (this.dragocoin >= amount) {
            this.dragocoin -= amount;
            this.save();
            return true;
        }
        return false;
    }

    // === DAILY REWARD SYSTEM ===
    checkDailyReward() {
        const today = new Date().toDateString();
        if (this.lastLoginDate === today) {
            return null; // Already claimed today
        }

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const isStreak = this.lastLoginDate === yesterday;

        return {
            canClaim: true,
            isStreak: isStreak,
            currentStreak: isStreak ? this.loginStreak + 1 : 1
        };
    }

    claimDailyReward() {
        const check = this.checkDailyReward();
        if (!check || !check.canClaim) return null;

        const today = new Date().toDateString();
        this.lastLoginDate = today;
        this.loginStreak = check.currentStreak;

        // Calculate rewards (streak bonus)
        const baseCoins = 50;
        const baseXP = 10;
        const streakMultiplier = Math.min(this.loginStreak, 7); // Max 7x

        const rewardCoins = baseCoins + (streakMultiplier * 10);
        const rewardXP = baseXP + (streakMultiplier * 5);
        const rewardDragocoin = Math.random() < 0.20 ? 1 : 0; // 20% chance

        this.coins += rewardCoins;
        this.playerXP += rewardXP;
        this.dragocoin += rewardDragocoin;

        this.save();

        return {
            coins: rewardCoins,
            xp: rewardXP,
            dragocoin: rewardDragocoin,
            streak: this.loginStreak
        };
    }

    // === LEVEL BONUSES ===
    // Each level gives ONLY ONE bonus in rotation: speed→jump→range→duration
    // Bonus is +0.1% per level, so at level 100 each stat has ~25% bonus
    getLevelBonuses() {
        const level = this.playerLevel;

        // Initialize all bonuses at 1.0 (no bonus)
        let speedBonus = 1;
        let jumpBonus = 1;
        let bubbleRangeBonus = 1;
        let bubbleDurationBonus = 1;

        // Fixed rotation pattern: 
        // Level 1: speed, Level 2: jump, Level 3: range, Level 4: duration, Level 5: speed...
        const bonusPerLevel = 0.001; // +0.1% per level

        for (let i = 1; i <= level; i++) {
            const bonusType = (i - 1) % 4; // 0=speed, 1=jump, 2=range, 3=duration
            switch (bonusType) {
                case 0:
                    speedBonus += bonusPerLevel;
                    break;
                case 1:
                    jumpBonus += bonusPerLevel;
                    break;
                case 2:
                    bubbleRangeBonus += bonusPerLevel;
                    break;
                case 3:
                    bubbleDurationBonus += bonusPerLevel;
                    break;
            }
        }

        return {
            speedBonus,
            jumpBonus,
            bubbleRangeBonus,
            bubbleDurationBonus
        };
    }

    // === ACHIEVEMENTS ===
    unlockAchievement(achievementId) {
        if (!this.unlockedAchievements.includes(achievementId)) {
            this.unlockedAchievements.push(achievementId);
            this.save();
            return true;
        }
        return false;
    }

    hasAchievement(achievementId) {
        return this.unlockedAchievements.includes(achievementId);
    }
}
