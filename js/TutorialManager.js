// TutorialManager.js - Interactive tutorial for new players

export default class TutorialManager {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.currentStep = 0;
        this.stepCompleted = false;
        this.overlay = null;

        // Tutorial steps
        this.steps = [
            {
                id: 'welcome',
                title: '👋 BENVENUTO!',
                text: 'Impara a giocare in pochi semplici passi!',
                action: 'any', // Any input to continue
                indicator: null
            },
            {
                id: 'move',
                title: '🏃 MUOVITI',
                text: 'Usa ← → per muoverti a sinistra e destra',
                action: 'move', // Player must move
                indicator: 'arrows'
            },
            {
                id: 'jump',
                title: '🦘 SALTA',
                text: 'Premi ↑ per saltare!',
                action: 'jump', // Player must jump
                indicator: 'up'
            },
            {
                id: 'shoot',
                title: '🫧 SPARA BOLLE',
                text: 'Premi SPAZIO per sparare bolle',
                action: 'shoot', // Player must shoot
                indicator: 'space'
            },
            {
                id: 'trap',
                title: '👾 CATTURA NEMICI',
                text: 'Colpisci i nemici con le bolle per intrappolarli!',
                action: 'trap', // Player must trap an enemy
                indicator: null
            },
            {
                id: 'pop',
                title: '💥 SCOPPIA LA BOLLA',
                text: 'Tocca un nemico intrappolato per sconfiggerlo!',
                action: 'pop', // Player must pop a trapped enemy
                indicator: null
            },
            {
                id: 'complete',
                title: '🎉 OTTIMO LAVORO!',
                text: 'Ora sei pronto per giocare! Buon divertimento!',
                action: 'any',
                indicator: null
            }
        ];

        // Create tutorial overlay
        this.createOverlay();
    }

    createOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            pointer-events: none;
            z-index: 1000;
        `;

        // Tutorial box
        this.tutorialBox = document.createElement('div');
        this.tutorialBox.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 4px solid #ffd700;
            border-radius: 15px;
            padding: 20px 30px;
            text-align: center;
            min-width: 280px;
            max-width: 90%;
            font-family: 'Press Start 2P', monospace;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        `;

        this.tutorialTitle = document.createElement('div');
        this.tutorialTitle.style.cssText = `
            color: #ffd700;
            font-size: 16px;
            margin-bottom: 10px;
        `;

        this.tutorialText = document.createElement('div');
        this.tutorialText.style.cssText = `
            color: #ffffff;
            font-size: 10px;
            line-height: 1.6;
            margin-bottom: 15px;
        `;

        this.tutorialHint = document.createElement('div');
        this.tutorialHint.style.cssText = `
            color: #00ff00;
            font-size: 8px;
            opacity: 0.8;
            animation: pulse 1.5s infinite;
        `;

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);

        this.tutorialBox.appendChild(this.tutorialTitle);
        this.tutorialBox.appendChild(this.tutorialText);
        this.tutorialBox.appendChild(this.tutorialHint);
        this.overlay.appendChild(this.tutorialBox);
        document.body.appendChild(this.overlay);
    }

    // Check if tutorial should show (first time playing)
    shouldShowTutorial(gameState) {
        if (!gameState) return false;
        return !gameState.tutorialCompleted;
    }

    // Start tutorial
    start() {
        this.active = true;
        this.currentStep = 0;
        this.stepCompleted = false;
        this.overlay.style.display = 'block';
        this.showStep();
    }

    // Show current step
    showStep() {
        const step = this.steps[this.currentStep];
        if (!step) {
            this.complete();
            return;
        }

        this.tutorialTitle.textContent = step.title;
        this.tutorialText.textContent = step.text;

        // Show hint based on action
        if (step.action === 'any') {
            this.tutorialHint.textContent = '▶ Tocca per continuare';
        } else if (step.action === 'move') {
            this.tutorialHint.textContent = '◄ ► Muoviti per continuare';
        } else if (step.action === 'jump') {
            this.tutorialHint.textContent = '▲ Salta per continuare';
        } else if (step.action === 'shoot') {
            this.tutorialHint.textContent = '🫧 Spara per continuare';
        } else if (step.action === 'trap') {
            this.tutorialHint.textContent = '👾 Cattura un nemico!';
        } else if (step.action === 'pop') {
            this.tutorialHint.textContent = '💥 Sconfiggi il nemico!';
        } else {
            this.tutorialHint.textContent = '';
        }

        this.stepCompleted = false;
    }

    // Check if current step action was performed
    checkAction(actionType) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];
        if (!step) return;

        // Check if action matches required action
        if (step.action === 'any' || step.action === actionType) {
            this.nextStep();
        }
    }

    // Move to next step
    nextStep() {
        if (this.stepCompleted) return;
        this.stepCompleted = true;

        this.currentStep++;

        if (this.currentStep >= this.steps.length) {
            this.complete();
        } else {
            // Small delay before showing next step
            setTimeout(() => this.showStep(), 500);
        }
    }

    // Complete tutorial
    complete() {
        this.active = false;
        this.overlay.style.display = 'none';

        // Save completion to gameState
        if (this.game.gameState) {
            this.game.gameState.tutorialCompleted = true;
            this.game.gameState.save();
        }

        console.log('✅ Tutorial completato!');
    }

    // Skip tutorial
    skip() {
        this.complete();
    }

    // Update (called from game loop)
    update(input) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];
        if (!step) return;

        // Check for step completion based on input
        if (step.action === 'any') {
            // Any key/touch continues
            if (input['ArrowUp'] || input['ArrowLeft'] || input['ArrowRight'] ||
                input[' '] || input['Space'] || input['Enter']) {
                this.nextStep();
            }
        } else if (step.action === 'move') {
            if (input['ArrowLeft'] || input['ArrowRight']) {
                this.nextStep();
            }
        } else if (step.action === 'jump') {
            if (input['ArrowUp']) {
                this.nextStep();
            }
        } else if (step.action === 'shoot') {
            if (input[' '] || input['Space']) {
                this.nextStep();
            }
        }
        // 'trap' and 'pop' are checked via checkAction() from Game.js
    }

    // Check if tutorial is blocking gameplay
    isBlocking() {
        return this.active && this.steps[this.currentStep]?.action === 'any';
    }

    // Draw indicator arrows (if needed) - called from Game.draw
    draw(ctx) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];
        if (!step || !step.indicator) return;

        // Draw visual indicator pointing to controls
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';

        const time = Date.now() / 500;
        const bounce = Math.sin(time) * 5;

        if (step.indicator === 'arrows') {
            ctx.fillText('← →', this.game.width / 2, this.game.height - 100 + bounce);
        } else if (step.indicator === 'up') {
            ctx.fillText('↑', this.game.width / 2, this.game.height - 100 + bounce);
        } else if (step.indicator === 'space') {
            ctx.fillText('SPAZIO', this.game.width / 2, this.game.height - 100 + bounce);
        }

        ctx.restore();
    }
}
