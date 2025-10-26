/**
 * Core rPPG Engine
 * Main interface for cardiovascular measurements using camera
 */

import { selectFacialROI, extractColorFromROI } from './roiSelection';
import { detectHeartRate, processSignalContinuous } from './heartRate';
import { calculateHRV } from './hrv';
import { estimateSpO2 } from './spo2';
import { estimateBloodPressure } from './bloodPressure';
import { detectRespiratoryRate } from './respiratory';
import type { PPGSignal, VitalSignsResult, CalibrationData } from './types';

/**
 * Main rPPG Engine Class
 * Processes video frames and extracts vital signs
 */
export class RPPGEngine {
  private ppgSignal: PPGSignal = {
    red: [],
    green: [],
    blue: [],
    timestamps: [],
  };
  private sampleRate = 30; // fps
  private maxSamples = 900; // 30 seconds at 30fps
  private calibration: CalibrationData | null = null;
  private isProcessing = false;

  /**
   * Process a single video frame
   * Call this at 30fps for best results
   */
  async processFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Select facial ROI
      const rois = await selectFacialROI(videoElement);
      if (rois.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Extract color from forehead (best ROI for rPPG)
      const color = extractColorFromROI(videoElement, rois[0]);

      // Add to signal buffer
      this.ppgSignal.red.push(color.red);
      this.ppgSignal.green.push(color.green);
      this.ppgSignal.blue.push(color.blue);
      this.ppgSignal.timestamps.push(Date.now());

      // Maintain buffer size (rolling window)
      if (this.ppgSignal.red.length > this.maxSamples) {
        this.ppgSignal.red.shift();
        this.ppgSignal.green.shift();
        this.ppgSignal.blue.shift();
        this.ppgSignal.timestamps.shift();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current vital signs measurements
   * Returns null if insufficient data
   */
  getCurrentMeasurements(): Partial<VitalSignsResult> | null {
    // Need at least 10 seconds of data (300 frames at 30fps)
    if (this.ppgSignal.green.length < 300) {
      return null;
    }

    try {
      // Process signal for peak detection
      const processed = processSignalContinuous(this.ppgSignal, this.sampleRate);

      // Calculate all vital signs
      const heartRate = detectHeartRate(this.ppgSignal, this.sampleRate);
      const hrv = calculateHRV(processed.peakIndices, this.sampleRate);
      const spo2 = estimateSpO2(this.ppgSignal, this.sampleRate);
      const bloodPressure = estimateBloodPressure(
        this.ppgSignal,
        this.calibration,
        this.sampleRate
      );
      const respiratoryRate = detectRespiratoryRate(this.ppgSignal, this.sampleRate);

      // Calculate overall health score
      const healthScore = this.calculateHealthScore(heartRate, hrv, spo2);

      // Calculate overall quality
      const overallQuality = processed.quality.acceptable ? 80 : 50;

      return {
        heartRate,
        hrv,
        spo2,
        bloodPressure,
        respiratoryRate,
        overallQuality,
        healthScore,
      };
    } catch (error) {
      console.error('[rPPG Engine] Error calculating measurements:', error);
      return null;
    }
  }

  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(hr: any, hrv: any, spo2: any): number {
    let score = 100;

    // Heart rate scoring (60-100 BPM is ideal)
    if (hr.heartRate < 60 || hr.heartRate > 100) score -= 10;
    if (hr.heartRate < 50 || hr.heartRate > 110) score -= 10;
    if (hr.heartRate < 40 || hr.heartRate > 120) score -= 15;

    // HRV scoring (higher is better)
    if (hrv.sdnn < 25) score -= 15;
    if (hrv.sdnn < 15) score -= 10;
    if (hrv.stressLevel === 'high') score -= 10;
    if (hrv.stressLevel === 'medium') score -= 5;

    // SpO2 scoring (95-100% is ideal)
    if (spo2.spo2 < 95) score -= 15;
    if (spo2.spo2 < 90) score -= 20;
    if (spo2.spo2 < 85) score -= 25;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Set blood pressure calibration
   * Required for BP estimation
   */
  setCalibration(calibration: CalibrationData): void {
    this.calibration = calibration;
  }

  /**
   * Get current calibration
   */
  getCalibration(): CalibrationData | null {
    return this.calibration;
  }

  /**
   * Check if engine has enough data for measurements
   */
  hasEnoughData(): boolean {
    return this.ppgSignal.green.length >= 300;
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.ppgSignal.green.length;
  }

  /**
   * Get signal quality metrics
   */
  getSignalQuality(): { quality: number; issues: string[] } {
    if (this.ppgSignal.green.length < 60) {
      return {
        quality: 0,
        issues: ['Insufficient data'],
      };
    }

    try {
      const processed = processSignalContinuous(this.ppgSignal, this.sampleRate);
      return {
        quality: processed.quality.stability,
        issues: processed.quality.issues,
      };
    } catch (error) {
      return {
        quality: 0,
        issues: ['Error processing signal'],
      };
    }
  }

  /**
   * Reset the engine and clear all data
   */
  reset(): void {
    this.ppgSignal = {
      red: [],
      green: [],
      blue: [],
      timestamps: [],
    };
    this.isProcessing = false;
  }

  /**
   * Get raw PPG signal (for debugging/visualization)
   */
  getRawSignal(): PPGSignal {
    return { ...this.ppgSignal };
  }
}

/**
 * Create a new rPPG engine instance
 */
export function createRPPGEngine(): RPPGEngine {
  return new RPPGEngine();
}

/**
 * Helper function to format vital signs for display
 */
export function formatVitalSigns(result: Partial<VitalSignsResult>): {
  heartRate: string;
  hrv: string;
  stress: string;
  spo2: string;
  bloodPressure: string;
  respiratoryRate: string;
  healthScore: string;
} {
  return {
    heartRate: result.heartRate?.heartRate
      ? `${result.heartRate.heartRate} BPM`
      : '--',
    hrv: result.hrv?.sdnn ? `${result.hrv.sdnn} ms` : '--',
    stress: result.hrv?.stressLevel
      ? result.hrv.stressLevel.charAt(0).toUpperCase() + result.hrv.stressLevel.slice(1)
      : '--',
    spo2: result.spo2?.spo2 ? `${result.spo2.spo2}%` : '--',
    bloodPressure:
      result.bloodPressure?.systolic && result.bloodPressure?.diastolic
        ? `${result.bloodPressure.systolic}/${result.bloodPressure.diastolic}`
        : '--',
    respiratoryRate: result.respiratoryRate?.respiratoryRate
      ? `${result.respiratoryRate.respiratoryRate} /min`
      : '--',
    healthScore: result.healthScore ? `${result.healthScore}/100` : '--',
  };
}
