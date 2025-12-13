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
        this.lives = 3;           // Player lives
        this.damageCooldown = 0;  // Invincibility after hit
        this.godMode = true;      // TEST MODE: player immortale
        this.levelIndex = 0;

        // Entity arrays
        this.enemies = [];
        this.bubbles = [];
        this.fruits = [];
        this.platforms = [];  // For collision detection

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
        // ArcRotate camera - can be rotated by touch/drag
        this.camera = new BABYLON.ArcRotateCamera(
            'camera',
            Math.PI / 2,  // alpha (horizontal angle)
            Math.PI / 4,  // beta (vertical angle - 45 degrees)
            40,           // radius (distance from target)
            new BABYLON.Vector3(0, 2, 0), // target (center of arena)
            scene
        );
        // Enable touch/mouse camera control
        this.camera.attachControl(this.canvas, true);
        // Limits
        this.camera.lowerRadiusLimit = 20;
        this.camera.upperRadiusLimit = 60;
        this.camera.lowerBetaLimit = 0.3;   // Min vertical angle
        this.camera.upperBetaLimit = Math.PI / 2.5; // Max vertical angle

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
        wallMat.diffuseTexture = new BABYLON.Texture('assets/textures/slime_wall.png', scene);
        wallMat.diffuseTexture.uScale = 4;
        wallMat.diffuseTexture.vScale = 2;
        wallMat.specularColor = new BABYLON.Color3(0.4, 0.2, 0.6);
        wallMat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.15);
        wallMat.alpha = 0.9;

        // Back wall
        const backWall = BABYLON.MeshBuilder.CreateBox('backWall', {
            width: arenaSize,
            height: wallHeight,
            depth: wallThickness
        }, scene);
        backWall.position = new BABYLON.Vector3(0, wallHeight / 2, -arenaSize / 2);
        backWall.material = wallMat.clone('backWallMat');

        // Front wall
        const frontWall = BABYLON.MeshBuilder.CreateBox('frontWall', {
            width: arenaSize,
            height: wallHeight,
            depth: wallThickness
        }, scene);
        frontWall.position = new BABYLON.Vector3(0, wallHeight / 2, arenaSize / 2);
        frontWall.material = wallMat.clone('frontWallMat');

        // Left wall
        const leftWall = BABYLON.MeshBuilder.CreateBox('leftWall', {
            width: wallThickness,
            height: wallHeight,
            depth: arenaSize
        }, scene);
        leftWall.position = new BABYLON.Vector3(-arenaSize / 2, wallHeight / 2, 0);
        leftWall.material = wallMat.clone('leftWallMat');

        // Right wall
        const rightWall = BABYLON.MeshBuilder.CreateBox('rightWall', {
            width: wallThickness,
            height: wallHeight,
            depth: arenaSize
        }, scene);
        rightWall.position = new BABYLON.Vector3(arenaSize / 2, wallHeight / 2, 0);
        rightWall.material = wallMat.clone('rightWallMat');

        // Store walls for dynamic transparency
        this.walls = { front: frontWall, back: backWall, left: leftWall, right: rightWall };

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

            // Save platform data for collision
            this.platforms.push({
                mesh: platform,
                x: p.x,
                y: p.y,
                z: p.z,
                width: p.width,
                depth: p.depth,
                height: 0.5
            });
        });
    }

    createPlayer(scene) {
        // Create placeholder while loading model
        const placeholder = BABYLON.MeshBuilder.CreateCapsule('player', {
            height: 1.5,
            radius: 0.4
        }, scene);
        placeholder.position = new BABYLON.Vector3(0, 1, 5);
        placeholder.isVisible = false; // Hide placeholder

        this.player = placeholder;

        // Load Dragon 3D model
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/",
            "Dragon.glb",
            scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                console.log('🐉 Dragon model loaded!');

                // Stop all animations to prevent spinning
                animationGroups.forEach(ag => ag.stop());

                // Get root mesh
                const dragonRoot = meshes[0];
                dragonRoot.parent = placeholder;
                dragonRoot.position = new BABYLON.Vector3(0, -0.75, 0);
                dragonRoot.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
                dragonRoot.rotation.y = Math.PI; // Rotate 180 degrees to face forward

                // Store reference for rotation
                this.playerModel = dragonRoot;
            },
            null,
            (scene, message, exception) => {
                console.warn('Dragon model failed to load, using placeholder:', message);
                placeholder.isVisible = true;
                const playerMat = new BABYLON.StandardMaterial('playerMat', scene);
                playerMat.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
                playerMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.1);
                placeholder.material = playerMat;
            }
        );

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
        // Create multiple enemies at random positions
        const enemyPositions = [
            new BABYLON.Vector3(-6, 1, -6),
            new BABYLON.Vector3(6, 1, -6),
            new BABYLON.Vector3(-6, 1, 6),
            new BABYLON.Vector3(6, 1, 6),
            new BABYLON.Vector3(0, 1, -8),
        ];

        const enemyColors = [
            new BABYLON.Color3(0.9, 0.2, 0.2), // Red
            new BABYLON.Color3(0.2, 0.9, 0.2), // Green
            new BABYLON.Color3(0.2, 0.2, 0.9), // Blue
            new BABYLON.Color3(0.9, 0.9, 0.2), // Yellow
            new BABYLON.Color3(0.9, 0.2, 0.9), // Magenta
        ];

        // Create placeholders first
        enemyPositions.forEach((pos, i) => {
            const placeholder = BABYLON.MeshBuilder.CreateSphere(`enemy${i}`, {
                diameter: 1.2
            }, scene);
            placeholder.position = pos;
            placeholder.isVisible = false;

            this.enemies.push({
                mesh: placeholder,
                speed: 0.03 + Math.random() * 0.02,
                trapped: false,
                colorIndex: i
            });
        });

        // Load Slime model and attach to each enemy
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/",
            "Slime.glb",
            scene,
            (meshes) => {
                console.log('👾 Slime model loaded!');

                const slimeRoot = meshes[0];
                slimeRoot.setEnabled(false); // Hide original

                // Clone for each enemy
                this.enemies.forEach((enemy, i) => {
                    const clone = slimeRoot.clone(`slime${i}`);
                    clone.parent = enemy.mesh;
                    clone.position = new BABYLON.Vector3(0, -0.6, 0);
                    clone.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
                    clone.setEnabled(true);

                    // Tint with color
                    if (clone.material) {
                        const mat = clone.material.clone(`slimeMat${i}`);
                        mat.albedoColor = enemyColors[i % enemyColors.length];
                        clone.material = mat;
                    }

                    enemy.model = clone;
                });
            },
            null,
            (scene, message) => {
                console.warn('Slime model failed, showing placeholders:', message);
                this.enemies.forEach((enemy, i) => {
                    enemy.mesh.isVisible = true;
                    const mat = new BABYLON.StandardMaterial(`enemyMat${i}`, scene);
                    mat.diffuseColor = enemyColors[i % enemyColors.length];
                    mat.emissiveColor = enemyColors[i % enemyColors.length].scale(0.3);
                    enemy.mesh.material = mat;
                });
            }
        );

        console.log(`👾 ${enemyPositions.length} enemies created!`);
    }

    update() {
        if (this.gameOver) return;

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

        // Update wall transparency based on camera angle
        this.updateWallTransparency();

        // Check if level complete
        this.checkLevelComplete();
    }

    updateWallTransparency() {
        if (!this.walls || !this.camera) return;

        const alpha = this.camera.alpha;
        const beta = this.camera.beta;

        // Camera direction vector
        const camDirX = Math.sin(alpha);
        const camDirZ = Math.cos(alpha);

        const fullOpacity = 0.9;
        const lowOpacity = 0.15;

        // When camera is low (beta > 0.8), be more aggressive with transparency
        const isLowCamera = beta > 0.8;

        if (isLowCamera) {
            // When low, make any wall the camera is looking towards transparent
            // Front (+Z): transparent if camDirZ > -0.5 (looking towards or sideways)
            this.walls.front.visibility = camDirZ > -0.5 ? lowOpacity : fullOpacity;
            // Back (-Z): transparent if camDirZ < 0.5
            this.walls.back.visibility = camDirZ < 0.5 ? lowOpacity : fullOpacity;
            // Right (+X): transparent if camDirX > -0.5
            this.walls.right.visibility = camDirX > -0.5 ? lowOpacity : fullOpacity;
            // Left (-X): transparent if camDirX < 0.5
            this.walls.left.visibility = camDirX < 0.5 ? lowOpacity : fullOpacity;
        } else {
            // When camera is high, only make wall directly in front transparent
            this.walls.front.visibility = camDirZ > 0.5 ? lowOpacity : fullOpacity;
            this.walls.back.visibility = camDirZ < -0.5 ? lowOpacity : fullOpacity;
            this.walls.right.visibility = camDirX > 0.5 ? lowOpacity : fullOpacity;
            this.walls.left.visibility = camDirX < -0.5 ? lowOpacity : fullOpacity;
        }
    }

    checkLevelComplete() {
        // Level complete when all enemies are defeated
        if (this.enemies.length === 0 && !this.levelTransition) {
            this.levelTransition = true;
            this.levelIndex++;
            console.log(`🎉 Level ${this.levelIndex} complete!`);

            // Bonus points
            this.score += 500 * this.levelIndex;

            // Spawn new enemies after delay
            setTimeout(() => {
                this.spawnEnemies();
                this.levelTransition = false;
            }, 2000);
        }
    }

    spawnEnemies() {
        // Number of enemies increases with level
        const numEnemies = Math.min(5 + this.levelIndex, 10);

        // Speed increases with level
        const baseSpeed = 0.03 + (this.levelIndex * 0.005);

        const positions = [
            new BABYLON.Vector3(-6, 1, -6),
            new BABYLON.Vector3(6, 1, -6),
            new BABYLON.Vector3(-6, 1, 6),
            new BABYLON.Vector3(6, 1, 6),
            new BABYLON.Vector3(0, 1, -8),
            new BABYLON.Vector3(-7, 1, 0),
            new BABYLON.Vector3(7, 1, 0),
            new BABYLON.Vector3(0, 1, 7),
            new BABYLON.Vector3(-4, 1, -4),
            new BABYLON.Vector3(4, 1, 4),
        ];

        const colors = [
            new BABYLON.Color3(0.9, 0.2, 0.2),
            new BABYLON.Color3(0.2, 0.9, 0.2),
            new BABYLON.Color3(0.2, 0.2, 0.9),
            new BABYLON.Color3(0.9, 0.9, 0.2),
            new BABYLON.Color3(0.9, 0.2, 0.9),
            new BABYLON.Color3(0.2, 0.9, 0.9),
            new BABYLON.Color3(0.9, 0.5, 0.2),
            new BABYLON.Color3(0.5, 0.9, 0.2),
            new BABYLON.Color3(0.9, 0.2, 0.5),
            new BABYLON.Color3(0.5, 0.2, 0.9),
        ];

        // Create placeholder meshes
        for (let i = 0; i < numEnemies; i++) {
            const placeholder = BABYLON.MeshBuilder.CreateSphere(`enemy_l${this.levelIndex}_${i}`, {
                diameter: 1.2
            }, this.scene);
            placeholder.position = positions[i % positions.length].clone();
            placeholder.isVisible = false;

            this.enemies.push({
                mesh: placeholder,
                speed: baseSpeed + Math.random() * 0.01,
                trapped: false,
                colorIndex: i
            });
        }

        // Load Slime model and clone for each enemy
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/",
            "Slime.glb",
            this.scene,
            (meshes) => {
                const slimeRoot = meshes[0];
                slimeRoot.setEnabled(false);

                // Clone for each new enemy
                this.enemies.forEach((enemy, i) => {
                    if (!enemy.model) { // Only if no model yet
                        const clone = slimeRoot.clone(`slime_l${this.levelIndex}_${i}`);
                        clone.parent = enemy.mesh;
                        clone.position = new BABYLON.Vector3(0, -0.6, 0);
                        clone.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
                        clone.setEnabled(true);
                        enemy.model = clone;
                    }
                });
            }
        );

        console.log(`👾 Level ${this.levelIndex + 1}: ${numEnemies} enemies spawned!`);
    }

    updatePlayer() {
        if (!this.player) return;

        let inputX = 0;
        let inputZ = 0;

        // WASD or Arrow keys
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            inputZ += 1;
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            inputZ -= 1;
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            inputX -= 1;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            inputX += 1;
        }

        // Virtual joystick input (mobile) - INVERTED to fix directions
        if (this.joystickX !== undefined && this.joystickY !== undefined) {
            inputX -= this.joystickX;
            inputZ += this.joystickY;
        }

        // Transform input relative to camera direction
        if (Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01) {
            // Get camera angle (alpha is horizontal rotation)
            const cameraAngle = this.camera.alpha - Math.PI / 2;

            // Rotate input vector by camera angle
            const cos = Math.cos(cameraAngle);
            const sin = Math.sin(cameraAngle);

            const rotatedX = inputX * cos - inputZ * sin;
            const rotatedZ = inputX * sin + inputZ * cos;

            // Normalize and apply speed
            const len = Math.sqrt(rotatedX * rotatedX + rotatedZ * rotatedZ);
            if (len > 0) {
                this.player.position.x += (rotatedX / len) * this.playerSpeed;
                this.player.position.z += (rotatedZ / len) * this.playerSpeed;

                // Rotate player to face movement direction (+ PI to compensate model orientation)
                const targetAngle = Math.atan2(rotatedX, rotatedZ) + Math.PI;
                this.player.rotation.y = targetAngle;
            }
        }

        // === VERTICAL PHYSICS (Gravity + Jump) ===
        // Apply gravity
        this.velocityY -= this.gravity;
        this.player.position.y += this.velocityY;

        // Platform collision check
        let onPlatform = false;
        const playerRadius = 0.4;
        const playerFeet = this.player.position.y - 0.75; // Bottom of player capsule

        for (const p of this.platforms) {
            const platformTop = p.y + p.height / 2;
            const halfW = p.width / 2;
            const halfD = p.depth / 2;

            // Check if player is above platform and within bounds
            if (this.player.position.x >= p.x - halfW &&
                this.player.position.x <= p.x + halfW &&
                this.player.position.z >= p.z - halfD &&
                this.player.position.z <= p.z + halfD) {

                // If falling onto platform
                if (this.velocityY <= 0 && playerFeet <= platformTop && playerFeet > platformTop - 0.5) {
                    this.player.position.y = platformTop + 0.75;
                    this.velocityY = 0;
                    this.grounded = true;
                    onPlatform = true;
                    break;
                }
            }
        }

        // Ground collision (simple floor at groundLevel)
        if (!onPlatform && this.player.position.y <= this.groundLevel) {
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
        if (!this.player) return;

        this.enemies.forEach(enemy => {
            // Skip trapped enemies
            if (enemy.trapped) return;

            // Initialize enemy physics if not exists
            if (enemy.velocityY === undefined) {
                enemy.velocityY = 0;
                enemy.grounded = true;
            }

            // Chase player AI
            const dx = this.player.position.x - enemy.mesh.position.x;
            const dz = this.player.position.z - enemy.mesh.position.z;
            const dy = this.player.position.y - enemy.mesh.position.y;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 0.5) {
                // Normalize direction to player
                const dirX = dx / distance;
                const dirZ = dz / distance;

                // Move towards player
                enemy.mesh.position.x += dirX * enemy.speed;
                enemy.mesh.position.z += dirZ * enemy.speed;

                // Rotate enemy to face movement direction
                enemy.mesh.rotation.y = Math.atan2(dirX, dirZ);
            }

            // Jump if player is above and enemy is grounded
            if (dy > 1.5 && enemy.grounded && Math.random() < 0.02) {
                enemy.velocityY = 0.25; // Jump force
                enemy.grounded = false;
            }

            // Apply gravity
            enemy.velocityY -= 0.01;
            enemy.mesh.position.y += enemy.velocityY;

            // Platform collision for enemies
            let onPlatform = false;
            const enemyFeet = enemy.mesh.position.y - 0.6;

            for (const p of this.platforms) {
                const platformTop = p.y + p.height / 2;
                const halfW = p.width / 2;
                const halfD = p.depth / 2;

                if (enemy.mesh.position.x >= p.x - halfW &&
                    enemy.mesh.position.x <= p.x + halfW &&
                    enemy.mesh.position.z >= p.z - halfD &&
                    enemy.mesh.position.z <= p.z + halfD) {

                    if (enemy.velocityY <= 0 && enemyFeet <= platformTop && enemyFeet > platformTop - 0.5) {
                        enemy.mesh.position.y = platformTop + 0.6;
                        enemy.velocityY = 0;
                        enemy.grounded = true;
                        onPlatform = true;
                        break;
                    }
                }
            }

            // Ground collision
            if (!onPlatform && enemy.mesh.position.y <= 1) {
                enemy.mesh.position.y = 1;
                enemy.velocityY = 0;
                enemy.grounded = true;
            }

            // Stay in bounds (inside walls)
            enemy.mesh.position.x = Math.max(-8, Math.min(8, enemy.mesh.position.x));
            enemy.mesh.position.z = Math.max(-8, Math.min(8, enemy.mesh.position.z));
        });
    }

    checkCollisions() {
        if (!this.player || this.gameOver) return;

        // Decrease damage cooldown
        if (this.damageCooldown > 0) {
            this.damageCooldown--;
            // Player invincibility flash - scale the player model instead of material
            if (this.playerModel) {
                const flash = this.damageCooldown % 10 < 5 ? 0.4 : 0.5;
                this.playerModel.scaling = new BABYLON.Vector3(flash, flash, flash);
            }
        } else if (this.playerModel) {
            // Reset scale when not invincible
            this.playerModel.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
        }

        // Player-Enemy collision
        this.enemies.forEach(enemy => {
            if (enemy.trapped) return; // Skip trapped enemies

            const dist = BABYLON.Vector3.Distance(
                this.player.position,
                enemy.mesh.position
            );

            if (dist < 1.5 && this.damageCooldown <= 0 && !this.godMode) {
                // Take damage! (skip if godMode)
                this.lives--;
                this.damageCooldown = 90; // 1.5 seconds invincibility
                console.log(`💔 Player hit! Lives: ${this.lives}`);

                // Knock player back
                const dx = this.player.position.x - enemy.mesh.position.x;
                const dz = this.player.position.z - enemy.mesh.position.z;
                const len = Math.sqrt(dx * dx + dz * dz) || 1;
                this.player.position.x += (dx / len) * 2;
                this.player.position.z += (dz / len) * 2;

                // Check game over
                if (this.lives <= 0) {
                    this.gameOver = true;
                    console.log('💀 GAME OVER!');
                }
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

            // Remove bubble if lifetime expired or out of bounds (arena walls)
            if (bubble.lifetime <= 0 ||
                Math.abs(bubble.mesh.position.x) > 9 ||
                Math.abs(bubble.mesh.position.z) > 9 ||
                bubble.mesh.position.y > 10) {

                // If bubble had enemy, release it inside arena
                if (bubble.trappedEnemy) {
                    bubble.trappedEnemy.trapped = false;
                    bubble.trappedEnemy.mesh.setEnabled(true);
                    // Clamp position to inside arena
                    const releasePos = bubble.mesh.position.clone();
                    releasePos.x = Math.max(-8, Math.min(8, releasePos.x));
                    releasePos.z = Math.max(-8, Math.min(8, releasePos.z));
                    releasePos.y = 1;
                    bubble.trappedEnemy.mesh.position = releasePos;
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
