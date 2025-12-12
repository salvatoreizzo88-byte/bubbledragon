import Entity from './Entity.js';
import Bubble from './Bubble.js';
import { SimpleAnimation } from './SpriteAnimation.js';
import GameConfig from './GameConfig.js';

export default class Player extends Entity {
    constructor(game) {
        super(game, 100, 100, 32, 32); // Start pos (100,100), size 32x32

        // Base stats (can be modified by powerups)
        this.baseSpeed = 3;
        this.baseShootInterval = 20;

        this.speed = this.baseSpeed;
        this.jumpForce = 10; // Reduced to compensate for lower gravity
        this.gravity = 0.35; // Lower gravity = more floaty, easier platform landing
        this.grounded = false;
        this.color = '#00ff00'; // Bub is green-ish
        this.facing = 1; // 1 = right, -1 = left
        this.shootTimer = 0;
        this.shootInterval = this.baseShootInterval;
        this.bubbleShootDuration = 20; // Default range
        this.invulnerableTimer = 0;
        this.lives = 3; // Starting lives

        // Player Level System
        this.xp = 0;
        this.playerLevel = 1;
        // xpPerLevel is now dynamic via GameConfig.progression.getXPForLevel()
        this.bonusPerLevel = 0.002; // 0.2% stat increase per level

        // Powerup flags
        this.hasDoubleJump = false;
        this.canDoubleJump = false;
        this.hasShield = false;
        this.shieldActive = false;
        this.jumpKeyHeld = false;

        // Animation system
        this.animation = new SimpleAnimation();
        this.animState = 'idle'; // idle, walk, jump, fall

        // Load new 3D sprite (already has transparent background)
        this.image = new Image();
        this.image.src = 'assets/sprites/player_3d.png';

        // Neon glow color
        this.glowColor = '#00ff88';
    }

