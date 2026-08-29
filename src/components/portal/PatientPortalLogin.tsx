import React, { useState, useEffect } from 'react';
import { Patient, ClinicSettings } from '../../types';
import {
  ShieldCheck,
  KeyRound,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Activity,
  HeartPulse,
  Shield,
  Scan,
  AlertTriangle,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface PatientPortalLoginProps {
  patients: Patient[];
  clinicSettings?: ClinicSettings;
  onLoginSuccess?: (patient: Patient) => void;
  onLogin?: (patient: Patient) => void;
  onBackToStaff?: () => void;
  onBackToStaffPortal?: () => void;
}

export const PatientPortalLogin: React.FC<PatientPortalLoginProps> = ({
  patients = [],
  clinicSettings,
  onLoginSuccess,
  onLogin,
  onBackToStaff,
  onBackToStaffPortal,
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];
  const clinicName = clinicSettings?.name || 'IMAGIS';
  const clinicTagline = clinicSettings?.tagline || 'Centro de Diagnóstico por Imágenes & Radiología Médica';

  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Brute-force Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showDemoButtons, setShowDemoButtons] = useState(clinicSettings?.enableDemoMode ?? false);

  useEffect(() => {
    let timer: any;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSuccess = (patient: Patient) => {
    setFailedAttempts(0);
    if (onLoginSuccess) onLoginSuccess(patient);
    if (onLogin) onLogin(patient);
  };

  const handleBack = () => {
    if (onBackToStaff) onBackToStaff();
    if (onBackToStaffPortal) onBackToStaffPortal();
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutSeconds > 0) {
      setErrorMsg(`Acceso bloqueado temporalmente por seguridad. Intente en ${lockoutSeconds} segundos.`);
      return;
    }

    const cleanDni = dni.trim();
    const cleanPin = pin.trim();

    if (!cleanDni || !cleanPin) {
      setErrorMsg('Por favor ingrese su número de documento (DNI) y su código PIN.');
      return;
    }

    const matched = safePatients.find(
      p =>
        p &&
        (p.dni === cleanDni || p.documentNumber === cleanDni) &&
        (p.portalPin === cleanPin || p.portalAccessCode?.toLowerCase() === cleanPin.toLowerCase())
    );

    if (matched) {
      handleSuccess(matched);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (clinicSettings?.enableBruteForceProtection !== false && nextAttempts >= 5) {
        setLockoutSeconds(30);
        setErrorMsg('Demasiados intentos fallidos. Por seguridad, el acceso ha sido bloqueado por 30 segundos.');
      } else {
        const remaining = 5 - nextAttempts;
        setErrorMsg(
          `Credenciales incorrectas. Verifique su DNI y PIN.${
            remaining > 0 && remaining <= 3 ? ` (Quedan ${remaining} intentos antes del bloqueo temporal)` : ''
          }`
        );
      }
    }
  };

  const handleQuickLogin = (patient: Patient) => {
    handleSuccess(patient);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col justify-between select-none font-sans">
      {/* Top Banner */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-700 flex items-center justify-center text-white shadow-md p-1.5 overflow-hidden">
            {clinicSettings?.logoImage ? (
              <img src={clinicSettings.logoImage} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Layers className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">{clinicName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                Portal de Pacientes
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {clinicTagline}
            </p>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
        >
          <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
          <span>Consola Médica</span>
        </button>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-fadeIn">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Header info */}
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Visor de Expediente Clínico</h2>
                <p className="text-xs text-neutral-400">
                  Consulte sus imágenes diagnósticas, informes oficiales, citas y resultados con su DNI y Contraseña
                </p>
              </div>

              {/* Error / Lockout Alert */}
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {lockoutSeconds > 0 && (
                <div className="mb-5 p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Bloqueo temporal activo. Espere: <strong>{lockoutSeconds}s</strong></span>
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Usuario (Número de DNI / Documento):
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={lockoutSeconds > 0}
                      placeholder="Ej. 45892104"
                      value={dni}
                      onChange={e => setDni(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-cyan-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Contraseña / PIN de Seguridad:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      disabled={lockoutSeconds > 0}
                      placeholder="Ej. 1234"
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-cyan-500 font-mono disabled:opacity-50"
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Generado automáticamente en su registro y entregado en su carnet de acceso.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Ver Mi Expediente</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Access (Configurable for internet / production) */}
              <div className="pt-5 mt-5 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowDemoButtons(!showDemoButtons)}
                    className="text-neutral-400 hover:text-cyan-300 flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{showDemoButtons ? 'Ocultar Accesos de Prueba' : 'Ver Cuentas de Demostración'}</span>
                  </button>
                  <span className="text-[10px] text-neutral-600">Ambiente Seguro</span>
                </div>

                {showDemoButtons && (
                  <div className="grid grid-cols-2 gap-2 mt-3 animate-fadeIn">
                    {patients.slice(0, 4).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickLogin(p)}
                        className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-700 text-left transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-xs text-white group-hover:text-cyan-300 truncate">
                            {p.fullName || (p as any).name || 'Paciente'}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            DNI: {p.dni}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-cyan-400/80 mt-1">
                          PIN: {p.portalPin || '1234'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-900/40 px-6 py-4 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Conexión protegida con cabeceras de seguridad y límite de tasa (Rate Limiting)</span>
        </div>
        <div>
          <span>© 2026 {clinicName} - Radiología & Imagenología Digital</span>
        </div>
      </footer>
    </div>
  );
};
