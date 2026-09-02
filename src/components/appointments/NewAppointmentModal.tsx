import React, { useState } from 'react';
import { Patient, Appointment, ModalityType, AppointmentPriority } from '../../types';
import { MODALITY_CONFIG } from '../../data/initialData';
import { Calendar, Clock, User, ShieldAlert, X, PlusCircle, CheckCircle2 } from 'lucide-react';

interface NewAppointmentModalProps {
  patients: Patient[];
  onSaveAppointment: (appointment: Appointment) => void;
  onClose: () => void;
  onOpenNewPatientModal: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  patients = [],
  onSaveAppointment,
  onClose,
  onOpenNewPatientModal,
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    safePatients[0]?.id || ''
  );
  const [modality, setModality] = useState<ModalityType>('ULTRASONIDO');
  const [studyName, setStudyName] = useState('Ecografía Abdominal Completa');
  const [anatomicalRegion, setAnatomicalRegion] = useState('Abdomen Superior');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [priority, setPriority] = useState<AppointmentPriority>('RUTINA');
  const [requiresContrast, setRequiresContrast] = useState(false);
  const [referringDoctor, setReferringDoctor] = useState('Dr. Alejandro Morales (Medicina General)');
  const [clinicalIndication, setClinicalIndication] = useState('Evaluación abdominal general y control.');
  const [radiologistName, setRadiologistName] = useState('Dr. Alejandro Mendoza Valdivia');
  const [technologistName, setTechnologistName] = useState('Lic. Andrés Salcedo');
  const [notes, setNotes] = useState('');

  const selectedPatient = safePatients.find(p => p && p.id === selectedPatientId) || safePatients[0];

  const handleModalityChange = (newMod: ModalityType) => {
    setModality(newMod);
    switch (newMod) {
      case 'ULTRASONIDO':
        setStudyName('Ecografía Abdominal Completa');
        setAnatomicalRegion('Abdomen Superior');
        setDurationMinutes(20);
        setRequiresContrast(false);
        break;
      case 'DENSITOMETRIA':
        setStudyName('Densitometría Ósea DEXA');
        setAnatomicalRegion('Columna y Cadera');
        setDurationMinutes(20);
        setRequiresContrast(false);
        break;
      case 'RAYOS_X':
        setStudyName('Radiografía de Tórax PA y Lateral');
        setAnatomicalRegion('Tórax');
        setDurationMinutes(15);
        setRequiresContrast(false);
        break;
      case 'RESONANCIA':
        setStudyName('RMN de Columna Lumbar 3.0T');
        setAnatomicalRegion('Columna Lumbar');
        setDurationMinutes(45);
        setRequiresContrast(false);
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const defaultPrepItems = MODALITY_CONFIG[modality]?.defaultPrep || [
      'Ayuno de 4 horas',
      'Retiro de metales',
    ];

    const prepChecklist = defaultPrepItems.map((item, idx) => ({
      id: `p-${idx + 1}`,
      label: item,
      completed: false,
      mandatory: true,
    }));

    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      accessionNumber: `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      patientDni: selectedPatient.dni,
      patientPhone: selectedPatient.phone,
      patientEmail: selectedPatient.email,
      modality,
      studyName,
      anatomicalRegion,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      status: 'PROGRAMADA',
      priority,
      radiologistName,
      technologistName,
      referringDoctor,
      clinicalIndication,
      requiresContrast,
      patientSafetyVerified: false,
      notes,
      prepChecklist,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveAppointment(newApp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Agendar Nueva Cita de Imagenología</h3>
              <p className="text-xs text-slate-500">Asignación de turno, protocolo y preparación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Patient Selector Strip */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Seleccionar Paciente:</label>
              <button
                type="button"
                onClick={onOpenNewPatientModal}
                className="flex items-center gap-1 text-cyan-700 hover:text-cyan-800 text-xs font-bold cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Paciente</span>
              </button>
            </div>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:border-cyan-600 cursor-pointer shadow-xs"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — DNI: {p.dni} ({p.age} años)
                </option>
              ))}
            </select>
            {selectedPatient && (
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span>Tel: {selectedPatient.phone}</span>
                <span>Seguro: {selectedPatient.insuranceProvider}</span>
                {selectedPatient.safetyProfile.allergies.length > 0 && (
                  <span className="text-amber-800 font-semibold">
                    Alergias: {selectedPatient.safetyProfile.allergies.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Modality Selector Grid - User Requested Active Modalities */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Modalidad de Imagenología:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['ULTRASONIDO', 'DENSITOMETRIA', 'RAYOS_X', 'RESONANCIA'] as ModalityType[]).map(modKey => {
                const conf = MODALITY_CONFIG[modKey];
                if (!conf) return null;
                const isSelected = modality === modKey;
                return (
                  <button
                    key={modKey}
                    type="button"
                    onClick={() => handleModalityChange(modKey)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <div className="font-bold text-xs">{conf.label.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{conf.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Study Specific Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Nombre del Estudio:</label>
              <input
                type="text"
                required
                value={studyName}
                onChange={e => setStudyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Región Anatómica:</label>
              <input
                type="text"
                required
                value={anatomicalRegion}
                onChange={e => setAnatomicalRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              />
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Fecha de la Cita:</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Hora del Turno:</label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Duración Estimada:</label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              >
                <option value={15}>15 minutos (Rayos X)</option>
                <option value={20}>20 minutos (Ecografía/DEXA)</option>
                <option value={30}>30 minutos (TAC)</option>
                <option value={45}>45 minutos (RMN)</option>
                <option value={60}>60 minutos (Estudios Complejos)</option>
              </select>
            </div>
          </div>

          {/* Clinical Indication & Referring Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Médico Solicitante / Especialidad:</label>
              <input
                type="text"
                value={referringDoctor}
                onChange={e => setReferringDoctor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Prioridad:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as AppointmentPriority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
              >
                <option value="RUTINA">Rutina (Atención Regular)</option>
                <option value="URGENTE">Urgente (Atención Prioritaria)</option>
                <option value="CONTROL">Control Evolutivo</option>
                <option value="STAT_EMERGENCIA">STAT / Emergencia Inmediata</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-semibold">Indicación Clínica / Motivo:</label>
            <input
              type="text"
              required
              value={clinicalIndication}
              onChange={e => setClinicalIndication(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-600"
            />
          </div>

          {/* Contrast and Staff Assignment */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresContrast}
                onChange={e => setRequiresContrast(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-0 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">Requiere Medio de Contraste Endovenoso / Oral</span>
            </label>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Médico Radiólogo:</span>
                <span className="font-semibold text-slate-800">{radiologistName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tecnólogo Médico:</span>
                <span className="font-semibold text-slate-800">{technologistName}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirmar y Agendar Cita</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
