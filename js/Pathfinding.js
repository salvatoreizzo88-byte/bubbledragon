/**
 * Pathfinding module using EasyStar.js for enemy AI navigation
 * Creates a walkable grid from the level map and calculates paths
 * NOTE: EasyStar.js must be loaded via script tag in index.html BEFORE this module
 */

export default class Pathfinding {
    constructor(game) {
        this.game = game;
        // EasyStar is loaded globally from js/lib/easystar.min.js
        this.easystar = new EasyStar.js();
        this.grid = [];
        this.tileSize = 40;
        this.rows = 15;
        this.cols = 20;

        // Configure EasyStar
        this.easystar.setAcceptableTiles([0]); // 0 = walkable (empty), 1 = wall
        this.easystar.enableDiagonals(); // Allow diagonal movement
        this.easystar.enableCornerCutting(); // Allow cutting corners

        // Set iterations per frame (for async pathfinding)
        this.easystar.setIterationsPerCalculation(100);
    }

    /**
     * Update the grid from current level map
     * For platformer: walkable tiles are ABOVE solid tiles (platforms)
     */
    updateGrid(levelMap) {
        this.grid = [];

        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                // A tile is walkable if:
                // 1. Current tile is empty (not a wall)
                // 2. There's a solid tile below (or it's the bottom row)
                const currentTile = levelMap[y][x];
                const belowTile = y < this.rows - 1 ? levelMap[y + 1][x] : 1;

                // Walkable = empty AND has floor below
                if (currentTile === 0 && belowTile === 1) {
                    row.push(0); // Walkable
                } else if (currentTile === 0) {
                    // Empty but no floor - still allow for jumping paths
                    row.push(0); // Walkable (for jumping)
                } else {
                    row.push(1); // Wall - not walkable
                }
            }
            this.grid.push(row);
        }

        this.easystar.setGrid(this.grid);
    }

    /**
     * Convert pixel coordinates to grid coordinates
     */
    pixelToGrid(x, y) {
        return {
            x: Math.floor(x / this.tileSize),
            y: Math.floor(y / this.tileSize)
        };
    }

    /**
     * Convert grid coordinates to pixel coordinates (center of tile)
     */
    gridToPixel(gridX, gridY) {
        return {
            x: gridX * this.tileSize + this.tileSize / 2,
            y: gridY * this.tileSize + this.tileSize / 2
        };
    }

    /**
     * Find path from start to end (async)
     * Returns a Promise that resolves to an array of grid points
     */
    findPath(startX, startY, endX, endY) {
        return new Promise((resolve) => {
            const start = this.pixelToGrid(startX, startY);
            const end = this.pixelToGrid(endX, endY);

            // Clamp to grid bounds
            start.x = Math.max(0, Math.min(start.x, this.cols - 1));
            start.y = Math.max(0, Math.min(start.y, this.rows - 1));
            end.x = Math.max(0, Math.min(end.x, this.cols - 1));
            end.y = Math.max(0, Math.min(end.y, this.rows - 1));

            this.easystar.findPath(start.x, start.y, end.x, end.y, (path) => {
                if (path === null) {
                    resolve(null); // No path found
                } else {
                    // Convert grid points back to pixel coordinates
                    const pixelPath = path.map(point => this.gridToPixel(point.x, point.y));
                    resolve(pixelPath);
                }
            });
        });
    }

    /**
     * Calculate paths - must be called every frame for async pathfinding
     */
    update() {
        this.easystar.calculate();
    }

    /**
     * Get next waypoint for an enemy to follow
     * Returns the direction to move (-1, 0, or 1) and whether to jump
     */
    getNextMove(enemy, path) {
        if (!path || path.length < 2) {
            return { moveX: 0, jump: false };
        }

        // Get current position in grid
        const currentGrid = this.pixelToGrid(enemy.x, enemy.y);

        // Find current position in path
        let currentIndex = 0;
        for (let i = 0; i < path.length; i++) {
            const pathGrid = this.pixelToGrid(path[i].x, path[i].y);
            if (pathGrid.x === currentGrid.x && pathGrid.y === currentGrid.y) {
                currentIndex = i;
                break;
            }
        }

        // Get next waypoint
        const nextIndex = Math.min(currentIndex + 1, path.length - 1);
        const nextPoint = path[nextIndex];
        const nextGrid = this.pixelToGrid(nextPoint.x, nextPoint.y);

        // Calculate direction
        const dx = nextPoint.x - enemy.x;
        const dy = nextPoint.y - enemy.y;

        // Determine horizontal movement
        let moveX = 0;
        if (Math.abs(dx) > 10) {
            moveX = dx > 0 ? 1 : -1;
        }

        // Determine if should jump
        // Jump if next waypoint is above current position
        const shouldJump = nextGrid.y < currentGrid.y - 0.5;

        return { moveX, jump: shouldJump };
    }
}
