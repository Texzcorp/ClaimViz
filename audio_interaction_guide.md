# Guide d'Interaction Audio pour la Visualisation

Ce guide explique comment utiliser efficacement l'analyse audio en temps réel pour créer des visualisations réactives, en se concentrant sur différentes bandes de fréquences.

## 1. Structure des Bandes de Fréquences

L'audio est divisé en 5 bandes principales :

```javascript
const bands = {
    subBass: { start: 0, end: 60 },     // 20-60 Hz
    bass: { start: 60, end: 250 },      // 60-250 Hz
    lowMids: { start: 250, end: 500 },  // 250-500 Hz
    highMids: { start: 500, end: 2000 }, // 500-2000 Hz
    highs: { start: 2000, end: 20000 }  // 2000-20000 Hz
};
```

### Caractéristiques des Bandes

- **Sub Bass (20-60 Hz)** : Vibrations très graves, ressenti physique
- **Bass (60-250 Hz)** : Basses principales, rythme, kick drum
- **Low Mids (250-500 Hz)** : Chaleur, corps des instruments
- **High Mids (500-2000 Hz)** : Voix, mélodies principales
- **Highs (2000-20000 Hz)** : Cymbales, détails, brillance

## 2. Obtention des Données Audio

```javascript
// Obtenir l'analyse complète
const analysis = audioData.getFullAnalysis();
const { subBass, bass, lowMids, highMids, highs } = analysis.bands;

// Chaque bande contient une propriété 'intensity' normalisée entre 0 et 1
```

## 3. Détection des Pics d'Intensité

### 3.1 Par Bande Individuelle

```javascript
// Exemple de détection de pic dans les basses
const bassThreshold = 0.7;
if (bass.intensity > bassThreshold) {
    // Pic détecté dans les basses
}
```

### 3.2 Intensité Cumulée

```javascript
// Calculer l'intensité totale
const totalIntensity = subBass.intensity + bass.intensity + 
                      lowMids.intensity + highMids.intensity + 
                      highs.intensity;

// Détecter un pic global
const globalThreshold = 1.5;
if (totalIntensity > globalThreshold) {
    // Pic d'intensité global détecté
}
```

### 3.3 Éviter les Faux Positifs

```javascript
// Ajouter un délai minimum entre les détections
const minTimeBetweenPics = 1.0; // secondes
if (totalIntensity > threshold && 
    currentTime - lastPicTime > minTimeBetweenPics) {
    // Pic valide détecté
    lastPicTime = currentTime;
}
```

## 4. Interpolation des Valeurs

Pour des transitions plus fluides, utilisez l'interpolation linéaire (LERP) :

```javascript
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Exemple d'utilisation
const lerpFactor = 0.15; // Ajuster pour plus ou moins de fluidité
currentIntensity = lerp(currentIntensity, targetIntensity, lerpFactor);
```

## 5. Applications Visuelles Recommandées

### 5.1 Sub Bass & Bass
- Taille/échelle des éléments
- Pulsations globales
- Ondes de choc
- Déplacements de caméra

### 5.2 Low Mids
- Rotation des éléments
- Changements de couleur lents
- Déformations de forme

### 5.3 High Mids
- Opacité
- Émission de particules
- Variations de texture

### 5.4 Highs
- Brillance/luminosité
- Petites particules
- Détails fins
- Scintillement

## 6. Bonnes Pratiques

1. **Calibration**
   - Normalisez les valeurs pour différents types de musique
   - Ajustez les seuils en fonction du genre musical

2. **Performance**
   - Limitez le nombre de calculs par frame
   - Utilisez des moyennes glissantes pour stabiliser les valeurs
   - Mettez en cache les résultats quand c'est possible

3. **Réactivité**
   - Variez les facteurs d'interpolation selon l'effet désiré
   - Combinez plusieurs bandes pour des effets complexes
   - Utilisez des délais différents selon les types d'effets

