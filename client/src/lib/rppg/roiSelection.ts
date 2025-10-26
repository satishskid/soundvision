/**
 * Region of Interest (ROI) Selection for rPPG
 * Extract optimal facial regions for signal extraction
 */

import { detectFacesML, getEyeLandmarks } from '../faceDetection';
import type { ROI } from './types';

/**
 * Select optimal facial regions for rPPG signal extraction
 * Forehead provides best signal quality
 */
export async function selectFacialROI(
  videoElement: HTMLVideoElement
): Promise<ROI[]> {
  try {
    // Detect face using TensorFlow.js
    const faces = await detectFacesML(videoElement);
    if (faces.length === 0) return [];

    const face = faces[0];
    const eyes = getEyeLandmarks(face);

    const rois: ROI[] = [];

    // Forehead ROI (best signal quality for rPPG)
    const eyeDistance = eyes.rightEye.center.x - eyes.leftEye.center.x;
    const foreheadROI: ROI = {
      x: eyes.leftEye.center.x - eyeDistance * 0.1,
      y: eyes.leftEye.center.y - eyeDistance * 0.6,
      width: eyeDistance * 1.2,
      height: eyeDistance * 0.4,
    };
    rois.push(foreheadROI);

    // Left cheek ROI (secondary)
    const leftCheekROI: ROI = {
      x: eyes.leftEye.center.x - eyeDistance * 0.3,
      y: eyes.leftEye.center.y + eyeDistance * 0.4,
      width: eyeDistance * 0.5,
      height: eyeDistance * 0.5,
    };
    rois.push(leftCheekROI);

    // Right cheek ROI (secondary)
    const rightCheekROI: ROI = {
      x: eyes.rightEye.center.x - eyeDistance * 0.2,
      y: eyes.rightEye.center.y + eyeDistance * 0.4,
      width: eyeDistance * 0.5,
      height: eyeDistance * 0.5,
    };
    rois.push(rightCheekROI);

    return rois;
  } catch (error) {
    console.error('[ROI Selection] Error:', error);
    return [];
  }
}

/**
 * Extract average RGB color values from ROI
 */
export function extractColorFromROI(
  videoElement: HTMLVideoElement,
  roi: ROI
): { red: number; green: number; blue: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { red: 0, green: 0, blue: 0 };
  }

  canvas.width = Math.floor(roi.width);
  canvas.height = Math.floor(roi.height);

  // Draw ROI region to canvas
  ctx.drawImage(
    videoElement,
    Math.floor(roi.x),
    Math.floor(roi.y),
    Math.floor(roi.width),
    Math.floor(roi.height),
    0,
    0,
    Math.floor(roi.width),
    Math.floor(roi.height)
  );

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Calculate average RGB
  let r = 0, g = 0, b = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
  }

  return {
    red: r / pixelCount,
    green: g / pixelCount,
    blue: b / pixelCount,
  };
}

/**
 * Extract color from multiple ROIs and average
 */
export function extractColorFromMultipleROIs(
  videoElement: HTMLVideoElement,
  rois: ROI[]
): { red: number; green: number; blue: number } {
  if (rois.length === 0) {
    return { red: 0, green: 0, blue: 0 };
  }

  let totalRed = 0, totalGreen = 0, totalBlue = 0;

  for (const roi of rois) {
    const color = extractColorFromROI(videoElement, roi);
    totalRed += color.red;
    totalGreen += color.green;
    totalBlue += color.blue;
  }

  return {
    red: totalRed / rois.length,
    green: totalGreen / rois.length,
    blue: totalBlue / rois.length,
  };
}

/**
 * Draw ROI rectangles on canvas for visualization
 */
export function drawROIs(
  canvas: HTMLCanvasElement,
  rois: ROI[],
  color: string = '#00ff00'
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (const roi of rois) {
    ctx.strokeRect(
      Math.floor(roi.x),
      Math.floor(roi.y),
      Math.floor(roi.width),
      Math.floor(roi.height)
    );
  }
}
