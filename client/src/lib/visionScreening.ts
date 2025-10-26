/**
 * Vision Screening Algorithms
 * Implements photoscreening and visual acuity testing logic
 */

// Visual Acuity Standards (Snellen Chart)
export const SNELLEN_CHART = {
  '20/200': { decimal: 0.1, logMAR: 1.0, size: 200 },
  '20/100': { decimal: 0.2, logMAR: 0.7, size: 100 },
  '20/70': { decimal: 0.29, logMAR: 0.54, size: 70 },
  '20/50': { decimal: 0.4, logMAR: 0.4, size: 50 },
  '20/40': { decimal: 0.5, logMAR: 0.3, size: 40 },
  '20/30': { decimal: 0.67, logMAR: 0.18, size: 30 },
  '20/25': { decimal: 0.8, logMAR: 0.1, size: 25 },
  '20/20': { decimal: 1.0, logMAR: 0.0, size: 20 },
  '20/15': { decimal: 1.33, logMAR: -0.12, size: 15 },
  '20/10': { decimal: 2.0, logMAR: -0.3, size: 10 },
} as const;

export type SnellenRating = keyof typeof SNELLEN_CHART;

// Age-specific visual acuity norms
export const AGE_NORMS = {
  '0-2': { minAcceptable: '20/200', typical: '20/100' },
  '3-5': { minAcceptable: '20/40', typical: '20/30' },
  '6-12': { minAcceptable: '20/30', typical: '20/20' },
  '13-18': { minAcceptable: '20/25', typical: '20/20' },
  '18+': { minAcceptable: '20/25', typical: '20/20' },
} as const;

export type AgeGroup = keyof typeof AGE_NORMS;

// Optotype types for different age groups
export const OPTOTYPES = {
  snellen: ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'P', 'E', 'D'],
  tumbling_e: ['E↑', 'E→', 'E↓', 'E←'],
  lea_symbols: ['🍎', '🏠', '⭕', '◻️'],
  picture_matching: ['🐱', '🐶', '🐦', '🐟', '🦋'],
} as const;

/**
 * Calculate visual acuity score based on correct responses
 */
export function calculateVisualAcuity(
  correctCount: number,
  totalCount: number,
  startingSize: SnellenRating
): {
  acuity: SnellenRating;
  decimal: number;
  logMAR: number;
  percentCorrect: number;
} {
  const percentCorrect = (correctCount / totalCount) * 100;
  const startingDecimal = SNELLEN_CHART[startingSize].decimal;
  
  // Adjust acuity based on performance
  let adjustedDecimal = startingDecimal;
  
  if (percentCorrect >= 80) {
    // Good performance - can see this size
    adjustedDecimal = startingDecimal;
  } else if (percentCorrect >= 60) {
    // Moderate performance - slightly worse
    adjustedDecimal = startingDecimal * 0.8;
  } else if (percentCorrect >= 40) {
    // Poor performance - significantly worse
    adjustedDecimal = startingDecimal * 0.6;
  } else {
    // Very poor performance
    adjustedDecimal = startingDecimal * 0.4;
  }

  // Find closest Snellen rating
  const acuity = findClosestSnellenRating(adjustedDecimal);
  const { decimal, logMAR } = SNELLEN_CHART[acuity];

  return { acuity, decimal, logMAR, percentCorrect };
}

/**
 * Find the closest Snellen rating for a given decimal acuity
 */
function findClosestSnellenRating(decimal: number): SnellenRating {
  let closest: SnellenRating = '20/200';
  let minDiff = Infinity;

  for (const [rating, values] of Object.entries(SNELLEN_CHART)) {
    const diff = Math.abs(values.decimal - decimal);
    if (diff < minDiff) {
      minDiff = diff;
      closest = rating as SnellenRating;
    }
  }

  return closest;
}

/**
 * Assess visual acuity result based on age
 */
