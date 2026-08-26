import React, { useRef, useState, useEffect } from 'react';
import { MedicalStudy, MedicalStudySeries, MedicalImageSlice, ViewerToolType, ColorMapType, SliceAnnotation } from '../../types';
import { AnatomySVGs } from './AnatomySVGs';
import { Maximize2, RotateCcw, Crosshair } from 'lucide-react';

interface DicomCanvasProps {
  study: MedicalStudy;
  activeSeries: MedicalStudySeries;
  currentSlice: MedicalImageSlice;
  sliceIndex: number;
  totalSlices: number;
  onSliceChange: (index: number) => void;
  activeTool: ViewerToolType;
  zoom: number;
  pan: { x: number; y: number };
  brightness: number;
  contrast: number;
  colormap: ColorMapType;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onBrightnessContrastChange: (b: number, c: number) => void;
  annotations: SliceAnnotation[];
  onAddAnnotation: (ann: SliceAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const DicomCanvas: React.FC<DicomCanvasProps> = ({
  study,
  activeSeries,
  currentSlice,
  sliceIndex,
  totalSlices,
  onSliceChange,
  activeTool,
  zoom,
  pan,
  brightness,
  contrast,
  colormap,
  onZoomChange,
  onPanChange,
  onBrightnessContrastChange,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionStart, setInteractionStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDrawing, setActiveDrawing] = useState<Partial<SliceAnnotation> | null>(null);
  const [mousePosHud, setMousePosHud] = useState<{ x: number; y: number; hu: number }>({ x: 0, y: 0, hu: 35 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Wheel event for fast multi-slice browsing or zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || activeTool === 'ZOOM') {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(0.5, zoom + delta), 4.0);
      onZoomChange(Number(newZoom.toFixed(2)));
    } else {
      if (totalSlices > 1) {
        if (e.deltaY > 0) {
          onSliceChange(Math.min(totalSlices - 1, sliceIndex + 1));
        } else {
          onSliceChange(Math.max(0, sliceIndex - 1));
        }
      }
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    // Map to 512x512 space accounting for zoom and pan
    const centerX = rect.width / 2 + pan.x;
    const centerY = rect.height / 2 + pan.y;
    const scale = (Math.min(rect.width, rect.height) / 512) * zoom;

    const x = Math.round((clientX - centerX) / scale + 256);
    const y = Math.round((clientY - centerY) / scale + 256);
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    const coords = getCanvasCoords(e);
    setIsInteracting(true);
    setInteractionStart({ x: e.clientX, y: e.clientY });

    if (activeTool === 'RULER') {
      setActiveDrawing({
        id: 'ann-' + Date.now(),
        type: 'RULER',
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        sliceIndex,
      });
    } else if (activeTool === 'ANGLE') {
      setActiveDrawing({
        id: 'ann-' + Date.now(),
        type: 'ANGLE',
        startX: coords.x,
        startY: coords.y,
        endX: coords.x + 30,
        endY: coords.y - 30,
        point3X: coords.x + 60,
        point3Y: coords.y,
        sliceIndex,
      });
    } else if (activeTool === 'ROI') {
      setActiveDrawing({
        id: 'ann-' + Date.now(),
        type: 'ROI_CIRCLE',
        startX: coords.x,
        startY: coords.y,
        endX: coords.x + 10,
        endY: coords.y + 10,
        sliceIndex,
      });
    } else if (activeTool === 'ARROW') {
      setActiveDrawing({
        id: 'ann-' + Date.now(),
        type: 'ARROW',
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        sliceIndex,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e);
    // Approximate HU based on coordinate distance from center
    const distFromCenter = Math.sqrt(Math.pow(coords.x - 256, 2) + Math.pow(coords.y - 256, 2));
    let approxHu = 35;
    if (distFromCenter > 190 && distFromCenter < 215) {
      approxHu = 850; // Cortical bone
    } else if (distFromCenter <= 180) {
      approxHu = Math.round(25 + Math.sin(coords.x / 20) * 15); // Brain / Soft tissue
    } else {
      approxHu = -980; // Air
    }
    setMousePosHud({ x: coords.x, y: coords.y, hu: approxHu });

    if (!isInteracting) return;

    const dx = e.clientX - interactionStart.x;
    const dy = e.clientY - interactionStart.y;

    if (activeTool === 'PAN') {
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      setInteractionStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'ZOOM') {
      const zoomDelta = -dy * 0.005;
      onZoomChange(Math.min(Math.max(0.5, zoom + zoomDelta), 4.0));
      setInteractionStart({ x: e.clientX, y: e.clientY });
    } else if (activeTool === 'WINDOW_LEVEL') {
      const newB = Math.min(Math.max(20, brightness + dx * 0.4), 220);
      const newC = Math.min(Math.max(20, contrast - dy * 0.4), 220);
      onBrightnessContrastChange(Math.round(newB), Math.round(newC));
      setInteractionStart({ x: e.clientX, y: e.clientY });
    } else if (activeDrawing) {
      if (activeDrawing.type === 'RULER' || activeDrawing.type === 'ARROW' || activeDrawing.type === 'ROI_CIRCLE') {
        setActiveDrawing(prev => ({
          ...prev,
          endX: coords.x,
          endY: coords.y,
        }));
      }
    }
  };

  const handleMouseUp = () => {
    if (isInteracting && activeDrawing && activeDrawing.startX !== undefined && activeDrawing.endX !== undefined) {
      // Calculate measurement values
      let measurementValue = '';
      if (activeDrawing.type === 'RULER' || activeDrawing.type === 'ARROW') {
        const pixelDist = Math.sqrt(
          Math.pow(activeDrawing.endX - activeDrawing.startX, 2) +
            Math.pow((activeDrawing.endY || 0) - (activeDrawing.startY || 0), 2)
        );
        // Approx 0.48 mm per pixel
        const mm = (pixelDist * 0.48).toFixed(1);
        measurementValue = `${mm} mm`;
      } else if (activeDrawing.type === 'ROI_CIRCLE') {
        const radius = Math.sqrt(
          Math.pow(activeDrawing.endX - activeDrawing.startX, 2) +
            Math.pow((activeDrawing.endY || 0) - (activeDrawing.startY || 0), 2)
        );
        const areaCm2 = ((Math.PI * Math.pow(radius * 0.048, 2)) / 10).toFixed(2);
        measurementValue = `Área: ${areaCm2} cm² | HU: 38.4 ± 4.2`;
      } else if (activeDrawing.type === 'ANGLE') {
        measurementValue = 'Ang: 114.6°';
      }

      onAddAnnotation({
        id: 'ann-' + Date.now(),
        type: activeDrawing.type as any,
        startX: activeDrawing.startX,
        startY: activeDrawing.startY,
        endX: activeDrawing.endX,
        endY: activeDrawing.endY,
        point3X: activeDrawing.point3X,
        point3Y: activeDrawing.point3Y,
        measurementValue,
        sliceIndex,
      });
      setActiveDrawing(null);
    }
    setIsInteracting(false);
  };

  // Keyboard navigation for multi-slice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        onSliceChange(Math.max(0, sliceIndex - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        onSliceChange(Math.min(totalSlices - 1, sliceIndex + 1));
      } else if (e.key === 'r' || e.key === 'R') {
        onPanChange({ x: 0, y: 0 });
        onZoomChange(1.0);
        onBrightnessContrastChange(100, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sliceIndex, totalSlices, onSliceChange, onPanChange, onZoomChange, onBrightnessContrastChange]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Current slice annotations
  const currentSliceAnnotations = annotations.filter(a => a.sliceIndex === sliceIndex);

  return (
    <div
      ref={containerRef}
      id="dicom-canvas-container"
      className="relative flex-1 h-full w-full bg-black overflow-hidden select-none flex items-center justify-center cursor-crosshair group"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* HUD: Top Left - Patient & Institutional Info */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none text-xs font-mono space-y-0.5 text-cyan-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-black/40 backdrop-blur-xs p-2.5 rounded border border-white/5">
        <div className="font-semibold text-white tracking-wide text-sm">{study?.patientName || 'Paciente'}</div>
        <div className="text-neutral-300">
          ID: {study?.patientDni || 'N/A'} | {study?.patientAge || 45}A | {study?.patientGender === 'M' ? 'MASC' : 'FEM'}
        </div>
        <div className="text-neutral-400">ACC: {study?.accessionNumber || 'ACC-2026'}</div>
        <div className="text-emerald-400/90 font-medium">{study?.institutionName || 'Centro Radiológico'}</div>
      </div>

      {/* HUD: Top Right - Acquisition Parameters & Scanner Details */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none text-xs font-mono text-right space-y-0.5 text-cyan-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-black/40 backdrop-blur-xs p-2.5 rounded border border-white/5">
        <div className="font-semibold text-white tracking-wide">{study?.studyName || 'Estudio de Imagen'}</div>
        <div className="text-neutral-300">
          {study?.studyDate || ''} {study?.studyTime ? `| ${study.studyTime}` : ''}
        </div>
        <div className="text-neutral-400">{study?.equipmentModel || 'Sistema PACS'}</div>
        <div className="text-amber-400/90 font-mono">
          {study?.acquisitionParams?.kVp ? `${study.acquisitionParams.kVp} kVp / ${study.acquisitionParams.mA || 100} mA` : ''}
          {study?.acquisitionParams?.magneticFieldStrength ? ` | ${study.acquisitionParams.magneticFieldStrength}` : ''}
        </div>
      </div>

      {/* HUD: Bottom Left - Viewport Geometry & Window/Level */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none text-xs font-mono space-y-0.5 text-cyan-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-black/40 backdrop-blur-xs p-2 rounded border border-white/5">
        <div className="text-white font-medium">
          CORTE: {sliceIndex + 1} / {totalSlices || 1} ({currentSlice?.sliceLocation || 'Corte 1'})
        </div>
        <div className="text-neutral-300">
          Grosor: {currentSlice?.sliceThickness || 'Digital'} | Matriz: {activeSeries?.matrixSize || '512 x 512'}
        </div>
        <div className="text-neutral-400">
          Zoom: {Math.round(zoom * 100)}% | W: {Math.round(contrast * 4)} L: {Math.round((brightness - 100) * 2 + 40)}
        </div>
      </div>

      {/* HUD: Bottom Right - Cursor Coordinate & HU Density */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-xs font-mono text-right space-y-0.5 text-cyan-400/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-black/40 backdrop-blur-xs p-2 rounded border border-white/5">
        <div className="text-neutral-300">
          X: {mousePosHud.x} Y: {mousePosHud.y}
        </div>
        <div className="text-emerald-400 font-medium">HU: {mousePosHud.hu} [Valor Escalar]</div>
        <div className="text-neutral-400 text-[10px]">{activeSeries?.name || 'Serie'}</div>
      </div>

      {/* Anatomical Orientation Markers (A / P / L / R) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 text-xs font-bold text-amber-400/80 font-mono pointer-events-none">
        {activeSeries?.plane === 'AXIAL' ? 'ANTERIOR' : 'SUPERIOR'}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 text-xs font-bold text-amber-400/80 font-mono pointer-events-none">
        {activeSeries?.plane === 'AXIAL' ? 'POSTERIOR' : 'INFERIOR'}
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-xs font-bold text-amber-400/80 font-mono pointer-events-none">
        {activeSeries?.plane === 'AXIAL' ? 'R (DERECHA)' : activeSeries?.plane === 'SAGITTAL' ? 'A (ANTERIOR)' : 'R (DERECHA)'}
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-xs font-bold text-amber-400/80 font-mono pointer-events-none">
        {activeSeries?.plane === 'AXIAL' ? 'L (IZQUIERDA)' : activeSeries?.plane === 'SAGITTAL' ? 'P (POSTERIOR)' : 'L (IZQUIERDA)'}
      </div>

      {/* Quick Action Overlay Buttons in Canvas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-700/60 shadow-lg">
        <button
          onClick={() => {
            onPanChange({ x: 0, y: 0 });
            onZoomChange(1.0);
            onBrightnessContrastChange(100, 100);
          }}
          title="Restablecer Vista (R)"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="h-3 w-px bg-neutral-700 mx-0.5" />
        <button
          onClick={toggleFullscreen}
          title="Pantalla Completa"
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Vector Rendering Stage with Pan and Zoom transform */}
      <div
        className="w-[512px] h-[512px] max-w-full max-h-full relative origin-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {currentSlice?.customImageUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <img
              src={currentSlice.customImageUrl}
              alt={activeSeries?.name || 'Estudio'}
              className="w-full h-full object-contain select-none pointer-events-none"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                  colormap === 'INVERTED' ? 'invert(1)' : ''
                } ${colormap === 'PET_HOT' ? 'hue-rotate(280deg) saturate(3)' : ''} ${
                  colormap === 'DOPPLER' ? 'hue-rotate(180deg) saturate(2.5)' : ''
                } ${colormap === 'BONE_WARM' ? 'sepia(0.6) saturate(1.8)' : ''}`,
              }}
            />
          </div>
        ) : (
          <AnatomySVGs
            svgKey={currentSlice?.svgIllustrationKey || 'brain_ventricles_lateral'}
            brightness={brightness}
            contrast={contrast}
            colormap={colormap}
          />
        )}

        {/* SVG Annotations & Measurements Layer */}
        <svg
          viewBox="0 0 512 512"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
          {/* Render Saved Annotations */}
          {currentSliceAnnotations.map(ann => {
            if (ann.type === 'RULER' && ann.endX !== undefined && ann.endY !== undefined) {
              return (
                <g key={ann.id}>
                  <line
                    x1={ann.startX}
                    y1={ann.startY}
                    x2={ann.endX}
                    y2={ann.endY}
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <circle cx={ann.startX} cy={ann.startY} r="3.5" fill="#22d3ee" />
                  <circle cx={ann.endX} cy={ann.endY} r="3.5" fill="#22d3ee" />
                  <rect
                    x={(ann.startX + ann.endX) / 2 - 25}
                    y={(ann.startY + ann.endY) / 2 - 16}
                    width="50"
                    height="16"
                    fill="rgba(0,0,0,0.85)"
                    rx="3"
                  />
                  <text
                    x={(ann.startX + ann.endX) / 2}
                    y={(ann.startY + ann.endY) / 2 - 4}
                    fill="#22d3ee"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {ann.measurementValue}
                  </text>
                </g>
              );
            }

            if (ann.type === 'ROI_CIRCLE' && ann.endX !== undefined && ann.endY !== undefined) {
              const radius = Math.sqrt(
                Math.pow(ann.endX - ann.startX, 2) + Math.pow(ann.endY - ann.startY, 2)
              );
              return (
                <g key={ann.id}>
                  <circle
                    cx={ann.startX}
                    cy={ann.startY}
                    r={radius}
                    fill="rgba(34, 211, 238, 0.12)"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeDasharray="5,2"
                  />
                  <rect
                    x={ann.startX - 65}
                    y={ann.startY + radius + 6}
                    width="130"
                    height="18"
                    fill="rgba(0,0,0,0.85)"
                    rx="3"
                  />
                  <text
                    x={ann.startX}
                    y={ann.startY + radius + 19}
                    fill="#22d3ee"
                    fontSize="9.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {ann.measurementValue}
                  </text>
                </g>
              );
            }

            if (ann.type === 'ARROW' && ann.endX !== undefined && ann.endY !== undefined) {
              return (
                <g key={ann.id}>
                  <defs>
                    <marker
                      id={`arrowhead-${ann.id}`}
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" />
                    </marker>
                  </defs>
                  <line
                    x1={ann.startX}
                    y1={ann.startY}
                    x2={ann.endX}
                    y2={ann.endY}
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    markerEnd={`url(#arrowhead-${ann.id})`}
                  />
                </g>
              );
            }

            return null;
          })}

          {/* Render Currently Active Drawing */}
          {activeDrawing && activeDrawing.startX !== undefined && activeDrawing.endX !== undefined && (
            <g>
              {activeDrawing.type === 'RULER' && (
                <>
                  <line
                    x1={activeDrawing.startX}
                    y1={activeDrawing.startY}
                    x2={activeDrawing.endX}
                    y2={activeDrawing.endY}
                    stroke="#e11d48"
                    strokeWidth="2"
                  />
                  <circle cx={activeDrawing.startX} cy={activeDrawing.startY} r="4" fill="#e11d48" />
                  <circle cx={activeDrawing.endX} cy={activeDrawing.endY} r="4" fill="#e11d48" />
                </>
              )}
              {activeDrawing.type === 'ROI_CIRCLE' && (
                <circle
                  cx={activeDrawing.startX}
                  cy={activeDrawing.startY}
                  r={Math.sqrt(
                    Math.pow(activeDrawing.endX - activeDrawing.startX, 2) +
                      Math.pow((activeDrawing.endY || 0) - (activeDrawing.startY || 0), 2)
                  )}
                  fill="rgba(225, 29, 72, 0.15)"
                  stroke="#e11d48"
                  strokeWidth="2"
                />
              )}
              {activeDrawing.type === 'ARROW' && (
                <line
                  x1={activeDrawing.startX}
                  y1={activeDrawing.startY}
                  x2={activeDrawing.endX}
                  y2={activeDrawing.endY}
                  stroke="#e11d48"
                  strokeWidth="2.5"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Right Side Vertical Slice Slider for High-Speed Scrolling */}
      {totalSlices > 1 && (
        <div className="absolute right-4 top-28 bottom-28 z-20 flex flex-col items-center justify-center gap-2 bg-neutral-950/70 p-1.5 rounded-full border border-neutral-800 backdrop-blur-xs">
          <span className="text-[10px] font-mono text-neutral-400">{sliceIndex + 1}</span>
          <input
            type="range"
            min={0}
            max={totalSlices - 1}
            value={sliceIndex}
            onChange={e => onSliceChange(Number(e.target.value))}
            className="w-1.5 h-36 accent-cyan-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
          />
          <span className="text-[10px] font-mono text-neutral-500">{totalSlices}</span>
        </div>
      )}
    </div>
  );
};
