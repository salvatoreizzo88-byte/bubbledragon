// UIManager.js - Centralized UI state and screen management
// Refactored from main.js to improve code organization

export default class UIManager {
    constructor() {
        // Screen elements
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            shop: document.getElementById('shop-screen'),
            achievements: document.getElementById('achievements-screen'),
            leaderboard: document.getElementById('leaderboard-screen'),
            dragonStats: document.getElementById('dragon-stats-screen'),
            levelSelect: document.getElementById('level-select-screen'),
            mainMenu: document.getElementById('main-menu'),
            auth: document.getElementById('auth-screen')
        };

        // Current active screen
        this.currentScreen = 'start';

        // Screen history for back navigation
        this.screenHistory = [];
    }

    // Show a specific screen, hiding all others
    showScreen(screenName) {
        // Hide all screens first
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.style.display = 'none';
        });

        // Show requested screen
        const target = this.screens[screenName];
        if (target) {
            target.style.display = 'flex';

            // Save to history
            if (this.currentScreen !== screenName) {
                this.screenHistory.push(this.currentScreen);
            }
            this.currentScreen = screenName;
        }
    }

    // Go back to previous screen
    goBack() {
        if (this.screenHistory.length > 0) {
            const previousScreen = this.screenHistory.pop();
            this.showScreen(previousScreen);
            return true;
        }
        return false;
    }

    // Show start screen (main menu)
    showStartScreen() {
        this.showScreen('start');
    }

    // Show game screen
    showGameScreen() {
        this.showScreen('game');
    }

    // Show shop screen
    showShopScreen() {
        this.showScreen('shop');
    }

    // Show achievements screen
    showAchievementsScreen() {
        this.showScreen('achievements');
    }

    // Show leaderboard screen
    showLeaderboardScreen() {
        this.showScreen('leaderboard');
    }

    // Show dragon stats screen
    showDragonStatsScreen() {
        this.showScreen('dragonStats');
    }

    // Get current screen name
    getCurrentScreen() {
        return this.currentScreen;
    }

    // Check if a screen is visible
    isScreenVisible(screenName) {
        return this.currentScreen === screenName;
    }

    // === UTILITY FUNCTIONS ===

    // Format number with commas
    static formatNumber(num) {
        return (num || 0).toLocaleString();
    }

    // Format time in MM:SS
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Show toast notification
    static showToast(message, duration = 2000, color = '#ffd700') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${color};
            color: #000;
            padding: 15px 25px;
            border-radius: 10px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            z-index: 9999;
            animation: fadeInOut ${duration}ms ease-in-out;
            pointer-events: none;
        `;
        toast.textContent = message;

        // Add animation style if not exists
        if (!document.getElementById('toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }

    // Disable/enable button with visual feedback
    static setButtonState(button, enabled, loadingText = null) {
        if (!button) return;

        button.disabled = !enabled;
        button.style.opacity = enabled ? '1' : '0.5';
        button.style.pointerEvents = enabled ? 'auto' : 'none';

        if (loadingText && !enabled) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        } else if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }

    // Animate element with CSS class
    static animate(element, animationClass, duration = 500) {
        return new Promise(resolve => {
            element.classList.add(animationClass);
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    }
}
