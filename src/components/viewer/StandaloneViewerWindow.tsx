import React, { useState, useEffect } from 'react';
import { MedicalStudy, RadiologyReport, ClinicSettings } from '../../types';
import { MedicalImageViewer } from './MedicalImageViewer';
import { onBroadcastMessage, broadcastStudySelection } from '../../utils/windowSync';
import {
  Layers,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  User,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface StandaloneViewerWindowProps {
  studies: MedicalStudy[];
  initialStudyId?: string;
  clinicSettings?: ClinicSettings;
  onSaveReport?: (studyId: string, report: RadiologyReport) => void;
}

export const StandaloneViewerWindow: React.FC<StandaloneViewerWindowProps> = ({
  studies,
  initialStudyId,
  clinicSettings,
  onSaveReport,
}) => {
  const [currentStudyId, setCurrentStudyId] = useState<string>(
    initialStudyId || (studies.length > 0 ? studies[0].id : '')
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);

  // Subscribe to real-time study selection events from the main window (Screen 1)
  useEffect(() => {
    const unsubscribe = onBroadcastMessage(data => {
      if (data.type === 'SELECT_STUDY' && data.studyId) {
        if (studies.some(s => s.id === data.studyId)) {
          setCurrentStudyId(data.studyId);
        }
      }
    });

    return () => unsubscribe();
  }, [studies]);

  // Handle manual study change and broadcast back
  const handleSelectStudy = (studyId: string) => {
    setCurrentStudyId(studyId);
    broadcastStudySelection(studyId);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentStudy = studies.find(s => s.id === currentStudyId) || studies[0];

  return (
    <div className="h-screen w-screen bg-black text-neutral-100 flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* Top Standalone Workstation Header */}
      <header className="bg-neutral-950 border-b border-cyan-900/50 px-4 py-2 flex items-center justify-between gap-4 z-50 shrink-0 shadow-lg">
        {/* Left: Dual Monitor Indicator & Study Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/70 text-cyan-300 text-xs font-mono font-bold">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>PANTALLA SECUNDARIA (VISOR PACS)</span>
          </div>

          {currentStudy && (
            <div className="hidden lg:flex items-center gap-3 text-xs border-l border-neutral-800 pl-3">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span>{currentStudy.patientName}</span>
                <span className="text-[10px] text-neutral-400 font-mono">({currentStudy.patientDni})</span>
              </div>

              <span className="text-neutral-600">•</span>

              <div className="flex items-center gap-1.5 text-neutral-300">
                <span className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-cyan-400 font-mono">
                  {currentStudy.modality}
                </span>
                <span className="font-medium text-xs text-neutral-200">{currentStudy.studyName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Study Switcher & Window Controls */}
        <div className="flex items-center gap-2">
          {/* Study Switcher Dropdown */}
          <div className="relative">
            <select
              value={currentStudy?.id || ''}
              onChange={e => handleSelectStudy(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 pr-7 focus:outline-hidden focus:border-cyan-500 max-w-[220px] sm:max-w-xs md:max-w-md truncate cursor-pointer"
            >
              {studies.map(st => (
                <option key={st.id} value={st.id}>
                  [{st.modality}] {st.patientName} - {st.studyName} ({st.studyDate})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Live Synchronized Badge */}
          <div
            className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/80 text-emerald-400"
            title="Sincronización en vivo con la consola médica principal activa"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sincronizado</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Window */}
          <button
            onClick={() => window.close()}
            className="p-1.5 bg-neutral-900 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-lg border border-neutral-800 hover:border-rose-800 transition-colors cursor-pointer"
            title="Cerrar esta ventana secundaria"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Size Medical Image Viewer */}
      <main className="flex-1 overflow-hidden relative">
        <MedicalImageViewer
          studies={studies}
          initialStudyId={currentStudyId}
          clinicSettings={clinicSettings}
          onSaveReport={onSaveReport || (() => {})}
          isStandaloneWindow={true}
        />
      </main>
    </div>
  );
};
