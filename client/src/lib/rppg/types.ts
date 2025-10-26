/**
 * rPPG (remote Photoplethysmography) Type Definitions
 * Advanced cardiovascular monitoring using camera
 */

export interface VitalSignsSession {
  id: string;
  userId: string;
  sessionDate: Date;
  duration: number; // seconds
  signalQuality: number; // 0-100
  notes?: string;
}

export interface HeartRateMeasurement {
  heartRate: number; // BPM
  confidence: number; // 0-100
  timestamp: Date;
  waveform?: number[]; // Optional waveform data
}

export interface HRVMeasurement {
  sdnn: number; // Standard Deviation of NN intervals (ms)
  rmssd: number; // Root Mean Square of Successive Differences (ms)
  pnn50: number; // Percentage of NN intervals > 50ms different
  stressLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface SpO2Measurement {
  spo2: number; // Blood oxygen percentage (90-100%)
  confidence: number; // 0-100
  timestamp: Date;
}

export interface BloodPressureMeasurement {
  systolic: number; // mmHg
  diastolic: number; // mmHg
  confidence: number; // 0-100
  calibrated: boolean;
  timestamp: Date;
}

export interface RespiratoryRateMeasurement {
  respiratoryRate: number; // Breaths per minute
  pattern: 'regular' | 'irregular';
  timestamp: Date;
}

export interface VitalSignsResult {
  heartRate: HeartRateMeasurement;
  hrv: HRVMeasurement;
  spo2: SpO2Measurement;
  bloodPressure: BloodPressureMeasurement;
  respiratoryRate: RespiratoryRateMeasurement;
  overallQuality: number; // 0-100
  healthScore: number; // 0-100
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignalQuality {
  snr: number; // Signal-to-noise ratio
  stability: number; // 0-100
  acceptable: boolean;
  issues: string[];
}

export interface PPGSignal {
  red: number[];
  green: number[];
  blue: number[];
  timestamps: number[];
}

export interface ProcessedSignal {
  filtered: number[];
  peaks: number[];
  peakIndices: number[];
  heartRate: number;
  quality: SignalQuality;
}

export interface CalibrationData {
  userId: string;
  systolicReference: number;
  diastolicReference: number;
  calibrationDate: Date;
  deviceUsed: string;
}
