import {
  Tenant,
  Patient,
  Appointment,
  MedicalStudy,
  RadiologyReport,
  NotificationSettings,
  NotificationLog,
  PatientAppointmentRequest,
  ClinicSettings,
  StaffUser,
} from '../types';
import {
  DEFAULT_TENANT_ID,
  INITIAL_TENANTS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_STUDIES,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_NOTIFICATION_LOGS,
  INITIAL_APPOINTMENT_REQUESTS,
  INITIAL_CLINIC_SETTINGS,
  INITIAL_STAFF_USERS,
} from '../data/initialData';
import { createDefaultTenantLicense } from './license';

// Multi-Tenant LocalStorage Keys
const TENANTS_STORAGE_KEY = 'consultorio_imagenologia_tenants_v2';
const ACTIVE_TENANT_STORAGE_KEY = 'consultorio_imagenologia_active_tenant_v2';
const PATIENTS_STORAGE_KEY = 'consultorio_imagenologia_patients_v2';
const APPOINTMENTS_STORAGE_KEY = 'consultorio_imagenologia_appointments_v2';
const STUDIES_STORAGE_KEY = 'consultorio_imagenologia_studies_v2';
const NOTIFICATION_SETTINGS_KEY = 'consultorio_imagenologia_notif_settings_v2';
const NOTIFICATION_LOGS_KEY = 'consultorio_imagenologia_notif_logs_v2';
const APPOINTMENT_REQUESTS_KEY = 'consultorio_imagenologia_app_requests_v2';
const STAFF_USERS_STORAGE_KEY = 'consultorio_imagenologia_staff_users_v2';
const CURRENT_STAFF_STORAGE_KEY = 'consultorio_imagenologia_current_staff_v2';

// ==========================================
// TENANTS MANAGEMENT
// ==========================================

export function getStoredTenants(): Tenant[] {
  try {
    const raw = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (!raw) {
      saveStoredTenants(INITIAL_TENANTS);
      return INITIAL_TENANTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TENANTS;
  } catch (e) {
    console.error('Error reading tenants from storage:', e);
    return INITIAL_TENANTS;
  }
}

export function saveStoredTenants(tenants: Tenant[]): void {
  try {
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
  } catch (e) {
    console.error('Error saving tenants to storage:', e);
  }
}

export function getStoredActiveTenantId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY);
    if (saved && getStoredTenants().some(t => t.id === saved)) {
      return saved;
    }
    return DEFAULT_TENANT_ID;
  } catch {
    return DEFAULT_TENANT_ID;
  }
}

export function saveStoredActiveTenantId(tenantId: string): void {
  try {
    localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenantId);
  } catch (e) {
    console.error('Error saving active tenant id:', e);
  }
}

export function getStoredActiveTenant(tenantId?: string): Tenant {
  const targetId = tenantId || getStoredActiveTenantId();
  const allTenants = getStoredTenants();
  return allTenants.find(t => t.id === targetId) || allTenants[0] || INITIAL_TENANTS[0];
}

