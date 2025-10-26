# Screening Algorithms Documentation

This document details the medical algorithms and testing procedures implemented in the Health Screener PWA.

## Vision Screening Algorithms

### 1. Visual Acuity Testing

#### Snellen Chart Implementation

The application uses standard Snellen notation for visual acuity measurement:

- **20/20**: Normal vision (1.0 decimal, 0.0 logMAR)
- **20/40**: Mild impairment (0.5 decimal, 0.3 logMAR)
- **20/200**: Legal blindness threshold (0.1 decimal, 1.0 logMAR)

#### Testing Procedure

1. **Distance Calibration**: Test distance is calibrated to 6 meters (20 feet) or adjusted proportionally
2. **Optotype Selection**: Age-appropriate symbols:
   - 0-2 years: Picture matching
   - 3-5 years: LEA symbols or Tumbling E
   - 6+ years: Standard Snellen letters
3. **Presentation**: Optotypes presented from larger to smaller
4. **Scoring**: Threshold determined when <80% correct at a given size

#### Assessment Criteria

**Age-Based Norms:**
- 0-2 years: 20/100 typical, 20/200 minimum acceptable
- 3-5 years: 20/30 typical, 20/40 minimum acceptable
- 6-12 years: 20/20 typical, 20/30 minimum acceptable
- 13+ years: 20/20 typical, 20/25 minimum acceptable

**Status Classification:**
- **Pass**: Acuity at or above age-appropriate norms
- **Refer**: Acuity below minimum acceptable for age
- **Inconclusive**: Unable to complete test or inconsistent responses

### 2. Photoscreening

#### Red Reflex Analysis

**Purpose**: Detect media opacities, retinal abnormalities, and refractive errors

**Procedure:**
1. Capture image with flash/light source aligned with camera
2. Detect pupil locations using computer vision
3. Analyze red reflex characteristics:
   - Brightness (normal: bright orange-red)
   - Symmetry (left vs right comparison)
   - Color (abnormal: white, yellow, or absent)
   - Clarity (normal: clear and uniform)

**Interpretation:**
- **Normal**: Bright, symmetric, orange-red reflex bilaterally
- **Abnormal White Reflex (Leukocoria)**: 
  - May indicate: Retinoblastoma, cataract, retinal detachment
  - Action: URGENT referral to ophthalmologist
- **Asymmetric Reflex**:
  - May indicate: Anisometropia, strabismus, media opacity
  - Action: Refer to eye care professional
- **Dim/Absent Reflex**:
  - May indicate: High refractive error, media opacity
  - Action: Refer for comprehensive exam

#### Eye Alignment Assessment (Hirschberg Test)

**Purpose**: Detect strabismus (eye misalignment)

**Procedure:**
1. Capture image with light source creating corneal reflexes
2. Measure position of light reflexes in each pupil
3. Calculate deviation from center

**Interpretation:**
- **Orthotropic**: Reflexes centered in both pupils
- **Esotropia**: Inward deviation (reflex displaced temporally)
- **Exotropia**: Outward deviation (reflex displaced nasally)
- **Hypertropia/Hypotropia**: Vertical deviation

**Prism Diopter Estimation:**
- 1mm deviation ≈ 7 prism diopters
- >10 prism diopters: Refer for evaluation

### 3. Contrast Sensitivity

**Purpose**: Assess ability to detect low-contrast targets

**Procedure:**
1. Present gratings or letters at decreasing contrast levels
2. Determine lowest detectable contrast
3. Compare to age norms

**Normal Values:**
- Adults: Can detect <2% contrast
- Reduced: 2-5% contrast threshold
- Severely reduced: >5% contrast threshold

### 4. Color Vision (Ishihara-style)

**Purpose**: Screen for color vision deficiencies

**Procedure:**
1. Present pseudo-isochromatic plates
2. Record number identification
3. Analyze error patterns

**Interpretation:**
- **Normal**: >80% correct
- **Protan Deficiency**: Red-green confusion, red plates missed
- **Deutan Deficiency**: Red-green confusion, green plates missed
- **Refer**: <80% correct or consistent pattern errors

---

## Hearing Screening Algorithms

### 1. Pure Tone Audiometry

#### Modified Hughson-Westlake Procedure

**Test Frequencies**: 250, 500, 1000, 2000, 4000, 8000 Hz

**Procedure:**
1. **Familiarization**: Present 1000 Hz at 40 dB HL
2. **Initial Presentation**: Start at 40 dB HL
3. **Threshold Search**:
   - If heard: Decrease 10 dB
   - If not heard: Increase 5 dB
   - Continue until threshold found
4. **Threshold Criterion**: Lowest level where tone heard ≥50% of presentations

**Threshold Determination:**
- Present tone 2-3 times at each level
- Threshold = lowest level with ≥2/3 responses
- Test each frequency in each ear

#### Pure Tone Average (PTA)

**Calculation**: Average of thresholds at 500, 1000, 2000 Hz

**Classification (WHO Standards):**
- **Normal**: -10 to 25 dB HL
- **Slight**: 26-40 dB HL
- **Moderate**: 41-60 dB HL
- **Severe**: 61-80 dB HL
- **Profound**: >80 dB HL

#### High Frequency Average (HFA)

**Calculation**: Average of thresholds at 2000, 4000, 8000 Hz

**Purpose**: Detect early noise-induced hearing loss

### 2. Audiogram Pattern Analysis

#### Pattern Types

**Flat Audiogram:**
- Similar thresholds across frequencies
- May indicate: Conductive loss, genetic hearing loss

**Sloping Audiogram:**
- Progressive high-frequency loss
- May indicate: Presbycusis (age-related), genetic factors

**Notched Audiogram:**
- Dip at 4000 Hz
- May indicate: Noise-induced hearing loss

