import Game from './Game.js';
import GameState from './GameState.js';
import LevelGenerator from './LevelGenerator.js';
import UserManager from './UserManager.js';
import Database from './Database.js';
import AudioManager from './AudioManager.js';
import AchievementManager from './AchievementManager.js';

// === LOADING SCREEN CONTROLLER ===
const loadingScreen = {
    element: null,
    bar: null,
    text: null,
    tip: null,
    progress: 0,
    tips: [
        "💡 TIP: Raccogli la frutta per guadagnare XP!",
        "💡 TIP: Intrappolati i nemici nelle bolle per sconfiggerli!",
        "💡 TIP: Più livelli completi, più potenziamenti sblocchi!",
        "💡 TIP: I dragocoin ti permettono di potenziare il draghetto!",
        "💡 TIP: Controlla gli obiettivi per ottenere ricompense!",
        "💡 TIP: Il tuo livello draghetto determina la tua posizione in classifica!"
    ],

    init() {
        this.element = document.getElementById('loading-screen');
        this.bar = document.getElementById('loading-bar');
        this.text = document.getElementById('loading-text');
        this.tip = document.getElementById('loading-tip');

        // Set random tip
        if (this.tip) {
            this.tip.textContent = this.tips[Math.floor(Math.random() * this.tips.length)];
        }
    },

    setProgress(percent, message) {
        this.progress = Math.min(100, percent);
        if (this.bar) this.bar.style.width = `${this.progress}%`;
        if (this.text && message) this.text.textContent = message;
    },

    hide() {
        if (this.element) {
            this.element.style.opacity = '0';
            this.element.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.element.style.display = 'none';
            }, 500);
        }
    }
};

