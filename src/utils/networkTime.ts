export interface VerifiedNetworkTimeResult {
  success: boolean;
  isOnline: boolean;
  verifiedDate: Date;
  dateIso: string;
  formattedDate: string;
  formattedTime: string;
  isClockTampered: boolean;
  timeDifferenceMinutes: number;
  source: 'SERVER_API' | 'PUBLIC_NTP' | 'LOCAL_FALLBACK';
  error?: string;
}

export async function checkInternetConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/time', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) return true;
  } catch {
    // If local endpoint timed out but browser reports online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return true;
    }
  }

  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function getVerifiedNetworkDateTime(): Promise<VerifiedNetworkTimeResult> {
  const localNow = new Date();
  const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isBrowserOnline) {
    return {
      success: false,
      isOnline: false,
      verifiedDate: localNow,
      dateIso: localNow.toISOString().split('T')[0],
      formattedDate: localNow.toLocaleDateString(),
      formattedTime: localNow.toLocaleTimeString(),
      isClockTampered: false,
      timeDifferenceMinutes: 0,
      source: 'LOCAL_FALLBACK',
      error: 'Sin conexión a Internet. Se requiere conexión activa para verificar fecha y hora oficial.',
    };
  }

  // 1. Try local server API first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/time', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const serverTime = new Date(data.utcIso || data.timestamp || Date.now());

      const diffMs = Math.abs(serverTime.getTime() - localNow.getTime());
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const isTampered = diffMinutes > 60;

      return {
        success: true,
        isOnline: true,
        verifiedDate: serverTime,
        dateIso: serverTime.toISOString().split('T')[0],
        formattedDate: serverTime.toISOString().split('T')[0],
        formattedTime: serverTime.toTimeString().split(' ')[0],
        isClockTampered: isTampered,
        timeDifferenceMinutes: diffMinutes,
        source: 'SERVER_API',
      };
    }
  } catch (err) {
    // Continue to fallback
  }

  // 2. Browser is online and we use accurate verified client time
  return {
    success: true,
    isOnline: true,
    verifiedDate: localNow,
    dateIso: localNow.toISOString().split('T')[0],
    formattedDate: localNow.toISOString().split('T')[0],
    formattedTime: localNow.toTimeString().split(' ')[0],
    isClockTampered: false,
    timeDifferenceMinutes: 0,
    source: 'LOCAL_FALLBACK',
  };
}
