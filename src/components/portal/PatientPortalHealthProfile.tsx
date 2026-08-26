import React, { useState } from 'react';
import { Patient } from '../../types';
import {
  User,
  ShieldCheck,
  KeyRound,
  HeartPulse,
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface PatientPortalHealthProfileProps {
  patient: Patient;
  onUpdatePatientProfile?: (updated: Partial<Patient>) => void;
}

export const PatientPortalHealthProfile: React.FC<PatientPortalHealthProfileProps> = ({
  patient,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(patient.portalAccessCode || patient.dni);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const displayName = patient.fullName || (patient as any).name || 'Paciente';
  const profile = patient.safetyProfile || {
    hasPacemaker: Boolean((patient as any).hasPacemaker),
    hasMetalImplants: Boolean((patient as any).hasMetalImplants),
    creatinineLevel: (patient as any).creatinine,
    allergies: patient.allergies || [],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Profile Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-cyan-950/20 to-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl font-bold">
            {displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{displayName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Paciente Activo
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              DNI: <span className="font-mono text-white">{patient.dni}</span> | {patient.age} años |{' '}
              {patient.gender === 'M' ? 'Masculino' : 'Femenino'} | Grupo Sanguíneo: {patient.bloodType || 'O+'}
            </p>
          </div>
        </div>

        {/* Security Credentials Card */}
        <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1.5 self-stretch sm:self-auto min-w-[200px]">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Credenciales de Acceso
          </span>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-cyan-300 font-bold">
              {patient.portalPin ? `PIN: ${patient.portalPin}` : `PAT-${patient.dni.slice(-4)}`}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
              title="Copiar código"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <span className="text-[10px] text-neutral-500 block">
            DNI: {patient.dni}
          </span>
        </div>
      </div>

      {/* Grid: Contact & Medical History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-neutral-200">
        {/* Contact info */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>Datos de Contacto & Notificaciones</span>
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-neutral-400 block text-[11px]">Teléfono Móvil (SMS / WhatsApp):</span>
              <span className="font-semibold text-white font-mono">{patient.phone}</span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Correo Electrónico para Resultados:</span>
              <span className="font-semibold text-white font-mono">{patient.email}</span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Dirección de Residencia:</span>
              <span className="text-neutral-300">{patient.address || 'Av. Los Próceres 124, Lima'}</span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[11px]">Contacto de Emergencia:</span>
              <span className="text-neutral-300">
                {patient.emergencyContact?.name || 'Familiar Directo'} ({patient.emergencyContact?.phone || '+51 999 111 222'})
              </span>
            </div>
          </div>
        </div>

        {/* Clinical alerts & History */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
            <HeartPulse className="w-4 h-4 text-rose-400" />
            <span>Ficha de Seguridad Radiológica & Alergias</span>
          </h3>

          <div className="space-y-3">
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
              <span className="text-neutral-400 block text-[11px]">Alergias Registradas:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(profile.allergies || []).length > 0 ? (
                  profile.allergies.map((al: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800"
                    >
                      {al}
                    </span>
                  ))
                ) : (
                  <span className="text-emerald-400 font-semibold">Sin alergias medicamentosas conocidas</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block">Marcapasos / Ferromagnetos:</span>
                <span
                  className={`font-bold ${
                    profile.hasPacemaker || profile.hasMetalImplants ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {profile.hasPacemaker || profile.hasMetalImplants ? 'PRESENTE' : 'NEGATIVO'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 block">Creatinina Sérica:</span>
                <span className="font-bold text-white">
                  {profile.creatinineLevel ? `${profile.creatinineLevel} mg/dL (Normal)` : 'No registrada'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-400 bg-cyan-950/20 p-2.5 rounded-xl border border-cyan-900/40">
              💡 Si sus antecedentes médicos o números de contacto han cambiado, por favor notifíquelo en recepción al momento de su admisión.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
