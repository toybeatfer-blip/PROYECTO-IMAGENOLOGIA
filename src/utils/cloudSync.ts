import {
  ClinicAccount,
  SuperAdminContactInfo,
  CloudVaultPayload,
} from '../types';
import {
  getStoredClinics,
  saveStoredClinics,
  getStoredTombstones,
  saveStoredTombstones,
  getSuperAdminContact,
  saveSuperAdminContact,
} from './clinicDatabase';

export interface CloudSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

let currentStatus: CloudSyncStatus = {
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
};

export function getCloudSyncStatus(): CloudSyncStatus {
  return { ...currentStatus };
}

function updateStatus(updates: Partial<CloudSyncStatus>) {
  const hasChanged =
    (updates.isConnected !== undefined && updates.isConnected !== currentStatus.isConnected) ||
    (updates.isSyncing !== undefined && updates.isSyncing !== currentStatus.isSyncing) ||
    (updates.error !== undefined && updates.error !== currentStatus.error);

  currentStatus = { ...currentStatus, ...updates };
  if (hasChanged && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: currentStatus }));
  }
}

/**
 * Bidirectional Sync with Central Cloud Vault:
 * Pulls latest remote records, merges local modifications based on updatedAt,
 * respects tombstones, and saves the harmonized dataset both locally and remotely.
 */
export async function syncWithCloud(isSilent = false): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    updateStatus({ isConnected: false, isSyncing: false, error: 'Sin conexión a Internet' });
    return { success: false, error: 'Sin conexión a Internet' };
  }

  if (!isSilent) {
    updateStatus({ isSyncing: true, error: null });
  }

  try {
    const localClinics = getStoredClinics();
    const localContact = getSuperAdminContact();
    const localTombstones = getStoredTombstones();

    const response = await fetch('/api/cloud-sync/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinics: localClinics,
        superAdminContact: localContact,
        tombstones: localTombstones,
      }),
    });

    if (!response.ok) {
      throw new Error(`Respuesta no exitosa del servidor (${response.status})`);
    }

    const data = await response.json();
    if (!data.success || !data.vault) {
      throw new Error(data.error || 'Respuesta inválida del servidor');
    }

    const remoteVault: CloudVaultPayload = data.vault;
    const tombstonesSet = new Set<string>([
      ...localTombstones,
      ...(remoteVault.tombstones || []),
    ]);

    // Merge clinics map
    const mergedMap = new Map<string, ClinicAccount>();

    // 1. Process local
    for (const c of localClinics) {
      if (!tombstonesSet.has(c.id)) {
        mergedMap.set(c.id, c);
      }
    }

    // 2. Process remote with updatedAt comparison
    for (const remoteClinic of remoteVault.clinics || []) {
      if (tombstonesSet.has(remoteClinic.id)) {
        mergedMap.delete(remoteClinic.id);
        continue;
      }

      const existingLocal = mergedMap.get(remoteClinic.id);
      if (!existingLocal) {
        mergedMap.set(remoteClinic.id, remoteClinic);
      } else {
        const localTime = new Date(existingLocal.updatedAt || existingLocal.createdAt || 0).getTime();
        const remoteTime = new Date(remoteClinic.updatedAt || remoteClinic.createdAt || 0).getTime();
        if (remoteTime >= localTime) {
          mergedMap.set(remoteClinic.id, remoteClinic);
        }
      }
    }

    const harmonizedClinics = Array.from(mergedMap.values());
    const harmonizedTombstones = Array.from(tombstonesSet);

    // Save locally (saveStoredClinics prevents duplicate dispatches if data is unchanged)
    saveStoredClinics(harmonizedClinics);
    saveStoredTombstones(harmonizedTombstones);

    if (remoteVault.superAdminContact) {
      const localTime = new Date(localContact.updatedAt || 0).getTime();
      const remoteTime = new Date(remoteVault.superAdminContact.updatedAt || 0).getTime();
      if (remoteTime > localTime) {
        saveSuperAdminContact(remoteVault.superAdminContact);
      }
    }

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncTime: new Date(),
      error: null,
    });

    return { success: true };
  } catch (e: any) {
    updateStatus({
      isConnected: false,
      isSyncing: false,
      error: e.message || 'Error al conectar con la bóveda en la nube',
    });
    return { success: false, error: e.message };
  }
}

/**
 * Triggers an immediate cloud sync on mutation (e.g. create, update, delete, renew, suspend)
 */
export function triggerCloudPush(): void {
  syncWithCloud(true).catch(err => {
    console.error('Error en push inmediato a la nube:', err);
  });
}

/**
 * Starts automatic polling interval for cloud synchronization (1 minute cycle, silent mode)
 */
export function startCloudSyncPolling(intervalSeconds = 60): () => void {
  // Immediate initial silent sync
  syncWithCloud(true);

  const intervalId = setInterval(() => {
    syncWithCloud(true);
  }, intervalSeconds * 1000);

  return () => clearInterval(intervalId);
}
