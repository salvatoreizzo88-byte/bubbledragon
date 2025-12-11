import Entity from './Entity.js';
import { SimpleAnimation } from './SpriteAnimation.js';

export default class Enemy extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 32, 32);
        this.speed = 1.2;
        this.speedX = this.speed; // Start moving right
        this.facing = 1; // 1 = right, -1 = left
        this.gravity = 0.5;
        this.color = '#ff0000'; // Red enemy
        this.trapped = false;
        this.trappedTimer = 0;
        this.trappedDuration = 300; // 5 seconds
        this.bubbleRef = null; // Reference to the bubble trapping it

        // Stuck detection - teleport if enemy can't reach player for too long
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        this.stuckThreshold = 300; // 5 seconds of not moving = stuck

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
            // Patrol Logic
            // If hitting wall, turn around
            // This is handled by collision check in Game/Level, but we need to react to speedX becoming 0

            if (this.speedX === 0) {
                // ...
            }

            if (this.speedX > 0) this.facing = -1;
            if (this.speedX < 0) this.facing = 1;

            // Apply Physics
            this.speedY += this.gravity * deltaTime;
            super.update(deltaTime);

            // Check if stuck inside a wall and fix it
            this.checkAndUnstuck();

            // Check if stuck in inaccessible area (not moving much)
            this.checkStuckInArea(deltaTime);

            // Simple AI: Turn around if hitting wall (checked in Game loop via collision side effect)
            // For now, let's just make them bounce off walls if speedX is 0
            // Simple AI: Turn around if hitting wall
            if (this.speedX === 0) {
                // Collision system stopped us. Flip direction.
                // We rely on 'facing' property which tracks visual direction.
                // Inverted logic: if facing -1 (Right), we were moving Right, so flip to Left.
                // Wait, facing is inverted logic: 
                // speed > 0 -> facing -1
                // speed < 0 -> facing 1

                // So if facing is -1, we want to go Left (speed < 0)
                // If facing is 1, we want to go Right (speed > 0)

                if (this.facing === -1) {
                    this.speedX = -this.speed;
                } else {
                    this.speedX = this.speed;
                }
            }
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
                            console.log('Enemy unstuck!', { x: this.x, y: this.y });
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
                                console.log('Enemy teleported near player from inaccessible area');
                                return;
                            }
                        }
                    }
                }
            }

            // Fallback: spawn at center top if can't find good position
            this.x = this.game.width / 2;
            this.y = tileSize * 2;
            console.log('Enemy teleported to center fallback');
        }
    }
}