export function createNewTenant(data: {
  name: string;
  slug?: string;
  plan?: Tenant['plan'];
  settings: Partial<ClinicSettings>;
}): Tenant {
  const allTenants = getStoredTenants();
  const slug = (data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  const id = `tenant-${slug}-${Date.now().toString().slice(-4)}`;

  const newSettings: ClinicSettings = {
    ...INITIAL_CLINIC_SETTINGS,
    ...data.settings,
    tenantId: id,
    name: data.name,
    shortName: data.settings.shortName || data.name,
  };

  const newLicense = createDefaultTenantLicense(data.plan === 'ENTERPRISE_PACS' ? 'ANNUAL' : 'MONTHLY', data.plan === 'ENTERPRISE_PACS' ? 12 : 1);

  const newTenant: Tenant = {
    id,
    slug,
    name: data.name,
    status: 'ACTIVE',
    plan: data.plan || 'CLINICA_BASIC',
    createdAt: new Date().toISOString().split('T')[0],
    settings: { ...newSettings, license: newLicense },
    license: newLicense,
  };

  const updatedTenants = [...allTenants, newTenant];
  saveStoredTenants(updatedTenants);

  // Initialize initial admin for this new tenant
  const allStaff = getStoredStaffUsers();
  const newAdmin: StaffUser = {
    id: `usr-admin-${id}`,
    tenantId: id,
    username: `admin_${slug}`,
    password: 'admin123',
    fullName: newSettings.directorName || `Director ${data.name}`,
    role: 'ADMIN',
    email: newSettings.email || `admin@${slug}.com`,
    position: 'Director Médico / Administrador',
    avatarIcon: 'ShieldCheck',
  };
  saveStaffUsers([...allStaff, newAdmin]);

  return newTenant;
}

// ==========================================
// ==========================================
// PATIENTS STORAGE (MULTI-TENANT)
// ==========================================

export function getStoredPatients(tenantId?: string): Patient[] {
  try {
    const raw = localStorage.getItem(PATIENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_PATIENTS;
    const allPatients: Patient[] = Array.isArray(parsed) ? parsed : (Array.isArray(INITIAL_PATIENTS) ? INITIAL_PATIENTS : []);
    if (!raw) {
      savePatients(allPatients);
    }
    if (tenantId) {
      return allPatients.filter(p => p && (p.tenantId || DEFAULT_TENANT_ID) === tenantId);
    }
    return allPatients;
  } catch (e) {
    console.error('Error reading patients from storage:', e);
    return [];
  }
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(Array.isArray(patients) ? patients : []));
  } catch (e) {
    console.error('Error saving patients to storage:', e);
  }
}

export function saveStoredPatients(patients: Patient[]): void {
  savePatients(patients);
}

// ==========================================
// APPOINTMENTS STORAGE (MULTI-TENANT)
// ==========================================

export function getStoredAppointments(tenantId?: string): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_APPOINTMENTS;
    const allApps: Appointment[] = Array.isArray(parsed) ? parsed : (Array.isArray(INITIAL_APPOINTMENTS) ? INITIAL_APPOINTMENTS : []);
    if (!raw) {
      saveAppointments(allApps);
    }
    if (tenantId) {
      return allApps.filter(a => a && (a.tenantId || DEFAULT_TENANT_ID) === tenantId);
    }
    return allApps;
  } catch (e) {
    console.error('Error reading appointments from storage:', e);
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(Array.isArray(appointments) ? appointments : []));
  } catch (e) {
    console.error('Error saving appointments to storage:', e);
  }
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  saveAppointments(appointments);
}

// ==========================================
// MEDICAL STUDIES STORAGE (MULTI-TENANT)
// ==========================================

