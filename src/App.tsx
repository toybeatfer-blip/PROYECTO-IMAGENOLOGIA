import React, { useState, useEffect } from 'react';
import {
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
} from './types';
import {
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
import { AppointmentCalendar } from './components/appointments/AppointmentCalendar';
import { NewAppointmentModal } from './components/appointments/NewAppointmentModal';
import { SafetyQuestionnaireModal } from './components/appointments/SafetyQuestionnaireModal';
import { PatientList } from './components/patients/PatientList';
import { PatientHistoryDetail } from './components/patients/PatientHistoryDetail';
import { NewPatientModal } from './components/patients/NewPatientModal';
import { MedicalImageViewer } from './components/viewer/MedicalImageViewer';
import { StudiesDirectory } from './components/studies/StudiesDirectory';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';
import { SendManualReminderModal } from './components/notifications/SendManualReminderModal';
import { PatientPortalLogin } from './components/portal/PatientPortalLogin';
import { PatientPortal } from './components/portal/PatientPortal';
import { ReviewAppointmentRequestsModal } from './components/portal/ReviewAppointmentRequestsModal';
import { ClinicSettingsModal } from './components/settings/ClinicSettingsModal';
import { UploadMedicalStudyModal } from './components/studies/UploadMedicalStudyModal';
import { StaffLogin } from './components/auth/StaffLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { startCloudSyncPolling, triggerCloudPush } from './utils/cloudSync';
import { getClinicSettings, getClinicPatients } from './utils/clinicDatabase';
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
} from 'lucide-react';

