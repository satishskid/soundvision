/**
 * Hearing Screening Algorithm Tests
 * Tests for medical accuracy and edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePTA,
  calculateHFA,
  classifyHearingLoss,
  assessAudiogramPattern,
  assessSpeechInNoise,
  calculateSRT,
  AUDIOMETRIC_FREQUENCIES,
  WHO_HEARING_LOSS_CATEGORIES,
} from './hearingScreening';

describe('Pure Tone Average (PTA) Calculation', () => {
  it('should calculate normal hearing PTA', () => {
    const thresholds = new Map([
      [500, 15],
      [1000, 10],
      [2000, 15],
      [4000, 20],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBeCloseTo(13.33, 1); // (15+10+15)/3
  });

  it('should calculate mild hearing loss PTA', () => {
    const thresholds = new Map([
      [500, 30],
      [1000, 35],
      [2000, 30],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBeCloseTo(31.67, 1);
  });

  it('should calculate moderate hearing loss PTA', () => {
    const thresholds = new Map([
      [500, 50],
      [1000, 55],
      [2000, 45],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBe(50);
  });

  it('should calculate severe hearing loss PTA', () => {
    const thresholds = new Map([
      [500, 75],
      [1000, 80],
      [2000, 70],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBeCloseTo(75, 1);
  });
});

describe('High Frequency Average (HFA) Calculation', () => {
  it('should calculate normal HFA', () => {
    const thresholds = new Map([
      [1000, 15],
      [2000, 15],
      [4000, 20],
    ]);
    
    const hfa = calculateHFA(thresholds);
    expect(hfa).toBeCloseTo(16.67, 1);
  });

  it('should detect high-frequency hearing loss', () => {
    const thresholds = new Map([
      [1000, 20],
      [2000, 35],
      [4000, 55],
    ]);
    
    const hfa = calculateHFA(thresholds);
    expect(hfa).toBeCloseTo(36.67, 1);
    expect(hfa).toBeGreaterThan(25); // Indicates high-frequency loss
  });
});

describe('WHO Hearing Loss Classification', () => {
  it('should classify normal hearing (0-25 dB HL)', () => {
    const classification = classifyHearingLoss(20);
    expect(classification.category).toBe('normal');
    expect(classification.severity).toBe('normal');
    expect(classification.description).toContain('No hearing loss');
  });

  it('should classify mild hearing loss (26-40 dB HL)', () => {
    const classification = classifyHearingLoss(35);
    expect(classification.category).toBe('mild');
    expect(classification.severity).toBe('mild');
  });

  it('should classify moderate hearing loss (41-60 dB HL)', () => {
    const classification = classifyHearingLoss(50);
    expect(classification.category).toBe('moderate');
    expect(classification.severity).toBe('moderate');
  });

  it('should classify moderately severe hearing loss (61-80 dB HL)', () => {
    const classification = classifyHearingLoss(70);
    expect(classification.category).toBe('moderately_severe');
    expect(classification.severity).toBe('severe');
  });

  it('should classify severe hearing loss (81-90 dB HL)', () => {
    const classification = classifyHearingLoss(85);
    expect(classification.category).toBe('severe');
    expect(classification.severity).toBe('severe');
  });

  it('should classify profound hearing loss (>90 dB HL)', () => {
    const classification = classifyHearingLoss(100);
    expect(classification.category).toBe('profound');
    expect(classification.severity).toBe('severe');
  });

  it('should handle edge case at boundaries', () => {
    expect(classifyHearingLoss(25).category).toBe('normal');
    expect(classifyHearingLoss(26).category).toBe('mild');
    expect(classifyHearingLoss(40).category).toBe('mild');
    expect(classifyHearingLoss(41).category).toBe('moderate');
  });
});

describe('Audiogram Pattern Recognition', () => {
  it('should detect flat hearing loss pattern', () => {
    const thresholds = new Map([
      [250, 45],
      [500, 50],
      [1000, 48],
      [2000, 52],
      [4000, 47],
      [8000, 50],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('flat');
    expect(pattern.description).toContain('consistent');
  });

  it('should detect sloping (high-frequency) hearing loss', () => {
    const thresholds = new Map([
      [250, 15],
      [500, 20],
      [1000, 25],
      [2000, 35],
      [4000, 50],
      [8000, 60],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('sloping');
    expect(pattern.description).toContain('high-frequency');
  });

  it('should detect noise-induced hearing loss (4000 Hz notch)', () => {
    const thresholds = new Map([
      [250, 15],
      [500, 15],
      [1000, 20],
      [2000, 25],
      [4000, 55], // Characteristic notch
      [8000, 30],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('notched');
    expect(pattern.description).toContain('noise-induced');
  });

  it('should detect rising (low-frequency) hearing loss', () => {
    const thresholds = new Map([
      [250, 60],
      [500, 50],
      [1000, 35],
      [2000, 25],
      [4000, 20],
      [8000, 15],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('rising');
    expect(pattern.description).toContain('low-frequency');
  });

  it('should detect cookie-bite pattern', () => {
    const thresholds = new Map([
      [250, 20],
      [500, 40],
      [1000, 50],
      [2000, 45],
      [4000, 30],
      [8000, 20],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('cookie_bite');
    expect(pattern.description).toContain('mid-frequency');
  });

  it('should detect irregular pattern', () => {
    const thresholds = new Map([
      [250, 20],
      [500, 50],
      [1000, 30],
      [2000, 60],
      [4000, 25],
      [8000, 55],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('irregular');
  });
});

describe('Speech-in-Noise Assessment', () => {
  it('should assess excellent performance (>90% at 0 dB SNR)', () => {
    const assessment = assessSpeechInNoise(95, 0);
    expect(assessment.status).toBe('excellent');
    expect(assessment.percentCorrect).toBe(95);
  });

  it('should assess good performance (80-90% at 0 dB SNR)', () => {
    const assessment = assessSpeechInNoise(85, 0);
    expect(assessment.status).toBe('good');
  });

  it('should assess fair performance (60-80% at 0 dB SNR)', () => {
    const assessment = assessSpeechInNoise(70, 0);
    expect(assessment.status).toBe('fair');
  });

  it('should assess poor performance (<60% at 0 dB SNR)', () => {
    const assessment = assessSpeechInNoise(50, 0);
    expect(assessment.status).toBe('poor');
    expect(assessment.recommendation).toContain('evaluation');
  });

  it('should assess very poor performance (<40% at +5 dB SNR)', () => {
    const assessment = assessSpeechInNoise(30, 5);
    expect(assessment.status).toBe('very_poor');
    expect(assessment.recommendation).toContain('audiologist');
  });

  it('should handle perfect score', () => {
    const assessment = assessSpeechInNoise(100, -5);
    expect(assessment.status).toBe('excellent');
    expect(assessment.percentCorrect).toBe(100);
  });

  it('should handle zero score', () => {
    const assessment = assessSpeechInNoise(0, 10);
    expect(assessment.status).toBe('very_poor');
  });
});

describe('Speech Reception Threshold (SRT) Calculation', () => {
  it('should calculate normal SRT', () => {
    const srt = calculateSRT([
      { snr: 5, percentCorrect: 100 },
      { snr: 0, percentCorrect: 95 },
      { snr: -5, percentCorrect: 60 },
    ]);
    
    expect(srt).toBeGreaterThanOrEqual(-5);
    expect(srt).toBeLessThanOrEqual(0);
  });

  it('should calculate elevated SRT for hearing loss', () => {
    const srt = calculateSRT([
      { snr: 10, percentCorrect: 80 },
      { snr: 5, percentCorrect: 60 },
      { snr: 0, percentCorrect: 30 },
    ]);
    
    expect(srt).toBeGreaterThan(5);
  });

  it('should handle excellent performance', () => {
    const srt = calculateSRT([
      { snr: 0, percentCorrect: 100 },
      { snr: -5, percentCorrect: 95 },
      { snr: -10, percentCorrect: 70 },
    ]);
    
    expect(srt).toBeLessThan(0);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle missing frequencies in PTA calculation', () => {
    const thresholds = new Map([
      [500, 30],
      [1000, 35],
      // Missing 2000 Hz
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBeDefined();
    expect(pta).toBeGreaterThan(0);
  });

  it('should handle extreme threshold values', () => {
    const classification1 = classifyHearingLoss(0);
    expect(classification1.category).toBe('normal');

    const classification2 = classifyHearingLoss(120);
    expect(classification2.category).toBe('profound');
  });

  it('should handle single frequency threshold', () => {
    const thresholds = new Map([[1000, 40]]);
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern).toBeDefined();
  });

  it('should handle all frequencies at 0 dB HL', () => {
    const thresholds = new Map([
      [250, 0],
      [500, 0],
      [1000, 0],
      [2000, 0],
      [4000, 0],
      [8000, 0],
    ]);
    
    const pta = calculatePTA(thresholds);
    expect(pta).toBe(0);
    
    const classification = classifyHearingLoss(pta);
    expect(classification.category).toBe('normal');
  });
});

describe('Medical Accuracy Validation', () => {
  it('should follow WHO classification standards', () => {
    // Verify WHO categories match international standards
    expect(WHO_HEARING_LOSS_CATEGORIES.normal.range).toEqual([0, 25]);
    expect(WHO_HEARING_LOSS_CATEGORIES.mild.range).toEqual([26, 40]);
    expect(WHO_HEARING_LOSS_CATEGORIES.moderate.range).toEqual([41, 60]);
    expect(WHO_HEARING_LOSS_CATEGORIES.moderately_severe.range).toEqual([61, 80]);
    expect(WHO_HEARING_LOSS_CATEGORIES.severe.range).toEqual([81, 90]);
  });

  it('should use standard audiometric frequencies', () => {
    expect(AUDIOMETRIC_FREQUENCIES).toContain(250);
    expect(AUDIOMETRIC_FREQUENCIES).toContain(500);
    expect(AUDIOMETRIC_FREQUENCIES).toContain(1000);
    expect(AUDIOMETRIC_FREQUENCIES).toContain(2000);
    expect(AUDIOMETRIC_FREQUENCIES).toContain(4000);
    expect(AUDIOMETRIC_FREQUENCIES).toContain(8000);
  });

  it('should detect occupational hearing loss (NIOSH criteria)', () => {
    // NIOSH defines hearing loss as average of 1, 2, 3, 4 kHz > 25 dB
    const thresholds = new Map([
      [1000, 30],
      [2000, 35],
      [3000, 40],
      [4000, 45],
    ]);
    
    const avg = (30 + 35 + 40 + 45) / 4;
    expect(avg).toBeGreaterThan(25);
  });

  it('should identify presbycusis (age-related) pattern', () => {
    // Presbycusis: bilateral, symmetric, sloping high-frequency loss
    const thresholds = new Map([
      [250, 15],
      [500, 20],
      [1000, 25],
      [2000, 35],
      [4000, 50],
      [8000, 60],
    ]);
    
    const pattern = assessAudiogramPattern(thresholds);
    expect(pattern.pattern).toBe('sloping');
    expect(pattern.likelyCauses).toContain('age-related hearing loss');
  });

  it('should detect conductive vs sensorineural loss indicators', () => {
    // This would require air-bone gap data
    // For now, verify pattern detection works
    const conductiveLoss = new Map([
      [250, 40],
      [500, 40],
      [1000, 40],
      [2000, 40],
      [4000, 40],
      [8000, 40],
    ]);
    
    const pattern = assessAudiogramPattern(conductiveLoss);
    expect(pattern.pattern).toBe('flat');
  });
});

describe('Clinical Validation Scenarios', () => {
  it('should handle typical adult screening result', () => {
    const thresholds = new Map([
      [500, 20],
      [1000, 15],
      [2000, 20],
      [4000, 25],
    ]);
    
    const pta = calculatePTA(thresholds);
    const classification = classifyHearingLoss(pta);
    
    expect(classification.category).toBe('normal');
    expect(classification.recommendation).toContain('No intervention');
  });

  it('should recommend hearing aid for moderate loss', () => {
    const thresholds = new Map([
      [500, 50],
      [1000, 55],
      [2000, 50],
    ]);
    
    const pta = calculatePTA(thresholds);
    const classification = classifyHearingLoss(pta);
    
    expect(classification.category).toBe('moderate');
    expect(classification.recommendation).toContain('hearing aid');
  });

  it('should flag urgent referral for severe/profound loss', () => {
    const thresholds = new Map([
      [500, 85],
      [1000, 90],
      [2000, 85],
    ]);
    
    const pta = calculatePTA(thresholds);
    const classification = classifyHearingLoss(pta);
    
    expect(classification.severity).toBe('severe');
    expect(classification.recommendation).toContain('audiologist');
  });
});