export function getStoredStudies(tenantId?: string): MedicalStudy[] {
  try {
    const raw = localStorage.getItem(STUDIES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_STUDIES;
    const allStudies: MedicalStudy[] = Array.isArray(parsed) ? parsed : (Array.isArray(INITIAL_STUDIES) ? INITIAL_STUDIES : []);
    if (!raw) {
      saveStudies(allStudies);
    }
    if (tenantId) {
      return allStudies.filter(s => s && (s.tenantId || DEFAULT_TENANT_ID) === tenantId);
    }
    return allStudies;
  } catch (e) {
    console.error('Error reading studies from storage:', e);
    return [];
  }
}

export function saveStudies(studies: MedicalStudy[]): void {
  try {
    localStorage.setItem(STUDIES_STORAGE_KEY, JSON.stringify(Array.isArray(studies) ? studies : []));
  } catch (e) {
    console.error('Error saving studies to storage:', e);
  }
}

export function saveStoredStudies(studies: MedicalStudy[]): void {
  saveStudies(studies);
}

// ==========================================
// NOTIFICATION SETTINGS & LOGS (MULTI-TENANT)
// ==========================================

export function getStoredNotificationSettings(tenantId?: string): NotificationSettings {
  try {
    const key = tenantId ? `${NOTIFICATION_SETTINGS_KEY}_${tenantId}` : NOTIFICATION_SETTINGS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) {
      const activeTenant = getStoredActiveTenant(tenantId);
      const settingsWithTenant: NotificationSettings = {
        ...INITIAL_NOTIFICATION_SETTINGS,
        tenantId: activeTenant.id,
        senderName: activeTenant.settings.name,
        senderEmail: activeTenant.settings.email,
        senderPhone: activeTenant.settings.phone,
      };
      saveStoredNotificationSettings(settingsWithTenant, tenantId);
      return settingsWithTenant;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading notification settings:', e);
    return INITIAL_NOTIFICATION_SETTINGS;
  }
}

export function saveStoredNotificationSettings(settings: NotificationSettings, tenantId?: string): void {
  try {
    const key = tenantId ? `${NOTIFICATION_SETTINGS_KEY}_${tenantId}` : NOTIFICATION_SETTINGS_KEY;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving notification settings:', e);
  }
}

export function getStoredNotificationLogs(tenantId?: string): NotificationLog[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_LOGS_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_NOTIFICATION_LOGS;
    const allLogs: NotificationLog[] = Array.isArray(parsed) ? parsed : (Array.isArray(INITIAL_NOTIFICATION_LOGS) ? INITIAL_NOTIFICATION_LOGS : []);
    if (!raw) {
      saveStoredNotificationLogs(allLogs);
    }
    if (tenantId) {
      return allLogs.filter(l => l && (l.tenantId || DEFAULT_TENANT_ID) === tenantId);
    }
    return allLogs;
  } catch (e) {
    console.error('Error reading notification logs:', e);
    return [];
  }
}

export function saveStoredNotificationLogs(logs: NotificationLog[]): void {
  try {
    localStorage.setItem(NOTIFICATION_LOGS_KEY, JSON.stringify(Array.isArray(logs) ? logs : []));
  } catch (e) {
    console.error('Error saving notification logs:', e);
  }
}

// ==========================================
// APPOINTMENT REQUESTS (MULTI-TENANT)
// ==========================================

