# Medical Accuracy Testing & Validation Framework

## 🎯 Overview

This document outlines a comprehensive testing strategy using real medical datasets and calibration methods to validate the screening algorithms.

---

## 📊 **Recommended Datasets**

### **Vision Screening Datasets**

#### 1. **Pediatric Eye Disease Dataset (PEEDS)**
- **Source**: Kaggle / Medical repositories
- **Content**: Retinal images with red reflex abnormalities
- **Use Case**: Validate photoscreening red reflex detection
- **Link**: Search "pediatric retinoblastoma dataset" on Kaggle

#### 2. **Strabismus Detection Dataset**
- **Source**: Medical imaging repositories
- **Content**: Eye alignment images with strabismus labels
- **Use Case**: Validate Hirschberg test eye alignment
- **Alternative**: Create synthetic dataset with known deviations

#### 3. **Visual Acuity Ground Truth**
- **Source**: Clinical validation studies
- **Content**: Known visual acuity measurements
- **Use Case**: Validate Snellen chart calculations
- **Method**: Use published clinical trial data

#### 4. **HuggingFace Datasets**
```python
# Example: Eye disease classification
from datasets import load_dataset

# Retinal disease dataset
dataset = load_dataset("keremberke/retinal-disease-classification")

# Diabetic retinopathy (can adapt for general eye screening)
dataset = load_dataset("1aurent/eye_fundus_images")
```

### **Hearing Screening Datasets**

#### 1. **Audiogram Database**
- **Source**: NIDCD (National Institute on Deafness)
- **Content**: Real audiogram patterns with diagnoses
- **Use Case**: Validate pattern recognition algorithms
- **Format**: Frequency-threshold pairs with classifications

#### 2. **Speech-in-Noise Corpus**
- **Source**: LibriSpeech, Common Voice
- **Content**: Clean speech recordings
- **Use Case**: Create speech-in-noise test materials
- **HuggingFace**: 
```python
from datasets import load_dataset

# Clean speech for speech-in-noise testing
dataset = load_dataset("mozilla-foundation/common_voice_11_0", "en")
dataset = load_dataset("openslr/librispeech_asr")
```

#### 3. **Noise Databases**
- **Source**: UrbanSound8K, ESC-50
- **Content**: Environmental noise samples
- **Use Case**: Background noise for speech testing
```python
# Environmental sounds
dataset = load_dataset("ashraq/esc50")
```

---

## 🧪 **Testing Framework**

### **1. Vision Algorithm Validation**

Create a test suite in `client/src/tests/visionAlgorithms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateVisualAcuity,
  assessVisualAcuity,
  assessPhotoscreening,
  SNELLEN_CHART,
} from '@/lib/visionScreening';

describe('Visual Acuity Calculations', () => {
  it('should calculate 20/20 vision correctly', () => {
    const result = calculateVisualAcuity(5, 5, '20/20');
    expect(result.acuity).toBe('20/20');
    expect(result.decimal).toBe(1.0);
    expect(result.percentCorrect).toBe(100);
  });

  it('should handle partial vision loss', () => {
    const result = calculateVisualAcuity(3, 5, '20/40');
    expect(result.percentCorrect).toBe(60);
    expect(SNELLEN_CHART[result.acuity].decimal).toBeLessThan(0.5);
  });

  it('should apply age-appropriate norms', () => {
    // 3-year-old with 20/40 vision should pass
    const assessment = assessVisualAcuity('20/40', '3-5', 'both');
    expect(assessment.status).toBe('pass');

    // Adult with 20/40 should be borderline
    const adultAssessment = assessVisualAcuity('20/40', '18+', 'both');
    expect(adultAssessment.severity).not.toBe('normal');
  });
});

describe('Photoscreening Assessment', () => {
  it('should detect abnormal red reflex (leukocoria)', () => {
    const result = {
      redReflexLeft: 'abnormal' as const,
      redReflexRight: 'normal' as const,
      eyeAlignment: 'normal' as const,
      pupilSymmetry: 'symmetric' as const,
      confidence: 90,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.concerns).toContain(
      expect.stringMatching(/abnormal red reflex/i)
    );
  });

  it('should detect strabismus', () => {
    const result = {
      redReflexLeft: 'normal' as const,
      redReflexRight: 'normal' as const,
      eyeAlignment: 'esotropia' as const,
      pupilSymmetry: 'symmetric' as const,
      confidence: 85,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.concerns).toContain(
      expect.stringMatching(/strabismus/i)
    );
  });

  it('should pass normal screening', () => {
    const result = {
      redReflexLeft: 'normal' as const,
      redReflexRight: 'normal' as const,
      eyeAlignment: 'normal' as const,
      pupilSymmetry: 'symmetric' as const,
      confidence: 95,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('pass');
    expect(assessment.concerns).toHaveLength(0);
  });
});
```

