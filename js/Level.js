import LevelGenerator from './LevelGenerator.js';

export default class Level {
    constructor(game) {
        this.game = game;
        this.tileSize = 40; // 800 / 20 = 40
        this.rows = 15;     // 600 / 40 = 15
        this.cols = 20;

        // Load 3D modern block sprite
        this.wallImage = new Image();
        this.wallImage.src = 'assets/sprites/wall_3d.png';

        // Fallback to old image if 3D not found
        this.wallImage.onerror = () => {
            this.wallImage.src = 'assets/wall.png';
        };

        this.load(0);
    }

    load(levelIndex) {
        this.map = LevelGenerator.generate(levelIndex);
    }

    draw(context) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === 1) {
                    const posX = x * this.tileSize;
                    const posY = y * this.tileSize;

                    // Use 3D sprite if loaded, otherwise gradient fallback
                    if (this.wallImage.complete && this.wallImage.naturalWidth > 0) {
                        context.drawImage(this.wallImage, posX, posY, this.tileSize, this.tileSize);
                    } else {
                        // Fallback gradient
                        const gradient = context.createLinearGradient(posX, posY, posX, posY + this.tileSize);
                        gradient.addColorStop(0, '#9B6DFF');
                        gradient.addColorStop(0.5, '#7C4DFF');
                        gradient.addColorStop(1, '#5B21B6');
                        context.fillStyle = gradient;
                        context.fillRect(posX, posY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
    }

    checkCollisionX(entity) {
        // Calculate grid coordinates of the entity
        const left = Math.floor(entity.x / this.tileSize);
        const right = Math.floor((entity.x + entity.width - 0.01) / this.tileSize);
        const top = Math.floor(entity.y / this.tileSize);
        const bottom = Math.floor((entity.y + entity.height - 0.01) / this.tileSize);

        // Check boundaries - Treat screen edges as walls
        if (entity.x < 0) {
            entity.x = 0;
            entity.speedX = 0;
            return;
        }
        if (entity.x + entity.width > this.game.width) {
            entity.x = this.game.width - entity.width;
            entity.speedX = 0;
            return;
        }

        // Right
        if (entity.speedX > 0) {
            const rightNext = Math.floor((entity.x + entity.width + entity.speedX) / this.tileSize);
            // Check bounds for map access
            if (rightNext < this.cols && top >= 0 && bottom < this.rows) {
                if (this.map[top][rightNext] === 1 || this.map[bottom][rightNext] === 1) {
                    entity.x = rightNext * this.tileSize - entity.width;
                    entity.speedX = 0;
                }
            }
        }

        // Left
        if (entity.speedX < 0) {
            const leftNext = Math.floor((entity.x + entity.speedX) / this.tileSize);
            // Check bounds for map access
            if (leftNext >= 0 && top >= 0 && bottom < this.rows) {
                if (this.map[top][leftNext] === 1 || this.map[bottom][leftNext] === 1) {
                    entity.x = (leftNext + 1) * this.tileSize;
                    entity.speedX = 0;
                }
            }
        }
    }

    checkCollisionY(entity) {
        const left = Math.floor(entity.x / this.tileSize);
        const right = Math.floor((entity.x + entity.width - 0.01) / this.tileSize);
        const top = Math.floor(entity.y / this.tileSize);
        const bottom = Math.floor((entity.y + entity.height - 0.01) / this.tileSize);

        // Top boundary (Ceiling)
        // Removed clamp to allow falling from top (wrapping)
        // if (entity.y < 0) {
        //     entity.y = 0;
        //     entity.speedY = 0;
        // }

        // Bottom collision (Ground)
        if (entity.speedY > 0) {
            let bottomNext = Math.floor((entity.y + entity.height + entity.speedY) / this.tileSize);

            // Wrap around if falling through bottom
            if (entity.y > this.game.height) {
                const entityType = entity.constructor.name || 'Unknown';
                const isPlayer = entityType === 'Player';
                console.log(`🔄 WRAP: ${entityType} at y=${entity.y.toFixed(0)} (> ${this.game.height}) wrapping to top!${isPlayer ? ' ⚠️ PLAYER!' : ''}`);
                entity.y = -entity.height; // Appear at top
                // Keep entity in safe X range (not too close to walls)
                // Clamp X to ensure it's not inside a side wall
                if (entity.x < this.tileSize) {
                    entity.x = this.tileSize + 5;
                }
                if (entity.x + entity.width > this.game.width - this.tileSize) {
                    entity.x = this.game.width - this.tileSize - entity.width - 5;
                }
                entity.speedX = 0; // Stop horizontal movement to prevent wall collision
                return;
            }

            // Prevent tunneling through the bottom of the map ONLY if there is a wall
            if (bottomNext >= this.rows) {
                // Check if we are falling into a hole (no wall at bottom row)
                // Actually, if we are below the map, we should just wrap, handled above.
                // But we need to check collision with the last row walls.
                if (bottomNext >= this.rows) bottomNext = this.rows - 1;
            }

            if (bottomNext >= 1 && bottomNext < this.rows && left >= 0 && right < this.cols) {
                if (this.map[bottomNext][left] === 1 || this.map[bottomNext][right] === 1) {
                    entity.y = bottomNext * this.tileSize - entity.height;
                    entity.speedY = 0;
                    entity.grounded = true;
                }
            }
        }

        // Top collision (Ceiling)
        if (entity.speedY < 0) {
            const topNext = Math.floor((entity.y + entity.speedY) / this.tileSize);
            // Check if we are hitting the ceiling from below
            if (topNext >= 0 && topNext < this.rows && left >= 0 && right < this.cols) {
                if (this.map[topNext][left] === 1 || this.map[topNext][right] === 1) {
                    entity.y = (topNext + 1) * this.tileSize;
                    entity.speedY = 0;
                }
            }
        } else if (entity.y < this.tileSize && entity.speedY === 0 && !entity.grounded) {
            // Extra check: if entity is inside the top wall and not moving, push it down
            // This handles cases where it might spawn slightly inside
            const topRow = Math.floor(entity.y / this.tileSize);
            if (topRow === 0) {
                // Check if actually in a wall
                if (this.map[0][left] === 1 || this.map[0][right] === 1) {
                    entity.y = this.tileSize + 1;
                }
            }
        }
    }

    // Find valid spawn positions for enemies (empty tiles above platforms)
    getValidSpawnPositions() {
        const positions = [];
        const tileSize = this.tileSize;

        // Check each tile
        for (let y = 1; y < this.rows - 2; y++) { // Skip top/bottom rows
            for (let x = 1; x < this.cols - 1; x++) { // Skip left/right edges
                // Current tile must be empty
                if (this.map[y][x] === 0) {
                    // Check if there's a platform below (within 3 tiles)
                    let hasFloor = false;
                    for (let checkY = y + 1; checkY < Math.min(y + 4, this.rows); checkY++) {
                        if (this.map[checkY][x] === 1) {
                            hasFloor = true;
                            break;
                        }
                    }

                    // Also check tile above is empty (room to spawn)
                    if (hasFloor && (y === 0 || this.map[y - 1][x] === 0)) {
                        // Avoid spawning too close to player start (left side)
                        if (x > 3) {
                            positions.push({
                                x: x * tileSize + tileSize / 4,
                                y: y * tileSize
                            });
                        }
                    }
                }
            }
        }

        return positions;
    }

    // Get random valid spawn position
    getRandomSpawnPosition() {
        const positions = this.getValidSpawnPositions();
        if (positions.length === 0) {
            // Fallback to center-ish position
            return { x: 400, y: 100 };
        }
        return positions[Math.floor(Math.random() * positions.length)];
    }
}
