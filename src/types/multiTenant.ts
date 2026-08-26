export type LicenseState = 'active' | 'suspended' | 'expired';

export interface ClinicAccount {
  id: string; // e.g. "clinic-uuid"
  clinicName: string;
  branch: string; // Sucursal
  doctorName: string; // Médico Titular Responsable
  doctorPrefix: 'Dr.' | 'Dra.';
  generalLicense: string; // Cédula Profesional General
  specialtyLicense: string; // Cédula de Especialidad
  medicalSpecialty: string; // Especialidad Médica (ej. Radiología e Imagenología)
  university: string; // Universidad / Institución
  username: string; // Usuario único de acceso
  password: string; // Contraseña en texto claro para soporte y gestión
  phone: string; // Teléfono / WhatsApp
  email: string; // Correo de contacto
  address: string; // Dirección física
  licenseStatus: LicenseState;
  licenseValidUntil: string; // Fecha ISO YYYY-MM-DD
  createdAt: string; // ISO String
  updatedAt: string; // ISO String para resolución de sincronización en nube
}

export interface SuperAdminContactInfo {
  name: string;
  phone: string; // WhatsApp internacional ej. +52 1 234 567 8900 o +51 987 654 321
  email: string;
  helpMessage: string;
  updatedAt: string;
}

export interface LicenseEvaluation {
  status: LicenseState;
  daysRemaining: number;
  label: string;
  isExpired: boolean;
  isSuspended: boolean;
  isActive: boolean;
}

export type SessionType = 'superadmin' | 'clinic';

export interface SessionUser {
  type: SessionType;
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  clinicId?: string;
  role: string;
}

export interface CloudVaultPayload {
  clinics: ClinicAccount[];
  superAdminContact: SuperAdminContactInfo;
  tombstones: string[]; // Deleted clinic IDs
  serverTimestamp?: string;
}
