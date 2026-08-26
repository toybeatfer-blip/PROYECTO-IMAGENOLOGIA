import React, { useState, useEffect, useMemo } from 'react';
import {
  Tenant,
  Patient,
  Appointment,
  MedicalStudy,
  RadiologyReport,
  AppointmentStatus,
  NotificationSettings,
  NotificationLog,
  PatientAppointmentRequest,
  ClinicSettings,
  StaffUser,
  TenantLicense,
} from './types';
import {
  DEFAULT_TENANT_ID,
  INITIAL_CLINIC_SETTINGS,
} from './data/initialData';
import {
  getStoredTenants,
  saveStoredTenants,
  getStoredActiveTenantId,
  saveStoredActiveTenantId,
  createNewTenant,
  getStoredPatients,
  saveStoredPatients,
  getStoredAppointments,
  saveStoredAppointments,
  getStoredStudies,
  saveStoredStudies,
  getStoredNotificationSettings,
  saveStoredNotificationSettings,
  getStoredNotificationLogs,
  saveStoredNotificationLogs,
  getStoredAppointmentRequests,
  saveStoredAppointmentRequests,
  getStoredClinicSettings,
  saveStoredClinicSettings,
  getStoredStaffUsers,
  saveStaffUsers,
  getStoredCurrentStaff,
  saveStoredCurrentStaff,
} from './utils/storage';
import {
  getStoredClinics,
  getClinicSettings,
  getClinicPatients,
} from './utils/clinicDatabase';
import { checkLicenseStatus, createDefaultTenantLicense } from './utils/license';
import { AppointmentCalendar } from './components/appointments/AppointmentCalendar';
import { NewAppointmentModal } from './components/appointments/NewAppointmentModal';
import { SafetyQuestionnaireModal } from './components/appointments/SafetyQuestionnaireModal';
import { PatientList } from './components/patients/PatientList';
import { PatientHistoryDetail } from './components/patients/PatientHistoryDetail';
import { NewPatientModal } from './components/patients/NewPatientModal';
import { PatientCredentialsModal } from './components/patients/PatientCredentialsModal';
import { MedicalImageViewer } from './components/viewer/MedicalImageViewer';
import { StandaloneViewerWindow } from './components/viewer/StandaloneViewerWindow';
import { openStudyInStandaloneWindow } from './utils/windowSync';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';
import { SendManualReminderModal } from './components/notifications/SendManualReminderModal';
import { PatientPortalLogin } from './components/portal/PatientPortalLogin';
import { PatientPortal } from './components/portal/PatientPortal';
import { ReviewAppointmentRequestsModal } from './components/portal/ReviewAppointmentRequestsModal';
import { ClinicSettingsModal } from './components/settings/ClinicSettingsModal';
import { UploadMedicalStudyModal } from './components/studies/UploadMedicalStudyModal';
import { StudiesDirectory } from './components/studies/StudiesDirectory';
import { StaffLogin } from './components/auth/StaffLogin';
import { TenantSwitcherModal } from './components/tenant/TenantSwitcherModal';
import { LicenseLockScreen } from './components/license/LicenseLockScreen';
import { LicenseBanner } from './components/license/LicenseBanner';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { OfflineLockScreen } from './components/network/OfflineLockScreen';
import { getVerifiedNetworkDateTime, checkInternetConnection, VerifiedNetworkTimeResult } from './utils/networkTime';
import {
  Calendar,
  Layers,
  Users,
  Eye,
  Activity,
  Plus,
  ShieldCheck,
  Building2,
  Sparkles,
  Bell,
  Globe,
  UserCheck,
  Send,
  Inbox,
  Lock,
  Settings,
  HeartPulse,
  Shield,
  Scan,
  Stethoscope,
  Upload,
  LogOut,
  ChevronDown,
  Key,
  Crown,
  Wifi,
  WifiOff,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // ==========================================
  // MULTI-TENANT STATE
  // ==========================================
  const [tenants, setTenants] = useState<Tenant[]>(() => getStoredTenants());
  const [activeTenantId, setActiveTenantId] = useState<string>(() => getStoredActiveTenantId());
  const [showTenantSwitcherModal, setShowTenantSwitcherModal] = useState(false);

  // ==========================================
  // 🌐 INTERNET & CLOUD TIME SYNCHRONIZATION
  // ==========================================
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [verifiedNetworkTime, setVerifiedNetworkTime] = useState<VerifiedNetworkTimeResult | null>(null);

  const handleSyncNetwork = async (): Promise<boolean> => {
    try {
      const netTime = await getVerifiedNetworkDateTime();
      setVerifiedNetworkTime(netTime);
      setIsOnline(netTime.isOnline);
      return netTime.isOnline;
    } catch {
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    handleSyncNetwork();

    const handleOnlineEvent = () => handleSyncNetwork();
    const handleOfflineEvent = () => setIsOnline(false);

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    // Heartbeat and cloud sync check every 1 minute (60000 ms)
    const intervalId = setInterval(() => {
      handleSyncNetwork();
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      clearInterval(intervalId);
    };
  }, []);

  // Derived current active tenant (Checks registered clinics first, then fallback to tenants)
  const currentTenant: Tenant = useMemo(() => {
    const registeredClinics = getStoredClinics();
    const matched = registeredClinics.find(c => c.id === activeTenantId);
    if (matched) {
      const clinicSets = getClinicSettings(matched.id);
      return {
        id: matched.id,
        slug: matched.username,
        name: matched.clinicName,
        status: matched.licenseStatus === 'suspended' ? ('SUSPENDED' as const) : ('ACTIVE' as const),
        plan: 'HOSPITAL_PRO' as const,
        createdAt: matched.createdAt,
        settings: {
          ...INITIAL_CLINIC_SETTINGS,
          ...clinicSets,
          tenantId: matched.id,
          name: matched.clinicName,
          directorName: `${matched.doctorPrefix} ${matched.doctorName}`,
          address: matched.address,
          phone: matched.phone,
          email: matched.email,
        },
        license: {
          key: `KEY-${matched.id}`,
          billingType: 'MONTHLY' as const,
          status: matched.licenseStatus === 'suspended' ? ('SUSPENDED' as const) : ('ACTIVE' as const),
          activationDate: matched.createdAt.split('T')[0],
          expirationDate: matched.licenseValidUntil,
          totalDurationDays: 30,
          gracePeriodDays: 3,
        },
      };
    }

    return tenants.find(t => t.id === activeTenantId) || tenants[0];
  }, [tenants, activeTenantId]);

  const clinicSettings = currentTenant.settings || INITIAL_CLINIC_SETTINGS;

  // ==========================================
  // LICENSE CHECK & EXPIRATION LOGIC (TIED TO VERIFIED NETWORK TIME)
  // ==========================================
  const activeTenantLicense = currentTenant.license || currentTenant.settings.license;
  const licenseCheck = useMemo(() => {
    return checkLicenseStatus(activeTenantLicense, verifiedNetworkTime?.dateIso);
  }, [activeTenantLicense, verifiedNetworkTime?.dateIso]);

  // Staff Users & Active Session State
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => getStoredStaffUsers());
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(() => getStoredCurrentStaff());

  // Super Admin View Mode: 'MASTER_DASHBOARD' | 'IMPERSONATE'
  const [superAdminViewMode, setSuperAdminViewMode] = useState<'MASTER_DASHBOARD' | 'IMPERSONATE'>('MASTER_DASHBOARD');

  // Core Entities State (All Tenants Data in Store)
  const [allPatients, setAllPatients] = useState<Patient[]>(() => getStoredPatients());
  const [allAppointments, setAllAppointments] = useState<Appointment[]>(() => getStoredAppointments());
  const [allStudies, setAllStudies] = useState<MedicalStudy[]>(() => getStoredStudies());

  // Notification System State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getStoredNotificationSettings(activeTenantId)
  );
  const [allNotificationLogs, setAllNotificationLogs] = useState<NotificationLog[]>(() =>
    getStoredNotificationLogs()
  );
  const [allAppointmentRequests, setAllAppointmentRequests] = useState<PatientAppointmentRequest[]>(() =>
    getStoredAppointmentRequests()
  );

  const [showClinicSettingsModal, setShowClinicSettingsModal] = useState(false);

  // App High-Level Mode: 'STAFF' (Radiology Console) | 'PORTAL' (Patient Web Portal) | 'STANDALONE_VIEWER' (Secondary Screen PACS Viewer)
  const [appMode, setAppMode] = useState<'STAFF' | 'PORTAL' | 'STANDALONE_VIEWER'>('STAFF');
  const [standaloneStudyId, setStandaloneStudyId] = useState<string>('study-001');
  const [portalPatient, setPortalPatient] = useState<Patient | null>(null);

  // Staff Navigation State
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'VISOR' | 'PACIENTES' | 'ESTUDIOS'>('AGENDA');
  const [selectedPatientIdForDetail, setSelectedPatientIdForDetail] = useState<string | null>(null);
  const [selectedStudyIdForViewer, setSelectedStudyIdForViewer] = useState<string>('study-001');

  // Modals
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [credentialsModalPatient, setCredentialsModalPatient] = useState<Patient | null>(null);
  const [safetyModalAppointment, setSafetyModalAppointment] = useState<Appointment | null>(null);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [manualReminderAppointment, setManualReminderAppointment] = useState<Appointment | null>(null);
  const [showReviewRequestsModal, setShowReviewRequestsModal] = useState(false);
  const [showUploadStudyModal, setShowUploadStudyModal] = useState(false);

  // ==========================================
  // FILTERED ENTITIES FOR ACTIVE TENANT
  // ==========================================
  const patients = useMemo(() => {
    return allPatients.filter(p => (p.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [allPatients, activeTenantId]);

  const appointments = useMemo(() => {
    return allAppointments.filter(a => (a.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [allAppointments, activeTenantId]);

  const studies = useMemo(() => {
    return allStudies.filter(s => (s.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [allStudies, activeTenantId]);

  const notificationLogs = useMemo(() => {
    return allNotificationLogs.filter(l => (l.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [allNotificationLogs, activeTenantId]);

  const appointmentRequests = useMemo(() => {
    return allAppointmentRequests.filter(r => (r.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [allAppointmentRequests, activeTenantId]);

  const tenantStaffUsers = useMemo(() => {
    return staffUsers.filter(u => (u.tenantId || DEFAULT_TENANT_ID) === activeTenantId);
  }, [staffUsers, activeTenantId]);

  // Synchronize with LocalStorage
  useEffect(() => {
    saveStoredTenants(tenants);
  }, [tenants]);

  useEffect(() => {
    saveStoredActiveTenantId(activeTenantId);
  }, [activeTenantId]);

  useEffect(() => {
    saveStoredPatients(allPatients);
  }, [allPatients]);

  useEffect(() => {
    saveStoredAppointments(allAppointments);
  }, [allAppointments]);

  useEffect(() => {
    saveStoredStudies(allStudies);
  }, [allStudies]);

  useEffect(() => {
    saveStoredNotificationSettings(notificationSettings, activeTenantId);
  }, [notificationSettings, activeTenantId]);

  useEffect(() => {
    saveStoredNotificationLogs(allNotificationLogs);
  }, [allNotificationLogs]);

  useEffect(() => {
    saveStoredAppointmentRequests(allAppointmentRequests);
  }, [allAppointmentRequests]);

  // Reactive routing for Standalone PACS Viewer & Patient Portal
  useEffect(() => {
    const checkUrlMode = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      // Check Standalone Dual-Screen PACS Viewer (e.g. #viewer, #viewer?studyId=..., ?mode=standalone_viewer)
      if (
        hash.includes('viewer') ||
        hash.includes('visor') ||
        search.includes('viewer') ||
        search.includes('mode=standalone_viewer')
      ) {
        let targetStudyId = 'study-001';
        if (window.location.hash.includes('studyId=')) {
          targetStudyId = decodeURIComponent(window.location.hash.split('studyId=')[1].split('&')[0]);
        } else if (window.location.search.includes('studyId=')) {
          const params = new URLSearchParams(window.location.search);
          targetStudyId = params.get('studyId') || 'study-001';
        }
        setStandaloneStudyId(targetStudyId);
        setAppMode('STANDALONE_VIEWER');
        return;
      }

      // Check Patient Portal
      if (
        search.includes('portal') ||
        search.includes('paciente') ||
        search.includes('expediente') ||
        hash.includes('portal') ||
        hash.includes('paciente') ||
        hash.includes('expediente') ||
        path.includes('portal') ||
        path.includes('paciente')
      ) {
        setAppMode('PORTAL');
        return;
      }

      setAppMode('STAFF');
    };

    checkUrlMode();
    window.addEventListener('hashchange', checkUrlMode);
    window.addEventListener('popstate', checkUrlMode);
    return () => {
      window.removeEventListener('hashchange', checkUrlMode);
      window.removeEventListener('popstate', checkUrlMode);
    };
  }, []);

  // ==========================================
  // TENANT ACTIONS
  // ==========================================
  const handleSwitchTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    saveStoredActiveTenantId(tenantId);
    setSelectedPatientIdForDetail(null);
    setPortalPatient(null);
    setNotificationSettings(getStoredNotificationSettings(tenantId));
  };

  const handleCreateTenant = (data: {
    name: string;
    slug?: string;
    plan?: Tenant['plan'];
    settings: Partial<ClinicSettings>;
  }) => {
    const newTenant = createNewTenant(data);
    setTenants(prev => [...prev, newTenant]);
    setStaffUsers(getStoredStaffUsers());
    handleSwitchTenant(newTenant.id);
  };

  // License Activation Handler
  const handleActivateLicense = (newLicense: TenantLicense) => {
    const updatedTenant: Tenant = {
      ...currentTenant,
      license: newLicense,
      settings: { ...clinicSettings, license: newLicense },
    };
    setTenants(prev => prev.map(t => (t.id === activeTenantId ? updatedTenant : t)));
    saveStoredClinicSettings(updatedTenant.settings, activeTenantId);
  };

  // Super Admin License Updater
  const handleSuperAdminUpdateLicense = (tenantId: string, newLicense: TenantLicense) => {
    setTenants(prev =>
      prev.map(t =>
        t.id === tenantId
          ? { ...t, license: newLicense, settings: { ...t.settings, license: newLicense } }
          : t
      )
    );
    const targetTenant = tenants.find(t => t.id === tenantId);
    if (targetTenant) {
      saveStoredClinicSettings({ ...targetTenant.settings, license: newLicense }, tenantId);
    }
  };

  // Super Admin Staff Users & Passwords Updater
  const handleSuperAdminUpdateStaffUsers = (tenantId: string, updatedTenantStaff: StaffUser[]) => {
    const others = staffUsers.filter(u => (u.tenantId || DEFAULT_TENANT_ID) !== tenantId);
    const combined = [...others, ...updatedTenantStaff.map(u => ({ ...u, tenantId }))];
    setStaffUsers(combined);
    saveStaffUsers(combined);
  };

  // Handlers for Staff Authentication
  const handleStaffLoginSuccess = (user: StaffUser, netTime?: VerifiedNetworkTimeResult) => {
    if (netTime) {
      setVerifiedNetworkTime(netTime);
      setIsOnline(true);
    }
    if (user.tenantId && user.tenantId !== 'GLOBAL') {
      setActiveTenantId(user.tenantId);
      saveStoredActiveTenantId(user.tenantId);
    }
    setCurrentStaffUser(user);
    saveStoredCurrentStaff(user);
    if (user.role === 'SUPER_ADMIN' || user.isSuperAdmin) {
      setSuperAdminViewMode('MASTER_DASHBOARD');
    }
  };

  const handleStaffLogout = () => {
    setCurrentStaffUser(null);
    saveStoredCurrentStaff(null);
    setSuperAdminViewMode('MASTER_DASHBOARD');
    setSelectedPatientIdForDetail(null);
    setPortalPatient(null);
    setAppMode('STAFF');
  };

  // Handlers for Clinic Settings
  const handleSaveClinicSettings = (newSettings: ClinicSettings) => {
    const updatedSettings = { ...newSettings, tenantId: activeTenantId };
    setTenants(prev =>
      prev.map(t =>
        t.id === activeTenantId
          ? {
              ...t,
              name: newSettings.name,
              settings: updatedSettings,
              license: newSettings.license || t.license,
            }
          : t
      )
    );
    saveStoredClinicSettings(updatedSettings, activeTenantId);
  };

  // Handler for Uploading Studies (Stamped with activeTenantId)
  const handleSaveUploadedStudy = (newStudy: MedicalStudy, _openInViewer: boolean = false) => {
    const stampedStudy: MedicalStudy = { ...newStudy, tenantId: activeTenantId };
    setAllStudies(prev => [stampedStudy, ...prev]);
    setSelectedStudyIdForViewer(stampedStudy.id);
    setActiveTab('VISOR');
  };

  // Handlers for Patients & Appointments (Stamped with activeTenantId)
  const handleSavePatient = (newPatient: Patient) => {
    const stampedPatient: Patient = { ...newPatient, tenantId: activeTenantId };
    setAllPatients(prev => [stampedPatient, ...prev]);
    setCredentialsModalPatient(stampedPatient);
  };

  const handleSaveAppointment = (newApp: Appointment) => {
    const stampedApp: Appointment = { ...newApp, tenantId: activeTenantId };
    setAllAppointments(prev => [stampedApp, ...prev]);

    // Create automatic confirmation notification log
    if (notificationSettings.emailEnabled || notificationSettings.smsEnabled) {
      const newLog: NotificationLog = {
        id: `notif-${Date.now()}`,
        tenantId: activeTenantId,
        patientId: stampedApp.patientId,
        patientName: stampedApp.patientName,
        patientDni: stampedApp.patientDni,
        appointmentId: stampedApp.id,
        channel: 'SMS',
        type: 'RECORDATORIO_24H',
        recipient: stampedApp.patientPhone,
        title: `Recordatorio Cita: ${stampedApp.studyName}`,
        body: `${clinicSettings.name}: Hola ${stampedApp.patientName}, confirmamos su cita para ${stampedApp.studyName} el ${stampedApp.scheduledDate} a las ${stampedApp.scheduledTime}.`,
        status: 'ENVIADO',
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        advanceRuleLabel: '24 horas antes',
        modality: stampedApp.modality,
        studyName: stampedApp.studyName,
        scheduledDate: stampedApp.scheduledDate,
        scheduledTime: stampedApp.scheduledTime,
      };
      setAllNotificationLogs(prev => [newLog, ...prev]);
    }
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAllAppointments(prev =>
      prev.map(app => (app.id === appointmentId ? { ...app, status: newStatus } : app))
    );
  };

  const handleSaveSafetyVerification = (
    verified: boolean,
    updatedNotes?: string,
    updatedProfile?: any
  ) => {
    if (!safetyModalAppointment) return;
    setAllAppointments(prev =>
      prev.map(app =>
        app.id === safetyModalAppointment.id
          ? {
              ...app,
              patientSafetyVerified: verified,
              notes: updatedNotes ? `${app.notes ? app.notes + ' | ' : ''}${updatedNotes}` : app.notes,
            }
          : app
      )
    );

    if (updatedProfile && safetyModalAppointment.patientId) {
      setAllPatients(prev =>
        prev.map(p =>
          p.id === safetyModalAppointment.patientId
            ? {
                ...p,
                safetyProfile: {
                  ...p.safetyProfile,
                  ...updatedProfile,
                },
              }
            : p
        )
      );
    }

    setSafetyModalAppointment(null);
  };

  const handleSaveReport = (studyId: string, report: RadiologyReport) => {
    setAllStudies(prev => prev.map(st => (st.id === studyId ? { ...st, report } : st)));

    // If report is signed, update status and notify
    if (report.status === 'FIRMADO_FINAL') {
      setAllAppointments(prev =>
        prev.map(app =>
          app.associatedStudyId === studyId ? { ...app, status: 'INFORME_FIRMADO' } : app
        )
      );

      const matchingStudy = allStudies.find(s => s.id === studyId);
      if (matchingStudy) {
        const notif: NotificationLog = {
          id: `notif-report-${Date.now()}`,
          tenantId: activeTenantId,
          patientId: matchingStudy.patientId,
          patientName: matchingStudy.patientName,
          patientDni: matchingStudy.patientDni,
          appointmentId: `app-${studyId}`,
          channel: 'EMAIL',
          type: 'INFORME_DISPONIBLE',
          recipient: 'paciente@portal.salud',
          title: `Informe Disponible: ${matchingStudy.studyName}`,
          body: `${clinicSettings.name}: Su informe médico oficial para ${matchingStudy.studyName} ya está disponible en su portal del paciente.`,
          status: 'ENVIADO',
          sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          advanceRuleLabel: 'Emisión de Informe',
          modality: matchingStudy.modality,
          studyName: matchingStudy.studyName,
        };
        setAllNotificationLogs(prev => [notif, ...prev]);
      }
    }
  };

  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    const stampedSettings = { ...newSettings, tenantId: activeTenantId };
    setNotificationSettings(stampedSettings);
    saveStoredNotificationSettings(stampedSettings, activeTenantId);
  };

  const handleSendManualReminder = (newLog: NotificationLog) => {
    const stampedLog = { ...newLog, tenantId: activeTenantId };
    setAllNotificationLogs(prev => [stampedLog, ...prev]);
  };

  // Handlers for Patient Web Requests
  const handleAcceptPortalRequest = (request: PatientAppointmentRequest, scheduledTime: string) => {
    const newAppointment: Appointment = {
      id: `app-web-${Date.now()}`,
      tenantId: activeTenantId,
      accessionNumber: `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: request.patientId,
      patientName: request.patientName,
      patientDni: request.patientDni,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      modality: request.modality,
      studyName: request.studyName,
      anatomicalRegion: request.anatomicalRegion,
      scheduledDate: request.preferredDate,
      scheduledTime: scheduledTime || '10:00',
      durationMinutes: 30,
      status: 'CONFIRMADA',
      priority: 'RUTINA',
      radiologistName: clinicSettings.directorName || 'Dr. Alejandro Mendoza Valdivia',
      technologistName: 'Tecnólogo de Turno',
      referringDoctor: 'Solicitud Web Portal',
      clinicalIndication: request.clinicalReason,
      requiresContrast: request.hasContrastAllergy,
      patientSafetyVerified: false,
      notes: request.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAllAppointments(prev => [newAppointment, ...prev]);
    setAllAppointmentRequests(prev =>
      prev.map(r => (r.id === request.id ? { ...r, status: 'APROBADA_AGENDADA', assignedAppointmentId: newAppointment.id } : r))
    );
  };

  const handleRejectPortalRequest = (requestId: string, reason: string) => {
    setAllAppointmentRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'RECHAZADA', notes: reason } : r))
    );
  };

  const handleOpenViewerWithStudy = (studyId: string) => {
    setSelectedStudyIdForViewer(studyId);
    setActiveTab('VISOR');
  };

  const handleSelectPatientProfile = (patientId: string) => {
    setSelectedPatientIdForDetail(patientId);
    setActiveTab('PACIENTES');
  };

  const handleOpenNewAppointmentForPatient = (_patientOrId?: any) => {
    setShowNewAppointmentModal(true);
  };

  // Header Logo Helper
  const renderHeaderLogo = () => {
    if (clinicSettings.logoImage) {
      return (
        <img
          src={clinicSettings.logoImage}
          alt={clinicSettings.name}
          className="w-full h-full object-contain"
        />
      );
    }
    const iconProps = { className: 'w-6 h-6 text-white' };
    switch (clinicSettings.logoIcon) {
      case 'Activity':
        return <Activity {...iconProps} />;
      case 'Layers':
        return <Layers {...iconProps} />;
      case 'HeartPulse':
        return <HeartPulse {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'Scan':
        return <Scan {...iconProps} />;
      case 'Stethoscope':
        return <Stethoscope {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const pendingRequestsCount = appointmentRequests.filter(r => r.status === 'PENDIENTE_REVISION').length;
  const currentPatientDetail = patients.find(p => p.id === selectedPatientIdForDetail);

  // ==========================================
  // 🌐 OFFLINE BLOCK: MANDATORY INTERNET CONNECTION
  // ==========================================
  if (!isOnline) {
    return (
      <OfflineLockScreen
        onRetryConnection={handleSyncNetwork}
        lastError={verifiedNetworkTime?.error}
      />
    );
  }

  // ==========================================
  // RENDER: DUAL-SCREEN STANDALONE PACS VIEWER (Pantalla Secundaria)
  // ==========================================
  if (appMode === 'STANDALONE_VIEWER') {
    return (
      <StandaloneViewerWindow
        studies={allStudies}
        initialStudyId={standaloneStudyId || selectedStudyIdForViewer}
        clinicSettings={clinicSettings}
        onSaveReport={handleSaveReport}
      />
    );
  }

  // ==========================================
  // RENDER: PATIENT WEB PORTAL MODE (Expediente Clínico del Paciente)
  // ==========================================
  if (appMode === 'PORTAL') {
    if (!portalPatient) {
      return (
        <PatientPortalLogin
          clinicSettings={clinicSettings}
          patients={allPatients}
          onLoginSuccess={p => setPortalPatient(p)}
          onBackToStaff={() => {
            window.location.hash = '';
            setAppMode('STAFF');
          }}
        />
      );
    }

    return (
      <PatientPortal
        patient={portalPatient}
        studies={allStudies.filter(s => s.patientId === portalPatient.id || s.patientDni === portalPatient.dni || s.patientName?.toLowerCase() === portalPatient.fullName?.toLowerCase())}
        appointments={allAppointments.filter(a => a.patientId === portalPatient.id || a.patientDni === portalPatient.dni)}
        notifications={allNotificationLogs.filter(n => n.patientId === portalPatient.id || n.patientDni === portalPatient.dni)}
        clinicSettings={clinicSettings}
        onOpenViewer={study => {
          setSelectedStudyIdForViewer(study.id);
          setAppMode('STAFF');
          setActiveTab('VISOR');
        }}
        onOpenReport={study => {
          setSelectedStudyIdForViewer(study.id);
          setAppMode('STAFF');
          setActiveTab('VISOR');
        }}
        onLogout={() => {
          setPortalPatient(null);
        }}
        onBackToStaff={() => {
          window.location.hash = '';
          setAppMode('STAFF');
        }}
        onRequestSubmitted={req => {
          const stamped = { ...req, tenantId: activeTenantId };
          setAllAppointmentRequests(prev => [stamped, ...prev]);
        }}
        onConfirmAppointment={appId => {
          handleUpdateAppointmentStatus(appId, 'CONFIRMADA');
        }}
      />
    );
  }

  // ==========================================
  // RENDER: STAFF LOGIN IF NOT AUTHENTICATED
  // ==========================================
  if (!currentStaffUser) {
    return (
      <StaffLogin
        tenants={tenants}
        activeTenantId={activeTenantId}
        onSelectTenant={handleSwitchTenant}
        staffUsers={tenantStaffUsers}
        clinicSettings={clinicSettings}
        onLoginSuccess={handleStaffLoginSuccess}
        onSwitchToPatientPortal={() => {
          setPortalPatient(null);
          setAppMode('PORTAL');
          window.location.hash = '#portal';
        }}
      />
    );
  }

  // ==========================================
  // 👑 RENDER: SUPER ADMIN MASTER SAAS DASHBOARD (CREATOR OF THE SYSTEM: Fernando01)
  // ==========================================
  const isSuperAdmin = currentStaffUser.role === 'SUPER_ADMIN' || currentStaffUser.isSuperAdmin;

  if (isSuperAdmin && superAdminViewMode === 'MASTER_DASHBOARD') {
    return (
      <SuperAdminDashboard
        currentUser={currentStaffUser}
        onSelectClinicToImpersonate={clinicId => {
          setActiveTenantId(clinicId);
          setSuperAdminViewMode('IMPERSONATE');
        }}
        onLogout={handleStaffLogout}
      />
    );
  }

  // ==========================================
  // 🔒 HARD LICENSE LOCK SCREEN (BYPASSED FOR SUPER_ADMIN)
  // ==========================================
  if (licenseCheck.isLocked && !isSuperAdmin) {
    return (
      <LicenseLockScreen
        tenant={currentTenant}
        clinicSettings={clinicSettings}
        license={activeTenantLicense}
        onActivateLicense={handleActivateLicense}
        onSimulateExtend30Days={() => {
          const extended = createDefaultTenantLicense('MONTHLY', 30);
          handleActivateLicense(extended);
        }}
        onLogout={handleStaffLogout}
      />
    );
  }

  // ==========================================
  // RENDER: STAFF CLINICAL CONSOLE MODE
  // ==========================================
  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none antialiased">
      {/* Super Admin Impersonation Top Bar */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-amber-950 via-neutral-900 to-amber-950 border-b border-amber-500/50 px-4 py-2 text-xs font-semibold flex items-center justify-between z-50 shrink-0 shadow-md">
          <div className="flex items-center gap-2 text-amber-300">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Modo Creador (Super Admin):</strong> Inspeccionando sede <strong>{currentTenant.name}</strong> ({currentTenant.slug}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSuperAdminViewMode('MASTER_DASHBOARD')}
            className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Volver al Panel Maestro SaaS</span>
          </button>
        </div>
      )}

      {/* Expiration Notice Banner if in Warning or Grace Period */}
      {!isSuperAdmin && (
        <LicenseBanner
          checkResult={licenseCheck}
          onOpenSettings={() => setShowClinicSettingsModal(true)}
        />
      )}

      {/* Top Application Header / Navigation Bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between gap-4 z-40 shrink-0">
        {/* Brand & Clinic Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-neutral-950 font-bold shadow-md shadow-cyan-500/20 p-1.5 overflow-hidden">
            {renderHeaderLogo()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">
                {clinicSettings.name}{' '}
                <span className="text-cyan-400 font-medium">{clinicSettings.shortName}</span>
              </h1>

              {/* Live Internet & Cloud NTP Status Badge */}
              <div
                onClick={handleSyncNetwork}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono bg-neutral-950 border border-neutral-800 text-emerald-400 cursor-pointer hover:border-cyan-700 transition-all"
                title={`Hora Oficial de la Nube: ${verifiedNetworkTime?.formattedDate || ''} ${verifiedNetworkTime?.formattedTime || ''} • Clic para resincronizar`}
              >
                <Wifi className="w-2.5 h-2.5" />
                <span className="hidden xl:inline">En Línea</span>
                <span className="text-neutral-400 font-mono text-[9px]">{verifiedNetworkTime?.formattedTime || ''}</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400">
              {clinicSettings.tagline}
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800/80">
          <button
            onClick={() => {
              setActiveTab('AGENDA');
              setSelectedPatientIdForDetail(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'AGENDA'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Citas & Agenda</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PACIENTES');
              setSelectedPatientIdForDetail(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'PACIENTES'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pacientes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {patients.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ESTUDIOS');
              setSelectedPatientIdForDetail(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ESTUDIOS'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Estudios PACS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
              {studies.length}
            </span>
          </button>
        </nav>

        {/* Action Fast Buttons & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Notification System Settings */}
          <button
            onClick={() => setShowNotificationSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold transition-all relative cursor-pointer"
            title="Configurar recordatorios SMS y correo electrónico"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Notificaciones</span>
            {notificationLogs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
            )}
          </button>

          {/* Pending Web Requests Review */}
          {pendingRequestsCount > 0 && (
            <button
              onClick={() => setShowReviewRequestsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-700/80 rounded-lg text-xs font-semibold shadow-xs animate-pulse transition-all cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Solicitudes ({pendingRequestsCount})</span>
            </button>
          )}

          {/* Upload Study Action Button */}
          <button
            onClick={() => setShowUploadStudyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Cargar y digitalizar estudio en formatos DICOM, JPG, PNG, MP4, PDF o ZIP"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Cargar Estudio</span>
          </button>

          {/* Clinic & Branding Settings Button (Accessible for ADMIN & SUPER_ADMIN) */}
          {(currentStaffUser?.role === 'ADMIN' || isSuperAdmin) && (
            <button
              onClick={() => setShowClinicSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/80 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Personalizar nombre del centro, dirección, logotipo, usuarios y renta de licencia"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Configuración</span>
            </button>
          )}

          {/* New Appointment Modal Trigger */}
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva Cita</span>
          </button>

          {/* Active Staff User Badge & Logout Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="flex items-center gap-2 bg-neutral-950/90 border border-neutral-800 px-2.5 py-1 rounded-xl">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isSuperAdmin
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : currentStaffUser.role === 'ADMIN'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {isSuperAdmin ? '👑' : currentStaffUser.role === 'ADMIN' ? '🏢' : '🛡️'}
              </div>
              <div className="hidden 2xl:block text-left">
                <div className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                  {currentStaffUser.fullName}
                </div>
                <div className="text-[9px] text-neutral-400 font-mono">
                  {currentStaffUser.role}
                </div>
              </div>
            </div>

            <button
              onClick={handleStaffLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer"
              title="Cerrar sesión y salir"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Work Area Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'AGENDA' && (
          <AppointmentCalendar
            appointments={appointments}
            patients={patients}
            appointmentRequests={appointmentRequests}
            onOpenNewAppointmentModal={() => setShowNewAppointmentModal(true)}
            onOpenViewerWithStudy={handleOpenViewerWithStudy}
            onOpenSafetyQuestionnaire={app => setSafetyModalAppointment(app)}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onSelectPatientProfile={handleSelectPatientProfile}
            onOpenNotificationSettings={() => setShowNotificationSettingsModal(true)}
            onSendReminder={app => setManualReminderAppointment(app)}
            onReviewPortalRequests={() => setShowReviewRequestsModal(true)}
          />
        )}

        {activeTab === 'VISOR' && (
          <MedicalImageViewer
            studies={studies}
            initialStudyId={selectedStudyIdForViewer}
            clinicSettings={clinicSettings}
            onSaveReport={handleSaveReport}
            onBackToDirectory={() => setActiveTab('AGENDA')}
            onOpenInStandaloneWindow={openStudyInStandaloneWindow}
          />
        )}

        {activeTab === 'PACIENTES' && (
          currentPatientDetail ? (
            <PatientHistoryDetail
              patient={currentPatientDetail}
              studies={studies}
              appointments={appointments}
              onBack={() => setSelectedPatientIdForDetail(null)}
              onOpenViewerWithStudy={handleOpenViewerWithStudy}
              onOpenNewAppointmentForPatient={handleOpenNewAppointmentForPatient}
              onOpenCredentialsModal={pat => setCredentialsModalPatient(pat)}
              onOpenPatientPortal={pat => {
                setPortalPatient(pat);
                setAppMode('PORTAL');
              }}
            />
          ) : (
            <PatientList
              patients={patients}
              studies={studies}
              onSelectPatient={id => setSelectedPatientIdForDetail(id)}
              onOpenNewPatientModal={() => setShowNewPatientModal(true)}
              onOpenNewAppointmentForPatient={handleOpenNewAppointmentForPatient}
              onOpenCredentialsModal={pat => setCredentialsModalPatient(pat)}
            />
          )
        )}

        {activeTab === 'ESTUDIOS' && (
          <StudiesDirectory
            studies={studies}
            onOpenViewerWithStudy={handleOpenViewerWithStudy}
            onSelectPatient={handleSelectPatientProfile}
            onOpenUploadModal={() => setShowUploadStudyModal(true)}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      {showTenantSwitcherModal && (
        <TenantSwitcherModal
          tenants={tenants}
          activeTenantId={activeTenantId}
          allPatients={allPatients}
          allAppointments={allAppointments}
          allStudies={allStudies}
          onSelectTenant={handleSwitchTenant}
          onCreateTenant={handleCreateTenant}
          onClose={() => setShowTenantSwitcherModal(false)}
        />
      )}

      {showNewAppointmentModal && (
        <NewAppointmentModal
          patients={patients}
          onSaveAppointment={handleSaveAppointment}
          onClose={() => setShowNewAppointmentModal(false)}
          onOpenNewPatientModal={() => {
            setShowNewAppointmentModal(false);
            setShowNewPatientModal(true);
          }}
        />
      )}

      {showNewPatientModal && (
        <NewPatientModal
          onSavePatient={handleSavePatient}
          onClose={() => setShowNewPatientModal(false)}
        />
      )}

      {credentialsModalPatient && (
        <PatientCredentialsModal
          patient={credentialsModalPatient}
          clinicSettings={clinicSettings}
          onOpenPatientViewer={pat => {
            setPortalPatient(pat);
            setAppMode('PORTAL');
          }}
          onOpenPatientLogin={() => {
            setPortalPatient(null);
            setAppMode('PORTAL');
          }}
          onClose={() => setCredentialsModalPatient(null)}
        />
      )}

      {safetyModalAppointment && (
        <SafetyQuestionnaireModal
          patient={
            patients.find(p => p.id === safetyModalAppointment.patientId) ||
            allPatients.find(p => p.id === safetyModalAppointment.patientId) || {
              id: safetyModalAppointment.patientId || 'pat-temp',
              fullName: safetyModalAppointment.patientName || 'Paciente',
              dni: safetyModalAppointment.patientDni || 'N/A',
              birthDate: '1980-01-01',
              age: 45,
              gender: 'M',
              phone: safetyModalAppointment.patientPhone || '',
              email: safetyModalAppointment.patientEmail || '',
              address: 'Dirección no registrada',
              bloodType: 'O+',
              allergies: [],
              safetyProfile: {
                hasPacemaker: false,
                hasMetalImplants: false,
                hasClaustrophobia: false,
                isPregnantOrPossible: false,
                contrastAllergy: false,
                diabeticOnMetformin: false,
                allergies: [],
              },
              portalPin: '1234',
            }
          }
          appointment={safetyModalAppointment}
          onSaveVerification={handleSaveSafetyVerification}
          onClose={() => setSafetyModalAppointment(null)}
        />
      )}

      {showNotificationSettingsModal && (
        <NotificationSettingsModal
          settings={notificationSettings}
          logs={notificationLogs}
          appointments={appointments}
          patients={patients}
          onSaveSettings={handleSaveNotificationSettings}
          onSendManualReminder={handleSendManualReminder}
          onClose={() => setShowNotificationSettingsModal(false)}
        />
      )}

      {manualReminderAppointment && (
        <SendManualReminderModal
          appointment={manualReminderAppointment}
          onSendReminder={handleSendManualReminder}
          onClose={() => setManualReminderAppointment(null)}
        />
      )}

      {showReviewRequestsModal && (
        <ReviewAppointmentRequestsModal
          requests={appointmentRequests}
          patients={patients}
          onAcceptRequest={(req, time) => {
            handleAcceptPortalRequest(req, time);
            setShowReviewRequestsModal(false);
          }}
          onRejectRequest={(reqId, reason) => {
            handleRejectPortalRequest(reqId, reason);
          }}
          onClose={() => setShowReviewRequestsModal(false)}
        />
      )}

      {/* Upload Medical Study Modal */}
      {showUploadStudyModal && (
        <UploadMedicalStudyModal
          patients={patients}
          onSaveStudy={handleSaveUploadedStudy}
          onClose={() => setShowUploadStudyModal(false)}
        />
      )}

      {/* Clinic Branding & Identity Settings Modal (Accessible for ADMIN & SUPER_ADMIN) */}
      {showClinicSettingsModal && (currentStaffUser?.role === 'ADMIN' || isSuperAdmin) && (
        <ClinicSettingsModal
          settings={clinicSettings}
          staffUsers={tenantStaffUsers}
          onSave={handleSaveClinicSettings}
          onSaveStaffUsers={newStaff => {
            // Update staff in the global staff list for this tenant
            const updatedAll = [
              ...staffUsers.filter(u => (u.tenantId || DEFAULT_TENANT_ID) !== activeTenantId),
              ...newStaff.map(u => ({ ...u, tenantId: activeTenantId })),
            ];
            setStaffUsers(updatedAll);
            saveStaffUsers(updatedAll);
            const updatedMe = newStaff.find(u => u.id === currentStaffUser.id);
            if (updatedMe) {
              setCurrentStaffUser(updatedMe);
            }
          }}
          onClose={() => setShowClinicSettingsModal(false)}
        />
      )}
    </div>
  );
}
