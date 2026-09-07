import {
  ClinicAccount,
  SuperAdminContactInfo,
  LicenseEvaluation,
  LicenseState,
  SessionUser,
  ClinicSettings,
  Patient,
  Appointment,
  MedicalStudy,
} from '../types';

// ==========================================
// STORAGE KEYS DEFINITION
// ==========================================
export const CLINICS_MASTER_REGISTRY_KEY = 'clinics_master_registry_v1';
export const SUPERADMIN_CONTACT_KEY = 'superadmin_contact_info_v1';
export const TOMBSTONES_KEY = 'tombstones_deleted_clinics_v1';
export const SESSION_USER_KEY = 'active_session_user_v1';

export function getClinicRecordsKey(clinicId: string): string {
  return `records_clinic_${clinicId}`;
}

export function getClinicSettingsKey(clinicId: string): string {
  return `settings_clinic_${clinicId}`;
}

export function getClinicActiveRecordKey(clinicId: string): string {
  return `active_record_clinic_${clinicId}`;
}

// ==========================================
// RESILIENT ID GENERATOR (CRASH-PROOF)
// ==========================================
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback if restricted
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==========================================
// DEFAULT SUPER ADMIN CONTACT INFO
// ==========================================
export const DEFAULT_SUPERADMIN_CONTACT: SuperAdminContactInfo = {
  name: 'Fernando (Administrador Maestro)',
  phone: '+52 474 1539891',
  email: 'toybeatfer@gmail.com',
  helpMessage: 'Estimado doctor/a, para reactivar o renovar su suscripción mensual de su consultorio, comuníquese directamente con el Administrador por WhatsApp o correo electrónico.',
  updatedAt: '2026-09-04T00:00:00.000Z',
};

const DEFAULT_PHONES_BLACKLIST = [
  '+52 1 55 1234 5678',
  '+52 55 1234 5678',
  '55 1234 5678',
  '1234 5678',
  '+52 81 8300 0000',
  '0000 0000',
];

const DEFAULT_EMAILS_BLACKLIST = [
  'licencias@imagis-pacs.cloud',
  'admin@clinica.com',
  'super.admin@vetcare.master.com',
];

export function sanitizeSuperAdminContact(contact: Partial<SuperAdminContactInfo> | null | undefined): SuperAdminContactInfo {
  if (!contact || typeof contact !== 'object') {
    return { ...DEFAULT_SUPERADMIN_CONTACT };
  }
  const res: SuperAdminContactInfo = {
    ...DEFAULT_SUPERADMIN_CONTACT,
    ...contact,
  };
  const phone = (res.phone || '').trim();
  const email = (res.email || '').trim().toLowerCase();

  if (!phone || DEFAULT_PHONES_BLACKLIST.some(d => phone.includes(d))) {
    res.phone = DEFAULT_SUPERADMIN_CONTACT.phone;
  }
  if (!email || DEFAULT_EMAILS_BLACKLIST.some(d => email.includes(d))) {
    res.email = DEFAULT_SUPERADMIN_CONTACT.email;
  }
  return res;
}

// ==========================================
// BLANK SCHEMAS FOR CRASH-PROOF DEEP MERGE
// ==========================================
export const BLANK_CLINIC_SETTINGS: ClinicSettings = {
  tenantId: '',
  name: '',
  tagline: 'Centro de Diagnóstico por Imágenes & Radiología Médica',
  shortName: '',
  address: '',
  city: '',
  phone: '',
  emergencyPhone: '',
  email: '',
  website: '',
  ruc: '',
  directorName: '',
  directorTitle: 'Médico Titular',
  logoIcon: 'Layers',
  accentColor: 'cyan',
  enableDemoMode: false,
  enableBruteForceProtection: true,
  sessionTimeoutMinutes: 30,
};

export const BLANK_PATIENT: Patient = {
  id: '',
  dni: '',
  fullName: '',
  birthDate: '',
  age: 0,
  gender: 'OTRO',
  phone: '',
  email: '',
  address: '',
  bloodType: 'O+',
  insuranceProvider: 'Particular',
  policyNumber: '',
  emergencyContact: {
    name: '',
    relation: '',
    phone: '',
  },
  safetyProfile: {
    allergies: [],
    contrastAllergyHistory: false,
    hasPacemaker: false,
    hasMetalImplants: false,
    hasAneurysmClips: false,
    hasClaustrophobia: false,
    isPregnantOrPossible: false,
    diabeticOnMetformin: false,
  },
  createdAt: '',
  totalStudiesCount: 0,
};

