export type ModalityType =
  | 'RAYOS_X'
  | 'TOMOGRAFIA'
  | 'RESONANCIA'
  | 'ULTRASONIDO'
  | 'MAMOGRAFIA'
  | 'DENSITOMETRIA'
  | 'MEDICINA_NUCLEAR';

export type AppointmentStatus =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_ESPERA'
  | 'EN_ESTUDIO'
  | 'ESTUDIO_COMPLETADO'
  | 'EN_INTERPRETACION'
  | 'INFORME_FIRMADO'
  | 'ENTREGADO'
  | 'CANCELADA';

export type AppointmentPriority = 'RUTINA' | 'URGENTE' | 'CONTROL' | 'STAT_EMERGENCIA';

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface PatientSafetyProfile {
  allergies: string[];
  contrastAllergyHistory: boolean;
  hasPacemaker: boolean;
  hasMetalImplants: boolean;
  hasAneurysmClips: boolean;
  hasClaustrophobia: boolean;
  isPregnantOrPossible: boolean;
  creatinineLevel?: number; // mg/dL
  eGFR?: number; // mL/min/1.73m2
  diabeticOnMetformin: boolean;
  specialNotes?: string;
  lastSafetyCheckDate?: string;
}

export interface Patient {
  id: string;
  tenantId?: string; // Multi-tenant isolation key
  dni: string;
  fullName: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F' | 'OTRO';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  insuranceProvider: string;
  policyNumber: string;
  portalAccessCode?: string; // e.g. "SILVA-2104"
  portalPin?: string; // e.g. "1234"
  emergencyContact: EmergencyContact;
  safetyProfile: PatientSafetyProfile;
  createdAt: string;
  referringDoctorDefault?: string;
  totalStudiesCount: number;
}

export interface PrepCheckItem {
  id: string;
  label: string;
  completed: boolean;
  mandatory: boolean;
}

export interface Appointment {
  id: string;
  tenantId?: string; // Multi-tenant isolation key
  accessionNumber: string;
  patientId: string;
  patientName: string;
  patientDni: string;
  patientPhone: string;
  patientEmail?: string;
  modality: ModalityType;
  studyName: string;
  anatomicalRegion: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  radiologistName: string;
  technologistName: string;
  referringDoctor: string;
  clinicalIndication: string;
  requiresContrast: boolean;
  requiresFasting?: boolean;
  fastingHours?: number;
  prepChecklist?: PrepCheckItem[];
  patientSafetyVerified: boolean;
  notes?: string;
  associatedStudyId?: string;
  createdAt: string;
}

export interface SliceAnnotation {
  id: string;
  type: 'RULER' | 'ANGLE' | 'ROI_CIRCLE' | 'ARROW' | 'TEXT';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  point3X?: number;
  point3Y?: number;
  label?: string;
  measurementValue?: string;
  sliceIndex: number;
}

export interface MedicalImageSlice {
  id: string;
  sliceIndex: number;
  sliceLocation: string; // e.g. "Z: -42.50mm"
  sliceThickness: string; // e.g. "1.5mm"
  instanceNumber: number;
  huCenterRange?: string; // e.g. "W:400 L:40"
  svgIllustrationKey: string; // key to procedural anatomy renderer
  customImageUrl?: string;
}

export interface MedicalStudySeries {
  id: string;
  seriesNumber: number;
  name: string; // e.g. "Axial T2 TSE", "Sagittal T1", "Coronal Reformatted"
  plane: 'AXIAL' | 'SAGITTAL' | 'CORONAL' | 'OBLICUO';
  description: string;
  matrixSize: string; // e.g. "512 x 512"
  pixelSpacing: string; // e.g. "0.488mm / 0.488mm"
  slices: MedicalImageSlice[];
}

export interface RadiologyReport {
  id: string;
  studyId: string;
  radiologistName: string;
  radiologistLicense: string; // e.g. "C.M.P. 58492 - R.N.E. 23901"
  reportDate: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  biRadsOrScore?: string;
  status: 'BORRADOR' | 'PRELIMINAR' | 'FIRMADO_FINAL';
  signedAt?: string;
  signatureHash?: string;
  audioDictationTranscript?: string;
}