### **2. Hearing Algorithm Validation**

Create `client/src/tests/hearingAlgorithms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculatePTA,
  classifyHearingLoss,
  assessAudiogramPattern,
  assessSpeechInNoise,
  AUDIOMETRIC_FREQUENCIES,
} from '@/lib/hearingScreening';

describe('Pure Tone Average (PTA)', () => {
  it('should calculate normal hearing PTA', () => {
    const thresholds = new Map([
      [500, 15],
      [1000, 10],
      [2000, 15],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBeCloseTo(13.33, 1);
    
    const classification = classifyHearingLoss(pta);
    expect(classification.category).toBe('normal');
  });

  it('should classify moderate hearing loss', () => {
    const thresholds = new Map([
      [500, 50],
      [1000, 55],
      [2000, 45],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBe(50);
    
    const classification = classifyHearingLoss(pta);
    expect(classification.category).toBe('moderate');
    expect(classification.severity).toBe('moderate');
  });
});

describe('Audiogram Pattern Recognition', () => {
  it('should detect noise-induced hearing loss pattern', () => {
    const thresholds = new Map([
      [250, 15],
      [500, 15],
      [1000, 20],
      [2000, 25],
      [4000, 50], // Notch at 4000 Hz
      [8000, 30],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('notched');
    expect(pattern.description).toMatch(/noise-induced/i);
  });

  it('should detect presbycusis (age-related) pattern', () => {
    const thresholds = new Map([
      [250, 15],
      [500, 20],
      [1000, 25],
      [2000, 35],
      [4000, 50],
      [8000, 60], // Sloping high-frequency loss
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('sloping');
    expect(pattern.description).toMatch(/age-related/i);
  });
});

describe('Speech-in-Noise Assessment', () => {
  it('should assess excellent performance', () => {
    const assessment = assessSpeechInNoise(95, 0); // 95% at 0 dB SNR
    expect(assessment.status).toBe('excellent');
  });

  it('should detect poor performance', () => {
    const assessment = assessSpeechInNoise(30, 5); // 30% at +5 dB SNR
    expect(assessment.status).toBe('poor');
    expect(assessment.recommendation).toMatch(/evaluation/i);
  });
});
```

---

## 🎯 **Calibration Methods**

### **1. Audio Calibration System**

Create `client/src/lib/calibration.ts`:

