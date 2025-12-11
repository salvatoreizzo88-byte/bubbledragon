// Achievement definitions and manager - 500+ achievements with diverse rewards

// === ACHIEVEMENT GENERATOR ===
function generateAchievements() {
    const achievements = {};

    // Reward patterns based on index (deterministic, not random)
    // Pattern: XP, Coins, XP, Coins, Dragocoin (every 5th is dragocoin)
    function getRewardType(index, category) {
        const pattern = index % 5;
        if (pattern === 4) return 'dragocoin'; // Every 5th
        if (pattern === 0 || pattern === 2) return 'xp';
        return 'coins';
    }

    // === 1. LIVELLI COMPLETATI (100 achievements) ===
    for (let i = 1; i <= 100; i++) {
        const rewardType = getRewardType(i, 'livelli');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: Math.ceil(i / 20), label: `+${Math.ceil(i / 20)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 20 + i * 3, label: `+${20 + i * 3} 🪙` };
        } else {
            reward = { type: 'xp', value: 15 + i * 2, label: `+${15 + i * 2} ⭐` };
        }

        achievements[`level_${i}`] = {
            id: `level_${i}`,
            name: `Livello ${i}`,
            description: `Completa il livello ${i}`,
            icon: i <= 10 ? '🌟' : (i <= 50 ? '⭐' : '🏆'),
            category: 'livelli',
            points: Math.min(i, 50),
            reward
        };
    }

    // === 2. NEMICI CATTURATI (50 achievements) ===
    const enemyThresholds = [5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000, 200000, 250000, 300000, 400000, 500000, 600000, 750000, 1000000, 1500000, 2000000];
    enemyThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'nemici');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 1 + Math.floor(i / 10), label: `+${1 + Math.floor(i / 10)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 15 + i * 8, label: `+${15 + i * 8} 🪙` };
        } else {
            reward = { type: 'xp', value: 20 + i * 5, label: `+${20 + i * 5} ⭐` };
        }

        achievements[`enemies_${threshold}`] = {
            id: `enemies_${threshold}`,
            name: threshold >= 1000 ? `Cacciatore ${Math.floor(threshold / 1000)}K` : `Cacciatore ${threshold}`,
            description: `Cattura ${threshold.toLocaleString()} nemici`,
            icon: threshold < 100 ? '🫧' : (threshold < 1000 ? '💪' : '💀'),
            category: 'nemici',
            points: 5 + Math.floor(i * 1.5),
            requirement: { stat: 'nemiciCatturati', value: threshold },
            reward
        };
    });

    // === 3. FRUTTA RACCOLTA (50 achievements) ===
    const fruitThresholds = [10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 125000, 150000, 200000, 250000, 300000, 400000, 500000, 600000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 6000000, 7500000, 10000000, 15000000, 20000000, 25000000];
    fruitThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'frutta');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 1 + Math.floor(i / 8), label: `+${1 + Math.floor(i / 8)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 25 + i * 6, label: `+${25 + i * 6} 🪙` };
        } else {
            reward = { type: 'xp', value: 30 + i * 4, label: `+${30 + i * 4} ⭐` };
        }

        achievements[`fruit_${threshold}`] = {
            id: `fruit_${threshold}`,
            name: threshold >= 1000 ? `Goloso ${Math.floor(threshold / 1000)}K` : `Goloso ${threshold}`,
            description: `Raccogli ${threshold.toLocaleString()} frutti`,
            icon: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🍍', '🍉', '🍌'][i % 10],
            category: 'frutta',
            points: 5 + Math.floor(i * 1.2),
            requirement: { stat: 'frutteRaccolte', value: threshold },
            reward
        };
    });

    // === 4. MONETE GUADAGNATE (50 achievements) ===
    const coinThresholds = [50, 100, 200, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 4000000, 5000000, 7500000, 10000000, 15000000, 20000000, 30000000, 40000000, 50000000, 75000000, 100000000, 150000000, 200000000, 300000000, 500000000, 750000000, 1000000000, 1500000000, 2000000000];
    coinThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'monete');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 2 + Math.floor(i / 5), label: `+${2 + Math.floor(i / 5)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: Math.min(Math.floor(threshold * 0.02), 10000), label: `+${Math.min(Math.floor(threshold * 0.02), 10000)} 🪙` };
        } else {
            reward = { type: 'xp', value: 40 + i * 6, label: `+${40 + i * 6} ⭐` };
        }

        achievements[`coins_${threshold}`] = {
            id: `coins_${threshold}`,
            name: threshold >= 1000 ? `Ricco ${Math.floor(threshold / 1000)}K` : `Ricco ${threshold}`,
            description: `Guadagna ${threshold.toLocaleString()} monete totali`,
            icon: threshold < 1000 ? '💰' : (threshold < 100000 ? '👑' : '💎'),
            category: 'monete',
            points: 5 + Math.floor(i * 1.3),
            requirement: { stat: 'moneteGuadagnate', value: threshold },
            reward
        };
    });

    // === 5. PARTITE GIOCATE (30 achievements) ===
    const gamesThresholds = [1, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000, 150000, 200000];
    gamesThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'partite');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 1 + Math.floor(i / 6), label: `+${1 + Math.floor(i / 6)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 30 + i * 10, label: `+${30 + i * 10} 🪙` };
        } else {
            reward = { type: 'xp', value: 25 + i * 5, label: `+${25 + i * 5} ⭐` };
        }

        achievements[`games_${threshold}`] = {
            id: `games_${threshold}`,
            name: threshold === 1 ? 'Prima Partita' : `Veterano ${threshold}`,
            description: threshold === 1 ? 'Gioca la tua prima partita' : `Gioca ${threshold.toLocaleString()} partite`,
            icon: threshold < 10 ? '🎮' : (threshold < 100 ? '🎯' : '🏅'),
            category: 'partite',
            points: 5 + Math.floor(i * 1.1),
            requirement: { stat: 'partiteGiocate', value: threshold },
            reward
        };
    });

    // === 6. LIVELLO DRAGHETTO (100 achievements) - Special: more dragocoin ===
    for (let i = 2; i <= 101; i++) {
        // Dragon level gives more dragocoin rewards
        const pattern = (i - 2) % 5;
        let reward;
        if (pattern === 0 || pattern === 4) { // 2 out of 5 are dragocoin
            reward = { type: 'dragocoin', value: 1 + Math.floor((i - 2) / 10), label: `+${1 + Math.floor((i - 2) / 10)} 🐲` };
        } else if (pattern === 2) {
            reward = { type: 'coins', value: 50 + (i - 2) * 5, label: `+${50 + (i - 2) * 5} 🪙` };
        } else {
            reward = { type: 'xp', value: 30 + (i - 2) * 3, label: `+${30 + (i - 2) * 3} ⭐` };
        }

        achievements[`dragon_${i}`] = {
            id: `dragon_${i}`,
            name: `Draghetto Lv.${i}`,
            description: `Raggiungi il livello draghetto ${i}`,
            icon: i <= 10 ? '🐲' : (i <= 50 ? '🔥' : '⚡'),
            category: 'draghetto',
            points: 5 + Math.floor((i - 1) * 0.5),
            requirement: { stat: 'livelloGiocatore', value: i },
            reward
        };
    }

    // === 7. DRAGOCOIN RACCOLTI (30 achievements) - All give XP or Coins (not more dragocoin) ===
    const dragocoinThresholds = [1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000];
    dragocoinThresholds.forEach((threshold, i) => {
        // Dragocoin achievements give XP or coins, not more dragocoin
        const pattern = i % 2;
        let reward;
        if (pattern === 0) {
            reward = { type: 'xp', value: 100 + i * 20, label: `+${100 + i * 20} ⭐` };
        } else {
            reward = { type: 'coins', value: 100 + i * 30, label: `+${100 + i * 30} 🪙` };
        }

        achievements[`dragocoin_${threshold}`] = {
            id: `dragocoin_${threshold}`,
            name: threshold === 1 ? 'Primo Dragocoin' : `Dragocoin ${threshold}`,
            description: threshold === 1 ? 'Ottieni il tuo primo Dragocoin' : `Raccogli ${threshold.toLocaleString()} Dragocoin`,
            icon: '🐲',
            category: 'dragocoin',
            points: 10 + Math.floor(i * 2),
            requirement: { stat: 'dragocoin', value: threshold },
            reward
        };
    });

    // === 8. SERIE ACCESSI (20 achievements) - Best rewards: dragocoin heavy ===
    const streakThresholds = [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 180, 200, 250, 300, 365, 500, 730];
    streakThresholds.forEach((threshold, i) => {
        // Streak achievements give more dragocoin
        const pattern = i % 3;
        let reward;
        if (pattern === 0 || pattern === 2) {
            reward = { type: 'dragocoin', value: 2 + Math.floor(i / 2), label: `+${2 + Math.floor(i / 2)} 🐲` };
        } else {
            reward = { type: 'coins', value: 100 + i * 50, label: `+${100 + i * 50} 🪙` };
        }

        achievements[`streak_${threshold}`] = {
            id: `streak_${threshold}`,
            name: threshold < 30 ? `Costante ${threshold}g` : `Fedele ${threshold}g`,
            description: `Accedi ${threshold} giorni consecutivi`,
            icon: threshold < 7 ? '🔥' : (threshold < 30 ? '⚡' : '💫'),
            category: 'accessi',
            points: 15 + Math.floor(i * 3),
            requirement: { stat: 'serieAccessi', value: threshold },
            reward
        };
    });

    // === 9. MORTI TOTALI (20 achievements) - XP focus (learning from mistakes) ===
    const deathThresholds = [1, 5, 10, 25, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000];
    deathThresholds.forEach((threshold, i) => {
        const pattern = i % 4;
        let reward;
        if (pattern === 3) {
            reward = { type: 'dragocoin', value: 1, label: `+1 🐲` };
        } else if (pattern === 1) {
            reward = { type: 'coins', value: 20 + i * 5, label: `+${20 + i * 5} 🪙` };
        } else {
            reward = { type: 'xp', value: 15 + i * 3, label: `+${15 + i * 3} ⭐` };
        }

        achievements[`deaths_${threshold}`] = {
            id: `deaths_${threshold}`,
            name: threshold === 1 ? 'Prima Caduta' : `Tenace ${threshold}`,
            description: threshold === 1 ? 'Muori per la prima volta' : `Muori ${threshold.toLocaleString()} volte (la perseveranza conta!)`,
            icon: threshold < 100 ? '💔' : '🦸',
            category: 'tenacia',
            points: 3 + Math.floor(i * 0.8),
            requirement: { stat: 'mortiTotali', value: threshold },
            reward
        };
    });

    // === 10. POTENZIAMENTI RACCOLTI (20 achievements) ===
    const powerupThresholds = [1, 5, 10, 20, 35, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
    powerupThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'powerups');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 1 + Math.floor(i / 5), label: `+${1 + Math.floor(i / 5)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 25 + i * 8, label: `+${25 + i * 8} 🪙` };
        } else {
            reward = { type: 'xp', value: 20 + i * 4, label: `+${20 + i * 4} ⭐` };
        }

        achievements[`powerups_${threshold}`] = {
            id: `powerups_${threshold}`,
            name: threshold === 1 ? 'Primo Potenziamento' : `Potenziato ${threshold}`,
            description: threshold === 1 ? 'Raccogli il primo potenziamento' : `Raccogli ${threshold.toLocaleString()} potenziamenti`,
            icon: '⬆️',
            category: 'potenziamenti',
            points: 5 + Math.floor(i * 1.2),
            requirement: { stat: 'powerupRaccolti', value: threshold },
            reward
        };
    });

    // === 11. LIVELLI COMPLETATI TOTALI (30 achievements) ===
    const levelsCompletedThresholds = [1, 5, 10, 25, 50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 1000000];
    levelsCompletedThresholds.forEach((threshold, i) => {
        const rewardType = getRewardType(i, 'completamenti');
        let reward;
        if (rewardType === 'dragocoin') {
            reward = { type: 'dragocoin', value: 2 + Math.floor(i / 4), label: `+${2 + Math.floor(i / 4)} 🐲` };
        } else if (rewardType === 'coins') {
            reward = { type: 'coins', value: 50 + i * 15, label: `+${50 + i * 15} 🪙` };
        } else {
            reward = { type: 'xp', value: 40 + i * 8, label: `+${40 + i * 8} ⭐` };
        }

        achievements[`levels_completed_${threshold}`] = {
            id: `levels_completed_${threshold}`,
            name: threshold === 1 ? 'Primo Successo' : `Esperto ${threshold}`,
            description: threshold === 1 ? 'Completa il tuo primo livello' : `Completa ${threshold.toLocaleString()} livelli in totale`,
            icon: threshold < 100 ? '✅' : (threshold < 1000 ? '🎖️' : '🏆'),
            category: 'completamenti',
            points: 10 + Math.floor(i * 1.5),
            requirement: { stat: 'livelliCompletati', value: threshold },
            reward
        };
    });

    // === POINT MILESTONE ACHIEVEMENTS ===
    // Every 100 points = special milestone achievement
    const pointMilestones = [50, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
    pointMilestones.forEach((threshold, i) => {
        let reward;
        // Point milestones give dragocoin
        reward = { type: 'dragocoin', value: 3 + i * 2, label: `+${3 + i * 2} 🐲` };

        achievements[`points_${threshold}`] = {
            id: `points_${threshold}`,
            name: `${threshold} Punti!`,
            description: `Accumula ${threshold.toLocaleString()} punti obiettivo`,
            icon: '🏅',
            category: 'milestone',
            points: 0, // Don't count itself
            requirement: { stat: 'puntiObiettivo', value: threshold },
            reward
        };
    });

    return achievements;
}

