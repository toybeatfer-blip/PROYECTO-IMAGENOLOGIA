import React, { useState } from 'react';
import { Patient, Appointment, PatientSafetyProfile } from '../../types';
import { requestSafetyCheck } from '../../utils/geminiService';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck2,
  UserCheck,
} from 'lucide-react';

interface SafetyQuestionnaireModalProps {
  patient?: Patient;
  appointment: Appointment;
  onSaveVerification: (verified: boolean, updatedNotes?: string, updatedProfile?: PatientSafetyProfile) => void;
  onClose: () => void;
}

export const SafetyQuestionnaireModal: React.FC<SafetyQuestionnaireModalProps> = ({
  patient,
  appointment,
  onSaveVerification,
  onClose,
}) => {
  const profile = patient?.safetyProfile || {
    hasPacemaker: false,
    hasMetalImplants: false,
    hasClaustrophobia: false,
    isPregnantOrPossible: false,
    contrastAllergy: false,
    diabeticOnMetformin: false,
    allergies: [],
  };

  const [allergies, setAllergies] = useState(
    profile.allergies && profile.allergies.length > 0
      ? profile.allergies.join(', ')
      : profile.contrastAllergy
      ? 'Alergia a medios de contraste'
      : 'Ninguna conocida'
  );
  const [eGFR, setEGFR] = useState<number | undefined>(profile.eGFR || 88);
  const [creatinine, setCreatinine] = useState<number | undefined>(profile.creatinineLevel || 0.9);
  const [hasPacemaker, setHasPacemaker] = useState<boolean>(Boolean(profile.hasPacemaker));
  const [hasMetalImplants, setHasMetalImplants] = useState<boolean>(Boolean(profile.hasMetalImplants));
  const [isPregnant, setIsPregnant] = useState<boolean>(Boolean(profile.isPregnantOrPossible));
  const [diabeticOnMetformin, setDiabeticOnMetformin] = useState<boolean>(Boolean(profile.diabeticOnMetformin));
  const [hasClaustrophobia, setHasClaustrophobia] = useState<boolean>(Boolean(profile.hasClaustrophobia));

  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<{
    cleared?: boolean;
    riskLevel?: string;
    alerts?: string[];
    recommendations?: string;
    preparationGuide?: string;
  } | null>(null);

  const handleRunSafetyEvaluation = async () => {
    setIsCheckingAI(true);
    try {
      const result = await requestSafetyCheck({
        modality: appointment.modality,
        contrastRequired: appointment.requiresContrast,
        allergies,
        eGFR,
        creatinine,
        hasPacemaker,
        hasMetalImplants,
        isPregnant,
      });

      setAiEvaluation(result);
    } catch (e) {
      console.error('Safety evaluation error:', e);
    } finally {
      setIsCheckingAI(false);
    }
  };

  const handleConfirm = () => {
    const notesSummary = aiEvaluation?.recommendations
      ? `Seguridad verificada. Riesgo: ${aiEvaluation.riskLevel || 'Bajo'}. ${aiEvaluation.recommendations}`
      : 'Cuestionario de seguridad completado y verificado.';

    const updatedProfile: PatientSafetyProfile = {
      ...profile,
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      contrastAllergy: allergies.toLowerCase().includes('contraste') || allergies.toLowerCase().includes('yod'),
      eGFR: Number(eGFR) || undefined,
      creatinineLevel: Number(creatinine) || undefined,
      hasPacemaker,
      hasMetalImplants,
      isPregnantOrPossible: isPregnant,
      diabeticOnMetformin,
      hasClaustrophobia,
    };

    onSaveVerification(true, notesSummary, updatedProfile);
  };

  const patientDisplayName = patient?.fullName || (patient as any)?.name || appointment?.patientName || 'Paciente';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Triaje de Seguridad Radiológica</h3>
              <p className="text-xs text-neutral-400">
                {patientDisplayName} | {appointment.studyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Questionnaire Form */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-neutral-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Allergies */}
            <div className="col-span-2">
              <label className="block text-neutral-400 font-medium mb-1">
                Alergias Conocidas (Especialmente a Iodo / Gadolinio / Medicamentos)
              </label>
              <input
                type="text"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Renal Function for Contrast */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 space-y-2">
              <span className="font-semibold text-neutral-200 block">Función Renal (Contraste IV)</span>
              <div>
                <label className="block text-neutral-500 text-[11px]">Creatinina Sérica (mg/dL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={creatinine || ''}
                  onChange={e => setCreatinine(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-500 text-[11px]">eGFR Estimada (mL/min/1.73m²)</label>
                <input
                  type="number"
                  value={eGFR || ''}
                  onChange={e => setEGFR(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* MRI & Ferromagnetic Screening */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 space-y-2.5">
              <span className="font-semibold text-neutral-200 block">Seguridad Magnética y Embarazo</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPacemaker}
                  onChange={e => setHasPacemaker(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <span>Marcapasos / Dispositivo Cardíaco</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMetalImplants}
                  onChange={e => setHasMetalImplants(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <span>Implantes metálicos / Prótesis</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={e => setIsPregnant(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <span>Embarazo o sospecha</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={diabeticOnMetformin}
                  onChange={e => setDiabeticOnMetformin(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-500 focus:ring-0"
                />
                <span>Tratamiento con Metformina</span>
              </label>
            </div>
          </div>

          {/* AI Safety Assessment Trigger */}
          <div className="pt-2">
            <button
              onClick={handleRunSafetyEvaluation}
              disabled={isCheckingAI}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-medium transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isCheckingAI ? 'Evaluando contraindicaciones con IA...' : 'Verificar Seguridad con IA (Gemini)'}</span>
            </button>
          </div>

          {/* AI Assessment Result Card */}
          {aiEvaluation && (
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                aiEvaluation.riskLevel === 'Alto' || aiEvaluation.riskLevel === 'Crítico'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  {aiEvaluation.riskLevel === 'Alto' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Nivel de Riesgo: {aiEvaluation.riskLevel || 'Bajo'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-black/40">
                  {aiEvaluation.cleared ? 'Apto' : 'Requiere Precaución'}
                </span>
              </div>

              {aiEvaluation.alerts && aiEvaluation.alerts.length > 0 && (
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {aiEvaluation.alerts.map((al, idx) => (
                    <li key={idx}>{al}</li>
                  ))}
                </ul>
              )}

              {aiEvaluation.recommendations && (
                <p className="text-xs italic text-neutral-300">
                  Recomendación clínica: {aiEvaluation.recommendations}
                </p>
              )}

              {aiEvaluation.preparationGuide && (
                <div className="text-[11px] bg-black/30 p-2 rounded text-neutral-300">
                  Guía de preparación: {aiEvaluation.preparationGuide}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Aprobar y Registrar Triaje de Seguridad</span>
          </button>
        </div>
      </div>
    </div>
  );
};