```typescript
/**
 * Audio Calibration System
 * Ensures accurate dB HL presentation
 */

import { AudioToneGenerator } from './audioUtils';

export interface CalibrationProfile {
  deviceId: string;
  deviceName: string;
  calibrationDate: Date;
  frequencyCorrections: Map<number, number>; // Frequency -> dB correction
  leftEarGain: number;
  rightEarGain: number;
  validated: boolean;
}

export class AudioCalibrator {
  private toneGenerator: AudioToneGenerator;
  private profile: CalibrationProfile | null = null;

  constructor() {
    this.toneGenerator = new AudioToneGenerator();
  }

  /**
   * Interactive calibration wizard
   */
  async runCalibrationWizard(): Promise<CalibrationProfile> {
    const profile: CalibrationProfile = {
      deviceId: await this.getDeviceId(),
      deviceName: await this.getDeviceName(),
      calibrationDate: new Date(),
      frequencyCorrections: new Map(),
      leftEarGain: 1.0,
      rightEarGain: 1.0,
      validated: false,
    };

    // Step 1: Reference tone calibration
    console.log('Step 1: Playing reference tone at 1000 Hz');
    await this.toneGenerator.playTone(1000, 2000, 0.5, 'both');
    
    // User adjusts system volume to comfortable level
    const userConfirmed = confirm(
      'Can you hear the tone clearly at a comfortable volume?\n' +
      'Adjust your device volume if needed, then click OK.'
    );

    if (!userConfirmed) {
      throw new Error('Calibration cancelled by user');
    }

    // Step 2: Threshold calibration for each frequency
    for (const freq of [250, 500, 1000, 2000, 4000, 8000]) {
      const correction = await this.calibrateFrequency(freq);
      profile.frequencyCorrections.set(freq, correction);
    }

    // Step 3: Ear balance calibration
    const { leftGain, rightGain } = await this.calibrateEarBalance();
    profile.leftEarGain = leftGain;
    profile.rightEarGain = rightGain;

    // Step 4: Validation
    profile.validated = await this.validateCalibration(profile);

    this.profile = profile;
    this.saveCalibration(profile);

    return profile;
  }

  /**
   * Calibrate a specific frequency
   */
  private async calibrateFrequency(frequency: number): Promise<number> {
    let level = 40; // Start at 40 dB HL
    let heard = false;

    // Descending method
    while (level > -10 && !heard) {
      await this.toneGenerator.playTone(frequency, 500, 
        this.toneGenerator.dbHLToVolume(level), 'both');
      
      heard = confirm(`Did you hear the ${frequency} Hz tone?`);
      
      if (!heard) {
        level += 5;
      }
    }

    // Calculate correction factor
    // If user hears at 40 dB but should hear at 0 dB, correction is -40
    const correction = 0 - level;
    
    return correction;
  }

  /**
   * Calibrate left/right ear balance
   */
  private async calibrateEarBalance(): Promise<{ leftGain: number; rightGain: number }> {
    // Play tone to left ear
    await this.toneGenerator.playTone(1000, 1000, 0.5, 'left');
    const leftVolume = prompt('Rate the left ear volume (1-10):');
    
    // Play tone to right ear
    await this.toneGenerator.playTone(1000, 1000, 0.5, 'right');
    const rightVolume = prompt('Rate the right ear volume (1-10):');

    const leftRating = parseInt(leftVolume || '5');
    const rightRating = parseInt(rightVolume || '5');

    // Balance the ears
    const avgRating = (leftRating + rightRating) / 2;
    const leftGain = avgRating / leftRating;
    const rightGain = avgRating / rightRating;

    return { leftGain, rightGain };
  }

  /**
   * Validate calibration with known reference
   */
  private async validateCalibration(profile: CalibrationProfile): Promise<boolean> {
    // Play validation tone
    await this.toneGenerator.playTone(1000, 1000, 0.5, 'both');
    
    const validated = confirm(
      'Validation: Does this tone sound clear and balanced in both ears?'
    );

    return validated;
  }

  /**
   * Get audio device ID
   */
  private async getDeviceId(): Promise<string> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutput = devices.find(d => d.kind === 'audiooutput');
    return audioOutput?.deviceId || 'default';
  }

  /**
   * Get audio device name
   */
  private async getDeviceName(): Promise<string> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutput = devices.find(d => d.kind === 'audiooutput');
    return audioOutput?.label || 'Default Audio Device';
  }

  /**
   * Save calibration to localStorage
   */
  private saveCalibration(profile: CalibrationProfile): void {
    const serialized = {
      ...profile,
      calibrationDate: profile.calibrationDate.toISOString(),
      frequencyCorrections: Array.from(profile.frequencyCorrections.entries()),
    };
    
    localStorage.setItem('audioCalibration', JSON.stringify(serialized));
  }

  /**
   * Load calibration from localStorage
   */
  loadCalibration(): CalibrationProfile | null {
    const stored = localStorage.getItem('audioCalibration');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      calibrationDate: new Date(parsed.calibrationDate),
      frequencyCorrections: new Map(parsed.frequencyCorrections),
    };
  }

  /**
   * Apply calibration to tone generation
   */
  applyCalibration(frequency: number, dbHL: number, ear: 'left' | 'right' | 'both'): number {
    if (!this.profile) return this.toneGenerator.dbHLToVolume(dbHL);

    // Apply frequency correction
    const correction = this.profile.frequencyCorrections.get(frequency) || 0;
    const correctedDB = dbHL + correction;

    // Apply ear-specific gain
    let gain = 1.0;
    if (ear === 'left') gain = this.profile.leftEarGain;
    if (ear === 'right') gain = this.profile.rightEarGain;
    if (ear === 'both') gain = (this.profile.leftEarGain + this.profile.rightEarGain) / 2;

    return this.toneGenerator.dbHLToVolume(correctedDB) * gain;
  }

  /**
   * Check if calibration is still valid (not expired)
   */
  isCalibrationValid(): boolean {
    if (!this.profile) return false;

    const daysSinceCalibration = 
      (Date.now() - this.profile.calibrationDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calibration expires after 30 days
    return daysSinceCalibration < 30 && this.profile.validated;
  }
}
```

