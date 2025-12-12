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
        // === COIN MAGNET EFFECT ===
        if (this.game && this.game.player && this.game.player.hasCoinMagnet) {
            const player = this.game.player;
            const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (player.coinMagnetRadius || 150)) {
                // Attract towards player
                const magnetStrength = 0.3;
                this.speedX += (dx / distance) * magnetStrength * deltaTime;
                this.speedY += (dy / distance) * magnetStrength * deltaTime;
            }
        }

        if (!this.grounded) {
            this.speedY += this.gravity * deltaTime;
        } else {
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
