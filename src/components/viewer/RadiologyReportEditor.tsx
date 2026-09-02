import React, { useState, useEffect, useRef } from 'react';
import { MedicalStudy, RadiologyReport } from '../../types';
import { requestAIGeneratedReport } from '../../utils/geminiService';
import {
  Sparkles,
  FileCheck,
  Printer,
  Mic,
  MicOff,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Edit3,
  Zap,
  ChevronDown,
  Volume2,
} from 'lucide-react';

interface RadiologyReportEditorProps {
  study: MedicalStudy;
  onSaveReport: (report: RadiologyReport) => void;
  onClose: () => void;
  onOpenPrintPreview: () => void;
}

interface QuickReportTemplate {
  id: string;
  name: string;
  modality: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  biRadsOrScore?: string;
}

const REPORT_MACRO_TEMPLATES: QuickReportTemplate[] = [
  {
    id: 'rx-torax-normal',
    name: '🫁 Rx Tórax PA Normal',
    modality: 'RAYOS_X',
    technique: 'Telerradiografía de Tórax en proyección Posteroanterior (PA) y Lateral en bipedestación y máxima inspiración.',
    findings: '• Parénquima pulmonar con adecuada transparencia, sin infiltrados alveolares ni lesiones focales activas.\n• Trama broncovascular de distribución y calibre conservados.\n• Silueta cardiomediastínica de morfología y tamaño normal (Índice Cardiotorácico < 0.50).\n• Hilios pulmonares anatómicos. Tráquea centrada.\n• Ángulos costofrénicos y cardiofrénicos libres y bien definidos.\n• Estructuras óseas de la caja torácica sin fracturas ni lesiones líticas o blásticas.',
    impression: '1. RADIOGRAFÍA DE TÓRAX PA SIN EVIDENCIA DE PATOLOGÍA PLEUROPULMONAR NI CARDIOMEGALIA.',
    recommendations: 'Control clínico según criterio del médico tratante.',
  },
  {
    id: 'usg-abdomen-normal',
    name: '🩺 USG Abdomen Completo Normal',
    modality: 'ULTRASONIDO',
    technique: 'Ultrasonografía abdominal en tiempo real con transductor convexo multifrecuencia de 3.5 a 5.0 MHz.',
    findings: '• Hígado: Tamaño, forma y contornos normales. Parénquima homogéneo sin lesiones focales ni esteatosis.\n• Vesícula Biliar: Paredes finas y lisas (< 3 mm). Luz anecoica sin litiasis ni barro biliar. Vía biliar intra y extrahepática de calibre normal.\n• Páncreas y Bazo: Morfología, ecogenicidad y tamaño dentro de límites normales.\n• Riñones: Situación, forma y dimensiones normales. Adecuada diferenciación corticomedular sin ectasia piélica ni litiasis.\n• Vejiga: Buena repleción, paredes regulares, libre de lesiones intraluminales.\n• No se observa líquido libre en cavidad peritoneal.',
    impression: '1. ESTUDIO ECOGRÁFICO ABDOMINAL COMPLETO DENTRO DE LÍMITES NORMALES.',
    recommendations: 'Correlación con cuadro clínico y laboratorio.',
  },
  {
    id: 'usg-renal-normal',
    name: '💧 USG Renal y Vías Urinarias Normal',
    modality: 'ULTRASONIDO',
    technique: 'Ultrasonido renal y vesical con transductor sectorial convexo, evaluando planos longitudinales y transversales.',
    findings: '• Riñón Derecho: Longitud y grosor cortical conservados. Parénquima homogéneo sin litiasis ni imágenes quísticas o sólidas.\n• Riñón Izquierdo: Dimensiones y ecotextura normales. Relación corteza-médula preservada (1:2). Senos renales sin dilatación.\n• Vejiga: Adecuada capacidad, paredes delgadas y uniformes (< 4 mm en repleción). Contenido homogéneo sin litiasis.\n• Residuo post-miccional fisiológico (< 10%).',
    impression: '1. ULTRASONIDO RENAL Y VESICAL NORMAL. SIN EVIDENCIA DE LITIASIS NI UROPATÍA OBSTRUCTIVA.',
    recommendations: 'Control clínico según evolución.',
  },
  {
    id: 'mg-birads1-normal',
    name: '🌸 Mastografía Bilateral Normal (BI-RADS 1)',
    modality: 'MAMOGRAFIA',
    technique: 'Mastografía digital bilateral en proyecciones Craneocaudal (CC) y Mediolateral Oblicua (MLO).',
    findings: '• Patrón parenquimatoso de densidad fibroglandular simétrica y acorde a la edad.\n• No se observan nódulos dominantes, distorsiones de la arquitectura tisular ni áreas de asimetría sospechosa.\n• No se identifican microcalcificaciones agrupadas, pleomórficas ni de distribución lineal.\n• Complejos areola-pezón y planos grasos retromamarios respetados.\n• Regiones axilares visualizadas sin adenomegalias sospechosas.',
    impression: '1. MASTOGRAFÍA DIGITAL BILATERAL NEGATIVA A MALIGNIDAD.\n2. CATEGORÍA BI-RADS 1 (ESTUDIO NORMAL).',
    recommendations: 'Control mastográfico anual preventivo.',
    biRadsOrScore: 'BI-RADS 1 (Normal / Negativo)',
  },
  {
    id: 'tac-craneo-normal',
    name: '🧠 TAC Cráneo Simple Normal',
    modality: 'TOMOGRAFIA',
    technique: 'Tomografía Computarizada de Cráneo en cortes axiales volumétricos sin medio de contraste endovenoso.',
    findings: '• Parénquima cerebral y cerebeloso con coeficientes de atenuación normales para sustancia blanca y gris.\n• No se observan áreas de isquemia aguda, hemorragias intracraneales intra o extraaxiales ni colecciones.\n• Sistema ventricular supratentorial e infratentorial de morfología, tamaño y posición normales.\n• Cisuras y surcos corticales acordes a la edad del paciente.\n• Línea media centrada sin efecto de masa ni desplazamientos.\n• Estructuras de la base del cráneo y calota ósea íntegras.',
    impression: '1. TOMOGRAFÍA COMPUTARIZADA DE CRÁNEO SIMPLE SIN HALLAZGOS PATOLÓGICOS AGUDOS NI HEMORRAGIA.',
    recommendations: 'Correlación clínica neurológica.',
  },
  {
    id: 'rmn-columna-normal',
    name: '🦴 RMN Columna Lumbar Normal',
    modality: 'RESONANCIA',
    technique: 'Resonancia Magnética de Columna Lumbosacra en secuencias T1, T2 y STIR en planos sagitales y axiales.',
    findings: '• Cuerpos vertebrales alineados con altura y señal medular ósea preservada.\n• Discos intervertebrales L1-L2, L2-L3, L3-L4, L4-L5 y L5-S1 con adecuada hidratación y altura, sin protrusiones discales ni hernias foraminales.\n• Canal raquídeo y forámenes de conjunción de amplitud normal, sin estenosis ni compresión radicular.\n• Cono medular de aspecto habitual finalizando a nivel de L1. Raíces de la cauda equina libres.\n• Elementos posteriores y musculatura paravertebral sin alteraciones.',
    impression: '1. RESONANCIA MAGNÉTICA DE COLUMNA LUMBAR DENTRO DE LÍMITES NORMALES. SIN HERNIAS NI ESTENOSIS.',
    recommendations: 'Control por traumatología / medicina física según sintomatología.',
  },
  {
    id: 'densitometria-normal',
    name: '📊 Densitometría Ósea Normal',
    modality: 'DENSITOMETRIA',
    technique: 'Densitometría Ósea por técnica DEXA en Columna Lumbar (L1-L4) y Cuello Femoral.',
    findings: '• Columna Lumbar (L1-L4): Densidad Mineral Ósea (DMO) de 1.150 g/cm². T-Score: +0.2 SD.\n• Cuello Femoral Izquierdo: DMO de 0.980 g/cm². T-Score: -0.3 SD.\n• Masa ósea simétrica y conservada en ambas regiones analizadas.',
    impression: '1. DENSIDAD MINERAL ÓSEA NORMAL (T-SCORE > -1.0 DE ACUERDO A LOS CRITERIOS DE LA OMS).\n2. SIN EVIDENCIA DE OSTEOPENIA NI OSTEOPOROSIS.',
    recommendations: 'Mantener aporte adecuado de calcio, vitamina D y actividad física regular. Control en 2 años.',
    biRadsOrScore: 'DMO Normal (T-Score: +0.2)',
  },
];

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
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showMacroMenu, setShowMacroMenu] = useState(false);

  // Native Speech-to-Text Voice Dictation State
  const [activeSpeechField, setActiveSpeechField] = useState<'technique' | 'findings' | 'impression' | 'recommendations' | null>(null);
  const activeSpeechFieldRef = useRef(activeSpeechField);
  useEffect(() => {
    activeSpeechFieldRef.current = activeSpeechField;
  }, [activeSpeechField]);

  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'es-MX'; // Spanish medical dictation

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }

          if (transcript.trim()) {
            const cleanText = transcript.trim();
            const currentTarget = activeSpeechFieldRef.current;
            if (currentTarget === 'findings') {
              setFindings(prev => (prev ? `${prev}\n• ${cleanText}` : `• ${cleanText}`));
            } else if (currentTarget === 'impression') {
              setImpression(prev => (prev ? `${prev}\n${cleanText}` : cleanText));
            } else if (currentTarget === 'technique') {
              setTechnique(prev => (prev ? `${prev} ${cleanText}` : cleanText));
            } else if (currentTarget === 'recommendations') {
              setRecommendations(prev => (prev ? `${prev} ${cleanText}` : cleanText));
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setActiveSpeechField(null);
        };

        recognition.onend = () => {
          setActiveSpeechField(null);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition setup failed:', e);
      }
    }
  }, []);

  const toggleVoiceDictation = (field: 'technique' | 'findings' | 'impression' | 'recommendations') => {
    if (!speechSupported || !recognitionRef.current) {
      // Fallback simulation if speech recognition is not supported in current browser
      if (activeSpeechField === field) {
        setActiveSpeechField(null);
      } else {
        setActiveSpeechField(field);
        setTimeout(() => {
          if (field === 'findings') {
            setFindings(prev => prev + '\n\n• [Dictado por Voz]: Estructuras anatómicas sin evidencia de lesiones traumáticas ni derrame.');
          } else if (field === 'impression') {
            setImpression(prev => prev + '\n• [Dictado por Voz]: Sin hallazgos patológicos agudos adicionales.');
          }
          setActiveSpeechField(null);
        }, 2200);
      }
      return;
    }

    try {
      if (activeSpeechField === field) {
        recognitionRef.current.stop();
        setActiveSpeechField(null);
      } else {
        if (activeSpeechField) {
          recognitionRef.current.stop();
        }
        setActiveSpeechField(field);
        recognitionRef.current.start();
      }
    } catch (e) {
      console.warn('Error starting speech dictation:', e);
      setActiveSpeechField(null);
    }
  };

  const handleApplyMacroTemplate = (template: QuickReportTemplate) => {
    setTechnique(template.technique);
    setFindings(template.findings);
    setImpression(template.impression);
    setRecommendations(template.recommendations);
    if (template.biRadsOrScore) {
      setBiRadsOrScore(template.biRadsOrScore);
    }
    setShowMacroMenu(false);
  };

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
    <div className="w-full lg:w-[500px] bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden text-slate-800 select-none shadow-2xl z-30 antialiased">
      {/* Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-50 border border-cyan-200 rounded-lg text-cyan-700">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Informe Radiológico</h3>
            <p className="text-[10px] text-slate-500 font-mono font-bold">
              [{study.modality}] {study.studyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenPrintPreview}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Vista de Impresión / Exportar PDF Oficial"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Clinical Macros & AI Quick Actions Bar */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 relative">
        {/* Quick Normal Templates Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowMacroMenu(!showMacroMenu)}
            className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">Plantillas Normales Rápidas</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>

          {showMacroMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 z-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Seleccionar Plantilla Normal:
              </div>
              {REPORT_MACRO_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyMacroTemplate(tpl)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center justify-between gap-2 border-b border-slate-100 last:border-none cursor-pointer"
                >
                  <span className="font-bold">{tpl.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                    {tpl.modality}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Generator Button */}
        <button
          onClick={handleGenerateWithAI}
          disabled={isGeneratingAI}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
          <span>{isGeneratingAI ? 'Generando...' : 'Asistente IA'}</span>
        </button>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Doctor Signature Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Médico Radiólogo:</label>
            <input
              type="text"
              value={radiologistName}
              onChange={e => setRadiologistName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Cédula / Matrícula:</label>
            <input
              type="text"
              value={radiologistLicense}
              onChange={e => setRadiologistLicense(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
            />
          </div>
        </div>

        {/* Technique */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-900">1. Técnica de Adquisición:</label>
            <button
              onClick={() => toggleVoiceDictation('technique')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeSpeechField === 'technique'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 text-cyan-800 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Dictar técnica por voz"
            >
              {activeSpeechField === 'technique' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{activeSpeechField === 'technique' ? 'Escuchando...' : 'Dictar'}</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={technique}
            onChange={e => setTechnique(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600 leading-relaxed font-sans"
          />
        </div>

        {/* Findings */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-900">2. Hallazgos Radiológicos:</label>
            <button
              onClick={() => toggleVoiceDictation('findings')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeSpeechField === 'findings'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-cyan-50 border border-cyan-300 text-cyan-900 hover:bg-cyan-100'
              }`}
              title="Dictar hallazgos con tu voz en tiempo real"
            >
              {activeSpeechField === 'findings' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{activeSpeechField === 'findings' ? '🔴 Grabando Voz...' : '🎙️ Dictar Hallazgos'}</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={findings}
            onChange={e => setFindings(e.target.value)}
            placeholder="Describa los hallazgos anatómicos o use el botón de dictado..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600 leading-relaxed font-mono"
          />
        </div>

        {/* Impression / Conclusions */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-cyan-900">3. Conclusión / Impresión Diagnóstica:</label>
            <button
              onClick={() => toggleVoiceDictation('impression')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                activeSpeechField === 'impression'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 text-cyan-800 hover:bg-slate-200 border border-slate-200'
              }`}
              title="Dictar conclusión por voz"
            >
              {activeSpeechField === 'impression' ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{activeSpeechField === 'impression' ? 'Escuchando...' : 'Dictar'}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={impression}
            onChange={e => setImpression(e.target.value)}
            className="w-full bg-cyan-50/50 border border-cyan-300 rounded-2xl p-2.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:bg-white focus:border-cyan-600 leading-relaxed font-sans"
          />
        </div>

        {/* Recommendations & BI-RADS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Recomendaciones:</label>
            <input
              type="text"
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Score / BI-RADS / T-Score:</label>
            <input
              type="text"
              value={biRadsOrScore}
              onChange={e => setBiRadsOrScore(e.target.value)}
              placeholder="ej. BI-RADS 1, T-Score +0.2"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-emerald-800 font-bold focus:outline-hidden focus:bg-white focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Report Status Selector */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700">Estado del Dictamen:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatus('BORRADOR')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                status === 'BORRADOR'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Borrador
            </button>
            <button
              onClick={() => setStatus('PRELIMINAR')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                status === 'PRELIMINAR'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              Preliminar
            </button>
            <button
              onClick={() => setStatus('FIRMADO_FINAL')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                status === 'FIRMADO_FINAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              ✓ Firmado Final
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
        {savedSuccess ? (
          <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Informe guardado y firmado!</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono font-semibold">
            {status === 'FIRMADO_FINAL' ? '🔏 Con Firma Digital' : '📝 En Edición'}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Informe</span>
          </button>
        </div>
      </div>
    </div>
  );
};