export default function App() {
  // Staff Users & Active Session State (Always starts on Login Screen)
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => getStoredStaffUsers());
  const [currentStaffUser, setCurrentStaffUser] = useState<StaffUser | null>(null);

  // Core Entities State
  const [patients, setPatients] = useState<Patient[]>(() => getStoredPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => getStoredAppointments());
  const [studies, setStudies] = useState<MedicalStudy[]>(() => getStoredStudies());

  // Notification System State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getStoredNotificationSettings()
  );
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() =>
    getStoredNotificationLogs()
  );
  const [appointmentRequests, setAppointmentRequests] = useState<PatientAppointmentRequest[]>(() =>
    getStoredAppointmentRequests()
  );

  // Clinic & Branding Configuration State
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => getStoredClinicSettings());
  const [showClinicSettingsModal, setShowClinicSettingsModal] = useState(false);

  // App High-Level Mode: 'STAFF' (Radiology Console) | 'PORTAL' (Patient Web Portal)
  const [appMode, setAppMode] = useState<'STAFF' | 'PORTAL'>('STAFF');
  const [portalPatient, setPortalPatient] = useState<Patient | null>(null);

  // Staff Navigation State
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'VISOR' | 'PACIENTES' | 'ESTUDIOS'>('AGENDA');
  const [selectedPatientIdForDetail, setSelectedPatientIdForDetail] = useState<string | null>(null);
  const [selectedStudyIdForViewer, setSelectedStudyIdForViewer] = useState<string>(
    studies.length > 0 ? studies[0].id : 'study-001'
  );

  // Modals
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [safetyModalAppointment, setSafetyModalAppointment] = useState<Appointment | null>(null);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [manualReminderAppointment, setManualReminderAppointment] = useState<Appointment | null>(null);
  const [showReviewRequestsModal, setShowReviewRequestsModal] = useState(false);
  const [showUploadStudyModal, setShowUploadStudyModal] = useState(false);

  // Continuous Multi-Device Cloud Sync Polling
  useEffect(() => {
    const cleanup = startCloudSyncPolling(4);
    return () => cleanup();
  }, []);

  // Synchronize with LocalStorage and Cloud
  useEffect(() => {
    saveStoredPatients(patients);
    triggerCloudPush();
  }, [patients]);

  useEffect(() => {
    saveStoredAppointments(appointments);
    triggerCloudPush();
  }, [appointments]);

  useEffect(() => {
    saveStoredStudies(studies);
    triggerCloudPush();
  }, [studies]);

  useEffect(() => {
    saveStoredNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  useEffect(() => {
    saveStoredNotificationLogs(notificationLogs);
  }, [notificationLogs]);

  useEffect(() => {
    saveStoredAppointmentRequests(appointmentRequests);
  }, [appointmentRequests]);

  useEffect(() => {
    saveStoredClinicSettings(clinicSettings);
    triggerCloudPush();
  }, [clinicSettings]);

  // Check URL query param ?setup=true or ?config=true to auto-open clinic configuration
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('config') === 'true' || params.get('setup') === 'true') {
        if (!currentStaffUser || currentStaffUser.role !== 'ADMIN') {
          const adminUser = staffUsers.find(u => u.role === 'ADMIN') || staffUsers[0];
          setCurrentStaffUser(adminUser);
        }
        setShowClinicSettingsModal(true);
      }
    } catch (e) {
      // Ignore in non-browser env
    }
  }, []);

  // Handlers for Staff Authentication
  const handleStaffLoginSuccess = (user: StaffUser) => {
    setCurrentStaffUser(user);
    saveStoredCurrentStaff(user);
  };

  const handleStaffLogout = () => {
    setCurrentStaffUser(null);
    saveStoredCurrentStaff(null);
  };

  // Handlers for Clinic Settings
  const handleSaveClinicSettings = (newSettings: ClinicSettings) => {
    setClinicSettings(newSettings);
  };

  // Handler for Uploading Studies
  const handleSaveUploadedStudy = (newStudy: MedicalStudy, openInViewer: boolean = false) => {
    setStudies(prev => [newStudy, ...prev]);
    if (openInViewer) {
      setSelectedStudyIdForViewer(newStudy.id);
      setActiveTab('VISOR');
    } else {
      setSelectedStudyIdForViewer(newStudy.id);
      setActiveTab('VISOR');
    }
  };

  // Handlers for Patients & Appointments
  const handleSavePatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const handleSaveAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);

    // Create automatic confirmation notification log
    if (notificationSettings.autoSendEnabled) {
      const newLog: NotificationLog = {
        id: `notif-${Date.now()}`,
        patientId: newApp.patientId,
        patientName: newApp.patientName,
        patientDni: newApp.patientDni,
        appointmentId: newApp.id,
        channel: 'SMS',
        type: 'RECORDATORIO_24H',
        recipient: newApp.patientPhone,
        title: `Recordatorio Cita: ${newApp.studyName}`,
        body: `IMAGIS: Hola ${newApp.patientName}, confirmamos su cita para ${newApp.studyName} el ${newApp.scheduledDate} a las ${newApp.scheduledTime}. Acceso web: https://imagis.salud/portal`,
        status: 'ENVIADO',
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        advanceRuleLabel: '24 horas antes',
        modality: newApp.modality,
        studyName: newApp.studyName,
        scheduledDate: newApp.scheduledDate,
        scheduledTime: newApp.scheduledTime,
      };
      setNotificationLogs(prev => [newLog, ...prev]);
    }
  };

  const handleUpdateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(app => (app.id === appointmentId ? { ...app, status: newStatus } : app))
    );
  };

  const handleSaveSafetyVerification = (verified: boolean, updatedNotes?: string) => {
    if (!safetyModalAppointment) return;
    setAppointments(prev =>
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
    setSafetyModalAppointment(null);
  };

  const handleSaveReport = (studyId: string, report: RadiologyReport) => {
    setStudies(prev => prev.map(st => (st.id === studyId ? { ...st, report } : st)));

    // If report is signed, notify patient
    if (report.status === 'FIRMADO_FINAL') {
      setAppointments(prev =>
        prev.map(app =>
          app.associatedStudyId === studyId ? { ...app, status: 'INFORME_FIRMADO' } : app
        )
      );

      const matchingStudy = studies.find(s => s.id === studyId);
      if (matchingStudy) {
        const notif: NotificationLog = {
          id: `notif-report-${Date.now()}`,
          patientId: matchingStudy.patientId,
          patientName: matchingStudy.patientName,
          patientDni: matchingStudy.patientDni,
          studyId: matchingStudy.id,
          channel: 'EMAIL',
          type: 'INFORME_DISPONIBLE',
          recipient: 'paciente@imagis.salud',
          title: `Informe Disponible: ${matchingStudy.studyName}`,
          body: `IMAGIS: Su informe médico firmado para ${matchingStudy.studyName} ya está disponible en el portal del paciente. Puede descargarlo con firma digital.`,
          status: 'ENVIADO',
          sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          advanceRuleLabel: 'Emisión de Informe',
          modality: matchingStudy.modality,
          studyName: matchingStudy.studyName,
        };
        setNotificationLogs(prev => [notif, ...prev]);
      }
    }
  };

  const handleOpenViewerWithStudy = (studyId: string) => {
    setSelectedStudyIdForViewer(studyId);
    setActiveTab('VISOR');
  };

  const handleSelectPatientProfile = (patientId: string) => {
    setSelectedPatientIdForDetail(patientId);
    setActiveTab('PACIENTES');
  };

  const handleOpenNewAppointmentForPatient = (patientId: string) => {
    setShowNewAppointmentModal(true);
  };

  // Notification & Request Handlers
  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
  };

  const handleSendManualReminder = (newLog: NotificationLog) => {
    setNotificationLogs(prev => [newLog, ...prev]);
    setManualReminderAppointment(null);
  };

  const handlePatientAppointmentRequest = (request: PatientAppointmentRequest) => {
    setAppointmentRequests(prev => [request, ...prev]);

    // Create log acknowledging receipt
    const newLog: NotificationLog = {
      id: `notif-req-${Date.now()}`,
      patientId: request.patientId,
      patientName: request.patientName,
      patientDni: request.patientDni,
      channel: 'SMS',
      type: 'CONFIRMACION',
      recipient: request.patientPhone,
      title: 'Solicitud de Cita Recibida',
      body: `IMAGIS: Hemos recibido su solicitud de cita para ${request.studyName}. Nuestro equipo médico revisará la orden médica y le asignará su horario definitivo.`,
      status: 'ENVIADO',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      advanceRuleLabel: 'Solicitud Web',
      modality: request.modality,
      studyName: request.studyName,
      scheduledDate: request.preferredDate,
    };
    setNotificationLogs(prev => [newLog, ...prev]);
  };

  const handleAcceptPortalRequest = (request: PatientAppointmentRequest, scheduledTime: string) => {
    // 1. Create real Appointment
    const newAppointment: Appointment = {
      id: `app-portal-${Date.now()}`,
      patientId: request.patientId,
      patientName: request.patientName,
      patientDni: request.patientDni,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      modality: request.modality,
      studyName: request.studyName,
      anatomicalRegion: request.anatomicalRegion,
      scheduledDate: request.preferredDate,
      scheduledTime: scheduledTime || '09:00',
      durationMinutes: request.modality === 'RESONANCIA' ? 45 : 20,
      status: 'CONFIRMADA',
      priority: 'RUTINA',
      radiologistName: 'Dra. Elena Ramos (Radiología)',
      technologistName: 'Lic. Marco Vega',
      referringDoctor: 'Médico Tratante Externo',
      clinicalIndication: request.clinicalReason,
      requiresContrast: request.studyName.toLowerCase().includes('contraste'),
      requiresFasting: request.modality === 'TOMOGRAFIA' || request.modality === 'ULTRASONIDO',
      fastingHours: 6,
      notes: `Aprobada desde solicitud web portal. Orden: ${request.medicalOrderFileName || 'Adjunta'}`,
      accessionNumber: `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientSafetyVerified: !request.hasContrastAllergy && !request.hasMetalImplants,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
    };

    setAppointments(prev => [newAppointment, ...prev]);

    // 2. Mark request as approved
    setAppointmentRequests(prev =>
      prev.map(r => (r.id === request.id ? { ...r, status: 'APROBADA_AGENDADA', assignedAppointmentId: newAppointment.id } : r))
    );

    // 3. Generate Notification Log
    const confirmLog: NotificationLog = {
      id: `notif-app-${Date.now()}`,
      patientId: request.patientId,
      patientName: request.patientName,
      patientDni: request.patientDni,
      appointmentId: newAppointment.id,
      channel: 'SMS',
      type: 'CONFIRMACION',
      recipient: request.patientPhone,
      title: `Cita Confirmada: ${request.studyName}`,
      body: `IMAGIS: Su cita para ${request.studyName} ha sido confirmada para el ${request.preferredDate} a las ${scheduledTime}. Favor acudir 15 min antes con su DNI.`,
      status: 'ENVIADO',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      advanceRuleLabel: 'Confirmación Definitiva',
      modality: request.modality,
      studyName: request.studyName,
      scheduledDate: request.preferredDate,
      scheduledTime: scheduledTime,
    };
    setNotificationLogs(prev => [confirmLog, ...prev]);
  };


  const handleRejectPortalRequest = (requestId: string, reason: string) => {
    setAppointmentRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: 'RECHAZADA', notes: reason } : r))
    );
  };

  const handlePatientConfirmAppointment = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(a => (a.id === appointmentId ? { ...a, status: 'CONFIRMADA' } : a))
    );
  };

  const currentPatientDetail = selectedPatientIdForDetail
    ? patients.find(p => p.id === selectedPatientIdForDetail)
    : null;

  const pendingRequestsCount = appointmentRequests.filter(r => r.status === 'PENDIENTE_REVISION').length;

  // Helper to render header icon/logo
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
    switch (clinicSettings.logoIcon) {
      case 'Layers':
        return <Layers className="w-5 h-5 text-white" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-white" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-white" />;
      case 'Scan':
        return <Scan className="w-5 h-5 text-white" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5 text-white" />;
      default:
        return <Activity className="w-5 h-5 text-white" />;
    }
  };

  // ==========================================
  // RENDER: PATIENT PORTAL MODE
  // ==========================================
  if (appMode === 'PORTAL') {
    if (!portalPatient) {
      return (
        <PatientPortalLogin
          patients={patients}
          clinicSettings={clinicSettings}
          onLoginSuccess={patient => setPortalPatient(patient)}
          onBackToStaff={() => setAppMode('STAFF')}
        />
      );
    }

    return (
      <PatientPortal
        patient={portalPatient}
        studies={studies}
        appointments={appointments}
        notifications={notificationLogs}
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
        onLogout={() => setPortalPatient(null)}
        onBackToStaff={() => setAppMode('STAFF')}
        onRequestSubmitted={handlePatientAppointmentRequest}
        onConfirmAppointment={handlePatientConfirmAppointment}
      />
    );
  }

  // ==========================================
  // RENDER: STAFF LOGIN IF NOT AUTHENTICATED
  // ==========================================
  if (appMode === 'STAFF' && !currentStaffUser) {
    return (
      <StaffLogin
        staffUsers={staffUsers}
        clinicSettings={clinicSettings}
        onLoginSuccess={handleStaffLoginSuccess}
        onSwitchToPatientPortal={() => {
          setAppMode('PORTAL');
          if (!portalPatient && patients.length > 0) {
            setPortalPatient(patients[0]);
          }
        }}
      />
    );
  }

  // ==========================================
  // RENDER: SUPER ADMIN MASTER DASHBOARD
  // ==========================================
  if (appMode === 'STAFF' && currentStaffUser && currentStaffUser.username.toLowerCase() === 'fernando01') {
    return (
      <SuperAdminDashboard
        currentUser={currentStaffUser}
        onSelectClinicToImpersonate={clinicId => {
          const cSettings = getClinicSettings(clinicId);
          const cPatients = getClinicPatients(clinicId);
          setClinicSettings(cSettings);
          setPatients(cPatients);
          setCurrentStaffUser({
            id: `admin-${clinicId}`,
            username: `admin_${clinicId}`,
            fullName: cSettings.directorName || 'Médico Titular',
            role: 'ADMIN',
            email: cSettings.email,
            phone: cSettings.phone,
            position: cSettings.directorTitle || 'Director Médico',
            avatarIcon: 'ShieldCheck',
          });
        }}
        onLogout={() => {
          setCurrentStaffUser(null);
          saveStoredCurrentStaff(null);
        }}
      />
    );
  }

  // ==========================================
  // RENDER: STAFF CLINICAL CONSOLE MODE
  // ==========================================
  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none antialiased">
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
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                v2.6
              </span>
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              setActiveTab('VISOR');
              setSelectedPatientIdForDetail(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'VISOR'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visor DICOM</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('PACIENTES');
              setSelectedPatientIdForDetail(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
        </nav>

        {/* Action Fast Buttons & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Notification System Settings */}
          <button
            onClick={() => setShowNotificationSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold transition-all relative"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-700/80 rounded-lg text-xs font-semibold shadow-xs animate-pulse transition-all"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Solicitudes ({pendingRequestsCount})</span>
            </button>
          )}

          {/* Upload Study Action Button */}
          <button
            onClick={() => setShowUploadStudyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-semibold shadow-xs transition-all"
            title="Cargar y digitalizar estudio en formatos DICOM, JPG, PNG, MP4, PDF o ZIP"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Cargar Estudio</span>
          </button>

          {/* Clinic & Branding Settings Button (ONLY VISIBLE AND ACCESSIBLE FOR ADMIN ROLE) */}
          {currentStaffUser?.role === 'ADMIN' && (
            <button
              onClick={() => setShowClinicSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/80 rounded-lg text-xs font-semibold transition-all shadow-xs"
              title="Personalizar nombre del centro, dirección, logotipo y director médico (Solo Administrador)"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Configuración</span>
            </button>
          )}

          {/* Switch to Patient Portal */}
          <button
            onClick={() => {
              setAppMode('PORTAL');
              if (!portalPatient && patients.length > 0) {
                setPortalPatient(patients[0]);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Acceder a la vista web que ven los pacientes"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Portal Paciente</span>
          </button>

          {/* New Appointment Modal Trigger */}
          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva Cita</span>
          </button>

          {/* Active Staff User Badge & Logout Button */}
          {currentStaffUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                  currentStaffUser.role === 'ADMIN'
                    ? 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
                    : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                }`}
                title={`Conectado como: ${currentStaffUser.fullName} (${currentStaffUser.position})`}
              >
                {currentStaffUser.role === 'ADMIN' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <div className="text-left leading-none">
                  <span className="text-[10px] font-bold block">{currentStaffUser.role}</span>
                  <span className="text-[9px] text-neutral-400 truncate max-w-[80px] hidden md:inline">
                    {currentStaffUser.fullName.split(' ')[0]}
                  </span>
                </div>
              </div>

              <button
                onClick={handleStaffLogout}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-300 border border-neutral-700 hover:border-rose-800 transition-colors"
                title="Cerrar sesión de la consola clínica"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Dynamic View Router */}
      <main className="flex-1 flex overflow-hidden relative">
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
            />
          ) : (
            <PatientList
              patients={patients}
              studies={studies}
              onSelectPatient={id => setSelectedPatientIdForDetail(id)}
              onOpenNewPatientModal={() => setShowNewPatientModal(true)}
              onOpenNewAppointmentForPatient={handleOpenNewAppointmentForPatient}
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

      {safetyModalAppointment && (
        <SafetyQuestionnaireModal
          patient={
            patients.find(p => p.id === safetyModalAppointment.patientId) || patients[0]
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

      {/* Clinic Branding & Identity Settings Modal (Restricted strictly to ADMIN) */}
      {showClinicSettingsModal && currentStaffUser?.role === 'ADMIN' && (
        <ClinicSettingsModal
          settings={clinicSettings}
          staffUsers={staffUsers}
          onSave={handleSaveClinicSettings}
          onSaveStaffUsers={newStaff => {
            setStaffUsers(newStaff);
            saveStaffUsers(newStaff);
            // If current user was updated, update currentStaffUser state
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