4. **Design**
   - Gardez une cohérence visuelle entre les effets
   - Évitez la sur-stimulation visuelle
   - Prévoyez des états de repos entre les pics

## 7. Exemple d'Implémentation

```javascript
class AudioVisualizer {
    constructor() {
        this.currentIntensities = {
            bass: 0,
            mids: 0,
            highs: 0
        };
        this.lastPicTime = 0;
    }

    update(audioData) {
        const analysis = audioData.getFullAnalysis();
        const { subBass, bass, lowMids, highMids, highs } = analysis.bands;

        // Interpolation des intensités
        const lerpFactor = 0.15;
        this.currentIntensities.bass = lerp(
            this.currentIntensities.bass,
            (subBass.intensity + bass.intensity) / 2,
            lerpFactor
        );

        this.currentIntensities.mids = lerp(
            this.currentIntensities.mids,
            (lowMids.intensity + highMids.intensity) / 2,
            lerpFactor
        );

        this.currentIntensities.highs = lerp(
            this.currentIntensities.highs,
            highs.intensity,
            lerpFactor
        );

        // Détection de pics
        const totalIntensity = this.currentIntensities.bass +
                             this.currentIntensities.mids +
                             this.currentIntensities.highs;

        const currentTime = performance.now() / 1000;
        if (totalIntensity > 1.5 && 
            currentTime - this.lastPicTime > 1.0) {
            this.triggerVisualEvent();
            this.lastPicTime = currentTime;
        }
    }
}
```

## 8. Enregistrement et Capture Vidéo

Le système permet d'enregistrer les visualisations en vidéo MP4 de haute qualité.

### 8.1 Configuration de l'Enregistreur

```javascript
// Configuration de base
const options = {
    mimeType: 'video/mp4;codecs=h264',
    videoBitsPerSecond: 8000000 // 8 Mbps pour une bonne qualité
};

// Capture du canvas
const canvas = document.getElementById('visualizer');
const stream = canvas.captureStream(60); // 60 FPS
```

### 8.2 Démarrage de l'Enregistrement

```javascript
async function startRecording() {
    try {
        const stream = canvas.captureStream(60);
        mediaRecorder = new MediaRecorder(stream, options);
        
        // Gestion des données enregistrées
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Configuration de l'arrêt
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/mp4'
            });
            
            // Génération du nom de fichier avec timestamp
            const date = new Date();
            const fileName = `visualizer_${date.getFullYear()}${(date.getMonth()+1)
                .toString().padStart(2,'0')}${date.getDate()
                .toString().padStart(2,'0')}_${date.getHours()
                .toString().padStart(2,'0')}${date.getMinutes()
                .toString().padStart(2,'0')}.mp4`;
            
            // Téléchargement automatique
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            
            // Nettoyage
            URL.revokeObjectURL(url);
            recordedChunks = [];
        };
        
        mediaRecorder.start();
    } catch (error) {
        console.error('Erreur d\'enregistrement:', error);
    }
}
```

### 8.3 Arrêt de l'Enregistrement

```javascript
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Le téléchargement se fera automatiquement via l'event onstop
    }
}
```

### 8.4 Bonnes Pratiques pour l'Enregistrement

1. **Qualité Vidéo**
   - Utilisez un bitrate élevé (8 Mbps recommandé)
   - Capturez en 60 FPS pour une fluidité optimale
   - Préférez le codec H264 pour une meilleure compatibilité

2. **Gestion de la Mémoire**
   - Nettoyez les chunks après chaque enregistrement
   - Libérez les URLs créés avec URL.createObjectURL
   - Vérifiez la taille des données enregistrées

3. **Expérience Utilisateur**
   - Générez des noms de fichiers clairs avec timestamp
   - Ajoutez des indicateurs visuels pendant l'enregistrement
   - Gérez les erreurs gracieusement avec des messages explicites

4. **Compatibilité**
   - Prévoyez des fallbacks pour les codecs (H264 -> AVC1)
   - Testez sur différents navigateurs
   - Vérifiez la compatibilité des options d'encodage

