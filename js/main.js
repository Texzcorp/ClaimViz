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
        this.isRecording = false;
        this.animationId = null;
        
        this.setupEventListeners();
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    updateButtonStates() {
        const fileInput = document.getElementById('fileInput');
        const fileLabel = document.querySelector('.file-label');
        const playBtn = document.getElementById('playBtn');
        const playRecordBtn = document.getElementById('playRecordBtn');

        // État initial : tout est désactivé sauf le choix de fichier
        fileInput.disabled = this.isPlaying || this.isRecording;
        fileLabel.style.opacity = fileInput.disabled ? '0.5' : '1';
        fileLabel.style.pointerEvents = fileInput.disabled ? 'none' : 'auto';

        // Play button
        playBtn.disabled = !this.audioSystem.audioBuffer || this.isRecording;
        playBtn.style.opacity = playBtn.disabled ? '0.5' : '1';

        // Play & Record button
        // Le bouton est désactivé seulement si on est en lecture simple ou si aucun fichier n'est chargé
        playRecordBtn.disabled = !this.audioSystem.audioBuffer || (this.isPlaying && !this.isRecording);
        playRecordBtn.style.opacity = playRecordBtn.disabled ? '0.5' : '1';
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const playRecordBtn = document.getElementById('playRecordBtn');
        const playBtn = document.getElementById('playBtn');

        window.addEventListener('resize', () => this.resizeCanvas());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const success = await this.audioSystem.loadAudio(file);
                if (success) {
                    this.isPlaying = false;
                    this.isRecording = false;
                    this.updateButtonStates();
                }
            }
        });

        playBtn.addEventListener('click', async () => {
            if (!this.isPlaying) {
                const playSuccess = this.audioSystem.play();
                if (playSuccess) {
                    this.isPlaying = true;
                    playBtn.textContent = 'Stop';
                    
                    if (!this.animationId) {
                        this.animate();
                    }
                }
            } else {
                this.audioSystem.pause();
                this.isPlaying = false;
                playBtn.textContent = 'Play';
                
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                    this.visualizer.reset();
                }
            }
            this.updateButtonStates();
        });

        playRecordBtn.addEventListener('click', async () => {
            if (!this.isRecording) {
                const playSuccess = this.audioSystem.play();
                if (playSuccess) {
                    const recordSuccess = await this.recorder.startRecording();
                    if (recordSuccess) {
                        this.isRecording = true;
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
                this.isRecording = false;
                this.isPlaying = false;
                playRecordBtn.textContent = 'Play & Record';
                
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                    this.visualizer.reset();
                }
            }
            this.updateButtonStates();
        });

        // État initial des boutons
        this.updateButtonStates();
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
