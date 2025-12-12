import InputHandler from './Input.js';
import Player from './Player.js';
import Level from './Level.js';
import Enemy from './Enemy.js';
import Fruit from './Fruit.js';
import PowerUp from './PowerUp.js';
import Coin from './Coin.js';
import ParticleSystem from './ParticleSystem.js';
import TutorialManager from './TutorialManager.js';
import GameConfig from './GameConfig.js';
import Pathfinding from './Pathfinding.js';

export default class Game {
    constructor(width, height, audioManager) {
        this.width = width;
        this.height = height;
        this.audioManager = audioManager;
        this.input = new InputHandler();
        this.level = new Level(this); // Initialize Level
        this.player = new Player(this);
        this.bubbles = [];
        this.enemies = [];
        this.fruits = [];
        this.powerUps = [];
        this.coins = []; // Collectible coins
        this.keys = [];
        this.score = 0;
        this.sessionCoins = 0;
        this.sessionXP = 0; // XP collected in this session from fruit
        this.gameOver = false;

        this.levelIndex = 0;
        this.transitionTimer = 0;
        this.transitionDuration = 900; // 15 seconds * 60 fps
        this.levelComplete = false;

        // Coin spawn tracking
        this.coinSpawnCooldown = 0;
        this.coinsSpawnedInLevel = 0;

        // Particle system for visual effects
        this.particles = new ParticleSystem();

        // Tutorial system
        this.tutorial = new TutorialManager(this);

        // AI Pathfinding system for enemies
        this.pathfinding = new Pathfinding(this);

        this.startLevel();
    }

    setGameState(gameState) {
        this.gameState = gameState;
    }

