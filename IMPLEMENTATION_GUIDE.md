# Implementation Guide - Screening Algorithms

This guide explains how to integrate the screening algorithms into the React components.

## Vision Screening Implementation

### 1. Visual Acuity Test Component

```typescript
import { useState } from 'react';
import {
  SNELLEN_CHART,
  calculateVisualAcuity,
  assessVisualAcuity,
  generateOptotype,
  type AgeGroup,
  type SnellenRating
} from '@/lib/visionScreening';

function VisualAcuityTest({ ageGroup }: { ageGroup: AgeGroup }) {
  const [currentSize, setCurrentSize] = useState<SnellenRating>('20/40');
  const [responses, setResponses] = useState<boolean[]>([]);
  const [currentOptotype, setCurrentOptotype] = useState('');

  const startTest = () => {
    // Generate first optotype
    setCurrentOptotype(generateOptotype('snellen'));
  };

  const handleResponse = (correct: boolean) => {
    setResponses([...responses, correct]);
    
    // Calculate if we should continue or finish
    if (responses.length >= 5) {
      const result = calculateVisualAcuity(
        responses.filter(r => r).length,
        responses.length,
        currentSize
      );
      
      const assessment = assessVisualAcuity(
        result.acuity,
        ageGroup,
        'both'
      );
      
      // Save results and show summary
      console.log('Visual Acuity:', result);
      console.log('Assessment:', assessment);
    } else {
      // Show next optotype
      setCurrentOptotype(generateOptotype('snellen', [currentOptotype]));
    }
  };

  return (
    <div>
      <h2>Visual Acuity Test</h2>
      <div style={{ fontSize: SNELLEN_CHART[currentSize].size }}>
        {currentOptotype}
      </div>
      <button onClick={() => handleResponse(true)}>Correct</button>
      <button onClick={() => handleResponse(false)}>Incorrect</button>
    </div>
  );
}
```

### 2. Photoscreening Component

```typescript
import { useRef, useState, useEffect } from 'react';
import {
  requestCameraAccess,
  captureImageFromVideo,
  detectFaces,
  detectEyes,
  analyzeRedReflexInRegion,
  analyzeEyeAlignment,
  assessImageQuality,
  provideCaptureGuidance,
  stopCameraStream
} from '@/lib/cameraUtils';
import { assessPhotoscreening } from '@/lib/visionScreening';

function PhotoscreeningCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [guidance, setGuidance] = useState('');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) stopCameraStream(stream);
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await requestCameraAccess('user');
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setCapturing(true);
    
    // Capture image
    const imageData = captureImageFromVideo(videoRef.current, canvasRef.current);
    
    // Process image
    const imgData = await base64ToImageData(imageData);
    const faces = await detectFaces(imgData);
    
    if (faces.length === 0) {
      alert('No face detected. Please try again.');
      setCapturing(false);
      return;
    }
    
    const eyes = await detectEyes(imgData, faces[0]);
    
    // Analyze red reflex for each eye
    const leftEyeAnalysis = analyzeRedReflexInRegion(imgData, eyes[0]);
    const rightEyeAnalysis = analyzeRedReflexInRegion(imgData, eyes[1]);
    
    // Analyze eye alignment
    const alignment = analyzeEyeAlignment(eyes[0], eyes[1], { x: 960, y: 540 });
    
    // Assess results
    const photoscreeningResult = {
      redReflexLeft: leftEyeAnalysis.whiteReflexDetected ? 'abnormal' : 'normal',
      redReflexRight: rightEyeAnalysis.whiteReflexDetected ? 'abnormal' : 'normal',
      eyeAlignment: alignment.deviationType === 'orthotropic' ? 'normal' : alignment.deviationType,
      pupilSymmetry: leftEyeAnalysis.symmetry > 0.9 ? 'symmetric' : 'asymmetric',
      confidence: (leftEyeAnalysis.quality === 'good' && rightEyeAnalysis.quality === 'good') ? 90 : 70
    };
    
    const assessment = assessPhotoscreening(photoscreeningResult);
    
    // Save results
    console.log('Photoscreening:', photoscreeningResult);
    console.log('Assessment:', assessment);
    
    setCapturing(false);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p>{guidance}</p>
      <button onClick={capturePhoto} disabled={capturing}>
        Capture Photo
      </button>
    </div>
  );
}
```

## Hearing Screening Implementation

### 1. Pure Tone Audiometry Component

