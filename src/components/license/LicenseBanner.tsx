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
          ? 'bg-rose-50 text-rose-900 border-b border-rose-200'
          : 'bg-amber-50 text-amber-900 border-b border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl truncate">
        {isGrace ? (
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        )}
        <span className="truncate">
          {isGrace ? (
            <>
              <strong>Atención:</strong> Su periodo de renta venció el {checkResult.formattedExpirationDate}. Se encuentra en periodo de gracia ({checkResult.daysOverdue} días de retraso). Por favor renueve para evitar la suspensión.
            </>
          ) : (
            <>
              <strong>Aviso de Renovación:</strong> Su licencia de uso vence en{' '}
              <span className="font-mono underline font-bold">{checkResult.daysRemaining} días</span> ({checkResult.formattedExpirationDate}). Renueve su mensualidad o anualidad para garantizar la continuidad del servicio.
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          <Key className="w-3 h-3 text-cyan-700" />
          <span>Renovar Licencia</span>
        </button>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