// ==========================================
// DEEP MERGE BLANK (CRASH-PROOFING & SAFE MIGRATION)
// ==========================================
export function deepMergeBlank<T>(existing: Partial<T> | null | undefined, blankSchema: T): T {
  if (existing === null || existing === undefined) {
    return JSON.parse(JSON.stringify(blankSchema));
  }

  if (typeof blankSchema !== 'object' || blankSchema === null || Array.isArray(blankSchema)) {
    return (existing as T) !== undefined ? (existing as T) : JSON.parse(JSON.stringify(blankSchema));
  }

  const result: any = { ...(blankSchema as any) };

  for (const key of Object.keys(blankSchema as any)) {
    const defaultVal = (blankSchema as any)[key];
    const existingVal = (existing as any)[key];

    if (existingVal === undefined || existingVal === null) {
      result[key] = Array.isArray(defaultVal) ? [] : defaultVal;
    } else if (typeof defaultVal === 'object' && !Array.isArray(defaultVal) && defaultVal !== null) {
      result[key] = deepMergeBlank(existingVal, defaultVal);
    } else {
      result[key] = existingVal;
    }
  }

  return result as T;
}

// ==========================================
// LICENSE DURATION & EXPIRATION EVALUATOR
// ==========================================
export function calculateLicenseDays(validUntilIso: string, status?: LicenseState): LicenseEvaluation {
  if (status === 'suspended') {
    return {
      status: 'suspended',
      daysRemaining: 0,
      label: 'Cuenta Suspendida',
      isExpired: true,
      isSuspended: true,
      isActive: false,
    };
  }

  if (!validUntilIso) {
    return {
      status: 'expired',
      daysRemaining: 0,
      label: 'Sin Licencia Activa',
      isExpired: true,
      isSuspended: false,
      isActive: false,
    };
  }

  const now = new Date();
  // Normalizar a inicio de día UTC/Local
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [year, month, day] = validUntilIso.split('T')[0].split('-').map(Number);
  const expiryDate = new Date(year, (month || 1) - 1, day || 1).getTime();

  const diffMs = expiryDate - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      status: 'expired',
      daysRemaining: diffDays,
      label: overdue === 1 ? 'Vencida hace 1 día' : `Vencida hace ${overdue} días`,
      isExpired: true,
      isSuspended: false,
      isActive: false,
    };
  }

  return {
    status: 'active',
    daysRemaining: diffDays,
    label: diffDays === 0 ? 'Vence hoy' : diffDays === 1 ? '1 día restante' : `${diffDays} días restantes`,
    isExpired: false,
    isSuspended: false,
    isActive: true,
  };
}

// Helper to generate a 30-day expiration date string (YYYY-MM-DD)
export function getOneMonthFromNow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

// ==========================================
// MASTER CLINICS REPOSITORY (LOCALSTORAGE)
// ==========================================
export function getStoredClinics(): ClinicAccount[] {
  try {
    const raw = localStorage.getItem(CLINICS_MASTER_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error al leer clínicas del almacenamiento:', e);
    return [];
  }
}

export function saveStoredClinics(clinics: ClinicAccount[]): void {
  try {
    const rawNew = JSON.stringify(clinics);
    const rawOld = localStorage.getItem(CLINICS_MASTER_REGISTRY_KEY);
    if (rawNew === rawOld) {
      return; // No changes, avoid unnecessary re-renders
    }
    localStorage.setItem(CLINICS_MASTER_REGISTRY_KEY, rawNew);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clinics-updated', { detail: clinics }));
    }
  } catch (e) {
    console.error('Error al guardar clínicas en almacenamiento:', e);
  }
}

