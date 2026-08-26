import React from 'react';
import { MedicalStudySeries } from '../../types';
import { Layers } from 'lucide-react';

interface SeriesThumbnailBarProps {
  series: MedicalStudySeries[];
  activeSeriesIndex: number;
  onSelectSeries: (index: number) => void;
}

export const SeriesThumbnailBar: React.FC<SeriesThumbnailBarProps> = ({
  series,
  activeSeriesIndex,
  onSelectSeries,
}) => {
  return (
    <div className="w-60 bg-neutral-950 border-r border-neutral-800 flex flex-col h-full overflow-hidden select-none">
      <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Series del Estudio ({series?.length || 0})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {(series || []).map((item, idx) => {
          const isSelected = idx === activeSeriesIndex;
          const slicesCount = item.slices?.length || 0;
          return (
            <div
              key={item.id || `ser-${idx}`}
              onClick={() => onSelectSeries(idx)}
              className={`group cursor-pointer rounded-lg border p-2 transition-all ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xs shadow-cyan-500/20'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="w-full h-24 bg-black rounded-md overflow-hidden flex items-center justify-center border border-neutral-800 relative mb-2">
                <div className="w-20 h-20 opacity-80 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 512 512" className="w-full h-full">
                    <rect width="512" height="512" fill="#0a0a0a" />
                    <circle cx="256" cy="256" r="160" fill="#262626" stroke="#737373" strokeWidth="6" />
                    <ellipse cx="256" cy="256" rx="90" ry="110" fill="#404040" />
                  </svg>
                </div>
                <div className="absolute top-1 left-1.5 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-cyan-300">
                  {item.plane || 'AXIAL'}
                </div>
                <div className="absolute bottom-1 right-1.5 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded text-neutral-300">
                  {slicesCount} cortes
                </div>
              </div>

              {/* Series Info */}
              <div className="text-xs font-medium text-neutral-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                {item.seriesNumber || idx + 1}. {item.name || `Serie ${idx + 1}`}
              </div>
              <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{item.description || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
