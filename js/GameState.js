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
        this.load();
    }

    load() {
        // Load Local
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.coins = parsed.coins || 0;
                this.dragocoin = parsed.dragocoin || 0;
                this.inventory = parsed.inventory || [];
                this.achievements = parsed.achievements || [];
                this.unlockedAchievements = parsed.unlockedAchievements || [];
                this.playerXP = parsed.playerXP || 0;
                this.playerLevel = parsed.playerLevel || 1;
                this.lastLoginDate = parsed.lastLoginDate || null;
                this.loginStreak = parsed.loginStreak || 0;
                this.tutorialCompleted = parsed.tutorialCompleted || false;
                this.stats = {
                    speedLevel: 0,
                    enemiesTrapped: 0,
                    totalCoinsEarned: 0,
                    totalFruitCollected: 0,
                    gamesPlayed: 0,
                    levelsCompleted: 0,
                    powerupsCollected: 0,
                    totalDeaths: 0,
                    ...parsed.stats
                };
                this.maxLevel = parsed.maxLevel || 1;
            } catch (e) {
                console.error("Failed to load save data", e);
            }
        }
    }

    // New method to sync from cloud explicitly
    async syncFromCloud() {
        if (!this.username) return;

        let cloudData = await Database.loadProgress(this.username);

        // If guest, maybe cloudData is null, that's fine.
        if (cloudData) {
            console.log("Syncing from cloud:", cloudData);
            // Merge logic: take max of coins/level if conflict? 
            // For now, simpler: Cloud wins if it exists, or local wins if cloud is empty.
            // Actually, usually cloud should be source of truth if we want cross-device.
            this.coins = cloudData.coins !== undefined ? cloudData.coins : this.coins;
            this.inventory = cloudData.inventory || this.inventory;
            this.stats = cloudData.stats || this.stats;
            this.maxLevel = Math.max(this.maxLevel, cloudData.maxLevel || 1);

            this.save(false); // Save locally without echoing back to cloud immediately
        }
    }

    save(syncToCloud = true) {
        const data = {
            coins: this.coins,
            dragocoin: this.dragocoin,
            inventory: this.inventory,
            achievements: this.achievements,
            unlockedAchievements: this.unlockedAchievements,
            stats: this.stats,
            maxLevel: this.maxLevel,
            playerXP: this.playerXP,
            playerLevel: this.playerLevel,
            lastLoginDate: this.lastLoginDate,
            loginStreak: this.loginStreak,
            tutorialCompleted: this.tutorialCompleted
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));

        if (syncToCloud && this.username && !this.username.startsWith('utente_')) {
            // Only sync real users to cloud to save writes, or sync everyone?
            // User requested cloud recall, so lets sync everyone or at least real users.
            // Guest users might not need cloud unless they want to recover via ID?
            // Let's sync everyone for now, or just real users as per request "account".
            // Since guest accounts are random and disposable, syncing them just fills DB.
            // Better to sync only if not "utente_"? User asked "tutto... registrato sull'account".
            // Guest account IS an account. Let's sync it.
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
