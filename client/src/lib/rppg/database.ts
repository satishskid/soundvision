/**
 * rPPG Database Integration
 * Save and load vital signs measurements
 */

import type {
  VitalSignsSession,
  VitalSignsResult,
  CalibrationData,
} from './types';

/**
 * Save vital signs session to database
 */
export async function saveVitalSignsSession(
  userId: string,
  result: VitalSignsResult,
  duration: number,
  notes?: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const session: VitalSignsSession = {
      id: crypto.randomUUID(),
      userId,
      sessionDate: new Date(),
      duration,
      signalQuality: result.overallQuality,
      notes,
    };

    const response = await fetch('/api/rppg/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session,
        heartRate: result.heartRate,
        hrv: result.hrv,
        spo2: result.spo2,
        bloodPressure: result.bloodPressure,
        respiratoryRate: result.respiratoryRate,
        healthScore: result.healthScore,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save session');
    }

    const data = await response.json();
    return { success: true, sessionId: data.sessionId };
  } catch (error) {
    console.error('[rPPG Database] Save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load vital signs history for user
 */
export async function loadVitalSignsHistory(
  userId: string,
  limit: number = 10
): Promise<{
  success: boolean;
  sessions?: VitalSignsSession[];
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/rppg/sessions?userId=${userId}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to load history');
    }

    const data = await response.json();
    return { success: true, sessions: data.sessions };
  } catch (error) {
    console.error('[rPPG Database] Load error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save blood pressure calibration
 */
export async function saveCalibration(
  calibration: CalibrationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/rppg/calibration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calibration),
    });

    if (!response.ok) {
      throw new Error('Failed to save calibration');
    }

    return { success: true };
  } catch (error) {
    console.error('[rPPG Database] Calibration save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load blood pressure calibration
 */
export async function loadCalibration(
  userId: string
): Promise<{
  success: boolean;
  calibration?: CalibrationData;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/rppg/calibration?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to load calibration');
    }

    const data = await response.json();
    return { success: true, calibration: data.calibration };
  } catch (error) {
    console.error('[rPPG Database] Calibration load error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get vital signs trends over time
 */
export async function getVitalSignsTrends(
  userId: string,
  days: number = 30
): Promise<{
  success: boolean;
  trends?: {
    dates: string[];
    heartRate: number[];
    hrv: number[];
    spo2: number[];
    systolic: number[];
    diastolic: number[];
    respiratoryRate: number[];
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/rppg/trends?userId=${userId}&days=${days}`
    );

    if (!response.ok) {
      throw new Error('Failed to load trends');
    }

    const data = await response.json();
    return { success: true, trends: data.trends };
  } catch (error) {
    console.error('[rPPG Database] Trends load error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a vital signs session
 */
export async function deleteVitalSignsSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/rppg/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    return { success: true };
  } catch (error) {
    console.error('[rPPG Database] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export vital signs data as CSV
 */
export async function exportVitalSignsCSV(
  userId: string
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const response = await fetch(`/api/rppg/export?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    const csv = await response.text();
    return { success: true, csv };
  } catch (error) {
    console.error('[rPPG Database] Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Local storage helpers (for offline support)
 */
export const localStorageHelpers = {
  saveSession: (session: VitalSignsSession) => {
    try {
      const sessions = localStorageHelpers.getSessions();
      sessions.push(session);
      localStorage.setItem('rppg_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('[rPPG Local] Save error:', error);
    }
  },

  getSessions: (): VitalSignsSession[] => {
    try {
      const data = localStorage.getItem('rppg_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[rPPG Local] Load error:', error);
      return [];
    }
  },

  saveCalibration: (calibration: CalibrationData) => {
    try {
      localStorage.setItem('rppg_calibration', JSON.stringify(calibration));
    } catch (error) {
      console.error('[rPPG Local] Calibration save error:', error);
    }
  },

  getCalibration: (): CalibrationData | null => {
    try {
      const data = localStorage.getItem('rppg_calibration');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[rPPG Local] Calibration load error:', error);
      return null;
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem('rppg_sessions');
      localStorage.removeItem('rppg_calibration');
    } catch (error) {
      console.error('[rPPG Local] Clear error:', error);
    }
  },
};
