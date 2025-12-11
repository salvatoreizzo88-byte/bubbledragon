export default class Entity {
    constructor(game, x, y, width, height) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = 0;
        this.speedY = 0;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        // Movement is handled by Game.js to allow split axis collision
    }

    draw(context) {
        // Placeholder draw method
        context.fillStyle = 'white';
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}