export interface MedicalStudy {
  id: string;
  tenantId?: string; // Multi-tenant isolation key
  accessionNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'OTRO';
  patientDni: string;
  dni?: string;
  modality: ModalityType;
  studyName: string;
  anatomicalRegion: string;
  studyDate: string;
  studyTime: string;
  equipmentModel: string;
  institutionName: string;
  referringDoctor: string;
  clinicalIndication: string;
  keyFindingsSummary?: string;
  contrastMediaUsed?: string; // e.g. "Iohexol 350 mg I/mL (75 mL IV)"
  acquisitionParams: {
    kVp?: number;
    mA?: number;
    sliceThickness?: string;
    magneticFieldStrength?: string; // e.g. "3.0 Tesla"
    transducerType?: string; // for ultrasound
  };
  series: MedicalStudySeries[];
  report?: RadiologyReport;
  keyImagesCount?: number;
  fullName?: string;
  birthDate?: string;
  age?: number;
  gender?: 'M' | 'F' | 'OTRO';
  phone?: string;
  email?: string;
  address?: string;
  studyStatus?: 'ADQUIRIDO' | 'EN_INTERPRETACION' | 'INFORME_LISTO' | 'VALIDADO';
  fileFormat?: 'DICOM_STANDARD' | 'DICOM_COMPRESSED' | 'VOLUMETRIC_NIFTI';
}

export type DicomWindowPreset =
  | 'DEFAULT'
  | 'AUTO'
  | 'BONE'
  | 'SOFT_TISSUE'
  | 'LUNG'
  | 'BRAIN'
  | 'ANGIO'
  | 'HIGH_CONTRAST'
  | 'INVERTED';

export type ViewerWindowPreset = DicomWindowPreset;

export type ViewerToolType =
  | 'SELECT'
  | 'PAN'
  | 'ZOOM'
  | 'WINDOW_LEVEL'
  | 'RULER'
  | 'ANGLE'
  | 'ROI'
  | 'ARROW'
  | 'CROSSHAIR';

export type ColorMapType = 'GRAYSCALE' | 'INVERTED' | 'PET_HOT' | 'DOPPLER' | 'BONE_WARM';

// ==========================================
// NOTIFICATION SYSTEM TYPES
// ==========================================

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export type NotificationStatus = 'PROGRAMADO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'FALLIDO';

export type NotificationType =
  | 'RECORDATORIO_CITA'
  | 'RECORDATORIO_24H'
  | 'RECORDATORIO_2H'
  | 'CONFIRMACION'
  | 'CONFIRMACION_RESERVA'
  | 'INSTRUCCIONES_PREPARACION'
  | 'INFORME_DISPONIBLE'
  | 'RESULTADOS_DISPONIBLES'
  | 'CANCELACION';

export interface NotificationAdvanceRule {
  id: string;
  label: string; // e.g. "48 horas antes", "24 horas antes", "2 horas antes"
  hoursBefore: number; // e.g. 48, 24, 2
  enabled: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  customNote?: string;
}

export interface NotificationTemplate {
  modality: ModalityType | 'GENERAL';
  subject: string;
  emailBodyHtml: string;
  smsBodyText: string;
  whatsappText: string;
  specificPrepInstructions: string[];
}

export interface NotificationSettings {
  tenantId?: string; // Multi-tenant isolation key
  senderName?: string;
  emailSenderName?: string;
  senderEmail?: string;
  emailSenderAddress?: string;
  senderPhone?: string;
  smsSenderId?: string;
  whatsappBusinessEnabled?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
  reminder24hBefore?: boolean;
  reminder2hBefore?: boolean;
  notifyOnReportReady?: boolean;
  notifyOnAppointmentCreated?: boolean;
  clinicHeaderName?: string;
  includePreparationChecklist?: boolean;
  autoSendEnabled?: boolean;
  rules?: any;
  customTemplates?: Record<string, any>;
  defaultEmailTemplate?: string;
  defaultSmsTemplate?: string;
  templatesByModality?: Record<string, { emailText: string; smsText: string; prepNotes: string }>;
  advanceRules?: NotificationAdvanceRule[];
  templates?: NotificationTemplate[];
}

export interface NotificationLog {
  id: string;
  tenantId?: string; // Multi-tenant isolation key
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientDni: string;
  recipient: string; // phone or email
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  sentAt: string;
  advanceRuleLabel?: string;
  modality?: string;
  studyName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  errorReason?: string;
}

