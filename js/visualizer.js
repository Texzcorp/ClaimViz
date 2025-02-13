export class Visualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    update(analysis) {
        // Méthode à surcharger dans les classes enfants
    }

    draw() {
        // Méthode à surcharger dans les classes enfants
    }
}

export class EnergyBallVisualizer extends Visualizer {
    constructor(canvas) {
        super(canvas);
        
        // Paramètres spécifiques à la boule d'énergie
        this.energyParticles = [];
        this.particleCount = 300; // Augmentation du nombre de particules
        this.baseRadius = 100;
        this.maxRadius = 300; // Augmentation de l'expansion maximale
        
        // Paramètres 3D
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.perspective = 1000;
        
        // Paramètres de réactivité audio avec lissage plus rapide
        this.energyLevels = {
            subBass: 0,
            bass: 0,
            lowMids: 0,
            highMids: 0,
            highs: 0
        };
        
        // Paramètres de comportement des particules
        this.wanderingRadius = 200; // Rayon de vagabondage
        this.wanderingSpeed = 0.02; // Vitesse de vagabondage
        this.returnForce = 0.03; // Force de retour vers la boule
        this.highFreqJitter = 0.5; // Intensité du tressaillement des aigus
        
        // Lissage personnalisé pour chaque bande
        this.smoothingFactors = {
            subBass: 0.3, // Plus réactif
            bass: 0.25,   // Plus réactif
            lowMids: 0.15,
            highMids: 0.1,
            highs: 0.05   // Très réactif
        };
        
        // Initialisation des particules
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            
            this.energyParticles.push({
                x: 0,
                y: 0,
                z: 0,
                baseX: Math.cos(theta) * Math.sin(phi),
                baseY: Math.sin(theta) * Math.sin(phi),
                baseZ: Math.cos(phi),
                speed: Math.random() * 2 + 1,
                size: Math.random() * 3 + (i < this.particleCount * 0.3 ? 3 : 1), // 30% de grosses particules
                color: `hsl(${Math.random() * 60 + 200}, 100%, 50%)`,
                angle: Math.random() * Math.PI * 2,
                wanderAngleX: Math.random() * Math.PI * 2,
                wanderAngleY: Math.random() * Math.PI * 2,
                wanderAngleZ: Math.random() * Math.PI * 2,
                wanderPhase: Math.random() * Math.PI * 2,
                energyOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(analysis) {
        const { subBass, bass, lowMids, highMids, highs } = analysis.bands;
        
        // Mise à jour des niveaux d'énergie avec lissage personnalisé
        this.energyLevels = {
            subBass: this.lerp(this.energyLevels.subBass, subBass.intensity, this.smoothingFactors.subBass),
            bass: this.lerp(this.energyLevels.bass, bass.intensity, this.smoothingFactors.bass),
            lowMids: this.lerp(this.energyLevels.lowMids, lowMids.intensity, this.smoothingFactors.lowMids),
            highMids: this.lerp(this.energyLevels.highMids, highMids.intensity, this.smoothingFactors.highMids),
            highs: this.lerp(this.energyLevels.highs, highs.intensity, this.smoothingFactors.highs)
        };
        
        const totalEnergy = (
            this.energyLevels.subBass +
            this.energyLevels.bass +
            this.energyLevels.lowMids +
            this.energyLevels.highMids +
            this.energyLevels.highs
        ) / 5;

        // Facteur de vitesse basé sur l'énergie totale
        const speedFactor = Math.pow(totalEnergy, 1.5); // Réponse non linéaire pour plus de contraste
        
        // Mise à jour de la rotation avec vitesse variable
        this.rotationX += this.energyLevels.lowMids * 0.03 * speedFactor;
        this.rotationY += this.energyLevels.highMids * 0.04 * speedFactor;
        this.rotationZ += this.energyLevels.highs * 0.02 * speedFactor;
        
        // Comportement de vagabondage inversement proportionnel à l'énergie
        const wanderStrength = Math.max(0, 1 - totalEnergy * 2);
        this.wanderingSpeed = 0.02 * (1 - totalEnergy * 0.7); // Vitesse de vagabondage augmente quand l'énergie est basse
        this.wanderingRadius = 200 * wanderStrength; // Rayon de vagabondage augmente quand l'énergie est basse
        
        // Mise à jour des particules
        this.energyParticles.forEach(particle => {
            // Calcul du rayon dynamique avec plus d'impact des basses
            const bassImpact = Math.pow(this.energyLevels.bass, 1.5);
            const radius = this.baseRadius + (this.maxRadius - this.baseRadius) * bassImpact;
            
            // Mise à jour des angles de vagabondage avec vitesse variable
            particle.wanderAngleX += this.wanderingSpeed * (1 + Math.sin(particle.wanderPhase));
            particle.wanderAngleY += this.wanderingSpeed * (1 + Math.cos(particle.wanderPhase));
            particle.wanderAngleZ += this.wanderingSpeed * (1 + Math.sin(particle.wanderPhase + Math.PI/4));
            
            // Position de base avec vagabondage
            let targetX = particle.baseX * radius;
            let targetY = particle.baseY * radius;
            let targetZ = particle.baseZ * radius;
            
            // Ajout du vagabondage
            targetX += Math.sin(particle.wanderAngleX) * this.wanderingRadius;
            targetY += Math.sin(particle.wanderAngleY) * this.wanderingRadius;
            targetZ += Math.sin(particle.wanderAngleZ) * this.wanderingRadius;
            
            // Tressaillement basé sur les hautes fréquences
            const jitter = this.energyLevels.highs * this.highFreqJitter;
            targetX += (Math.random() - 0.5) * jitter * 20;
            targetY += (Math.random() - 0.5) * jitter * 20;
            targetZ += (Math.random() - 0.5) * jitter * 20;
            
            // Application des rotations 3D
            const rotatedX = this.rotate3D(targetX, targetY, targetZ);
            
            // Lissage du mouvement inversement proportionnel à l'énergie
            const movementSmoothing = particle.size > 3 ? 0.3 : (0.1 + (1 - totalEnergy) * 0.2);
            particle.x = this.lerp(particle.x, rotatedX.x + this.centerX, movementSmoothing);
            particle.y = this.lerp(particle.y, rotatedX.y + this.centerY, movementSmoothing);
            particle.z = this.lerp(particle.z, rotatedX.z, movementSmoothing);
            
            // Mise à jour de la taille basée sur la position Z et l'énergie
            const energyScale = 1 + (this.energyLevels.bass + this.energyLevels.subBass) * 1.5;
            particle.currentSize = particle.size * (1 + particle.z / this.perspective) * energyScale;
            
            // Mise à jour de la couleur basée sur l'énergie
            const hue = 200 + this.energyLevels.highs * 120;
            const saturation = 80 + this.energyLevels.lowMids * 20;
            const lightness = 40 + (this.energyLevels.bass + this.energyLevels.subBass) * 30;
            particle.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        });
    }
    
    rotate3D(x, y, z) {
        // Rotation autour de X
        let temp = y;
        y = y * Math.cos(this.rotationX) - z * Math.sin(this.rotationX);
        z = temp * Math.sin(this.rotationX) + z * Math.cos(this.rotationX);
        
        // Rotation autour de Y
        temp = x;
        x = x * Math.cos(this.rotationY) + z * Math.sin(this.rotationY);
        z = -temp * Math.sin(this.rotationY) + z * Math.cos(this.rotationY);
        
        // Rotation autour de Z
        temp = x;
        x = x * Math.cos(this.rotationZ) - y * Math.sin(this.rotationZ);
        y = temp * Math.sin(this.rotationZ) + y * Math.cos(this.rotationZ);
        
        // Application de la perspective
        const scale = this.perspective / (this.perspective + z);
        return {
            x: x * scale,
            y: y * scale,
            z: z
        };
    }
    
    reset() {
        // Réinitialiser les rotations
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;

        // Réinitialiser les niveaux d'énergie
        this.energyLevels = {
            subBass: 0,
            bass: 0,
            lowMids: 0,
            highMids: 0,
            highs: 0
        };

        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Réinitialiser les particules
        this.energyParticles = [];
        this.initParticles();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Tri des particules par profondeur pour un rendu 3D correct
        const sortedParticles = [...this.energyParticles].sort((a, b) => b.z - a.z);
        
        // Dessin des particules avec effet de lueur
        sortedParticles.forEach(particle => {
            // Effet de lueur
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.currentSize * 2
            );
            
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.4, particle.color.replace(')', ', 0.3)'));
            gradient.addColorStop(1, particle.color.replace(')', ', 0)'));
            
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(particle.x, particle.y, particle.currentSize * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Centre de la particule
            this.ctx.beginPath();
            this.ctx.fillStyle = 'white';
            this.ctx.arc(particle.x, particle.y, particle.currentSize * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Effet de lueur globale au centre
        const centerGlow = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.baseRadius * 2
        );
        
        const energyIntensity = (
            this.energyLevels.subBass +
            this.energyLevels.bass +
            this.energyLevels.lowMids
        ) / 3;
        
        centerGlow.addColorStop(0, `hsla(220, 100%, 70%, ${energyIntensity * 0.3})`);
        centerGlow.addColorStop(1, 'hsla(220, 100%, 70%, 0)');
        
        this.ctx.fillStyle = centerGlow;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