    resetGame(startingLevel = 0) {
        this.score = 0;
        this.levelIndex = startingLevel; // Use parameter instead of always 0
        this.gameOver = false;
        this.victory = false;
        this.paused = false;
        this.showingContinue = false;
        this.sessionCoins = 0;

        // Achievement tracking for this run
        this.deathsThisRun = 0;
        this.wasHitThisLevel = false;
        this.levelStartTime = Date.now();

        // Increment games played stat
        if (this.gameState) {
            this.gameState.incrementStat('gamesPlayed');
        }

        // Reset lives to 3 BEFORE startLevel (which calls applyPowerups)
        this.player.lives = 3;

        // Reset one-time-per-game flags BEFORE startLevel
        this.player.shieldAppliedThisGame = false;
        this.player.immortalStartApplied = false;

        if (this.player.achievementExtraLives > 0) {
            this.player.lives += this.player.achievementExtraLives;
            console.log(`+${this.player.achievementExtraLives} vite extra da achievement!`);
        }

        // Now start the level (which calls applyPowerups with correct flags)
        this.startLevel();
    }

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
    }

    restartLevel() {
        this.paused = false;
        this.startLevel();
    }

    // Show continue screen when player loses all lives
    showContinueScreen() {
        this.paused = true;
        this.showingContinue = true;

        // Update continue screen with current dragocoin count and ads remaining
        const continueScreen = document.getElementById('continue-screen');
        const dragocoinCount = document.getElementById('continue-dragocoin-count');
        const adsRemaining = document.getElementById('ads-remaining');
        const adBtn = document.getElementById('continue-ad-btn');
        const dragocoinBtn = document.getElementById('continue-dragocoin-btn');

        if (dragocoinCount) {
            dragocoinCount.innerText = this.gameState.dragocoin || 0;
        }

        // Check daily ads limit (stored in gameState)
        const today = new Date().toDateString();
        if (this.gameState.lastAdDate !== today) {
            this.gameState.lastAdDate = today;
            this.gameState.dailyAdsUsed = 0;
        }
        const adsLeft = 5 - (this.gameState.dailyAdsUsed || 0);

        if (adsRemaining) {
            adsRemaining.innerText = adsLeft;
        }

        // Disable ad button if no ads left
        if (adBtn && adsLeft <= 0) {
            adBtn.disabled = true;
            adBtn.style.opacity = '0.5';
            adBtn.style.cursor = 'not-allowed';
        } else if (adBtn) {
            adBtn.disabled = false;
            adBtn.style.opacity = '1';
            adBtn.style.cursor = 'pointer';
        }

        // Disable dragocoin button if not enough
        if (dragocoinBtn && (this.gameState.dragocoin || 0) < 5) {
            dragocoinBtn.disabled = true;
            dragocoinBtn.style.opacity = '0.5';
            dragocoinBtn.style.cursor = 'not-allowed';
        } else if (dragocoinBtn) {
            dragocoinBtn.disabled = false;
            dragocoinBtn.style.opacity = '1';
            dragocoinBtn.style.cursor = 'pointer';
        }

        if (continueScreen) {
            continueScreen.style.display = 'flex';
        }

        this.audioManager.playSound('gameover');
    }

    startLevel() {
        this.level.load(this.levelIndex);
        this.enemies = [];
        this.bubbles = [];
        this.fruits = [];
        this.powerUps = [];
        this.coins = [];
        if (this.levelIndex === 0) this.sessionCoins = 0;

        // Use new reset method for player (handles position & invulnerability)
        this.player.reset();

        // Apply purchased powerups
        if (this.gameState) {
            this.player.applyPowerups(this.gameState);
        }

        this.levelComplete = false;
        this.transitionTimer = 0;
        this.powerUpsSpawnedCount = 0;
        this.powerUpCooldown = 0;
        this.powerUpsSpawnedTypes = []; // Track which types spawned this level
        this.coinSpawnCooldown = 0;
        this.coinsSpawnedInLevel = 0;

        // Reset level-specific achievement tracking
        this.wasHitThisLevel = false;
        this.levelStartTime = Date.now();

        // Spawn enemies based on level - use Hook difficulty curve from GameConfig
        const enemyCount = GameConfig.levels.getEnemyCount(this.levelIndex);
        const speedMultiplier = GameConfig.levels.getSpeedMultiplier(this.levelIndex);
        const chaseChance = GameConfig.levels.getChaseChance(this.levelIndex);
        console.log(`📊 Level ${this.levelIndex + 1}: ${enemyCount} enemies at ${speedMultiplier}x speed, ${Math.round(chaseChance * 100)}% chase chance`);

        for (let i = 0; i < enemyCount; i++) {
            const spawnPos = this.level.getRandomSpawnPosition();
            this.enemies.push(new Enemy(this, spawnPos.x, spawnPos.y, speedMultiplier, this.levelIndex));
        }

        // Update pathfinding grid with new level map
        this.pathfinding.updateGrid(this.level.map);
    }

    update(deltaTime) {
        if (this.paused) return;
        if (this.gameOver) return;

        // Calculate timeScale (normalize to 60fps)
        // If 60fps, deltaTime ~16.67ms -> timeScale = 1
        // If 120fps, deltaTime ~8.33ms -> timeScale = 0.5
        const timeScale = deltaTime / 16.67;

        // Process async pathfinding calculations
        this.pathfinding.update();

        // Check Level Complete
        if (this.enemies.length === 0 && !this.levelComplete) {
            this.levelComplete = true;
            console.log("Level Complete! Waiting 15 seconds...");
        }

        if (this.levelComplete) {
            // If all fruits are collected, speed up transition
            // Timer is based on frames in original code (transitionTimer++), so it will race at 120fps.
            // Let's change timer to be time-based or scale increment.
            // Current duration: 900 frames (15s @ 60fps).

            // If we keep frames, it's faster on 120Hz. Let's add timeScale.
            if (this.fruits.length === 0) {
                this.transitionTimer = this.transitionDuration + 1;
            } else {
                this.transitionTimer += timeScale;
            }

            if (this.transitionTimer > this.transitionDuration) {
                // Unlock next level in persistence
                if (this.gameState) {
                    this.gameState.unlockNextLevel(this.levelIndex);
                }

                this.levelIndex++;
                if (this.player.lives <= 0) {
                    this.showContinueScreen();
                }

                // Check achievements for this level completion
                const levelTime = (Date.now() - this.levelStartTime) / 1000;
                if (this.gameState) {
                    this.gameState.incrementStat('levelsCompleted');
                    // NOTE: totalCoinsEarned is already incremented when coins are collected (line ~462)
                    // No need to increment again here to avoid double-counting
                }
                if (window.achievementManager) {
                    window.achievementManager.checkLevelComplete(
                        this.levelIndex,
                        levelTime,
                        this.wasHitThisLevel,
                        this.deathsThisRun
                    );
                }

                if (this.levelIndex >= 100) {
                    this.victory = true;
                    this.gameOver = true;
                } else {
                    this.startLevel();
                }
                return; // Skip update for one frame
            }
        }

        this.player.update(this.input.keys, timeScale); // Pass timeScale instead of deltaTime

        // Move X
        this.player.x += this.player.speedX * timeScale;
        this.level.checkCollisionX(this.player);

        // Move Y
        this.player.y += this.player.speedY * timeScale;
        this.level.checkCollisionY(this.player);

        this.bubbles.forEach(bubble => {
            bubble.update(timeScale); // Pass timeScale
            bubble.x += bubble.speedX * timeScale;
            this.level.checkCollisionX(bubble);
            bubble.y += bubble.speedY * timeScale;
            this.level.checkCollisionY(bubble);
        });
        this.bubbles = this.bubbles.filter(bubble => !bubble.markedForDeletion);

        this.enemies.forEach(enemy => {
            enemy.update(timeScale); // Pass timeScale
            if (!enemy.trapped) {
                enemy.x += enemy.speedX * timeScale;
                this.level.checkCollisionX(enemy);
                enemy.y += enemy.speedY * timeScale;
                this.level.checkCollisionY(enemy);
            } else {
                // Trapped enemies just float with bubble, position updated in Enemy.js via bubbleRef
                // But Enemy.js update logic might need adjustment if it relied on super.update
                // Actually Enemy.js sets x/y directly when trapped, so it's fine.
            }

            // Check collision with bubbles
            this.bubbles.forEach(bubble => {
                if (!enemy.trapped && this.checkCollision(bubble, enemy)) {
                    enemy.trap(bubble);
                    bubble.state = 'trapped'; // Visual change?

                    // Tutorial: enemy trapped
                    this.tutorial.checkAction('trap');
                }
            });

            // NOTE: Enemy collision with player is handled in the updatePowerups section
            // which properly checks for shield, lives, and invulnerability
        });

        // Fruits Update
        this.fruits.forEach(fruit => {
            fruit.update(timeScale); // Pass timeScale

            // Move X (scatter)
            fruit.x += fruit.speedX * timeScale;
            this.level.checkCollisionX(fruit);

            // Move Y (gravity)
            fruit.y += fruit.speedY * timeScale;
            this.level.checkCollisionY(fruit);

            // Check collision with player
            if (fruit.collectible && this.checkCollision(this.player, fruit)) {
                fruit.markedForDeletion = true;
                this.score += fruit.points || 100;

                // Particle effect for collecting fruit
                this.particles.collectItem(fruit.x + fruit.width / 2, fruit.y + fruit.height / 2, '#ffd700');

                if (this.gameState) {
                    // Fruit gives XP only, NOT coins
                    this.gameState.incrementStat('totalFruitCollected');

                    // Give XP
                    const xpGained = fruit.xpValue || 25;
                    this.gameState.addXP(xpGained);
                    this.sessionXP = (this.sessionXP || 0) + xpGained;
                }

                // Check for level up
                const leveledUp = this.player.addXP(fruit.xpValue || 25);
                if (leveledUp && this.gameState) {
                    this.player.applyPowerups(this.gameState);
                    this.audioManager.playSound('powerup');
                } else {
                    this.audioManager.playSound('coin');
                }

                this.updateUI();
            }
        });
        this.fruits = this.fruits.filter(fruit => !fruit.markedForDeletion);

        // Check if player pops a trapped enemy
        this.bubbles.forEach(bubble => {
            // We need to find if this bubble has an enemy
            // Simplified: The enemy holds the ref to the bubble.
            // So we iterate enemies to see if they are trapped and touching player
        });

        this.enemies.forEach(enemy => {
            if (enemy.trapped && this.checkCollision(this.player, enemy)) {
                // Particle effects for defeating enemy
                this.particles.enemyDefeated(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                this.particles.bubblePop(enemy.bubbleRef.x + 16, enemy.bubbleRef.y + 16);

                // Tutorial: enemy popped
                this.tutorial.checkAction('pop');

                // Pop enemy
                enemy.markedForDeletion = true;
                enemy.bubbleRef.markedForDeletion = true;
                this.score += 1000;

                // Spawn Fruit from top at random X, avoiding side walls (40px)
                // Width available: 800 - 40(left) - 40(right) - 32(fruit) = 688
                const randomX = 40 + Math.random() * (this.width - 80 - 32);
                this.fruits.push(new Fruit(this, randomX, 60)); // Start below the ceiling

                // Track enemy defeated for stats
                if (this.gameState) {
                    this.gameState.incrementStat('enemiesTrapped');
                }

                this.updateUI();
            }
        });

        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

        // PowerUps Update
        // Cooldown decreases over time
        if (this.powerUpCooldown > 0) {
            this.powerUpCooldown -= timeScale;
        }

        // Spawn powerup if: no cooldown, random chance, max 1 on screen
        // Spawn rate decreases as more powerups have spawned
        const baseSpawnRate = 0.01;
        const spawnRate = baseSpawnRate / (1 + this.powerUpsSpawnedCount * 0.3);

        if (this.powerUpCooldown <= 0 && Math.random() < spawnRate * timeScale && this.powerUps.length < 1) {
            // Only spawn powerups that player has PURCHASED in shop
            const allPowerupTypes = ['long_range', 'speed_boost', 'rapid_fire', 'shield', 'double_jump'];
            const purchasedTypes = allPowerupTypes.filter(type =>
                this.gameState && this.gameState.hasItem(type)
            );

            // Filter out types that have already spawned this level
            const availableTypes = purchasedTypes.filter(type =>
                !this.powerUpsSpawnedTypes.includes(type)
            );

            // Only spawn if there are available types
            if (availableTypes.length > 0) {
                // Spawn powerup at random X at top
                const randomX = 40 + Math.random() * (this.width - 80 - 32);

                // Random powerup type from AVAILABLE items only
                const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

                this.powerUps.push(new PowerUp(this, randomX, 60, randomType));
                this.powerUpsSpawnedCount++;
                this.powerUpsSpawnedTypes.push(randomType); // Track this type as spawned

                // Cooldown increases with each spawn (3 sec base + 2 sec per spawn)
                this.powerUpCooldown = 180 + (this.powerUpsSpawnedCount * 120);
                console.log("PowerUp spawned:", randomType, "- Next cooldown:", this.powerUpCooldown / 60, "sec");
            }
        }

        this.powerUps.forEach(powerUp => {
            powerUp.update(timeScale); // Pass timeScale
            // Move Y (gravity)
            powerUp.y += powerUp.speedY * timeScale;
            this.level.checkCollisionY(powerUp);

            // Check collision with player
            if (powerUp.collectible && this.checkCollision(this.player, powerUp)) {
                powerUp.markedForDeletion = true;
                this.audioManager.playSound('coin');

                // Apply effect based on type
                switch (powerUp.type) {
                    case 'long_range':
                        this.player.bubbleShootDuration = 150;
                        console.log("PowerUp: Lunga Gittata!");
                        break;
                    case 'speed_boost':
                        this.player.speed = this.player.baseSpeed * 2;
                        console.log("PowerUp: Velocità!");
                        break;
                    case 'rapid_fire':
                        this.player.shootInterval = 5;
                        console.log("PowerUp: Fuoco Rapido!");
                        break;
                    case 'shield':
                        this.player.shieldActive = true;
                        console.log("PowerUp: Scudo!");
                        break;
                    case 'double_jump':
                        this.player.hasDoubleJump = true;
                        console.log("PowerUp: Doppio Salto!");
                        break;
                }

                this.score += 200;
                this.updateUI();

                // Track stat for achievements
                if (this.gameState) {
                    this.gameState.incrementStat('powerupsCollected');
                }
            }
        });
        this.powerUps = this.powerUps.filter(p => !p.markedForDeletion);

        // Coin spawn logic (random spawn every few seconds)
        if (this.coinSpawnCooldown > 0) {
            this.coinSpawnCooldown -= timeScale;
        } else if (this.coins.length < 3 && !this.levelComplete) {
            // Spawn coin at random position
            const spawnPos = this.level.getRandomSpawnPosition();
            this.coins.push(new Coin(this, spawnPos.x, spawnPos.y - 40));
            this.coinsSpawnedInLevel++;
            // Cooldown increases with each spawn
            this.coinSpawnCooldown = 180 + this.coinsSpawnedInLevel * 60; // 3-5+ seconds
        }

        // Coin update and collision
        this.coins.forEach(coin => {
            coin.update(timeScale);
            coin.x += coin.speedX * timeScale;
            this.level.checkCollisionX(coin);
            coin.y += coin.speedY * timeScale;
            this.level.checkCollisionY(coin);
        });

        this.coins.forEach((coin, cIndex) => {
            if (this.checkCollision(this.player, coin)) {
                // Particle effect for coin
                this.particles.collectItem(coin.x + coin.width / 2, coin.y + coin.height / 2, '#ffd700');

                this.coins.splice(cIndex, 1);

                // Calculate coins with bonus from achievements
                let coinValue = coin.value;
                if (this.player.coinBonusPercent > 0) {
                    coinValue = Math.floor(coinValue * (1 + this.player.coinBonusPercent / 100));
                }
                this.sessionCoins += coinValue;

                // Add coins to gameState (persistent)
                if (this.gameState) {
                    this.gameState.addCoins(coinValue);
                    this.gameState.incrementStat('totalCoinsEarned', coinValue);
                }

                this.audioManager.playSound('coin');
                this.updateUI(); // Update coin counter on screen
            }
        });

        // Check collision with trapped enemies (using for loop to allow break)
        for (let eIndex = this.enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = this.enemies[eIndex];

            if (enemy.trapped && this.checkCollision(this.player, enemy)) {
                // Pop enemy
                // Spawn fruit
                this.fruits.push(new Fruit(this, enemy.x, enemy.y));

                this.enemies.splice(eIndex, 1);

                this.audioManager.playSound('pop');

                // Track enemy trapped for achievements
                if (this.gameState) {
                    this.gameState.incrementStat('enemiesTrapped');
                }
            } else if (!enemy.trapped && !this.player.isInvulnerable() && this.checkCollision(this.player, enemy)) {
                // Mark that player was hit this level
                this.wasHitThisLevel = true;

                // Check if shield protects the player
                if (this.player.shieldActive) {
                    this.player.shieldActive = false;
                    this.player.invulnerableTimer = 180; // Give invulnerability
                    this.audioManager.playSound('pop');
                    console.log("Scudo consumato!");
                    break; // Exit loop after shield consumed
                } else {
                    // Prevent going below 0
                    if (this.player.lives <= 0) {
                        this.showContinueScreen();
                        return;
                    }

                    this.player.lives--;
                    console.log("💀 Vita persa! Vite rimanenti:", this.player.lives);
                    this.deathsThisRun++;
                    if (this.gameState) {
                        this.gameState.incrementStat('totalDeaths');
                    }

                    // Check if player is out of lives - show continue screen
                    if (this.player.lives <= 0) {
                        this.showContinueScreen();
                        return; // Exit checkCollisions function completely
                    } else {
                        this.player.reset();
                        this.player.invulnerableTimer = 180; // 3 seconds invulnerability after death
                        if (this.gameState) {
                            this.player.applyPowerups(this.gameState);
                        }
                        this.sessionCoins = Math.floor(this.sessionCoins * 0.8);
                        break; // Exit loop to avoid multiple collisions in same frame
                    }
                }
            }
        }

        // Update UI every frame to reflect current game state
        this.updateUI();
    }

    draw(context) {
        // Update particles each frame
        this.particles.update();

        // Update tutorial
        if (this.tutorial.active) {
            this.tutorial.update(this.input.keys);
        }

        this.level.draw(context); // Draw level first
        this.fruits.forEach(fruit => fruit.draw(context));
        this.coins.forEach(coin => coin.draw(context));
        this.enemies.forEach(enemy => enemy.draw(context));
        this.bubbles.forEach(bubble => bubble.draw(context));
        this.powerUps.forEach(powerUp => powerUp.draw(context));
        this.player.draw(context);

        // Draw particles on top
        this.particles.draw(context);

        // Draw tutorial indicators
        this.tutorial.draw(context);

        if (this.gameOver) {
            // Game Over handled by main.js UI
        }

        if (this.levelComplete) {
            context.fillStyle = 'white';
            context.font = '20px "Press Start 2P"';
            context.textAlign = 'center';
            const secondsLeft = Math.ceil((this.transitionDuration - this.transitionTimer) / 60);
            context.fillText('LIVELLO COMPLETATO!', this.width / 2, this.height / 2 - 20);
            context.fillText('PROSSIMO LIVELLO: ' + secondsLeft, this.width / 2, this.height / 2 + 20);
        }
    }

    updateUI() {
        const livesEl = document.getElementById('lives');
        const scoreEl = document.getElementById('score');
        const coinsEl = document.getElementById('high-score');
        const shieldEl = document.getElementById('shield-status');
        const powerupsEl = document.getElementById('active-powerups');

        if (livesEl) livesEl.innerText = '❤️ VITE: ' + this.player.lives;
        if (scoreEl) scoreEl.innerText = '⭐ XP: ' + this.sessionXP;
        if (coinsEl) coinsEl.innerText = '🪙 MONETE: ' + this.sessionCoins;

        // Show shield status
        if (shieldEl) {
            shieldEl.style.display = this.player.shieldActive ? 'block' : 'none';
        }

        // Show active powerups
        if (powerupsEl) {
            let powerups = [];

            // Check active powerups based on player state
            if (this.player.speed > this.player.baseSpeed * 1.2) {
                powerups.push('⚡'); // Speed boost
            }
            if (this.player.hasDoubleJump) {
                powerups.push('🦘'); // Double jump
            }
            if (this.player.shootInterval < this.player.baseShootInterval * 0.7) {
                powerups.push('🔥'); // Rapid fire
            }
            if (this.player.bubbleShootDuration > 30) {
                powerups.push('🎯'); // Long range
            }

            powerupsEl.innerText = powerups.join(' ');
        }
    }

    addBubble(bubble) {
        this.bubbles.push(bubble);
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
    }
}
