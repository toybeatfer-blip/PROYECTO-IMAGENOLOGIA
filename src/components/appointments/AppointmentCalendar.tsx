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
  appointments,
  patients,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'TODAY' | 'TOMORROW' | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'TIMELINE'>('LIST');

  const todayStr = '2026-08-14';
  const tomorrowStr = '2026-08-15';

  const pendingRequests = appointmentRequests.filter(r => r.status === 'PENDIENTE_REVISION');

  const filteredAppointments = appointments.filter(app => {
    // Search matching
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.patientName.toLowerCase().includes(q) ||
      app.patientDni.includes(q) ||
      app.accessionNumber.toLowerCase().includes(q) ||
      app.studyName.toLowerCase().includes(q);

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
        return { label: 'Programada', bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
      case 'CONFIRMADA':
        return { label: 'Confirmada', bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80' };
      case 'EN_ESPERA':
        return { label: 'En Sala de Espera', bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
      case 'EN_ESTUDIO':
        return { label: 'En Adquisición', bg: 'bg-purple-950/80 text-purple-300 border-purple-800/80 animate-pulse' };
      case 'ESTUDIO_COMPLETADO':
        return { label: 'Estudio Completado', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80' };
      case 'EN_INTERPRETACION':
        return { label: 'En Interpretación', bg: 'bg-orange-950/80 text-orange-300 border-orange-800/80' };
      case 'INFORME_FIRMADO':
        return { label: 'Informe Firmado', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' };
      case 'ENTREGADO':
        return { label: 'Entregado', bg: 'bg-neutral-900 text-neutral-400 border-neutral-700' };
      default:
        return { label: status, bg: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top Action Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <span>Agenda y Turnos de Imagenología</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Control de citas por modalidad, preparación y flujo de trabajo asistencial
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Pending Portal Requests button */}
          {pendingRequests.length > 0 && onReviewPortalRequests && (
            <button
              onClick={onReviewPortalRequests}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-700/80 rounded-lg text-xs font-semibold shadow-xs animate-pulse transition-all"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Solicitudes Web ({pendingRequests.length})</span>
            </button>
          )}

          {/* Notification System Trigger */}
          {onOpenNotificationSettings && (
            <button
              onClick={onOpenNotificationSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-semibold transition-all"
              title="Configurar recordatorios SMS y correo electrónico"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>Notificaciones & SMS</span>
            </button>
          )}

          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setSelectedDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedDateFilter === 'ALL'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Todos los Días
            </button>
            <button
              onClick={() => setSelectedDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedDateFilter === 'TODAY'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Hoy (14 Ago)
            </button>
            <button
              onClick={() => setSelectedDateFilter('TOMORROW')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedDateFilter === 'TOMORROW'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Mañana (15 Ago)
            </button>
          </div>

          <button
            onClick={onOpenNewAppointmentModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-neutral-900/60 border-b border-neutral-800/80 px-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI, accession # o estudio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Modality Filter Pills - User Requested Order */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedModality('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedModality === 'ALL'
                ? 'bg-neutral-800 text-white border-white/20 shadow-xs'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
          >
            Todas ({appointments.length})
          </button>
          {[
            { key: 'ULTRASONIDO', label: 'Ultrasonido' },
            { key: 'DENSITOMETRIA', label: 'Densitometría' },
            { key: 'RAYOS_X', label: 'Rayos X' },
            { key: 'RESONANCIA', label: 'Resonancia Magnética' },
          ].map(item => {
            const isSel = selectedModality === item.key;
            const count = appointments.filter(a => a.modality === item.key).length;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedModality(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSel
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
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
          className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
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
          <div className="text-center py-16 text-neutral-500 space-y-3">
            <CalendarIcon className="w-12 h-12 mx-auto text-neutral-600 opacity-50" />
            <div>
              <p className="text-sm font-bold text-white">
                {appointments.length === 0 ? 'No hay citas agendadas todavía' : 'No se encontraron citas'}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {appointments.length === 0
                  ? 'Organice el flujo de su consultorio agendando la primera cita de estudio.'
                  : 'Ninguna cita coincide con los filtros aplicados.'}
              </p>
            </div>
            {appointments.length === 0 ? (
              <button
                onClick={onOpenNewAppointmentModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
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
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
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
              badgeBg: 'bg-cyan-950 text-cyan-300',
              badgeBorder: 'border-cyan-800',
            };
            const statusBadge = getStatusBadge(app.status);
            const isUrgent = app.priority === 'URGENTE' || app.priority === 'STAT_EMERGENCIA';

            return (
              <div
                key={app.id}
                className={`bg-neutral-900/80 hover:bg-neutral-900 border rounded-xl p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isUrgent ? 'border-amber-500/50 bg-amber-950/10' : 'border-neutral-800/80'
                }`}
              >
                {/* Left Section: Time, Modality & Patient info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                  {/* Time Badge */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-center min-w-[70px] shrink-0">
                    <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{app.scheduledTime}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{app.scheduledDate}</div>
                    <div className="text-[9px] text-neutral-500 font-mono mt-0.5">{app.durationMinutes} min</div>
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700">
                          {app.priority}
                        </span>
                      )}
                      {app.requiresContrast && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          + Contraste IV
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400">
                      {app.studyName}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <button
                        onClick={() => onSelectPatientProfile(app.patientId)}
                        className="font-medium text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{app.patientName}</span>
                      </button>
                      <span>• DNI: {app.patientDni}</span>
                      <span>• Ref: {app.referringDoctor}</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 italic line-clamp-1">
                      "{app.clinicalIndication}"
                    </p>
                  </div>
                </div>

                {/* Right Section: Safety Status & Fast Workflow Actions */}
                <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-800">
                  {/* Send Instant Reminder */}
                  {onSendReminder && (
                    <button
                      onClick={() => onSendReminder(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 transition-colors"
                      title="Enviar recordatorio SMS / Correo a este paciente"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Recordatorio</span>
                    </button>
                  )}

                  {/* Safety Triaje Check Button */}
                  <button
                    onClick={() => onOpenSafetyQuestionnaire(app)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      app.patientSafetyVerified
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/80 hover:bg-emerald-950'
                        : 'bg-amber-950/40 text-amber-300 border-amber-700/80 hover:bg-amber-950 animate-pulse'
                    }`}
                    title="Cuestionario y Triaje de Seguridad Radiológica"
                  >
                    {app.patientSafetyVerified ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{app.patientSafetyVerified ? 'Seguridad Verificada' : 'Triaje Pendiente'}</span>
                  </button>

                  {/* Status Fast Progression Controls */}
                  {app.status === 'PROGRAMADA' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'EN_ESPERA')}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
                    >
                      Llamar a Espera
                    </button>
                  )}
                  {app.status === 'EN_ESPERA' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'EN_ESTUDIO')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Iniciar Adquisición</span>
                    </button>
                  )}
                  {app.status === 'EN_ESTUDIO' && (
                    <button
                      onClick={() => onUpdateStatus(app.id, 'ESTUDIO_COMPLETADO')}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Completar Adquisición
                    </button>
                  )}

                  {/* Open DICOM Viewer Button */}
                  {app.associatedStudyId ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenViewerWithStudy(app.associatedStudyId!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-cyan-600/30 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir Visor</span>
                      </button>

                      <button
                        onClick={() => openStudyInStandaloneWindow(app.associatedStudyId!)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-neutral-700 hover:border-cyan-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Abrir estudio en ventana independiente para segunda pantalla"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Pantalla 2</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenViewerWithStudy('study-001')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
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

