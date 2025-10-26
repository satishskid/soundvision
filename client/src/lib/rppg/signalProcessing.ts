/**
 * Digital Signal Processing Utilities for rPPG
 * Provides filtering, FFT, peak detection, and signal analysis
 */

/**
 * Apply Fast Fourier Transform (FFT)
 * Simplified implementation for heart rate detection
 */
export function fft(signal: number[]): { frequencies: number[]; magnitudes: number[] } {
  const n = signal.length;
  const frequencies: number[] = [];
  const magnitudes: number[] = [];

  // For each frequency bin
  for (let k = 0; k < n / 2; k++) {
    let real = 0;
    let imag = 0;

    // Calculate DFT for this frequency
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      real += signal[t] * Math.cos(angle);
      imag -= signal[t] * Math.sin(angle);
    }

    frequencies.push(k);
    magnitudes.push(Math.sqrt(real * real + imag * imag));
  }

  return { frequencies, magnitudes };
}

/**
 * Bandpass filter - keeps frequencies within a range
 * Used to isolate heart rate frequencies (0.7-4.0 Hz = 42-240 BPM)
 */
export function bandpassFilter(
  signal: number[],
  lowFreq: number,
  highFreq: number,
  sampleRate: number = 30
): number[] {
  // Simple IIR bandpass filter implementation
  const filtered: number[] = [];
  const alpha = 0.1; // Smoothing factor

  // First pass: high-pass filter (remove low frequencies)
  let prevHigh = signal[0];
  const highPassed: number[] = [];
  for (let i = 0; i < signal.length; i++) {
    const highPass = alpha * (prevHigh + signal[i] - (signal[i - 1] || signal[0]));
    highPassed.push(highPass);
    prevHigh = highPass;
  }

  // Second pass: low-pass filter (remove high frequencies)
  let prevLow = highPassed[0];
  for (let i = 0; i < highPassed.length; i++) {
    const lowPass = alpha * highPassed[i] + (1 - alpha) * prevLow;
    filtered.push(lowPass);
    prevLow = lowPass;
  }

  return filtered;
}

/**
 * Detrend signal - remove slow variations and DC component
 */
export function detrend(signal: number[]): number[] {
  const n = signal.length;
  const mean = signal.reduce((sum, val) => sum + val, 0) / n;

  // Remove mean (DC component)
  const demeaned = signal.map(val => val - mean);

  // Remove linear trend
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += demeaned[i];
    sumXY += i * demeaned[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return demeaned.map((val, i) => val - (slope * i + intercept));
}

/**
 * Normalize signal to 0-1 range
 */
export function normalize(signal: number[]): number[] {
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const range = max - min;

  if (range === 0) return signal.map(() => 0.5);

  return signal.map(val => (val - min) / range);
}

/**
 * Z-score normalization (standardize)
 */
export function standardize(signal: number[]): number[] {
  const n = signal.length;
  const mean = signal.reduce((sum, val) => sum + val, 0) / n;
  const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  if (std === 0) return signal.map(() => 0);

  return signal.map(val => (val - mean) / std);
}

/**
 * Moving average filter for smoothing
 */
export function movingAverage(signal: number[], windowSize: number = 5): number[] {
  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(signal.length, i + halfWindow + 1);
    const window = signal.slice(start, end);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    smoothed.push(avg);
  }

  return smoothed;
}

/**
 * Detect peaks in signal
 * Returns indices of detected peaks
 */
