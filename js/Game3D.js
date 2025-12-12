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
        // ArcRotate camera for now (can switch to FollowCamera later)
        this.camera = new BABYLON.ArcRotateCamera(
            'camera',
            Math.PI / 2,  // alpha (horizontal rotation)
            Math.PI / 3,  // beta (vertical angle)
            25,           // radius (distance from target)
            new BABYLON.Vector3(0, 0, 0), // target
            scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 50;

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
        this.playerSpeed = 0.15;
        this.playerVelocity = new BABYLON.Vector3(0, 0, 0);

        // Input handling
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        console.log('🐉 Player created');
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

        // Check collisions
        this.checkCollisions();
    }

    updatePlayer() {
        if (!this.player) return;

        const moveDir = new BABYLON.Vector3(0, 0, 0);

        // WASD or Arrow keys
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            moveDir.z -= 1;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            moveDir.z += 1;
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            moveDir.x -= 1;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            moveDir.x += 1;
        }

        // Virtual joystick input (mobile)
        if (this.joystickX !== undefined && this.joystickY !== undefined) {
            moveDir.x += this.joystickX;
            moveDir.z += this.joystickY;
        }

        // Normalize and apply speed
        if (moveDir.length() > 0) {
            moveDir.normalize();
            moveDir.scaleInPlace(this.playerSpeed);
            this.player.position.addInPlace(moveDir);
        }

        // Keep player in bounds
        const bounds = 9;
        this.player.position.x = Math.max(-bounds, Math.min(bounds, this.player.position.x));
        this.player.position.z = Math.max(-bounds, Math.min(bounds, this.player.position.z));

        // Update camera target
        this.camera.target = this.player.position.clone();
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

            if (dist < 1.2) {
                console.log('💥 Player hit enemy!');
                // TODO: Implement damage/death
            }
        });
    }

    // Called when shooting bubble
    shootBubble() {
        const bubble = BABYLON.MeshBuilder.CreateSphere('bubble', {
            diameter: 0.8
        }, this.scene);

        bubble.position = this.player.position.clone();
        bubble.position.y += 0.5;

        const bubbleMat = new BABYLON.StandardMaterial('bubbleMat', this.scene);
        bubbleMat.diffuseColor = new BABYLON.Color3(0.3, 0.7, 1);
        bubbleMat.alpha = 0.6;
        bubbleMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
        bubble.material = bubbleMat;

        // Direction player is facing (simplified: always forward -Z)
        const direction = new BABYLON.Vector3(0, 0, -1);

        this.bubbles.push({
            mesh: bubble,
            velocity: direction.scale(0.2),
            lifetime: 180 // frames
        });

        console.log('🫧 Bubble shot!');
    }

    dispose() {
        this.engine.dispose();
    }
}
