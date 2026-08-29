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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Agendar Nueva Cita de Imagenología</h3>
              <p className="text-xs text-neutral-400">Asignación de turno, protocolo y preparación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-neutral-300">
          {/* Patient Selector Strip */}
          <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-200">Seleccionar Paciente:</label>
              <button
                type="button"
                onClick={onOpenNewPatientModal}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Nuevo Paciente</span>
              </button>
            </div>
            <select
              value={selectedPatientId}
              onChange={e => setSelectedPatientId(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} — DNI: {p.dni} ({p.age} años)
                </option>
              ))}
            </select>
            {selectedPatient && (
              <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                <span>Tel: {selectedPatient.phone}</span>
                <span>Seguro: {selectedPatient.insuranceProvider}</span>
                {selectedPatient.safetyProfile.allergies.length > 0 && (
                  <span className="text-amber-400">
                    Alergias: {selectedPatient.safetyProfile.allergies.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Modality Selector Grid - User Requested Active Modalities */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1.5">Modalidad de Imagenología:</label>
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
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-950/40'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{conf.label.split(' ')[0]}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{conf.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Study Specific Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Nombre del Estudio:</label>
              <input
                type="text"
                required
                value={studyName}
                onChange={e => setStudyName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Región Anatómica:</label>
              <input
                type="text"
                required
                value={anatomicalRegion}
                onChange={e => setAnatomicalRegion(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Fecha de la Cita:</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Hora del Turno:</label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Duración Estimada:</label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
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
              <label className="block text-neutral-400 mb-1 font-medium">Médico Solicitante / Especialidad:</label>
              <input
                type="text"
                value={referringDoctor}
                onChange={e => setReferringDoctor(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-medium">Prioridad:</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as AppointmentPriority)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="RUTINA">Rutina (Atención Regular)</option>
                <option value="URGENTE">Urgente (Atención Prioritaria)</option>
                <option value="CONTROL">Control Evolutivo</option>
                <option value="STAT_EMERGENCIA">STAT / Emergencia Inmediata</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Indicación Clínica / Motivo:</label>
            <input
              type="text"
              required
              value={clinicalIndication}
              onChange={e => setClinicalIndication(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Contrast and Staff Assignment */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresContrast}
                onChange={e => setRequiresContrast(e.target.checked)}
                className="rounded border-neutral-700 text-cyan-500 focus:ring-0 w-4 h-4"
              />
              <span className="font-semibold text-white">Requiere Medio de Contraste Endovenoso / Oral</span>
            </label>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px]">Médico Radiólogo:</span>
                <span className="font-medium text-neutral-300">{radiologistName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Tecnólogo Médico:</span>
                <span className="font-medium text-neutral-300">{technologistName}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-neutral-950 -mx-5 -mb-5 border-t border-neutral-800 flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all"
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