window.addEventListener('load', () => {
    // Initialize loading screen
    loadingScreen.init();
    loadingScreen.setProgress(10, 'Inizializzazione...');

    // Init Database
    setTimeout(() => {
        loadingScreen.setProgress(30, 'Connessione al server...');
        Database.init();
    }, 100);
    window.Database = Database; // Expose for Game.js leaderboard access

    // Game Init
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    const audioManager = new AudioManager();
    const game = new Game(canvas.width, canvas.height, audioManager);

    // Initialize User
    const userManager = new UserManager();
    const currentUser = userManager.getUsername();

    // DOM ELEMENTS - Declared early for scope availability
    const authBtn = document.getElementById('auth-btn');
    const authModal = document.getElementById('auth-modal');

    // Login view elements
    const loginView = document.getElementById('login-view');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authStatus = document.getElementById('auth-status');
    const btnLogin = document.getElementById('btn-login');
    const btnAuthCancel = document.getElementById('btn-auth-cancel');
    const switchToRegister = document.getElementById('switch-to-register');

    // Register view elements
    const registerView = document.getElementById('register-view');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');
    const registerStatus = document.getElementById('register-status');
    const btnRegister = document.getElementById('btn-register');
    const btnRegisterCancel = document.getElementById('btn-register-cancel');
    const switchToLogin = document.getElementById('switch-to-login');

    // UI Elements
    const userDisplay = document.getElementById('user-display');
    let isUserDataLoaded = false; // Flag to prevent flash of old username

    const updateDisplay = () => {
        if (userDisplay) {
            if (!isUserDataLoaded) {
                userDisplay.innerText = 'GIOCATORE: ...';
            } else {
                userDisplay.innerText = `GIOCATORE: ${userManager.getUsername()}`;
            }
        }

        const profileBar = document.querySelector('.profile-bar');

        if (Database.auth && Database.auth.currentUser) {
            // LOGGED IN STATE
            if (authBtn) authBtn.innerText = "LOGOUT";
            if (profileBar) profileBar.classList.add('logged-in');
        } else {
            // GUEST STATE
            if (authBtn) authBtn.innerText = "LOGIN / REGISTER";
            if (profileBar) profileBar.classList.remove('logged-in');
        }
    };
    updateDisplay();

    // Initialize GameState with specific storage key for this user
    let userStorageKey = `bubbleBobbleSave_${userManager.getUsername()}`;
    let gameState = new GameState(userStorageKey);

    // Initialize AchievementManager
    const achievementManager = new AchievementManager(gameState);
    window.achievementManager = achievementManager; // Expose for Game.js access

    // === AUTH STATE PERSISTENCE ===
    // Check if user is already logged in when app opens
    setTimeout(() => {
        loadingScreen.setProgress(50, 'Controllo autenticazione...');
        Database.onAuthStateChanged(async (user) => {
            if (user) {
                // User is logged in - restore session
                console.log("Sessione utente attiva:", user.displayName || user.email);

                // Get user data from Firestore using UID as document ID
                const userData = await Database.getUserData(user.uid);

                // Update User Manager with displayName
                const displayName = user.displayName || (userData && userData.username) || "Player";
                userManager.setUsername(displayName);

                // Update localStorage to prevent guest username from being used
                localStorage.setItem('bubbleBobbleUser', displayName);

                // Update Game State with UID-based storage
                userStorageKey = `bubbleBobbleSave_${user.uid}`;
                gameState = new GameState(userStorageKey);
                gameState.username = displayName; // Set username for display

                // Load cloud data if available
                if (userData) {
                    // Supporta entrambi i nomi (italiani e inglesi)
                    gameState.coins = userData.monete !== undefined ? userData.monete : (userData.coins || 0);
                    gameState.dragocoin = userData.dragocoin || 0;
                    gameState.inventory = userData.inventario || userData.inventory || [];
                    gameState.maxLevel = userData.livelloMax || userData.maxLevel || 1;
                    gameState.playerLevel = userData.livelloGiocatore || userData.playerLevel || 1;
                    gameState.playerXP = userData.puntiXP || userData.playerXP || 0;
                    gameState.lastLoginDate = userData.ultimoLogin || userData.lastLoginDate || null;
                    gameState.loginStreak = userData.serieAccessi || userData.loginStreak || 0;
                    gameState.tutorialCompleted = userData.tutorialCompletato || userData.tutorialCompleted || false;
                    gameState.unlockedAchievements = userData.obiettiviSbloccati || userData.unlockedAchievements || [];

                    // Load stats from cloud
                    if (userData.statistiche || userData.stats) {
                        const cloudStats = userData.statistiche || userData.stats;
                        gameState.stats = {
                            speedLevel: cloudStats.speedLevel || 0,
                            enemiesTrapped: cloudStats.enemiesTrapped || cloudStats.nemiciCatturati || 0,
                            totalCoinsEarned: cloudStats.totalCoinsEarned || cloudStats.moneteTotali || 0,
                            totalFruitCollected: cloudStats.totalFruitCollected || cloudStats.fruttaRaccolta || 0,
                            gamesPlayed: cloudStats.gamesPlayed || cloudStats.partiteGiocate || 0,
                            levelsCompleted: cloudStats.levelsCompleted || cloudStats.livelliCompletati || 0,
                            powerupsCollected: cloudStats.powerupsCollected || cloudStats.powerupRaccolti || 0,
                            totalDeaths: cloudStats.totalDeaths || cloudStats.mortiTotali || 0
                        };
                    }

                    gameState.isLoaded = true;
                    console.log("✅ Dati utente autenticato caricati, stats:", gameState.stats);
                } else {
                    gameState.isLoaded = true; // Mark as loaded even if no data (new user)
                    console.log("📭 Nessun dato cloud per utente autenticato");
                }

                // Update UI
                isUserDataLoaded = true;
                loadingScreen.setProgress(90, 'Preparazione interfaccia...');
                updateDisplay();
                updatePlayerLevelDisplay();

                // Refresh Preview with correct level
                let latestLevel = Math.min(gameState.maxLevel - 1, maxLevels - 1);
                if (latestLevel < 0) latestLevel = 0;
                renderPreview(latestLevel);

                // Hide loading screen
                loadingScreen.setProgress(100, 'Pronto!');
                setTimeout(() => loadingScreen.hide(), 300);
                // Daily reward is now claimed manually from Objectives section
                // No automatic popup
            } else {
                // User is not logged in - guest mode
                console.log("Nessun utente loggato - modalità ospite");
                isUserDataLoaded = true;
                loadingScreen.setProgress(90, 'Preparazione interfaccia...');
                updateDisplay();

                // Hide loading screen
                loadingScreen.setProgress(100, 'Pronto!');
                setTimeout(() => loadingScreen.hide(), 300);
            }
        });
    }, 200); // Wait for Database.init() to complete

    // NOTE: Cloud sync for guest users is now handled directly in onAuthStateChanged
    // When user is null (not authenticated), we load guest data there
    // This eliminates the race condition that was causing user reset issues


    // === DAILY REWARD ===
    // Daily reward is now managed in the Objectives section (achievements screen)
    // No automatic popup - user claims manually from Objectives
    // USERNAME CHANGE LOGIC... (keep existing)

    // Carousel Logic
    let currentPreviewLevel = 0;
    const maxLevels = LevelGenerator.templates.length;
    const previewCanvas = document.getElementById('level-preview');
    const previewCtx = previewCanvas ? previewCanvas.getContext('2d') : null;
    const levelLabel = document.getElementById('level-label');
    const startBtn = document.getElementById('start-btn'); // Needed to disable

    function renderPreview(levelIndex) {
        if (!previewCtx) return;

        // Clear
        previewCtx.fillStyle = '#000000';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Check Locked State
        // levelIndex is 0-based, maxLevel is 1-based.
        // If levelIndex + 1 > maxLevel, it is locked.
        const isLocked = (levelIndex + 1) > gameState.maxLevel;

        const map = LevelGenerator.generate(levelIndex);
        const rows = map.length;
        const cols = map[0].length;

        const tileW = previewCanvas.width / cols;
        const tileH = previewCanvas.height / rows;

        // Draw Walls
        previewCtx.fillStyle = isLocked ? '#555555' : '#ffffff'; // Dimmer if locked
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (map[y][x] === 1) {
                    previewCtx.fillRect(x * tileW, y * tileH, tileW, tileH);
                }
            }
        }

        // Draw Lock if looked
        if (isLocked) {
            previewCtx.fillStyle = 'red';
            previewCtx.font = '40px sans-serif';
            previewCtx.textAlign = 'center';
            previewCtx.textBaseline = 'middle';
            previewCtx.fillText('🔒', previewCanvas.width / 2, previewCanvas.height / 2);
        }

        // Update Label
        if (levelLabel) levelLabel.innerText = 'LIVELLO ' + (levelIndex + 1) + (isLocked ? ' (BLOCCATO)' : '');
        currentPreviewLevel = levelIndex;

        // Disable/Enable Start Button
        if (startBtn) {
            if (isLocked) {
                startBtn.disabled = true;
                startBtn.style.opacity = '0.5';
                startBtn.style.cursor = 'not-allowed';
            } else {
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
            }
        }
    }

    // Carousel Buttons Logic
    const prevBtn = document.getElementById('prev-level-btn');
    const nextBtn = document.getElementById('next-level-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            audioManager.playSound('click'); // Generic click sound if implemented, or we can use specific tones
            if (currentPreviewLevel > 0) {
                currentPreviewLevel--;
                renderPreview(currentPreviewLevel);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            audioManager.playSound('click');
            // Check if next level is unlocked
            // For preview, maybe we allow seeing all? Or only unlocked?
            // "Sblocco automatico" implies linear progression.
            // Let's cap preview at maxLevel? Or allow seeing 1 ahead?
            // Let's iterate freely for now or cap at 20.
            if (currentPreviewLevel < maxLevels - 1) {
                currentPreviewLevel++;
                renderPreview(currentPreviewLevel);
            }
        });
    }

    // AUTHENTICATION UI LOGIC


    // START SCREEN / MAIN MENU LOGIC
    const startScreen = document.getElementById('start-screen');
    const mainMenu = document.getElementById('main-menu');
    const levelScreen = document.getElementById('level-select-screen');
    const levelGrid = document.getElementById('level-grid');
    const levelBackBtn = document.getElementById('level-back-btn');

    // Update player level display on main menu
    function updatePlayerLevelDisplay() {
        const levelText = document.getElementById('player-level-text');
        const xpBar = document.getElementById('xp-progress-bar');
        const xpText = document.getElementById('xp-text');
        const menuCoins = document.getElementById('menu-coins-display');
        const menuDragocoin = document.getElementById('menu-dragocoin-display');

        if (!gameState || !levelText) return;

        const level = gameState.playerLevel || 1;
        const totalXP = gameState.playerXP || 0;
        const xpPerLevel = 500;
        const xpInCurrentLevel = totalXP % xpPerLevel;
        const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100;

        levelText.innerText = `LV ${level}`;
        if (xpBar) xpBar.style.width = `${progressPercent}%`;
        if (xpText) xpText.innerText = `${xpInCurrentLevel} / ${xpPerLevel} XP`;

        // Update currency display
        if (menuCoins) menuCoins.innerText = gameState.coins || 0;
        if (menuDragocoin) menuDragocoin.innerText = gameState.dragocoin || 0;
    }

    // AUTH HELPERS
    async function handleAuthSuccess(user, data) {
        // Ensure firebase is initialized
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded yet.");
            authStatus.style.color = 'red';
            authStatus.innerText = "Error: Services not ready.";
            return;
        }

        authStatus.style.color = 'green';
        authStatus.innerText = "SUCCESS!";

        // Update User Manager
        const displayName = user.displayName || data.username || "Player";
        userManager.setUsername(displayName);

        // Update Game State
        userStorageKey = `bubbleBobbleSave_${user.uid}`; // Use UID for key
        gameState = new GameState(userStorageKey);

        // Load cloud data
        if (data) {
            gameState.coins = data.coins || 0;
            gameState.inventory = data.inventory || [];
            gameState.stats = data.stats || { speedLevel: 0 };
            gameState.maxLevel = data.maxLevel || 1;
            gameState.save(false);
        }

        // Update UI
        updateDisplay();

        setTimeout(() => {
            authModal.style.display = 'none';
            alert(`Benvenuto ${displayName}!`);
        }, 500);

        // Refresh Preview
        let latestLevel = Math.min(gameState.maxLevel - 1, maxLevels - 1);
        if (latestLevel < 0) latestLevel = 0;
        renderPreview(latestLevel);
    }

    if (authBtn) {
        authBtn.addEventListener('click', async () => {
            // Check if we are logging out
            if (Database.auth && Database.auth.currentUser) {
                const confirmed = confirm("Do you want to LOGOUT?");
                if (confirmed) {
                    await Database.logout();
                    alert("Logged Out");
                    // Reset to Guest
                    userManager.setUsername(`Guest_${Math.floor(Math.random() * 1000)}`);
                    userStorageKey = 'bubbleBobbleSave_default'; // Or unique guest key
                    gameState = new GameState(userStorageKey);
                    updateDisplay();
                    // Refresh Preview to show level 1 and locked states
                    renderPreview(0);
                    updatePlayerLevelDisplay();
                }
            } else {
                // Show Login Modal
                authModal.style.display = 'flex';
                authStatus.innerText = '';
                authEmail.value = '';
                authPassword.value = '';
                if (authConfirmPassword) authConfirmPassword.value = '';
            }
        });
    }

    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = authEmail.value.trim();
            const password = authPassword.value.trim();
            if (!email || !password) {
                authStatus.style.color = 'red';
                authStatus.innerText = "Email/Pass Required";
                return;
            }

            authStatus.style.color = 'yellow';
            authStatus.innerText = "LOGGING IN...";

            const res = await Database.loginWithEmail(email, password);
            if (res.success) {
                await handleAuthSuccess(res.user, res.data);
            } else {
                authStatus.style.color = 'red';
                authStatus.innerText = res.error;
            }
        });
    }

    // CANCEL button for login view
    if (btnAuthCancel) {
        btnAuthCancel.addEventListener('click', () => {
            if (authModal) authModal.style.display = 'none';
            if (authEmail) authEmail.value = '';
            if (authPassword) authPassword.value = '';
            if (authStatus) authStatus.innerText = '';
            // Reset to login view
            if (loginView) loginView.style.display = 'flex';
            if (registerView) registerView.style.display = 'none';
        });
    }

    // CANCEL button for register view
    if (btnRegisterCancel) {
        btnRegisterCancel.addEventListener('click', () => {
            if (authModal) authModal.style.display = 'none';
            if (registerEmail) registerEmail.value = '';
            if (registerPassword) registerPassword.value = '';
            if (registerConfirmPassword) registerConfirmPassword.value = '';
            if (registerStatus) registerStatus.innerText = '';
            // Reset to login view
            if (loginView) loginView.style.display = 'flex';
            if (registerView) registerView.style.display = 'none';
        });
    }

    // SWITCH to Register view
    if (switchToRegister) {
        switchToRegister.addEventListener('click', () => {
            if (loginView) loginView.style.display = 'none';
            if (registerView) registerView.style.display = 'flex';
            if (authStatus) authStatus.innerText = '';
        });
    }

    // SWITCH to Login view
    if (switchToLogin) {
        switchToLogin.addEventListener('click', () => {
            if (loginView) loginView.style.display = 'flex';
            if (registerView) registerView.style.display = 'none';
            if (registerStatus) registerStatus.innerText = '';
        });
    }

    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const email = registerEmail ? registerEmail.value.trim() : '';
            const password = registerPassword ? registerPassword.value.trim() : '';
            const confirm = registerConfirmPassword ? registerConfirmPassword.value.trim() : '';
            // Use current local username
            const username = userManager.getUsername();

            if (!email || !password || !confirm) {
                if (registerStatus) {
                    registerStatus.style.color = '#ff4444';
                    registerStatus.innerText = "Compila tutti i campi";
                }
                return;
            }

            if (password !== confirm) {
                if (registerStatus) {
                    registerStatus.style.color = '#ff4444';
                    registerStatus.innerText = "Le password non coincidono";
                }
                return;
            }

            if (password.length < 6) {
                if (registerStatus) {
                    registerStatus.style.color = '#ff4444';
                    registerStatus.innerText = "Password min 6 caratteri";
                }
                return;
            }

            if (registerStatus) {
                registerStatus.style.color = 'yellow';
                registerStatus.innerText = "REGISTRAZIONE...";
            }

            // Migrate ALL guest data to the new account
            const currentData = {
                coins: gameState.coins,
                dragocoin: gameState.dragocoin || 0,
                inventory: gameState.inventory,
                stats: gameState.stats,
                maxLevel: gameState.maxLevel,
                playerLevel: gameState.playerLevel || 1,
                playerXP: gameState.playerXP || 0,
                lastLoginDate: gameState.lastLoginDate,
                loginStreak: gameState.loginStreak || 0,
                unlockedAchievements: gameState.unlockedAchievements || [],
                tutorialCompleted: gameState.tutorialCompleted || false,
                lastActive: new Date().toISOString()
            };

            const res = await Database.registerWithEmail(email, password, username, currentData);
            if (res.success) {
                // MIGRATION: Delete the old legacy document keyed by username
                if (username) {
                    await Database.deleteUser(username);
                    console.log(`Legacy user document '${username}' deleted after migration.`);
                }

                await handleAuthSuccess(res.user, currentData);
            } else {
                if (registerStatus) {
                    registerStatus.style.color = '#ff4444';
                    registerStatus.innerText = res.error;
                }
            }
        });
    }

    // --- OLD UI ELEMENTS (Keep only necessary ones, Hide/Remove Edit User button if redundant?) --
    // We keep Edit User for non-authed users? Or replace it.
    // User requested "Sign Up", so maybe Edit User is legacy.
    // For now, let's keep it but Auth is primary for recovery.

    const editUserBtn = document.getElementById('edit-user-btn');
    if (editUserBtn) {
        // If we are logged in, maybe hide this?
        // Checking Database.auth.currentUser is async/complex here as we just inited.
        // We leave it active for renaming "Guest" users locally if they want.
        editUserBtn.addEventListener('click', () => {
            nameModal.style.display = 'flex';
            nameInput.value = '';
            nameStatus.innerText = '';
        });
    }

    const nameModal = document.getElementById('name-change-modal');
    const nameInput = document.getElementById('username-input');
    const nameStatus = document.getElementById('username-status');
    const confirmNameBtn = document.getElementById('confirm-name-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    const changeNameBtn = document.getElementById('change-name-btn');

    // Main menu button to open name change modal
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', () => {
            nameModal.style.display = 'flex';
            nameInput.value = '';
            nameStatus.innerText = '';
        });
    }

    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', () => {
            nameModal.style.display = 'none';
        });
    }

    if (confirmNameBtn) {
        confirmNameBtn.addEventListener('click', async () => {
            const newName = nameInput.value.trim();
            nameStatus.style.color = 'yellow';
            nameStatus.innerText = 'CHECKING AVAILABILITY...';

            const check = await Database.checkAvailability(newName);

            if (check.available) {
                const oldName = userManager.getUsername();
                const isAuthenticated = Database.auth && Database.auth.currentUser;

                try {
                    if (isAuthenticated) {
                        // === AUTHENTICATED USER: Update username field in existing UID document ===
                        const uid = Database.auth.currentUser.uid;

                        // Update displayName in Firebase Auth
                        await Database.auth.currentUser.updateProfile({
                            displayName: newName
                        });

                        // Update username field in Firestore document (keep same UID doc)
                        await Database.updateUsername(uid, newName);

                        // Update local state
                        userManager.setUsername(newName);
                        gameState.username = newName;
                        localStorage.setItem('bubbleBobbleUser', newName);

                        // Force save to same UID document
                        gameState.save();

                        console.log(`✅ Username aggiornato da '${oldName}' a '${newName}' (UID: ${uid})`);
                    } else {
                        // === GUEST USER: Create new document, delete old ===
                        const userData = {
                            coins: gameState.coins,
                            dragocoin: gameState.dragocoin || 0,
                            inventory: gameState.inventory,
                            stats: gameState.stats,
                            maxLevel: gameState.maxLevel || 1,
                            playerLevel: gameState.playerLevel || 1,
                            playerXP: gameState.playerXP || 0,
                            lastLoginDate: gameState.lastLoginDate,
                            loginStreak: gameState.loginStreak || 0,
                            unlockedAchievements: gameState.unlockedAchievements || [],
                            tutorialCompleted: gameState.tutorialCompleted || false,
                            lastActive: new Date().toISOString()
                        };

                        // Create new document with new name
                        await Database.registerUser(newName, userData);

                        // Delete old guest document
                        if (oldName && oldName.toLowerCase() !== newName.toLowerCase()) {
                            await Database.deleteUser(oldName);
                            console.log(`✅ Vecchio documento '${oldName}' eliminato.`);
                        }

                        // Update local state
                        userManager.setUsername(newName);
                        gameState.username = newName;
                        gameState.storageKey = newName;
                        localStorage.setItem('bubbleBobbleUser', newName);

                        // Force save to new document
                        gameState.save();

                        console.log(`✅ Username cambiato da '${oldName}' a '${newName}'`);
                    }

                    updateDisplay();
                    updatePlayerLevelDisplay();
                    nameModal.style.display = 'none';

                    nameStatus.style.color = 'green';
                    nameStatus.innerText = `Nome cambiato in ${newName}!`;
                } catch (error) {
                    console.error("Errore cambio nome:", error);
                    nameStatus.style.color = 'red';
                    nameStatus.innerText = 'Errore durante il cambio nome';
                }
            } else {
                nameStatus.style.color = 'red';
                nameStatus.innerText = check.error;
            }
        });
    }

    // UI Elements

    const shopScreen = document.getElementById('shop-screen');
    const shopCoinDisplay = document.getElementById('shop-coin-display');
    const shopDragocoinDisplay = document.getElementById('shop-dragocoin-display');
    const shopTabCoins = document.getElementById('shop-tab-coins');
    const shopTabPremium = document.getElementById('shop-tab-premium');
    const shopItemsCoins = document.getElementById('shop-items-coins');
    const shopItemsPremium = document.getElementById('shop-items-premium');

    const shopBtn = document.getElementById('shop-btn');
    const backBtn = document.getElementById('back-btn');

    let currentShopTab = 'coins';

    function updateShopUI() {
        // Update currency displays
        if (shopCoinDisplay) shopCoinDisplay.innerText = `🪙 ${gameState.coins || 0}`;
        if (shopDragocoinDisplay) shopDragocoinDisplay.innerText = `🐲 ${gameState.dragocoin || 0}`;

        // Helper function to update a shop item (coins)
        function updateItem(btnId, itemId, cost) {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const hasItem = gameState.hasItem(itemId);

            // Reset classes
            btn.classList.remove('owned', 'disabled');

            if (hasItem) {
                btn.classList.add('owned');
                btn.querySelector('span:last-child').innerText = '✅ ACQUISTATO';
            } else if (gameState.coins < cost) {
                btn.classList.add('disabled');
            }
        }

        // Helper function to update premium item (dragocoin)
        function updatePremiumItem(btnId, itemId, cost) {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const hasItem = gameState.hasItem(itemId);

            btn.classList.remove('owned', 'disabled');

            if (hasItem) {
                btn.classList.add('owned');
                btn.querySelector('span:last-child').innerText = '✅ ACQUISTATO';
            } else if ((gameState.dragocoin || 0) < cost) {
                btn.classList.add('disabled');
            }
        }

        // Update all coin shop items
        updateItem('buy-long-range', 'long_range', 100);
        updateItem('buy-speed', 'speed_boost', 150);
        updateItem('buy-double-jump', 'double_jump', 200);
        updateItem('buy-rapid-fire', 'rapid_fire', 250);
        updateItem('buy-shield', 'shield', 300);

        // Update all premium shop items (NEW HIGHER COSTS)
        updatePremiumItem('buy-mega-speed', 'mega_speed', 500);
        updatePremiumItem('buy-super-jump', 'super_jump', 750);
        updatePremiumItem('buy-bubble-master', 'bubble_master', 1000);
        updatePremiumItem('buy-coin-magnet', 'coin_magnet', 1250);
        updatePremiumItem('buy-xp-boost', 'xp_boost', 1500);
        updatePremiumItem('buy-triple-jump', 'triple_jump', 2000);
        updatePremiumItem('buy-immortal', 'immortal_start', 3000);
    }

    // Tab elements
    const shopTabEuro = document.getElementById('shop-tab-euro');
    const shopItemsEuro = document.getElementById('shop-items-euro');

    // Shop tab switching (3 tabs)
    function switchShopTab(tab) {
        currentShopTab = tab;

        // Reset all tabs
        [shopTabCoins, shopTabPremium, shopTabEuro].forEach(t => {
            if (t) {
                t.style.background = 'transparent';
                t.style.borderColor = '#555';
                t.style.color = '#888';
            }
        });
        [shopItemsCoins, shopItemsPremium, shopItemsEuro].forEach(s => {
            if (s) s.style.display = 'none';
        });

        // Activate selected tab
        if (tab === 'coins') {
            shopTabCoins.style.background = 'rgba(255,215,0,0.2)';
            shopTabCoins.style.borderColor = '#ffd700';
            shopTabCoins.style.color = '#ffd700';
            shopItemsCoins.style.display = 'flex';
        } else if (tab === 'premium') {
            shopTabPremium.style.background = 'rgba(255,0,222,0.2)';
            shopTabPremium.style.borderColor = '#ff00de';
            shopTabPremium.style.color = '#ff00de';
            shopItemsPremium.style.display = 'flex';
        } else if (tab === 'euro') {
            shopTabEuro.style.background = 'rgba(0,255,0,0.2)';
            shopTabEuro.style.borderColor = '#00ff00';
            shopTabEuro.style.color = '#00ff00';
            shopItemsEuro.style.display = 'flex';
        }
    }

    if (shopTabCoins) {
        shopTabCoins.addEventListener('click', () => switchShopTab('coins'));
    }
    if (shopTabPremium) {
        shopTabPremium.addEventListener('click', () => switchShopTab('premium'));
    }
    if (shopTabEuro) {
        shopTabEuro.addEventListener('click', () => switchShopTab('euro'));
    }

    // Euro shop handlers (placeholder - will use StoreKit when available)
    function setupEuroShopItem(btnId, productId) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', () => {
            // Placeholder: Show message that IAP is not yet available
            alert('🚧 In-App Purchases saranno disponibili dopo la pubblicazione su App Store!');
            console.log(`Tentativo acquisto IAP: ${productId}`);
        });
    }

    setupEuroShopItem('buy-dragocoin-small', 'dragocoin_100');
    setupEuroShopItem('buy-dragocoin-medium', 'dragocoin_500');
    setupEuroShopItem('buy-dragocoin-large', 'dragocoin_1500');
    setupEuroShopItem('buy-dragocoin-huge', 'dragocoin_5000');
    setupEuroShopItem('buy-remove-ads', 'remove_ads');
    setupEuroShopItem('buy-unlock-all', 'unlock_all');

    // Touch Controls - Arrow Buttons
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    if (btnLeft) {
        btnLeft.addEventListener('touchstart', (e) => {
            game.input.keys['ArrowLeft'] = true;
            e.preventDefault();
        }, { passive: false });
        btnLeft.addEventListener('touchend', (e) => {
            game.input.keys['ArrowLeft'] = false;
            e.preventDefault();
        });
    }

    if (btnRight) {
        btnRight.addEventListener('touchstart', (e) => {
            game.input.keys['ArrowRight'] = true;
            e.preventDefault();
        }, { passive: false });
        btnRight.addEventListener('touchend', (e) => {
            game.input.keys['ArrowRight'] = false;
            e.preventDefault();
        });
    }

    // Buttons (Jump/Shoot)
    const btnJump = document.getElementById('btn-jump');
    const btnShoot = document.getElementById('btn-shoot');

    if (btnJump) {
        btnJump.addEventListener('touchstart', (e) => { game.input.keys['ArrowUp'] = true; e.preventDefault(); }, { passive: false });
        btnJump.addEventListener('touchend', (e) => { game.input.keys['ArrowUp'] = false; e.preventDefault(); });
    }
    if (btnShoot) {
        btnShoot.addEventListener('touchstart', (e) => { game.input.keys[' '] = true; e.preventDefault(); }, { passive: false });
        btnShoot.addEventListener('touchend', (e) => { game.input.keys[' '] = false; e.preventDefault(); });
    }
    // Navigation
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            shopScreen.style.display = 'flex';
            updateShopUI(); // Initial check
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            audioManager.playSound('gamestart');
            startScreen.style.display = 'none';
            game.setGameState(gameState);
            game.resetGame();
            // Pass level index from carousel
            game.level.load(currentPreviewLevel);

            // Start tutorial for first-time players
            if (!gameState.tutorialCompleted) {
                game.tutorial.start();
            }

            animate(0);
        });
    }
    // Dynamic generation if empty
    const grid = document.getElementById('level-grid');
    if (grid && grid.children.length === 0) {
        for (let i = 0; i < maxLevels; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.innerText = i + 1;
            btn.onclick = () => window.selectLevel(i);
            grid.appendChild(btn);
        }
    }


    if (levelBackBtn) {
        levelBackBtn.addEventListener('click', () => {
            levelScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }

    // Global function for level buttons
    window.selectLevel = (index) => {
        console.log("Starting Level " + (index + 1));

        // Hide the entire start screen overlay, not just the sub-menu
        document.getElementById('start-screen').style.display = 'none';
        levelScreen.style.display = 'none';
        // Also reset main menu display for next time
        document.getElementById('main-menu').style.display = 'flex';

        game.setGameState(gameState);
        game.resetGame();

        // Overseed startLevel by forcing index
        game.levelIndex = index;
        game.startLevel(); // Restart level with new index

        gameStarted = true;
        lastTime = performance.now();
    };

    // Generic Shop Purchase Handler (Coins)
    function setupShopItem(btnId, itemId, cost) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', () => {
            if (gameState.hasItem(itemId)) return;
            if (gameState.spendCoins(cost)) {
                gameState.unlockItem(itemId);
                updateShopUI();
                audioManager.playSound('coin');
                console.log(`Acquistato: ${itemId}`);

                // Check shop achievements
                achievementManager.checkShopAchievements();
            }
        });
    }

    // Premium Shop Purchase Handler (Dragocoin)
    function setupPremiumShopItem(btnId, itemId, cost) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        btn.addEventListener('click', () => {
            if (gameState.hasItem(itemId)) return;
            if (gameState.spendDragocoin(cost)) {
                gameState.unlockItem(itemId);
                updateShopUI();
                audioManager.playSound('coin');
                console.log(`Acquistato Premium: ${itemId}`);

                // Check shop achievements
                achievementManager.checkShopAchievements();
            }
        });
    }

    // Setup all coin shop items
    setupShopItem('buy-long-range', 'long_range', 100);
    setupShopItem('buy-speed', 'speed_boost', 150);
    setupShopItem('buy-double-jump', 'double_jump', 200);
    setupShopItem('buy-rapid-fire', 'rapid_fire', 250);
    setupShopItem('buy-shield', 'shield', 300);

    // Setup all premium shop items (Dragocoin)
    setupPremiumShopItem('buy-mega-speed', 'mega_speed', 500);
    setupPremiumShopItem('buy-super-jump', 'super_jump', 750);
    setupPremiumShopItem('buy-bubble-master', 'bubble_master', 1000);
    setupPremiumShopItem('buy-coin-magnet', 'coin_magnet', 1250);
    setupPremiumShopItem('buy-xp-boost', 'xp_boost', 1500);
    setupPremiumShopItem('buy-triple-jump', 'triple_jump', 2000);
    setupPremiumShopItem('buy-immortal', 'immortal_start', 3000);

    // Shop Back Button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            shopScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
            updatePlayerLevelDisplay(); // Refresh coins on main menu
        });
    }

    // === ACHIEVEMENTS SCREEN ===
    const achievementsBtn = document.getElementById('achievements-btn');
    const achievementsScreen = document.getElementById('achievements-screen');
    const achievementsList = document.getElementById('achievements-list');
    const achievementsProgress = document.getElementById('achievements-progress');
    const achievementsBackBtn = document.getElementById('achievements-back-btn');
    const achievementsTabs = document.getElementById('achievements-tabs');
    const currentCategoryTitle = document.getElementById('current-category-title');

    // Daily Reward in Objectives Section
    const claimDailyBtn = document.getElementById('claim-daily-btn');
    const dailyRewardStatus = document.getElementById('daily-reward-status');
    const dailyStreakInfo = document.getElementById('daily-streak-info');

    function updateDailyRewardUI() {
        if (!dailyRewardStatus || !dailyStreakInfo || !claimDailyBtn) return;

        const rewardCheck = gameState.checkDailyReward();
        const streak = gameState.loginStreak || 0;

        dailyStreakInfo.textContent = `🔥 Serie: ${streak} giorni`;

        if (rewardCheck && rewardCheck.canClaim) {
            // Reward available to claim
            dailyRewardStatus.textContent = '✨ Disponibile!';
            dailyRewardStatus.style.color = '#00ff00';
            claimDailyBtn.disabled = false;
            claimDailyBtn.style.opacity = '1';
            claimDailyBtn.style.background = 'linear-gradient(135deg, #ffd700, #ff8c00)';
            claimDailyBtn.textContent = 'RISCUOTI 🎁';
        } else {
            // Already claimed today
            dailyRewardStatus.textContent = '✓ Già riscosso oggi';
            dailyRewardStatus.style.color = '#888';
            claimDailyBtn.disabled = true;
            claimDailyBtn.style.opacity = '0.5';
            claimDailyBtn.style.background = '#555';
            claimDailyBtn.textContent = 'RISCOSSO ✓';
        }
    }

    if (claimDailyBtn) {
        claimDailyBtn.addEventListener('click', () => {
            const result = gameState.claimDailyReward();
            if (result) {
                // Show success feedback
                claimDailyBtn.textContent = `+${result.coins}🪙 +${result.xp}⭐`;
                claimDailyBtn.style.background = '#00aa00';

                // Update displays
                updateDisplay();
                updatePlayerLevelDisplay();

                // Update the daily reward UI
                setTimeout(() => {
                    updateDailyRewardUI();
                }, 1500);

                console.log(`✅ Premio giornaliero riscosso: ${result.coins} monete, ${result.xp} XP, streak: ${result.streak}`);
            } else {
                console.log("⚠️ Premio già riscosso oggi");
                updateDailyRewardUI();
            }
        });
    }

    // Track current selected category
    let selectedCategory = 'livelli';

    // Dynamic categories with Italian names and icons
    const categoryConfig = {
        livelli: { name: 'Livelli', icon: '🎮', color: '#00ff00' },
        nemici: { name: 'Nemici', icon: '👹', color: '#ff4444' },
        frutta: { name: 'Frutta', icon: '🍎', color: '#ff8800' },
        monete: { name: 'Monete', icon: '💰', color: '#ffd700' },
        partite: { name: 'Partite', icon: '🎯', color: '#00ffff' },
        draghetto: { name: 'Draghetto', icon: '🐲', color: '#ff00de' },
        dragocoin: { name: 'Dragocoin', icon: '💎', color: '#ff00ff' },
        accessi: { name: 'Accessi', icon: '🔥', color: '#ff6600' },
        tenacia: { name: 'Tenacia', icon: '💪', color: '#88ff00' },
        potenziamenti: { name: 'Powerup', icon: '⬆️', color: '#00ff88' },
        completamenti: { name: 'Completi', icon: '✅', color: '#44ff44' },
        milestone: { name: 'Traguardi', icon: '🏅', color: '#ffdd00' }
    };

    function updateAchievementsUI() {
        if (!achievementsList) return;

        const allAchievements = achievementManager.getAllAchievements();
        const progress = achievementManager.getProgress();
        const points = achievementManager.getTotalPoints();
        const totalCount = allAchievements.length;
        const unlockedCount = allAchievements.filter(a => a.unlocked).length;

        if (achievementsProgress) {
            achievementsProgress.innerText = `${progress}% (${unlockedCount}/${totalCount}) | ${points} PT`;
        }

        // Group by category
        const categories = {};
        allAchievements.forEach(ach => {
            if (!categories[ach.category]) {
                categories[ach.category] = [];
            }
            categories[ach.category].push(ach);
        });

        // Create category tabs
        if (achievementsTabs) {
            achievementsTabs.innerHTML = '';
            Object.keys(categoryConfig).forEach(catKey => {
                if (!categories[catKey]) return;

                const catItems = categories[catKey];
                const catUnlocked = catItems.filter(a => a.unlocked).length;
                const config = categoryConfig[catKey];

                const tab = document.createElement('button');
                tab.className = 'achievement-tab';
                tab.style.cssText = `
                    padding: 6px 10px; 
                    font-size: 8px; 
                    font-family: 'Press Start 2P';
                    border: 2px solid ${selectedCategory === catKey ? config.color : '#555'}; 
                    background: ${selectedCategory === catKey ? 'rgba(255,255,255,0.1)' : 'transparent'}; 
                    color: ${selectedCategory === catKey ? config.color : '#888'}; 
                    border-radius: 8px; 
                    cursor: pointer;
                    white-space: nowrap;
                    flex-shrink: 0;
                `;
                tab.innerHTML = `${config.icon}<br>${catUnlocked}/${catItems.length}`;
                tab.title = config.name;
                tab.onclick = () => {
                    selectedCategory = catKey;
                    updateAchievementsUI();
                };
                achievementsTabs.appendChild(tab);
            });
        }

        // Show category title
        if (currentCategoryTitle) {
            const config = categoryConfig[selectedCategory];
            if (config && categories[selectedCategory]) {
                const catItems = categories[selectedCategory];
                const catUnlocked = catItems.filter(a => a.unlocked).length;
                currentCategoryTitle.innerHTML = `${config.icon} ${config.name} (${catUnlocked}/${catItems.length})`;
                currentCategoryTitle.style.color = config.color;
            }
        }

        // Clear and show only selected category
        achievementsList.innerHTML = '';

        const catItems = categories[selectedCategory] || [];

        // Sort: unlocked first, then by requirement value
        catItems.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return (a.requirement?.value || 0) - (b.requirement?.value || 0);
        });

        // Show ALL achievements in selected category
        catItems.forEach(ach => {
            const item = document.createElement('div');
            item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;

            const rewardLabel = ach.reward ? `<div class="achievement-reward">${ach.reward.label}</div>` : '';

            item.innerHTML = `
                <div class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.description}</div>
                    ${rewardLabel}
                </div>
                <div class="achievement-points">${ach.points} PT</div>
            `;
            achievementsList.appendChild(item);
        });
    }

    if (achievementsBtn) {
        achievementsBtn.addEventListener('click', () => {
            mainMenu.style.display = 'none';
            achievementsScreen.style.display = 'flex';
            updateAchievementsUI();
            updateDailyRewardUI(); // Update daily reward status
        });
    }

    if (achievementsBackBtn) {
        achievementsBackBtn.addEventListener('click', () => {
            achievementsScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }

    // === LEADERBOARD SCREEN ===
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardList = document.getElementById('leaderboard-list');
    const userRankDisplay = document.getElementById('user-rank');
    const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');

    async function updateLeaderboardUI() {
        if (!leaderboardList) return;

        leaderboardList.innerHTML = '<div class="leaderboard-loading">Caricamento...</div>';

        try {
            // Fetch top scores
            console.log('Fetching leaderboard scores...');
            const scores = await Database.getTopScores(10);
            console.log('Scores received:', scores);
            const currentUsername = userManager.getUsername().toLowerCase();

            // Get user rank
            const userRank = await Database.getUserRank(userManager.getUsername());
            console.log('User rank:', userRank);
            if (userRankDisplay) {
                if (userRank) {
                    userRankDisplay.innerText = `La tua posizione: #${userRank}`;
                } else {
                    userRankDisplay.innerText = `Gioca per entrare in classifica!`;
                }
            }

            // Clear and populate list
            leaderboardList.innerHTML = '';

            if (scores.length === 0) {
                console.log('No scores found in leaderboard');
                leaderboardList.innerHTML = '<div class="leaderboard-loading">Nessun punteggio ancora! Gioca una partita.</div>';
                return;
            }

            scores.forEach((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.id === currentUsername;

                const row = document.createElement('div');
                row.className = `leaderboard-row`;
                if (rank === 1) row.classList.add('top-1');
                else if (rank === 2) row.classList.add('top-2');
                else if (rank === 3) row.classList.add('top-3');
                if (isCurrentUser) row.classList.add('current-user');

                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                const rankIcon = rank === 1 ? '🥇' : (rank === 2 ? '🥈' : (rank === 3 ? '🥉' : `#${rank}`));

                row.innerHTML = `
                    <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
                    <div class="leaderboard-name">${entry.username}</div>
                    <div class="leaderboard-score">🐲 Lv.${entry.dragonLevel || 1}</div>
                `;
                leaderboardList.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<div class="leaderboard-loading">Errore caricamento</div>';
        }
    }

    if (leaderboardBtn) {
        console.log('Leaderboard button found, adding listener');
        leaderboardBtn.addEventListener('click', () => {
            console.log('Leaderboard button clicked');
            if (mainMenu) mainMenu.style.display = 'none';
            if (leaderboardScreen) leaderboardScreen.style.display = 'flex';
            updateLeaderboardUI();
        });
    } else {
        console.error('Leaderboard button NOT found!');
    }

    if (leaderboardBackBtn) {
        leaderboardBackBtn.addEventListener('click', () => {
            leaderboardScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        });
    }

    // === DRAGON STATS SCREEN ===
    const dragonStatsBtn = document.getElementById('dragon-stats-btn');
    const dragonStatsScreen = document.getElementById('dragon-stats-screen');
    const dragonStatsBackBtn = document.getElementById('dragon-stats-back-btn');
    const boostXpBtn = document.getElementById('boost-xp-btn');

    function updateDragonStatsUI() {
        if (!gameState) return;

        // Level display
        const levelDisplay = document.getElementById('dragon-level-display');
        if (levelDisplay) levelDisplay.textContent = `LIVELLO ${gameState.playerLevel}`;

        // XP Progress
        const xpPerLevel = 500;
        const totalXP = gameState.playerXP || 0;
        const xpInCurrentLevel = totalXP % xpPerLevel;
        const xpToNextLevel = xpPerLevel - xpInCurrentLevel;
        const progressPercent = (xpInCurrentLevel / xpPerLevel) * 100;

        const xpText = document.getElementById('dragon-xp-text');
        if (xpText) xpText.textContent = `${xpInCurrentLevel} / ${xpPerLevel} XP`;

        const xpBar = document.getElementById('dragon-xp-bar');
        if (xpBar) xpBar.style.width = `${progressPercent}%`;

        const xpToNext = document.getElementById('dragon-xp-to-next');
        if (xpToNext) xpToNext.textContent = `Prossimo livello: ${xpToNextLevel} XP`;

        // Bonuses
        const bonuses = gameState.getLevelBonuses();
        const bonusSpeed = document.getElementById('bonus-speed');
        const bonusJump = document.getElementById('bonus-jump');
        const bonusRange = document.getElementById('bonus-range');
        const bonusDuration = document.getElementById('bonus-duration');

        if (bonusSpeed) bonusSpeed.textContent = `+${((bonuses.speedBonus - 1) * 100).toFixed(1)}%`;
        if (bonusJump) bonusJump.textContent = `+${((bonuses.jumpBonus - 1) * 100).toFixed(1)}%`;
        if (bonusRange) bonusRange.textContent = `+${((bonuses.bubbleRangeBonus - 1) * 100).toFixed(1)}%`;
        if (bonusDuration) bonusDuration.textContent = `+${((bonuses.bubbleDurationBonus - 1) * 100).toFixed(1)}%`;

        // Next bonus preview
        const nextLevel = gameState.playerLevel + 1;
        const nextBonusType = (nextLevel - 1) % 4;
        const bonusNames = ['🏃 Velocità', '🦘 Salto', '🫧 Gittata Bolle', '⏱️ Durata Bolle'];

        const nextBonusLevel = document.getElementById('next-bonus-level');
        if (nextBonusLevel) nextBonusLevel.textContent = nextLevel;

        const nextBonusName = document.getElementById('next-bonus-name');
        if (nextBonusName) nextBonusName.textContent = `${bonusNames[nextBonusType]} +0.1%`;

        // Dragocoin display
        const dragocoinDisplay = document.getElementById('dragon-stats-dragocoin');
        if (dragocoinDisplay) dragocoinDisplay.textContent = `🐲 ${gameState.dragocoin || 0}`;

        // Update boost button state
        if (boostXpBtn) {
            const canBoost = (gameState.dragocoin || 0) >= 10;
            boostXpBtn.disabled = !canBoost;
            boostXpBtn.style.opacity = canBoost ? '1' : '0.5';
        }

        // Game Statistics
        const stats = gameState.stats || {};
        const statEnemies = document.getElementById('stat-enemies');
        const statCoins = document.getElementById('stat-coins');
        const statGames = document.getElementById('stat-games');
        const statLevels = document.getElementById('stat-levels');
        const statPowerups = document.getElementById('stat-powerups');
        const statDeaths = document.getElementById('stat-deaths');
        const statFruit = document.getElementById('stat-fruit');

        if (statEnemies) statEnemies.textContent = (stats.enemiesTrapped || 0).toLocaleString();
        if (statCoins) statCoins.textContent = (stats.totalCoinsEarned || 0).toLocaleString();
        if (statGames) statGames.textContent = (stats.gamesPlayed || 0).toLocaleString();
        if (statLevels) statLevels.textContent = (stats.levelsCompleted || 0).toLocaleString();
        if (statPowerups) statPowerups.textContent = (stats.powerupsCollected || 0).toLocaleString();
        if (statDeaths) statDeaths.textContent = (stats.totalDeaths || 0).toLocaleString();
        if (statFruit) statFruit.textContent = (stats.totalFruitCollected || 0).toLocaleString();
    }

    if (dragonStatsBtn) {
        dragonStatsBtn.addEventListener('click', () => {
            if (mainMenu) mainMenu.style.display = 'none';
            if (dragonStatsScreen) dragonStatsScreen.style.display = 'flex';
            updateDragonStatsUI();
        });
    }

    if (dragonStatsBackBtn) {
        dragonStatsBackBtn.addEventListener('click', () => {
            if (dragonStatsScreen) dragonStatsScreen.style.display = 'none';
            if (mainMenu) mainMenu.style.display = 'flex';
            updatePlayerLevelDisplay(); // Refresh main menu
        });
    }

    if (boostXpBtn) {
        boostXpBtn.addEventListener('click', () => {
            const boostStatus = document.getElementById('boost-status');

            if ((gameState.dragocoin || 0) < 10) {
                if (boostStatus) boostStatus.textContent = '❌ Dragocoin insufficienti!';
                return;
            }

            // Spend 10 Dragocoin for +500 XP
            gameState.spendDragocoin(10);
            gameState.playerXP = (gameState.playerXP || 0) + 500;

            // Check for level up
            const newLevel = Math.floor(gameState.playerXP / 500) + 1;
            if (newLevel > gameState.playerLevel) {
                gameState.playerLevel = newLevel;
                if (boostStatus) boostStatus.textContent = `🎉 LEVEL UP! Ora sei al livello ${newLevel}!`;
            } else {
                if (boostStatus) boostStatus.textContent = '✅ +500 XP aggiunto!';
            }

            gameState.save();
            updateDragonStatsUI();

            // Clear status after 2 seconds
            setTimeout(() => {
                if (boostStatus) boostStatus.textContent = '';
            }, 2000);
        });
    }

    let lastTime = 0;
    let gameStarted = false;

    // Game Over UI Elements
    const gameOverScreen = document.getElementById('game-over-screen');
    const sessionCoinsDisplay = document.getElementById('session-coins');
    const returnMenuBtn = document.getElementById('return-menu-btn');

    if (returnMenuBtn) {
        returnMenuBtn.addEventListener('click', () => {
            gameOverScreen.style.display = 'none';
            const startScreenWrapper = document.getElementById('start-screen');
            if (startScreenWrapper) startScreenWrapper.style.display = 'flex'; // Show main menu container
            mainMenu.style.display = 'flex'; // Ensure menu itself is visible

            setTouchControls(false); // HIDE CONTROLS

            gameStarted = false;

            // Refresh preview to show latest unlocked level
            let latestLevel = Math.min(gameState.maxLevel - 1, maxLevels - 1);
            if (latestLevel < 0) latestLevel = 0;
            renderPreview(latestLevel);
            updatePlayerLevelDisplay();
        });
    }

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameStarted) {
            try {
                game.update(deltaTime);
                game.draw(ctx);

                if (game.gameOver) {
                    gameStarted = false;
                    gameOverScreen.style.display = 'flex';
                    sessionCoinsDisplay.innerText = game.sessionCoins || 0;
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // Maybe draw a background for the menu?
            // game.draw(ctx); 
        }

        requestAnimationFrame(animate);
    }

    // Expose startGame globally for onclick is replaced below by window.startGame override
    // LevelGenerator is imported at top of file now.


    // Touch Controls Visibility Helper
    function setTouchControls(visible) {
        const controls = document.getElementById('touch-controls');
        if (controls) {
            controls.style.display = visible ? 'flex' : 'none';
        }
        const pauseBtn = document.getElementById('hud-pause-btn');
        if (pauseBtn) {
            pauseBtn.style.display = visible ? 'flex' : 'none';
        }
    }
    setTouchControls(false); // Hide initially (Menu is open)

    // Update global startGame to use selected level
    window.startGame = () => {
        // Double check lock before starting (extra safety, though button logic handles it)
        const isLocked = (currentPreviewLevel + 1) > gameState.maxLevel;
        if (isLocked) {
            console.log("Locked level");
            return;
        }

        console.log('Start Game triggered for Level ' + (currentPreviewLevel + 1));
        const startScreenWrapper = document.getElementById('start-screen');
        if (startScreenWrapper) startScreenWrapper.style.display = 'none';

        setTouchControls(true); // SHOW CONTROLS

        game.setGameState(gameState);
        game.resetGame();

        // Submit to leaderboard when starting a game (so even level 1 players appear)
        if (gameState && gameState.username) {
            Database.submitScore(
                gameState.username,
                gameState.playerLevel || 1,
                gameState.maxLevel || 1,
                gameState.playerXP || 0  // XP for secondary ranking
            );
        }

        // Set the level chosen in carousel
        game.levelIndex = currentPreviewLevel;
        game.startLevel();

        gameStarted = true;
        lastTime = performance.now();

        // Ensure audio context if needed
        if (window.AudioContext || window.webkitAudioContext) {
            // Audio init if any
        }
    };

    // Join the start button to the startGame function
    if (startBtn) {
        startBtn.addEventListener('click', window.startGame);
    }

    // PAUSE MENU LOGIC
    const pauseScreen = document.getElementById('pause-screen');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const quitBtn = document.getElementById('quit-btn');
    const hudPauseBtn = document.getElementById('hud-pause-btn');

    function togglePauseUI() {
        if (!gameStarted || game.gameOver || game.levelComplete) return;

        game.togglePause();

        if (game.paused) {
            pauseScreen.style.display = 'flex';
            audioManager.playSound('click');
        } else {
            pauseScreen.style.display = 'none';
        }
    }

    // Keyboard (Escape)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            togglePauseUI();
        }
    });

    // Touch/HUD Button
    if (hudPauseBtn) {
        hudPauseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            togglePauseUI();
        });
        hudPauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePauseUI();
        }, { passive: false });
    }

    // Menu Buttons
    if (resumeBtn) {
        resumeBtn.addEventListener('click', togglePauseUI);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            togglePauseUI();
            game.restartLevel();
        });
    }

    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            togglePauseUI();
            gameStarted = false;

            // Submit score to leaderboard before quitting
            if (gameState && gameState.username) {
                Database.submitScore(
                    gameState.username,
                    gameState.playerLevel, // Dragon level for ranking
                    gameState.maxLevel, // Max game level reached
                    gameState.playerXP || 0 // XP for secondary ranking
                );
            }

            // Hide tutorial overlay if active
            if (game.tutorial) {
                game.tutorial.reset();
            }

            game.resetGame();
            pauseScreen.style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            setTouchControls(false);
            renderPreview(currentPreviewLevel);
            updatePlayerLevelDisplay(); // Update level bar on main menu
        });
    }

    // Start the animation loop
    animate(0);
});
