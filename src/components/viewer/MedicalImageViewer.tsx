import React, { useState, useEffect } from 'react';
import {
  MedicalStudy,
  MedicalStudySeries,
  MedicalImageSlice,
  ViewerToolType,
  ViewerWindowPreset,
  ColorMapType,
  SliceAnnotation,
  RadiologyReport,
  ClinicSettings,
} from '../../types';
import { ViewerToolbar } from './ViewerToolbar';
import { SeriesThumbnailBar } from './SeriesThumbnailBar';
import { DicomCanvas } from './DicomCanvas';
import { RadiologyReportEditor } from './RadiologyReportEditor';
import { PatientExplanationModal } from './PatientExplanationModal';
import { PrintableReportView } from './PrintableReportView';
import { ShareStudyModal } from '../studies/ShareStudyModal';
import {
  Columns,
  ArrowLeft,
  Search,
  UserCheck,
  Layers,
  Monitor,
  ExternalLink,
  Keyboard,
  X,
  Share2,
} from 'lucide-react';
import { openStudyInStandaloneWindow, broadcastStudySelection } from '../../utils/windowSync';

interface MedicalImageViewerProps {
  studies: MedicalStudy[];
  initialStudyId?: string;
  clinicSettings?: ClinicSettings;
  onSaveReport: (studyId: string, report: RadiologyReport) => void;
  onBackToDirectory?: () => void;
  isStandaloneWindow?: boolean;
  onOpenInStandaloneWindow?: (studyId: string) => void;
}

