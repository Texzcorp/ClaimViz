# Audio Interaction Guide for Visualization

This guide is designed for AI systems to understand and implement real-time audio visualization systems. It explains the core concepts, techniques, and best practices for creating reactive visualizations from audio analysis, with a focus on different frequency bands and their visual applications.

## 1. Frequency Bands Structure

The audio is divided into 5 main bands:

```javascript
const bands = {
    subBass: { start: 0, end: 60 },     // 20-60 Hz
    bass: { start: 60, end: 250 },      // 60-250 Hz
    lowMids: { start: 250, end: 500 },  // 250-500 Hz
    highMids: { start: 500, end: 2000 }, // 500-2000 Hz
    highs: { start: 2000, end: 20000 }  // 2000-20000 Hz
};
```

### Band Characteristics

- **Sub Bass (20-60 Hz)**: Very low vibrations, physical feeling
- **Bass (60-250 Hz)**: Main bass, rhythm, kick drum
- **Low Mids (250-500 Hz)**: Warmth, body of instruments
- **High Mids (500-2000 Hz)**: Vocals, main melodies
- **Highs (2000-20000 Hz)**: Cymbals, details, brightness

## 2. Getting Audio Data

```javascript
// Get full analysis
const analysis = audioData.getFullAnalysis();
const { subBass, bass, lowMids, highMids, highs } = analysis.bands;

// Each band contains an 'intensity' property normalized between 0 and 1
```

## 3. Intensity Peak Detection

### 3.1 By Individual Band

```javascript
// Example of bass peak detection
const bassThreshold = 0.7;
if (bass.intensity > bassThreshold) {
    // Bass peak detected
}
```

### 3.2 Cumulative Intensity

```javascript
// Calculate total intensity
const totalIntensity = subBass.intensity + bass.intensity + 
                      lowMids.intensity + highMids.intensity + 
                      highs.intensity;

// Detect global peak
const globalThreshold = 1.5;
if (totalIntensity > globalThreshold) {
    // Global intensity peak detected
}
```

### 3.3 Avoiding False Positives

```javascript
// Add minimum delay between detections
const minTimeBetweenPics = 1.0; // seconds
if (totalIntensity > threshold && 
    currentTime - lastPicTime > minTimeBetweenPics) {
    // Valid peak detected
    lastPicTime = currentTime;
}
```

## 4. Value Interpolation

For smoother transitions, use linear interpolation (LERP):

```javascript
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Usage example
const lerpFactor = 0.15; // Adjust for more or less smoothness
currentIntensity = lerp(currentIntensity, targetIntensity, lerpFactor);
```

## 5. Recommended Visual Applications

### 5.1 Sub Bass & Bass
- Element size/scale
- Global pulsations
- Shockwaves
- Camera movements

### 5.2 Low Mids
- Element rotation
- Slow color changes
- Shape deformations

### 5.3 High Mids & Highs
- Particle systems
- Highlight effects
- Quick transitions
- Detail animations

## 6. Performance Tips

- Use requestAnimationFrame for smooth animations
- Cache frequency band calculations
- Implement intensity thresholds to avoid constant updates
- Use WebGL for complex visualizations
- Consider using Web Audio API's built-in analyzers

## 7. Example Implementation

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

        // Interpolate intensities
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

        // Detect peaks
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

## 8. Video Recording and Capture

The system allows recording visualizations as high-quality MP4 video.

### 8.1 Recorder Configuration

```javascript
// Basic configuration
const options = {
    mimeType: 'video/mp4;codecs=h264',
    videoBitsPerSecond: 8000000 // 8 Mbps for good quality
};

// Capture the canvas
const canvas = document.getElementById('visualizer');
const stream = canvas.captureStream(60); // 60 FPS
```

### 8.2 Starting Recording

```javascript
async function startRecording() {
    try {
        const stream = canvas.captureStream(60);
        mediaRecorder = new MediaRecorder(stream, options);
        
        // Handle recorded data
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Configuration for stopping
        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, {
                type: 'video/mp4'
            });
            
            // Generate file name with timestamp
            const date = new Date();
            const fileName = `visualizer_${date.getFullYear()}${(date.getMonth()+1)
                .toString().padStart(2,'0')}${date.getDate()
                .toString().padStart(2,'0')}_${date.getHours()
                .toString().padStart(2,'0')}${date.getMinutes()
                .toString().padStart(2,'0')}.mp4`;
            
            // Automatic download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            
            // Cleanup
            URL.revokeObjectURL(url);
            recordedChunks = [];
        };
        
        mediaRecorder.start();
    } catch (error) {
        console.error('Recording error:', error);
    }
}
```

