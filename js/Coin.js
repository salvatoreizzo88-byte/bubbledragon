import Entity from './Entity.js';

export default class Coin extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 24, 24);
        this.gravity = 0.3;
        this.value = 10; // Coins to add
        this.color = '#ffd700'; // Gold

        this.speedY = 0;
        this.speedX = (Math.random() - 0.5) * 2; // Slight horizontal drift

        this.grounded = false;
        this.collectible = true;

        // Animation
        this.pulseTimer = 0;
        this.baseSize = 10;
    }

    update(deltaTime) {
        // === COIN MAGNET EFFECT (PREMIUM) ===
        if (this.game && this.game.player && this.game.player.hasCoinMagnet) {
            const player = this.game.player;
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Increased magnet radius: 300 pixels (was 150)
            const magnetRadius = player.coinMagnetRadius || 300;

            if (distance < magnetRadius && distance > 0) {
                // Mark as being attracted (used to disable gravity)
                this._isInMagnetRange = true;

                // Progressive magnet strength: stronger when closer
                // Base strength: 1.5 (was 0.3)
                // Boost: gets 3x stronger when within 50% radius
                const proximityBoost = distance < magnetRadius * 0.5 ? 3.0 : 1.0;
                const magnetStrength = 1.5 * proximityBoost;

                // Apply attraction force
                this.speedX += (dx / distance) * magnetStrength * deltaTime;
                this.speedY += (dy / distance) * magnetStrength * deltaTime;

                // Cap max speed to prevent overshooting
                const maxSpeed = 15;
                const currentSpeed = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                if (currentSpeed > maxSpeed) {
                    this.speedX = (this.speedX / currentSpeed) * maxSpeed;
                    this.speedY = (this.speedY / currentSpeed) * maxSpeed;
                }
            } else {
                this._isInMagnetRange = false;
            }
        } else {
            this._isInMagnetRange = false;
        }

        // Gravity only applies when NOT being attracted by magnet
        // (otherwise gravity fights vertical magnet force)
        const isBeingAttracted = this.game && this.game.player &&
            this.game.player.hasCoinMagnet &&
            this._isInMagnetRange;

        if (!this.grounded && !isBeingAttracted) {
            this.speedY += this.gravity * deltaTime;
        } else if (this.grounded) {
            this.speedY = 0;
            this.speedX *= 0.9; // Friction
        }

        // Pulse animation
        this.pulseTimer += 0.1;
    }

    draw(context) {
        const pulse = Math.sin(this.pulseTimer) * 2;
        const size = this.baseSize + pulse;

        // Outer glow
        context.shadowColor = '#ffd700';
        context.shadowBlur = 8;

        // Coin circle
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x + this.width / 2, this.y + this.height / 2, size, 0, Math.PI * 2);
        context.fill();

        // Inner highlight
        context.fillStyle = '#fff8dc';
        context.beginPath();
        context.arc(this.x + this.width / 2 - 2, this.y + this.height / 2 - 2, size * 0.4, 0, Math.PI * 2);
        context.fill();

        // $ symbol
        context.shadowBlur = 0;
        context.fillStyle = '#b8860b';
        context.font = `${size}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('$', this.x + this.width / 2, this.y + this.height / 2 + 1);
    }
}