export const MedicalImageViewer: React.FC<MedicalImageViewerProps> = ({
  studies,
  initialStudyId,
  clinicSettings,
  onSaveReport,
  onBackToDirectory,
  isStandaloneWindow = false,
  onOpenInStandaloneWindow,
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>(
    initialStudyId || (studies.length > 0 ? studies[0].id : '')
  );

  // Synchronize when initialStudyId or studies list updates from outer navigation
  useEffect(() => {
    if (initialStudyId && studies.some(s => s.id === initialStudyId)) {
      setSelectedStudyId(initialStudyId);
      setActiveSeriesIndex(0);
      setSliceIndex(0);
    } else if (studies.length > 0 && !studies.some(s => s.id === selectedStudyId)) {
      setSelectedStudyId(studies[0].id);
      setActiveSeriesIndex(0);
      setSliceIndex(0);
    }
  }, [initialStudyId, studies]);

  const currentStudy = studies.find(s => s.id === selectedStudyId) || studies[0];

  const [activeSeriesIndex, setActiveSeriesIndex] = useState<number>(0);
  const [sliceIndex, setSliceIndex] = useState<number>(0);

  // Split Screen Comparison Mode
  const [isDualSplit, setIsDualSplit] = useState<boolean>(false);
  const [secondarySeriesIndex, setSecondarySeriesIndex] = useState<number>(1);
  const [secondarySliceIndex, setSecondarySliceIndex] = useState<number>(0);

  // Viewport Settings
  const [activeTool, setActiveTool] = useState<ViewerToolType>('SELECT');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [colormap, setColormap] = useState<ColorMapType>('GRAYSCALE');

  // Annotations
  const [annotations, setAnnotations] = useState<SliceAnnotation[]>([]);

  // Modals & Panels
  const [showReportEditor, setShowReportEditor] = useState<boolean>(false);
  const [showPatientExplanation, setShowPatientExplanation] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Safe series & slices resolution
  const studySeriesList: MedicalStudySeries[] =
    currentStudy?.series && currentStudy.series.length > 0
      ? currentStudy.series
      : [
          {
            id: `ser-${currentStudy?.id || 'def'}-fallback`,
            seriesNumber: 1,
            name: currentStudy?.studyName || 'Serie 1',
            plane: 'AXIAL',
            description: 'Serie de adquisición digital',
            matrixSize: '512 x 512',
            pixelSpacing: '0.488mm',
            slices: [
              {
                id: `sl-${currentStudy?.id || 'def'}-1`,
                sliceIndex: 1,
                sliceLocation: 'Corte 1',
                sliceThickness: '1.5mm',
                instanceNumber: 1,
                svgIllustrationKey: 'brain_ventricles_lateral',
              },
            ],
          },
        ];

  const safeActiveSeriesIndex = Math.min(Math.max(0, activeSeriesIndex), studySeriesList.length - 1);
  const activeSeries: MedicalStudySeries = studySeriesList[safeActiveSeriesIndex];

  const seriesSlices: MedicalImageSlice[] =
    activeSeries?.slices && activeSeries.slices.length > 0
      ? activeSeries.slices
      : [
          {
            id: `sl-def-${activeSeries?.id || '1'}-1`,
            sliceIndex: 1,
            sliceLocation: 'Corte 1',
            sliceThickness: '1.5mm',
            instanceNumber: 1,
            svgIllustrationKey: 'brain_ventricles_lateral',
          },
        ];

  const safeSliceIndex = Math.min(Math.max(0, sliceIndex), seriesSlices.length - 1);
  const currentSlice: MedicalImageSlice = seriesSlices[safeSliceIndex];

  // Secondary comparison series resolution
  const safeSecondarySeriesIndex = Math.min(Math.max(0, secondarySeriesIndex), studySeriesList.length - 1);
  const secondarySeries: MedicalStudySeries = studySeriesList[safeSecondarySeriesIndex];
  const secondarySlices: MedicalImageSlice[] =
    secondarySeries?.slices && secondarySeries.slices.length > 0
      ? secondarySeries.slices
      : seriesSlices;
  const safeSecondarySliceIndex = Math.min(Math.max(0, secondarySliceIndex), secondarySlices.length - 1);
  const secondarySlice: MedicalImageSlice = secondarySlices[safeSecondarySliceIndex];

  const handleSelectSeries = (index: number) => {
    setActiveSeriesIndex(index);
    setSliceIndex(0);
  };

  const handleApplyPreset = (preset: ViewerWindowPreset) => {
    switch (preset) {
      case 'BONE':
        setBrightness(70);
        setContrast(180);
        setColormap('GRAYSCALE');
        break;
      case 'SOFT_TISSUE':
        setBrightness(110);
        setContrast(120);
        setColormap('GRAYSCALE');
        break;
      case 'LUNG':
        setBrightness(85);
        setContrast(160);
        setColormap('GRAYSCALE');
        break;
      case 'BRAIN':
        setBrightness(100);
        setContrast(115);
        setColormap('GRAYSCALE');
        break;
      case 'INVERTED':
        setColormap('INVERTED');
        break;
      default:
        setBrightness(100);
        setContrast(100);
        setColormap('GRAYSCALE');
        break;
    }
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setColormap('GRAYSCALE');
  };

  const handleAddAnnotation = (newAnn: SliceAnnotation) => {
    setAnnotations(prev => [...prev, newAnn]);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  // ==========================================
  // ⌨️ PACS ERGONOMIC KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();

      if (key === 'W') {
        setActiveTool('WINDOW_LEVEL');
      } else if (key === 'Z') {
        setActiveTool('ZOOM');
      } else if (key === 'P') {
        setActiveTool('PAN');
      } else if (key === 'R') {
        setActiveTool('RULER');
      } else if (key === 'A') {
        setActiveTool('ANGLE');
      } else if (key === 'C') {
        setActiveTool('ROI');
      } else if (key === 'S') {
        setActiveTool('SELECT');
      } else if (key === 'D') {
        setIsDualSplit(prev => !prev);
      } else if (key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (key === '1') {
        handleApplyPreset('AUTO');
      } else if (key === '2') {
        handleApplyPreset('BRAIN');
      } else if (key === '3') {
        handleApplyPreset('BONE');
      } else if (key === '4') {
        handleApplyPreset('LUNG');
      } else if (key === '5') {
        handleApplyPreset('SOFT_TISSUE');
      } else if (e.key === 'ArrowUp' || e.key === '[') {
        setSliceIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === ']') {
        setSliceIndex(prev => Math.min((seriesSlices.length || 1) - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [seriesSlices.length]);

  if (!currentStudy) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-cyan-400">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No hay estudios radiológicos disponibles</h3>
        <p className="text-xs text-neutral-500 max-w-sm mb-4">
          Seleccione un paciente en la agenda o cargue un nuevo estudio para visualizarlo en el visor PACS.
        </p>
        {onBackToDirectory && (
          <button
            onClick={onBackToDirectory}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Volver a la Agenda / Pacientes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none antialiased">
      {/* Top Study Switcher & Header Bar */}
      <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBackToDirectory && (
            <button
              onClick={onBackToDirectory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium rounded-md border border-neutral-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          )}

          {/* Study Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium hidden sm:inline">Estudio:</span>
            <select
              value={currentStudy.id}
              onChange={e => {
                setSelectedStudyId(e.target.value);
                setActiveSeriesIndex(0);
                setSliceIndex(0);
                broadcastStudySelection(e.target.value);
              }}
              className="bg-neutral-900 border border-neutral-700 text-white text-xs font-medium rounded-md px-3 py-1.5 focus:outline-hidden focus:border-cyan-500 max-w-xs md:max-w-md truncate cursor-pointer"
            >
              {studies.map(st => (
                <option key={st.id} value={st.id}>
                  [{st.modality}] {st.patientName} - {st.studyName} ({st.studyDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Open in Standalone / Secondary Screen Button */}
          {!isStandaloneWindow && (
            <button
              onClick={() => {
                if (onOpenInStandaloneWindow) {
                  onOpenInStandaloneWindow(currentStudy.id);
                } else {
                  openStudyInStandaloneWindow(currentStudy.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 shadow-xs transition-all cursor-pointer"
              title="Abrir este estudio en una ventana independiente para pantalla secundaria (Dual Monitor)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pantalla 2</span>
            </button>
          )}

          {/* Dual Split Screen Toggle */}
          <button
            onClick={() => setIsDualSplit(!isDualSplit)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              isDualSplit
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title="Comparación lado a lado de dos series (Tecla: D)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isDualSplit ? 'Vista Única' : 'Comparar (2 Vistas)'}</span>
          </button>
        </div>
      </div>

      {/* Main Radiology Toolbar with Shortcuts & Share */}
      <ViewerToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        brightness={brightness}
        contrast={contrast}
        colormap={colormap}
        onBrightnessContrastChange={(b, c) => {
          setBrightness(b);
          setContrast(c);
        }}
        onColormapChange={setColormap}
        onPresetApply={handleApplyPreset}
        onResetView={handleResetView}
        onOpenReportDrawer={() => setShowReportEditor(true)}
        onOpenPatientExplanation={() => setShowPatientExplanation(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenShortcutsModal={() => setShowShortcutsModal(true)}
        hasReport={Boolean(currentStudy.report)}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Series Thumbnail Bar */}
        <SeriesThumbnailBar
          series={studySeriesList}
          activeSeriesIndex={safeActiveSeriesIndex}
          onSelectSeries={handleSelectSeries}
        />

        {/* Viewport Canvas (Single or Dual Split) */}
        <div className="flex-1 flex h-full overflow-hidden bg-black">
          {/* Primary Viewport */}
          <div className="flex-1 h-full flex flex-col relative border-r border-neutral-900">
            <DicomCanvas
              study={currentStudy}
              activeSeries={activeSeries}
              currentSlice={currentSlice}
              sliceIndex={safeSliceIndex}
              totalSlices={seriesSlices.length}
              onSliceChange={setSliceIndex}
              activeTool={activeTool}
              zoom={zoom}
              pan={pan}
              brightness={brightness}
              contrast={contrast}
              colormap={colormap}
              onZoomChange={setZoom}
              onPanChange={setPan}
              onBrightnessContrastChange={(b, c) => {
                setBrightness(b);
                setContrast(c);
              }}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
            />
          </div>

          {/* Secondary Comparison Viewport (When Dual Split enabled) */}
          {isDualSplit && (
            <div className="flex-1 h-full flex flex-col relative bg-black">
              {/* Secondary Series Bar */}
              <div className="bg-neutral-950/90 px-3 py-1.5 border-b border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Serie Comparativa:</span>
                <select
                  value={safeSecondarySeriesIndex}
                  onChange={e => {
                    setSecondarySeriesIndex(Number(e.target.value));
                    setSecondarySliceIndex(0);
                  }}
                  className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded px-2 py-0.5 text-xs cursor-pointer"
                >
                  {studySeriesList.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.name} ({s.plane})
                    </option>
                  ))}
                </select>
              </div>
              <DicomCanvas
                study={currentStudy}
                activeSeries={secondarySeries}
                currentSlice={secondarySlice}
                sliceIndex={safeSecondarySliceIndex}
                totalSlices={secondarySlices.length}
                onSliceChange={setSecondarySliceIndex}
                activeTool={activeTool}
                zoom={zoom}
                pan={pan}
                brightness={brightness}
                contrast={contrast}
                colormap={colormap}
                onZoomChange={setZoom}
                onPanChange={setPan}
                onBrightnessContrastChange={(b, c) => {
                  setBrightness(b);
                  setContrast(c);
                }}
                annotations={annotations}
                onAddAnnotation={handleAddAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
            </div>
          )}
        </div>

        {/* Right Drawer: Radiology Report Editor */}
        {showReportEditor && (
          <RadiologyReportEditor
            study={currentStudy}
            onSaveReport={rep => {
              onSaveReport(currentStudy.id, rep);
            }}
            onClose={() => setShowReportEditor(false)}
            onOpenPrintPreview={() => setShowPrintPreview(true)}
          />
        )}
      </div>

      {/* Patient Friendly Explanation Modal */}
      {showPatientExplanation && (
        <PatientExplanationModal
          study={currentStudy}
          onClose={() => setShowPatientExplanation(false)}
        />
      )}

      {/* Printable Report Modal */}
      {showPrintPreview && (
        <PrintableReportView
          study={currentStudy}
          clinicSettings={clinicSettings}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      {/* Share Study WhatsApp / QR Modal */}
      {showShareModal && (
        <ShareStudyModal
          study={currentStudy}
          clinicSettings={clinicSettings}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Atajos de Teclado del Visor PACS</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Ventana / Nivel (W/L)</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">W</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Zoom Dinámico</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">Z</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Desplazar (Pan)</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">P</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Regla / Calibrador</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">R</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Medidor de Ángulo</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">A</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">ROI / Densitometría</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">C</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Puntero / Selección</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">S</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Pantalla Completa</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">F</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Comparar (2 Vistas)</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">D</kbd>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Corte Anterior / Siguiente</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">↑ / ↓</kbd>
                </div>
                <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800">
                  <span className="text-neutral-300">Presets W/L (Auto, Cerebro, Hueso, Pulmón, Tejido)</span>
                  <kbd className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-mono font-bold">1 al 5</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
