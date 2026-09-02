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
  Plus,
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
    <div className="flex-1 flex flex-col h-full bg-slate-50 text-slate-800 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" />
            <span>Directorio de Pacientes e Historiales</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registro clínico de filiación, antecedentes, estudios previos y seguridad
          </p>
        </div>

        <button
          onClick={onOpenNewPatientModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Paciente</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 bg-white border-b border-slate-200 px-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, teléfono o seguro..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-cyan-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSafetyAlert(!filterSafetyAlert)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              filterSafetyAlert
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs font-bold'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Solo con Alertas de Seguridad</span>
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                {patients.length === 0 ? 'No hay pacientes registrados todavía' : 'No se encontraron pacientes'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {safePatients.length === 0
                  ? 'Comience registrando el expediente del primer paciente de su consultorio.'
                  : 'Ningún paciente coincide con los filtros o término de búsqueda.'}
              </p>
            </div>
            {safePatients.length === 0 ? (
              <button
                onClick={onOpenNewPatientModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
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
                className="text-xs text-cyan-700 hover:underline cursor-pointer font-semibold"
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
                className="bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-cyan-400 rounded-2xl p-4 transition-all duration-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left Patient Identification */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-11 h-11 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-sm group-hover:border-cyan-500 transition-colors shrink-0">
                    {patient.fullName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {patient.fullName}
                      </h4>
                      <span className="text-xs font-mono text-slate-500">DNI: {patient.dni}</span>
                      <span className="text-[11px] text-slate-500">• {patient.age} años ({patient.gender === 'M' ? 'M' : 'F'})</span>
                      {hasAlerts && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>Precaución</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Tel: {patient.phone}</span>
                      <span>• Seguro: {patient.insuranceProvider}</span>
                      <span>• Sangre: {patient.bloodType}</span>
                    </div>

                    {patient.safetyProfile.allergies.length > 0 && (
                      <div className="text-[11px] text-rose-700 font-medium">
                        Alergias: {patient.safetyProfile.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Studies Count & Fast Action */}
                <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      {patientStudies.length} {patientStudies.length === 1 ? 'Estudio' : 'Estudios'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
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
                      className="p-2 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border border-slate-200 hover:border-cyan-300 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
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
                    className="p-2 bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-700 border border-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-cyan-700" />
                    <span className="hidden sm:inline font-semibold">Agendar</span>
                  </button>

                  <div className="p-1.5 text-slate-400 group-hover:text-cyan-700 transition-colors">
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