**Cookie Bite:**
- Mid-frequency loss (500-2000 Hz)
- May indicate: Genetic hearing loss

**Rising Audiogram:**
- Low-frequency loss
- May indicate: Meniere's disease, otosclerosis

### 3. Speech-in-Noise Testing

#### Purpose
Assess real-world listening ability in noisy environments

#### Signal-to-Noise Ratio (SNR)

**Test Conditions:**
- +5 dB SNR: Easy (80%+ expected)
- 0 dB SNR: Moderate (60%+ expected)
- -5 dB SNR: Difficult (40%+ expected)

**Procedure:**
1. Present words/sentences with background noise
2. Vary SNR based on performance
3. Calculate Speech Reception Threshold (SRT)

**SRT Definition**: SNR where 50% words correctly identified

#### Assessment

**Performance Levels:**
- **Excellent**: >100% of expected performance
- **Good**: 80-100% of expected
- **Fair**: 60-80% of expected
- **Poor**: 40-60% of expected
- **Very Poor**: <40% of expected

**Referral Criteria:**
- Fair or worse performance
- Significant discrepancy between pure tone and speech scores
- Asymmetric performance between ears

### 4. Tympanometry (Middle Ear Function)

#### Type Classification

**Type A (Normal):**
- Peak pressure: -100 to +50 daPa
- Compliance: 0.3-1.6 ml
- Interpretation: Normal middle ear function

**Type As (Stiff):**
- Reduced compliance (<0.3 ml)
- May indicate: Otosclerosis, ossicular fixation

**Type Ad (Hypermobile):**
- Increased compliance (>1.6 ml)
- May indicate: Ossicular discontinuity

**Type B (Flat):**
- No peak, flat trace
- May indicate: Middle ear fluid, perforation

**Type C (Negative Pressure):**
- Peak <-100 daPa
- May indicate: Eustachian tube dysfunction

### 5. Otoacoustic Emissions (OAE)

#### Purpose
Assess cochlear (outer hair cell) function

**Pass Criteria:**
- Signal-to-Noise Ratio ≥6 dB at ≥80% of frequencies
- Present at 2000, 3000, 4000 Hz minimum

**Interpretation:**
- **Pass**: Cochlear function normal
- **Refer**: Possible cochlear dysfunction, requires audiological evaluation

---

## Referral Criteria

### Vision Screening

**Immediate Referral (Urgent):**
- White pupil (leukocoria)
- Significant asymmetry in red reflex
- Suspected retinoblastoma signs

**Routine Referral:**
- Visual acuity below age norms
- Strabismus detected
- Failed photoscreening
- Parental concern about vision

### Hearing Screening

**Immediate Referral:**
- Sudden hearing loss
- Asymmetric hearing loss >15 dB
- Hearing loss in children <3 years

**Routine Referral:**
- PTA >25 dB HL in any ear
- Failed speech-in-noise testing
- Abnormal tympanometry with symptoms
- Parental concern about hearing

---

## Quality Assurance

### Vision Testing

**Environmental Requirements:**
- Adequate lighting (not too bright/dim)
- Minimal distractions
- Appropriate test distance

**Quality Checks:**
- Image quality assessment (sharpness, brightness, contrast)
- Face detection confidence >80%
- Pupil detection confidence >80%

### Hearing Testing

**Environmental Requirements:**
- Ambient noise <40 dB SPL
- Quiet room
- Headphones recommended (not required)

**Quality Checks:**
- Audio calibration verified
- Consistent responses
- Test-retest reliability

---

## Age-Specific Considerations

### Infants (0-2 years)

**Vision:**
- Limited cooperation
- Use preferential looking, picture matching
- Lower acuity expectations

**Hearing:**
- Behavioral observation audiometry
- OAE screening preferred
- Parental report important

### Preschool (3-5 years)

**Vision:**
- LEA symbols or Tumbling E
- Shorter test sessions
- Positive reinforcement

**Hearing:**
- Play audiometry
- Visual reinforcement
- Shorter test sessions

### School Age (6-12 years)

**Vision:**
- Standard Snellen chart
- Can complete full testing
- Screen for learning-related vision issues

**Hearing:**
- Standard audiometry
- Screen for noise exposure
- Educational impact assessment

### Adults (18+ years)

**Vision:**
- Standard testing
- Screen for presbyopia (>40 years)
- Occupational vision requirements

**Hearing:**
- Standard audiometry
- Assess noise exposure history
- Screen for presbycusis (>60 years)

---

## Limitations and Disclaimers

### General Limitations

1. **Screening vs Diagnosis**: These are screening tools, not diagnostic tests
2. **Professional Evaluation**: Abnormal results require professional evaluation
3. **Environmental Factors**: Results affected by testing conditions
4. **User Factors**: Cooperation, attention, understanding affect results

### Vision Screening Limitations

- Cannot detect all eye conditions
- Photoscreening less accurate than comprehensive exam
- Image quality dependent on device camera
- Not a substitute for dilated eye exam

### Hearing Screening Limitations

- Cannot diagnose cause of hearing loss
- Calibration limitations with consumer audio
- Background noise affects results
- Not equivalent to clinical audiometry

### Medical Disclaimer

**This application provides preliminary screening only. Results are not diagnostic and do not constitute medical advice. Always consult qualified healthcare professionals for diagnosis and treatment of vision or hearing concerns.**

---

## References

### Vision Screening
- American Academy of Pediatrics vision screening guidelines
- American Academy of Ophthalmology recommendations
- Prevent Blindness America standards

### Hearing Screening
- American Speech-Language-Hearing Association (ASHA) guidelines
- American Academy of Audiology recommendations
- World Health Organization hearing screening protocols

---

**Last Updated**: January 2024
**Version**: 1.0.0
