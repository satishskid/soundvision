/**
 * Camera and Image Processing Utilities for Photoscreening
 */

export interface CameraConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    facingMode: 'user' | 'environment';
    aspectRatio?: number;
  };
}

/**
 * Request camera access with optimal settings for photoscreening
 */
export async function requestCameraAccess(
  facingMode: 'user' | 'environment' = 'user'
): Promise<MediaStream> {
  try {
    const constraints: CameraConstraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode,
        aspectRatio: 16 / 9,
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied. Please grant camera permissions.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.');
      }
    }
    throw new Error('Failed to access camera. Please check your device settings.');
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Capture image from video stream
 */
export function captureImageFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Convert base64 image to ImageData for processing
 */
export async function base64ToImageData(base64: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

/**
 * Detect faces in image (simplified - in production use ML library)
 */
export interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export async function detectFaces(imageData: ImageData): Promise<FaceDetection[]> {
  // Mock implementation - in production, use:
  // - TensorFlow.js with BlazeFace or MediaPipe
  // - face-api.js
  // - OpenCV.js
  
  // Return mock face detection
  return [
    {
      x: imageData.width * 0.3,
      y: imageData.height * 0.2,
      width: imageData.width * 0.4,
      height: imageData.height * 0.5,
      confidence: 0.95,
    },
  ];
}

/**
 * Detect eyes within face region
 */
export interface EyeDetection {
  side: 'left' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
  pupilX: number;
  pupilY: number;
  confidence: number;
}

export async function detectEyes(
  imageData: ImageData,
  faceRegion: FaceDetection
): Promise<EyeDetection[]> {
  // Mock implementation - in production, use eye detection models
  
  const leftEye: EyeDetection = {
    side: 'left',
    x: faceRegion.x + faceRegion.width * 0.25,
    y: faceRegion.y + faceRegion.height * 0.35,
    width: faceRegion.width * 0.15,
    height: faceRegion.height * 0.1,
    pupilX: faceRegion.x + faceRegion.width * 0.3,
    pupilY: faceRegion.y + faceRegion.height * 0.38,
    confidence: 0.9,
  };

  const rightEye: EyeDetection = {
    side: 'right',
    x: faceRegion.x + faceRegion.width * 0.6,
    y: faceRegion.y + faceRegion.height * 0.35,
    width: faceRegion.width * 0.15,
    height: faceRegion.height * 0.1,
    pupilX: faceRegion.x + faceRegion.width * 0.65,
    pupilY: faceRegion.y + faceRegion.height * 0.38,
    confidence: 0.9,
  };

  return [leftEye, rightEye];
}

/**
 * Analyze red reflex in eye region
 */
export interface RedReflexAnalysis {
  brightness: number; // 0-255
  symmetry: number; // 0-1, comparing left and right
  color: { r: number; g: number; b: number };
  quality: 'good' | 'fair' | 'poor';
  whiteReflexDetected: boolean;
}

export function analyzeRedReflexInRegion(
  imageData: ImageData,
  eyeRegion: EyeDetection
): RedReflexAnalysis {
  const { data, width } = imageData;
  const { pupilX, pupilY, width: eyeWidth, height: eyeHeight } = eyeRegion;

  // Sample pixels around pupil center
  const sampleRadius = Math.min(eyeWidth, eyeHeight) * 0.3;
  let totalR = 0, totalG = 0, totalB = 0, count = 0;

  for (let dy = -sampleRadius; dy <= sampleRadius; dy += 2) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx += 2) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > sampleRadius) continue;

      const x = Math.round(pupilX + dx);
      const y = Math.round(pupilY + dy);
      const index = (y * width + x) * 4;

      if (index >= 0 && index < data.length - 3) {
        totalR += data[index];
        totalG += data[index + 1];
        totalB += data[index + 2];
        count++;
      }
    }
  }

  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;
  const brightness = (avgR + avgG + avgB) / 3;

  // Check for white reflex (leukocoria)
  const whiteReflexDetected = avgR > 200 && avgG > 200 && avgB > 200;

  // Assess quality
  let quality: 'good' | 'fair' | 'poor';
  if (brightness > 100 && !whiteReflexDetected) {
    quality = 'good';
  } else if (brightness > 50) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {
    brightness,
    symmetry: 0.95, // Would compare left and right in full implementation
    color: { r: avgR, g: avgG, b: avgB },
    quality,
    whiteReflexDetected,
  };
}

/**
 * Analyze eye alignment using Hirschberg test
 */
export interface HirschbergAnalysis {
  leftReflexX: number;
  leftReflexY: number;
  rightReflexX: number;
  rightReflexY: number;
  deviationAngle: number; // in degrees
  deviationType: 'orthotropic' | 'esotropia' | 'exotropia' | 'hypertropia' | 'hypotropia';
  prismDiopters: number;
}

