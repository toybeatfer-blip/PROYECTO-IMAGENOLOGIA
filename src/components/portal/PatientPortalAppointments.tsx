import React, { useState } from 'react';
import { Appointment, Patient, NotificationLog } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bell,
  Mail,
  Smartphone,
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { MODALITY_CONFIG } from '../../data/initialData';

interface PatientPortalAppointmentsProps {
  patient: Patient;
  appointments: Appointment[];
  notifications: NotificationLog[];
  onRequestNewAppointmentClick: () => void;
  onConfirmAppointment: (appointmentId: string) => void;
}

export const PatientPortalAppointments: React.FC<PatientPortalAppointmentsProps> = ({
  patient,
  appointments = [],
  notifications = [],
  onRequestNewAppointmentClick,
  onConfirmAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY' | 'NOTIFICATIONS'>('UPCOMING');

  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const patientAppointments = safeAppointments.filter(a => a && (a.patientId === patient?.id || a.patientDni === patient?.dni));
  const patientNotifs = safeNotifications.filter(n => n && (n.patientId === patient?.id || n.patientDni === patient?.dni));

  const upcomingApps = patientAppointments.filter(
    a => a && a.status !== 'COMPLETADO' && a.status !== 'INFORME_FIRMADO' && a.status !== 'CANCELADO'
  );

  const pastApps = patientAppointments.filter(
    a => a && (a.status === 'COMPLETADO' || a.status === 'INFORME_FIRMADO' || a.status === 'CANCELADO')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            Agenda & Recordatorios
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Mis Citas Médicas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Revise sus turnos programados, instrucciones de preparación y los avisos recibidos por SMS y correo electrónico.
          </p>
        </div>

        <button
          onClick={onRequestNewAppointmentClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Solicitar Nueva Cita</span>
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'UPCOMING'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-600" />
          <span>Próximas Citas ({upcomingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Historial de Citas Pasadas ({pastApps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-purple-600" />
          <span>Avisos & SMS Recibidos ({patientNotifs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: UPCOMING */}
      {activeTab === 'UPCOMING' && (
        <div className="space-y-4">
          {upcomingApps.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No tiene citas programadas actualmente</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Si su médico le indicó un estudio de imagenología, puede solicitar su turno en línea en pocos minutos.
              </p>
              <button
                onClick={onRequestNewAppointmentClick}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer shadow-xs"
              >
                Solicitar Cita Ahora
              </button>
            </div>
          ) : (
            upcomingApps.map(app => {
              const modConfig = MODALITY_CONFIG[app.modality] || {
                label: app.modality,
                badgeBg: 'bg-cyan-50 text-cyan-700',
                badgeBorder: 'border-cyan-200',
                defaultPrep: ['Presentarse 15 minutos antes con documento de identidad y orden médica.'],
              };

              const isConfirmed = app.status === 'CONFIRMADA' || app.status === 'EN_SALA_ESPERA';

              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${modConfig.badgeBg} ${modConfig.badgeBorder}`}
                      >
                        {modConfig.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{app.studyName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isConfirmed ? 'Asistencia Confirmada' : 'Pendiente de Confirmar'}
                      </span>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Fecha y Hora:</span>
                      </span>
                      <div className="font-bold text-slate-900 text-sm">
                        {app.scheduledDate} a las {app.scheduledTime} hrs
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        (Llegar a las {app.scheduledTime.replace(/:\d+/, ':00')} hrs para recepción)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>Ubicación / Sala:</span>
                      </span>
                      <div className="font-bold text-slate-900">
                        Sede Central - {app.roomName || `Sala de ${app.modality}`}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Av. Javier Prado Este 2840, Piso 2</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Requisitos Clínicos:</span>
                      </span>
                      <div className="font-semibold text-slate-800">
                        {app.requiresContrast ? (
                          <span className="text-amber-800 font-bold">Requiere Contraste IV (Ayuno 6h)</span>
                        ) : (
                          <span className="text-emerald-700">Sin medio de contraste</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">Orden médica obligatoria</span>
                    </div>
                  </div>

                  {/* Preparation Checklist */}
                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-900">
                      <Info className="w-4 h-4 text-cyan-700" />
                      <span>Instrucciones de Preparación Obligatorias:</span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                      {modConfig.defaultPrep.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Código de cita: <code className="text-cyan-700 font-mono font-bold">{app.id}</code>
                    </span>

                    {!isConfirmed && (
                      <button
                        onClick={() => onConfirmAppointment(app.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmar Asistencia a la Cita</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          {pastApps.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs shadow-xs">
              No hay citas pasadas en su historial.
            </div>
          ) : (
            pastApps.map(app => (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{app.studyName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {app.modality}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Realizada el {app.scheduledDate} a las {app.scheduledTime} hrs en {app.roomName || 'Sede Central'}
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completado / Atendido</span>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS INBOX */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="space-y-3">
          {patientNotifs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs shadow-xs">
              No hay avisos o recordatorios archivados para su cuenta.
            </div>
          ) : (
            patientNotifs.map(notif => (
              <div
                key={notif.id}
                className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        notif.channel === 'EMAIL'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {notif.channel === 'EMAIL' ? (
                        <Mail className="w-3 h-3 text-sky-600" />
                      ) : (
                        <Smartphone className="w-3 h-3 text-purple-600" />
                      )}
                      <span>{notif.channel}</span>
                    </span>
                    <span className="font-bold text-slate-900">{notif.title}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">{notif.sentAt}</span>
                </div>

                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {notif.body}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
