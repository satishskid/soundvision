/**
 * Audio Calibration System
 * Ensures accurate dB HL presentation across different devices
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
  userNotes?: string;
}

export class AudioCalibrator {
  private toneGenerator: AudioToneGenerator;
  private profile: CalibrationProfile | null = null;

  constructor() {
    this.toneGenerator = new AudioToneGenerator();
  }

  /**
   * Interactive calibration wizard
   * Returns calibration profile or null if cancelled
   */
  async runCalibrationWizard(
    onProgress?: (step: number, total: number, message: string) => void
  ): Promise<CalibrationProfile | null> {
    const totalSteps = 4;
    
    try {
      // Initialize profile
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
      onProgress?.(1, totalSteps, 'Setting reference volume level');
      
      const referenceConfirmed = await this.calibrateReferenceVolume();
      if (!referenceConfirmed) return null;

      // Step 2: Frequency-specific calibration
      onProgress?.(2, totalSteps, 'Calibrating frequency response');
      
      const frequencies = [250, 500, 1000, 2000, 4000, 8000];
      for (let i = 0; i < frequencies.length; i++) {
        const freq = frequencies[i];
        onProgress?.(2, totalSteps, `Calibrating ${freq} Hz (${i + 1}/${frequencies.length})`);
        
        const correction = await this.calibrateFrequency(freq);
        profile.frequencyCorrections.set(freq, correction);
      }

      // Step 3: Ear balance calibration
      onProgress?.(3, totalSteps, 'Balancing left and right ears');
      
      const { leftGain, rightGain } = await this.calibrateEarBalance();
      profile.leftEarGain = leftGain;
      profile.rightEarGain = rightGain;

      // Step 4: Validation
      onProgress?.(4, totalSteps, 'Validating calibration');
      
      profile.validated = await this.validateCalibration(profile);

      if (!profile.validated) {
        const retry = confirm('Calibration validation failed. Would you like to try again?');
        if (retry) {
          return await this.runCalibrationWizard(onProgress);
        }
        return null;
      }

      this.profile = profile;
      this.saveCalibration(profile);

      return profile;
    } catch (error) {
      console.error('Calibration error:', error);
      return null;
    }
  }

  /**
   * Calibrate reference volume level
   */
  private async calibrateReferenceVolume(): Promise<boolean> {
    // Play reference tone at 1000 Hz, 40 dB HL
    await this.toneGenerator.playTone(1000, 2000, 0.5, 'both');
    
    const confirmed = confirm(
      '🎧 CALIBRATION STEP 1: Reference Volume\n\n' +
      'You should hear a clear, comfortable tone in both ears.\n\n' +
      '• Adjust your device volume to a comfortable level\n' +
      '• The tone should not be too loud or too quiet\n' +
      '• Use headphones for best results\n\n' +
      'Can you hear the tone clearly?'
    );

    return confirmed;
  }

  /**
   * Calibrate a specific frequency
   * Uses ascending method to find threshold
   */
  private async calibrateFrequency(frequency: number): Promise<number> {
    let level = -10; // Start below threshold
    let heard = false;

    // Ascending method: increase until heard
    while (level <= 60 && !heard) {
      const volume = this.toneGenerator.dbHLToVolume(level);
      await this.toneGenerator.playTone(frequency, 500, volume, 'both');
      
      // Small delay between tones
      await new Promise(resolve => setTimeout(resolve, 500));
      
      heard = confirm(`Did you hear the ${frequency} Hz tone?`);
      
      if (!heard) {
        level += 5;
      }
    }

    // Calculate correction factor
    // If user first hears at 20 dB but should hear at 0 dB, correction is -20
    const expectedThreshold = 0; // Normal hearing threshold
    const actualThreshold = level;
    const correction = expectedThreshold - actualThreshold;
    
    return correction;
  }

  /**
   * Calibrate left/right ear balance
   */
  private async calibrateEarBalance(): Promise<{ leftGain: number; rightGain: number }> {
    // Play tone to left ear
    await this.toneGenerator.playTone(1000, 1500, 0.5, 'left');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Play tone to right ear
    await this.toneGenerator.playTone(1000, 1500, 0.5, 'right');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const balanced = confirm(
      '🎧 CALIBRATION STEP 3: Ear Balance\n\n' +
      'You just heard tones in your left ear, then right ear.\n\n' +
      'Did they sound equally loud in both ears?'
    );

    if (balanced) {
      return { leftGain: 1.0, rightGain: 1.0 };
    }

    // If not balanced, ask which ear was louder
    const leftLouder = confirm(
      'Which ear sounded louder?\n\n' +
      'Click OK if LEFT ear was louder\n' +
      'Click Cancel if RIGHT ear was louder'
    );

    // Adjust gain to balance
    if (leftLouder) {
      return { leftGain: 0.9, rightGain: 1.1 };
    } else {
      return { leftGain: 1.1, rightGain: 0.9 };
    }
  }

  /**
   * Validate calibration with known reference
   */
  private async validateCalibration(profile: CalibrationProfile): Promise<boolean> {
    // Play validation tone at 1000 Hz with calibration applied
    const correctedVolume = this.applyCalibration(1000, 20, 'both');
    await this.toneGenerator.playTone(1000, 1500, correctedVolume, 'both');
    
    const validated = confirm(
      '🎧 CALIBRATION STEP 4: Validation\n\n' +
      'You should hear a clear, balanced tone at a moderate volume.\n\n' +
      'Does the tone sound:\n' +
      '• Clear and not distorted?\n' +
      '• Balanced between both ears?\n' +
      '• At a comfortable volume?\n\n' +
      'Click OK if yes, Cancel to recalibrate'
    );

    return validated;
  }

  /**
   * Get audio output device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutput = devices.find(d => d.kind === 'audiooutput');
      return audioOutput?.deviceId || 'default';
    } catch {
      return 'default';
    }
  }

  /**
   * Get audio output device name
   */
  private async getDeviceName(): Promise<string> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutput = devices.find(d => d.kind === 'audiooutput');
      return audioOutput?.label || 'Default Audio Device';
    } catch {
      return 'Default Audio Device';
    }
  }

  /**
   * Apply calibration to tone generation
   */
  applyCalibration(frequency: number, dbHL: number, ear: 'left' | 'right' | 'both'): number {
    if (!this.profile || !this.profile.validated) {
      return this.toneGenerator.dbHLToVolume(dbHL);
    }

    // Apply frequency correction
    const correction = this.profile.frequencyCorrections.get(frequency) || 0;
    const correctedDB = dbHL + correction;

    // Apply ear-specific gain
    let gain = 1.0;
    if (ear === 'left') {
      gain = this.profile.leftEarGain;
    } else if (ear === 'right') {
      gain = this.profile.rightEarGain;
    } else {
      gain = (this.profile.leftEarGain + this.profile.rightEarGain) / 2;
    }

    return this.toneGenerator.dbHLToVolume(correctedDB) * gain;
  }

  /**
   * Save calibration to localStorage
   */
  private saveCalibration(profile: CalibrationProfile): void {
    const serialized = {
      deviceId: profile.deviceId,
      deviceName: profile.deviceName,
      calibrationDate: profile.calibrationDate.toISOString(),
      frequencyCorrections: Array.from(profile.frequencyCorrections.entries()),
      leftEarGain: profile.leftEarGain,
      rightEarGain: profile.rightEarGain,
      validated: profile.validated,
      userNotes: profile.userNotes,
    };
    
    localStorage.setItem('audioCalibration', JSON.stringify(serialized));
  }

  /**
   * Load calibration from localStorage
   */
  loadCalibration(): CalibrationProfile | null {
    const stored = localStorage.getItem('audioCalibration');
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const profile: CalibrationProfile = {
        deviceId: parsed.deviceId,
        deviceName: parsed.deviceName,
        calibrationDate: new Date(parsed.calibrationDate),
        frequencyCorrections: new Map(parsed.frequencyCorrections),
        leftEarGain: parsed.leftEarGain,
        rightEarGain: parsed.rightEarGain,
        validated: parsed.validated,
        userNotes: parsed.userNotes,
      };

      this.profile = profile;
      return profile;
    } catch {
      return null;
    }
  }

  /**
   * Check if calibration is still valid (not expired)
   */
  isCalibrationValid(): boolean {
    if (!this.profile || !this.profile.validated) return false;

    const daysSinceCalibration = 
      (Date.now() - this.profile.calibrationDate.getTime()) / (1000 * 60 * 60 * 24);

    // Calibration expires after 30 days
    return daysSinceCalibration < 30;
  }

  /**
   * Get current calibration profile
   */
  getProfile(): CalibrationProfile | null {
    return this.profile;
  }

  /**
   * Clear calibration
   */
  clearCalibration(): void {
    this.profile = null;
    localStorage.removeItem('audioCalibration');
  }

  /**
   * Export calibration profile
   */
  exportProfile(): string {
    if (!this.profile) throw new Error('No calibration profile to export');
    
    const serialized = {
      deviceId: this.profile.deviceId,
      deviceName: this.profile.deviceName,
      calibrationDate: this.profile.calibrationDate.toISOString(),
      frequencyCorrections: Array.from(this.profile.frequencyCorrections.entries()),
      leftEarGain: this.profile.leftEarGain,
      rightEarGain: this.profile.rightEarGain,
      validated: this.profile.validated,
      userNotes: this.profile.userNotes,
    };
    
    return JSON.stringify(serialized, null, 2);
  }

  /**
   * Import calibration profile
   */
  importProfile(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      const profile: CalibrationProfile = {
        deviceId: parsed.deviceId,
        deviceName: parsed.deviceName,
        calibrationDate: new Date(parsed.calibrationDate),
        frequencyCorrections: new Map(parsed.frequencyCorrections),
        leftEarGain: parsed.leftEarGain,
        rightEarGain: parsed.rightEarGain,
        validated: parsed.validated,
        userNotes: parsed.userNotes,
      };

      this.profile = profile;
      this.saveCalibration(profile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.toneGenerator.dispose();
  }
}
