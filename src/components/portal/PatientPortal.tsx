import React, { useState } from 'react';
import {
  Patient,
  MedicalStudy,
  Appointment,
  NotificationLog,
  PatientAppointmentRequest,
  PatientPortalTab,
  ClinicSettings,
} from '../../types';
import {
  Layers,
  FileText,
  Calendar,
  Sparkles,
  User,
  LogOut,
  Stethoscope,
  Bell,
  PlusCircle,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { PatientPortalStudies } from './PatientPortalStudies';
import { PatientPortalAppointments } from './PatientPortalAppointments';
import { PatientPortalRequestAppointment } from './PatientPortalRequestAppointment';
import { PatientPortalAIChat } from './PatientPortalAIChat';
import { PatientPortalHealthProfile } from './PatientPortalHealthProfile';

interface PatientPortalProps {
  patient: Patient;
  studies: MedicalStudy[];
  appointments: Appointment[];
  notifications: NotificationLog[];
  clinicSettings?: ClinicSettings;
  onOpenViewer: (study: MedicalStudy) => void;
  onOpenReport: (study: MedicalStudy) => void;
  onLogout: () => void;
  onBackToStaff: () => void;
  onRequestSubmitted: (request: PatientAppointmentRequest) => void;
  onConfirmAppointment: (appointmentId: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patient,
  studies = [],
  appointments = [],
  notifications = [],
  clinicSettings,
  onOpenViewer,
  onOpenReport,
  onLogout,
  onBackToStaff,
  onRequestSubmitted,
  onConfirmAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<PatientPortalTab>('STUDIES');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const clinicName = clinicSettings?.name || 'IMAGIS';
  const clinicAddress = clinicSettings?.address || 'Av. Javier Prado Este 2840';
  const clinicPhone = clinicSettings?.phone || '(01) 710-2000';

  const safeStudies = Array.isArray(studies) ? studies : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const patientStudies = safeStudies.filter(
    s => s && (s.patientId === patient?.id || s.patientDni === patient?.dni || (s.patientName && patient?.fullName && s.patientName.toLowerCase() === patient.fullName.toLowerCase()))
  );
  const patientAppointments = safeAppointments.filter(
    a => a && (a.patientId === patient?.id || a.patientDni === patient?.dni)
  );
  const unreadNotifs = safeNotifications.filter(
    n => n && (n.patientId === patient?.id || n.patientDni === patient?.dni) && n.status !== 'LEIDO'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col select-none">
      {/* Top Navbar for Patient */}
      <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Patient Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-cyan-600 shadow-xs p-1.5 overflow-hidden">
              {clinicSettings?.logoImage ? (
                <img src={clinicSettings.logoImage} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Layers className="w-5 h-5 text-cyan-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">{clinicName}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  Portal Paciente
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Bienvenido/a, <strong className="text-slate-900">{patient.fullName || (patient as any).name || 'Paciente'}</strong>
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('STUDIES')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'STUDIES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mis Estudios ({patientStudies.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('APPOINTMENTS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'APPOINTMENTS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mis Citas ({patientAppointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('REQUEST_APPOINTMENT')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'REQUEST_APPOINTMENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-800 hover:bg-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Solicitar Cita</span>
            </button>

            <button
              onClick={() => setActiveTab('AI_ASSISTANT')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'AI_ASSISTANT'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-700 hover:bg-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Asistente IA</span>
            </button>

            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PROFILE'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mi Ficha</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStaff}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs cursor-pointer"
              title="Volver a la vista del radiólogo o recepcionista"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden sm:inline">Consola Médica</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs cursor-pointer"
              title="Cerrar sesión segura del paciente"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs font-semibold animate-fadeIn">
            <button
              onClick={() => {
                setActiveTab('STUDIES');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left cursor-pointer ${
                activeTab === 'STUDIES' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              Mis Estudios ({patientStudies.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('APPOINTMENTS');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left cursor-pointer ${
                activeTab === 'APPOINTMENTS' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              Mis Citas ({patientAppointments.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('REQUEST_APPOINTMENT');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left cursor-pointer ${
                activeTab === 'REQUEST_APPOINTMENT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              Solicitar Cita
            </button>

            <button
              onClick={() => {
                setActiveTab('AI_ASSISTANT');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left cursor-pointer ${
                activeTab === 'AI_ASSISTANT'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-800 border border-purple-200'
              }`}
            >
              Asistente IA
            </button>

            <button
              onClick={() => {
                setActiveTab('PROFILE');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left col-span-2 cursor-pointer ${
                activeTab === 'PROFILE' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              Mi Ficha & Contacto
            </button>
          </div>
        )}
      </header>

      {/* Main View Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'STUDIES' && (
          <PatientPortalStudies
            patient={patient}
            studies={studies}
            onOpenViewer={onOpenViewer}
            onOpenReport={onOpenReport}
          />
        )}

        {activeTab === 'APPOINTMENTS' && (
          <PatientPortalAppointments
            patient={patient}
            appointments={appointments}
            notifications={notifications}
            onRequestNewAppointmentClick={() => setActiveTab('REQUEST_APPOINTMENT')}
            onConfirmAppointment={onConfirmAppointment}
          />
        )}

        {activeTab === 'REQUEST_APPOINTMENT' && (
          <PatientPortalRequestAppointment
            patient={patient}
            onRequestSubmitted={req => {
              onRequestSubmitted(req);
              setActiveTab('APPOINTMENTS');
            }}
            onCancel={() => setActiveTab('APPOINTMENTS')}
          />
        )}

        {activeTab === 'AI_ASSISTANT' && (
          <PatientPortalAIChat
            patient={patient}
            upcomingAppointments={patientAppointments}
            completedStudies={patientStudies}
          />
        )}

        {activeTab === 'PROFILE' && <PatientPortalHealthProfile patient={patient} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 px-6 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>{clinicName} Portal del Paciente - Sesión Protegida y Cifrada</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Central Telefónica: {clinicPhone}</span>
          <span>Sede: {clinicAddress}</span>
        </div>
      </footer>
    </div>
  );
};
