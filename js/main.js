import { AudioSystem } from './audioSystem.js';
import { EnergyBallVisualizer } from './visualizer.js';
import { Recorder } from './recorder.js';

class App {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.audioSystem = new AudioSystem();
        this.visualizer = new EnergyBallVisualizer(this.canvas);
        this.recorder = new Recorder(this.canvas, this.audioSystem);
        this.isPlaying = false;
        this.animationId = null;
        
        this.setupEventListeners();
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const playRecordBtn = document.getElementById('playRecordBtn');

        window.addEventListener('resize', () => this.resizeCanvas());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const success = await this.audioSystem.loadAudio(file);
                if (success) {
                    playRecordBtn.disabled = false;
                    playRecordBtn.textContent = 'Play & Record';
                    this.isPlaying = false;
                }
            }
        });

        playRecordBtn.addEventListener('click', async () => {
            if (!this.isPlaying) {
                const playSuccess = this.audioSystem.play();
                if (playSuccess) {
                    const recordSuccess = await this.recorder.startRecording();
                    if (recordSuccess) {
                        this.isPlaying = true;
                        playRecordBtn.textContent = 'Stop';
                        
                        if (!this.animationId) {
                            this.animate();
                        }
                    }
                }
            } else {
                this.audioSystem.pause();
                await this.recorder.stopRecording();
                this.isPlaying = false;
                playRecordBtn.textContent = 'Play & Record';
                
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
            }
        });

        playRecordBtn.disabled = true;
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.isPlaying) return;
        
        // Obtenir l'analyse audio complète
        const analysis = {
            bands: {
                subBass: { intensity: this.audioSystem.getFrequencyRange(20, 60) },
                bass: { intensity: this.audioSystem.getFrequencyRange(60, 250) },
                lowMids: { intensity: this.audioSystem.getFrequencyRange(250, 500) },
                highMids: { intensity: this.audioSystem.getFrequencyRange(500, 2000) },
                highs: { intensity: this.audioSystem.getFrequencyRange(2000, 20000) }
            }
        };
        
        // Mettre à jour la visualisation avec l'analyse complète
        this.visualizer.update(analysis);
        this.visualizer.draw();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