export function analyzeEyeAlignment(
  leftEye: EyeDetection,
  rightEye: EyeDetection,
  lightSourcePosition: { x: number; y: number }
): HirschbergAnalysis {
  // Calculate expected reflex position (should be centered in pupil)
  const leftReflexX = leftEye.pupilX;
  const leftReflexY = leftEye.pupilY;
  const rightReflexX = rightEye.pupilX;
  const rightReflexY = rightEye.pupilY;

  // Calculate deviation
  const interpupillaryDistance = Math.abs(rightEye.pupilX - leftEye.pupilX);
  const horizontalDeviation = Math.abs(
    (leftReflexX - leftEye.pupilX) - (rightReflexX - rightEye.pupilX)
  );
  const verticalDeviation = Math.abs(
    (leftReflexY - leftEye.pupilY) - (rightReflexY - rightEye.pupilY)
  );

  // Convert to prism diopters (1mm deviation ≈ 7 prism diopters)
  const prismDiopters = (horizontalDeviation / interpupillaryDistance) * 100 * 7;

  // Determine deviation type
  let deviationType: HirschbergAnalysis['deviationType'] = 'orthotropic';
  if (prismDiopters > 10) {
    if (horizontalDeviation > verticalDeviation) {
      deviationType = leftReflexX < leftEye.pupilX ? 'esotropia' : 'exotropia';
    } else {
      deviationType = leftReflexY < leftEye.pupilY ? 'hypertropia' : 'hypotropia';
    }
  }

  const deviationAngle = Math.atan2(verticalDeviation, horizontalDeviation) * (180 / Math.PI);

  return {
    leftReflexX,
    leftReflexY,
    rightReflexX,
    rightReflexY,
    deviationAngle,
    deviationType,
    prismDiopters,
  };
}

/**
 * Image quality assessment for photoscreening
 */
export interface ImageQuality {
  sharpness: number; // 0-100
  brightness: number; // 0-100
  contrast: number; // 0-100
  acceptable: boolean;
  issues: string[];
}

export function assessImageQuality(imageData: ImageData): ImageQuality {
  const { data, width, height } = imageData;
  const issues: string[] = [];

  // Calculate average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const brightness = (totalBrightness / (width * height)) / 255 * 100;

  if (brightness < 30) issues.push('Image too dark');
  if (brightness > 80) issues.push('Image too bright');

  // Calculate contrast (simplified)
  let minBrightness = 255, maxBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pixelBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    minBrightness = Math.min(minBrightness, pixelBrightness);
    maxBrightness = Math.max(maxBrightness, pixelBrightness);
  }
  const contrast = ((maxBrightness - minBrightness) / 255) * 100;

  if (contrast < 20) issues.push('Low contrast');

  // Estimate sharpness using edge detection (simplified)
  let edgeStrength = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const iRight = (y * width + (x + 1)) * 4;
      const iDown = ((y + 1) * width + x) * 4;

      const gradX = Math.abs(data[i] - data[iRight]);
      const gradY = Math.abs(data[i] - data[iDown]);
      edgeStrength += Math.sqrt(gradX * gradX + gradY * gradY);
    }
  }
  const sharpness = Math.min(100, (edgeStrength / (width * height)) * 10);

  if (sharpness < 30) issues.push('Image blurry');

  const acceptable = issues.length === 0 && brightness > 30 && brightness < 80 && contrast > 20;

  return {
    sharpness,
    brightness,
    contrast,
    acceptable,
    issues,
  };
}

/**
 * Guide user for optimal photo capture
 */
export interface CaptureGuidance {
  distanceOk: boolean;
  lightingOk: boolean;
  alignmentOk: boolean;
  message: string;
}

export function provideCaptureGuidance(
  faceDetection: FaceDetection | null,
  imageQuality: ImageQuality
): CaptureGuidance {
  if (!faceDetection) {
    return {
      distanceOk: false,
      lightingOk: false,
      alignmentOk: false,
      message: 'No face detected. Please position yourself in front of the camera.',
    };
  }

  const distanceOk = faceDetection.width > 200 && faceDetection.width < 600;
  const lightingOk = imageQuality.brightness > 30 && imageQuality.brightness < 80;
  const alignmentOk = Math.abs(faceDetection.x + faceDetection.width / 2 - 960) < 200;

  let message = '';
  if (!distanceOk) {
    message = faceDetection.width < 200 ? 'Move closer to the camera' : 'Move further from the camera';
  } else if (!lightingOk) {
    message = imageQuality.brightness < 30 ? 'Increase lighting' : 'Reduce lighting';
  } else if (!alignmentOk) {
    message = 'Center your face in the frame';
  } else {
    message = 'Perfect! Hold still...';
  }

  return {
    distanceOk,
    lightingOk,
    alignmentOk,
    message,
  };
}

/**
 * Flash control for red reflex photography
 */
export async function enableFlash(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();

  if ('torch' in capabilities) {
    await track.applyConstraints({
      // @ts-ignore - torch is not in standard types yet
      advanced: [{ torch: true }],
    });
  } else {
    console.warn('Flash/torch not supported on this device');
  }
}

export async function disableFlash(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();

  if ('torch' in capabilities) {
    await track.applyConstraints({
      // @ts-ignore
      advanced: [{ torch: false }],
    });
  }
}
