import React, { useState } from 'react';
import { MedicalStudy, ModalityType, ClinicSettings } from '../../types';
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
  Share2,
} from 'lucide-react';
import { openStudyInStandaloneWindow } from '../../utils/windowSync';
import { ShareStudyModal } from './ShareStudyModal';

interface StudiesDirectoryProps {
  studies: MedicalStudy[];
  clinicSettings?: ClinicSettings;
  onOpenViewerWithStudy: (studyId: string) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenUploadModal?: () => void;
}

export const StudiesDirectory: React.FC<StudiesDirectoryProps> = ({
  studies,
  clinicSettings,
  onOpenViewerWithStudy,
  onSelectPatient,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');
  const [selectedStudyForShare, setSelectedStudyForShare] = useState<MedicalStudy | null>(null);

  // Custom ordered modalities
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
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden select-none antialiased">
      {/* Top Header */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Repositorio de Estudios e Imágenes Médicas (PACS)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Archivo digital central de ultrasonidos, densitometrías, radiografías y resonancias magnéticas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            Total en PACS: <strong className="text-white">{studies.length}</strong> estudios
          </span>

          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer"
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
            placeholder="Buscar por paciente, DNI, accession, estudio o indicación..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Modality Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedModality('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedModality === 'ALL'
                ? 'bg-cyan-600 text-white font-semibold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Todas ({studies.length})
          </button>
          {MODALITY_ORDER.map(mod => {
            const count = studies.filter(s => s.modality === mod.key).length;
            const isSelected = selectedModality === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => setSelectedModality(mod.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {mod.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Report Filter */}
        <select
          value={reportStatusFilter}
          onChange={e => setReportStatusFilter(e.target.value as any)}
          className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
        >
          <option value="ALL">Todos los Informes</option>
          <option value="SIGNED">Solo con Informe Firmado</option>
          <option value="PENDING">Pendientes de Informe</option>
        </select>
      </div>

      {/* Studies Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudies.length === 0 ? (
          <div className="col-span-full text-center py-16 text-zinc-500 space-y-3">
            <Layers className="w-12 h-12 mx-auto text-zinc-600 opacity-50" />
            <div>
              <p className="text-sm font-bold text-white">
                {studies.length === 0 ? 'No hay estudios en el archivo PACS todavía' : 'No se encontraron estudios'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                {studies.length === 0
                  ? 'Cargue o importe estudios de ultrasonido, densitometría, rayos X o resonancia para visualizarlos.'
                  : 'Ningún estudio coincide con los filtros aplicados.'}
              </p>
            </div>
            {studies.length === 0 && onOpenUploadModal && (
              <button
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cargar / Importar Primer Estudio</span>
              </button>
            )}
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
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onOpenViewerWithStudy(st.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir Visor</span>
                    </button>

                    <button
                      onClick={() => openStudyInStandaloneWindow(st.id)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-zinc-800 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-zinc-700 hover:border-cyan-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Abrir estudio en ventana independiente para segunda pantalla"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pantalla 2</span>
                    </button>

                    <button
                      onClick={() => setSelectedStudyForShare(st)}
                      className="p-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="Compartir por WhatsApp o enlace rápido"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share Study Modal */}
      {selectedStudyForShare && (
        <ShareStudyModal
          study={selectedStudyForShare}
          clinicSettings={clinicSettings}
          onClose={() => setSelectedStudyForShare(null)}
        />
      )}
    </div>
  );
};