```typescript
import { useState, useEffect } from 'react';
import { AudioToneGenerator, PureToneTest } from '@/lib/audioUtils';
import {
  AUDIOMETRIC_FREQUENCIES,
  calculatePTA,
  classifyHearingLoss,
  assessAudiogramPattern,
  type Frequency
} from '@/lib/hearingScreening';

function PureToneAudiometryTest() {
  const [toneGenerator] = useState(() => new AudioToneGenerator());
  const [currentTest, setCurrentTest] = useState<PureToneTest | null>(null);
  const [thresholds, setThresholds] = useState<Map<Frequency, number>>(new Map());
  const [currentFrequency, setCurrentFrequency] = useState<Frequency>(1000);
  const [currentEar, setCurrentEar] = useState<'left' | 'right'>('right');

  useEffect(() => {
    return () => toneGenerator.dispose();
  }, []);

  const startTest = () => {
    const test = new PureToneTest(currentFrequency, currentEar);
    setCurrentTest(test);
    playTone();
  };

  const playTone = async () => {
    if (!currentTest) return;
    
    const level = currentTest.getCurrentLevel();
    const volume = toneGenerator.dbHLToVolume(level);
    
    await toneGenerator.playTone(
      currentFrequency,
      1000, // 1 second duration
      volume,
      currentEar
    );
  };

  const handleResponse = async (heard: boolean) => {
    if (!currentTest) return;
    
    currentTest.presentTone(heard);
    
    if (currentTest.isThresholdFound()) {
      // Save threshold and move to next frequency
      const threshold = currentTest.getThreshold();
      setThresholds(new Map(thresholds.set(currentFrequency, threshold)));
      
      // Move to next frequency or ear
      const freqIndex = AUDIOMETRIC_FREQUENCIES.indexOf(currentFrequency);
      if (freqIndex < AUDIOMETRIC_FREQUENCIES.length - 1) {
        setCurrentFrequency(AUDIOMETRIC_FREQUENCIES[freqIndex + 1]);
        setCurrentTest(new PureToneTest(AUDIOMETRIC_FREQUENCIES[freqIndex + 1], currentEar));
        await playTone();
      } else if (currentEar === 'right') {
        // Switch to left ear
        setCurrentEar('left');
        setCurrentFrequency(AUDIOMETRIC_FREQUENCIES[0]);
        setCurrentTest(new PureToneTest(AUDIOMETRIC_FREQUENCIES[0], 'left'));
        await playTone();
      } else {
        // Test complete
        finishTest();
      }
    } else {
      // Continue testing
      await playTone();
    }
  };

  const finishTest = () => {
    const pta = calculatePTA(thresholds);
    const classification = classifyHearingLoss(pta);
    const pattern = assessAudiogramPattern(thresholds);
    
    console.log('PTA:', pta);
    console.log('Classification:', classification);
    console.log('Pattern:', pattern);
  };

  return (
    <div>
      <h2>Pure Tone Audiometry</h2>
      <p>Testing: {currentFrequency} Hz - {currentEar} ear</p>
      <button onClick={() => handleResponse(true)}>I Heard It</button>
      <button onClick={() => handleResponse(false)}>I Didn't Hear It</button>
    </div>
  );
}
```

### 2. Speech-in-Noise Test Component

```typescript
import { useState, useEffect } from 'react';
import { SpeechAudioPlayer, TextToSpeech } from '@/lib/audioUtils';
import {
  generateWordList,
  assessSpeechInNoise,
  calculateSRT
} from '@/lib/hearingScreening';

function SpeechInNoiseTest() {
  const [speechPlayer] = useState(() => new SpeechAudioPlayer());
  const [tts] = useState(() => new TextToSpeech());
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [snr, setSnr] = useState(5); // Start at +5 dB SNR
  const [responses, setResponses] = useState<Array<{ word: string; correct: boolean }>>([]);

  useEffect(() => {
    initTest();
    return () => {
      speechPlayer.dispose();
      tts.stop();
    };
  }, []);

  const initTest = async () => {
    await tts.setVoice('en-US');
    const wordList = generateWordList('monosyllables', 20);
    setWords(wordList);
  };

  const playWord = async () => {
    const word = words[currentWordIndex];
    
    // In production, use pre-recorded speech files
    // For now, use TTS with background noise
    await tts.speak(word, 1.0, 1.0, 0.8);
    
    // In production:
    // await speechPlayer.playSpeechInNoise('/audio/words/' + word + '.mp3', snr, 'pink');
  };

  const handleResponse = (userInput: string) => {
    const correct = userInput.toLowerCase() === words[currentWordIndex].toLowerCase();
    setResponses([...responses, { word: words[currentWordIndex], correct }]);
    
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      playWord();
    } else {
      finishTest();
    }
  };

  const finishTest = () => {
    const correctCount = responses.filter(r => r.correct).length;
    const percentCorrect = (correctCount / responses.length) * 100;
    
    const assessment = assessSpeechInNoise(percentCorrect, snr);
    
    console.log('Speech-in-Noise Results:', {
      percentCorrect,
      snr,
      assessment
    });
  };

  return (
    <div>
      <h2>Speech-in-Noise Test</h2>
      <p>SNR: {snr} dB</p>
      <button onClick={playWord}>Play Word</button>
      <input
        type="text"
        placeholder="What did you hear?"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleResponse((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
    </div>
  );
}
```

