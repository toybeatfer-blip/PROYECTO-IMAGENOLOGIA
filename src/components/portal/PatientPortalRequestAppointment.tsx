import React, { useState } from 'react';
import { Patient, PatientAppointmentRequest, ModalityType } from '../../types';
import {
  Calendar,
  Clock,
  FileUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  Info,
  Layers,
  ArrowRight,
  FileCheck,
  X,
} from 'lucide-react';
import { MODALITY_CONFIG } from '../../data/initialData';

interface PatientPortalRequestAppointmentProps {
  patient: Patient;
  onRequestSubmitted: (request: PatientAppointmentRequest) => void;
  onCancel: () => void;
}

export const PatientPortalRequestAppointment: React.FC<PatientPortalRequestAppointmentProps> = ({
  patient,
  onRequestSubmitted,
  onCancel,
}) => {
  const [modality, setModality] = useState<ModalityType>('RESONANCIA');
  const [studyName, setStudyName] = useState('RMN de Columna Lumbar');
  const [anatomicalRegion, setAnatomicalRegion] = useState('Columna Lumbar');
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'MANANA' | 'TARDE' | 'NOCHE'>('MANANA');
  const [clinicalReason, setClinicalReason] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Safety checklist
  const [hasContrastAllergy, setHasContrastAllergy] = useState(false);
  const [hasMetalImplants, setHasMetalImplants] = useState(false);
  const [isPregnant, setIsPregnant] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleStudyPreset = (name: string, region: string) => {
    setStudyName(name);
    setAnatomicalRegion(region);
  };

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newReq: PatientAppointmentRequest = {
      id: `req-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.fullName || (patient as any).name || 'Paciente',
      patientDni: patient.dni,
      patientPhone: patient.phone,
      patientEmail: patient.email,
      modality,
      studyName,
      anatomicalRegion,
      preferredDate,
      preferredTimeSlot,
      clinicalReason: clinicalReason || 'Solicitud generada a través del portal de pacientes IMAGIS.',
      medicalOrderFileName: uploadedFileName || 'orden_medica_adjunta_portal.pdf',
      hasContrastAllergy,
      hasMetalImplants,
      isPregnant,
      status: 'PENDIENTE_REVISION',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: 'Solicitud enviada por el paciente desde el portal web seguro.',
    };

    setTimeout(() => {
      onRequestSubmitted(newReq);
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  if (submittedSuccess) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-5 animate-fadeIn shadow-xl">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">¡Solicitud de Cita Recibida!</h2>
          <p className="text-xs text-slate-500">
            Hemos registrado su solicitud para <strong>{studyName}</strong>. Nuestro equipo de coordinación
            médica revisará la orden médica y le asignará su horario definitivo en menos de 2 horas.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Modalidad:</span>
            <span className="font-bold text-cyan-700">{modality}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fecha solicitada:</span>
            <span className="font-bold text-slate-900">{preferredDate} (Turno {preferredTimeSlot})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Canal de confirmación:</span>
            <span className="text-emerald-700 font-bold">SMS al {patient.phone} & Correo</span>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          Volver a Mis Citas
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">
            Formulario de Admisión Digital
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Solicitar Nueva Cita de Imagenología</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete los datos del estudio requerido por su médico para agendar su turno prioritario.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {/* Step 1: Modality Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            1. Seleccione el Tipo de Estudio (Modalidad):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'ULTRASONIDO', label: 'Ultrasonido / Ecografía' },
              { id: 'DENSITOMETRIA', label: 'Densitometría Ósea (DEXA)' },
              { id: 'RAYOS_X', label: 'Rayos X (Radiología)' },
              { id: 'RESONANCIA', label: 'Resonancia Magnética (RMN)' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModality(item.id as ModalityType);
                  if (item.id === 'ULTRASONIDO') handleStudyPreset('Ecografía Abdominal Completa', 'Abdomen');
                  if (item.id === 'DENSITOMETRIA') handleStudyPreset('Densitometría Ósea Columna y Cadera', 'Cadera / Columna');
                  if (item.id === 'RAYOS_X') handleStudyPreset('Radiografía de Tórax PA', 'Tórax');
                  if (item.id === 'RESONANCIA') handleStudyPreset('RMN de Columna Lumbar', 'Columna Lumbar');
                }}
                className={`p-3.5 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                  modality === item.id
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Specific Study Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nombre del estudio según orden médica:
            </label>
            <input
              type="text"
              required
              value={studyName}
              onChange={e => setStudyName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Región anatómica a evaluar:
            </label>
            <input
              type="text"
              required
              value={anatomicalRegion}
              onChange={e => setAnatomicalRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600"
            />
          </div>
        </div>

        {/* Step 3: Date & Slot Preference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Fecha preferida para la cita:
            </label>
            <input
              type="date"
              required
              value={preferredDate}
              onChange={e => setPreferredDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Turno horario de preferencia:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MANANA', label: 'Mañana (07:00 - 13:00)' },
                { id: 'TARDE', label: 'Tarde (13:00 - 18:00)' },
                { id: 'NOCHE', label: 'Noche (18:00 - 21:00)' },
              ].map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setPreferredTimeSlot(slot.id as any)}
                  className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                    preferredTimeSlot === slot.id
                      ? 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {slot.id === 'MANANA' ? '🌅 Mañana' : slot.id === 'TARDE' ? '☀️ Tarde' : '🌙 Noche'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 4: Medical Order Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Adjuntar Orden Médica o Receta (Opcional pero recomendado):
          </label>
          <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl bg-slate-50 cursor-pointer transition-colors">
            <FileUp className="w-7 h-7 text-cyan-600 mb-2" />
            <span className="font-semibold text-slate-800 text-xs">
              {uploadedFileName ? uploadedFileName : 'Haga clic para subir archivo (PDF, JPG, PNG)'}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              {uploadedFileName ? 'Archivo cargado con éxito' : 'O arrastre y suelte su documento aquí'}
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUploadSim}
              className="hidden"
            />
          </label>
        </div>

        {/* Step 5: Clinical Reason */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Motivo de consulta o síntomas principales:
          </label>
          <textarea
            rows={2}
            value={clinicalReason}
            onChange={e => setClinicalReason(e.target.value)}
            placeholder="Ej. Dolor lumbar irradiado, control anual ginecológico, traumatismo reciente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-cyan-600"
          />
        </div>

        {/* Step 6: Safety Questionnaire */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Cuestionario Preventivo de Seguridad Radiológica</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <span className="text-xs text-slate-700">
                ¿Tiene marcapasos cardíaco, clips aneurismáticos o prótesis metálicas?
              </span>
              <input
                type="checkbox"
                checked={hasMetalImplants}
                onChange={e => setHasMetalImplants(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-white border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <span className="text-xs text-slate-700">
                ¿Ha tenido reacciones alérgicas previas a medios de contraste yodados o gadolinio?
              </span>
              <input
                type="checkbox"
                checked={hasContrastAllergy}
                onChange={e => setHasContrastAllergy(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-white border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <span className="text-xs text-slate-700">
                ¿Existe posibilidad de embarazo o periodo de lactancia activa?
              </span>
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={e => setIsPregnant(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-white border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud de Cita'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