### **2. Vision Calibration System**

Create `client/src/lib/visionCalibration.ts`:

```typescript
/**
 * Vision Calibration System
 * Ensures accurate distance and display calibration
 */

export interface VisionCalibrationProfile {
  screenSizeMm: { width: number; height: number };
  viewingDistanceCm: number;
  pixelsPerMm: number;
  calibrationDate: Date;
  validated: boolean;
}

export class VisionCalibrator {
  /**
   * Interactive calibration wizard
   */
  async runCalibrationWizard(): Promise<VisionCalibrationProfile> {
    // Step 1: Measure screen size
    const screenSize = await this.measureScreenSize();

    // Step 2: Measure viewing distance
    const distance = await this.measureViewingDistance();

    // Step 3: Calculate pixels per mm
    const pixelsPerMm = this.calculatePixelsPerMm(screenSize);

    const profile: VisionCalibrationProfile = {
      screenSizeMm: screenSize,
      viewingDistanceCm: distance,
      pixelsPerMm,
      calibrationDate: new Date(),
      validated: true,
    };

    this.saveCalibration(profile);
    return profile;
  }

  /**
   * Measure screen size using credit card reference
   */
  private async measureScreenSize(): Promise<{ width: number; height: number }> {
    // Credit card is 85.6mm x 53.98mm (standard)
    const cardWidthMm = 85.6;

    alert(
      'Calibration Step 1:\n\n' +
      'Place a credit card on your screen horizontally.\n' +
      'We will show a box - adjust it to match the card size.'
    );

    // Show adjustable box on screen
    const cardWidthPx = await this.showAdjustableBox();

    // Calculate pixels per mm
    const pixelsPerMm = cardWidthPx / cardWidthMm;

    // Calculate screen size
    const screenWidthPx = window.screen.width;
    const screenHeightPx = window.screen.height;

    return {
      width: screenWidthPx / pixelsPerMm,
      height: screenHeightPx / pixelsPerMm,
    };
  }

  /**
   * Show adjustable box for calibration
   */
  private async showAdjustableBox(): Promise<number> {
    return new Promise((resolve) => {
      // Implementation would show UI with adjustable box
      // User adjusts to match credit card
      // Returns width in pixels
      const width = 320; // Placeholder
      resolve(width);
    });
  }

  /**
   * Measure viewing distance
   */
  private async measureViewingDistance(): Promise<number> {
    const distance = prompt(
      'Calibration Step 2:\n\n' +
      'Measure the distance from your eyes to the screen in centimeters.\n' +
      'Standard viewing distance is 40-60 cm.\n\n' +
      'Enter distance in cm:',
      '50'
    );

    return parseInt(distance || '50');
  }

  /**
   * Calculate pixels per millimeter
   */
  private calculatePixelsPerMm(screenSize: { width: number; height: number }): number {
    const screenWidthPx = window.screen.width;
    return screenWidthPx / screenSize.width;
  }

  /**
   * Calculate optotype size for target acuity
   */
  calculateOptotypeSize(
    targetAcuity: string,
    profile: VisionCalibrationProfile
  ): number {
    // Snellen: 5 arcminutes at specified distance
    // 20/20 = 5 arcmin, 20/40 = 10 arcmin, etc.
    const acuityNumber = parseInt(targetAcuity.split('/')[1]);
    const arcMinutes = (acuityNumber / 20) * 5;

    // Convert arcminutes to mm at viewing distance
    const radians = (arcMinutes / 60) * (Math.PI / 180);
    const sizeMm = 2 * profile.viewingDistanceCm * 10 * Math.tan(radians / 2);

    // Convert mm to pixels
    const sizePx = sizeMm * profile.pixelsPerMm;

    return sizePx;
  }

  /**
   * Save calibration
   */
  private saveCalibration(profile: VisionCalibrationProfile): void {
    localStorage.setItem('visionCalibration', JSON.stringify({
      ...profile,
      calibrationDate: profile.calibrationDate.toISOString(),
    }));
  }

  /**
   * Load calibration
   */
  loadCalibration(): VisionCalibrationProfile | null {
    const stored = localStorage.getItem('visionCalibration');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      calibrationDate: new Date(parsed.calibrationDate),
    };
  }
}
```

