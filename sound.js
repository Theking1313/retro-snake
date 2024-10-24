// sound.js
export class SoundFX {
    constructor() {
        // Create audio context but don't initialize it yet
        this.audioContext = null;
        this.themeLoop = null;
        this.isThemePlaying = false;
        this.currentSection = 0;
    }

    init() {
        // Only initialize audio context if it hasn't been created yet
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async autoStart() {
        try {
            // Initialize audio context if needed
            if (!this.audioContext) {
                this.init();
            }

            // Try to resume audio context
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create and play a silent buffer to unlock audio
            const silentBuffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(this.audioContext.destination);
            source.start();

            // Start the theme music
            setTimeout(() => this.playTheme(), 100);
        } catch (error) {
            console.log('Audio autoplay failed, will start on user interaction');
            // Add click handler to document as fallback
            const startAudio = async () => {
                if (!this.audioContext) {
                    this.init();
                }
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    this.playTheme();
                }
                document.removeEventListener('click', startAudio);
            };
            document.addEventListener('click', startAudio);
        }
    }

    playCollect() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        this.playNote(880, 0.1, 'square');
        setTimeout(() => this.playNote(1320, 0.1, 'square'), 50);
    }

    playGameOver() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        this.playNote(440, 0.2, 'square');
        setTimeout(() => this.playNote(330, 0.2, 'square'), 200);
        setTimeout(() => this.playNote(220, 0.3, 'square'), 400);
    }

    playMove() {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        this.playNote(220, 0.05, 'square', 0.1);
    }

    playNote(frequency, duration, type = 'square', volume = 0.2) {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, this.audioContext.currentTime + duration
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playArpeggio(baseNote, pattern, duration, delay) {
        if (!this.audioContext || this.audioContext.state === 'suspended') return;
        pattern.forEach((multiplier, index) => {
            setTimeout(() => {
                this.playNote(baseNote * multiplier, duration, 'square', 0.1);
            }, delay * index);
        });
    }

    playTheme() {
        // Initialize audio context if it hasn't been created yet
        if (!this.audioContext) {
            this.init();
        }

        if (!this.audioContext || this.audioContext.state === 'suspended' || this.isThemePlaying) return;
        this.isThemePlaying = true;

        // Define multiple sections of the theme
        const sections = [
            // Section 1: Intro with rising arpeggios
            [
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.25, 1.5, 2], duration: 0.15, delay: 150 },
                { note: 440, duration: 0.4 },
                { type: 'arpeggio', baseNote: 261.63, pattern: [1, 1.25, 1.5, 2], duration: 0.15, delay: 150 },
                { note: 523.25, duration: 0.4 },
                { type: 'arpeggio', baseNote: 293.66, pattern: [1, 1.25, 1.5, 2], duration: 0.15, delay: 150 },
                { note: 587.33, duration: 0.4 },
            ],

            // Section 2: Main melody A
            [
                { note: 440.00, duration: 0.3 }, // A4
                { note: 493.88, duration: 0.3 }, // B4
                { note: 523.25, duration: 0.3 }, // C5
                { note: 493.88, duration: 0.2 }, // B4
                { note: 440.00, duration: 0.3 }, // A4
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.5, 2, 1.5], duration: 0.15, delay: 100 },
                { note: 392.00, duration: 0.3 }, // G4
                { note: 440.00, duration: 0.4 }, // A4
            ],

            // Section 3: Snake-like chromatic movement
            [
                { note: 261.63, duration: 0.2 }, // C4
                { note: 277.18, duration: 0.2 }, // C#4
                { note: 293.66, duration: 0.2 }, // D4
                { note: 311.13, duration: 0.2 }, // D#4
                { note: 329.63, duration: 0.3 }, // E4
                { type: 'arpeggio', baseNote: 165, pattern: [1, 1.5, 2, 2.5], duration: 0.15, delay: 150 },
                { note: 349.23, duration: 0.2 }, // F4
                { note: 329.63, duration: 0.2 }, // E4
                { note: 311.13, duration: 0.2 }, // D#4
                { note: 293.66, duration: 0.3 }, // D4
            ],

            // Section 4: Power-up sequence
            [
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.25, 1.5, 2, 2.5], duration: 0.1, delay: 100 },
                { note: 880.00, duration: 0.3 }, // A5
                { note: 739.99, duration: 0.2 }, // F#5
                { note: 659.26, duration: 0.2 }, // E5
                { note: 587.33, duration: 0.3 }, // D5
                { type: 'arpeggio', baseNote: 293.66, pattern: [1, 1.25, 1.5, 2], duration: 0.1, delay: 100 },
            ],

            // Section 5: Bass groove with high melody
            [
                { note: 220.00, duration: 0.2 }, // A3
                { note: 440.00, duration: 0.1 }, // A4
                { note: 220.00, duration: 0.2 }, // A3
                { note: 493.88, duration: 0.1 }, // B4
                { note: 261.63, duration: 0.2 }, // C4
                { note: 523.25, duration: 0.1 }, // C5
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.5, 2, 2.5], duration: 0.15, delay: 150 },
                { note: 493.88, duration: 0.2 }, // B4
                { note: 440.00, duration: 0.3 }, // A4
            ],

            // Section 6: Intense bridge
            [
                { type: 'arpeggio', baseNote: 329.63, pattern: [1, 1.25, 1.5, 2], duration: 0.1, delay: 100 },
                { note: 659.26, duration: 0.3 }, // E5
                { note: 587.33, duration: 0.2 }, // D5
                { note: 523.25, duration: 0.2 }, // C5
                { type: 'arpeggio', baseNote: 293.66, pattern: [1, 1.25, 1.5, 2], duration: 0.1, delay: 100 },
                { note: 587.33, duration: 0.3 }, // D5
                { note: 523.25, duration: 0.2 }, // C5
                { note: 493.88, duration: 0.2 }, // B4
            ],

            // Section 7: Victory fanfare variation
            [
                { note: 440.00, duration: 0.2 }, // A4
                { note: 554.37, duration: 0.2 }, // C#5
                { note: 659.26, duration: 0.4 }, // E5
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.5, 2, 3], duration: 0.15, delay: 150 },
                { note: 587.33, duration: 0.2 }, // D5
                { note: 523.25, duration: 0.2 }, // C5
                { note: 493.88, duration: 0.3 }, // B4
                { note: 440.00, duration: 0.4 }, // A4
            ],

            // Section 8: Final build-up
            [
                { type: 'arpeggio', baseNote: 220, pattern: [1, 1.25, 1.5, 2, 2.5, 3], duration: 0.1, delay: 100 },
                { note: 880.00, duration: 0.4 }, // A5
                { type: 'arpeggio', baseNote: 261.63, pattern: [1, 1.25, 1.5, 2, 2.5, 3], duration: 0.1, delay: 100 },
                { note: 1046.50, duration: 0.4 }, // C6
                { type: 'arpeggio', baseNote: 220, pattern: [3, 2.5, 2, 1.5, 1], duration: 0.1, delay: 100 },
                { note: 440.00, duration: 0.6 }, // A4
            ]
        ];

        let currentSectionIndex = 0;
        let currentNoteIndex = 0;

        const playNextNote = () => {
            if (!this.isThemePlaying) return;

            const currentSection = sections[currentSectionIndex];
            const note = currentSection[currentNoteIndex];

            if (note.type === 'arpeggio') {
                this.playArpeggio(note.baseNote, note.pattern, note.duration, note.delay);
            } else {
                this.playNote(note.note, note.duration, 'square', 0.12);
            }

            currentNoteIndex++;

            if (currentNoteIndex >= currentSection.length) {
                currentNoteIndex = 0;
                currentSectionIndex = (currentSectionIndex + 1) % sections.length;
            }

            // Schedule next note
            const delay = note.type === 'arpeggio' 
                ? note.delay * note.pattern.length 
                : note.duration * 1000;
            
            this.themeLoop = setTimeout(playNextNote, delay);
        };

        playNextNote();
    }

    stopTheme() {
        this.isThemePlaying = false;
        if (this.themeLoop) {
            clearTimeout(this.themeLoop);
            this.themeLoop = null;
        }
    }
}