### 8.3 Stopping Recording

```javascript
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        // Download will happen automatically via the onstop event
    }
}
```

### 8.4 Best Practices for Recording

1. **Video Quality**
   - Use a high bitrate (8 Mbps recommended)
   - Capture at 60 FPS for optimal smoothness
   - Prefer H264 codec for better compatibility

2. **Memory Management**
   - Clean up chunks after each recording
   - Release created URLs with URL.createObjectURL
   - Check the size of recorded data

3. **User Experience**
   - Generate clear file names with timestamps
   - Add visual indicators during recording
   - Handle errors gracefully with explanatory messages

4. **Compatibility**
   - Provide fallbacks for codecs (H264 -> AVC1)
   - Test on different browsers
   - Check compatibility of encoding options

## 9. Audio Calibration and Normalization

The system implements dynamic audio calibration and normalization for optimal visualization reactivity.

### 9.1 Calibration System

```javascript
// Initial configuration
this.isCalibrating = true;
this.calibrationDuration = 2000; // 2 seconds
this.calibrationStartTime = Date.now();
this.minIntensity = 0.1;
this.intensityMultiplier = 5.0;
```

### 9.2 Updating Calibration

```javascript
updateFadeAndCalibration() {
    const currentTime = Date.now();
    
    // Update fade-in
    if (this.isFading) {
        const elapsed = currentTime - this.fadeInStartTime;
        if (elapsed < this.fadeInDuration) {
            this.fadeIntensity = Math.min(1, elapsed / this.fadeInDuration);
        } else {
            this.isFading = false;
            this.fadeIntensity = 1;
        }
    }
    
    // Update calibration
    if (this.isCalibrating) {
        const elapsed = currentTime - this.calibrationStartTime;
        if (elapsed >= this.calibrationDuration) {
            this.isCalibrating = false;
        }
    }
}
```

### 9.3 Normalizing Values

```javascript
normalizeValue(value, key) {
    // During calibration, progressive amplification
    if (this.isCalibrating) {
        return Math.max(this.minIntensity, 
            value * this.fadeIntensity * this.intensityMultiplier);
    }
    
    const peak = this.peakLevels.get(key) || value;
    const valley = this.valleyLevels.get(key) || value;
    
    // Update levels with rapid adaptation
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
    
    // Normalize with amplification
    const range = peak - valley;
    if (range < 0.0001) return this.minIntensity;
    
    const normalizedValue = (value - valley) / range;
    return Math.max(this.minIntensity, 
        normalizedValue * this.intensityMultiplier);
}
```

### 9.4 Best Practices for Calibration

1. **Calibration Phase**
   - Short duration (2 seconds) for rapid reactivity
   - Progressive fade-in to avoid abrupt transitions
   - Minimum intensity guaranteed (0.1)

2. **Dynamic Adaptation**
   - Track peaks and valleys for each band
   - Rapid adaptation rate to follow changes
   - Amplification parameterizable (x5 by default)

3. **Value Management**
   - Protection against division by zero
   - Normalization within the [0,1] range
   - Post-normalization amplification

4. **Optimization**
   - Cache previous values
   - Efficient update of levels
   - Smooth transitions between states

## 10. Frequency Band Separation Strategy

The quality of an audio visualization depends heavily on how different frequency bands are analyzed and applied to visual parameters.

### 10.1 Frequency Band Division and Analysis

```javascript
// Frequency band definitions
const frequencyBands = {
    subBass: { start: 20, end: 60 },    // Very low frequencies
    bass: { start: 60, end: 250 },      // Low frequencies
    lowMids: { start: 250, end: 500 },  // Low mid frequencies
    highMids: { start: 500, end: 2000 }, // High mid frequencies
    highs: { start: 2000, end: 20000 }  // High frequencies
};

// Calculate intensity of a band by accumulation
function getBandIntensity(frequencyData, bandStart, bandEnd, sampleRate, fftSize) {
    const startIndex = Math.floor(bandStart * fftSize / sampleRate);
    const endIndex = Math.floor(bandEnd * fftSize / sampleRate);
    let total = 0;
    
    // Accumulate sub-bands
    for (let i = startIndex; i < endIndex; i++) {
        total += frequencyData[i];
    }
    
    // Normalized average
    return total / ((endIndex - startIndex) * 255);
}
```

