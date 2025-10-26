/**
 * Heart Rate Detection Algorithm
 * Extracts heart rate from PPG signal using FFT
 */

import {
  detrend,
  bandpassFilter,
  normalize,
  findDominantFrequency,
  detectPeaks,
  movingAverage,
} from './signalProcessing';
import type { HeartRateMeasurement, ProcessedSignal, PPGSignal } from './types';

/**
 * Detect heart rate from PPG signal
 */
export function detectHeartRate(
  ppgSignal: PPGSignal,
  sampleRate: number = 30
): HeartRateMeasurement {
  // Use green channel (most sensitive to blood volume changes)
  let signal = ppgSignal.green;

  if (signal.length < 60) {
    // Need at least 2 seconds of data
    return {
      heartRate: 0,
      confidence: 0,
      timestamp: new Date(),
    };
  }

  // Preprocessing pipeline
  signal = detrend(signal);
  signal = bandpassFilter(signal, 0.7, 4.0, sampleRate);
  signal = normalize(signal);
  signal = movingAverage(signal, 3);

  // Find dominant frequency (heart rate)
  const { frequency, confidence } = findDominantFrequency(
    signal,
    sampleRate,
    0.7,  // 42 BPM minimum
    4.0   // 240 BPM maximum
  );

  // Convert frequency to BPM
  const heartRate = Math.round(frequency * 60);

  // Validate heart rate range
  const validatedHR = heartRate >= 40 && heartRate <= 200 ? heartRate : 0;
  const validatedConfidence = validatedHR > 0 ? Math.round(confidence) : 0;

  // Get waveform for display (last 10 seconds)
  const waveformLength = Math.min(300, signal.length);
  const waveform = signal.slice(-waveformLength);

  return {
    heartRate: validatedHR,
    confidence: validatedConfidence,
    timestamp: new Date(),
    waveform,
  };
}

/**
 * Process signal continuously and return detailed analysis
 */
export function processSignalContinuous(
  ppgSignal: PPGSignal,
  sampleRate: number = 30
): ProcessedSignal {
  let signal = ppgSignal.green;

  if (signal.length < 60) {
    return {
      filtered: [],
      peaks: [],
      peakIndices: [],
      heartRate: 0,
      quality: {
        snr: 0,
        stability: 0,
        acceptable: false,
        issues: ['Insufficient data'],
      },
    };
  }

  // Preprocessing
  const detrended = detrend(signal);
  const filtered = bandpassFilter(detrended, 0.7, 4.0, sampleRate);
  const normalized = normalize(filtered);

  // Peak detection
  const minDistance = Math.floor(sampleRate * 0.4); // Min 0.4s between peaks (150 BPM max)
  const peakIndices = detectPeaks(normalized, minDistance, 0.5);

  // Calculate heart rate from peaks
  let heartRate = 0;
  if (peakIndices.length >= 2) {
    const avgInterval = (peakIndices[peakIndices.length - 1] - peakIndices[0]) / (peakIndices.length - 1);
    heartRate = avgInterval > 0 ? Math.round((sampleRate / avgInterval) * 60) : 0;
  }

  // Quality assessment
  const { assessSignalQuality } = require('./signalProcessing');
  const quality = assessSignalQuality(normalized);

  return {
    filtered: normalized,
    peaks: peakIndices.map(i => normalized[i]),
    peakIndices,
    heartRate,
    quality,
  };
}

/**
 * Calculate average heart rate over time window
 */
export function calculateAverageHeartRate(
  measurements: HeartRateMeasurement[],
  windowSeconds: number = 30
): number {
  if (measurements.length === 0) return 0;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Filter measurements within time window
  const recentMeasurements = measurements.filter(
    m => now - m.timestamp.getTime() < windowMs
  );

  if (recentMeasurements.length === 0) return 0;

  // Calculate weighted average (more recent = higher weight)
  let totalWeight = 0;
  let weightedSum = 0;

  recentMeasurements.forEach((m, index) => {
    const weight = (m.confidence / 100) * (index + 1); // Recency + confidence
    weightedSum += m.heartRate * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Detect if heart rate is irregular
 */
export function detectIrregularHeartbeat(
  peakIndices: number[],
  sampleRate: number = 30
): { irregular: boolean; variability: number } {
  if (peakIndices.length < 5) {
    return { irregular: false, variability: 0 };
  }

  // Calculate inter-beat intervals
  const intervals: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    const interval = (peakIndices[i] - peakIndices[i - 1]) / sampleRate;
    intervals.push(interval * 1000); // Convert to ms
  }

  // Calculate coefficient of variation
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? (std / mean) * 100 : 0;

  // CV > 20% suggests irregular heartbeat
  return {
    irregular: cv > 20,
    variability: Math.round(cv),
  };
}

/**
 * Estimate heart rate trend (increasing, stable, decreasing)
 */
export function estimateHeartRateTrend(
  measurements: HeartRateMeasurement[],
  windowSeconds: number = 60
): 'increasing' | 'stable' | 'decreasing' {
  if (measurements.length < 3) return 'stable';

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const recentMeasurements = measurements
    .filter(m => now - m.timestamp.getTime() < windowMs)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (recentMeasurements.length < 3) return 'stable';

  // Simple linear regression
  const n = recentMeasurements.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  recentMeasurements.forEach((m, i) => {
    sumX += i;
    sumY += m.heartRate;
    sumXY += i * m.heartRate;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // Threshold: 0.5 BPM per measurement
  if (slope > 0.5) return 'increasing';
  if (slope < -0.5) return 'decreasing';
  return 'stable';
}
