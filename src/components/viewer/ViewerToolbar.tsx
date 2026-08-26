import React from 'react';
import { ViewerToolType, ViewerWindowPreset, ColorMapType } from '../../types';
import {
  MousePointer,
  Move,
  ZoomIn,
  SunMedium,
  Ruler,
  Compass,
  CircleDot,
  ArrowUpRight,
  Palette,
  Sparkles,
  FileText,
  RotateCcw,
  Sliders,
  Share2,
  Keyboard,
} from 'lucide-react';

interface ViewerToolbarProps {
  activeTool: ViewerToolType;
  onToolChange: (tool: ViewerToolType) => void;
  brightness: number;
  contrast: number;
  colormap: ColorMapType;
  onBrightnessContrastChange: (b: number, c: number) => void;
  onColormapChange: (cm: ColorMapType) => void;
  onPresetApply: (preset: ViewerWindowPreset) => void;
  onResetView: () => void;
  onOpenReportDrawer: () => void;
  onOpenPatientExplanation: () => void;
  onOpenShareModal?: () => void;
  onOpenShortcutsModal?: () => void;
  hasReport: boolean;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  activeTool,
  onToolChange,
  brightness,
  contrast,
  colormap,
  onBrightnessContrastChange,
  onColormapChange,
  onPresetApply,
  onResetView,
  onOpenReportDrawer,
  onOpenPatientExplanation,
  onOpenShareModal,
  onOpenShortcutsModal,
  hasReport,
}) => {
  const tools: { id: ViewerToolType; label: string; shortcut: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'SELECT', label: 'Seleccionar (Puntero)', shortcut: 'S', icon: MousePointer },
    { id: 'PAN', label: 'Desplazar (Pan)', shortcut: 'P', icon: Move },
    { id: 'ZOOM', label: 'Zoom Dinámico', shortcut: 'Z', icon: ZoomIn },
    { id: 'WINDOW_LEVEL', label: 'Ventana / Nivel (W/L)', shortcut: 'W', icon: SunMedium },
    { id: 'RULER', label: 'Calibrador / Regla (mm)', shortcut: 'R', icon: Ruler },
    { id: 'ANGLE', label: 'Medidor de Ángulo', shortcut: 'A', icon: Compass },
    { id: 'ROI', label: 'Región de Interés (ROI HU)', shortcut: 'C', icon: CircleDot },
    { id: 'ARROW', label: 'Flecha de Anotación', shortcut: 'Shift+A', icon: ArrowUpRight },
  ];

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 select-none antialiased">
      {/* Group 1: Interactive Viewport Tools with Shortcuts */}
      <div className="flex items-center gap-1 bg-neutral-950/70 p-1 rounded-lg border border-neutral-800/80">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} (Tecla: ${tool.shortcut})`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-neutral-950 font-bold shadow-xs shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{tool.label.split(' ')[0]}</span>
              <kbd className="hidden 2xl:inline text-[9px] px-1 py-0.2 rounded bg-neutral-900/60 text-neutral-400 font-mono">
                {tool.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Group 2: Window / Level Clinical Presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline flex items-center gap-1">
          <Sliders className="w-3 h-3 text-neutral-500" /> Presets:
        </span>
        <div className="flex items-center gap-1 bg-neutral-950/60 p-1 rounded-lg border border-neutral-800/60">
          <button
            onClick={() => onPresetApply('AUTO')}
            title="Auto W/L (Tecla: 1)"
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            Auto
          </button>
          <button
            onClick={() => onPresetApply('BRAIN')}
            title="Preset Cerebro (Tecla: 2)"
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            Cerebro
          </button>
          <button
            onClick={() => onPresetApply('BONE')}
            title="Preset Hueso (Tecla: 3)"
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            Hueso
          </button>
          <button
            onClick={() => onPresetApply('LUNG')}
            title="Preset Pulmón (Tecla: 4)"
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            Pulmón
          </button>
          <button
            onClick={() => onPresetApply('SOFT_TISSUE')}
            title="Preset Tejido Blando (Tecla: 5)"
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            Partes Blandas
          </button>
          <button
            onClick={onResetView}
            title="Restablecer Zoom y Posición"
            className="px-2 py-1 text-[11px] rounded text-cyan-400 hover:bg-cyan-950 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Group 3: Color Palette Maps */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-neutral-400 font-medium hidden md:inline flex items-center gap-1">
          <Palette className="w-3 h-3 text-neutral-500" /> Mapa:
        </span>
        <select
          value={colormap}
          onChange={e => onColormapChange(e.target.value as ColorMapType)}
          className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
        >
          <option value="GRAYSCALE">Escala de Grises (DICOM)</option>
          <option value="INVERTED">Invertido (Radiografía)</option>
          <option value="PET_HOT">PET / Térmico</option>
          <option value="DOPPLER">Doppler Vascular</option>
          <option value="BONE_WARM">Matiz Óseo Cálido</option>
        </select>
      </div>

      {/* Group 4: Shortcuts Help, Share & Reporting Actions */}
      <div className="flex items-center gap-1.5">
        {onOpenShortcutsModal && (
          <button
            onClick={onOpenShortcutsModal}
            className="p-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Ver Atajos de Teclado Rápidos (PACS)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
            title="Compartir estudio e informe por WhatsApp o Enlace Web"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compartir</span>
          </button>
        )}

        {hasReport && (
          <button
            onClick={onOpenPatientExplanation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/70 text-purple-300 border border-purple-700/80 hover:bg-purple-900 text-xs font-medium rounded-lg transition-all cursor-pointer"
            title="Explicar informe al paciente en palabras sencillas asistido por IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Explicación IA</span>
          </button>
        )}

        <button
          onClick={onOpenReportDrawer}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-cyan-600/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{hasReport ? 'Ver / Editar Informe' : 'Redactar Informe'}</span>
        </button>
      </div>
    </div>
  );
};
