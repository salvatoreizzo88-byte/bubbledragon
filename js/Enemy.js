import Entity from './Entity.js';
import { SimpleAnimation } from './SpriteAnimation.js';
import GameConfig from './GameConfig.js';

export default class Enemy extends Entity {
    constructor(game, x, y, speedMultiplier = 1.0, levelIndex = 0) {
        super(game, x, y, 32, 32);
        this.baseSpeed = 1.2;
        this.speed = this.baseSpeed * speedMultiplier;
        this.speedX = this.speed; // Start moving right
        this.facing = 1; // 1 = right, -1 = left
        this.gravity = 0.5;
        this.color = '#ff0000'; // Red enemy
        this.trapped = false;
        this.trappedTimer = 0;
        this.trappedDuration = 300; // 5 seconds
        this.bubbleRef = null; // Reference to the bubble trapping it

        // === ADVANCED AI SYSTEM (based on level) ===
        this.levelIndex = levelIndex;
        this.canJump = GameConfig.levels.canJump(levelIndex);
        this.chaseChance = GameConfig.levels.getChaseChance(levelIndex);
        this.jumpForce = GameConfig.levels.getJumpForce(levelIndex);
        this.isChaser = Math.random() < this.chaseChance; // Decide once if this enemy chases
        this.grounded = false;
        this.jumpCooldown = 0;
        this.chaseUpdateTimer = 0; // Timer to update chase direction

        // Stuck detection - teleport if enemy can't reach player for too long
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.stuckThreshold = 300; // 5 seconds of not moving = stuck

        // === PATHFINDING AI ===
        this.currentPath = null;     // Current path to follow
        this.pathUpdateTimer = 0;     // Timer to request new path
        this.pathUpdateInterval = 60; // Request new path every second
        this.currentWaypointIndex = 0; // Current waypoint in path
        this.usePathfinding = this.isChaser; // Only chasers use pathfinding

        // Animation system
        this.animation = new SimpleAnimation();
        this.wiggleTimer = 0;

        // Load new 3D sprite (already has transparent background)
        this.image = new Image();
        this.image.src = 'assets/sprites/enemy_3d.png';

        // Neon glow color (magenta when normal, red when trapped/angry)
        this.glowColor = '#ff00de';
    }
    // Remove green background from image (chroma key)
    removeBlackBackground(img) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            // Remove green pixels (R < 100, G > 200, B < 100)
            if (r < 100 && g > 200 && b < 100) {
                d[i + 3] = 0;
            }
            // Also remove near-black pixels
            if (r < 30 && g < 30 && b < 30) {
                d[i + 3] = 0;
            }
        }
        ctx.putImageData(id, 0, 0);
        const newImg = new Image();
        newImg.src = c.toDataURL();
        return newImg;
    }

    update(deltaTime) {
        if (!this.trapped) {
            // === ADVANCED AI LOGIC ===
            const player = this.game.player;

            // Update facing based on movement
            if (this.speedX > 0) this.facing = -1;
            if (this.speedX < 0) this.facing = 1;

            // Decrease cooldowns
            if (this.jumpCooldown > 0) this.jumpCooldown -= deltaTime;
            this.chaseUpdateTimer -= deltaTime;

            // Track if we were blocked by wall (speedX was reset to 0 by collision system last frame)
            const wasBlockedByWall = this.speedX === 0;

            // Apply Physics (gravity)
            this.speedY += this.gravity * deltaTime;

            // NOTE: grounded is set by Level.checkCollisionY() when enemy lands on platform
            // Do NOT override it here - that was causing the jump bug!

            // === CHASER BEHAVIOR with PATHFINDING ===
            if (this.isChaser && player) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;

                // Update pathfinding timer
                this.pathUpdateTimer -= deltaTime;

                // Request new path periodically
                if (this.pathUpdateTimer <= 0 && this.usePathfinding) {
                    this.pathUpdateTimer = this.pathUpdateInterval;

                    // Request path from current position to player
                    this.game.pathfinding.findPath(this.x, this.y, player.x, player.y)
                        .then(path => {
                            if (path && path.length > 1) {
                                this.currentPath = path;
                                this.currentWaypointIndex = 0;
                            }
                        });
                }

                // Follow path if we have one
                if (this.currentPath && this.currentPath.length > 1) {
                    // Find next waypoint
                    const nextWaypoint = this.currentPath[Math.min(this.currentWaypointIndex + 1, this.currentPath.length - 1)];
                    const wpDx = nextWaypoint.x - this.x;
                    const wpDy = nextWaypoint.y - this.y;

                    // Check if reached current waypoint
                    if (Math.abs(wpDx) < 30 && Math.abs(wpDy) < 30) {
                        this.currentWaypointIndex++;
                    }

                    // Move towards waypoint
                    if (Math.abs(wpDx) > 15) {
                        this.speedX = wpDx > 0 ? this.speed : -this.speed;
                    }

                    // Jump if waypoint is above us
                    if (this.canJump && this.grounded && this.jumpCooldown <= 0) {
                        if (wpDy < -20) {
                            this.speedY = -this.jumpForce;
                            this.jumpCooldown = 45;
                            this.grounded = false;
                            console.log(`🧭 Enemy pathfinding jump! wpDy=${wpDy.toFixed(0)}`);
                        }
                        // Also jump if blocked by wall
                        else if (wasBlockedByWall && Math.abs(wpDx) > 20) {
                            this.speedY = -this.jumpForce;
                            this.jumpCooldown = 45;
                            this.grounded = false;
                            this.speedX = wpDx > 0 ? this.speed * 1.3 : -this.speed * 1.3;
                            console.log(`🧭 Enemy pathfinding wall jump!`);
                        }
                    }

                    // Log debug occasionally
                    if (Math.random() < 0.003) {
                        console.log(`🧭 Pathfinding: waypoint ${this.currentWaypointIndex}/${this.currentPath.length}, wpDx=${wpDx.toFixed(0)}, wpDy=${wpDy.toFixed(0)}`);
                    }
                } else {
                    // Fallback to simple chase if no path
                    if (this.chaseUpdateTimer <= 0) {
                        this.chaseUpdateTimer = 30;
                        if (Math.abs(dx) > 20) {
                            this.speedX = dx > 0 ? this.speed : -this.speed;
                        }
                    }

                    // Jump logic fallback
                    if (this.canJump && this.grounded && this.jumpCooldown <= 0) {
                        if (dy < -30 && Math.abs(dx) < 300) {
                            this.speedY = -this.jumpForce;
                            this.jumpCooldown = 60;
                            this.grounded = false;
                        } else if (wasBlockedByWall && Math.abs(dx) > 30) {
                            this.speedY = -this.jumpForce;
                            this.jumpCooldown = 45;
                            this.grounded = false;
                            this.speedX = dx > 0 ? this.speed * 1.2 : -this.speed * 1.2;
                        }
                    }
                }
            } else if (!this.isChaser) {
                // === PATROL BEHAVIOR (original simple AI) ===
                // Turn around if hitting wall
                if (wasBlockedByWall) {
                    if (this.facing === -1) {
                        this.speedX = -this.speed;
                    } else {
                        this.speedX = this.speed;
                    }
                    this.facing *= -1; // Flip facing
                }
            }

            // Check if stuck inside a wall and fix it
            this.checkAndUnstuck();

            // Check if stuck in inaccessible area (not moving much)
            this.checkStuckInArea(deltaTime);
        } else {
            // Trapped logic
            this.trappedTimer -= deltaTime;
            if (this.trappedTimer <= 0) {
                this.trapped = false;
                this.bubbleRef.markedForDeletion = true; // Pop the bubble
                this.bubbleRef = null;
                // Enemy becomes angry (speed up) - optional
                this.speedX = (Math.random() > 0.5 ? 1 : -1) * this.speed * 1.5;
                this.y -= 10; // Pop out slightly up
            } else {
                // Float with the bubble
                if (this.bubbleRef) {
                    this.x = this.bubbleRef.x;
                    this.y = this.bubbleRef.y;
                }
            }
        }
    }

    draw(context) {
        const deltaTime = 1 / 60;

        // Update animation based on state
        if (this.trapped) {
            // Wiggle when trapped
            this.wiggleTimer += deltaTime * 15;
        } else {
            // Walking bounce
            this.animation.updateWalk(deltaTime);
        }

        const scale = this.animation.getScale();

        if (this.image && this.image.complete) {
            context.save();

            // Neon glow effect
            if (this.trapped) {
                // Pulsing red glow when trapped
                const pulse = Math.sin(this.wiggleTimer * 0.5) * 0.5 + 0.5;
                context.shadowColor = `rgba(255, 0, 100, ${0.5 + pulse * 0.5})`;
                context.shadowBlur = 20 + pulse * 10;
                context.globalAlpha = 0.7;
            } else {
                // Normal magenta glow
                context.shadowColor = this.glowColor;
                context.shadowBlur = 15;
            }

            // Draw with correct aspect ratio
            const imgRatio = this.image.width / this.image.height;
            let drawHeight = 64;
            let drawWidth = drawHeight * imgRatio; // Maintain aspect ratio

            if (this.trapped) {
                // If trapped, fit inside the bubble (smaller)
                drawHeight = 28;
                drawWidth = drawHeight * imgRatio;
            }

            // Translate to center of hitbox
            const wiggleOffset = this.trapped ? Math.sin(this.wiggleTimer) * 3 : 0;
            context.translate(this.x + this.width / 2 + wiggleOffset, this.y + this.height / 2);

            // Apply animation scale (only when not trapped)
            if (!this.trapped) {
                context.scale((this.facing || 1) * scale.x, scale.y);
            } else {
                context.scale(this.facing || 1, 1);
            }

            // Draw centered
            context.drawImage(this.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

            context.globalAlpha = 1.0;
            context.restore();
        } else {
            context.fillStyle = this.trapped ? '#ffaaaa' : this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    trap(bubble) {
        if (this.trapped) return;
        this.trapped = true;
        this.trappedTimer = this.trappedDuration;
        this.bubbleRef = bubble;
        this.speedX = 0;
        this.speedY = 0;
        this.game.audioManager.playSound('trap');
    }

    // Check if enemy is stuck inside a wall and unstick them
    checkAndUnstuck() {
        if (!this.game || !this.game.level) return;

        const level = this.game.level;
        const tileSize = level.tileSize;

        // Get center tile of enemy
        const centerX = Math.floor((this.x + this.width / 2) / tileSize);
        const centerY = Math.floor((this.y + this.height / 2) / tileSize);

        // Check if inside a wall
        if (centerX >= 0 && centerX < level.cols &&
            centerY >= 0 && centerY < level.rows &&
            level.map[centerY][centerX] === 1) {

            // We're stuck! Find nearest empty space
            for (let radius = 1; radius < 5; radius++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const checkX = centerX + dx;
                        const checkY = centerY + dy;

                        if (checkX >= 0 && checkX < level.cols &&
                            checkY >= 0 && checkY < level.rows &&
                            level.map[checkY][checkX] === 0) {
                            // Found empty space, teleport there
                            this.x = checkX * tileSize + tileSize / 4;
                            this.y = checkY * tileSize;
                            this.speedX = (Math.random() > 0.5 ? 1 : -1) * this.speed;
                            // Successfully unstuck enemy
                            return;
                        }
                    }
                }
            }
        }
    }

    // Check if enemy is stuck in an inaccessible area (can't reach player)
    checkStuckInArea(deltaTime) {
        // Calculate distance moved since last check
        const distMoved = Math.abs(this.x - this.lastX) + Math.abs(this.y - this.lastY);

        // If barely moved, increment stuck timer
        if (distMoved < 5) {
            this.stuckTimer += deltaTime;
        } else {
            this.stuckTimer = 0;
        }

        // Update last position
        this.lastX = this.x;
        this.lastY = this.y;

        // If stuck for too long, teleport near player
        if (this.stuckTimer >= this.stuckThreshold) {
            this.stuckTimer = 0;

            // Find position near player but not too close
            const player = this.game.player;
            const level = this.game.level;
            const tileSize = level.tileSize;

            // Try to spawn on a platform above the player
            const playerTileX = Math.floor(player.x / tileSize);
            const playerTileY = Math.floor(player.y / tileSize);

            // Look for valid spawn position in player's area
            for (let offsetX = -5; offsetX <= 5; offsetX++) {
                for (let offsetY = -3; offsetY <= 0; offsetY++) {
                    const checkX = playerTileX + offsetX;
                    const checkY = playerTileY + offsetY;

                    // Check bounds
                    if (checkX >= 2 && checkX < level.cols - 2 &&
                        checkY >= 1 && checkY < level.rows - 1) {

                        // Check if empty with floor below
                        if (level.map[checkY][checkX] === 0) {
                            // Check for floor within 3 tiles below
                            let hasFloor = false;
                            for (let below = 1; below <= 3; below++) {
                                if (checkY + below < level.rows && level.map[checkY + below][checkX] === 1) {
                                    hasFloor = true;
                                    break;
                                }
                            }

                            if (hasFloor && Math.abs(offsetX) >= 2) { // Not too close to player
                                this.x = checkX * tileSize;
                                this.y = checkY * tileSize;
                                this.speedX = (player.x < this.x ? -1 : 1) * this.speed;
                                // Teleported near player from inaccessible area
                                return;
                            }
                        }
                    }
                }
            }

            // Fallback: spawn at center top if can't find good position
            this.x = this.game.width / 2;
            this.y = tileSize * 2;
            // Fallback teleport to center
        }
    }
}
