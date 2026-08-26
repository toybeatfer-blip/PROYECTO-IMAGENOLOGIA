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
    <div className="fixed inset-0 z-50 bg-neutral-950/95 text-neutral-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans backdrop-blur-md">
      {/* Warning Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-600/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-cyan-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-lg bg-neutral-900 border border-amber-600/70 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 animate-fadeIn text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-500/80 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-950/60">
          <WifiOff className="w-8 h-8 animate-pulse" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Verificación Obligatoria de Red</span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Conexión a Internet Requerida
          </h2>

          <p className="text-xs text-neutral-400 leading-relaxed">
            El sistema de imagenología médica opera en modalidad conectada para{' '}
            <strong className="text-neutral-200">validar la licencia de uso</strong>,{' '}
            <strong className="text-neutral-200">sincronizar la fecha y hora oficial del servidor</strong> y{' '}
            <strong className="text-neutral-200">proteger la integridad de los informes médicos</strong>.
          </p>
        </div>

        {/* Requirements Checklist */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Sincronización NTP de Fecha y Hora en la nube</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Autenticación de Licencia contra el Servidor SaaS</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Globe className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Seguridad anti-manipulación de reloj local</span>
          </div>
        </div>

        {/* Error Feedback */}
        {(feedback || lastError) && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{feedback || lastError}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={isChecking}
          onClick={handleRetry}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