// ==========================================
// PATIENT PORTAL TYPES
// ==========================================

export type PatientPortalTab =
  | 'MIS_ESTUDIOS'
  | 'MIS_CITAS'
  | 'SOLICITAR_CITA'
  | 'MI_PERFIL'
  | 'NOTIFICACIONES'
  | 'ASISTENTE_IA';

export interface PatientAppointmentRequest {
  id: string;
  tenantId?: string; // Multi-tenant isolation key
  patientId: string;
  patientName: string;
  patientDni: string;
  patientPhone: string;
  patientEmail: string;
  modality: ModalityType;
  studyName: string;
  anatomicalRegion: string;
  preferredDate: string;
  preferredTimeSlot: 'MANANA' | 'TARDE' | 'CUALQUIERA';
  clinicalReason: string;
  medicalOrderFileName?: string;
  hasContrastAllergy: boolean;
  hasMetalImplants: boolean;
  isPregnant: boolean;
  notes?: string;
  status: 'PENDIENTE_REVISION' | 'APROBADA_AGENDADA' | 'RECHAZADA';
  createdAt: string;
  reviewedAt?: string;
  assignedAppointmentId?: string;
}

// ==========================================
// CLINIC & BRANDING CONFIGURATION
// ==========================================

export interface ClinicSettings {
  tenantId?: string;
  name: string;
  tagline: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website: string;
  ruc: string;
  directorName: string;
  directorTitle: string;
  logoImage?: string;
  logoIcon: 'Layers' | 'Activity' | 'HeartPulse' | 'Shield' | 'Cross' | 'Stethoscope' | 'Scan';
  accentColor: 'cyan' | 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber' | 'rose';
  // Opciones de Seguridad y Publicación en Internet
  enableDemoMode?: boolean; // Permite o bloquea botones de acceso rápido de prueba en el portal del paciente
  enableBruteForceProtection?: boolean; // Bloquea accesos tras 5 intentos fallidos
  sessionTimeoutMinutes?: number; // Cierre automático por inactividad
  license?: TenantLicense; // Configuración de renta y licencia
}

// ==========================================
// STAFF & USER AUTHENTICATION
// ==========================================

export type StaffRole = 'SUPER_ADMIN' | 'ADMIN' | 'ENCARGADO';

export interface StaffUser {
  id: string;
  tenantId?: string; // Multi-tenant isolation key (or 'GLOBAL' for superadmin)
  username: string;
  fullName: string;
  role: StaffRole;
  email: string;
  phone?: string;
  position: string;
  avatarIcon?: string;
  password?: string;
  isSuperAdmin?: boolean;
  isProtected?: boolean; // Cannot be deleted or modified
}

// ==========================================
// LICENSE & RENTAL SUBSCRIPTION TYPES
// ==========================================

export type LicenseBillingType = 'MONTHLY' | 'ANNUAL' | 'PERPETUAL' | 'TRIAL';
export type LicenseStatus = 'ACTIVE' | 'WARNING_EXPIRING' | 'EXPIRED_LOCKED' | 'SUSPENDED';

export interface TenantLicense {
  key: string;
  billingType: LicenseBillingType;
  issuedDate: string;
  expirationDate: string; // YYYY-MM-DD
  gracePeriodDays: number; // e.g. 5 days
  status: LicenseStatus;
  monthlyRate?: number; // e.g. 59 USD
  annualRate?: number; // e.g. 590 USD
  currency: 'USD' | 'PEN' | 'MXN';
  contactBillingEmail?: string;
  contactBillingPhone?: string;
  lastPaymentDate?: string;
  autoRenewNotice?: boolean;
}

// ==========================================
// MULTI-TENANT SAAS ARCHITECTURE TYPES
// ==========================================

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type TenantPlan = 'CLINICA_BASIC' | 'HOSPITAL_PRO' | 'ENTERPRISE_PACS';

export interface Tenant {
  id: string; // e.g. 'tenant-imagis-central', 'tenant-san-pedro'
  slug: string; // e.g. 'imagis-central'
  name: string; // e.g. 'IMAGIS Sede Central'
  status: TenantStatus;
  plan: TenantPlan;
  createdAt: string;
  settings: ClinicSettings;
  license?: TenantLicense;
}

export * from './multiTenant';