export function assessVisualAcuity(
  acuity: SnellenRating,
  ageGroup: AgeGroup,
  eyeSide: 'left' | 'right' | 'both'
): {
  status: 'pass' | 'refer' | 'inconclusive';
  recommendation: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
} {
  const norms = AGE_NORMS[ageGroup];
  const acuityDecimal = SNELLEN_CHART[acuity].decimal;
  const minDecimal = SNELLEN_CHART[norms.minAcceptable].decimal;
  const typicalDecimal = SNELLEN_CHART[norms.typical].decimal;

  let status: 'pass' | 'refer' | 'inconclusive' = 'pass';
  let severity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  let recommendation = '';

  if (acuityDecimal >= typicalDecimal) {
    status = 'pass';
    severity = 'normal';
    recommendation = `${eyeSide === 'both' ? 'Both eyes show' : `${eyeSide} eye shows`} normal visual acuity for age group. Continue regular eye exams.`;
  } else if (acuityDecimal >= minDecimal) {
    status = 'pass';
    severity = 'mild';
    recommendation = `${eyeSide === 'both' ? 'Visual acuity is' : `${eyeSide} eye visual acuity is`} slightly below typical for age but within acceptable range. Consider comprehensive eye exam if symptoms present.`;
  } else if (acuityDecimal >= minDecimal * 0.7) {
    status = 'refer';
    severity = 'moderate';
    recommendation = `${eyeSide === 'both' ? 'Visual acuity is' : `${eyeSide} eye visual acuity is`} below expected for age. Recommend comprehensive eye examination by an optometrist or ophthalmologist.`;
  } else {
    status = 'refer';
    severity = 'severe';
    recommendation = `${eyeSide === 'both' ? 'Visual acuity is' : `${eyeSide} eye visual acuity is`} significantly reduced. Urgent comprehensive eye examination recommended. May require corrective lenses or further evaluation.`;
  }

  return { status, recommendation, severity };
}

/**
 * Photoscreening Analysis
 * Analyzes red reflex and eye alignment from images
 */

export interface PhotoscreeningResult {
  redReflexLeft: 'normal' | 'abnormal' | 'unclear';
  redReflexRight: 'normal' | 'abnormal' | 'unclear';
  eyeAlignment: 'normal' | 'esotropia' | 'exotropia' | 'hypertropia' | 'hypotropia' | 'unclear';
  pupilSymmetry: 'symmetric' | 'asymmetric' | 'unclear';
  confidence: number;
}

/**
 * Analyze image for red reflex quality
 * In production, this would use actual image processing
 */
export function analyzeRedReflex(
  imageData: ImageData | string,
  eyeSide: 'left' | 'right'
): {
  status: 'normal' | 'abnormal' | 'unclear';
  confidence: number;
  details: string;
} {
  // Mock implementation - in production, use actual image analysis
  // This would involve:
  // 1. Detect pupil location
  // 2. Analyze red reflex brightness and symmetry
  // 3. Check for white reflex (leukocoria)
  // 4. Assess clarity and color

  // For now, return a structure that real implementation would use
  return {
    status: 'normal',
    confidence: 85,
    details: 'Red reflex appears symmetric and bright. No white reflex detected.',
  };
}

/**
 * Analyze eye alignment from image
 */
export function analyzeEyeAlignment(
  imageData: ImageData | string
): {
  alignment: 'normal' | 'esotropia' | 'exotropia' | 'hypertropia' | 'hypotropia' | 'unclear';
  confidence: number;
  details: string;
  hirschbergTest: {
    leftReflexPosition: string;
    rightReflexPosition: string;
    deviation: number; // in prism diopters
  };
} {
  // Mock implementation - in production, use actual image analysis
  // This would involve:
  // 1. Detect both pupils
  // 2. Locate corneal light reflexes (Hirschberg test)
  // 3. Calculate deviation angle
  // 4. Classify alignment

  return {
    alignment: 'normal',
    confidence: 80,
    details: 'Corneal light reflexes appear symmetric. No obvious strabismus detected.',
    hirschbergTest: {
      leftReflexPosition: 'center',
      rightReflexPosition: 'center',
      deviation: 0,
    },
  };
}

/**
 * Assess photoscreening results
 */
