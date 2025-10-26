/**
 * Hearing Screening Algorithms
 * Implements pure tone audiometry and speech-in-noise testing logic
 */

// Standard audiometric frequencies (Hz)
export const AUDIOMETRIC_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000] as const;
export type Frequency = typeof AUDIOMETRIC_FREQUENCIES[number];

// Hearing threshold levels (dB HL)
export const THRESHOLD_LEVELS = [
  -10, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
] as const;

// Hearing loss classification (WHO standards)
export const HEARING_LOSS_CATEGORIES = {
  normal: { min: -10, max: 25, label: 'Normal Hearing' },
  slight: { min: 26, max: 40, label: 'Slight Hearing Loss' },
  moderate: { min: 41, max: 60, label: 'Moderate Hearing Loss' },
  severe: { min: 61, max: 80, label: 'Severe Hearing Loss' },
  profound: { min: 81, max: 120, label: 'Profound Hearing Loss' },
} as const;

/**
 * Calculate Pure Tone Average (PTA)
 * Average of thresholds at 500, 1000, and 2000 Hz
 */
export function calculatePTA(thresholds: Map<Frequency, number>): number {
  const frequencies: Frequency[] = [500, 1000, 2000];
  const values = frequencies
    .map(f => thresholds.get(f))
    .filter((v): v is number => v !== undefined);
  
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate High Frequency Average (HFA)
 * Average of thresholds at 2000, 4000, and 8000 Hz
 */
export function calculateHFA(thresholds: Map<Frequency, number>): number {
  const frequencies: Frequency[] = [2000, 4000, 8000];
  const values = frequencies
    .map(f => thresholds.get(f))
    .filter((v): v is number => v !== undefined);
  
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Classify hearing loss based on PTA
 */
export function classifyHearingLoss(pta: number): {
  category: keyof typeof HEARING_LOSS_CATEGORIES;
  label: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'profound';
} {
  for (const [category, range] of Object.entries(HEARING_LOSS_CATEGORIES)) {
    if (pta >= range.min && pta <= range.max) {
      const severity = category === 'normal' ? 'normal' :
                      category === 'slight' ? 'mild' :
                      category as 'moderate' | 'severe' | 'profound';
      
      return {
        category: category as keyof typeof HEARING_LOSS_CATEGORIES,
        label: range.label,
        severity,
      };
    }
  }
  
  return {
    category: 'profound',
    label: 'Profound Hearing Loss',
    severity: 'profound',
  };
}

/**
 * Assess audiogram pattern
 */
export function assessAudiogramPattern(
  thresholds: Map<Frequency, number>
): {
  pattern: 'flat' | 'sloping' | 'rising' | 'notched' | 'cookie_bite' | 'irregular';
  description: string;
} {
  const freqArray = Array.from(AUDIOMETRIC_FREQUENCIES);
  const thresholdArray = freqArray.map(f => thresholds.get(f) || 0);
  
  // Calculate slope between low and high frequencies
  const lowFreqAvg = (thresholdArray[0] + thresholdArray[1]) / 2;
  const highFreqAvg = (thresholdArray[4] + thresholdArray[5]) / 2;
  const slope = highFreqAvg - lowFreqAvg;
  
  // Check for notch at 4000 Hz (noise-induced hearing loss)
  const threshold4k = thresholds.get(4000) || 0;
  const threshold2k = thresholds.get(2000) || 0;
  const threshold8k = thresholds.get(8000) || 0;
  const notchDepth = threshold4k - ((threshold2k + threshold8k) / 2);
  
  // Check for cookie bite (mid-frequency loss)
  const midFreqAvg = (thresholdArray[2] + thresholdArray[3]) / 2;
  const edgeFreqAvg = (lowFreqAvg + highFreqAvg) / 2;
  const cookieBite = midFreqAvg - edgeFreqAvg;
  
  if (notchDepth > 10) {
    return {
      pattern: 'notched',
      description: 'Notched audiogram with loss at 4000 Hz, typical of noise-induced hearing loss',
    };
  } else if (cookieBite > 15) {
    return {
      pattern: 'cookie_bite',
      description: 'Mid-frequency hearing loss (cookie bite pattern), may indicate genetic hearing loss',
    };
  } else if (slope > 20) {
    return {
      pattern: 'sloping',
      description: 'High-frequency hearing loss (sloping pattern), common with age-related hearing loss',
    };
  } else if (slope < -20) {
    return {
      pattern: 'rising',
      description: 'Low-frequency hearing loss (rising pattern), less common configuration',
    };
  } else if (Math.abs(slope) < 10) {
    return {
      pattern: 'flat',
      description: 'Flat audiogram with similar thresholds across frequencies',
    };
  } else {
    return {
      pattern: 'irregular',
      description: 'Irregular audiogram pattern',
    };
  }
}

/**
 * Pure Tone Audiometry Test Algorithm
 * Modified Hughson-Westlake procedure
 */
export class PureToneTest {
  private currentLevel: number = 40; // Start at 40 dB HL
  private responses: boolean[] = [];
  private ascending: boolean = true;
  
  constructor(
    public frequency: Frequency,
    public ear: 'left' | 'right'
  ) {}
  
  /**
   * Present tone and record response
   */
  presentTone(heard: boolean): void {
    this.responses.push(heard);
    
    if (this.ascending) {
      if (heard) {
        // Heard at this level, go down
        this.ascending = false;
        this.currentLevel -= 10;
      } else {
        // Not heard, go up
        this.currentLevel += 5;
      }
    } else {
      if (!heard) {
        // Didn't hear, go up
        this.ascending = true;
        this.currentLevel += 5;
      } else {
        // Still hearing, go down
        this.currentLevel -= 10;
      }
    }
  }
  
  /**
   * Get current test level
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }
  
  /**
   * Determine if threshold is found
   * Threshold = lowest level where tone is heard at least 50% of the time
   */
  isThresholdFound(): boolean {
    if (this.responses.length < 6) return false;
    
    // Check last 3 ascending presentations
    const recentAscending = this.responses.slice(-6).filter((_, i) => i % 2 === 0);
    const heardCount = recentAscending.filter(r => r).length;
    
    return heardCount >= 2; // At least 2 out of 3
  }
  
  /**
   * Get final threshold
   */
  getThreshold(): number {
    return this.currentLevel;
  }
}

/**
 * Speech-in-Noise Testing
 */

export interface SpeechInNoiseTest {
  type: 'quick_sin' | 'azbio' | 'hint' | 'custom';
  snr: number; // Signal-to-Noise Ratio in dB
  words: string[];
  correctCount: number;
  totalCount: number;
}

/**
 * Calculate Speech Reception Threshold (SRT)
 */
export function calculateSRT(
  results: Array<{ snr: number; percentCorrect: number }>
): number {
  // Find SNR where 50% correct
  results.sort((a, b) => a.snr - b.snr);
  
  for (let i = 0; i < results.length - 1; i++) {
    const current = results[i];
    const next = results[i + 1];
    
    if (current.percentCorrect <= 50 && next.percentCorrect >= 50) {
      // Interpolate
      const range = next.snr - current.snr;
      const percentRange = next.percentCorrect - current.percentCorrect;
      const targetPercent = 50 - current.percentCorrect;
      const interpolated = current.snr + (targetPercent / percentRange) * range;
      return interpolated;
    }
  }
  
  // If not found, return best or worst SNR
  return results[results.length - 1].percentCorrect >= 50 
    ? results[results.length - 1].snr 
    : results[0].snr;
}

/**
 * Assess speech-in-noise performance
 */
export function assessSpeechInNoise(
  percentCorrect: number,
  snr: number
): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  recommendation: string;
} {
  // Normalize based on SNR
  // At +5 dB SNR, 80%+ is good
  // At 0 dB SNR, 60%+ is good
  // At -5 dB SNR, 40%+ is good
  
  const expectedPercent = 80 - (5 - snr) * 4; // Rough approximation
  const performance = (percentCorrect / expectedPercent) * 100;
  
  if (performance >= 100) {
    return {
      status: 'excellent',
      recommendation: 'Excellent speech understanding in noise. No concerns.',
    };
  } else if (performance >= 80) {
    return {
      status: 'good',
      recommendation: 'Good speech understanding in noise. Within normal limits.',
    };
  } else if (performance >= 60) {
    return {
      status: 'fair',
      recommendation: 'Fair speech understanding in noise. May have difficulty in noisy environments. Consider comprehensive hearing evaluation.',
    };
  } else if (performance >= 40) {
    return {
      status: 'poor',
      recommendation: 'Poor speech understanding in noise. Likely to have significant difficulty in noisy environments. Comprehensive hearing evaluation recommended.',
    };
  } else {
    return {
      status: 'very_poor',
      recommendation: 'Very poor speech understanding in noise. Significant communication difficulties expected. Urgent comprehensive hearing evaluation recommended.',
    };
  }
}

/**
 * Generate speech-in-noise word list
 */
export const SPEECH_WORD_LISTS = {
  monosyllables: [
    'cat', 'dog', 'hat', 'pen', 'cup', 'book', 'shoe', 'key', 'car', 'tree',
    'fish', 'bird', 'hand', 'foot', 'door', 'ball', 'cake', 'milk', 'rain', 'snow'
  ],
  spondees: [
    'baseball', 'hotdog', 'airplane', 'birthday', 'cowboy', 'doorbell',
    'football', 'greenhouse', 'hardware', 'icecream', 'mushroom', 'northwest',
    'oatmeal', 'pancake', 'railroad', 'sidewalk', 'toothbrush', 'whitewash'
  ],
  sentences: [
    'The boy ran down the street',
    'She wore a pretty blue dress',
    'The dog chased the cat',
    'We went to the store today',
    'The sun is shining bright',
  ],
} as const;

/**
 * Generate random word list for testing
 */
export function generateWordList(
  type: keyof typeof SPEECH_WORD_LISTS,
  count: number
): string[] {
  const words = [...SPEECH_WORD_LISTS[type]];
  const selected: string[] = [];
  
  for (let i = 0; i < count && words.length > 0; i++) {
    const index = Math.floor(Math.random() * words.length);
    selected.push(words[index]);
    words.splice(index, 1);
  }
  
  return selected;
}

/**
 * Assess overall hearing screening results
 */
export function assessHearingScreening(
  leftEarPTA: number,
  rightEarPTA: number,
  speechInNoisePercent: number,
  ageGroup: string
): {
  status: 'pass' | 'refer' | 'inconclusive';
  recommendation: string;
  concerns: string[];
  leftEarStatus: string;
  rightEarStatus: string;
} {
  const concerns: string[] = [];
  let status: 'pass' | 'refer' | 'inconclusive' = 'pass';
  
  const leftClassification = classifyHearingLoss(leftEarPTA);
  const rightClassification = classifyHearingLoss(rightEarPTA);
  
  // Check pure tone averages
  if (leftEarPTA > 25 || rightEarPTA > 25) {
    concerns.push('Hearing thresholds exceed normal limits');
    status = 'refer';
  }
  
  // Check asymmetry
  const asymmetry = Math.abs(leftEarPTA - rightEarPTA);
  if (asymmetry > 15) {
    concerns.push('Significant asymmetry between ears detected');
    status = 'refer';
  }
  
  // Check speech-in-noise
  if (speechInNoisePercent < 60) {
    concerns.push('Difficulty understanding speech in noise');
    if (status !== 'refer') status = 'refer';
  }
  
  // Age-specific considerations
  if (ageGroup === '0-2' || ageGroup === '3-5') {
    if (leftEarPTA > 20 || rightEarPTA > 20) {
      concerns.push('Even mild hearing loss in children can affect speech and language development');
      status = 'refer';
    }
  }
  
  let recommendation = '';
  if (status === 'pass') {
    recommendation = 'Hearing screening results are within normal limits. Continue regular hearing screenings as recommended for age.';
  } else if (status === 'refer') {
    recommendation = 'Hearing screening indicates potential concerns. Comprehensive audiological evaluation by an audiologist is recommended.';
  } else {
    recommendation = 'Hearing screening results are inconclusive. Repeat screening or professional evaluation recommended.';
  }
  
  return {
    status,
    recommendation,
    concerns,
    leftEarStatus: leftClassification.label,
    rightEarStatus: rightClassification.label,
  };
}

/**
 * Tympanometry simulation (middle ear function)
 */
export interface TympanometryResult {
  peakPressure: number; // daPa
  compliance: number; // ml
  earCanalVolume: number; // ml
  type: 'A' | 'As' | 'Ad' | 'B' | 'C';
}

export function assessTympanometry(result: TympanometryResult): {
  status: 'normal' | 'abnormal';
  interpretation: string;
} {
  switch (result.type) {
    case 'A':
      return {
        status: 'normal',
        interpretation: 'Normal middle ear function. Peak pressure and compliance within normal limits.',
      };
    case 'As':
      return {
        status: 'abnormal',
        interpretation: 'Reduced compliance (stiff system). May indicate otosclerosis or ossicular fixation.',
      };
    case 'Ad':
      return {
        status: 'abnormal',
        interpretation: 'Increased compliance (hypermobile system). May indicate ossicular discontinuity.',
      };
    case 'B':
      return {
        status: 'abnormal',
        interpretation: 'Flat tympanogram. May indicate middle ear fluid or tympanic membrane perforation.',
      };
    case 'C':
      return {
        status: 'abnormal',
        interpretation: 'Negative pressure. May indicate Eustachian tube dysfunction.',
      };
  }
}

/**
 * Otoacoustic Emissions (OAE) simulation
 */
export interface OAEResult {
  frequency: Frequency;
  snr: number; // Signal-to-Noise Ratio in dB
  present: boolean;
}

export function assessOAE(results: OAEResult[]): {
  status: 'pass' | 'refer';
  interpretation: string;
} {
  const passCount = results.filter(r => r.present && r.snr >= 6).length;
  const passRate = passCount / results.length;
  
  if (passRate >= 0.8) {
    return {
      status: 'pass',
      interpretation: 'OAEs present at most frequencies. Cochlear function appears normal.',
    };
  } else {
    return {
      status: 'refer',
      interpretation: 'OAEs absent or weak at multiple frequencies. May indicate cochlear dysfunction. Comprehensive audiological evaluation recommended.',
    };
  }
}

/**
 * Calculate hearing age based on audiogram
 */
export function calculateHearingAge(pta: number, chronologicalAge: number): number {
  // Presbycusis (age-related hearing loss) progression
  // Approximately 0.5-1 dB per year after age 60
  const expectedPTA = chronologicalAge > 60 ? (chronologicalAge - 60) * 0.75 : 0;
  const excessLoss = pta - expectedPTA;
  
  if (excessLoss <= 0) return chronologicalAge;
  
  // Each 0.75 dB of excess loss = 1 year of hearing age
  const additionalYears = excessLoss / 0.75;
  return chronologicalAge + additionalYears;
}

/**
 * Noise exposure risk assessment
 */
export function assessNoiseExposure(
  exposureLevel: number, // dB SPL
  exposureDuration: number // hours per day
): {
  risk: 'safe' | 'caution' | 'hazardous' | 'dangerous';
  recommendation: string;
  maxSafeTime: number; // hours
} {
  // OSHA/NIOSH standards
  // 85 dB = 8 hours safe
  // Every 3 dB increase = half the safe time
  
  const referenceLevel = 85;
  const referenceDuration = 8;
  
  const levelDifference = exposureLevel - referenceLevel;
  const maxSafeTime = referenceDuration / Math.pow(2, levelDifference / 3);
  
  let risk: 'safe' | 'caution' | 'hazardous' | 'dangerous';
  let recommendation: string;
  
  if (exposureDuration <= maxSafeTime) {
    risk = 'safe';
    recommendation = 'Current noise exposure is within safe limits.';
  } else if (exposureDuration <= maxSafeTime * 1.5) {
    risk = 'caution';
    recommendation = 'Noise exposure is approaching hazardous levels. Consider hearing protection.';
  } else if (exposureDuration <= maxSafeTime * 2) {
    risk = 'hazardous';
    recommendation = 'Noise exposure is hazardous. Hearing protection strongly recommended.';
  } else {
    risk = 'dangerous';
    recommendation = 'Noise exposure is dangerous. Immediate hearing protection required. Risk of permanent hearing damage.';
  }
  
  return { risk, recommendation, maxSafeTime };
}