// Generate all achievements
const ACHIEVEMENTS = generateAchievements();

// Count achievements by category for debugging
const achievementCount = Object.keys(ACHIEVEMENTS).length;
console.log(`✅ Generati ${achievementCount} obiettivi!`);

export default class AchievementManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.toastQueue = [];
        this.isShowingToast = false;
    }

    // Get all achievements with unlock status
    getAllAchievements() {
        return Object.values(ACHIEVEMENTS).map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id)
        }));
    }

    // Get achievements by category
    getByCategory(category) {
        return this.getAllAchievements().filter(a => a.category === category);
    }

    // Get all categories
    getCategories() {
        const categories = [...new Set(Object.values(ACHIEVEMENTS).map(a => a.category))];
        return categories;
    }

    // Check if achievement is unlocked
    isUnlocked(achievementId) {
        return this.gameState.unlockedAchievements?.includes(achievementId) || false;
    }

    // Unlock achievement
    unlock(achievementId) {
        if (this.isUnlocked(achievementId)) return false;

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;

        this.gameState.unlockAchievement(achievementId);

        // Apply reward
        if (achievement.reward) {
            this.applyReward(achievement.reward);
        }

        this.toastQueue.push(achievement);
        if (!this.isShowingToast) {
            this.processToastQueue();
        }

        // Check point milestones after unlocking
        this.checkPointMilestones();

        return true;
    }

    // Apply reward to gameState
    applyReward(reward) {
        if (!reward || !this.gameState) return;

        switch (reward.type) {
            case 'xp':
                this.gameState.playerXP = (this.gameState.playerXP || 0) + reward.value;
                // Check level up
                const newLevel = Math.floor(this.gameState.playerXP / 500) + 1;
                if (newLevel > this.gameState.playerLevel) {
                    this.gameState.playerLevel = newLevel;
                }
                break;
            case 'coins':
                this.gameState.coins = (this.gameState.coins || 0) + reward.value;
                break;
            case 'dragocoin':
                this.gameState.dragocoin = (this.gameState.dragocoin || 0) + reward.value;
                break;
        }
        this.gameState.save();
    }

    // Check point milestone achievements
    checkPointMilestones() {
        const totalPoints = this.getTotalPoints();
        Object.values(ACHIEVEMENTS).forEach(ach => {
            if (ach.category === 'milestone' && ach.requirement?.stat === 'puntiObiettivo') {
                if (totalPoints >= ach.requirement.value) {
                    this.unlock(ach.id);
                }
            }
        });
    }

    // Show toast notification
    showToast(achievement) {
        const toast = document.getElementById('achievement-toast');
        if (!toast) return;

        toast.innerHTML = `
            <span style="font-size: 32px;">${achievement.icon}</span>
            <div style="display: flex; flex-direction: column;">
                <span style="color: #333; font-size: 10px; font-family: 'Press Start 2P';">OBIETTIVO!</span>
                <span style="color: #000; font-size: 8px;">${achievement.name}</span>
                <span style="color: #228B22; font-size: 7px;">${achievement.reward?.label || ''}</span>
            </div>
        `;
    }

    processToastQueue() {
        if (this.toastQueue.length === 0) {
            this.isShowingToast = false;
            return;
        }

        this.isShowingToast = true;
        const achievement = this.toastQueue.shift();

        const toast = document.getElementById('achievement-toast');
        if (!toast) {
            this.isShowingToast = false;
            return;
        }

        this.showToast(achievement);

        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';

            setTimeout(() => {
                this.processToastQueue();
            }, 500);
        }, 2500);
    }

    // Check all stat-based achievements
    checkStatAchievements() {
        const stats = this.gameState.stats || {};

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (achievement.requirement && achievement.requirement.stat) {
                let statValue;
                // Check both stats object and gameState directly
                if (stats[achievement.requirement.stat] !== undefined) {
                    statValue = stats[achievement.requirement.stat];
                } else if (this.gameState[achievement.requirement.stat] !== undefined) {
                    statValue = this.gameState[achievement.requirement.stat];
                } else {
                    statValue = 0;
                }

                if (statValue >= achievement.requirement.value) {
                    this.unlock(achievement.id);
                }
            }
        });
    }

    // Check level completion achievements
    checkLevelComplete(levelIndex, levelTime, wasHit, deathsThisRun) {
        // Level-specific achievement
        const levelNum = levelIndex + 1;
        const levelAchievement = `level_${levelNum}`;
        if (ACHIEVEMENTS[levelAchievement]) {
            this.unlock(levelAchievement);
        }

        // Also check stat achievements
        this.checkStatAchievements();
    }

    // Get total points
    getTotalPoints() {
        let total = 0;
        this.gameState.unlockedAchievements?.forEach(id => {
            if (ACHIEVEMENTS[id]) {
                total += ACHIEVEMENTS[id].points || 0;
            }
        });
        return total;
    }

    // Get progress percentage
    getProgress() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = this.gameState.unlockedAchievements?.length || 0;
        return Math.floor((unlocked / total) * 100);
    }

    // Get total bonuses from unlocked achievements (for legacy support)
    getUnlockedRewards() {
        const rewards = {
            speed: 0,
            jump: 0,
            bubbleRange: 0,
            shootSpeed: 0,
            coinBonus: 0,
            extraLife: 0
        };
        return rewards;
    }
}

export { ACHIEVEMENTS };
