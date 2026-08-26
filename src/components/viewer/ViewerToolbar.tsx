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
  hasReport,
}) => {
  const tools: { id: ViewerToolType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'SELECT', label: 'Seleccionar (Puntero)', icon: MousePointer },
    { id: 'PAN', label: 'Desplazar (Pan)', icon: Move },
    { id: 'ZOOM', label: 'Zoom Dinámico', icon: ZoomIn },
    { id: 'WINDOW_LEVEL', label: 'Ventana / Nivel (W/L)', icon: SunMedium },
    { id: 'RULER', label: 'Calibrador / Regla (mm)', icon: Ruler },
    { id: 'ANGLE', label: 'Medidor de Ángulo', icon: Compass },
    { id: 'ROI', label: 'Región de Interés (ROI HU)', icon: CircleDot },
    { id: 'ARROW', label: 'Flecha de Anotación', icon: ArrowUpRight },
  ];

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Group 1: Interactive Viewport Tools */}
      <div className="flex items-center gap-1 bg-neutral-950/70 p-1 rounded-lg border border-neutral-800/80">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              title={tool.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500 text-neutral-950 font-semibold shadow-xs shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{tool.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Group 2: Window / Level Clinical Presets */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline flex items-center gap-1">
          <Sliders className="w-3 h-3 text-neutral-500" /> Presets W/L:
        </span>
        <div className="flex items-center gap-1 bg-neutral-950/60 p-1 rounded-lg border border-neutral-800/60">
          <button
            onClick={() => onPresetApply('AUTO')}
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Auto
          </button>
          <button
            onClick={() => onPresetApply('BRAIN')}
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Cerebro
          </button>
          <button
            onClick={() => onPresetApply('BONE')}
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Hueso
          </button>
          <button
            onClick={() => onPresetApply('SOFT_TISSUE')}
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Tej. Blando
          </button>
          <button
            onClick={() => onPresetApply('LUNG')}
            className="px-2 py-1 text-[11px] rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Pulmón
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
          className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="GRAYSCALE">Escala de Grises (DICOM)</option>
          <option value="INVERTED">Invertido (Radiografía)</option>
          <option value="PET_HOT">PET / Térmico</option>
          <option value="DOPPLER">Doppler Vascular</option>
          <option value="BONE_WARM">Matiz Óseo Cálido</option>
        </select>
      </div>

      {/* Group 4: Reporting & AI Assistant Actions */}
      <div className="flex items-center gap-2">
        {hasReport && (
          <button
            onClick={onOpenPatientExplanation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium rounded-lg transition-all"
            title="Explicar informe al paciente en palabras sencillas asistido por IA"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Explicación Paciente</span>
          </button>
        )}

        <button
          onClick={onOpenReportDrawer}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm shadow-cyan-600/30 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{hasReport ? 'Ver / Editar Informe' : 'Redactar Informe'}</span>
        </button>
      </div>
    </div>
  );
};
