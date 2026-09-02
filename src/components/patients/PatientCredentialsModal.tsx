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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Credenciales del Expediente</h3>
              <p className="text-xs text-slate-500">Acceso digital automático para el paciente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Success Banner */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs">
              <strong>Expediente registrado con éxito.</strong> Se han generado las credenciales de acceso seguras para que el paciente consulte sus estudios en línea.
            </p>
          </div>

          {/* Printable Digital Card */}
          <div
            id="printable-patient-card"
            className="bg-white border-2 border-cyan-300 rounded-3xl p-5 shadow-md space-y-4 relative overflow-hidden"
          >
            {/* Card Clinic Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center font-bold text-white shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm tracking-wide">{clinicName}</h4>
                  <p className="text-[10px] text-cyan-700 font-mono font-bold">PORTAL DE EXPEDIENTE CLÍNICO DIGITAL</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                ACTIVO
              </span>
            </div>

            {/* Patient Info */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Titular del Expediente</span>
              <div className="text-sm font-bold text-slate-900">{patient.fullName}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>DNI: <strong className="text-slate-800">{patient.dni}</strong></span>
                <span>• Tel: {patient.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Generated Credentials Highlight Box */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-700" />
                  USUARIO (DNI)
                </span>
                <div className="text-base font-mono font-extrabold text-cyan-800 tracking-wider">
                  {username}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  CONTRASEÑA / PIN
                </span>
                <div className="text-base font-mono font-extrabold text-emerald-700 tracking-wider">
                  {password}
                </div>
              </div>
            </div>

            {/* Access Instructions */}
            <div className="text-[11px] text-slate-600 space-y-1 pt-1">
              <p className="leading-relaxed">
                👉 Ingrese a la plataforma web seleccionando la opción <strong>"Portal Paciente"</strong> e introduzca su número de <strong>DNI</strong> y <strong>PIN</strong>.
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {clinicAddress} • Tel: {clinicPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-cyan-700" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Credenciales'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-600" />
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-cyan-800 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
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
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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
