import React, { useState } from 'react';
import { PatientAppointmentRequest, Appointment, Patient, ModalityType } from '../../types';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { MODALITY_CONFIG } from '../../data/initialData';

interface ReviewAppointmentRequestsModalProps {
  requests: PatientAppointmentRequest[];
  patients: Patient[];
  onAcceptRequest: (request: PatientAppointmentRequest, scheduledTime: string) => void;
  onRejectRequest: (requestId: string, reason: string) => void;
  onClose: () => void;
}

export const ReviewAppointmentRequestsModal: React.FC<ReviewAppointmentRequestsModalProps> = ({
  requests = [],
  patients = [],
  onAcceptRequest,
  onRejectRequest,
  onClose,
}) => {
  const safeRequests = Array.isArray(requests) ? requests : [];
  const safePatients = Array.isArray(patients) ? patients : [];

  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    safeRequests.length > 0 ? safeRequests[0].id : ''
  );
  const [scheduledTime, setScheduledTime] = useState('09:30');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const activeRequest = safeRequests.find(r => r && r.id === selectedRequestId) || safeRequests[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Solicitudes de Citas del Portal Web</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                  {safeRequests.filter(r => r && r.status === 'PENDIENTE_REVISION').length} Pendientes
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Revise las solicitudes recibidas desde el portal del paciente y asigne el turno definitivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {requests.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-60" />
            <h4 className="text-white font-bold text-sm">No hay solicitudes pendientes</h4>
            <p className="text-xs">Todas las solicitudes de citas web han sido procesadas.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
            {/* Left requests list */}
            <div className="p-3 overflow-y-auto space-y-2 max-h-[300px] md:max-h-[500px]">
              {requests.map(req => {
                const isSelected = req.id === selectedRequestId;
                return (
                  <button
                    key={req.id}
                    onClick={() => {
                      setSelectedRequestId(req.id);
                      setShowRejectBox(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-neutral-800 border-purple-500 text-white shadow-xs'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[130px]">
                        {req.patientName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          req.status === 'PENDIENTE_REVISION'
                            ? 'bg-amber-950 text-amber-300'
                            : req.status === 'APROBADA'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {req.status === 'PENDIENTE_REVISION' ? 'Pendiente' : req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-cyan-400 font-semibold truncate">
                      {req.studyName}
                    </div>

                    <div className="text-[10px] text-neutral-500 flex justify-between">
                      <span>{req.preferredDate}</span>
                      <span>Turno {req.preferredTimeSlot}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right request detail & actions */}
            {activeRequest && (
              <div className="col-span-2 p-6 overflow-y-auto space-y-5 text-xs text-neutral-200">
                {/* Patient summary */}
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Datos del Solicitante
                    </span>
                    <h4 className="text-base font-extrabold text-white">{activeRequest.patientName}</h4>
                    <p className="text-neutral-400">
                      DNI: <span className="font-mono text-white">{activeRequest.patientDni}</span> | Móvil:{' '}
                      <span className="font-mono text-cyan-400">{activeRequest.patientPhone}</span> | Email:{' '}
                      <span className="text-neutral-300">{activeRequest.patientEmail}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Recibido: {activeRequest.createdAt}
                  </span>
                </div>

                {/* Study & safety screening */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Estudio Solicitado:</span>
                    <span className="font-bold text-white block text-sm">{activeRequest.studyName}</span>
                    <span className="text-cyan-400 font-semibold text-[11px]">
                      Modalidad: {activeRequest.modality} ({activeRequest.anatomicalRegion})
                    </span>
                  </div>

                  <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1">
                    <span className="text-[10px] text-neutral-400 block font-semibold">Preferencia Horaria:</span>
                    <span className="font-bold text-white block text-sm">{activeRequest.preferredDate}</span>
                    <span className="text-emerald-400 font-semibold text-[11px]">
                      Turno: {activeRequest.preferredTimeSlot}
                    </span>
                  </div>
                </div>

                {/* Safety checklist summary */}
                <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
                  <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cuestionario de Seguridad Declarado por Paciente:</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Alergia a Contraste:</span>
                      <span
                        className={`font-bold ${
                          activeRequest.hasContrastAllergy ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {activeRequest.hasContrastAllergy ? 'SÍ (Alerta)' : 'No reporta'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Prótesis / Metales:</span>
                      <span
                        className={`font-bold ${
                          activeRequest.hasMetalImplants ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {activeRequest.hasMetalImplants ? 'SÍ (Precaución)' : 'No reporta'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-500 block text-[10px]">Embarazo / Lactancia:</span>
                      <span
                        className={`font-bold ${
                          activeRequest.isPregnant ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {activeRequest.isPregnant ? 'SÍ' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attached file & reason */}
                <div className="space-y-2">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px]">
                    <span className="text-neutral-500 block text-[10px]">Motivo Clínico / Síntomas:</span>
                    <p className="text-neutral-300 italic mt-0.5">{activeRequest.clinicalReason}</p>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span className="text-neutral-400">Orden médica adjunta:</span>
                    <span className="font-semibold text-white font-mono">
                      {activeRequest.medicalOrderFileName || 'orden_medica.pdf'}
                    </span>
                  </div>
                </div>

                {/* Scheduling controls / Actions */}
                {activeRequest.status === 'PENDIENTE_REVISION' && (
                  <div className="bg-gradient-to-r from-neutral-950 via-purple-950/20 to-neutral-950 p-4 rounded-2xl border border-purple-900/50 space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white text-xs">
                        Asignar Hora Definitiva de Cita:
                      </span>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                      <span className="text-[11px] text-neutral-400">
                        Fecha: {activeRequest.preferredDate}
                      </span>
                    </div>

                    {showRejectBox ? (
                      <div className="space-y-2 pt-2 border-t border-neutral-800">
                        <label className="text-xs text-rose-300 font-semibold block">
                          Motivo del Rechazo o Reprogramación:
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Ej. Falta orden médica con firma, horario saturado, se le contactó por teléfono..."
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowRejectBox(false)}
                            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              onRejectRequest(
                                activeRequest.id,
                                rejectReason || 'No fue posible confirmar en el horario solicitado'
                              );
                              setShowRejectBox(false);
                            }}
                            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                          >
                            Confirmar Rechazo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                        <button
                          onClick={() => setShowRejectBox(true)}
                          className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded-xl font-semibold transition-colors"
                        >
                          Rechazar / Observar
                        </button>

                        <button
                          onClick={() => onAcceptRequest(activeRequest, scheduledTime)}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md transition-all active:scale-[0.99]"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aceptar & Enviar Notificación Automática</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
