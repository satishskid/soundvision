/**
 * Audio Utilities for Hearing Screening
 * Generates pure tones and manages audio playback
 */

export class AudioToneGenerator {
  private audioContext: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Generate and play a pure tone
   * @param frequency - Frequency in Hz
   * @param duration - Duration in milliseconds
   * @param volume - Volume level (0-1)
   * @param ear - Which ear to play to ('left', 'right', or 'both')
   */
  async playTone(
    frequency: number,
    duration: number,
    volume: number = 0.5,
    ear: 'left' | 'right' | 'both' = 'both'
  ): Promise<void> {
    if (this.isPlaying) {
      this.stopTone();
    }

    // Resume audio context if suspended (required by browser policies)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Create oscillator for pure tone
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    // Create panner for stereo control
    const panner = this.audioContext.createStereoPanner();
    if (ear === 'left') {
      panner.pan.setValueAtTime(-1, this.audioContext.currentTime);
    } else if (ear === 'right') {
      panner.pan.setValueAtTime(1, this.audioContext.currentTime);
    } else {
      panner.pan.setValueAtTime(0, this.audioContext.currentTime);
    }

    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(panner);
    panner.connect(this.audioContext.destination);

    // Start and stop
    this.oscillator.start(this.audioContext.currentTime);
    this.oscillator.stop(this.audioContext.currentTime + duration / 1000);
    this.isPlaying = true;

    // Wait for tone to finish
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isPlaying = false;
        resolve();
      }, duration);
    });
  }

  /**
   * Stop currently playing tone
   */
  stopTone(): void {
    if (this.oscillator && this.isPlaying) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Oscillator already stopped
      }
      this.isPlaying = false;
    }
  }

  /**
   * Convert dB HL to volume level (0-1)
   * This is a simplified conversion - actual calibration requires audiometer
   */
  dbHLToVolume(dbHL: number): number {
    // Reference: 0 dB HL ≈ 20 dB SPL at 1000 Hz
    // This is a rough approximation for web audio
    const minDB = -10;
    const maxDB = 100;
    const normalized = (dbHL - minDB) / (maxDB - minDB);
    return Math.max(0, Math.min(1, normalized * 0.8)); // Cap at 80% to prevent distortion
  }

  /**
   * Calibrate audio output (user-guided)
   */
  async calibrate(): Promise<number> {
    // Play reference tone and ask user to adjust to comfortable level
    // Returns calibration factor
    return 1.0; // Placeholder - implement user calibration flow
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopTone();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

/**
 * Speech audio player for speech-in-noise testing
 */
export class SpeechAudioPlayer {
  private audioContext: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;
  private speechSource: AudioBufferSourceNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Generate white noise
   */
  private generateWhiteNoise(duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    return buffer;
  }

  /**
   * Generate pink noise (more natural sounding)
   */
  private generatePinkNoise(duration: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // Adjust volume
        b6 = white * 0.115926;
      }
    }

    return buffer;
  }

  /**
   * Play speech with background noise at specified SNR
   * @param speechAudioUrl - URL to speech audio file
   * @param snr - Signal-to-Noise Ratio in dB
   * @param noiseType - Type of background noise
   */
  async playSpeechInNoise(
    speechAudioUrl: string,
    snr: number,
    noiseType: 'white' | 'pink' | 'babble' = 'pink'
  ): Promise<void> {
    // Resume audio context if needed
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Load speech audio
    const response = await fetch(speechAudioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const speechBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Generate noise
    const noiseBuffer = noiseType === 'white' 
      ? this.generateWhiteNoise(speechBuffer.duration)
      : this.generatePinkNoise(speechBuffer.duration);

    // Create sources
    this.speechSource = this.audioContext.createBufferSource();
    this.speechSource.buffer = speechBuffer;

    this.noiseSource = this.audioContext.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;

    // Create gain nodes for SNR control
    const speechGain = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();

    // Calculate gain values based on SNR
    // SNR (dB) = 20 * log10(signal/noise)
    const signalLevel = 0.7; // Base signal level
    const noiseLevel = signalLevel / Math.pow(10, snr / 20);

    speechGain.gain.setValueAtTime(signalLevel, this.audioContext.currentTime);
    noiseGain.gain.setValueAtTime(noiseLevel, this.audioContext.currentTime);

    // Connect nodes
    this.speechSource.connect(speechGain);
    this.noiseSource.connect(noiseGain);
    speechGain.connect(this.audioContext.destination);
    noiseGain.connect(this.audioContext.destination);

    // Play
    const startTime = this.audioContext.currentTime;
    this.speechSource.start(startTime);
    this.noiseSource.start(startTime);

    // Return promise that resolves when audio finishes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, speechBuffer.duration * 1000);
    });
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.speechSource) {
      try {
        this.speechSource.stop();
      } catch (e) {
        // Already stopped
      }
    }
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