export function getStoredAppointmentRequests(tenantId?: string): PatientAppointmentRequest[] {
  try {
    const raw = localStorage.getItem(APPOINTMENT_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_APPOINTMENT_REQUESTS;
    const allRequests: PatientAppointmentRequest[] = Array.isArray(parsed) ? parsed : (Array.isArray(INITIAL_APPOINTMENT_REQUESTS) ? INITIAL_APPOINTMENT_REQUESTS : []);
    if (!raw) {
      saveStoredAppointmentRequests(allRequests);
    }
    if (tenantId) {
      return allRequests.filter(r => r && (r.tenantId || DEFAULT_TENANT_ID) === tenantId);
    }
    return allRequests;
  } catch (e) {
    console.error('Error reading appointment requests:', e);
    return [];
  }
}

export function saveStoredAppointmentRequests(requests: PatientAppointmentRequest[]): void {
  try {
    localStorage.setItem(APPOINTMENT_REQUESTS_KEY, JSON.stringify(Array.isArray(requests) ? requests : []));
  } catch (e) {
    console.error('Error saving appointment requests:', e);
  }
}

// ==========================================
// CLINIC SETTINGS (MULTI-TENANT)
// ==========================================

export function getStoredClinicSettings(tenantId?: string): ClinicSettings {
  try {
    const targetId = tenantId || getStoredActiveTenantId();
    const activeTenant = getStoredActiveTenant(targetId);
    return activeTenant.settings || INITIAL_CLINIC_SETTINGS;
  } catch (e) {
    console.error('Error reading clinic settings:', e);
    return INITIAL_CLINIC_SETTINGS;
  }
}

export function saveStoredClinicSettings(settings: ClinicSettings, tenantId?: string): void {
  try {
    const targetId = tenantId || settings.tenantId || getStoredActiveTenantId();
    const allTenants = getStoredTenants();
    const updatedTenants = allTenants.map(t =>
      t.id === targetId
        ? {
            ...t,
            name: settings.name,
            settings: { ...settings, tenantId: targetId },
            license: settings.license || t.license,
          }
        : t
    );
    saveStoredTenants(updatedTenants);
  } catch (e) {
    console.error('Error saving clinic settings:', e);
  }
}

// ==========================================
// STAFF USERS & AUTHENTICATION (MULTI-TENANT)
// ==========================================

export function getStoredStaffUsers(tenantId?: string): StaffUser[] {
  try {
    const raw = localStorage.getItem(STAFF_USERS_STORAGE_KEY);
    let allUsers: StaffUser[] = raw ? JSON.parse(raw) : INITIAL_STAFF_USERS;
    if (!raw || !Array.isArray(allUsers) || allUsers.length === 0) {
      saveStaffUsers(INITIAL_STAFF_USERS);
      allUsers = INITIAL_STAFF_USERS;
    }

    // Repair any missing passwords and guarantee Master Creator credentials
    const fixed: StaffUser[] = allUsers.map(u => {
      if (u.id === 'usr-master-creator' || u.role === 'SUPER_ADMIN' || u.isSuperAdmin) {
        return {
          ...u,
          id: 'usr-master-creator',
          tenantId: 'GLOBAL',
          username: 'Fernando',
          password: 'Bazzoka1313AS.',
          fullName: 'Fernando (Creador del Sistema)',
          role: 'SUPER_ADMIN',
          email: 'fernando@imagis-pacs.cloud',
          position: 'Creador & Arquitecto Global SaaS',
          avatarIcon: 'Crown',
          isSuperAdmin: true,
          isProtected: true,
        };
      }
      const initMatch = INITIAL_STAFF_USERS.find(
        init => init.id === u.id || init.username.toLowerCase() === u.username.toLowerCase()
      );
      return {
        ...initMatch,
        ...u,
        tenantId: u.tenantId || DEFAULT_TENANT_ID,
        password: u.password || (initMatch ? initMatch.password : u.role === 'ADMIN' ? 'admin123' : 'staff123'),
      };
    });

    if (tenantId) {
      const tenantUsers = fixed.filter(u => (u.tenantId || DEFAULT_TENANT_ID) === tenantId);
      // Guarantee at least one admin for the tenant
      if (!tenantUsers.some(u => u.role === 'ADMIN')) {
        const fallbackAdmin: StaffUser = {
          id: `usr-admin-${tenantId}`,
          tenantId: tenantId,
          username: `admin_${tenantId.replace('tenant-', '')}`,
          password: 'admin123',
          fullName: `Administrador ${tenantId}`,
          role: 'ADMIN',
          email: `admin@${tenantId}.com`,
          position: 'Director Médico',
          avatarIcon: 'ShieldCheck',
        };
        return [...tenantUsers, fallbackAdmin];
      }
      return tenantUsers;
    }

    return fixed;
  } catch (e) {
    console.error('Error reading staff users from storage:', e);
    return tenantId ? INITIAL_STAFF_USERS.filter(u => u.tenantId === tenantId) : INITIAL_STAFF_USERS;
  }
}

export function saveStaffUsers(users: StaffUser[]): void {
  try {
    localStorage.setItem(STAFF_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving staff users to storage:', e);
  }
}

export function getStoredCurrentStaff(): StaffUser | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_STAFF_STORAGE_KEY) || localStorage.getItem(CURRENT_STAFF_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export function saveStoredCurrentStaff(user: StaffUser | null): void {
  try {
    if (user) {
      sessionStorage.setItem(CURRENT_STAFF_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(CURRENT_STAFF_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(CURRENT_STAFF_STORAGE_KEY);
      localStorage.removeItem(CURRENT_STAFF_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving current staff user:', e);
  }
}

