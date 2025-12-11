export default class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.volume = 0.5;
        this.muted = false;
        this.sounds = {};
        this.music = null;

        // Initialize with Synthesized sounds (fallbacks) immediately
        // so we don't need external files to test
    }

    init() {
        // Resume AudioContext on user interaction (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadSound(name, path) {
        // Placeholder for file loading
        // For now we rely on synth, but this structure allows future expansion
        this.sounds[name] = { path: path, loaded: false };
        // In a real implementation: fetch(path).then(res => res.arrayBuffer()).then(...)
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    playSound(name) {
        if (this.muted) return;
        this.init(); // Ensure context is running

        // Synthesizer switch for immediate feedback without assets
        switch (name) {
            case 'shoot':
                this.playTone(400, 'square', 0.1, -100); // Pew
                break;
            case 'jump':
                this.playTone(150, 'sine', 0.15, 200); // Boing
                break;
            case 'trap':
                this.playTone(600, 'triangle', 0.1, 0); // Trap
                break;
            case 'pop':
                this.playTone(800, 'sawtooth', 0.05, -400); // Pop
                break;
            case 'coin':
                this.playTone(1200, 'sine', 0.1, 0, 0.1, 1500); // Ding
                break;
            case 'gamestart':
                this.playMelody();
                break;
            case 'gameover':
                this.playTone(100, 'sawtooth', 0.5, -50);
                break;
        }
    }

    playTone(freq, type, duration, slideFreq = 0, delay = 0, secondFreq = 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

        if (slideFreq !== 0) {
            osc.frequency.linearRampToValueAtTime(freq + slideFreq, this.ctx.currentTime + delay + duration);
        }

        if (secondFreq !== 0) {
            osc.frequency.setValueAtTime(secondFreq, this.ctx.currentTime + delay + duration * 0.5);
        }

        gain.gain.setValueAtTime(this.volume, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }

    playMelody() {
        // Simple start melody
        const now = this.ctx.currentTime;
        [440, 554, 659, 880].forEach((freq, i) => {
            this.playTone(freq, 'square', 0.1, 0, i * 0.1);
        });
    }
}
