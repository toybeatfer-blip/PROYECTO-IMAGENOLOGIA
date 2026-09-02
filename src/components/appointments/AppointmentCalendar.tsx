import React, { useState } from 'react';
import { Appointment, ModalityType, AppointmentStatus, Patient, PatientAppointmentRequest } from '../../types';
import { MODALITY_CONFIG } from '../../data/initialData';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Plus,
  Filter,
  Eye,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  PlayCircle,
  UserCheck,
  FileText,
  Layers,
  ChevronRight,
  AlertCircle,
  MoreVertical,
  Bell,
  Send,
  MessageSquare,
  Sparkles,
  Inbox,
  ExternalLink,
} from 'lucide-react';
import { openStudyInStandaloneWindow } from '../../utils/windowSync';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  appointmentRequests?: PatientAppointmentRequest[];
  onOpenNewAppointmentModal: () => void;
  onOpenViewerWithStudy: (studyId: string) => void;
  onOpenSafetyQuestionnaire: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onSelectPatientProfile: (patientId: string) => void;
  onOpenNotificationSettings?: () => void;
  onSendReminder?: (appointment: Appointment) => void;
  onReviewPortalRequests?: () => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments = [],
  patients = [],
  appointmentRequests = [],
  onOpenNewAppointmentModal,
  onOpenViewerWithStudy,
  onOpenSafetyQuestionnaire,
  onUpdateStatus,
  onSelectPatientProfile,
  onOpenNotificationSettings,
  onSendReminder,
  onReviewPortalRequests,
}) => {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeRequests = Array.isArray(appointmentRequests) ? appointmentRequests : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'TODAY' | 'TOMORROW' | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'TIMELINE'>('LIST');

  // Dynamic live dates calculation based on current system time
  const now = new Date();
  const formatIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatShortDisplay = (d: Date) => {
    const day = d.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[d.getMonth()]}`;
  };

  const todayStr = formatIso(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = formatIso(tomorrowDate);

  const todayLabel = `Hoy (${formatShortDisplay(now)})`;
  const tomorrowLabel = `Mañana (${formatShortDisplay(tomorrowDate)})`;

  const pendingRequests = safeRequests.filter(r => r && r.status === 'PENDIENTE_REVISION');

  const filteredAppointments = safeAppointments.filter(app => {
    if (!app) return false;
    // Search matching
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (app.patientName || '').toLowerCase().includes(q) ||
      (app.patientDni || '').includes(q) ||
      (app.accessionNumber || '').toLowerCase().includes(q) ||
      (app.studyName || '').toLowerCase().includes(q);

    // Modality matching
    const matchesModality = selectedModality === 'ALL' || app.modality === selectedModality;

    // Status matching
    const matchesStatus = selectedStatus === 'ALL' || app.status === selectedStatus;

    // Date matching
    let matchesDate = true;
    if (selectedDateFilter === 'TODAY') {
      matchesDate = app.scheduledDate === todayStr;
    } else if (selectedDateFilter === 'TOMORROW') {
      matchesDate = app.scheduledDate === tomorrowStr;
    }

    return matchesSearch && matchesModality && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'PROGRAMADA':
        return { label: 'Programada', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'CONFIRMADA':
        return { label: 'Confirmada', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'EN_ESPERA':
        return { label: 'En Sala de Espera', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'EN_ESTUDIO':
        return { label: 'En Adquisición', bg: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' };
      case 'ESTUDIO_COMPLETADO':
        return { label: 'Estudio Completado', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'EN_INTERPRETACION':
        return { label: 'En Interpretación', bg: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 'INFORME_FIRMADO':
        return { label: 'Informe Firmado', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'ENTREGADO':
        return { label: 'Entregado', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Action Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            <span>Agenda y Turnos de Imagenología</span>
          </h2>
          <p className="text-xs text-slate-500">
            Control de citas por modalidad, preparación y flujo de trabajo asistencial
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pending Portal Requests button */}
          {pendingRequests.length > 0 && onReviewPortalRequests && (
            <button
              onClick={onReviewPortalRequests}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold shadow-xs animate-pulse transition-all cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-purple-600" />
              <span>Solicitudes Web ({pendingRequests.length})</span>
            </button>
          )}

          {/* Notification System Trigger */}
          {onOpenNotificationSettings && (
            <button
              onClick={onOpenNotificationSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="Configurar recordatorios SMS y correo electrónico"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-700" />
              <span>Notificaciones & SMS</span>
            </button>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDateFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Días
            </button>
            <button
              onClick={() => setSelectedDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDateFilter === 'TODAY'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {todayLabel}
            </button>
            <button
              onClick={() => setSelectedDateFilter('TOMORROW')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                selectedDateFilter === 'TOMORROW'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tomorrowLabel}
            </button>
          </div>

          <button
            onClick={onOpenNewAppointmentModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border-b border-slate-200 px-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI, accession # o estudio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-cyan-600"
          />
        </div>

        {/* Modality Filter Pills - User Requested Order */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedModality('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              selectedModality === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Todas ({safeAppointments.length})
          </button>
          {[
            { key: 'ULTRASONIDO', label: 'Ultrasonido' },
            { key: 'DENSITOMETRIA', label: 'Densitometría' },
            { key: 'RAYOS_X', label: 'Rayos X' },
            { key: 'RESONANCIA', label: 'Resonancia Magnética' },
          ].map(item => {
            const isSel = selectedModality === item.key;
            const count = safeAppointments.filter(a => a && a.modality === item.key).length;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedModality(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-xs font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-cyan-600 cursor-pointer shadow-xs"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="EN_ESPERA">En Sala de Espera</option>
          <option value="EN_ESTUDIO">En Adquisición</option>
          <option value="ESTUDIO_COMPLETADO">Estudio Completado</option>
          <option value="INFORME_FIRMADO">Informe Firmado</option>
        </select>
      </div>

      {/* Appointments List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                {safeAppointments.length === 0 ? 'No hay citas agendadas todavía' : 'No se encontraron citas'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {safeAppointments.length === 0
                  ? 'Organice el flujo de su consultorio agendando la primera cita de estudio.'
                  : 'Ninguna cita coincide con los filtros aplicados.'}
              </p>
            </div>
            {safeAppointments.length === 0 ? (
              <button
                onClick={onOpenNewAppointmentModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agendar Primera Cita</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedModality('ALL');
                  setSelectedStatus('ALL');
                  setSelectedDateFilter('ALL');
                }}
                className="text-xs text-cyan-700 hover:underline cursor-pointer font-semibold"
              >
                Restablecer filtros de búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map(app => {
            const modalityConf = MODALITY_CONFIG[app.modality] || {
              label: app.modality,
              color: 'cyan',
              badgeBg: 'bg-cyan-50 text-cyan-700',
              badgeBorder: 'border-cyan-200',
            };
            const statusBadge = getStatusBadge(app.status);
            const isUrgent = app.priority === 'URGENTE' || app.priority === 'STAT_EMERGENCIA';

            return (
              <div
                key={app.id}
                className={`bg-white hover:bg-slate-50/90 border rounded-2xl p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isUrgent ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 hover:border-cyan-300'
                }`}
              >
                {/* Left Section: Time, Modality & Patient info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                  {/* Time Badge */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center min-w-[70px] shrink-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-600" />
                      <span>{app.scheduledTime}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{app.scheduledDate}</div>
                    <div className="text-[9px] text-slate-400 font-mono mt-0.5">{app.durationMinutes} min</div>
                  </div>

                  {/* Study & Patient Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${modalityConf.badgeBg} ${modalityConf.badgeBorder}`}
                      >
                        {app.modality}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {app.priority}
                        </span>
                      )}
                      {app.requiresContrast && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                          + Contraste IV
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700">
                      {app.studyName}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <button
                        onClick={() => onSelectPatientProfile(app.patientId)}
                        className="font-medium text-cyan-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{app.patientName}</span>
                      </button>
                      <span>• DNI: {app.patientDni}</span>
                      <span>• Ref: {app.referringDoctor}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      "{app.clinicalIndication}"
                    </p>
                  </div>
                </div>

                {/* Right Section: Safety Status & Fast Workflow Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  {/* Send Instant Reminder */}
                  {onSendReminder && (
                    <button
                      onClick={() => onSendReminder(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      title="Enviar recordatorio SMS / Correo a este paciente"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Enviar Recordatorio</span>
                    </button>
                  )}

                  {/* Safety Triaje Check Button */}
                  <button
                    onClick={() => onOpenSafetyQuestionnaire(app)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      app.patientSafetyVerified
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 animate-pulse'
                    }`}
                    title="Cuestionario y Triaje de Seguridad Radiológica"
                  >
                    {app.patientSafetyVerified ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{app.patientSafetyVerified ? 'Seguridad Verificada' : 'Triaje Pendiente'}</span>
                  </button>

                  {/* Status Fast Progression Controls */}
                  {app.status === 'PROGRAMADA' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'EN_ESPERA')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Llamar a Espera
                    </button>
                  )}
                  {app.status === 'EN_ESPERA' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'EN_ESTUDIO')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Iniciar Adquisición</span>
                    </button>
                  )}
                  {app.status === 'EN_ESTUDIO' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'ESTUDIO_COMPLETADO')}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Completar Adquisición
                    </button>
                  )}

                  {/* Open DICOM Viewer Button */}
                  {app.associatedStudyId ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenViewerWithStudy(app.associatedStudyId!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir Visor</span>
                      </button>

                      <button
                        onClick={() => openStudyInStandaloneWindow(app.associatedStudyId!)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border border-slate-200 hover:border-cyan-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Abrir estudio en ventana independiente para segunda pantalla"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Pantalla 2</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenViewerWithStudy('study-001')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

