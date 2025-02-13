export class AudioSystem {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.gainNode = this.audioContext.createGain();
        
        // Configuration avancée de l'analyseur
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        // Configuration du gain
        this.gainNode.gain.value = 0.74;
        
        // Connecter les nœuds
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // État et configuration
        this.state = {
            evolutionTime: 0,
            bassIntensity: 0,
            midIntensity: 0,
            highIntensity: 0,
            overallIntensity: 0,
            frequencyBands: new Array(this.bufferLength).fill(0),
            smoothedBands: new Array(this.bufferLength).fill(0)
        };
        
        // Configuration des bandes de fréquence
        this.freqRanges = {
            bass: { start: 0, end: Math.floor(this.bufferLength * 0.1), weight: 1.5 },
            mid: { start: Math.floor(this.bufferLength * 0.1), end: Math.floor(this.bufferLength * 0.5), weight: 1.2 },
            high: { start: Math.floor(this.bufferLength * 0.5), end: this.bufferLength, weight: 1.0 }
        };

        this.audioBuffer = null;
        this.source = null;
    }

    async loadAudio(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return true;
        } catch (error) {
            console.error('Error loading audio:', error);
            return false;
        }
    }

    play() {
        if (this.audioBuffer) {
            // Créer un nouveau nœud source
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            this.source.connect(this.analyser);
            this.source.start(0);
            return true;
        }
        return false;
    }

    pause() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
    }

    smoothValue(current, target, factor = 0.1, threshold = 0.001) {
        if (Math.abs(current - target) < threshold) return target;
        return current + (target - current) * factor;
    }

    getFrequencyIntensity(startIndex, endIndex, weight = 1.0) {
        let sum = 0;
        const length = endIndex - startIndex;
        
        for (let i = startIndex; i < endIndex; i++) {
            // Appliquer une courbe exponentielle pour plus de dynamisme
            const value = this.dataArray[i] / 255;
            sum += Math.pow(value, 1.5);
        }
        
        // Normaliser et appliquer le poids
        return (sum / length) * weight;
    }

    updateState() {
        // Mettre à jour les données brutes
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Mettre à jour le temps d'évolution
        this.state.evolutionTime += 0.001;
        
        // Calculer les intensités par bande avec lissage
        const { bass, mid, high } = this.freqRanges;
        
        const targetBass = this.getFrequencyIntensity(bass.start, bass.end, bass.weight);
        const targetMid = this.getFrequencyIntensity(mid.start, mid.end, mid.weight);
        const targetHigh = this.getFrequencyIntensity(high.start, high.end, high.weight);
        
        // Appliquer le lissage avec différents facteurs selon l'intensité
        this.state.bassIntensity = this.smoothValue(
            this.state.bassIntensity,
            targetBass,
            0.2 + targetBass * 0.3
        );
        
        this.state.midIntensity = this.smoothValue(
            this.state.midIntensity,
            targetMid,
            0.15 + targetMid * 0.25
        );
        
        this.state.highIntensity = this.smoothValue(
            this.state.highIntensity,
            targetHigh,
            0.1 + targetHigh * 0.2
        );
        
        // Calculer l'intensité globale avec pondération
        this.state.overallIntensity = (
            this.state.bassIntensity * 0.4 +
            this.state.midIntensity * 0.35 +
            this.state.highIntensity * 0.25
        );
        
        // Mettre à jour toutes les bandes de fréquence avec lissage
        for (let i = 0; i < this.bufferLength; i++) {
            const rawValue = this.dataArray[i] / 255;
            let weight = 1.0;
            
            // Appliquer les poids selon la plage
            if (i < bass.end) weight = bass.weight;
            else if (i < mid.end) weight = mid.weight;
            
            const targetValue = Math.pow(rawValue, 1.5) * weight;
            this.state.smoothedBands[i] = this.smoothValue(
                this.state.smoothedBands[i],
                targetValue,
                0.1 + rawValue * 0.2
            );
        }
    }

    getFrequencyRange(startFreq, endFreq) {
        // Convertir les fréquences en indices
        const nyquist = this.audioContext.sampleRate / 2;
        const startIndex = Math.floor((startFreq / nyquist) * this.bufferLength);
        const endIndex = Math.floor((endFreq / nyquist) * this.bufferLength);
        
        // Obtenir les données actuelles
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculer l'intensité moyenne de la plage
        let sum = 0;
        for (let i = startIndex; i < endIndex; i++) {
            sum += this.dataArray[i] / 255; // Normaliser entre 0 et 1
        }
        
        // Retourner la moyenne avec une courbe de réponse plus dynamique
        const average = sum / (endIndex - startIndex);
        return Math.pow(average, 1.5); // Courbe de réponse non linéaire
    }

    getBassFrequency() {
        this.updateState();
        return this.state.bassIntensity;
    }

    getMidFrequency() {
        return this.state.midIntensity;
    }

    getHighFrequency() {
        return this.state.highIntensity;
    }

    getOverallIntensity() {
        return this.state.overallIntensity;
    }

    getEvolutionTime() {
        return this.state.evolutionTime;
    }

    getSmoothedBand(index) {
        return this.state.smoothedBands[index];
    }
}