export function getStoredTombstones(): string[] {
  try {
    const raw = localStorage.getItem(TOMBSTONES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTombstones(tombstones: string[]): void {
  try {
    const rawNew = JSON.stringify(tombstones);
    const rawOld = localStorage.getItem(TOMBSTONES_KEY);
    if (rawNew === rawOld) {
      return;
    }
    localStorage.setItem(TOMBSTONES_KEY, rawNew);
  } catch (e) {
    console.error('Error al guardar tombstones:', e);
  }
}

export function getSuperAdminContact(): SuperAdminContactInfo {
  try {
    const raw = localStorage.getItem(SUPERADMIN_CONTACT_KEY);
    if (!raw) {
      saveSuperAdminContact(DEFAULT_SUPERADMIN_CONTACT);
      return DEFAULT_SUPERADMIN_CONTACT;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSuperAdminContact(parsed);
    if (sanitized.phone !== parsed.phone || sanitized.email !== parsed.email) {
      saveSuperAdminContact(sanitized);
    }
    return sanitized;
  } catch {
    return DEFAULT_SUPERADMIN_CONTACT;
  }
}

export function saveSuperAdminContact(contact: SuperAdminContactInfo): void {
  try {
    const sanitized = sanitizeSuperAdminContact(contact);
    const updated: SuperAdminContactInfo = {
      ...sanitized,
      updatedAt: sanitized.updatedAt || new Date().toISOString(),
    };
    const rawNew = JSON.stringify(updated);
    const rawOld = localStorage.getItem(SUPERADMIN_CONTACT_KEY);
    if (rawNew === rawOld) {
      return; // No changes, avoid unnecessary re-renders
    }
    localStorage.setItem(SUPERADMIN_CONTACT_KEY, rawNew);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superadmin-contact-updated', { detail: updated }));
    }
  } catch (e) {
    console.error('Error al guardar contacto del SuperAdmin:', e);
  }
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================
export function getActiveSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveSession(session: SessionUser | null): void {
  try {
    if (session) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-updated', { detail: session }));
    }
  } catch (e) {
    console.error('Error al guardar sesión activa:', e);
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_USER_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-updated', { detail: null }));
    }
  } catch (e) {
    console.error('Error al limpiar sesión:', e);
  }
}

// ==========================================
// REGISTRATION & CLINIC MANAGEMENT ACTIONS
// ==========================================
export interface RegisterClinicInput {
  clinicName: string;
  branch?: string;
  doctorName: string;
  doctorPrefix?: 'Dr.' | 'Dra.';
  generalLicense: string;
  specialtyLicense?: string;
  medicalSpecialty?: string;
  university?: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  address?: string;
}

export function registerNewClinic(input: RegisterClinicInput): { success: boolean; clinic?: ClinicAccount; error?: string } {
  try {
    const clinics = getStoredClinics();
    const cleanUsername = (input.username || '').trim().toLowerCase();

    if (!cleanUsername) {
      return { success: false, error: 'Debe especificar un nombre de usuario único.' };
    }

    if (cleanUsername === 'fernando' || cleanUsername === 'fernando01' || cleanUsername === 'superadmin') {
      return { success: false, error: 'El nombre de usuario ingresado está reservado por el sistema.' };
    }

    const exists = clinics.some(c => c.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, error: `El usuario "${cleanUsername}" ya se encuentra registrado. Elija otro.` };
    }

    const clinicId = `clinic-${generateUUID().substring(0, 8)}`;
    const now = new Date().toISOString();
    const validUntil = getOneMonthFromNow(); // 30 días de vigencia

    const newClinic: ClinicAccount = {
      id: clinicId,
      clinicName: input.clinicName.trim(),
      branch: (input.branch || 'Matriz / Sede Principal').trim(),
      doctorName: input.doctorName.trim(),
      doctorPrefix: input.doctorPrefix || 'Dr.',
      generalLicense: (input.generalLicense || '').trim(),
      specialtyLicense: (input.specialtyLicense || '').trim(),
      medicalSpecialty: (input.medicalSpecialty || 'Radiología e Imagenología Médica').trim(),
      university: (input.university || 'Universidad Nacional').trim(),
      username: cleanUsername,
      password: (input.password || 'admin123').trim(),
      phone: (input.phone || '').trim(),
      email: (input.email || '').trim(),
      address: (input.address || 'Dirección no especificada').trim(),
      licenseStatus: 'active',
      licenseValidUntil: validUntil,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Initialize totally blank databases for this clinic
    initializeBlankClinicDatabase(newClinic);

    // 2. Add to master registry
    const updated = [newClinic, ...clinics];
    saveStoredClinics(updated);

    return { success: true, clinic: newClinic };
  } catch (e: any) {
    return { success: false, error: e.message || 'Error inesperado al registrar el consultorio.' };
  }
}

export function initializeBlankClinicDatabase(clinic: ClinicAccount): void {
  const recordsKey = getClinicRecordsKey(clinic.id);
  const settingsKey = getClinicSettingsKey(clinic.id);
  const activeRecordKey = getClinicActiveRecordKey(clinic.id);

  // Totally blank patient/studies records
  localStorage.setItem(recordsKey, JSON.stringify([]));

  // Clean settings populated with registered doctor profile
  const initialSettings: ClinicSettings = {
    ...BLANK_CLINIC_SETTINGS,
    tenantId: clinic.id,
    name: clinic.clinicName,
    shortName: clinic.clinicName.slice(0, 20),
    directorName: `${clinic.doctorPrefix} ${clinic.doctorName}`,
    directorTitle: `${clinic.medicalSpecialty} - Céd. ${clinic.generalLicense}`,
    address: clinic.address,
    phone: clinic.phone,
    email: clinic.email,
    city: clinic.branch,
  };
  localStorage.setItem(settingsKey, JSON.stringify(initialSettings));
  localStorage.removeItem(activeRecordKey);
}

export function updateClinic(id: string, updates: Partial<ClinicAccount>): ClinicAccount | null {
  const clinics = getStoredClinics();
  const index = clinics.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = clinics[index];
  const updated: ClinicAccount = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  clinics[index] = updated;
  saveStoredClinics(clinics);

  // Sync settings if doctorName or clinicName changed
  if (updates.clinicName || updates.doctorName || updates.address || updates.phone || updates.email) {
    const settingsKey = getClinicSettingsKey(id);
    const existingRaw = localStorage.getItem(settingsKey);
    const existingSettings = existingRaw ? JSON.parse(existingRaw) : BLANK_CLINIC_SETTINGS;
    const newSettings: ClinicSettings = {
      ...existingSettings,
      name: updated.clinicName,
      directorName: `${updated.doctorPrefix} ${updated.doctorName}`,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
    };
    localStorage.setItem(settingsKey, JSON.stringify(newSettings));
  }

  return updated;
}

export function renewClinicLicense(id: string, monthsToAdd = 1): ClinicAccount | null {
  const clinics = getStoredClinics();
  const index = clinics.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = clinics[index];
  const currentExpiry = new Date(current.licenseValidUntil || new Date());
  const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();

  baseDate.setDate(baseDate.getDate() + 30 * monthsToAdd);
  const newExpiryIso = baseDate.toISOString().split('T')[0];

  const updated: ClinicAccount = {
    ...current,
    licenseStatus: 'active',
    licenseValidUntil: newExpiryIso,
    updatedAt: new Date().toISOString(),
  };

  clinics[index] = updated;
  saveStoredClinics(clinics);
  return updated;
}

export function toggleClinicSuspension(id: string): ClinicAccount | null {
  const clinics = getStoredClinics();
  const index = clinics.findIndex(c => c.id === id);
  if (index === -1) return null;

  const current = clinics[index];
  const nextStatus: LicenseState = current.licenseStatus === 'suspended' ? 'active' : 'suspended';

  const updated: ClinicAccount = {
    ...current,
    licenseStatus: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  clinics[index] = updated;
  saveStoredClinics(clinics);
  return updated;
}

export function deleteClinicPermanently(id: string): boolean {
  const clinics = getStoredClinics();
  const filtered = clinics.filter(c => c.id !== id);

  // 1. Save filtered list
  saveStoredClinics(filtered);

  // 2. Add to tombstones list so cloud sync doesn't resurrect it
  const tombstones = getStoredTombstones();
  if (!tombstones.includes(id)) {
    saveStoredTombstones([...tombstones, id]);
  }

  // 3. Clear isolated local databases for this clinic
  try {
    localStorage.removeItem(getClinicRecordsKey(id));
    localStorage.removeItem(getClinicSettingsKey(id));
    localStorage.removeItem(getClinicActiveRecordKey(id));
  } catch (e) {
    console.error('Error al limpiar base de datos local de clínica eliminada:', e);
  }

  return true;
}

// ==========================================
// ISOLATED DATABASE READERS & WRITERS PER CLINIC
// ==========================================
export function getClinicPatients(clinicId: string): Patient[] {
  try {
    const raw = localStorage.getItem(getClinicRecordsKey(clinicId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClinicPatients(clinicId: string, patients: Patient[]): void {
  try {
    localStorage.setItem(getClinicRecordsKey(clinicId), JSON.stringify(patients));
  } catch (e) {
    console.error('Error al guardar pacientes de clínica:', e);
  }
}

export function getClinicSettings(clinicId: string): ClinicSettings {
  try {
    const raw = localStorage.getItem(getClinicSettingsKey(clinicId));
    if (!raw) return { ...BLANK_CLINIC_SETTINGS, tenantId: clinicId };
    return deepMergeBlank(JSON.parse(raw), { ...BLANK_CLINIC_SETTINGS, tenantId: clinicId });
  } catch {
    return { ...BLANK_CLINIC_SETTINGS, tenantId: clinicId };
  }
}

export function saveClinicSettings(clinicId: string, settings: ClinicSettings): void {
  try {
    localStorage.setItem(getClinicSettingsKey(clinicId), JSON.stringify(settings));
  } catch (e) {
    console.error('Error al guardar configuración de clínica:', e);
  }
}

// ==========================================
// DEEP RECOVERY SCANNER
// Scans storage for orphaned legacy tenants or records
// ==========================================
export function deepRecoveryScanner(): { recoveredCount: number; clinics: ClinicAccount[] } {
  try {
    const currentClinics = getStoredClinics();
    const existingIds = new Set(currentClinics.map(c => c.id));
    const existingUsernames = new Set(currentClinics.map(c => c.username.toLowerCase()));
    const recovered: ClinicAccount[] = [...currentClinics];
    let newCount = 0;

    // Scan for legacy tenants v2 key
    const legacyTenantsRaw = localStorage.getItem('consultorio_imagenologia_tenants_v2');
    if (legacyTenantsRaw) {
      try {
        const legacyTenants = JSON.parse(legacyTenantsRaw);
        if (Array.isArray(legacyTenants)) {
          for (const t of legacyTenants) {
            const id = t.id || `clinic-legacy-${generateUUID().substring(0, 6)}`;
            const username = (t.slug || t.name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 15);

            if (!existingIds.has(id) && !existingUsernames.has(username.toLowerCase())) {
              const account: ClinicAccount = {
                id,
                clinicName: t.name || 'Clínica Recuperada',
                branch: t.settings?.city || 'Sede Principal',
                doctorName: t.settings?.directorName || 'Médico Titular',
                doctorPrefix: 'Dr.',
                generalLicense: t.settings?.ruc || '10445588',
                specialtyLicense: '',
                medicalSpecialty: 'Radiología e Imagenología',
                university: 'Facultad de Medicina',
                username: username || `clinic_${id}`,
                password: 'admin123',
                phone: t.settings?.phone || '',
                email: t.settings?.email || '',
                address: t.settings?.address || '',
                licenseStatus: t.status === 'SUSPENDED' ? 'suspended' : 'active',
                licenseValidUntil: t.license?.expirationDate || getOneMonthFromNow(),
                createdAt: t.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              recovered.push(account);
              existingIds.add(id);
              existingUsernames.add(username.toLowerCase());
              newCount++;
            }
          }
        }
      } catch (e) {
        console.error('Error al analizar tenants legados:', e);
      }
    }

    // Scan all keys in localStorage for records_clinic_* or tenant-*
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith('records_clinic_')) {
        const clinicId = key.replace('records_clinic_', '');
        if (!existingIds.has(clinicId)) {
          const account: ClinicAccount = {
            id: clinicId,
            clinicName: `Consultorio Recuperado (${clinicId.slice(-4)})`,
            branch: 'Sede Local',
            doctorName: 'Médico Titular',
            doctorPrefix: 'Dr.',
            generalLicense: '',
            specialtyLicense: '',
            medicalSpecialty: 'Radiología e Imagenología',
            university: '',
            username: `user_${clinicId.slice(-6)}`,
            password: 'admin123',
            phone: '',
            email: '',
            address: '',
            licenseStatus: 'active',
            licenseValidUntil: getOneMonthFromNow(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          recovered.push(account);
          existingIds.add(clinicId);
          newCount++;
        }
      }
    }

    if (newCount > 0) {
      saveStoredClinics(recovered);
    }

    return { recoveredCount: newCount, clinics: recovered };
  } catch (e) {
    console.error('Error en escáner de recuperación:', e);
    return { recoveredCount: 0, clinics: getStoredClinics() };
  }
}