/**
 * Text-to-Speech for word presentation
 */
export class TextToSpeech {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * Set preferred voice
   */
  async setVoice(language: string = 'en-US'): Promise<void> {
    const voices = await this.getVoices();
    this.voice = voices.find(v => v.lang.startsWith(language)) || voices[0];
  }

  /**
   * Speak text
   */
  async speak(
    text: string,
    rate: number = 1.0,
    pitch: number = 1.0,
    volume: number = 1.0
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    this.synth.cancel();
  }
}

/**
 * Audio level meter for ambient noise measurement
 */
export class AudioLevelMeter {
  private audioContext: AudioContext;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  /**
   * Start measuring ambient noise
   */
  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.microphone.connect(this.analyser);
    } catch (error) {
      throw new Error('Failed to access microphone for noise measurement');
    }
  }

  /**
   * Get current noise level in dB
   */
  getNoiseLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);

    // Convert to dB (approximate)
    const db = 20 * Math.log10(rms);
    return Math.max(0, db + 100); // Offset to get positive values
  }

  /**
   * Check if environment is quiet enough for testing
   */
  isQuietEnough(threshold: number = 40): boolean {
    return this.getNoiseLevel() < threshold;
  }

  /**
   * Stop measuring
   */
  stop(): void {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone.mediaStream.getTracks().forEach(track => track.stop());
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

/**
 * Headphone detection
 */
export async function detectHeadphones(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
    
    // Check if any output device suggests headphones
    const hasHeadphones = audioOutputs.some(device => 
      device.label.toLowerCase().includes('headphone') ||
      device.label.toLowerCase().includes('headset') ||
      device.label.toLowerCase().includes('earphone')
    );

    return hasHeadphones;
  } catch (error) {
    console.warn('Could not detect headphones:', error);
    return false;
  }
}

/**
 * Audio calibration helper
 */
export interface CalibrationResult {
  leftEarGain: number;
  rightEarGain: number;
  calibrated: boolean;
}

export async function calibrateAudio(
  toneGenerator: AudioToneGenerator
): Promise<CalibrationResult> {
  // This would involve:
  // 1. Playing reference tones
  // 2. User adjusting volume to comfortable level
  // 3. Measuring and storing calibration factors
  
  // Placeholder implementation
  return {
    leftEarGain: 1.0,
    rightEarGain: 1.0,
    calibrated: true,
  };
}

/**
 * Frequency response test
 */
export async function testFrequencyResponse(
  toneGenerator: AudioToneGenerator,
  frequencies: number[] = [250, 500, 1000, 2000, 4000, 8000]
): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>();
  
  for (const freq of frequencies) {
    await toneGenerator.playTone(freq, 1000, 0.5);
    // In actual implementation, wait for user response
    results.set(freq, true); // Placeholder
  }
  
  return results;
}

/**
 * Check audio output capabilities
 */
export interface AudioCapabilities {
  sampleRate: number;
  channels: number;
  latency: number;
  supported: boolean;
}

export async function checkAudioCapabilities(): Promise<AudioCapabilities> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const capabilities: AudioCapabilities = {
    sampleRate: audioContext.sampleRate,
    channels: audioContext.destination.maxChannelCount,
    latency: audioContext.baseLatency || 0,
    supported: true,
  };

  await audioContext.close();
  
  return capabilities;
}
