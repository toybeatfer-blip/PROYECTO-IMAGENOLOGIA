import React, { useState } from 'react';
import { Patient, ClinicSettings } from '../../types';
import {
  ShieldCheck,
  KeyRound,
  User,
  Copy,
  Check,
  Printer,
  Eye,
  X,
  Share2,
  Lock,
  Layers,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface PatientCredentialsModalProps {
  patient: Patient;
  clinicSettings?: ClinicSettings;
  onOpenPatientViewer: (patient: Patient) => void;
  onOpenPatientLogin?: () => void;
  onClose: () => void;
}

export const PatientCredentialsModal: React.FC<PatientCredentialsModalProps> = ({
  patient,
  clinicSettings,
  onOpenPatientViewer,
  onOpenPatientLogin,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const clinicName = clinicSettings?.name || 'IMAGIS Radiología';
  const clinicAddress = clinicSettings?.address || 'Av. Javier Prado Este 2840, San Isidro';
  const clinicPhone = clinicSettings?.phone || '(01) 710-2000';
  const username = patient.dni;
  const password = patient.portalPin || '1234';
  const accessCode = patient.portalAccessCode || `PAC-${patient.dni.slice(-4)}`;

  const portalUrl = `${window.location.origin}${window.location.pathname}#portal`;

  const credentialsText = `🏥 *${clinicName}* - Acceso al Expediente Digital
👤 *Paciente:* ${patient.fullName}
🆔 *Usuario:* ${username}
🔑 *Contraseña / PIN:* ${password}
🌐 *Enlace de Acceso:* ${portalUrl}
📄 *Instrucciones:* Ingrese al enlace con su DNI y Contraseña para visualizar sus imágenes de alta definición, informes médicos firmados y citas.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Credenciales del Expediente</h3>
              <p className="text-xs text-neutral-400">Acceso digital automático para el paciente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-200">
          {/* Success Banner */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs">
              <strong>Expediente registrado con éxito.</strong> Se han generado las credenciales de acceso seguras para que el paciente consulte sus estudios en línea.
            </p>
          </div>

          {/* Printable Digital Card */}
          <div
            id="printable-patient-card"
            className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-cyan-950/30 border-2 border-cyan-500/40 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Card Clinic Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center font-bold text-white shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm tracking-wide">{clinicName}</h4>
                  <p className="text-[10px] text-cyan-400 font-mono">PORTAL DE EXPEDIENTE CLÍNICO DIGITAL</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                ACTIVO
              </span>
            </div>

            {/* Patient Info */}
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Titular del Expediente</span>
              <div className="text-sm font-bold text-white">{patient.fullName}</div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>DNI: <strong className="text-neutral-200">{patient.dni}</strong></span>
                <span>• Tel: {patient.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Generated Credentials Highlight Box */}
            <div className="grid grid-cols-2 gap-3 bg-neutral-950/90 p-3.5 rounded-2xl border border-cyan-800/60 shadow-inner">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  USUARIO (DNI)
                </span>
                <div className="text-base font-mono font-extrabold text-cyan-300 tracking-wider">
                  {username}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  CONTRASEÑA / PIN
                </span>
                <div className="text-base font-mono font-extrabold text-emerald-400 tracking-wider">
                  {password}
                </div>
              </div>
            </div>

            {/* Access Instructions */}
            <div className="text-[11px] text-neutral-400 space-y-1 pt-1">
              <p className="leading-relaxed">
                👉 Ingrese a la plataforma web seleccionando la opción <strong>"Portal Paciente"</strong> e introduzca su número de <strong>DNI</strong> y <strong>PIN</strong>.
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                {clinicAddress} • Tel: {clinicPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Credenciales'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Carnet</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {onOpenPatientLogin && (
              <button
                type="button"
                onClick={() => {
                  onOpenPatientLogin();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Abrir la pantalla de inicio de sesión donde el paciente ingresa su DNI y PIN"
              >
                <span>Probar Inicio de Sesión</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenPatientViewer(patient);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Expediente Directo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