    // Remove magenta background from image (chroma key)
    removeBlackBackground(img) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Remove green pixels with wider tolerance for chroma key
            // Catches lime green, bright green, and similar shades
            if (r < 150 && g > 150 && b < 150 && g > r && g > b) {
                data[i + 3] = 0; // Set alpha to 0
            }
            // Also remove near-black pixels
            if (r < 40 && g < 40 && b < 40) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const newImg = new Image();
        newImg.src = c.toDataURL();
        return newImg;
    }

    // Add XP and check for level up (uses dynamic XP curve from GameConfig)
    addXP(amount) {
        this.xp += amount;
        const prog = GameConfig.progression;
        const newLevel = prog.getLevelFromTotalXP(this.xp);
        if (newLevel > this.playerLevel) {
            this.playerLevel = newLevel;
            console.log(`🎉 LEVEL UP! Livello ${this.playerLevel}`);
            return true; // Level up occurred
        }
        return false;
    }

    // Get level bonus multiplier (1.0 + 2% per level above 1)
    getLevelBonus() {
        return 1 + (this.playerLevel - 1) * this.bonusPerLevel;
    }

    reset() {
        this.x = 100;
        this.y = 500;
        this.speedX = 0;
        this.speedY = 0;
        this.facing = 1;
        this.bubbleShootDuration = 20;
        // invulnerableTimer NOT set here - only given explicitly after death
        this.grounded = false;
        this.canDoubleJump = false;
    }

    // Apply powerups from GameState and achievement rewards
    applyPowerups(gameState) {
        if (!gameState) return;

        // Get achievement rewards if available
        let rewards = { speed: 0, jump: 0, bubbleRange: 0, shootSpeed: 0, coinBonus: 0, extraLife: 0 };
        if (window.achievementManager) {
            rewards = window.achievementManager.getUnlockedRewards();
        }

        // Get dragon level bonuses from GameState (based on XP)
        const dragonBonuses = gameState.getLevelBonuses();
        // dragonBonuses contains: speedBonus, bubbleRangeBonus, jumpBonus, bubbleDurationBonus

        // === SPEED CALCULATION ===
        let speedMultiplier = 1 + (rewards.speed / 100);
        if (gameState.hasItem('speed_boost')) {
            speedMultiplier += 0.5; // +50% from shop (coins)
        }
        // PREMIUM: mega_speed adds +100% velocity
        if (gameState.hasItem('mega_speed')) {
            speedMultiplier += 1.0; // +100% from premium shop
        }
        this.speed = this.baseSpeed * speedMultiplier * dragonBonuses.speedBonus;

        // === JUMP CALCULATION ===
        let jumpMultiplier = 1 + (rewards.jump / 100);
        // PREMIUM: super_jump adds +100% jump height
        if (gameState.hasItem('super_jump')) {
            jumpMultiplier += 1.0; // +100% from premium shop
        }
        this.jumpForce = 10 * jumpMultiplier * dragonBonuses.jumpBonus; // Base jump is 10

        // === SHOOT SPEED CALCULATION ===
        let shootMultiplier = 1 + (rewards.shootSpeed / 100);
        if (gameState.hasItem('rapid_fire')) {
            shootMultiplier += 0.5; // +50% faster
        }
        this.shootInterval = this.baseShootInterval / shootMultiplier;

        // === BUBBLE RANGE CALCULATION ===
        let bubbleMultiplier = 1 + (rewards.bubbleRange / 100);
        if (gameState.hasItem('long_range')) {
            bubbleMultiplier += 0.5; // +50% from shop
        }
        this.bubbleShootDuration = 20 * bubbleMultiplier * dragonBonuses.bubbleRangeBonus;

        // Bubble duration bonus (affects how long bubbles last before popping)
        this.bubbleDurationBonus = dragonBonuses.bubbleDurationBonus;

        // PREMIUM: bubble_master makes bubbles 2x bigger
        this.bubbleSizeMultiplier = gameState.hasItem('bubble_master') ? 2.0 : 1.0;

        // === JUMP SYSTEM (Double/Triple Jump) ===
        this.hasDoubleJump = gameState.hasItem('double_jump');
        // PREMIUM: triple_jump allows 3 jumps in air
        this.hasTripleJump = gameState.hasItem('triple_jump');
        // Set max jumps based on powerups
        if (this.hasTripleJump) {
            this.maxJumps = 3;
        } else if (this.hasDoubleJump) {
            this.maxJumps = 2;
        } else {
            this.maxJumps = 1;
        }
        this.jumpsRemaining = 0; // Reset, will be set when grounded

        // === SHIELD (shop item) - Only activate ONCE per game ===
        if (gameState.hasItem('shield') && !this.shieldAppliedThisGame) {
            this.shieldAppliedThisGame = true;
            this.shieldActive = true;
            console.log("🛡️ Scudo shop attivato!");
        }
        console.log("🛡️ Shield status - hasItem:", gameState.hasItem('shield'), "shieldApplied:", this.shieldAppliedThisGame, "shieldActive:", this.shieldActive);

        // === PREMIUM: coin_magnet - attracts nearby coins ===
        this.hasCoinMagnet = gameState.hasItem('coin_magnet');
        this.coinMagnetRadius = 150; // Attract coins within 150px

        // === PREMIUM: xp_boost - +50% XP gains ===
        this.xpBoostMultiplier = gameState.hasItem('xp_boost') ? 1.5 : 1.0;

        // === PREMIUM: immortal_start - 10 seconds invincibility at start ===
        if (gameState.hasItem('immortal_start') && !this.immortalStartApplied) {
            this.invulnerableTimer = 600; // 10 seconds at 60fps
            this.immortalStartApplied = true;
        }

        // Store coin bonus for use when collecting coins
        this.coinBonusPercent = rewards.coinBonus;

        // Extra lives from achievements (applied once at game start)
        this.achievementExtraLives = rewards.extraLife;
    }

    isInvulnerable() {
        return this.invulnerableTimer > 0;
    }

    removeBlackBackground(img) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
            // Check for near-black (tolerance 30)
            if (d[i] < 30 && d[i + 1] < 30 && d[i + 2] < 30) {
                d[i + 3] = 0; // Alpha 0
            }
        }
        ctx.putImageData(id, 0, 0);
        const newImg = new Image();
        newImg.src = c.toDataURL();
        return newImg;
    }

    update(input, deltaTime) {
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= deltaTime;

        // Horizontal Movement
        if (input['ArrowRight']) {
            this.speedX = this.speed;
            this.facing = 1;
        } else if (input['ArrowLeft']) {
            this.speedX = -this.speed;
            this.facing = -1;
        } else {
            this.speedX = 0;
        }

        // Shooting
        if (this.shootTimer > 0) this.shootTimer -= deltaTime;
        if ((input['z'] || input['x'] || input[' ']) && this.shootTimer <= 0) { // Added spacebar support explicitly
            const bubble = new Bubble(this.game, this.x, this.y, this.facing);
            bubble.shootDuration = this.bubbleShootDuration || 20;
            // Apply bubble duration bonus from dragon level
            if (this.bubbleDurationBonus) {
                bubble.maxLifeTime = 300 * this.bubbleDurationBonus;
            }
            // PREMIUM: bubble_master - make bubbles 2x bigger
            if (this.bubbleSizeMultiplier && this.bubbleSizeMultiplier > 1) {
                bubble.width *= this.bubbleSizeMultiplier;
                bubble.height *= this.bubbleSizeMultiplier;
            }
            this.game.addBubble(bubble);
            this.game.audioManager.playSound('shoot');
            this.shootTimer = this.shootInterval;
        }

        // Jumping - supports normal, double, and triple jump based on maxJumps
        if (input['ArrowUp'] && !this.jumpKeyHeld) {
            if (this.grounded) {
                // Reset jumps when on ground
                this.jumpsRemaining = (this.maxJumps || 1) - 1; // First jump is free
                this.speedY = -this.jumpForce;
                this.grounded = false;
                this.game.audioManager.playSound('jump');
            } else if (this.jumpsRemaining > 0) {
                // Air jump (double/triple)
                this.jumpsRemaining--;
                this.speedY = -this.jumpForce * 0.9; // Slightly weaker
                this.game.audioManager.playSound('jump');
            }
            this.jumpKeyHeld = true;
        }
        if (!input['ArrowUp']) {
            this.jumpKeyHeld = false;
        }

        // Apply Physics (Gravity)
        this.speedY += this.gravity * deltaTime;

        super.update(deltaTime);
    }

    draw(context) {
        // Flashing effect if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            // Skip drawing this frame for blink effect
            return;
        }

        // Determine animation state and update
        const deltaTime = 1 / 60;
        if (!this.grounded) {
            // In air: jump or fall
            this.animState = this.speedY < 0 ? 'jump' : 'fall';
            this.animation.updateJump(this.speedY < 0);
        } else if (Math.abs(this.speedX) > 0.5) {
            // Walking
            this.animState = 'walk';
            this.animation.updateWalk(deltaTime);
        } else {
            // Idle
            this.animState = 'idle';
            this.animation.updateIdle(deltaTime);
        }

        const scale = this.animation.getScale();
        const bobOffset = this.animState === 'idle' ? this.animation.getBobOffset() : 0;

        if (this.image && this.image.complete) {
            context.save();

            // Neon glow effect
            context.shadowColor = this.glowColor;
            context.shadowBlur = 15;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;

            // Draw visually larger than the hitbox
            const drawWidth = 64;
            const drawHeight = 64;

            // Position at feet (bottom of hitbox)
            const centerX = this.x + this.width / 2;
            const bottomY = this.y + this.height;

            context.translate(centerX, bottomY + bobOffset);
            context.scale(this.facing * scale.x, scale.y);

            // Draw from bottom center
            context.drawImage(this.image, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
            context.restore();
        } else {
            // Fallback while loading
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
