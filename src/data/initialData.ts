import {
  Tenant,
  Patient,
  Appointment,
  MedicalStudy,
  NotificationSettings,
  NotificationLog,
  PatientAppointmentRequest,
  ClinicSettings,
  StaffUser,
  ModalityType,
} from '../types';

export const DEFAULT_TENANT_ID = 'tenant-clinic-demo';

export const MODALITY_CONFIG: Record<
  ModalityType,
  { label: string; color: string; badgeBg: string; badgeBorder: string }
> = {
  ULTRASONIDO: {
    label: 'Ultrasonido',
    color: 'emerald',
    badgeBg: 'bg-emerald-950 text-emerald-300',
    badgeBorder: 'border-emerald-800',
  },
  DENSITOMETRIA: {
    label: 'Densitometría',
    color: 'amber',
    badgeBg: 'bg-amber-950 text-amber-300',
    badgeBorder: 'border-amber-800',
  },
  RAYOS_X: {
    label: 'Rayos X',
    color: 'blue',
    badgeBg: 'bg-blue-950 text-blue-300',
    badgeBorder: 'border-blue-800',
  },
  RESONANCIA: {
    label: 'Resonancia Magnética',
    color: 'purple',
    badgeBg: 'bg-purple-950 text-purple-300',
    badgeBorder: 'border-purple-800',
  },
  TOMOGRAFIA: {
    label: 'Tomografía Computada (TAC)',
    color: 'cyan',
    badgeBg: 'bg-cyan-950 text-cyan-300',
    badgeBorder: 'border-cyan-800',
  },
  MAMOGRAFIA: {
    label: 'Mamografía Digital',
    color: 'rose',
    badgeBg: 'bg-rose-950 text-rose-300',
    badgeBorder: 'border-rose-800',
  },
};

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  tenantId: DEFAULT_TENANT_ID,
  name: 'Centro de Imagenología Médica',
  tagline: 'Diagnóstico por Imágenes & Radiología Especializada',
  shortName: 'Imagenología Médica',
  address: 'Calle Principal 100',
  city: 'Ciudad',
  phone: '(55) 1234-5678',
  emergencyPhone: '+52 1 55 1234 5678',
  email: 'contacto@imagenologia-medica.com',
  website: 'www.imagenologia-medica.com',
  ruc: '10000000001',
  directorName: 'Dr. Médico Responsable',
  directorTitle: 'Especialista en Radiología e Imagenología Diagnóstica',
  logoIcon: 'Activity',
  accentColor: 'cyan',
  enableDemoMode: false,
  enableBruteForceProtection: true,
  sessionTimeoutMinutes: 30,
};

export const INITIAL_NOTIFICATION_SETTINGS: NotificationSettings = {
  tenantId: DEFAULT_TENANT_ID,
  emailEnabled: true,
  smsEnabled: true,
  whatsappEnabled: true,
  reminder24hBefore: true,
  reminder2hBefore: true,
  notifyOnReportReady: true,
  notifyOnAppointmentCreated: true,
  senderEmail: 'citas@imagenologia-medica.com',
  senderPhone: '+52 1 55 1234 5678',
  clinicHeaderName: 'Centro de Imagenología Médica',
};

// ==========================================
// 🏢 FACTORY BLANK ARRAYS (READY FOR COMMERCIALIZATION)
// ==========================================
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: DEFAULT_TENANT_ID,
    slug: 'clinic-demo',
    name: 'Consultorio de Imagenología Médica',
    status: 'ACTIVE',
    plan: 'ENTERPRISE_PACS',
    createdAt: '2026-08-26',
    settings: INITIAL_CLINIC_SETTINGS,
    license: {
      key: 'IMAGIS-LIC-DEMO-2026-30D',
      billingType: 'MONTHLY',
      issuedDate: '2026-08-26',
      expirationDate: '2026-09-26',
      gracePeriodDays: 5,
      status: 'ACTIVE',
      currency: 'USD',
      monthlyRate: 59,
      annualRate: 590,
      contactBillingEmail: 'licencias@imagis-pacs.cloud',
      contactBillingPhone: '+52 1 55 1234 5678',
      lastPaymentDate: '2026-08-26',
      autoRenewNotice: true,
    },
  },
];

export const INITIAL_PATIENTS: Patient[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_STUDIES: MedicalStudy[] = [];
export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [];
export const INITIAL_APPOINTMENT_REQUESTS: PatientAppointmentRequest[] = [];

// ==========================================
// 👑 PERMANENT SUPER ADMIN MASTERS & DEFAULT CLINIC ADMIN
// ==========================================
export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'usr-master-fernando01',
    tenantId: 'GLOBAL',
    username: 'Fernando01',
    password: 'Bazzoka1313AS.',
    fullName: 'Fernando (Super Administrador Maestro)',
    role: 'SUPER_ADMIN',
    email: 'fernando@imagis-pacs.cloud',
    phone: '+52 1 55 1234 5678',
    position: 'Super Administrador Maestro SaaS',
    avatarIcon: 'Crown',
    isSuperAdmin: true,
    isProtected: true,
  },
  {
    id: 'usr-master-fernando-alias',
    tenantId: 'GLOBAL',
    username: 'Fernando',
    password: 'Bazzoka1313AS.',
    fullName: 'Fernando (Super Administrador Maestro)',
    role: 'SUPER_ADMIN',
    email: 'fernando@imagis-pacs.cloud',
    phone: '+52 1 55 1234 5678',
    position: 'Super Administrador Maestro SaaS',
    avatarIcon: 'Crown',
    isSuperAdmin: true,
    isProtected: true,
  },
  {
    id: 'usr-master-superadmin-alias',
    tenantId: 'GLOBAL',
    username: 'superadmin',
    password: 'Bazzoka1313AS.',
    fullName: 'Super Administrador (Respaldo)',
    role: 'SUPER_ADMIN',
    email: 'superadmin@imagis-pacs.cloud',
    phone: '+52 1 55 1234 5678',
    position: 'Super Administrador Maestro',
    avatarIcon: 'Crown',
    isSuperAdmin: true,
    isProtected: true,
  },
  {
    id: 'usr-admin-01',
    tenantId: DEFAULT_TENANT_ID,
    username: 'admin',
    password: 'admin123',
    fullName: 'Dr. Médico Responsable',
    role: 'ADMIN',
    email: 'director@imagenologia-medica.com',
    phone: '+52 1 55 1234 5678',
    position: 'Director Médico / Administrador',
    avatarIcon: 'ShieldCheck',
  },
];