## 9. Calibration et Normalisation Audio

Le système implémente une calibration et normalisation dynamique des valeurs audio pour assurer une réactivité optimale des visualisations.

### 9.1 Système de Calibration

```javascript
// Configuration initiale
constructor() {
    // Paramètres de calibration
    this.isCalibrating = true;
    this.calibrationDuration = 2000; // 2 secondes
    this.calibrationStartTime = Date.now();
    this.minIntensity = 0.1;
    this.intensityMultiplier = 5.0;
    
    // Système de fade-in
    this.fadeInDuration = 800;
    this.fadeInStartTime = 0;
    this.isFading = false;
    this.fadeIntensity = 0;
}
```

### 9.2 Mise à Jour de la Calibration

```javascript
updateFadeAndCalibration() {
    const currentTime = Date.now();
    
    // Mise à jour du fade-in
    if (this.isFading) {
        const elapsed = currentTime - this.fadeInStartTime;
        if (elapsed < this.fadeInDuration) {
            this.fadeIntensity = Math.min(1, elapsed / this.fadeInDuration);
        } else {
            this.isFading = false;
            this.fadeIntensity = 1;
        }
    }
    
    // Mise à jour de la calibration
    if (this.isCalibrating) {
        const elapsed = currentTime - this.calibrationStartTime;
        if (elapsed >= this.calibrationDuration) {
            this.isCalibrating = false;
        }
    }
}
```

### 9.3 Normalisation des Valeurs

```javascript
normalizeValue(value, key) {
    // Pendant la calibration, amplification progressive
    if (this.isCalibrating) {
        return Math.max(this.minIntensity, 
            value * this.fadeIntensity * this.intensityMultiplier);
    }
    
    const peak = this.peakLevels.get(key) || value;
    const valley = this.valleyLevels.get(key) || value;
    
    // Mise à jour des niveaux avec adaptation rapide
    if (value > peak) {
        this.peakLevels.set(key, value);
    } else {
        this.peakLevels.set(key, peak - (peak - value) * this.adaptationRate);
    }
    
    if (value < valley) {
        this.valleyLevels.set(key, value);
    } else {
        this.valleyLevels.set(key, valley + (value - valley) * this.adaptationRate);
    }
    
    // Normalisation avec amplification
    const range = peak - valley;
    if (range < 0.0001) return this.minIntensity;
    
    const normalizedValue = (value - valley) / range;
    return Math.max(this.minIntensity, 
        normalizedValue * this.intensityMultiplier);
}
```

### 9.4 Bonnes Pratiques pour la Calibration

1. **Phase de Calibration**
   - Durée courte (2 secondes) pour une réactivité rapide
   - Fade-in progressif pour éviter les transitions brusques
   - Intensité minimum garantie (0.1)

2. **Adaptation Dynamique**
   - Suivi des pics et creux pour chaque bande
   - Taux d'adaptation rapide pour suivre les changements
   - Amplification paramétrable (x5 par défaut)

3. **Gestion des Valeurs**
   - Protection contre les divisions par zéro
   - Normalisation dans l'intervalle [0,1]
   - Amplification post-normalisation

4. **Optimisation**
   - Cache des valeurs précédentes
   - Mise à jour efficace des niveaux
   - Transitions fluides entre les états

## 10. Stratégie de Séparation des Bandes de Fréquences

La qualité d'une visualisation audio dépend fortement de la manière dont les différentes bandes de fréquences sont analysées et appliquées aux paramètres visuels.

### 10.1 Découpage et Analyse des Bandes

