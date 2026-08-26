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
    <div className="fixed inset-0 z-50 bg-neutral-950/95 text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans backdrop-blur-md">
      {/* Background Warning Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-amber-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-2xl bg-neutral-900 border border-rose-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fadeIn">
        {/* Header Alert */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-neutral-800">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/50">
            <Lock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold uppercase">
              <ShieldAlert className="w-3 h-3" />
              <span>Suscripción de Renta Expirada</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Licencia Bloqueada por Vencimiento de Renta
            </h2>
            <p className="text-xs text-neutral-400">
              El periodo de uso contratado para <strong>{tenant.name}</strong> ha concluido el{' '}
              <span className="text-rose-300 font-mono font-bold">
                {license?.expirationDate || 'Periodo Anterior'}
              </span>
              . Las operaciones clínicas han sido suspendidas temporalmente.
            </p>
          </div>
        </div>

        {/* Pricing & Renewal Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monthly Rental Box */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">Renta Mensual</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                30 DÍAS
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              $59 <span className="text-xs text-neutral-400 font-normal">USD / mes</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Acceso completo al PACS, visor multiplanar DICOM, reportes IA y soporte técnico.
            </p>
            <button
              type="button"
              onClick={() => handleQuickDemoActivation('MONTHLY')}
              className="w-full py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-semibold border border-cyan-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aplicar Clave Mensual Demo</span>
            </button>
          </div>

          {/* Annual Rental Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-900 border border-cyan-700/80 space-y-2 relative overflow-hidden shadow-lg shadow-cyan-950/40">
            <div className="absolute top-2 right-2 bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
              2 MESES GRATIS
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">Renta Anual (Recomendado)</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              $590 <span className="text-xs text-neutral-400 font-normal">USD / año</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Ahorro de 2 mensualidades completas + actualizaciones garantizadas y backup ilimitado.
            </p>
            <button
              type="button"
              onClick={() => handleQuickDemoActivation('ANNUAL')}
              className="w-full py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aplicar Clave Anual Demo</span>
            </button>
          </div>
        </div>

        {/* Key Activation Form */}
        <form onSubmit={handleActivate} className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
          <label className="text-xs font-bold text-neutral-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Ingresar Clave de Activación / Token de Renovación:</span>
          </label>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 font-mono focus:border-cyan-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isActivating}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>licencias@imagis-radiologia.com</span>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+51 987 654 321</span>
            </span>
          </div>

          {onSwitchTenant && (
            <button
              type="button"
              onClick={onSwitchTenant}
              className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
            >
              Cambiar a otra sede clínica
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
