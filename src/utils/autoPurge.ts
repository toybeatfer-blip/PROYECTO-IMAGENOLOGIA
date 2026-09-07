/**
 * Auto-Purga y Limpieza Automática al Iniciar (Cache-Busting & Version Sync)
 * 
 * Garantiza que ningún dispositivo (computadoras, tablets o celulares) muestre
 * código obsoleto, cachés de navegador viejas (ServiceWorkers/CacheStorage) o
 * registros de prueba residuales de versiones anteriores.
 */

export const CURRENT_APP_VERSION = '2026.09.07-v3.0';
const VERSION_STORAGE_KEY = 'IMAGIS_APP_VERSION';
const LAST_PURGE_KEY = 'IMAGIS_LAST_PURGE_AT';
const RELOAD_GUARD_KEY = 'IMAGIS_PURGE_RELOAD_GUARD';

// Claves de almacenamiento local de pruebas a sanear
const OBSOLETE_MOCK_KEYS = [
  'consultorio_imagenologia_appointments_v2',
  'consultorio_imagenologia_patients_v2',
  'consultorio_imagenologia_studies_v2',
  'consultorio_imagenologia_notif_logs_v2',
  'consultorio_imagenologia_app_requests_v2',
];

// Identificadores típicos de datos simulados antiguos
const MOCK_ID_PATTERNS = ['apt-1', 'apt-2', 'pat-1', 'pat-2', 'study-1', 'study-2', '2026-08-14', '2026-08-15'];

/**
 * Inspecciona un array guardado y retira elementos de prueba obsoletos
 */
function cleanObsoleteMockRecords(key: string): void {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    const cleaned = parsed.filter(item => {
      if (!item || typeof item !== 'object') return false;
      const str = JSON.stringify(item);
      const isMock = MOCK_ID_PATTERNS.some(pat => str.includes(pat));
      return !isMock;
    });

    if (cleaned.length !== parsed.length) {
      console.log(`[Auto-Purga] Se eliminaron ${parsed.length - cleaned.length} registros obsoletos de "${key}".`);
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
  } catch (err) {
    console.warn(`[Auto-Purga] Error saneando "${key}":`, err);
  }
}

/**
 * Ejecuta la purga integral de cachés y registros obsoletos
 */
export async function executeAutoPurgeAndCleanCache(force = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    const isOutdated = storedVersion !== CURRENT_APP_VERSION;

    if (!isOutdated && !force) {
      return false;
    }

    console.log(`[Auto-Purga] Iniciando sincronización de versión: ${storedVersion || 'Nueva'} ➔ ${CURRENT_APP_VERSION}`);

    // 1. Eliminar CacheStorage del navegador (Safari, Chrome, Firefox)
    if ('caches' in window) {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log(`[Auto-Purga] CacheStorage purgado (${cacheKeys.length} almacenes).`);
      } catch (cacheErr) {
        console.warn('[Auto-Purga] Error limpiando CacheStorage:', cacheErr);
      }
    }

    // 2. Desregistrar Service Workers viejos que pudieran retener HTML/JS en disco
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
          console.log('[Auto-Purga] Service Worker obsoleto desregistrado:', reg.scope);
        }
      } catch (swErr) {
        console.warn('[Auto-Purga] Error desregistrando Service Workers:', swErr);
      }
    }

    // 3. Purgar datos de prueba obsoletos de localStorage
    for (const key of OBSOLETE_MOCK_KEYS) {
      cleanObsoleteMockRecords(key);
    }

    // 4. Limpiar datos de sesión temporales
    try {
      sessionStorage.clear();
    } catch {
      // ignorar
    }

    // 5. Registrar nueva versión y fecha de purga
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_APP_VERSION);
    localStorage.setItem(LAST_PURGE_KEY, new Date().toISOString());

    // 6. Evitar recargas infinitas usando un guard en sessionStorage
    const reloadGuard = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!reloadGuard && isOutdated) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, 'true');
      console.log('[Auto-Purga] Recargando aplicación para cargar activos nuevos...');
      // Recarga forzada desde el servidor
      window.location.reload();
      return true;
    }

    return true;
  } catch (error) {
    console.error('[Auto-Purga] Error crítico durante la auto-purga:', error);
    return false;
  }
}

/**
 * Inicializa escuchadores en segundo plano para actualizar automáticamente
 * cuando un dispositivo (móvil, tablet o PC) recupera el foco o la conexión.
 */
export function initAutoUpdateBackgroundListener(): void {
  if (typeof window === 'undefined') return;

  const checkForRemoteUpdates = async () => {
    if (!navigator.onLine) return;
    try {
      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version && data.version !== CURRENT_APP_VERSION) {
          console.log(`[Auto-Purga] Nueva versión detectada en servidor: ${data.version}. Actualizando...`);
          await executeAutoPurgeAndCleanCache(true);
          window.location.reload();
        }
      }
    } catch {
      // Silencioso en modo offline o desarrollo
    }
  };

  // Verificar cuando el usuario desbloquea o cambia de app al navegador móvil
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForRemoteUpdates();
    }
  });

  // Verificar al recuperar conexión a Internet
  window.addEventListener('online', () => {
    checkForRemoteUpdates();
  });

  // Chequeo periódico cada 15 minutos en background
  setInterval(checkForRemoteUpdates, 15 * 60 * 1000);
}
