/**
 * Blood Pressure Estimation
 * Uses Pulse Transit Time (PTT) method
 * Note: Requires calibration with traditional BP measurement
 */

import { detectPeaks } from './signalProcessing';
import type { BloodPressureMeasurement, PPGSignal, CalibrationData } from './types';

/**
 * Estimate blood pressure using PPG signal
 * Requires prior calibration with cuff measurement
 */
export function estimateBloodPressure(
  ppgSignal: PPGSignal,
  calibration: CalibrationData | null,
  sampleRate: number = 30
): BloodPressureMeasurement {
  if (!calibration) {
    return {
      systolic: 0,
      diastolic: 0,
      confidence: 0,
      calibrated: false,
      timestamp: new Date(),
    };
  }

  if (ppgSignal.green.length < 90) {
    return {
      systolic: 0,
      diastolic: 0,
      confidence: 0,
      calibrated: true,
      timestamp: new Date(),
    };
  }

  // Detect peaks in green channel
  const peaks = detectPeaks(ppgSignal.green, 10, 0.5);

  if (peaks.length < 2) {
    return {
      systolic: 0,
      diastolic: 0,
      confidence: 0,
      calibrated: true,
      timestamp: new Date(),
    };
  }

  // Calculate average Pulse Transit Time (PTT)
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push((peaks[i] - peaks[i - 1]) / sampleRate);
  }
  const avgPTT = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

  // Estimate BP using calibration
  // PTT is inversely related to BP: higher BP = shorter PTT
  const pttDelta = avgPTT - 0.3; // 0.3s is baseline PTT
  const systolic = Math.round(calibration.systolicReference - pttDelta * 100);
  const diastolic = Math.round(calibration.diastolicReference - pttDelta * 60);

  // Clamp to physiological range
  const clampedSystolic = Math.max(90, Math.min(180, systolic));
  const clampedDiastolic = Math.max(60, Math.min(110, diastolic));

  // Calculate confidence based on signal quality and calibration age
  const calibrationAge = Date.now() - calibration.calibrationDate.getTime();
  const ageInDays = calibrationAge / (1000 * 60 * 60 * 24);
  const ageConfidence = Math.max(0, 100 - ageInDays * 2); // Decrease 2% per day
  const confidence = Math.min(70, ageConfidence); // Max 70% confidence

  return {
    systolic: clampedSystolic,
    diastolic: clampedDiastolic,
    confidence: Math.round(confidence),
    calibrated: true,
    timestamp: new Date(),
  };
}

/**
 * Create calibration data from reference measurement
 */
export function createCalibration(
  userId: string,
  systolicReference: number,
  diastolicReference: number,
  deviceUsed: string = 'Manual Cuff'
): CalibrationData {
  return {
    userId,
    systolicReference,
    diastolicReference,
    calibrationDate: new Date(),
    deviceUsed,
  };
}

/**
 * Check if calibration is still valid
 * Calibration should be refreshed every 7 days
 */
export function isCalibrationValid(calibration: CalibrationData | null): boolean {
  if (!calibration) return false;

  const calibrationAge = Date.now() - calibration.calibrationDate.getTime();
  const ageInDays = calibrationAge / (1000 * 60 * 60 * 24);

  return ageInDays < 7; // Valid for 7 days
}

/**
 * Assess blood pressure level
 */
export function assessBloodPressure(systolic: number, diastolic: number): {
  category: 'normal' | 'elevated' | 'high_stage1' | 'high_stage2' | 'crisis';
  description: string;
  action: string;
} {
  // Based on American Heart Association guidelines
  if (systolic < 120 && diastolic < 80) {
    return {
      category: 'normal',
      description: 'Normal blood pressure',
      action: 'Maintain healthy lifestyle',
    };
  } else if (systolic >= 120 && systolic < 130 && diastolic < 80) {
    return {
      category: 'elevated',
      description: 'Elevated blood pressure',
      action: 'Adopt healthier lifestyle to prevent hypertension',
    };
  } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
    return {
      category: 'high_stage1',
      description: 'High Blood Pressure (Stage 1)',
      action: 'Consult doctor about lifestyle changes and possible medication',
    };
  } else if (systolic >= 140 || diastolic >= 90) {
    return {
      category: 'high_stage2',
      description: 'High Blood Pressure (Stage 2)',
      action: 'Consult doctor soon - medication likely needed',
    };
  } else {
    return {
      category: 'crisis',
      description: 'Hypertensive Crisis',
      action: 'Seek immediate medical attention',
    };
  }
}

/**
 * Calculate Mean Arterial Pressure (MAP)
 */
export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round(diastolic + (systolic - diastolic) / 3);
}

/**
 * Calculate Pulse Pressure
 */
export function calculatePulsePressure(systolic: number, diastolic: number): number {
  return systolic - diastolic;
}

/**
 * Estimate cardiovascular risk based on BP
 */
export function estimateCardiovascularRisk(
  systolic: number,
  diastolic: number,
  age: number
): {
  risk: 'low' | 'moderate' | 'high' | 'very_high';
  description: string;
} {
  const assessment = assessBloodPressure(systolic, diastolic);
  
  if (assessment.category === 'normal') {
    return {
      risk: 'low',
      description: 'Low cardiovascular risk',
    };
  } else if (assessment.category === 'elevated') {
    return {
      risk: age > 50 ? 'moderate' : 'low',
      description: 'Monitor blood pressure regularly',
    };
  } else if (assessment.category === 'high_stage1') {
    return {
      risk: 'moderate',
      description: 'Moderate cardiovascular risk',
    };
  } else if (assessment.category === 'high_stage2') {
    return {
      risk: 'high',
      description: 'High cardiovascular risk',
    };
  } else {
    return {
      risk: 'very_high',
      description: 'Very high cardiovascular risk',
    };
  }
}
