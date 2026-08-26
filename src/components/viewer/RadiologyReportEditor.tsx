import React, { useState } from 'react';
import { MedicalStudy, RadiologyReport } from '../../types';
import { requestAIGeneratedReport } from '../../utils/geminiService';
import {
  Sparkles,
  FileCheck,
  Printer,
  Mic,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface RadiologyReportEditorProps {
  study: MedicalStudy;
  onSaveReport: (report: RadiologyReport) => void;
  onClose: () => void;
  onOpenPrintPreview: () => void;
}

export const RadiologyReportEditor: React.FC<RadiologyReportEditorProps> = ({
  study,
  onSaveReport,
  onClose,
  onOpenPrintPreview,
}) => {
  const existing = study.report;

  const [radiologistName, setRadiologistName] = useState(
    existing?.radiologistName || 'Dr. Víctor Hugo Peñaloza R.'
  );
  const [radiologistLicense, setRadiologistLicense] = useState(
    existing?.radiologistLicense || 'C.M.P. 49201 / R.N.E. 21094 (Radiología Médica)'
  );
  const [technique, setTechnique] = useState(
    existing?.technique ||
      `Estudio de ${study.studyName} realizado con equipo ${study.equipmentModel}, obteniendo cortes multiplanares en protocolos de alta definición.`
  );
  const [findings, setFindings] = useState(
    existing?.findings ||
      `1. ESTRUCTURAS EVALUADAS:\nPlanos anatómicos sin alteraciones estructurales agudas evidentes en secuencias multiplanares.\n\n2. DETALLES ESPECÍFICOS:\nRelaciones vasculares, óseas y de partes blandas preservadas.`
  );
  const [impression, setImpression] = useState(
    existing?.impression ||
      `1. ESTUDIO DE ${study.studyName.toUpperCase()} SIN HALLAZGOS PATOLÓGICOS AGUDOS EVOLUTIVOS.\n2. CORRELACIONAR CON CLÍNICA REFERIDA: "${study.clinicalIndication}".`
  );
  const [recommendations, setRecommendations] = useState(
    existing?.recommendations || 'Correlación con cuadro clínico y control según criterio del médico tratante.'
  );
  const [biRadsOrScore, setBiRadsOrScore] = useState(existing?.biRadsOrScore || '');
  const [status, setStatus] = useState<'BORRADOR' | 'PRELIMINAR' | 'FIRMADO_FINAL'>(
    existing?.status || 'BORRADOR'
  );

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerateWithAI = async () => {
    setIsGeneratingAI(true);
    try {
      const result = await requestAIGeneratedReport({
        patientName: study.patientName,
        age: study.patientAge,
        gender: study.patientGender,
        modality: study.modality,
        studyName: study.studyName,
        clinicalIndication: study.clinicalIndication,
        keyObservations: aiNotes || findings || 'Estudio completado según protocolo estándar.',
        priorStudies: 'Sin antecedentes relevantes previos aportados.',
      });

      if (result.success && result.report) {
        setTechnique(result.report.technique);
        setFindings(result.report.findings);
        setImpression(result.report.impression);
        setRecommendations(result.report.recommendations);
        if (result.report.biRadsOrScore) {
          setBiRadsOrScore(result.report.biRadsOrScore);
        }
      }
    } catch (e) {
      console.error('Error generating report with AI:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleToggleDictation = () => {
    if (!isDictating) {
      setIsDictating(true);
      // Simulate audio dictation adding clinical findings
      setTimeout(() => {
        setFindings(prev =>
          prev +
          '\n\n[Dictado de Voz]: Se confirma ausencia de derrame articular significativo y adecuada conservación del espacio interarticular.'
        );
        setIsDictating(false);
      }, 2400);
    } else {
      setIsDictating(false);
    }
  };

  const handleSave = () => {
    const reportData: RadiologyReport = {
      id: existing?.id || 'rep-' + Date.now(),
      studyId: study.id,
      radiologistName,
      radiologistLicense,
      reportDate: existing?.reportDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
      technique,
      findings,
      impression,
      recommendations,
      biRadsOrScore: biRadsOrScore || undefined,
      status,
      signedAt: status === 'FIRMADO_FINAL' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
      signatureHash:
        status === 'FIRMADO_FINAL'
          ? `DIGITAL-SIGN-${radiologistName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-VALIDATED`
          : undefined,
    };

    onSaveReport(reportData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full lg:w-[480px] bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-hidden text-neutral-100 select-none shadow-2xl z-30">
      {/* Header */}
      <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Informe Radiológico Oficial</h3>
            <p className="text-xs text-neutral-400">ACC: {study.accessionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existing?.status === 'FIRMADO_FINAL' && (
            <button
              onClick={onOpenPrintPreview}
              title="Imprimir / Exportar Informe"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Patient Summary Strip */}
        <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800/80 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-white text-sm">{study.patientName}</span>
            <span className="text-cyan-400 font-mono">{study.modality}</span>
          </div>
          <p className="text-neutral-400">
            Edad: {study.patientAge} años | DNI: {study.patientDni} | Ref: {study.referringDoctor}
          </p>
          <p className="text-neutral-300 italic">"Indicación: {study.clinicalIndication}"</p>
        </div>

        {/* AI Radiologist Assistant Block */}
        <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 p-3 rounded-lg border border-cyan-800/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Asistente de Redacción IA (Gemini)</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Notas visuales clave (ej. rotura menisco medial, sin fractura...)"
            value={aiNotes}
            onChange={e => setAiNotes(e.target.value)}
            className="w-full bg-neutral-950/80 border border-cyan-900/60 rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleGenerateWithAI}
              disabled={isGeneratingAI}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAI ? 'Generando borrador formal...' : 'Generar Borrador con IA'}</span>
            </button>
            <button
              onClick={handleToggleDictation}
              title="Dictado por voz"
              className={`p-1.5 rounded border transition-all ${
                isDictating
                  ? 'bg-rose-600 text-white animate-pulse border-rose-500'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status selector */}
        <div>
          <label className="block text-neutral-400 mb-1 font-medium">Estado del Informe</label>
          <div className="grid grid-cols-3 gap-2">
            {(['BORRADOR', 'PRELIMINAR', 'FIRMADO_FINAL'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-all ${
                  status === s
                    ? s === 'FIRMADO_FINAL'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                {s === 'BORRADOR' ? 'Borrador' : s === 'PRELIMINAR' ? 'Preliminar' : 'Firmado'}
              </button>
            ))}
          </div>
        </div>

        {/* Technique */}
        <div>
          <label className="block text-neutral-400 mb-1 font-medium">Técnica y Protocolo</label>
          <textarea
            rows={2}
            value={technique}
            onChange={e => setTechnique(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Findings */}
        <div>
          <label className="block text-neutral-400 mb-1 font-medium">Hallazgos Anatómicos</label>
          <textarea
            rows={6}
            value={findings}
            onChange={e => setFindings(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px] leading-relaxed"
          />
        </div>

        {/* Impression */}
        <div>
          <label className="block text-neutral-400 mb-1 font-medium">Conclusión / Impresión Diagnóstica</label>
          <textarea
            rows={3}
            value={impression}
            onChange={e => setImpression(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-semibold focus:outline-none focus:border-cyan-500 text-xs"
          />
        </div>

        {/* Recommendations & Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Recomendaciones</label>
            <input
              type="text"
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-neutral-400 mb-1 font-medium">Clasificación (ej. BI-RADS)</label>
            <input
              type="text"
              placeholder="Opcional (ej. BI-RADS 2)"
              value={biRadsOrScore}
              onChange={e => setBiRadsOrScore(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Radiologist Credentials */}
        <div className="p-3 bg-neutral-950/80 rounded-lg border border-neutral-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Médico Radiólogo Firmante</span>
          </div>
          <input
            type="text"
            value={radiologistName}
            onChange={e => setRadiologistName(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={radiologistLicense}
            onChange={e => setRadiologistLicense(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-neutral-400 focus:outline-none focus:border-cyan-500 text-[11px]"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
        <button
          onClick={onOpenPrintPreview}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Vista Previa / Imprimir</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Guardado Exitoso' : 'Guardar y Firmar'}</span>
        </button>
      </div>
    </div>
  );
};
