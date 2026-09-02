import React, { useState } from 'react';
import { WifiOff, RefreshCw, Globe, ShieldAlert, CheckCircle2, Server, Clock, AlertTriangle } from 'lucide-react';

interface OfflineLockScreenProps {
  onRetryConnection: () => Promise<boolean>;
  lastError?: string;
}

export const OfflineLockScreen: React.FC<OfflineLockScreenProps> = ({
  onRetryConnection,
  lastError,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsChecking(true);
    setFeedback(null);
    try {
      const isOnline = await onRetryConnection();
      if (!isOnline) {
        setFeedback('Aún no se detecta conexión a Internet activa. Por favor verifique su red o router Wi-Fi.');
      }
    } catch {
      setFeedback('Error al intentar conectar. Verifique su acceso a la red.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fadeIn text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto shadow-xs">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Verificación Obligatoria de Red</span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Conexión a Internet Requerida
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            El sistema de imagenología médica opera en modalidad conectada para{' '}
            <strong className="text-slate-900">validar la licencia de uso</strong>,{' '}
            <strong className="text-slate-900">sincronizar la fecha y hora oficial del servidor</strong> y{' '}
            <strong className="text-slate-900">proteger la integridad de los informes médicos</strong>.
          </p>
        </div>

        {/* Requirements Checklist */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>Sincronización NTP de Fecha y Hora en la nube</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Server className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Autenticación de Licencia contra el Servidor SaaS</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Globe className="w-4 h-4 text-purple-700 shrink-0" />
            <span>Seguridad anti-manipulación de reloj local</span>
          </div>
        </div>

        {/* Error Feedback */}
        {(feedback || lastError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 text-left font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedback || lastError}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={isChecking}
          onClick={handleRetry}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verificando Conexión a Internet...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar Conexión Ahora</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
