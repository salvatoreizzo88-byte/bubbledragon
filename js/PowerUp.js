import Entity from './Entity.js';

export default class PowerUp extends Entity {
    constructor(game, x, y, type) {
        super(game, x, y, 32, 32);
        this.type = type;
        this.gravity = 0.3; // Fall slower than fruits
        this.speedY = 0;
        this.speedX = 0;
        this.grounded = false;
        this.collectible = true;

        // Set color and symbol based on type
        switch (this.type) {
            case 'long_range':
                this.color = '#ff00de'; // Pink
                this.symbol = 'P';
                break;
            case 'speed_boost':
                this.color = '#ffff00'; // Yellow
                this.symbol = 'S';
                break;
            case 'rapid_fire':
                this.color = '#ff4444'; // Red
                this.symbol = 'F';
                break;
            case 'shield':
                this.color = '#00ffff'; // Cyan
                this.symbol = 'X';
                break;
            case 'double_jump':
                this.color = '#00ff00'; // Green
                this.symbol = 'J';
                break;
            default:
                this.color = '#ffffff';
                this.symbol = '?';
        }

        this.pulseTimer = 0;
    }

    update(deltaTime) {
        if (!this.grounded) {
            this.speedY += this.gravity;
        } else {
            this.speedY = 0;
        }

        this.pulseTimer += 0.2;
    }

    draw(context) {
        context.shadowBlur = 10;
        context.shadowColor = this.color;

        const pulseScale = 1 + Math.sin(this.pulseTimer) * 0.2; // Scale 0.8 to 1.2
        const drawWidth = this.width * pulseScale;
        const drawHeight = this.height * pulseScale;
        const offsetX = (drawWidth - this.width) / 2;
        const offsetY = (drawHeight - this.height) / 2;

        context.fillStyle = this.color;
        context.fillRect(this.x - offsetX, this.y - offsetY, drawWidth, drawHeight);

        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.strokeRect(this.x - offsetX, this.y - offsetY, drawWidth, drawHeight);

        context.shadowBlur = 0;

        context.fillStyle = 'white';
        context.font = '20px "Press Start 2P"';
        context.textAlign = 'center';
        // Draw symbol centered
        context.fillText(this.symbol, this.x + this.width / 2, this.y + this.height - 8);
    }
}
