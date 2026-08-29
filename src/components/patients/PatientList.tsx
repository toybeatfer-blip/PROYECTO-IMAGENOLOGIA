import React, { useState } from 'react';
import { Patient, MedicalStudy } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  ChevronRight,
  HeartPulse,
  Activity,
  FileCheck2,
  Calendar,
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  studies: MedicalStudy[];
  onSelectPatient: (patientId: string) => void;
  onOpenNewPatientModal: () => void;
  onOpenNewAppointmentForPatient: (patientId: string) => void;
  onOpenCredentialsModal?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients = [],
  studies = [],
  onSelectPatient,
  onOpenNewPatientModal,
  onOpenNewAppointmentForPatient,
  onOpenCredentialsModal,
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];
  const safeStudies = Array.isArray(studies) ? studies : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSafetyAlert, setFilterSafetyAlert] = useState(false);

  const filteredPatients = safePatients.filter(p => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.dni || '').includes(q) ||
      (p.phone || '').includes(q) ||
      (p.insuranceProvider || '').toLowerCase().includes(q);

    if (filterSafetyAlert) {
      const profile = p.safetyProfile || { allergies: [], hasPacemaker: false, hasMetalImplants: false };
      const hasAlert =
        (profile.allergies && profile.allergies.length > 0) ||
        profile.hasPacemaker ||
        (profile.eGFR && profile.eGFR < 60) ||
        profile.hasMetalImplants;
      return matchesSearch && hasAlert;
    }

    return matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Directorio de Pacientes e Historiales</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Registro clínico de filiación, antecedentes, estudios previos y seguridad
          </p>
        </div>

        <button
          onClick={onOpenNewPatientModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Paciente</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 bg-neutral-900/60 border-b border-neutral-800 px-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, teléfono o seguro..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSafetyAlert(!filterSafetyAlert)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterSafetyAlert
                ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-xs'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Solo con Alertas de Seguridad</span>
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 space-y-3">
            <Users className="w-12 h-12 mx-auto text-neutral-600 opacity-50" />
            <div>
              <p className="text-sm font-bold text-white">
                {patients.length === 0 ? 'No hay pacientes registrados todavía' : 'No se encontraron pacientes'}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {safePatients.length === 0
                  ? 'Comience registrando el expediente del primer paciente de su consultorio.'
                  : 'Ningún paciente coincide con los filtros o término de búsqueda.'}
              </p>
            </div>
            {safePatients.length === 0 ? (
              <button
                onClick={onOpenNewPatientModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Primer Paciente</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterSafetyAlert(false);
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Restablecer búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredPatients.map(patient => {
            const patientStudies = safeStudies.filter(
              s => s && (s.patientDni === patient.dni || s.patientName === patient.fullName)
            );
            const hasAlerts =
              patient.safetyProfile.allergies.length > 0 ||
              patient.safetyProfile.hasPacemaker ||
              (patient.safetyProfile.eGFR && patient.safetyProfile.eGFR < 60);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className="bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/80 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left Patient Identification */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-neutral-950 border border-neutral-800 text-cyan-400 flex items-center justify-center font-bold text-sm group-hover:border-cyan-500 transition-colors shrink-0">
                    {patient.fullName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {patient.fullName}
                      </h4>
                      <span className="text-xs font-mono text-neutral-400">DNI: {patient.dni}</span>
                      <span className="text-[11px] text-neutral-500">• {patient.age} años ({patient.gender === 'M' ? 'M' : 'F'})</span>
                      {hasAlerts && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Precaución</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>Tel: {patient.phone}</span>
                      <span>• Seguro: {patient.insuranceProvider}</span>
                      <span>• Sangre: {patient.bloodType}</span>
                    </div>

                    {patient.safetyProfile.allergies.length > 0 && (
                      <div className="text-[11px] text-rose-300 font-medium">
                        Alergias: {patient.safetyProfile.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Studies Count & Fast Action */}
                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-neutral-800 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-neutral-300 block">
                      {patientStudies.length} {patientStudies.length === 1 ? 'Estudio' : 'Estudios'}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      {patientStudies.length > 0 ? `Último: ${patientStudies[0].studyDate}` : 'Sin estudios'}
                    </span>
                  </div>

                  {onOpenCredentialsModal && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onOpenCredentialsModal(patient);
                      }}
                      title="Ver e imprimir credenciales del expediente para el paciente"
                      className="p-2 bg-neutral-800 hover:bg-cyan-950 text-cyan-300 border border-neutral-700/80 hover:border-cyan-500 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>🔑</span>
                      <span className="hidden lg:inline text-[11px] font-semibold">Credenciales</span>
                    </button>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onOpenNewAppointmentForPatient(patient.id);
                    }}
                    title="Agendar cita para este paciente"
                    className="p-2 bg-neutral-800 hover:bg-cyan-600 hover:text-white text-neutral-300 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Agendar</span>
                  </button>

                  <div className="p-1.5 text-neutral-500 group-hover:text-cyan-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
