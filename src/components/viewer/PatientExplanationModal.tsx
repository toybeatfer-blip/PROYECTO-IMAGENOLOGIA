import React, { useState, useEffect } from 'react';
import { MedicalStudy } from '../../types';
import { requestPatientFriendlyExplanation } from '../../utils/geminiService';
import { Sparkles, MessageCircle, HeartHandshake, X, Copy, Check, RefreshCw } from 'lucide-react';

interface PatientExplanationModalProps {
  study: MedicalStudy;
  onClose: () => void;
}

export const PatientExplanationModal: React.FC<PatientExplanationModalProps> = ({
  study,
  onClose,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const reportText = study.report
        ? `Hallazgos: ${study.report.findings}\nImpresión: ${study.report.impression}`
        : `Estudio: ${study.studyName}. Indicación: ${study.clinicalIndication}.`;

      const result = await requestPatientFriendlyExplanation(
        reportText,
        study.studyName,
        study.patientName
      );
      if (result.success && result.explanation) {
        setExplanation(result.explanation);
      }
    } catch (e) {
      console.error('Error fetching patient explanation:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanation();
  }, [study.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Explicación para el Paciente (Lenguaje Claro)</h3>
              <p className="text-xs text-slate-500">Asistente IA empático para {study.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-sm text-slate-700">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Estudio: {study.studyName}</div>
            <div>Indicación médica original: "{study.clinicalIndication}"</div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-sm font-medium">Traduciendo términos médicos a un lenguaje accesible y empático...</p>
            </div>
          ) : (
            <div className="text-slate-800 text-sm whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 font-sans">
              {explanation}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={fetchExplanation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerar explicación</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !explanation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto para Paciente'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
