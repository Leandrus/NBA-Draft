/**
 * NBA Ultimate Draft - Sound Effects & Music Engine
 * Combines procedural Web Audio API effects with continuous BGM & Victory audio tracks.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgMusicVolume = 0.35;
        this.victoryVolume = 0.8;
        this._lastVictoryPlay = 0;
        this._wasPlayingBeforeHide = false;
        this.bgMusicStarted = false;

        // Restore mute preference
        try {
            const saved = localStorage.getItem('nba_draft_muted');
            if (saved !== null) {
                this.isMuted = saved === 'true';
            }
        } catch (e) {
            console.warn("Storage not accessible for audio state", e);
        }

        // Initialize audio elements for music
        this.initAudioTracks();
        this.setupAutoplayTriggers();
    }

    initAudioTracks() {
        try {
            // Background music loop
            this.bgMusic = new Audio('audio/music_bkg_loop.mp3');
            this.bgMusic.loop = true;
            this.bgMusic.volume = this.bgMusicVolume;
            this.bgMusic.preload = 'auto';

            // Victory sound for winner & MVP
            this.victoryAudio = new Audio('audio/music_victory.mp3');
            this.victoryAudio.loop = false;
            this.victoryAudio.volume = this.victoryVolume;
            this.victoryAudio.preload = 'auto';

            if (this.isMuted) {
                this.bgMusic.muted = true;
                this.victoryAudio.muted = true;
            }
        } catch (e) {
            console.warn("Error creating Audio elements:", e);
        }
    }

    setupAutoplayTriggers() {
        // Try autoplaying immediately
        if (!this.isMuted) {
            this.playBgMusic();
        }

        // If browser blocks autoplay, start on first interaction
        const startAudioOnInteraction = () => {
            this.init();
            if (!this.isMuted && (!this.bgMusic || this.bgMusic.paused)) {
                this.playBgMusic();
            }
            window.removeEventListener('click', startAudioOnInteraction);
            window.removeEventListener('keydown', startAudioOnInteraction);
            window.removeEventListener('touchstart', startAudioOnInteraction);
            window.removeEventListener('pointerdown', startAudioOnInteraction);
        };

        window.addEventListener('click', startAudioOnInteraction, { passive: true });
        window.addEventListener('keydown', startAudioOnInteraction, { passive: true });
        window.addEventListener('touchstart', startAudioOnInteraction, { passive: true });
        window.addEventListener('pointerdown', startAudioOnInteraction, { passive: true });

        // Pause/resume on tab visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.bgMusic && !this.bgMusic.paused) {
                    this._wasPlayingBeforeHide = true;
                    this.bgMusic.pause();
                }
            } else {
                if (this._wasPlayingBeforeHide && !this.isMuted) {
                    this._wasPlayingBeforeHide = false;
                    this.playBgMusic();
                }
            }
        });
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (!this.isMuted && this.bgMusic && this.bgMusic.paused) {
            this.playBgMusic();
        }
    }

    playBgMusic() {
        if (this.isMuted || !this.bgMusic) return;
        this.bgMusic.muted = false;
        const playPromise = this.bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.bgMusicStarted = true;
            }).catch(() => {
                // Autoplay was blocked by browser; will retry on first user interaction
            });
        }
    }

    pauseBgMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    playVictory() {
        if (this.isMuted || !this.victoryAudio) return;

        // Prevent rapid repeated triggers
        const now = Date.now();
        if (now - this._lastVictoryPlay < 2500) {
            return;
        }
        this._lastVictoryPlay = now;

        try {
            // Lower background music volume slightly during victory celebration
            if (this.bgMusic && !this.bgMusic.paused) {
                this.bgMusic.volume = this.bgMusicVolume * 0.25;
            }

            this.victoryAudio.currentTime = 0;
            this.victoryAudio.muted = false;
            const playPromise = this.victoryAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("Victory audio playback blocked:", e);
                });
            }

            // Restore background music volume when victory audio finishes
            this.victoryAudio.onended = () => {
                if (this.bgMusic && !this.isMuted) {
                    this.bgMusic.volume = this.bgMusicVolume;
                }
            };
        } catch (e) {
            console.warn("Could not play victory sound:", e);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        try {
            localStorage.setItem('nba_draft_muted', this.isMuted.toString());
        } catch (e) {}

        if (this.bgMusic) {
            this.bgMusic.muted = this.isMuted;
            if (this.isMuted) {
                this.bgMusic.pause();
            } else {
                this.playBgMusic();
            }
        }

        if (this.victoryAudio) {
            this.victoryAudio.muted = this.isMuted;
            if (this.isMuted) {
                this.victoryAudio.pause();
            }
        }

        return this.isMuted;
    }

    /**
     * Subtle UI Click sound
     */
    playClick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    /**
     * Card flip / selection sound
     */
    playCardFlip() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
    }

    /**
     * Basketball swish sound on basket made
     */
    playSwish() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // White noise burst through bandpass filter
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.16);
        filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    /**
     * Deep Arena Buzzer sound for quarter end / game end
     */
    playBuzzer() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(146.83, this.ctx.currentTime); // D3

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(155.56, this.ctx.currentTime); // D#3 dissonant buzz

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.ctx.currentTime + 0.95);
        osc2.stop(this.ctx.currentTime + 0.95);
    }

    /**
     * Referee Whistle sound for tip-off / fouls / timeouts
     */
    playWhistle() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const mainGain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2600, this.ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2650, this.ctx.currentTime);

        // Rapid trill / vibrato
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(28, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

        lfo.connect(osc1.frequency);
        lfo.connect(osc2.frequency);

        mainGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc1.connect(mainGain);
        osc2.connect(mainGain);
        mainGain.connect(this.ctx.destination);

        lfo.start();
        osc1.start();
        osc2.start();

        lfo.stop(this.ctx.currentTime + 0.42);
        osc1.stop(this.ctx.currentTime + 0.42);
        osc2.stop(this.ctx.currentTime + 0.42);
    }

    /**
     * Block / Steal defensive impact sound
     */
    playDefensivePlay() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
    }

    /**
     * Victory cheer / celebration crowd sound
     */
    playCheer() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const dur = 1.6;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.7;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(2400, this.ctx.currentTime + 0.8);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    /**
     * Fanfare chord for MVP and Champions
     */
    playFanfare() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

            gain.gain.setValueAtTime(0.01, this.ctx.currentTime + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + idx * 0.08 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.08);
            osc.stop(this.ctx.currentTime + 1.3);
        });
    }
}

// Global instance
const audio = new SoundEngine();
window.audio = audio;
