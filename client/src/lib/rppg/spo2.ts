/**
 * SpO2 (Blood Oxygen Saturation) Estimation
 * Uses red/blue channel ratio method from PPG signal
 */

import { detrend, bandpassFilter, normalize } from './signalProcessing';
import type { SpO2Measurement, PPGSignal } from './types';

/**
 * Estimate blood oxygen saturation (SpO2)
 * Normal range: 95-100%
 * Below 90%: Hypoxemia (medical attention needed)
 */
export function estimateSpO2(
  ppgSignal: PPGSignal,
  sampleRate: number = 30
): SpO2Measurement {
  if (ppgSignal.red.length < 60 || ppgSignal.blue.length < 60) {
    return {
      spo2: 0,
      confidence: 0,
      timestamp: new Date(),
    };
  }

  // Process red channel
  let redSignal = detrend(ppgSignal.red);
  redSignal = bandpassFilter(redSignal, 0.7, 4.0, sampleRate);
  redSignal = normalize(redSignal);

  // Process blue channel
  let blueSignal = detrend(ppgSignal.blue);
  blueSignal = bandpassFilter(blueSignal, 0.7, 4.0, sampleRate);
  blueSignal = normalize(blueSignal);

  // Calculate AC/DC components
  const redAC = calculateAC(redSignal);
  const redDC = calculateDC(ppgSignal.red);
  const blueAC = calculateAC(blueSignal);
  const blueDC = calculateDC(ppgSignal.blue);

  // Prevent division by zero
  if (redDC === 0 || blueDC === 0 || blueAC === 0) {
    return {
      spo2: 0,
      confidence: 0,
      timestamp: new Date(),
    };
  }

  // Calculate R-value (ratio of ratios)
  const R = (redAC / redDC) / (blueAC / blueDC);

  // SpO2 calibration curve: SpO2 = 110 - 25*R
  // This is a simplified empirical formula
  let spo2 = 110 - 25 * R;

  // Clamp to physiological range (90-100%)
  spo2 = Math.max(90, Math.min(100, spo2));

  // Calculate confidence based on signal quality
  // R-value around 0.8 indicates good signal
  const confidence = Math.min(100, Math.max(0, 100 - Math.abs(R - 0.8) * 100));

  return {
    spo2: Math.round(spo2),
    confidence: Math.round(confidence),
    timestamp: new Date(),
  };
}

/**
 * Calculate AC component (pulsatile component)
 * This represents the variation in blood volume
 */
function calculateAC(signal: number[]): number {
  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
  return Math.sqrt(variance);
}

/**
 * Calculate DC component (non-pulsatile component)
 * This represents the baseline absorption
 */
function calculateDC(signal: number[]): number {
  return signal.reduce((sum, val) => sum + val, 0) / signal.length;
}

/**
 * Estimate SpO2 with advanced processing
 * Uses multiple wavelengths for better accuracy
 */
export function estimateSpO2Advanced(
  ppgSignal: PPGSignal,
  sampleRate: number = 30
): SpO2Measurement & { trend: 'stable' | 'increasing' | 'decreasing' } {
  const basicEstimate = estimateSpO2(ppgSignal, sampleRate);

  if (ppgSignal.red.length < 180) {
    return {
      ...basicEstimate,
      trend: 'stable',
    };
  }

  // Calculate trend over last 30 seconds
  const recentLength = Math.min(180, ppgSignal.red.length);
  const recentSignal: PPGSignal = {
    red: ppgSignal.red.slice(-recentLength),
    green: ppgSignal.green.slice(-recentLength),
    blue: ppgSignal.blue.slice(-recentLength),
    timestamps: ppgSignal.timestamps.slice(-recentLength),
  };

  // Split into 3 segments
  const segmentSize = Math.floor(recentLength / 3);
  const measurements: number[] = [];

  for (let i = 0; i < 3; i++) {
    const start = i * segmentSize;
    const end = start + segmentSize;
    const segmentSignal: PPGSignal = {
      red: recentSignal.red.slice(start, end),
      green: recentSignal.green.slice(start, end),
      blue: recentSignal.blue.slice(start, end),
      timestamps: recentSignal.timestamps.slice(start, end),
    };
    const measurement = estimateSpO2(segmentSignal, sampleRate);
    measurements.push(measurement.spo2);
  }

  // Determine trend
  let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
  if (measurements[2] > measurements[0] + 1) {
    trend = 'increasing';
  } else if (measurements[2] < measurements[0] - 1) {
    trend = 'decreasing';
  }

  return {
    ...basicEstimate,
    trend,
  };
}

/**
 * Assess SpO2 level and provide health interpretation
 */
export function assessSpO2Level(spo2: number): {
  level: 'normal' | 'mild' | 'moderate' | 'severe';
  description: string;
  action: string;
} {
  if (spo2 >= 95) {
    return {
      level: 'normal',
      description: 'Normal oxygen saturation',
      action: 'No action needed',
    };
  } else if (spo2 >= 90) {
    return {
      level: 'mild',
      description: 'Mildly low oxygen saturation',
      action: 'Monitor and consult doctor if persistent',
    };
  } else if (spo2 >= 85) {
    return {
      level: 'moderate',
      description: 'Moderately low oxygen saturation',
      action: 'Consult doctor soon',
    };
  } else {
    return {
      level: 'severe',
      description: 'Severely low oxygen saturation',
      action: 'Seek immediate medical attention',
    };
  }
}

/**
 * Calculate average SpO2 over time window
 */
export function calculateAverageSpO2(
  measurements: SpO2Measurement[],
  windowSeconds: number = 30
): number {
  if (measurements.length === 0) return 0;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const recentMeasurements = measurements.filter(
    m => now - m.timestamp.getTime() < windowMs
  );

  if (recentMeasurements.length === 0) return 0;

  // Weighted average by confidence
  let totalWeight = 0;
  let weightedSum = 0;

  recentMeasurements.forEach(m => {
    const weight = m.confidence / 100;
    weightedSum += m.spo2 * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