### 10.2 Applying to Visual Parameters

Each frequency band should be associated with coherent visual parameters:

```javascript
// Example of applying frequencies to visual parameters
function updateVisualParameters(analysis) {
    const { subBass, bass, lowMids, highMids, highs } = analysis.bands;
    
    // 1. Sub-Bass (20-60 Hz): Slow and powerful movements
    const globalScale = lerp(1, 1.2, subBass.intensity);
    const pulseIntensity = lerp(0.8, 1.2, subBass.intensity);
    
    // 2. Bass (60-250 Hz): Rhythmic impacts
    const baseSize = lerp(baseMinSize, baseMaxSize, bass.intensity);
    const waveAmplitude = lerp(1, 1.5, bass.intensity);
    
    // 3. Low-Mids (250-500 Hz): Smooth transitions
    const rotationSpeed = lerp(0.001, 0.003, lowMids.intensity);
    const colorSaturation = lerp(0.5, 0.8, lowMids.intensity);
    
    // 4. High-Mids (500-2000 Hz): Intermediate movements
    const particleSpeed = lerp(0.5, 2, highMids.intensity);
    const particleSpread = lerp(0.1, 0.3, highMids.intensity);
    
    // 5. Highs (2000-20000 Hz): Diffuse and rapid effects
    const sparkleIntensity = highs.intensity;
    const noiseAmount = lerp(0.1, 0.4, highs.intensity);
}
```

### 10.3 Interpolation and Smoothing

For smooth transitions:

```javascript
class ParameterInterpolator {
    constructor(initialValue, smoothingFactor) {
        this.currentValue = initialValue;
        this.targetValue = initialValue;
        this.smoothingFactor = smoothingFactor;
    }
    
    // Update with smoothing adapted to frequency
    update(newTarget) {
        this.targetValue = newTarget;
        // Stronger smoothing for bass, more reactive for highs
        this.currentValue += (this.targetValue - this.currentValue) * this.smoothingFactor;
        return this.currentValue;
    }
}

// Usage example
const bassInterpolator = new ParameterInterpolator(0, 0.05);  // Strong smoothing
const highsInterpolator = new ParameterInterpolator(0, 0.3);  // More reactive
```

### 10.4 Best Practices for Frequency Application

1. **Low Frequencies (20-250 Hz)**
   - Global and impactful parameters
   - Slow and broad movements
   - Strong temporal smoothing
   - Examples: global scale, pulsations, base waves

2. **Mid Frequencies (250-2000 Hz)**
   - Transition parameters
   - Smooth and continuous movements
   - Moderate smoothing
   - Examples: rotation, movement, color

3. **High Frequencies (2000-20000 Hz)**
   - Fine and detailed parameters
   - Rapid and diffuse movements
   - Minimal smoothing
   - Examples: particles, sparkles, noise

4. **Implementation Tips**
   - Use non-linear interpolation curves for more natural effects
   - Adapt value ranges to desired visual impact
   - Combine multiple bands for complex effects
   - Provide default values for harmonious visuals

## System Architecture

### 1. Audio System (`audioSystem.js`)

```javascript
// Initial configuration
this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
this.analyser = this.audioContext.createAnalyser();
this.analyser.fftSize = 2048;
this.analyser.smoothingTimeConstant = 0.85;

// Audio processing chain
this.gainNode = this.audioContext.createGain();
this.gainNode.gain.value = 0.04; // Volume at 4% to avoid saturation
this.analyser.connect(this.gainNode);
this.gainNode.connect(this.audioContext.destination);
```

#### Fade-in System
For a smooth transition:

```javascript
this.fadeInDuration = 800; // 800ms fade-in
this.fadeInStartTime = 0;
this.isFading = false;
this.fadeIntensity = 0;
this.intensityMultiplier = 5.0; // Amplification of values
this.minIntensity = 0.2; // Minimum intensity
```

#### Frequency Analysis
Divide frequencies into bands for better reactivity:

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

### 2. Recording System (`recorder.js`)

Configuration for MP4 recording:

```javascript
const options = {
    mimeType: 'video/mp4;codecs=h264',
    videoBitsPerSecond: 8000000 // 8 Mbps for good quality
};

// Fallback if H264 is not supported
try {
    mediaRecorder = new MediaRecorder(stream, options);
} catch (e) {
    options.mimeType = 'video/mp4;codecs=avc1';
    mediaRecorder = new MediaRecorder(stream, options);
}
```

### 3. User Interface

