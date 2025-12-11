// SpriteAnimation.js - Handles animated sprite sheets

export default class SpriteAnimation {
    constructor(spriteSheet, frameWidth, frameHeight, animations) {
        this.sheet = spriteSheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.animations = animations; // { animName: { row, frames, fps, loop } }

        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.isPlaying = true;
        this.flipX = false;
    }

    // Play a specific animation
    play(animationName) {
        if (this.currentAnimation === animationName) return;

        if (this.animations[animationName]) {
            this.currentAnimation = animationName;
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.isPlaying = true;
        }
    }

    // Stop animation
    stop() {
        this.isPlaying = false;
    }

    // Resume animation
    resume() {
        this.isPlaying = true;
    }

    // Update animation frame
    update(deltaTime = 1 / 60) {
        if (!this.isPlaying || !this.currentAnimation) return;

        const anim = this.animations[this.currentAnimation];
        if (!anim) return;

        const fps = anim.fps || 10;
        const frameDuration = 1 / fps;

        this.frameTimer += deltaTime;

        if (this.frameTimer >= frameDuration) {
            this.frameTimer = 0;
            this.currentFrame++;

            if (this.currentFrame >= anim.frames) {
                if (anim.loop !== false) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = anim.frames - 1;
                    this.isPlaying = false;
                }
            }
        }
    }

    // Draw current frame
    draw(ctx, x, y, width, height) {
        if (!this.currentAnimation || !this.sheet) return;

        const anim = this.animations[this.currentAnimation];
        if (!anim) return;

        const sourceX = this.currentFrame * this.frameWidth;
        const sourceY = (anim.row || 0) * this.frameHeight;

        ctx.save();

        if (this.flipX) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        ctx.drawImage(
            this.sheet,
            sourceX, sourceY, this.frameWidth, this.frameHeight,
            x, y, width || this.frameWidth, height || this.frameHeight
        );

        ctx.restore();
    }

    // Get current animation info
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    // Check if animation is finished (for non-looping)
    isFinished() {
        if (!this.currentAnimation) return true;
        const anim = this.animations[this.currentAnimation];
        return !this.isPlaying && this.currentFrame >= anim.frames - 1;
    }
}

// Helper to create simple animation from single image (fake animation with scaling)
export class SimpleAnimation {
    constructor() {
        this.scaleTimer = 0;
        this.bobTimer = 0;
        this.squashStretch = 1;
    }

    // Create breathing/idle effect
    updateIdle(deltaTime = 1 / 60) {
        this.bobTimer += deltaTime * 2;
        this.squashStretch = 1 + Math.sin(this.bobTimer) * 0.05;
    }

    // Create walking bounce effect
    updateWalk(deltaTime = 1 / 60) {
        this.bobTimer += deltaTime * 8;
        this.squashStretch = 1 + Math.abs(Math.sin(this.bobTimer)) * 0.1;
    }

    // Create jump squash effect
    updateJump(isRising) {
        this.squashStretch = isRising ? 1.15 : 0.85;
    }

    // Apply to draw
    getScale() {
        return {
            x: 1 / this.squashStretch,
            y: this.squashStretch
        };
    }

    // Get vertical offset for bobbing
    getBobOffset() {
        return Math.sin(this.bobTimer) * 2;
    }
}
