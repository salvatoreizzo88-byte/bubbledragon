import Entity from './Entity.js';

export default class Bubble extends Entity {
    constructor(game, x, y, direction) {
        super(game, x, y, 32, 32);
        this.speedX = direction * 6; // Shoot out fast
        this.speedY = 0;
        this.shootDuration = 20; // Default shoot duration
        this.lifeTime = 0;
        this.maxLifeTime = 300; // Frames (approx 5 seconds)
        this.floatSpeed = -2;
        this.state = 'active'; // active, floating, popping
    }

    update(deltaTime) {
        this.lifeTime += deltaTime;

        // Initial shoot phase
        if (this.lifeTime < this.shootDuration) {
            // Apply different friction based on "range" (duration)
            if (this.shootDuration > 50) {
                this.speedX *= 1.0; // No friction for long range
                // Long range bubble updates handled silently
            } else {
                this.speedX *= Math.pow(0.9, deltaTime); // Friction scaled by time
            }
        } else {
            this.speedX = 0;
            this.speedY = this.floatSpeed; // Start floating up

            // Wiggle effect
            this.x += Math.sin(this.lifeTime * 0.1) * 0.5 * deltaTime;
        }

        // Check ceiling collision
        // (Simplified: just check if it hits the top of the screen or a platform)
        // For now, let's just make them stop at the top
        if (this.y < 40) { // Top row is usually wall
            this.y = 40;
            this.speedY = 0;
        }

        super.update(deltaTime);

        if (this.lifeTime > this.maxLifeTime) {
            this.markedForDeletion = true;
        }
    }

    draw(context) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 2;

        context.save();

        // Neon glow effect
        context.shadowColor = '#00ffff';
        context.shadowBlur = 20;

        if (this.state === 'trapped') {
            // Pulsing red glow when trapped
            const pulse = Math.sin(this.lifeTime * 0.2) * 0.5 + 0.5;
            context.shadowColor = `rgba(255, 0, 100, ${0.5 + pulse * 0.5})`;
            context.shadowBlur = 25 + pulse * 10;

            // Larger bubble for trapped enemy
            const gradient = context.createRadialGradient(
                centerX - 5, centerY - 5, 0,
                centerX, centerY, radius + 8
            );
            gradient.addColorStop(0, 'rgba(255, 100, 150, 0.4)');
            gradient.addColorStop(0.7, 'rgba(255, 50, 100, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 0, 50, 0)');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = '#ff6b6b';
            context.lineWidth = 3;
            context.stroke();
        } else {
            // Normal 3D bubble with gradient
            const gradient = context.createRadialGradient(
                centerX - 5, centerY - 5, 0,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, 'rgba(150, 255, 255, 0.6)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = '#00ffff';
            context.lineWidth = 2;
            context.stroke();
        }

        // 3D Shine highlight
        context.shadowBlur = 0;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.beginPath();
        context.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        context.fill();

        // Secondary smaller shine
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.beginPath();
        context.arc(centerX - radius * 0.1, centerY - radius * 0.5, radius * 0.1, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }
}