Minimal HTML structure:

```html
<canvas id="visualizer"></canvas>
<div class="controls">
    <label class="file-label" for="fileInput">Choose an audio file</label>
    <input type="file" id="fileInput" accept="audio/*">
    <button id="playRecordBtn">Play & Record</button>
</div>
```

## Best Practices

1. **Audio Management**
   - Use a gain node to control volume (4% recommended)
   - Implement fade-in to avoid abrupt transitions
   - Normalize audio values with a minimum intensity

2. **Animation**
   - Use requestAnimationFrame for smooth animations
   - Adapt opacity of fade based on audio intensity
   - Limit the number of particles/elements for performance

3. **Recording**
   - Always record in MP4 with H264 codec (or AVC1 as fallback)
   - Use a high video bitrate (8 Mbps recommended)
   - Include date in the recorded file name

4. **Local Server**
   - Use a local server (e.g., Python) to avoid CORS issues
   - Configure appropriate CORS headers

## Server Configuration

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

## Recommended Optimizations

1. **Performance**
   - Use `analyser.smoothingTimeConstant = 0.85` for smooth rendering
   - Limit the number of animated elements
   - Use low opacity values (0.1) for fade effects

2. **Audio Quality**
   - FFT size of 2048 for good resolution
   - Divide frequencies into bands for better reactivity
   - Automatic calibration of levels

3. **Video Quality**
   - Record at 60 FPS
   - Use H264 codec for better compatibility
   - High bitrate for optimal quality

## Troubleshooting

1. **CORS Issues**
   - Always use a local server
   - Check CORS headers

2. **Recording Issues**
   - Check codec support (H264/AVC1)
   - Use fallbacks appropriately
   - Clean up resources after recording

3. **Audio Issues**
   - Check gain (4% recommended)
   - Implement fade-in
   - Calibrate audio levels

## Advanced Tips for Audio Visualizations

### Using Mathematical Curves

1. **Lissajous Curves**
   - Perfect for creating harmonious patterns during calm passages
   - Parameters to modulate: frequencies (a, b) and phase
   - The closer the frequencies, the more stable the pattern
   - Use mid frequencies for phase to create natural movement

2. **Logarithmic Spirals**
   - Ideal for intense moments
   - Growth factor controls expansion
   - Number of turns can be modulated by bass
   - Creates a dynamic suction effect

### Optimizing Performance

1. **Particle Management**
   - Adapt the number of particles to intensity squared (Math.pow) for better distribution
   - Limit connections to particles with sufficient life (> 0.2)
   - Only process every other particle for connections
   - Quickly remove dead particles

2. **Visual Effects**
   - Completely clear the canvas each frame to avoid accumulation
   - Strictly limit alpha values to prevent overexposure
   - Use gradients with stops at 0 for smooth transitions
   - Multiply alpha values of connections by particle life

### Advanced Movement Techniques

1. **Global Rotation**
   - Use bass for rotation speed
   - Add a mid frequency component for more nuance
   - Apply inverse scaling based on distance from the center

2. **Harmonic Variations**
   - Modulate size with different frequency sinusoids
   - Vary radii with time for a pulsation effect
   - Use multiple layers of movement for complexity
   - Synchronize variations with tempo when possible

### Color Management

1. **Dynamic Colors**
   - Base hue on angular position for spatial coherence
   - Add sinusoidal variations for more life
   - Modulate saturation with high frequencies
   - Adjust brightness based on global intensity

2. **Particle Connections**
   - Use the same hue as particles for harmony
   - Vary thickness based on intensity
   - Limit maximum distance based on high frequencies
   - Adjust alpha based on distance and energy

### Tips for Interactivity

1. **Multi-Level Reactivity**
   - Bass: control of position and basic movement
   - Mid frequencies: modulation of variations and rotations
   - High frequencies: detailed visual effects and connections
   - Global intensity: number of particles and brightness

2. **Smooth Transitions**
   - Use different curves based on intensity
   - Interpolate smoothly between states
   - Maintain visual coherence even during changes
   - Avoid abrupt changes that can distract

### Visual Balance

1. **Adaptive Density**
   - Reduce the number of particles during intense passages
   - Increase their size and visual impact in compensation
   - Maintain a balance between complexity and readability
   - Adapt global transparency to density

2. **Dynamic Composition**
   - Create focus areas with mathematical patterns
   - Use distance from the center as a scaling factor
   - Maintain global symmetry while allowing local variations
   - Leave breathing spaces in the composition
