export default class InputHandler {
    constructor() {
        this.keys = {}; // Use Object map instead of Array
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === ' ' ||
                e.key === 'z' ||
                e.key === 'x') {
                this.keys[e.key] = true;
            }
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === ' ' ||
                e.key === 'z' ||
                e.key === 'x') {
                this.keys[e.key] = false;
            }
        });

        this.setupTouchControls();
    }

    setupTouchControls() {
        // Updated to work with Object-based keys
        const addKey = (key) => {
            this.keys[key] = true;
        };
        const removeKey = (key) => {
            this.keys[key] = false;
        };

        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const start = (e) => {
                e.preventDefault();
                addKey(key);
            };
            const end = (e) => {
                e.preventDefault();
                removeKey(key);
            };

            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false }); // Failsafe for interruptions
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        bindBtn('btn-left', 'ArrowLeft');
        bindBtn('btn-right', 'ArrowRight');
        bindBtn('btn-jump', 'ArrowUp');
        bindBtn('btn-shoot', 'z'); // 'z' is shoot
    }
}