```javascript
// Définition des plages de fréquences
const frequencyBands = {
    subBass: { start: 20, end: 60 },    // Très basses fréquences
    bass: { start: 60, end: 250 },      // Basses
    lowMids: { start: 250, end: 500 },  // Bas médiums
    highMids: { start: 500, end: 2000 }, // Hauts médiums
    highs: { start: 2000, end: 20000 }  // Aigus
};

// Calcul de l'intensité d'une bande par accumulation
function getBandIntensity(frequencyData, bandStart, bandEnd, sampleRate, fftSize) {
    const startIndex = Math.floor(bandStart * fftSize / sampleRate);
    const endIndex = Math.floor(bandEnd * fftSize / sampleRate);
    let total = 0;
    
    // Accumulation des sous-bandes
    for (let i = startIndex; i < endIndex; i++) {
        total += frequencyData[i];
    }
    
    // Moyenne normalisée
    return total / ((endIndex - startIndex) * 255);
}
```

### 10.2 Application aux Paramètres Visuels

Chaque bande de fréquence doit être associée à des paramètres visuels cohérents avec sa nature :

```javascript
// Exemple d'application des fréquences aux paramètres visuels
function updateVisualParameters(analysis) {
    const { subBass, bass, lowMids, highMids, highs } = analysis.bands;
    
    // 1. Sub-Bass (20-60 Hz) : Mouvements lents et puissants
    const globalScale = lerp(1, 1.2, subBass.intensity);
    const pulseIntensity = lerp(0.8, 1.2, subBass.intensity);
    
    // 2. Bass (60-250 Hz) : Impacts rythmiques
    const baseSize = lerp(baseMinSize, baseMaxSize, bass.intensity);
    const waveAmplitude = lerp(1, 1.5, bass.intensity);
    
    // 3. Low-Mids (250-500 Hz) : Transitions fluides
    const rotationSpeed = lerp(0.001, 0.003, lowMids.intensity);
    const colorSaturation = lerp(0.5, 0.8, lowMids.intensity);
    
    // 4. High-Mids (500-2000 Hz) : Mouvements intermédiaires
    const particleSpeed = lerp(0.5, 2, highMids.intensity);
    const particleSpread = lerp(0.1, 0.3, highMids.intensity);
    
    // 5. Highs (2000-20000 Hz) : Effets diffus et rapides
    const sparkleIntensity = highs.intensity;
    const noiseAmount = lerp(0.1, 0.4, highs.intensity);
}
```

### 10.3 Interpolation et Lissage

Pour obtenir des transitions fluides et naturelles :

```javascript
class ParameterInterpolator {
    constructor(initialValue, smoothingFactor) {
        this.currentValue = initialValue;
        this.targetValue = initialValue;
        this.smoothingFactor = smoothingFactor;
    }
    
    // Mise à jour avec lissage adapté à la fréquence
    update(newTarget) {
        this.targetValue = newTarget;
        // Lissage plus fort pour les basses, plus réactif pour les aigus
        this.currentValue += (this.targetValue - this.currentValue) * this.smoothingFactor;
        return this.currentValue;
    }
}

// Exemple d'utilisation
const bassInterpolator = new ParameterInterpolator(0, 0.05);  // Lissage fort
const highsInterpolator = new ParameterInterpolator(0, 0.3);  // Plus réactif
```

### 10.4 Bonnes Pratiques pour l'Application des Fréquences

1. **Basses Fréquences (20-250 Hz)**
   - Paramètres globaux et impactants
   - Mouvements lents et amples
   - Fort lissage temporel
   - Exemples : échelle globale, pulsations, ondes de base

2. **Fréquences Moyennes (250-2000 Hz)**
   - Paramètres de transition
   - Mouvements fluides et continus
   - Lissage modéré
   - Exemples : rotation, déplacement, couleur

3. **Hautes Fréquences (2000-20000 Hz)**
   - Paramètres fins et détaillés
   - Mouvements rapides et diffus
   - Lissage minimal
   - Exemples : particules, étincelles, bruit

4. **Conseils d'Implémentation**
   - Utiliser des courbes d'interpolation non-linéaires pour plus de naturel
   - Adapter les plages de valeurs à l'impact visuel souhaité
   - Combiner plusieurs bandes pour des effets complexes
   - Prévoir des valeurs par défaut harmonieuses

## Architecture du Système

### 1. Système Audio (`audioSystem.js`)

