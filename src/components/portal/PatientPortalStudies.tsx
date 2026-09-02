import React, { useState } from 'react';
import { MedicalStudy, Patient } from '../../types';
import {
  FileText,
  Eye,
  Download,
  Calendar,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Info,
  ShieldCheck,
  Printer,
  X,
  Share2,
} from 'lucide-react';
import { MODALITY_CONFIG } from '../../data/initialData';

interface PatientPortalStudiesProps {
  patient: Patient;
  studies: MedicalStudy[];
  onOpenViewer: (study: MedicalStudy) => void;
  onOpenReport: (study: MedicalStudy) => void;
}

export const PatientPortalStudies: React.FC<PatientPortalStudiesProps> = ({
  patient,
  studies = [],
  onOpenViewer,
  onOpenReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState('ALL');
  const [explainingStudy, setExplainingStudy] = useState<MedicalStudy | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);

  const safeStudies = Array.isArray(studies) ? studies : [];
  const patientStudies = safeStudies.filter(
    s => s && (s.patientId === patient?.id || s.patientDni === patient?.dni || (s.patientName && patient?.fullName && s.patientName.toLowerCase() === patient.fullName.toLowerCase()))
  );

  const filteredStudies = patientStudies.filter(s => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (s.studyName || '').toLowerCase().includes(term) ||
      (s.accessionNumber || '').toLowerCase().includes(term) ||
      (s.referringDoctor || '').toLowerCase().includes(term);
    const matchesMod = selectedModality === 'ALL' || s.modality === selectedModality;
    return matchesSearch && matchesMod;
  });

  const handleRequestAIExplanation = async (study: MedicalStudy) => {
    setExplainingStudy(study);
    setAiExplanation(null);
    setIsGeneratingExplanation(true);

    try {
      const res = await fetch('/api/portal/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.fullName || (patient as any).name || 'Paciente',
          patientAge: patient.age,
          message: `Por favor explícame en un lenguaje muy sencillo, claro y sin tecnicismos difíciles el siguiente informe radiológico de mi estudio "${study.studyName}". Cuéntame qué significa de manera tranquilizadora y qué debo preguntarle a mi médico tratante.
          
Informe médico:
Conclusión/Impresión: ${study.report?.impression || study.keyFindingsSummary}
Técnica: ${study.report?.technique || 'Estudio de imagen digital'}`,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAiExplanation(data.reply);
      } else {
        setAiExplanation(
          `Tu estudio de ${study.studyName} fue revisado por el radiólogo. Los hallazgos principales señalan: ${study.keyFindingsSummary}. Esto le servirá a tu médico tratante para definir el mejor tratamiento o seguimiento. No dejes de presentarle este informe en tu próxima consulta.`
        );
      }
    } catch (e) {
      setAiExplanation(
        `Tu estudio de ${study.studyName} está listo. Muestra: "${study.keyFindingsSummary}". Te aconsejamos llevar este resultado con tu médico de cabecera para su interpretación conjunta.`
      );
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
              Historial Radiológico Digital
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Mis Estudios Médicos & Resultados</h2>
            <p className="text-xs text-slate-500 mt-1">
              Visualice sus imágenes diagnósticas en alta resolución, descargue informes oficiales con firma y consulte explicaciones claras asistidas por IA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-400 block">Total de Estudios:</span>
              <span className="text-xl font-extrabold text-cyan-700">{patientStudies.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre del estudio, médico solicitante o código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-cyan-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedModality}
            onChange={e => setSelectedModality(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-cyan-600 shadow-xs cursor-pointer"
          >
            <option value="ALL">Todas las modalidades</option>
            <option value="ULTRASONIDO">Ultrasonido (Ecografía)</option>
            <option value="DENSITOMETRIA">Densitometría Ósea (DEXA)</option>
            <option value="RAYOS_X">Rayos X (Radiología)</option>
            <option value="RESONANCIA">Resonancia Magnética (RMN)</option>
          </select>
        </div>
      </div>

      {/* Studies Grid / List */}
      {filteredStudies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron estudios</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No hay registros que coincidan con los filtros aplicados o aún no cuenta con estudios archivados en esta categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudies.map(study => {
            const modConfig = MODALITY_CONFIG[study.modality] || {
              label: study.modality,
              badgeBg: 'bg-cyan-50 text-cyan-700',
              badgeBorder: 'border-cyan-200',
            };

            const isReportReady = study.report?.status === 'FIRMADO_FINAL' || study.status === 'FIRMADO';

            return (
              <div
                key={study.id}
                className="bg-white border border-slate-200 hover:border-cyan-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${modConfig.badgeBg} ${modConfig.badgeBorder}`}
                    >
                      {modConfig.label}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{study.studyDate}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{study.studyName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Médico solicitante: <strong className="text-slate-700">{study.orderingPhysician}</strong>
                    </p>
                  </div>
                </div>

                {/* Key Findings Box */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Conclusión Diagnóstica:</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isReportReady
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {isReportReady ? 'Informe Firmado' : 'En Interpretación'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                    {study.keyFindingsSummary || study.report?.impression || 'Estudio completado. Informe en proceso de firma.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenViewer(study)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Imágenes ({study.seriesCount} series)</span>
                    </button>

                    <button
                      onClick={() => onOpenReport(study)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Informe PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleRequestAIExplanation(study)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                    title="Explicar en palabras sencillas con Inteligencia Artificial"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Explicar (IA)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Explanation Modal */}
      {explainingStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Explicación Clara para el Paciente</h3>
                  <p className="text-xs text-slate-500">
                    Estudio: {explainingStudy.studyName} ({explainingStudy.studyDate})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExplainingStudy(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              {isGeneratingExplanation ? (
                <div className="py-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="font-bold text-slate-800">
                    Traduciendo los términos médicos a un lenguaje claro y comprensible...
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    El asistente inteligente está preparando un resumen personalizado para usted.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 space-y-2 text-slate-800 leading-relaxed text-xs">
                    <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Resumen en Lenguaje Cotidiano:</span>
                    </p>
                    <p className="whitespace-pre-line text-slate-700">{aiExplanation}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 text-slate-500 text-[11px]">
                    <span className="font-bold text-slate-800 block">Nota Importante de Salud:</span>
                    <span>
                      Esta explicación orientativa está diseñada para facilitarle la comprensión de su estudio. Siempre debe comentar los resultados con su médico tratante, quien conoce su historial clínico completo y determinará el plan a seguir.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setExplainingStudy(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