export function detectPeaks(
  signal: number[],
  minDistance: number = 10,
  threshold: number = 0.5
): number[] {
  const peaks: number[] = [];
  const normalized = normalize(signal);

  for (let i = 1; i < signal.length - 1; i++) {
    // Check if this is a local maximum
    if (
      normalized[i] > normalized[i - 1] &&
      normalized[i] > normalized[i + 1] &&
      normalized[i] > threshold
    ) {
      // Check minimum distance from last peak
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}

/**
 * Calculate inter-beat intervals (IBI) from peak indices
 */
export function calculateIBI(peakIndices: number[], sampleRate: number = 30): number[] {
  const ibis: number[] = [];

  for (let i = 1; i < peakIndices.length; i++) {
    const interval = (peakIndices[i] - peakIndices[i - 1]) / sampleRate;
    ibis.push(interval * 1000); // Convert to milliseconds
  }

  return ibis;
}

/**
 * Remove outliers from signal using IQR method
 */
export function removeOutliers(values: number[]): number[] {
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return values.filter(val => val >= lowerBound && val <= upperBound);
}

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 */
export function calculateSNR(signal: number[]): number {
  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const signalPower = signal.reduce((sum, val) => sum + Math.pow(val, 2), 0) / signal.length;
  const noisePower = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;

  if (noisePower === 0) return Infinity;

  return 10 * Math.log10(signalPower / noisePower);
}

/**
 * Calculate signal quality metrics
 */
export function assessSignalQuality(signal: number[]): {
  snr: number;
  stability: number;
  acceptable: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Calculate SNR
  const snr = calculateSNR(signal);

  // Calculate stability (coefficient of variation)
  const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
  const std = Math.sqrt(
    signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length
  );
  const cv = mean !== 0 ? std / Math.abs(mean) : 1;
  const stability = Math.max(0, Math.min(100, 100 * (1 - cv)));

  // Check quality thresholds
  if (snr < 5) {
    issues.push('Low signal quality - improve lighting');
  }

  if (stability < 50) {
    issues.push('Unstable signal - stay still');
  }

  const acceptable = snr >= 5 && stability >= 50;

  return {
    snr,
    stability,
    acceptable,
    issues,
  };
}

/**
 * Interpolate signal to target length
 */
export function interpolate(signal: number[], targetLength: number): number[] {
  if (signal.length === targetLength) return signal;

  const interpolated: number[] = [];
  const ratio = (signal.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const index = i * ratio;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const fraction = index - lowerIndex;

    if (upperIndex >= signal.length) {
      interpolated.push(signal[signal.length - 1]);
    } else {
      const interpolatedValue =
        signal[lowerIndex] * (1 - fraction) + signal[upperIndex] * fraction;
      interpolated.push(interpolatedValue);
    }
  }

  return interpolated;
}

/**
 * Calculate dominant frequency using FFT
 */
export function findDominantFrequency(
  signal: number[],
  sampleRate: number = 30,
  minFreq: number = 0.7,
  maxFreq: number = 4.0
): { frequency: number; magnitude: number; confidence: number } {
  const { frequencies, magnitudes } = fft(signal);

  let maxMagnitude = 0;
  let dominantFreq = 0;

  // Convert frequency bins to Hz
  for (let i = 0; i < frequencies.length; i++) {
    const freq = (frequencies[i] * sampleRate) / signal.length;

    // Only consider frequencies in valid heart rate range
    if (freq >= minFreq && freq <= maxFreq) {
      if (magnitudes[i] > maxMagnitude) {
        maxMagnitude = magnitudes[i];
        dominantFreq = freq;
      }
    }
  }

  // Calculate confidence based on peak prominence
  const avgMagnitude = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
  const confidence = Math.min(100, (maxMagnitude / avgMagnitude) * 10);

  return {
    frequency: dominantFreq,
    magnitude: maxMagnitude,
    confidence,
  };
}

/**
 * Welch's method for power spectral density estimation
 * More robust than simple FFT for noisy signals
 */
export function welchPSD(
  signal: number[],
  windowSize: number = 256,
  overlap: number = 128
): { frequencies: number[]; psd: number[] } {
  const windows: number[][] = [];
  const step = windowSize - overlap;

  // Create overlapping windows
  for (let i = 0; i + windowSize <= signal.length; i += step) {
    windows.push(signal.slice(i, i + windowSize));
  }

  if (windows.length === 0) {
    return { frequencies: [], psd: [] };
  }

  // Apply Hanning window and FFT to each segment
  const allPSD: number[][] = [];

  for (const window of windows) {
    // Apply Hanning window
    const windowed = window.map((val, i) => {
      const hanning = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (window.length - 1)));
      return val * hanning;
    });

    // Compute FFT
    const { magnitudes } = fft(windowed);
    allPSD.push(magnitudes);
  }

  // Average PSDs
  const avgPSD: number[] = [];
  for (let i = 0; i < allPSD[0].length; i++) {
    const sum = allPSD.reduce((acc, psd) => acc + psd[i], 0);
    avgPSD.push(sum / allPSD.length);
  }

  const frequencies = Array.from({ length: avgPSD.length }, (_, i) => i);

  return { frequencies, psd: avgPSD };
}