```javascript
// Configuration initiale
this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
this.analyser = this.audioContext.createAnalyser();
this.analyser.fftSize = 2048;
this.analyser.smoothingTimeConstant = 0.85;

// Chaîne de traitement audio
this.gainNode = this.audioContext.createGain();
this.gainNode.gain.value = 0.04; // Volume à 4% pour éviter la saturation
this.analyser.connect(this.gainNode);
this.gainNode.connect(this.audioContext.destination);
```

#### Système de Fade-in
Pour une transition fluide :
```javascript
this.fadeInDuration = 800; // 800ms de fade-in
this.fadeInStartTime = 0;
this.isFading = false;
this.fadeIntensity = 0;
this.intensityMultiplier = 5.0; // Amplification des valeurs
this.minIntensity = 0.2; // Intensité minimum
```

#### Analyse des Fréquences
Division en bandes de fréquences pour une meilleure réactivité :
```javascript
getBassFrequency() {
    const bassData = this.dataArray.slice(0, 60); // 20-60 Hz
    return Math.max(...bassData) * this.getFadeMultiplier();
}

getMidFrequency() {
    const midData = this.dataArray.slice(60, 500); // 60-500 Hz
    return Math.max(...midData) * this.getFadeMultiplier();
}

getHighFrequency() {
    const highData = this.dataArray.slice(500, 1024); // 500+ Hz
    return Math.max(...highData) * this.getFadeMultiplier();
}
```

### 2. Système d'Enregistrement (`recorder.js`)

Configuration pour l'enregistrement en MP4 :
```javascript
const options = {
    mimeType: 'video/mp4;codecs=h264',
    videoBitsPerSecond: 8000000 // 8 Mbps pour une bonne qualité
};

// Fallback si H264 n'est pas supporté
try {
    mediaRecorder = new MediaRecorder(stream, options);
} catch (e) {
    options.mimeType = 'video/mp4;codecs=avc1';
    mediaRecorder = new MediaRecorder(stream, options);
}
```

### 3. Interface Utilisateur

Structure HTML minimale :
```html
<canvas id="visualizer"></canvas>
<div class="controls">
    <label class="file-label" for="fileInput">Choisir un fichier audio</label>
    <input type="file" id="fileInput" accept="audio/*">
    <button id="playRecordBtn">Play & Record</button>
</div>
```

## Bonnes Pratiques

1. **Gestion Audio**
   - Utiliser un gain node pour contrôler le volume (4% recommandé)
   - Implémenter un fade-in pour éviter les transitions brusques
   - Normaliser les valeurs audio avec une intensité minimum

2. **Animation**
   - Utiliser requestAnimationFrame pour les animations
   - Adapter l'opacité du fade en fonction de l'intensité audio
   - Limiter le nombre de particules/éléments pour les performances

3. **Enregistrement**
   - Toujours enregistrer en MP4 avec codec H264 (ou avc1 en fallback)
   - Utiliser un bitrate vidéo élevé (8 Mbps recommandé)
   - Inclure la date dans le nom du fichier enregistré

4. **Serveur Local**
   - Utiliser un serveur local (ex: Python) pour éviter les problèmes CORS
   - Configurer les headers CORS appropriés

## Configuration du Serveur

```python
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

httpd = HTTPServer(('localhost', 8000), CORSRequestHandler)
httpd.serve_forever()
```

## Optimisations Recommandées

1. **Performance**
   - Utiliser `analyser.smoothingTimeConstant = 0.85` pour un rendu fluide
   - Limiter le nombre d'éléments animés
   - Utiliser des opacités faibles (0.1) pour les effets de fade

2. **Qualité Audio**
   - FFT size de 2048 pour une bonne résolution
   - Division des fréquences en bandes (basse, moyenne, haute)
   - Calibration automatique des niveaux

3. **Qualité Vidéo**
   - Enregistrement en 60 FPS
   - Codec H264 pour une meilleure compatibilité
   - Bitrate élevé pour une qualité optimale

## Dépannage

