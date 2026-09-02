import React from 'react';
import { ClinicAccount, SuperAdminContactInfo, LicenseEvaluation } from '../../types';
import { calculateLicenseDays } from '../../utils/clinicDatabase';
import {
  ShieldAlert,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  AlertTriangle,
  Building2,
  Calendar,
  X,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface LicenseExpiredModalProps {
  clinic: ClinicAccount;
  superAdminContact: SuperAdminContactInfo;
  onClose: () => void;
}

export const LicenseExpiredModal: React.FC<LicenseExpiredModalProps> = ({
  clinic,
  superAdminContact,
  onClose,
}) => {
  const evalInfo: LicenseEvaluation = calculateLicenseDays(clinic.licenseValidUntil, clinic.licenseStatus);
  const isSuspended = clinic.licenseStatus === 'suspended';

  // Sanitize phone number for WhatsApp URL (remove spaces, symbols)
  const rawPhone = superAdminContact.phone || '+5215512345678';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const defaultMsg = `Hola ${superAdminContact.name || 'Fernando'}, te contacto desde el consultorio *${clinic.clinicName}* (Titular: ${clinic.doctorPrefix} ${clinic.doctorName}, Usuario: ${clinic.username}). Deseamos gestionar la renovación de nuestra licencia mensual en el sistema. ¿Podrías indicarnos los pasos para la reactivación? Muchas gracias.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`;

  const emailSubject = `Solicitud de Renovación de Licencia - ${clinic.clinicName} (${clinic.username})`;
  const emailBody = `Hola ${superAdminContact.name},\n\nNos comunicamos desde ${clinic.clinicName} para solicitar la renovación / reactivación de nuestra suscripción mensual del sistema de imagenología.\n\nDatos de la cuenta:\n- Consultorio: ${clinic.clinicName}\n- Sucursal: ${clinic.branch}\n- Médico Titular: ${clinic.doctorPrefix} ${clinic.doctorName}\n- Cédula: ${clinic.generalLicense}\n- Usuario de Acceso: ${clinic.username}\n- Teléfono: ${clinic.phone}\n\nQuedamos atentos a sus indicaciones.\nSaludos cordiales.`;
  const mailtoUrl = `mailto:${superAdminContact.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border-2 border-amber-300 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-2xl text-amber-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 tracking-tight">
                {isSuspended ? 'Acceso Suspendido' : 'Licencia Mensual Vencida'}
              </h3>
              <p className="text-xs text-amber-800 font-mono font-bold">
                {isSuspended ? 'Bloqueado por Administración' : evalInfo.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs">
          {/* Clinic Overview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-700" />
                <span className="font-bold text-sm text-slate-900">{clinic.clinicName}</span>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                {clinic.branch}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Médico Titular:</span>
                <span className="text-slate-900 font-bold">{clinic.doctorPrefix} {clinic.doctorName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Usuario Registrado:</span>
                <span className="font-mono text-cyan-800 font-bold">{clinic.username}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Fecha de Vencimiento:</span>
                <span className="font-mono text-rose-700 font-bold">{clinic.licenseValidUntil}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold">Estado de Suscripción:</span>
                <span className="font-bold text-amber-800">
                  {isSuspended ? 'SUSPENDIDA' : 'VENCIDA (1 MES)'}
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>¿Por qué no puedo ingresar a mi consultorio?</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900/90">
              {isSuspended
                ? 'Su cuenta ha sido suspendida temporalmente por el Super Administrador. Para reactivar el servicio, póngase en contacto inmediato.'
                : 'La suscripción mensual de 30 días de su consultorio ha concluido. Para continuar atendiendo a sus pacientes y emitiendo informes radiológicos, solicite la renovación mensual (+1 Mes).'}
            </p>
          </div>

          {/* Super Admin Contact Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-cyan-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Contacto Directo con el Administrador
              </span>
              <span className="text-[10px] text-slate-500 font-bold">{superAdminContact.name}</span>
            </div>

            <p className="text-[11px] text-slate-700 italic">
              "{superAdminContact.helpMessage}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer group text-center"
              >
                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Contactar por WhatsApp</span>
              </a>

              <a
                href={mailtoUrl}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer group text-center"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Enviar Correo</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Tel: {superAdminContact.phone} • {superAdminContact.email}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
