import React from 'react';
import { LicenseCheckResult } from '../../utils/license';
import { AlertTriangle, Clock, Key, Sparkles, X } from 'lucide-react';

interface LicenseBannerProps {
  checkResult: LicenseCheckResult;
  onOpenSettings: () => void;
  onDismiss?: () => void;
}

export const LicenseBanner: React.FC<LicenseBannerProps> = ({
  checkResult,
  onOpenSettings,
  onDismiss,
}) => {
  if (!checkResult.isWarning) return null;

  const isGrace = checkResult.inGracePeriod;

  return (
    <div
      className={`px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 select-none transition-all z-30 shrink-0 ${
        isGrace
          ? 'bg-rose-950/90 text-rose-200 border-b border-rose-800'
          : 'bg-amber-950/90 text-amber-200 border-b border-amber-800'
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl truncate">
        {isGrace ? (
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        )}
        <span className="truncate">
          {isGrace ? (
            <>
              <strong>Atención:</strong> Su periodo de renta venció el {checkResult.formattedExpirationDate}. Se encuentra en periodo de gracia ({checkResult.daysOverdue} días de retraso). Por favor renueve para evitar la suspensión.
            </>
          ) : (
            <>
              <strong>Aviso de Renovación:</strong> Su licencia de uso vence en{' '}
              <span className="font-mono underline">{checkResult.daysRemaining} días</span> ({checkResult.formattedExpirationDate}). Renueve su mensualidad o anualidad para garantizar la continuidad del servicio.
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold border border-white/20 transition-all cursor-pointer"
        >
          <Key className="w-3 h-3 text-cyan-300" />
          <span>Renovar Licencia</span>
        </button>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
