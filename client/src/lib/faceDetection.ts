/**
 * Face Detection using TensorFlow.js
 * Provides real-time face and eye detection for photoscreening
 */

import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

let detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let isInitialized = false;

/**
 * Initialize the face detection model
 */
export async function initializeFaceDetection(): Promise<void> {
  if (isInitialized && detector) return;

  try {
    // Set backend to WebGL for better performance
    await tf.setBackend('webgl');
    await tf.ready();

    // Create detector with MediaPipe FaceMesh
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      refineLandmarks: true,
    };

    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    isInitialized = true;
    console.log('[Face Detection] Model loaded successfully');
  } catch (error) {
    console.error('[Face Detection] Failed to initialize:', error);
    throw new Error('Failed to initialize face detection model');
  }
}

/**
 * Detect faces in an image or video frame
 */
export async function detectFacesML(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceLandmarksDetection.Face[]> {
  if (!detector) {
    await initializeFaceDetection();
  }

  if (!detector) {
    throw new Error('Face detector not initialized');
  }

  try {
    const faces = await detector.estimateFaces(input, {
      flipHorizontal: false,
    });
    return faces;
  } catch (error) {
    console.error('[Face Detection] Detection failed:', error);
    return [];
  }
}

/**
 * Extract eye landmarks from face detection
 */
export function getEyeLandmarks(face: faceLandmarksDetection.Face) {
  const keypoints = face.keypoints;

  // MediaPipe FaceMesh eye indices
  // Left eye: 33, 133, 160, 159, 158, 157, 173, 246
  // Right eye: 362, 263, 387, 386, 385, 384, 398, 466
  const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173, 246];
  const rightEyeIndices = [362, 263, 387, 386, 385, 384, 398, 466];

  const leftEye = leftEyeIndices.map(i => keypoints[i]);
  const rightEye = rightEyeIndices.map(i => keypoints[i]);

  // Calculate eye centers
  const leftEyeCenter = {
    x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
    y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
  };

  const rightEyeCenter = {
    x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
    y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
  };

  // Calculate eye regions (bounding boxes)
  const leftEyeBox = {
    x: Math.min(...leftEye.map(p => p.x)),
    y: Math.min(...leftEye.map(p => p.y)),
    width: Math.max(...leftEye.map(p => p.x)) - Math.min(...leftEye.map(p => p.x)),
    height: Math.max(...leftEye.map(p => p.y)) - Math.min(...leftEye.map(p => p.y)),
  };

  const rightEyeBox = {
    x: Math.min(...rightEye.map(p => p.x)),
    y: Math.min(...rightEye.map(p => p.y)),
    width: Math.max(...rightEye.map(p => p.x)) - Math.min(...rightEye.map(p => p.x)),
    height: Math.max(...rightEye.map(p => p.y)) - Math.min(...rightEye.map(p => p.y)),
  };

  return {
    leftEye: {
      landmarks: leftEye,
      center: leftEyeCenter,
      box: leftEyeBox,
    },
    rightEye: {
      landmarks: rightEye,
      center: rightEyeCenter,
      box: rightEyeBox,
    },
  };
}

/**
 * Check if face is properly aligned for photoscreening
 */
export function isFaceAligned(face: faceLandmarksDetection.Face): {
  aligned: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const eyes = getEyeLandmarks(face);

  // Check eye distance (should be reasonable)
  const eyeDistance = Math.sqrt(
    Math.pow(eyes.rightEye.center.x - eyes.leftEye.center.x, 2) +
    Math.pow(eyes.rightEye.center.y - eyes.leftEye.center.y, 2)
  );

  if (eyeDistance < 50) {
    issues.push('Move closer to camera');
  } else if (eyeDistance > 300) {
    issues.push('Move back from camera');
  }

  // Check if eyes are level (not tilted)
  const eyeAngle = Math.abs(
    Math.atan2(
      eyes.rightEye.center.y - eyes.leftEye.center.y,
      eyes.rightEye.center.x - eyes.leftEye.center.x
    )
  );

  if (eyeAngle > 0.2) {
    // ~11 degrees
    issues.push('Keep head level');
  }

  // Check if face is centered
  const faceBox = face.box;
  if (!faceBox) {
    issues.push('Face not detected clearly');
  }

  return {
    aligned: issues.length === 0,
    issues,
  };
}

/**
 * Draw face detection overlay on canvas
 */
export function drawFaceOverlay(
  canvas: HTMLCanvasElement,
  face: faceLandmarksDetection.Face,
  showLandmarks = false
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const eyes = getEyeLandmarks(face);

  // Draw eye boxes
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // Left eye
  ctx.strokeRect(
    eyes.leftEye.box.x,
    eyes.leftEye.box.y,
    eyes.leftEye.box.width,
    eyes.leftEye.box.height
  );

  // Right eye
  ctx.strokeRect(
    eyes.rightEye.box.x,
    eyes.rightEye.box.y,
    eyes.rightEye.box.width,
    eyes.rightEye.box.height
  );

  // Draw eye centers
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.arc(eyes.leftEye.center.x, eyes.leftEye.center.y, 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eyes.rightEye.center.x, eyes.rightEye.center.y, 3, 0, 2 * Math.PI);
  ctx.fill();

  // Draw face box
  if (face.box) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(face.box.xMin, face.box.yMin, face.box.width, face.box.height);
  }

  // Optionally draw all landmarks
  if (showLandmarks && face.keypoints) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    face.keypoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

/**
 * Cleanup resources
 */
export async function disposeFaceDetection(): Promise<void> {
  if (detector) {
    detector.dispose();
    detector = null;
    isInitialized = false;
  }
}