export function assessPhotoscreening(
  result: PhotoscreeningResult
): {
  status: 'pass' | 'refer' | 'inconclusive';
  recommendation: string;
  concerns: string[];
} {
  const concerns: string[] = [];
  let status: 'pass' | 'refer' | 'inconclusive' = 'pass';

  // Check red reflex
  if (result.redReflexLeft === 'abnormal' || result.redReflexRight === 'abnormal') {
    concerns.push('Abnormal red reflex detected - may indicate cataracts, retinoblastoma, or other serious conditions');
    status = 'refer';
  }

  if (result.redReflexLeft === 'unclear' || result.redReflexRight === 'unclear') {
    concerns.push('Unable to clearly assess red reflex - repeat screening or professional evaluation needed');
    if (status !== 'refer') status = 'inconclusive';
  }

  // Check eye alignment
  if (['esotropia', 'exotropia', 'hypertropia', 'hypotropia'].includes(result.eyeAlignment)) {
    concerns.push(`Eye misalignment detected (${result.eyeAlignment}) - may indicate strabismus`);
    status = 'refer';
  }

  if (result.eyeAlignment === 'unclear') {
    concerns.push('Unable to clearly assess eye alignment - repeat screening recommended');
    if (status !== 'refer') status = 'inconclusive';
  }

  // Check pupil symmetry
  if (result.pupilSymmetry === 'asymmetric') {
    concerns.push('Asymmetric pupils detected - may indicate neurological or ocular issues');
    status = 'refer';
  }

  // Check confidence
  if (result.confidence < 70) {
    concerns.push('Low confidence in screening results - repeat screening or professional evaluation recommended');
    if (status === 'pass') status = 'inconclusive';
  }

  let recommendation = '';
  if (status === 'pass') {
    recommendation = 'Photoscreening results appear normal. Continue regular eye exams as recommended for age.';
  } else if (status === 'refer') {
    recommendation = 'Photoscreening indicates potential concerns. Comprehensive eye examination by an eye care professional is strongly recommended.';
  } else {
    recommendation = 'Photoscreening results are inconclusive. Repeat screening or professional evaluation recommended.';
  }

  return { status, recommendation, concerns };
}

/**
 * Calculate distance-adjusted optotype size
 */
export function calculateOptotypeSize(
  targetAcuity: SnellenRating,
  testDistance: number // in meters
): number {
  // Standard Snellen chart is designed for 6 meters (20 feet)
  const standardDistance = 6;
  const targetSize = SNELLEN_CHART[targetAcuity].size;
  
  // Calculate size in arcminutes
  const arcMinutes = (targetSize / 20) * 5; // 5 arcminutes per line
  
  // Adjust for actual test distance
  const adjustedSize = (arcMinutes * testDistance) / standardDistance;
  
  return adjustedSize;
}

/**
 * Generate random optotype for testing
 */
export function generateOptotype(
  type: keyof typeof OPTOTYPES,
  excludeRecent: string[] = []
): string {
  const options = OPTOTYPES[type].filter(opt => !excludeRecent.includes(opt));
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Color vision testing (Ishihara-style)
 */
export const COLOR_VISION_PLATES = [
  { number: 12, type: 'normal' },
  { number: 8, type: 'protan' },
  { number: 3, type: 'deutan' },
  { number: 29, type: 'normal' },
  { number: 5, type: 'protan' },
  { number: 2, type: 'deutan' },
  { number: 74, type: 'normal' },
  { number: 6, type: 'normal' },
] as const;

export function assessColorVision(
  responses: number[],
  correctAnswers: number[]
): {
  status: 'normal' | 'protan' | 'deutan' | 'tritan' | 'refer';
  recommendation: string;
} {
  const correctCount = responses.filter((r, i) => r === correctAnswers[i]).length;
  const percentCorrect = (correctCount / correctAnswers.length) * 100;

  if (percentCorrect >= 80) {
    return {
      status: 'normal',
      recommendation: 'Color vision appears normal.',
    };
  } else if (percentCorrect >= 60) {
    return {
      status: 'refer',
      recommendation: 'Possible color vision deficiency detected. Comprehensive color vision testing recommended.',
    };
  } else {
    return {
      status: 'refer',
      recommendation: 'Significant color vision deficiency detected. Professional evaluation recommended.',
    };
  }
}

/**
 * Contrast sensitivity testing
 */
export function assessContrastSensitivity(
  lowestDetectedContrast: number // percentage (0-100)
): {
  status: 'normal' | 'reduced' | 'severely_reduced';
  recommendation: string;
} {
  if (lowestDetectedContrast <= 2) {
    return {
      status: 'normal',
      recommendation: 'Contrast sensitivity is normal.',
    };
  } else if (lowestDetectedContrast <= 5) {
    return {
      status: 'reduced',
      recommendation: 'Mildly reduced contrast sensitivity. Consider comprehensive eye exam if symptoms present.',
    };
  } else {
    return {
      status: 'severely_reduced',
      recommendation: 'Significantly reduced contrast sensitivity. Comprehensive eye examination recommended.',
    };
  }
}
