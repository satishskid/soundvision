/**
 * Respiratory Rate Detection
 * Extracts breathing rate from PPG signal modulation
 */

import { detrend, bandpassFilter, detectPeaks, normalize } from './signalProcessing';
import type { RespiratoryRateMeasurement, PPGSignal } from './types';

/**
 * Detect respiratory rate from PPG signal
 * Normal range: 12-20 breaths/minute for adults
 */
export function detectRespiratoryRate(
  ppgSignal: PPGSignal,
  sampleRate: number = 30
): RespiratoryRateMeasurement {
  if (ppgSignal.green.length < 180) {
    // Need at least 6 seconds of data
    return {
      respiratoryRate: 0,
      pattern: 'regular',
      timestamp: new Date(),
    };
  }

  // Extract low-frequency component (respiratory modulation)
  // Breathing causes amplitude modulation in PPG signal
  let signal = detrend(ppgSignal.green);
  signal = bandpassFilter(signal, 0.1, 0.5, sampleRate); // 6-30 breaths/min
  signal = normalize(signal);

  // Detect peaks (breaths)
  const minDistance = sampleRate * 2; // Minimum 2 seconds between breaths
  const peaks = detectPeaks(signal, minDistance, 0.3);

  if (peaks.length < 3) {
    return {
      respiratoryRate: 0,
      pattern: 'irregular',
      timestamp: new Date(),
    };
  }

  // Calculate respiratory rate
  const avgInterval = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
  const respiratoryRate = Math.round((sampleRate / avgInterval) * 60);

  // Validate range (6-30 breaths/min)
  const validatedRR = respiratoryRate >= 6 && respiratoryRate <= 30 ? respiratoryRate : 0;

  // Determine breathing pattern regularity
  const pattern = assessBreathingPattern(peaks);

  return {
    respiratoryRate: validatedRR,
    pattern,
    timestamp: new Date(),
  };
}

/**
 * Assess breathing pattern regularity
 */
function assessBreathingPattern(peakIndices: number[]): 'regular' | 'irregular' {
  if (peakIndices.length < 3) return 'irregular';

  // Calculate intervals between breaths
  const intervals: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    intervals.push(peakIndices[i] - peakIndices[i - 1]);
  }

  // Calculate coefficient of variation
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 1;

  // CV < 0.2 indicates regular breathing
  return cv < 0.2 ? 'regular' : 'irregular';
}

/**
 * Assess respiratory rate level
 */
export function assessRespiratoryRate(rate: number, age: number): {
  level: 'normal' | 'bradypnea' | 'tachypnea';
  description: string;
  action: string;
} {
  // Normal ranges vary by age
  let normalMin = 12;
  let normalMax = 20;

  if (age < 18) {
    normalMin = 12;
    normalMax = 20;
  } else if (age < 65) {
    normalMin = 12;
    normalMax = 18;
  } else {
    normalMin = 12;
    normalMax = 20;
  }

  if (rate >= normalMin && rate <= normalMax) {
    return {
      level: 'normal',
      description: 'Normal respiratory rate',
      action: 'No action needed',
    };
  } else if (rate < normalMin) {
    return {
      level: 'bradypnea',
      description: 'Slow breathing rate',
      action: 'Monitor - consult doctor if persistent or symptomatic',
    };
  } else {
    return {
      level: 'tachypnea',
      description: 'Fast breathing rate',
      action: 'Monitor - consult doctor if persistent or symptomatic',
    };
  }
}

/**
 * Calculate average respiratory rate over time window
 */
export function calculateAverageRespiratoryRate(
  measurements: RespiratoryRateMeasurement[],
  windowSeconds: number = 60
): number {
  if (measurements.length === 0) return 0;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const recentMeasurements = measurements.filter(
    m => now - m.timestamp.getTime() < windowMs
  );

  if (recentMeasurements.length === 0) return 0;

  const sum = recentMeasurements.reduce((acc, m) => acc + m.respiratoryRate, 0);
  return Math.round(sum / recentMeasurements.length);
}

/**
 * Detect breathing abnormalities
 */
export function detectBreathingAbnormalities(
  measurements: RespiratoryRateMeasurement[]
): {
  hasAbnormality: boolean;
  abnormalities: string[];
} {
  if (measurements.length < 5) {
    return {
      hasAbnormality: false,
      abnormalities: [],
    };
  }

  const abnormalities: string[] = [];

  // Check for irregular pattern
  const irregularCount = measurements.filter(m => m.pattern === 'irregular').length;
  if (irregularCount / measurements.length > 0.5) {
    abnormalities.push('Irregular breathing pattern detected');
  }

  // Check for rate variability
  const rates = measurements.map(m => m.respiratoryRate);
  const mean = rates.reduce((sum, val) => sum + val, 0) / rates.length;
  const variance = rates.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rates.length;
  const std = Math.sqrt(variance);

  if (std > 5) {
    abnormalities.push('High variability in breathing rate');
  }

  // Check for sustained abnormal rates
  const abnormalRates = rates.filter(r => r < 10 || r > 25).length;
  if (abnormalRates / rates.length > 0.3) {
    abnormalities.push('Sustained abnormal breathing rate');
  }

  return {
    hasAbnormality: abnormalities.length > 0,
    abnormalities,
  };
}