## Integration with Backend

### Save Vision Results

```typescript
import { trpc } from '@/lib/trpc';

async function saveVisionResults(
  sessionId: string,
  acuityResult: any,
  photoscreeningResult: any
) {
  // Save visual acuity
  await trpc.screening.addVisualAcuityResult.mutate({
    sessionId,
    eyeSide: 'both',
    acuityMeasurement: acuityResult.acuity,
    acuityDecimal: acuityResult.decimal,
    testMethod: 'snellen',
    distanceMeters: 6,
  });

  // Save photoscreening
  await trpc.screening.addPhotoscreeningResult.mutate({
    sessionId,
    eyeSide: 'both',
    redReflexStatus: photoscreeningResult.redReflexLeft,
    eyeAlignment: photoscreeningResult.eyeAlignment,
    confidence: photoscreeningResult.confidence,
  });
}
```

### Save Hearing Results

```typescript
async function saveHearingResults(
  sessionId: string,
  thresholds: Map<number, number>,
  speechResults: any
) {
  // Save pure tone results
  for (const [frequency, threshold] of thresholds.entries()) {
    await trpc.screening.addPureToneResult.mutate({
      sessionId,
      earSide: 'right', // or 'left'
      frequency,
      threshold,
      conduction: 'air',
    });
  }

  // Save speech-in-noise results
  await trpc.screening.addSpeechInNoiseResult.mutate({
    sessionId,
    testType: 'custom',
    percentCorrect: speechResults.percentCorrect,
    signalNoiseRatio: speechResults.snr,
  });
}
```

## Best Practices

### 1. Error Handling

```typescript
try {
  const stream = await requestCameraAccess();
  // ... use camera
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly error message
    alert(`Camera Error: ${error.message}`);
  }
}
```

### 2. User Guidance

```typescript
// Provide real-time feedback
const checkEnvironment = async () => {
  const noiseMeter = new AudioLevelMeter();
  await noiseMeter.start();
  
  const noiseLevel = noiseMeter.getNoiseLevel();
  if (!noiseMeter.isQuietEnough(40)) {
    alert('Environment too noisy. Please find a quieter location.');
  }
  
  noiseMeter.dispose();
};
```

### 3. Calibration

```typescript
// Calibrate audio before testing
const calibrateAudio = async () => {
  const toneGenerator = new AudioToneGenerator();
  
  // Play reference tone
  await toneGenerator.playTone(1000, 2000, 0.5);
  
  // Ask user to adjust volume
  const userConfirmed = confirm('Can you hear the tone comfortably?');
  
  if (!userConfirmed) {
    alert('Please adjust your device volume and try again.');
  }
};
```

### 4. Progress Tracking

```typescript
const [progress, setProgress] = useState({
  current: 0,
  total: AUDIOMETRIC_FREQUENCIES.length * 2 // Both ears
});

// Update progress
setProgress({
  current: progress.current + 1,
  total: progress.total
});
```

## Testing Recommendations

### Vision Testing
1. Use well-lit environment
2. Ensure proper distance (6 meters or calibrated)
3. Test each eye separately when possible
4. Verify image quality before analysis
5. Provide clear instructions

### Hearing Testing
1. Use headphones for best results
2. Test in quiet environment (<40 dB ambient)
3. Calibrate audio output
4. Provide practice trials
5. Allow breaks between tests

## Medical Compliance

### Documentation
- Record all test parameters
- Save raw data when possible
- Include timestamps
- Track software version

### Privacy
- Encrypt sensitive data
- Obtain informed consent
- Follow HIPAA guidelines
- Secure image storage

### Quality Control
- Validate results
- Flag suspicious data
- Require professional review for abnormal results
- Regular algorithm validation

---

**Remember**: These are screening tools. Always refer abnormal results to qualified healthcare professionals.
