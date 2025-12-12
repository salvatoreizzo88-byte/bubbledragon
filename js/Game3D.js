/**
 * Game3D.js - Babylon.js 3D Engine for Bubble Bobble 3D
 * Main game engine that handles 3D scene, rendering, and game loop
 */

export default class Game3D {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.audioManager = audioManager;

        // Initialize Babylon.js engine
        this.engine = new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Game state
        this.paused = false;
        this.gameOver = false;
        this.score = 0;
        this.levelIndex = 0;

        // Entity arrays
        this.enemies = [];
        this.bubbles = [];
        this.fruits = [];

        // Create the scene
        this.scene = this.createScene();

        // Start render loop
        this.engine.runRenderLoop(() => {
            if (!this.paused) {
                this.update();
            }
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        console.log('🎮 Game3D initialized with Babylon.js');
    }

    createScene() {
        const scene = new BABYLON.Scene(this.engine);

        // Set background color (dark purple like original)
        scene.clearColor = new BABYLON.Color4(0.1, 0.05, 0.2, 1);

        // === CAMERA ===
        // Fixed camera from above - no rotation, clear view of arena
        this.camera = new BABYLON.FreeCamera(
            'camera',
            new BABYLON.Vector3(0, 50, 25), // Position: very high for full arena view
            scene
        );
        // Look at center of arena
        this.camera.setTarget(new BABYLON.Vector3(0, 0, 0));
        // Disable user camera control (fixed camera)
        this.camera.inputs.clear();

        // === LIGHTING ===
        // Ambient light
        const ambientLight = new BABYLON.HemisphericLight(
            'ambientLight',
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        ambientLight.intensity = 0.5;
        ambientLight.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
        ambientLight.groundColor = new BABYLON.Color3(0.2, 0.1, 0.3);

        // Main directional light
        const mainLight = new BABYLON.DirectionalLight(
            'mainLight',
            new BABYLON.Vector3(-1, -2, -1),
            scene
        );
        mainLight.intensity = 0.8;
        mainLight.diffuse = new BABYLON.Color3(1, 0.9, 0.8);

        // === ARENA/ROOM ===
        this.createArena(scene);

        // === PLAYER ===
        this.createPlayer(scene);

        // === TEST ENEMY ===
        this.createTestEnemy(scene);

        return scene;
    }

    createArena(scene) {
        // Floor
        const floor = BABYLON.MeshBuilder.CreateGround(
            'floor',
            { width: 20, height: 20 },
            scene
        );
        const floorMat = new BABYLON.StandardMaterial('floorMat', scene);
        floorMat.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.4);
        floorMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.2);
        floor.material = floorMat;

        // Walls (4 sides)
        const wallHeight = 8;
        const wallThickness = 0.5;
        const arenaSize = 20;

        const wallMat = new BABYLON.StandardMaterial('wallMat', scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.6);
        wallMat.specularColor = new BABYLON.Color3(0.2, 0.1, 0.3);
        wallMat.alpha = 0.8;

        // Back wall
        const backWall = BABYLON.MeshBuilder.CreateBox('backWall', {
            width: arenaSize,
            height: wallHeight,
            depth: wallThickness
        }, scene);
        backWall.position = new BABYLON.Vector3(0, wallHeight / 2, -arenaSize / 2);
        backWall.material = wallMat;

        // Front wall (transparent for camera)
        const frontWall = BABYLON.MeshBuilder.CreateBox('frontWall', {
            width: arenaSize,
            height: wallHeight,
            depth: wallThickness
        }, scene);
        frontWall.position = new BABYLON.Vector3(0, wallHeight / 2, arenaSize / 2);
        frontWall.material = wallMat;
        frontWall.visibility = 0.3;

        // Left wall
        const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', {
            width: wallThickness,
            height: wallHeight,
            depth: arenaSize
        }, scene);
        leftWall.position = new BABYLON.Vector3(-arenaSize / 2, wallHeight / 2, 0);
        leftWall.material = wallMat;

        // Right wall
        const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', {
            width: wallThickness,
            height: wallHeight,
            depth: arenaSize
        }, scene);
        rightWall.position = new BABYLON.Vector3(arenaSize / 2, wallHeight / 2, 0);
        rightWall.material = wallMat;

        // === PLATFORMS ===
        this.createPlatforms(scene);
    }

    createPlatforms(scene) {
        const platformMat = new BABYLON.StandardMaterial('platformMat', scene);
        platformMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.8);
        platformMat.specularColor = new BABYLON.Color3(0.3, 0.2, 0.5);
        platformMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.15);

        // Create several platforms at different heights
        const platforms = [
            { x: 0, y: 2, z: 0, width: 8, depth: 3 },
            { x: -5, y: 4, z: -3, width: 5, depth: 2 },
            { x: 5, y: 4, z: -3, width: 5, depth: 2 },
            { x: 0, y: 6, z: -6, width: 10, depth: 2 },
            { x: -7, y: 3, z: 5, width: 4, depth: 2 },
            { x: 7, y: 3, z: 5, width: 4, depth: 2 },
        ];

        platforms.forEach((p, i) => {
            const platform = BABYLON.MeshBuilder.CreateBox(`platform${i}`, {
                width: p.width,
                height: 0.5,
                depth: p.depth
            }, scene);
            platform.position = new BABYLON.Vector3(p.x, p.y, p.z);
            platform.material = platformMat;
        });
    }

    createPlayer(scene) {
        // Placeholder: green dragon as a capsule
        const player = BABYLON.MeshBuilder.CreateCapsule('player', {
            height: 1.5,
            radius: 0.4
        }, scene);
        player.position = new BABYLON.Vector3(0, 1, 5);

        const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
        playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
        playerMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1);
        player.material = playerMat;

        this.player = player;

        // === PHYSICS CONFIG ===
        this.playerSpeed = 0.10;      // Reduced for better control
        this.jumpForce = 0.35;        // Jump strength
        this.gravity = 0.015;         // Gravity strength
        this.velocityY = 0;           // Vertical velocity
        this.grounded = true;         // Is player on ground?
        this.groundLevel = 1;         // Y position of ground

        // Joystick input (set from game3d.html)
        this.joystickX = 0;
        this.joystickY = 0;

        // Input handling
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            // Keyboard jump
            if (e.code === 'KeyW' || e.key === 'ArrowUp') {
                this.jump();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        console.log('🐉 Player created with jump physics');
    }

    // Jump function - called from button or keyboard
    jump() {
        if (this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
            console.log('🦘 Jump!');
        }
    }

    createTestEnemy(scene) {
        // Red enemy sphere
        const enemy = BABYLON.MeshBuilder.CreateSphere('enemy', {
            diameter: 1
        }, scene);
        enemy.position = new BABYLON.Vector3(-3, 3, -3);

        const enemyMat = new BABYLON.StandardMaterial('enemyMat', scene);
        enemyMat.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.3);
        enemyMat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.1);
        enemy.material = enemyMat;

        this.enemies.push({
            mesh: enemy,
            speed: 0.05,
            direction: new BABYLON.Vector3(1, 0, 0)
        });

        console.log('👾 Test enemy created');
    }

    update() {
        // Player movement
        this.updatePlayer();

        // Enemy AI (simple patrol)
        this.updateEnemies();

        // Update bubbles (movement, collision, capture)
        this.updateBubbles();

        // Update fruits (collection, expiration)
        this.updateFruits();

        // Check collisions
        this.checkCollisions();
    }

    updatePlayer() {
        if (!this.player) return;

        const moveDir = new BABYLON.Vector3(0, 0, 0);

        // WASD or Arrow keys (no vertical movement from up arrow, that's jump)
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            moveDir.z += 1;
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            moveDir.x -= 1;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            moveDir.x += 1;
        }

        // Virtual joystick input (mobile) - X inverted to match camera view
        if (this.joystickX !== undefined && this.joystickY !== undefined) {
            moveDir.x -= this.joystickX;  // X INVERTED (left/right)
            moveDir.z += this.joystickY;  // Z NORMAL (up/down)
        }

        // Normalize and apply speed (horizontal only)
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.scaleInPlace(this.playerSpeed);
            this.player.position.x += moveDir.x;
            this.player.position.z += moveDir.z;
        }

        // === VERTICAL PHYSICS (Gravity + Jump) ===
        // Apply gravity
        this.velocityY -= this.gravity;
        this.player.position.y += this.velocityY;

        // Ground collision (simple floor at groundLevel)
        if (this.player.position.y <= this.groundLevel) {
            this.player.position.y = this.groundLevel;
            this.velocityY = 0;
            this.grounded = true;
        }

        // Keep player in bounds (horizontal)
        const bounds = 9;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));
        // Camera is now fixed - no target update needed
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            // Simple patrol: move in direction, reverse at walls
            enemy.mesh.position.addInPlace(enemy.direction.scale(enemy.speed));

            // Reverse at walls
            if (Math.abs(enemy.mesh.position.x) > 8) {
                enemy.direction.x *= -1;
            }
            if (Math.abs(enemy.mesh.position.z) > 8) {
                enemy.direction.z *= -1;
            }
        });
    }

    checkCollisions() {
        if (!this.player) return;

        // Player-Enemy collision
        this.enemies.forEach(enemy => {
            const dist = BABYLON.Vector3.Distance(
                this.player.position,
                enemy.mesh.position
            );

            if (dist < 1.2 && !enemy.trapped) {
                console.log('💥 Player hit enemy!');
                // TODO: Implement damage/death
            }
        });
    }

    // Called when shooting bubble
    shootBubble() {
        const bubble = BABYLON.MeshBuilder.CreateSphere('bubble', {
            diameter: 1.0
        }, this.scene);

        bubble.position = this.player.position.clone();
        bubble.position.y += 0.5;

        const bubbleMat = new BABYLON.StandardMaterial('bubbleMat', this.scene);
        bubbleMat.diffuseColor = new BABYLON.Color3(0.3, 0.8, 1);
        bubbleMat.alpha = 0.5;
        bubbleMat.emissiveColor = new BABYLON.Color3(0.2, 0.5, 0.8);
        bubbleMat.specularColor = new BABYLON.Color3(1, 1, 1);
        bubble.material = bubbleMat;

        // Direction based on last movement (joystick or keys)
        let dirX = -this.joystickX || 0;
        let dirZ = this.joystickY || 0;

        // If no joystick input, shoot forward
        if (Math.abs(dirX) < 0.1 && Math.abs(dirZ) < 0.1) {
            dirZ = -1; // Default: shoot forward (up on screen)
        }

        // Normalize direction
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (len > 0) {
            dirX /= len;
            dirZ /= len;
        }

        this.bubbles.push({
            mesh: bubble,
            velocity: new BABYLON.Vector3(dirX * 0.30, 0, dirZ * 0.30), // FASTER
            lifetime: 300, // 5 seconds
            hasEnemy: false,
            trappedEnemy: null
        });

        console.log('🫧 Bubble shot!');
    }

    // Update all bubbles - movement and collision
    updateBubbles() {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];

            // Move bubble
            bubble.mesh.position.addInPlace(bubble.velocity);

            // Bubble floats up slightly
            bubble.mesh.position.y += 0.01;

            // Reduce lifetime
            bubble.lifetime--;

            // Check collision with enemies (if bubble doesn't have enemy yet)
            if (!bubble.hasEnemy) {
                for (let j = 0; j < this.enemies.length; j++) {
                    const enemy = this.enemies[j];
                    if (enemy.trapped) continue;

                    const dist = BABYLON.Vector3.Distance(
                        bubble.mesh.position,
                        enemy.mesh.position
                    );

                    if (dist < 2.0) { // Bigger capture radius
                        // Capture enemy!
                        console.log('🎯 Enemy captured in bubble!');
                        bubble.hasEnemy = true;
                        bubble.trappedEnemy = enemy;
                        enemy.trapped = true;
                        enemy.mesh.setEnabled(false); // Hide enemy

                        // Change bubble color to show it has enemy
                        bubble.mesh.material.diffuseColor = new BABYLON.Color3(1, 0.5, 0.8);
                        bubble.mesh.material.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.3);

                        // Slow down and enlarge bubble with enemy
                        bubble.velocity.scaleInPlace(0.2);
                        bubble.mesh.scaling = new BABYLON.Vector3(1.5, 1.5, 1.5);
                    }
                }
            }

            // If bubble has enemy, check if player touches it to pop
            if (bubble.hasEnemy) {
                const distToPlayer = BABYLON.Vector3.Distance(
                    bubble.mesh.position,
                    this.player.position
                );

                if (distToPlayer < 2.5) { // Bigger pop radius
                    // Pop bubble and spawn fruit!
                    console.log('🍎 Bubble popped! Fruit spawned!');
                    this.spawnFruit(bubble.mesh.position.clone());

                    // Remove enemy from game
                    const enemyIndex = this.enemies.indexOf(bubble.trappedEnemy);
                    if (enemyIndex > -1) {
                        this.enemies.splice(enemyIndex, 1);
                    }

                    // Remove bubble
                    bubble.mesh.dispose();
                    this.bubbles.splice(i, 1);
                    continue;
                }
            }

            // Remove bubble if lifetime expired or out of bounds
            if (bubble.lifetime <= 0 ||
                Math.abs(bubble.mesh.position.x) > 15 ||
                Math.abs(bubble.mesh.position.z) > 15 ||
                bubble.mesh.position.y > 15) {

                // If bubble had enemy, release it
                if (bubble.trappedEnemy) {
                    bubble.trappedEnemy.trapped = false;
                    bubble.trappedEnemy.mesh.setEnabled(true);
                    bubble.trappedEnemy.mesh.position = bubble.mesh.position.clone();
                }

                bubble.mesh.dispose();
                this.bubbles.splice(i, 1);
            }
        }
    }

    // Spawn fruit when bubble pops
    spawnFruit(position) {
        const fruit = BABYLON.MeshBuilder.CreateSphere('fruit', {
            diameter: 0.6
        }, this.scene);
        fruit.position = position;

        const fruitMat = new BABYLON.StandardMaterial('fruitMat', this.scene);
        fruitMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3); // Red apple
        fruitMat.emissiveColor = new BABYLON.Color3(0.3, 0.1, 0.1);
        fruit.material = fruitMat;

        this.fruits.push({
            mesh: fruit,
            lifetime: 600 // 10 seconds
        });

        this.score += 100;
        console.log(`🍎 Score: ${this.score}`);
    }

    // Update fruits
    updateFruits() {
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];

            // Check if player collects fruit
            const dist = BABYLON.Vector3.Distance(
                this.player.position,
                fruit.mesh.position
            );

            if (dist < 1.0) {
                console.log('🍎 Fruit collected!');
                this.score += 100;
                fruit.mesh.dispose();
                this.fruits.splice(i, 1);
                continue;
            }

            // Fruit falls slowly
            if (fruit.mesh.position.y > 0.5) {
                fruit.mesh.position.y -= 0.02;
            }

            // Remove if expired
            fruit.lifetime--;
            if (fruit.lifetime <= 0) {
                fruit.mesh.dispose();
                this.fruits.splice(i, 1);
            }
        }
    }

    dispose() {
        this.engine.dispose();
    }
}