---

## 📈 **Validation Metrics**

### **Sensitivity & Specificity**

```typescript
export interface ValidationMetrics {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
}

export function calculateMetrics(metrics: ValidationMetrics) {
  const sensitivity = metrics.truePositives / 
    (metrics.truePositives + metrics.falseNegatives);
  
  const specificity = metrics.trueNegatives / 
    (metrics.trueNegatives + metrics.falsePositives);
  
  const accuracy = (metrics.truePositives + metrics.trueNegatives) / 
    (metrics.truePositives + metrics.trueNegatives + 
     metrics.falsePositives + metrics.falseNegatives);
  
  const ppv = metrics.truePositives / 
    (metrics.truePositives + metrics.falsePositives); // Positive Predictive Value
  
  const npv = metrics.trueNegatives / 
    (metrics.trueNegatives + metrics.falseNegatives); // Negative Predictive Value

  return {
    sensitivity: sensitivity * 100,
    specificity: specificity * 100,
    accuracy: accuracy * 100,
    ppv: ppv * 100,
    npv: npv * 100,
  };
}
```

### **Target Performance**

- **Sensitivity**: >90% (correctly identifies abnormal cases)
- **Specificity**: >85% (correctly identifies normal cases)
- **PPV**: >80% (positive results are truly abnormal)
- **NPV**: >95% (negative results are truly normal)

---

## 🔬 **Recommended Testing Approach**

### **Phase 1: Algorithm Validation** (Week 1-2)
1. ✅ Unit tests for all algorithms
2. ✅ Test with synthetic data (known inputs/outputs)
3. ✅ Validate mathematical calculations
4. ✅ Test edge cases and boundary conditions

### **Phase 2: Dataset Validation** (Week 3-4)
1. ✅ Download medical datasets from HuggingFace/Kaggle
2. ✅ Run algorithms on real medical images/audio
3. ✅ Compare results with ground truth labels
4. ✅ Calculate sensitivity/specificity metrics

### **Phase 3: Calibration** (Week 5)
1. ✅ Implement audio calibration wizard
2. ✅ Implement vision calibration wizard
3. ✅ Test on multiple devices
4. ✅ Validate calibration accuracy

### **Phase 4: Clinical Validation** (Week 6-8)
1. ✅ Pilot study with real users
2. ✅ Compare with professional screenings
3. ✅ Collect feedback and iterate
4. ✅ Document validation results

---

## ✅ **Is This a Good Idea?**

### **YES! Here's why:**

1. **Medical Accuracy is Critical**
   - False negatives can miss serious conditions
   - False positives cause unnecessary anxiety
   - Proper validation ensures reliability

2. **Regulatory Requirements**
   - FDA may require validation data
   - Clinical studies needed for medical claims
   - Documentation proves due diligence

3. **User Trust**
   - Validated algorithms build confidence
   - Published metrics demonstrate quality
   - Professional endorsement possible

4. **Continuous Improvement**
   - Datasets help identify weaknesses
   - Calibration improves accuracy
   - Metrics guide optimization

### **Recommended Priority:**

1. **HIGH**: Unit tests with synthetic data
2. **HIGH**: Audio/vision calibration wizards
3. **MEDIUM**: HuggingFace dataset validation
4. **MEDIUM**: Sensitivity/specificity metrics
5. **LOW**: Full clinical validation (expensive, time-consuming)

---

## 🚀 **Next Steps**

1. **Install testing framework**:
   ```bash
   pnpm add -D vitest @vitest/ui
   ```

2. **Create test files** (provided above)

3. **Download datasets**:
   ```python
   # Install HuggingFace datasets
   pip install datasets

   # Download eye disease dataset
   from datasets import load_dataset
   dataset = load_dataset("keremberke/retinal-disease-classification")
   ```

4. **Implement calibration wizards**

5. **Run validation tests**

6. **Document results**

---

**This is absolutely a good idea and should be a priority before production deployment!** 🎯
