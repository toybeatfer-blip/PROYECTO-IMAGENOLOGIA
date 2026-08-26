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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Explicación para el Paciente (Lenguaje Claro)</h3>
              <p className="text-xs text-neutral-400">Asistente IA empático para {study.patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-sm text-neutral-200">
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300">Estudio: {study.studyName}</div>
            <div>Indicación médica original: "{study.clinicalIndication}"</div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-medium">Traduciendo términos médicos a un lenguaje accesible y empático...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-neutral-200 text-sm whitespace-pre-line leading-relaxed bg-neutral-950/40 p-4 rounded-xl border border-neutral-800/80">
              {explanation}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={fetchExplanation}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerar explicación</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading || !explanation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto para Paciente'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