1. **Problèmes CORS**
   - Toujours utiliser un serveur local
   - Vérifier les headers CORS

2. **Problèmes d'Enregistrement**
   - Vérifier le support des codecs (H264/avc1)
   - Utiliser le fallback approprié
   - Nettoyer les ressources après l'enregistrement

3. **Problèmes Audio**
   - Vérifier le gain (4% recommandé)
   - Implémenter le fade-in
   - Calibrer les niveaux audio

## Conseils Avancés pour les Visualisations Audio

### Utilisation de Courbes Mathématiques

1. **Courbes de Lissajous**
   - Parfaites pour créer des motifs harmonieux pendant les passages calmes
   - Paramètres à moduler : fréquences (a, b) et phase
   - Plus les fréquences sont proches, plus le motif est stable
   - Utiliser les moyennes fréquences pour la phase crée un mouvement naturel

2. **Spirales Logarithmiques**
   - Idéales pour les moments de forte intensité
   - Le facteur de croissance contrôle l'expansion
   - Le nombre de spires peut être modulé par les basses
   - Créent un effet d'aspiration très dynamique

### Optimisation des Performances

1. **Gestion des Particules**
   - Adapter le nombre de particules à l'intensité au carré (Math.pow) pour une meilleure distribution
   - Limiter les connexions aux particules ayant une vie suffisante (> 0.2)
   - Ne traiter qu'une particule sur deux pour les connexions
   - Supprimer rapidement les particules mortes

2. **Effets Visuels**
   - Effacer complètement le canvas à chaque frame pour éviter l'accumulation
   - Limiter strictement les valeurs alpha pour prévenir la surexposition
   - Utiliser des gradients avec des stops à 0 pour des transitions douces
   - Multiplier les alphas des connexions par la vie des particules

### Techniques de Mouvement Avancées

1. **Rotation Globale**
   - Utiliser les basses pour la vitesse de rotation
   - Ajouter une composante des moyennes pour plus de nuance
   - Appliquer une échelle inversement proportionnelle à la distance du centre

2. **Variations Harmoniques**
   - Moduler la taille avec des sinus de différentes fréquences
   - Faire varier les rayons avec le temps pour un effet de pulsation
   - Utiliser plusieurs couches de mouvement pour plus de complexité
   - Synchroniser les variations avec le tempo quand possible

### Gestion des Couleurs

1. **Couleurs Dynamiques**
   - Baser la teinte sur la position angulaire pour une cohérence spatiale
   - Ajouter des variations sinusoïdales pour plus de vie
   - Moduler la saturation avec les hautes fréquences
   - Ajuster la luminosité selon l'intensité globale

2. **Connexions entre Particules**
   - Utiliser la même teinte que les particules pour l'harmonie
   - Faire varier l'épaisseur selon l'intensité
   - Limiter la distance maximale en fonction des hautes fréquences
   - Ajuster l'alpha selon la distance et l'énergie

### Astuces pour l'Interactivité

1. **Réactivité Multi-niveaux**
   - Basses : contrôle de la position et du mouvement de base
   - Moyennes : modulation des variations et des rotations
   - Hautes : détails visuels et connexions
   - Intensité globale : nombre de particules et luminosité

2. **Transitions Fluides**
   - Utiliser des courbes différentes selon l'intensité
   - Interpoler progressivement entre les états
   - Maintenir une cohérence visuelle même pendant les changements
   - Éviter les changements trop brusques qui peuvent distraire

### Équilibre Visuel

1. **Densité Adaptative**
   - Réduire le nombre de particules pendant les passages intenses
   - Augmenter leur taille et leur impact visuel en compensation
   - Maintenir un équilibre entre complexité et lisibilité
   - Adapter la transparence globale à la densité

2. **Composition Dynamique**
   - Créer des zones de focus avec les motifs mathématiques
   - Utiliser la distance au centre comme facteur d'échelle
   - Maintenir une symétrie globale tout en permettant des variations locales
   - Laisser des espaces de respiration dans la composition
