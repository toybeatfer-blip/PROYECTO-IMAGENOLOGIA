// ==========================================
// DUAL-SCREEN / MULTI-WINDOW BROADCAST CHANNEL & LAUNCHER
// ==========================================

const CHANNEL_NAME = 'imagis_pacs_sync_channel';

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel no soportado en este navegador:', e);
  }
}

/**
 * Opens a dedicated standalone DICOM Medical Image Viewer in a detached popup window
 * perfectly sized for secondary monitors (Dual-Screen Diagnostic Workstations).
 */
export function openStudyInStandaloneWindow(studyId: string): Window | null {
  if (typeof window === 'undefined') return null;

  const url = `${window.location.origin}${window.location.pathname}#viewer?studyId=${encodeURIComponent(studyId)}`;
  const windowFeatures = [
    'width=1600',
    'height=1000',
    'left=100',
    'top=60',
    'resizable=yes',
    'scrollbars=yes',
    'status=no',
    'toolbar=no',
    'menubar=no',
    'location=no',
  ].join(',');

  const popup = window.open(url, `imagis_pacs_viewer_${studyId}`, windowFeatures);
  if (popup) {
    popup.focus();
  }

  // Broadcast study selection so any already-opened standalone window updates
  broadcastStudySelection(studyId);

  return popup;
}

/**
 * Broadcasts a study selection event to all open tabs and secondary windows
 */
export function broadcastStudySelection(studyId: string): void {
  if (syncChannel) {
    try {
      syncChannel.postMessage({
        type: 'SELECT_STUDY',
        studyId,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Error al transmitir selección de estudio:', e);
    }
  }

  // Fallback via LocalStorage for cross-window sync
  try {
    localStorage.setItem('pacs_active_study_broadcast', JSON.stringify({ studyId, timestamp: Date.now() }));
  } catch {
    // Ignore
  }
}

/**
 * Subscribes to inter-window study selection and synchronization events
 */
export function onBroadcastMessage(callback: (data: { type: string; studyId?: string; [key: string]: any }) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (e: MessageEvent) => {
    if (e.data) {
      callback(e.data);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'pacs_active_study_broadcast' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback({ type: 'SELECT_STUDY', studyId: parsed.studyId });
      } catch {
        // Ignore
      }
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}
