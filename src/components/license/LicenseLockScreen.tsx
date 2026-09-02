import React, { useState } from 'react';
import { Tenant, ClinicSettings, TenantLicense } from '../../types';
import { activateLicenseKey } from '../../utils/license';
import {
  Lock,
  ShieldAlert,
  Key,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Zap,
} from 'lucide-react';

interface LicenseLockScreenProps {
  tenant: Tenant;
  clinicSettings: ClinicSettings;
  license?: TenantLicense;
  onActivateLicense: (newLicense: TenantLicense) => void;
  onSwitchTenant?: () => void;
}

export const LicenseLockScreen: React.FC<LicenseLockScreenProps> = ({
  tenant,
  clinicSettings,
  license,
  onActivateLicense,
  onSwitchTenant,
}) => {
  const [activationKey, setActivationKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsActivating(true);

    setTimeout(() => {
      const res = activateLicenseKey(activationKey, license);
      if (res.success && res.newLicense) {
        setSuccessMsg('¡Licencia reactivada con éxito! Desbloqueando plataforma...');
        setTimeout(() => {
          onActivateLicense(res.newLicense!);
        }, 1200);
      } else {
        setErrorMsg(res.error || 'Clave de activación inválida.');
      }
      setIsActivating(false);
    }, 600);
  };

  const handleQuickDemoActivation = (type: 'MONTHLY' | 'ANNUAL') => {
    const key = type === 'ANNUAL' ? 'IMAGIS-RENOVACION-ANUAL-2027-OK' : 'IMAGIS-RENOVACION-MENSUAL-2026-DEMO';
    setActivationKey(key);
    setErrorMsg(null);
    const res = activateLicenseKey(key, license);
    if (res.success && res.newLicense) {
      setSuccessMsg(`¡Clave ${type === 'ANNUAL' ? 'Anual' : 'Mensual'} aplicada! Reactivando sistema...`);
      setTimeout(() => {
        onActivateLicense(res.newLicense!);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fadeIn">
        {/* Header Alert */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <Lock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold uppercase">
              <ShieldAlert className="w-3 h-3" />
              <span>Suscripción de Renta Expirada</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Licencia Bloqueada por Vencimiento de Renta
            </h2>
            <p className="text-xs text-slate-500">
              El periodo de uso contratado para <strong>{tenant.name}</strong> ha concluido el{' '}
              <span className="text-rose-700 font-mono font-bold">
                {license?.expirationDate || 'Periodo Anterior'}
              </span>
              . Las operaciones clínicas han sido suspendidas temporalmente.
            </p>
          </div>
        </div>

        {/* Pricing & Renewal Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monthly Rental Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Renta Mensual</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 font-mono border border-slate-200 font-bold">
                30 DÍAS
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              $59 <span className="text-xs text-slate-500 font-normal">USD / mes</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Acceso completo al PACS, visor multiplanar DICOM, reportes IA y soporte técnico.
            </p>
            <button
              type="button"
              onClick={() => handleQuickDemoActivation('MONTHLY')}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-cyan-800 text-xs font-bold border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-700" />
              <span>Aplicar Clave Mensual Demo</span>
            </button>
          </div>

          {/* Annual Rental Box */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-300 space-y-2 relative overflow-hidden shadow-xs">
            <div className="absolute top-2 right-2 bg-cyan-100 text-cyan-900 border border-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
              2 MESES GRATIS
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-950">Renta Anual (Recomendado)</span>
            </div>
            <div className="text-2xl font-black text-cyan-950 font-mono">
              $590 <span className="text-xs text-slate-600 font-normal">USD / año</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Ahorro de 2 mensualidades completas + actualizaciones garantizadas y backup ilimitado.
            </p>
            <button
              type="button"
              onClick={() => handleQuickDemoActivation('ANNUAL')}
              className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aplicar Clave Anual Demo</span>
            </button>
          </div>
        </div>

        {/* Key Activation Form */}
        <form onSubmit={handleActivate} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-700" />
            <span>Ingresar Clave de Activación / Token de Renovación:</span>
          </label>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={activationKey}
              onChange={e => setActivationKey(e.target.value)}
              placeholder="Ej. IMAGIS-MENS-2026-8849-AF31 o DEMO-30-DAYS"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-mono focus:border-cyan-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isActivating}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isActivating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Validar & Desbloquear</span>
            </button>
          </div>
        </form>

        {/* Support & Billing Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-cyan-700" />
              <span>licencias@imagis-radiologia.com</span>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>+51 987 654 321</span>
            </span>
          </div>

          {onSwitchTenant && (
            <button
              type="button"
              onClick={onSwitchTenant}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline cursor-pointer"
            >
              Cambiar a otra sede clínica
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
