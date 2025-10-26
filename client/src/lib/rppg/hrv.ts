/**
 * Heart Rate Variability (HRV) Analysis
 * Calculate HRV metrics and stress level assessment
 */

import { calculateIBI, removeOutliers } from './signalProcessing';
import type { HRVMeasurement } from './types';

/**
 * Calculate comprehensive HRV metrics
 * SDNN, RMSSD, pNN50 are standard HRV measures
 */
export function calculateHRV(
  peakIndices: number[],
  sampleRate: number = 30
): HRVMeasurement {
  // Calculate inter-beat intervals
  const ibis = calculateIBI(peakIndices, sampleRate);
  
  // Remove outliers for more accurate analysis
  const cleanIBIs = removeOutliers(ibis);

  if (cleanIBIs.length < 5) {
    // Not enough data for reliable HRV analysis
    return {
      sdnn: 0,
      rmssd: 0,
      pnn50: 0,
      stressLevel: 'medium',
      timestamp: new Date(),
    };
  }

  // Calculate SDNN (Standard Deviation of NN intervals)
  const mean = cleanIBIs.reduce((sum, ibi) => sum + ibi, 0) / cleanIBIs.length;
  const variance = cleanIBIs.reduce((sum, ibi) => sum + Math.pow(ibi - mean, 2), 0) / cleanIBIs.length;
  const sdnn = Math.sqrt(variance);

  // Calculate RMSSD (Root Mean Square of Successive Differences)
  let sumSquaredDiffs = 0;
  for (let i = 1; i < cleanIBIs.length; i++) {
    const diff = cleanIBIs[i] - cleanIBIs[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  const rmssd = Math.sqrt(sumSquaredDiffs / (cleanIBIs.length - 1));

  // Calculate pNN50 (percentage of intervals >50ms different)
  let count50 = 0;
  for (let i = 1; i < cleanIBIs.length; i++) {
    if (Math.abs(cleanIBIs[i] - cleanIBIs[i - 1]) > 50) {
      count50++;
    }
  }
  const pnn50 = (count50 / (cleanIBIs.length - 1)) * 100;

  // Calculate stress level based on HRV metrics
  const stressLevel = calculateStressLevel(sdnn, rmssd);

  return {
    sdnn: Math.round(sdnn),
    rmssd: Math.round(rmssd),
    pnn50: Math.round(pnn50),
    stressLevel,
    timestamp: new Date(),
  };
}

/**
 * Determine stress level from HRV metrics
 * Higher HRV = Lower stress (better autonomic function)
 */
function calculateStressLevel(
  sdnn: number,
  rmssd: number
): 'low' | 'medium' | 'high' {
  // SDNN thresholds:
  // > 50ms = Low stress (good HRV)
  // 25-50ms = Medium stress
  // < 25ms = High stress (poor HRV)

  if (sdnn > 50 && rmssd > 40) {
    return 'low';
  } else if (sdnn > 25 || rmssd > 20) {
    return 'medium';
  } else {
    return 'high';
  }
}

/**
 * Calculate additional HRV metrics for advanced analysis
 */
export function calculateAdvancedHRV(
  peakIndices: number[],
  sampleRate: number = 30
): {
  sdnn: number;
  rmssd: number;
  pnn50: number;
  meanHR: number;
  minHR: number;
  maxHR: number;
  hrvIndex: number;
} {
  const ibis = calculateIBI(peakIndices, sampleRate);
  const cleanIBIs = removeOutliers(ibis);

  if (cleanIBIs.length < 5) {
    return {
      sdnn: 0,
      rmssd: 0,
      pnn50: 0,
      meanHR: 0,
      minHR: 0,
      maxHR: 0,
      hrvIndex: 0,
    };
  }

  // Basic HRV metrics
  const mean = cleanIBIs.reduce((sum, ibi) => sum + ibi, 0) / cleanIBIs.length;
  const variance = cleanIBIs.reduce((sum, ibi) => sum + Math.pow(ibi - mean, 2), 0) / cleanIBIs.length;
  const sdnn = Math.sqrt(variance);

  let sumSquaredDiffs = 0;
  for (let i = 1; i < cleanIBIs.length; i++) {
    const diff = cleanIBIs[i] - cleanIBIs[i - 1];
    sumSquaredDiffs += diff * diff;
  }
  const rmssd = Math.sqrt(sumSquaredDiffs / (cleanIBIs.length - 1));

  let count50 = 0;
  for (let i = 1; i < cleanIBIs.length; i++) {
    if (Math.abs(cleanIBIs[i] - cleanIBIs[i - 1]) > 50) {
      count50++;
    }
  }
  const pnn50 = (count50 / (cleanIBIs.length - 1)) * 100;

  // Heart rate statistics
  const heartRates = cleanIBIs.map(ibi => 60000 / ibi); // Convert IBI to HR
  const meanHR = heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length;
  const minHR = Math.min(...heartRates);
  const maxHR = Math.max(...heartRates);

  // HRV Index (0-100 scale)
  const hrvIndex = Math.min(100, Math.max(0, (sdnn / 100) * 100));

  return {
    sdnn: Math.round(sdnn),
    rmssd: Math.round(rmssd),
    pnn50: Math.round(pnn50),
    meanHR: Math.round(meanHR),
    minHR: Math.round(minHR),
    maxHR: Math.round(maxHR),
    hrvIndex: Math.round(hrvIndex),
  };
}

/**
 * Assess autonomic balance from HRV
 * LF/HF ratio indicates sympathetic vs parasympathetic activity
 */
export function assessAutonomicBalance(hrv: HRVMeasurement): {
  balance: 'sympathetic' | 'balanced' | 'parasympathetic';
  description: string;
} {
  // RMSSD reflects parasympathetic activity
  // SDNN reflects overall autonomic activity
  
  const ratio = hrv.sdnn > 0 ? hrv.rmssd / hrv.sdnn : 0;

  if (ratio > 0.7) {
    return {
      balance: 'parasympathetic',
      description: 'Relaxed state, good recovery',
    };
  } else if (ratio > 0.4) {
    return {
      balance: 'balanced',
      description: 'Healthy autonomic balance',
    };
  } else {
    return {
      balance: 'sympathetic',
      description: 'Active or stressed state',
    };
  }
}
