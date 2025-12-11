// ParticleSystem.js - Visual particle effects for game juice

class Particle {
    constructor(x, y, color, speedX, speedY, size = 4, life = 60) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;
        this.initialSize = size; // Store initial size
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.15;
        this.friction = 0.98;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= this.friction;
        this.speedY *= this.friction;
        this.life--;

        // Shrink based on INITIAL size, not current
        this.size = (this.life / this.maxLife) * this.initialSize;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(this.size, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    get isDead() {
        return this.life <= 0;
    }
}

// Star-shaped particle for special effects
class StarParticle extends Particle {
    constructor(x, y, color, speedX, speedY, size = 6, life = 45) {
        super(x, y, color, speedX, speedY, size, life);
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    }

    update() {
        super.update();
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw 4-point star
        const s = Math.max(this.size, 1);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const outerX = Math.cos(angle) * s;
            const outerY = Math.sin(angle) * s;
            const innerAngle = angle + Math.PI / 4;
            const innerX = Math.cos(innerAngle) * s * 0.4;
            const innerY = Math.sin(innerAngle) * s * 0.4;

            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Emit particles at position
    emit(x, y, count, color, options = {}) {
        const {
            speedMin = 2,
            speedMax = 5,
            sizeMin = 2,
            sizeMax = 6,
            lifeMin = 30,
            lifeMax = 60,
            spread = Math.PI * 2, // Full circle
            direction = -Math.PI / 2, // Up
            type = 'circle' // 'circle' or 'star'
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = direction + (Math.random() - 0.5) * spread;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const speedX = Math.cos(angle) * speed;
            const speedY = Math.sin(angle) * speed;
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);
            const life = lifeMin + Math.random() * (lifeMax - lifeMin);

            const ParticleClass = type === 'star' ? StarParticle : Particle;
            this.particles.push(new ParticleClass(x, y, color, speedX, speedY, size, life));
        }
    }

    // === PRESET EFFECTS (BIGGER & MORE VISIBLE) ===

    // Bubble pop effect - blue particles spreading
    bubblePop(x, y) {
        this.emit(x, y, 20, '#00aaff', {
            speedMin: 3,
            speedMax: 8,
            sizeMin: 6,
            sizeMax: 14,
            lifeMin: 30,
            lifeMax: 50
        });
        // Inner white sparkle
        this.emit(x, y, 10, '#ffffff', {
            speedMin: 2,
            speedMax: 5,
            sizeMin: 4,
            sizeMax: 10,
            lifeMin: 15,
            lifeMax: 30,
            type: 'star'
        });
    }

    // Enemy trapped effect - yellow stars
    enemyTrapped(x, y) {
        this.emit(x, y, 15, '#ffff00', {
            speedMin: 3,
            speedMax: 6,
            sizeMin: 8,
            sizeMax: 16,
            lifeMin: 40,
            lifeMax: 60,
            type: 'star'
        });
    }

    // Enemy defeated (popped from bubble) - rainbow explosion
    enemyDefeated(x, y) {
        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'];
        colors.forEach((color, i) => {
            this.emit(x, y, 8, color, {
                speedMin: 4,
                speedMax: 10,
                sizeMin: 8,
                sizeMax: 16,
                lifeMin: 50,
                lifeMax: 80,
                direction: (i / colors.length) * Math.PI * 2
            });
        });
    }

    // Fruit/coin collected - gold sparkles (MUCH BIGGER)
    collectItem(x, y, color = '#ffd700') {
        this.emit(x, y, 18, color, {
            speedMin: 2,
            speedMax: 6,
            sizeMin: 6,
            sizeMax: 14,
            lifeMin: 30,
            lifeMax: 50,
            direction: -Math.PI / 2, // Upward
            spread: Math.PI,
            type: 'star'
        });
        // Extra glow
        this.emit(x, y, 8, '#ffffff', {
            speedMin: 1,
            speedMax: 3,
            sizeMin: 4,
            sizeMax: 8,
            lifeMin: 20,
            lifeMax: 35
        });
    }

    // Player death - red explosion
    playerDeath(x, y) {
        this.emit(x, y, 20, '#ff0000', {
            speedMin: 3,
            speedMax: 8,
            sizeMin: 4,
            sizeMax: 10,
            lifeMin: 40,
            lifeMax: 80
        });
        this.emit(x, y, 10, '#ffff00', {
            speedMin: 2,
            speedMax: 5,
            sizeMin: 2,
            sizeMax: 6,
            lifeMin: 30,
            lifeMax: 60,
            type: 'star'
        });
    }

    // Level complete - confetti
    levelComplete(canvasWidth, canvasHeight) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffd700'];
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvasWidth;
            const y = -20;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.emit(x, y, 1, color, {
                speedMin: 0,
                speedMax: 2,
                sizeMin: 4,
                sizeMax: 8,
                lifeMin: 100,
                lifeMax: 150,
                direction: Math.PI / 2, // Downward
                spread: Math.PI / 4
            });
        }
    }

    // XP gained - green/yellow upward
    xpGained(x, y) {
        this.emit(x, y, 6, '#00ff00', {
            speedMin: 1,
            speedMax: 3,
            sizeMin: 3,
            sizeMax: 5,
            lifeMin: 25,
            lifeMax: 45,
            direction: -Math.PI / 2,
            spread: Math.PI / 3,
            type: 'star'
        });
    }

    // Dragocoin collected - purple sparkle
    dragocoinCollected(x, y) {
        this.emit(x, y, 15, '#ff00de', {
            speedMin: 2,
            speedMax: 5,
            sizeMin: 3,
            sizeMax: 7,
            lifeMin: 30,
            lifeMax: 50,
            type: 'star'
        });
        this.emit(x, y, 8, '#ffffff', {
            speedMin: 1,
            speedMax: 3,
            sizeMin: 2,
            sizeMax: 4,
            lifeMin: 20,
            lifeMax: 35
        });
    }

    // Update all particles
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Draw all particles
    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    // Clear all particles
    clear() {
        this.particles = [];
    }

    // Get particle count (for debugging)
    get count() {
        return this.particles.length;
    }
}
