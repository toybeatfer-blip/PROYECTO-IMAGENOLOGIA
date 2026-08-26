import React, { useState } from 'react';
import { MedicalStudy, ModalityType } from '../../types';
import { MODALITY_CONFIG } from '../../data/initialData';
import {
  Layers,
  Search,
  Eye,
  FileText,
  ShieldCheck,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  Clock,
  Upload,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { openStudyInStandaloneWindow } from '../../utils/windowSync';

interface StudiesDirectoryProps {
  studies: MedicalStudy[];
  onOpenViewerWithStudy: (studyId: string) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenUploadModal?: () => void;
}

export const StudiesDirectory: React.FC<StudiesDirectoryProps> = ({
  studies,
  onOpenViewerWithStudy,
  onSelectPatient,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');

  // Custom ordered modalities as requested by user
  const MODALITY_ORDER: { key: string; label: string }[] = [
    { key: 'ULTRASONIDO', label: 'Ultrasonido' },
    { key: 'DENSITOMETRIA', label: 'Densitometría' },
    { key: 'RAYOS_X', label: 'Rayos X' },
    { key: 'RESONANCIA', label: 'Resonancia Magnética' },
  ];

  const filteredStudies = studies.filter(st => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (st.patientName || '').toLowerCase().includes(q) ||
      (st.patientDni || '').includes(q) ||
      (st.accessionNumber || '').toLowerCase().includes(q) ||
      (st.studyName || '').toLowerCase().includes(q) ||
      (st.clinicalIndication || '').toLowerCase().includes(q);

    const matchesModality = selectedModality === 'ALL' || st.modality === selectedModality;

    let matchesReport = true;
    if (reportStatusFilter === 'SIGNED') {
      matchesReport = st.report?.status === 'FIRMADO_FINAL';
    } else if (reportStatusFilter === 'PENDING') {
      matchesReport = !st.report || st.report?.status !== 'FIRMADO_FINAL';
    }

    return matchesSearch && matchesModality && matchesReport;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Repositorio de Estudios e Imágenes Médicas (PACS)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Catálogo central de ultrasonidos, densitometrías, radiografías y resonancias magnéticas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            Total en PACS: <strong className="text-white">{studies.length}</strong> estudios
          </span>

          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.99]"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar / Importar Estudio</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-zinc-900/60 border-b border-zinc-800 px-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI, accession # o indicación..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Modality Filter Pills - User Requested Order */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedModality('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              selectedModality === 'ALL'
                ? 'bg-neutral-800 text-white border-white/20 shadow-xs'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
            }`}
          >
            Todas ({studies.length})
          </button>
          {MODALITY_ORDER.map(item => {
            const isSel = selectedModality === item.key;
            const count = studies.filter(s => s.modality === item.key).length;
            return (
              <button
                key={item.key}
                onClick={() => setSelectedModality(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSel
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Report Filter */}
        <select
          value={reportStatusFilter}
          onChange={e => setReportStatusFilter(e.target.value as any)}
          className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Todos los Informes</option>
          <option value="SIGNED">Solo con Informe Firmado</option>
          <option value="PENDING">Pendientes de Informe</option>
        </select>
      </div>

      {/* Studies Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudies.length === 0 ? (
          <div className="col-span-full text-center py-16 text-zinc-500 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-zinc-600 opacity-50" />
            <p className="text-sm font-medium">No se encontraron estudios con los filtros seleccionados.</p>
          </div>
        ) : (
          filteredStudies.map(st => {
            const hasReport = Boolean(st.report);
            const isSigned = st.report?.status === 'FIRMADO_FINAL';

            return (
              <div
                key={st.id}
                className="bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg space-y-3"
              >
                {/* Header & Modality */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {st.modality}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      ACC: {st.accessionNumber}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1">{st.studyName}</h3>

                  <div className="text-xs text-zinc-300 mt-1 flex items-center justify-between">
                    <span className="font-semibold text-white">{st.patientName}</span>
                    <span className="text-zinc-500">
                      {st.patientAge}A | {st.patientGender === 'M' ? 'Masc' : 'Fem'}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{st.studyDate} ({st.studyTime})</span>
                  </div>

                  <p className="text-[11px] text-zinc-400 mt-2 bg-zinc-950 p-2 rounded border border-zinc-800 line-clamp-2 italic">
                    "{st.clinicalIndication}"
                  </p>
                </div>

                {/* Series Count & Status info */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      {st.series.length} Series | {st.series.reduce((acc, s) => acc + s.slices.length, 0)} Cortes
                    </span>
                    {isSigned ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Informe Firmado</span>
                      </span>
                    ) : hasReport ? (
                      <span className="text-amber-400 flex items-center gap-1 text-[11px] font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Informe Preliminar</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                        <span>Sin Informe</span>
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenViewerWithStudy(st.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir Visor</span>
                    </button>

                    <button
                      onClick={() => openStudyInStandaloneWindow(st.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-800 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-zinc-700 hover:border-cyan-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Abrir estudio en ventana independiente para segunda pantalla"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pantalla 2</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
