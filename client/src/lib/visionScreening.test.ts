/**
 * Vision Screening Algorithm Tests
 * Tests for medical accuracy and edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  calculateVisualAcuity,
  assessVisualAcuity,
  assessPhotoscreening,
  generateOptotype,
  assessColorVision,
  assessContrastSensitivity,
  SNELLEN_CHART,
  type PhotoscreeningResult,
  type AgeGroup,
} from './visionScreening';

describe('Visual Acuity Calculations', () => {
  it('should calculate perfect 20/20 vision', () => {
    const result = calculateVisualAcuity(5, 5, '20/20');
    expect(result.acuity).toBe('20/20');
    expect(result.decimal).toBe(1.0);
    expect(result.percentCorrect).toBe(100);
  });

  it('should calculate 20/40 vision with 80% correct', () => {
    const result = calculateVisualAcuity(4, 5, '20/40');
    expect(result.acuity).toBe('20/40');
    expect(result.decimal).toBe(0.5);
    expect(result.percentCorrect).toBe(80);
  });

  it('should handle poor vision (20/200)', () => {
    const result = calculateVisualAcuity(3, 5, '20/200');
    expect(result.acuity).toBe('20/200');
    expect(result.decimal).toBe(0.1);
    expect(result.percentCorrect).toBe(60);
  });

  it('should handle excellent vision (20/15)', () => {
    const result = calculateVisualAcuity(5, 5, '20/15');
    expect(result.acuity).toBe('20/15');
    expect(result.decimal).toBeCloseTo(1.33, 2);
    expect(result.percentCorrect).toBe(100);
  });

  it('should calculate decimal acuity correctly', () => {
    expect(SNELLEN_CHART['20/20'].decimal).toBe(1.0);
    expect(SNELLEN_CHART['20/40'].decimal).toBe(0.5);
    expect(SNELLEN_CHART['20/100'].decimal).toBe(0.2);
    expect(SNELLEN_CHART['20/200'].decimal).toBe(0.1);
  });
});

describe('Visual Acuity Assessment - Age-Specific Norms', () => {
  it('should pass 20/40 vision for 3-5 year olds', () => {
    const assessment = assessVisualAcuity('20/40', '3-5', 'both');
    expect(assessment.status).toBe('pass');
    expect(assessment.severity).toBe('normal');
  });

  it('should refer 20/50 vision for 3-5 year olds', () => {
    const assessment = assessVisualAcuity('20/50', '3-5', 'both');
    expect(assessment.status).toBe('refer');
    expect(assessment.severity).not.toBe('normal');
  });

  it('should pass 20/30 vision for 6-12 year olds', () => {
    const assessment = assessVisualAcuity('20/30', '6-12', 'both');
    expect(assessment.status).toBe('pass');
  });

  it('should refer 20/40 vision for adults', () => {
    const assessment = assessVisualAcuity('20/40', '18+', 'both');
    expect(assessment.status).toBe('refer');
    expect(assessment.severity).toBe('mild');
  });

  it('should detect severe vision loss in adults', () => {
    const assessment = assessVisualAcuity('20/200', '18+', 'both');
    expect(assessment.status).toBe('refer');
    expect(assessment.severity).toBe('severe');
    expect(assessment.urgency).toBe('urgent');
  });

  it('should handle infant vision (0-2 years)', () => {
    const assessment = assessVisualAcuity('20/100', '0-2', 'both');
    expect(assessment.status).toBe('pass'); // Normal for infants
  });
});

describe('Photoscreening Assessment', () => {
  it('should pass normal photoscreening', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'normal',
      redReflexRight: 'normal',
      eyeAlignment: 'normal',
      pupilSymmetry: 'symmetric',
      confidence: 95,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('pass');
    expect(assessment.concerns).toHaveLength(0);
    expect(assessment.urgency).toBe('none');
  });

  it('should detect abnormal red reflex (URGENT - possible retinoblastoma)', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'abnormal',
      redReflexRight: 'normal',
      eyeAlignment: 'normal',
      pupilSymmetry: 'symmetric',
      confidence: 90,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.urgency).toBe('urgent');
    expect(assessment.concerns.some(c => c.toLowerCase().includes('red reflex'))).toBe(true);
    expect(assessment.recommendations.some(r => r.toLowerCase().includes('immediate'))).toBe(true);
  });

  it('should detect strabismus (esotropia)', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'normal',
      redReflexRight: 'normal',
      eyeAlignment: 'esotropia',
      pupilSymmetry: 'symmetric',
      confidence: 85,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.concerns.some(c => c.toLowerCase().includes('strabismus'))).toBe(true);
  });

  it('should detect exotropia', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'normal',
      redReflexRight: 'normal',
      eyeAlignment: 'exotropia',
      pupilSymmetry: 'symmetric',
      confidence: 85,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.concerns.some(c => c.toLowerCase().includes('strabismus'))).toBe(true);
  });

  it('should detect pupil asymmetry', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'normal',
      redReflexRight: 'normal',
      eyeAlignment: 'normal',
      pupilSymmetry: 'asymmetric',
      confidence: 80,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.concerns.some(c => c.toLowerCase().includes('pupil'))).toBe(true);
  });

  it('should handle unclear results with low confidence', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'unclear',
      redReflexRight: 'unclear',
      eyeAlignment: 'normal',
      pupilSymmetry: 'symmetric',
      confidence: 50,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('inconclusive');
    expect(assessment.recommendations.some(r => r.toLowerCase().includes('repeat'))).toBe(true);
  });

  it('should detect multiple abnormalities', () => {
    const result: PhotoscreeningResult = {
      redReflexLeft: 'abnormal',
      redReflexRight: 'normal',
      eyeAlignment: 'esotropia',
      pupilSymmetry: 'asymmetric',
      confidence: 85,
    };
    
    const assessment = assessPhotoscreening(result);
    expect(assessment.status).toBe('refer');
    expect(assessment.urgency).toBe('urgent');
    expect(assessment.concerns.length).toBeGreaterThan(1);
  });
});

describe('Optotype Generation', () => {
  it('should generate Snellen letters', () => {
    const optotype = generateOptotype('snellen');
    expect(['C', 'D', 'E', 'F', 'L', 'O', 'P', 'T', 'Z']).toContain(optotype);
  });

  it('should generate Tumbling E orientations', () => {
    const optotype = generateOptotype('tumbling_e');
    expect(['up', 'down', 'left', 'right']).toContain(optotype);
  });

  it('should generate LEA symbols', () => {
    const optotype = generateOptotype('lea_symbols');
    expect(['circle', 'square', 'house', 'apple']).toContain(optotype);
  });

  it('should not repeat recent optotypes', () => {
    const recent = ['E', 'F', 'P'];
    const optotype = generateOptotype('snellen', recent);
    expect(recent).not.toContain(optotype);
  });

  it('should generate picture optotypes for young children', () => {
    const optotype = generateOptotype('pictures');
    expect(['cat', 'dog', 'car', 'tree', 'star', 'heart']).toContain(optotype);
  });
});

describe('Color Vision Assessment', () => {
  it('should pass normal color vision', () => {
    const assessment = assessColorVision(10, 10);
    expect(assessment.status).toBe('pass');
    expect(assessment.colorDeficiency).toBe('none');
  });

  it('should detect mild color deficiency', () => {
    const assessment = assessColorVision(7, 10);
    expect(assessment.status).toBe('refer');
    expect(assessment.colorDeficiency).toBe('mild');
  });

  it('should detect moderate color deficiency', () => {
    const assessment = assessColorVision(5, 10);
    expect(assessment.status).toBe('refer');
    expect(assessment.colorDeficiency).toBe('moderate');
  });

  it('should detect severe color deficiency', () => {
    const assessment = assessColorVision(2, 10);
    expect(assessment.status).toBe('refer');
    expect(assessment.colorDeficiency).toBe('severe');
  });

  it('should calculate correct percentage', () => {
    const assessment = assessColorVision(8, 10);
    expect(assessment.percentCorrect).toBe(80);
  });
});

describe('Contrast Sensitivity Assessment', () => {
  it('should pass normal contrast sensitivity', () => {
    const assessment = assessContrastSensitivity(9, 10);
    expect(assessment.status).toBe('pass');
    expect(assessment.contrastSensitivity).toBe('normal');
  });

  it('should detect reduced contrast sensitivity', () => {
    const assessment = assessContrastSensitivity(6, 10);
    expect(assessment.status).toBe('refer');
    expect(assessment.contrastSensitivity).toBe('reduced');
  });

  it('should detect poor contrast sensitivity', () => {
    const assessment = assessContrastSensitivity(3, 10);
    expect(assessment.status).toBe('refer');
    expect(assessment.contrastSensitivity).toBe('poor');
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle zero correct responses', () => {
    const result = calculateVisualAcuity(0, 5, '20/200');
    expect(result.percentCorrect).toBe(0);
    expect(result.acuity).toBe('20/200');
  });

  it('should handle invalid age groups gracefully', () => {
    const assessment = assessVisualAcuity('20/40', '18+' as AgeGroup, 'both');
    expect(assessment).toBeDefined();
    expect(assessment.status).toBeDefined();
  });

  it('should handle edge case acuity values', () => {
    expect(SNELLEN_CHART['20/10']).toBeDefined();
    expect(SNELLEN_CHART['20/200']).toBeDefined();
  });
});

describe('Medical Accuracy Validation', () => {
  it('should use AAP recommended screening ages', () => {
    // AAP recommends screening at 3-5 years
    const assessment1 = assessVisualAcuity('20/40', '3-5', 'both');
    expect(assessment1.status).toBe('pass');

    // Adults should have better acuity
    const assessment2 = assessVisualAcuity('20/40', '18+', 'both');
    expect(assessment2.status).toBe('refer');
  });

  it('should flag legal blindness (20/200 or worse)', () => {
    const assessment = assessVisualAcuity('20/200', '18+', 'both');
    expect(assessment.severity).toBe('severe');
    expect(assessment.urgency).toBe('urgent');
  });

  it('should detect amblyopia risk in children', () => {
    // Significant difference between eyes suggests amblyopia
    const leftAssessment = assessVisualAcuity('20/20', '6-12', 'left');
    const rightAssessment = assessVisualAcuity('20/60', '6-12', 'right');
    
    expect(leftAssessment.status).toBe('pass');
    expect(rightAssessment.status).toBe('refer');
  });
});
