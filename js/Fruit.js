import Entity from './Entity.js';

export default class Fruit extends Entity {
    constructor(game, x, y) {
        super(game, x, y, 32, 32);
        this.gravity = 0.5;
        this.xpValue = 25; // XP given when collected (4 fruits = 1 level)
        // Random color to represent different fruits
        const colors = ['#ff0000', '#ffff00', '#ffa500', '#ff00ff']; // Red, Yellow, Orange, Magenta
        this.color = colors[Math.floor(Math.random() * colors.length)];

        // Spawn logic handled by Game.js passing x/y, but if we want random top spawn:
        // actually Game.js will pass the coordinates. User said "fluttuare dall'alto".
        // So we expect x to be random and y to be top.

        this.speedY = 0; // Will be accelerated by gravity
        this.speedX = 0; // Fall straight down

        this.collectible = true; // Can be collected immediately if falling? Or maybe keep delay?
        // User didn't specify delay, but "fluttuare dall'alto" implies time to see it.
        // Let's keep it simple.
        this.grounded = false;
    }

    update(deltaTime) {
        if (!this.grounded) {
            this.speedY += this.gravity;
        } else {
            this.speedY = 0;
            this.speedX = 0;
        }

        // We don't use super.update because Game.js handles movement now
        // But we need to be careful. Game.js updates position for Player, Enemies, Bubbles.
        // We need to add Fruits to the loop in Game.js
    }

    draw(context) {
        context.fillStyle = this.color;
        // Draw a simple fruit shape (circle with stem)
        context.beginPath();
        context.arc(this.x + this.width / 2, this.y + this.height / 2 + 2, 12, 0, Math.PI * 2);
        context.fill();

        // Stem
        context.fillStyle = 'green';
        context.fillRect(this.x + this.width / 2 - 2, this.y + 4, 4, 8);
    }
}
