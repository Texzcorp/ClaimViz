export class Recorder {
    constructor(canvas, audioSystem) {
        this.canvas = canvas;
        this.audioSystem = audioSystem;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordCanvas = document.createElement('canvas');
        this.recordCtx = null;
    }

    async startRecording() {
        try {
            // Initialiser le canvas de recording
            this.recordCanvas.width = this.canvas.width;
            this.recordCanvas.height = this.canvas.height;
            this.recordCtx = this.recordCanvas.getContext('2d', {
                alpha: false,
                willReadFrequently: false
            });

            // Configurer le stream
            const stream = this.recordCanvas.captureStream(60);
            
            // Essayer d'abord avec H264
            let options = {
                mimeType: 'video/mp4;codecs=avc1.42E01E',
                videoBitsPerSecond: 8000000 // 8 Mbps
            };

            try {
                this.mediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn('H264 non supporté, tentative avec codec par défaut:', e);
                this.mediaRecorder = new MediaRecorder(stream);
            }

            this.recordedChunks = [];
            
            // Fonction de rendu
            const renderFrame = () => {
                if (!this.isRecording) return;
                
                // Fond noir opaque
                this.recordCtx.fillStyle = '#000000';
                this.recordCtx.fillRect(0, 0, this.recordCanvas.width, this.recordCanvas.height);
                
                // Dessiner le canvas original
                this.recordCtx.drawImage(this.canvas, 0, 0);
                
                requestAnimationFrame(renderFrame);
            };

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, {
                    type: 'video/mp4'
                });

                const date = new Date();
                const fileName = `visualizer_${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}${date.getMinutes().toString().padStart(2,'0')}${date.getSeconds().toString().padStart(2,'0')}.mp4`;

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                document.body.appendChild(a);
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                a.click();

                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                this.recordedChunks = [];
            };

            // Démarrer l'enregistrement
            this.mediaRecorder.start();
            this.isRecording = true;
            renderFrame();
            console.log('Enregistrement démarré...');
            return true;

        } catch (err) {
            console.error('Erreur lors du démarrage de l\'enregistrement:', err);
            alert('Erreur lors du démarrage de l\'enregistrement. Vérifiez la console pour plus de détails.');
            return false;
        }
    }

    async stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('Enregistrement terminé');
        }
    }
}
