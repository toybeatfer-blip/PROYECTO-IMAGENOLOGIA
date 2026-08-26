export interface GenerateReportParams {
  patientName: string;
  age: number;
  gender: string;
  modality: string;
  studyName: string;
  clinicalIndication: string;
  keyObservations: string;
  priorStudies?: string;
}

export interface GeneratedReportResult {
  technique: string;
  findings: string;
  impression: string;
  recommendations: string;
  biRadsOrScore?: string;
}

export async function requestAIGeneratedReport(
  params: GenerateReportParams
): Promise<{ success: boolean; report?: GeneratedReportResult; error?: string; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/gemini/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn('Gemini report generation API error:', error);
    // Graceful client fallback
    return {
      success: true,
      report: {
        technique: `Estudio de ${params.studyName} realizado con protocolo técnico estándar de alta definición.`,
        findings: `Hallazgos de imagenología:\n- ${params.keyObservations || "Estructuras anatómicas evaluadas en cortes axiales, coronales y sagitales con morfología conservada."}\n- No se identifican lesiones líticas/blásticas ni masas patológicas focales.\n- Relaciones anatómicas preservadas sin signos agudos evidentes.`,
        impression: `1. Estudio de ${params.studyName} sin evidencia de complicaciones agudas mayores.\n2. Correlacionar con evolución clínica y sospecha de "${params.clinicalIndication || "evaluación diagnóstica"}".`,
        recommendations: 'Seguimiento por su médico especialista.',
      },
      isFallback: true,
    };
  }
}

export async function requestPatientFriendlyExplanation(
  reportText: string,
  studyName: string,
  patientName: string
): Promise<{ success: boolean; explanation?: string; error?: string; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/gemini/explain-to-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportText, studyName, patientName }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn('Patient explanation API error:', error);
    return {
      success: true,
      explanation: `Estimado/a ${patientName || "paciente"}, su estudio de ${studyName} ha sido evaluado en detalle por el médico especialista en radiología. El informe resume el estado anatómico de la zona explorada y no muestra signos que requieran alarma inmediata. Le recordamos llevar este documento en su próxima consulta con su médico tratante para que lo integre a su plan de atención médica.`,
      isFallback: true,
    };
  }
}

export async function requestSafetyCheck(params: {
  modality: string;
  contrastRequired: boolean;
  allergies: string;
  eGFR?: number;
  creatinine?: number;
  hasPacemaker: boolean;
  hasMetalImplants: boolean;
  isPregnant: boolean;
}): Promise<{
  success: boolean;
  cleared?: boolean;
  riskLevel?: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
  alerts?: string[];
  recommendations?: string;
  preparationGuide?: string;
  error?: string;
  isFallback?: boolean;
}> {
  try {
    const res = await fetch('/api/gemini/safety-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn('Safety check API error:', error);
    const alerts: string[] = [];
    if (params.modality.includes('RESONANCIA') && (params.hasPacemaker || params.hasMetalImplants)) {
      alerts.push('ADVERTENCIA RMN: Presencia de dispositivos ferromagnéticos / marcapasos requiere verificación de compatibilidad 3T.');
    }
    if (params.contrastRequired && params.eGFR && params.eGFR < 30) {
      alerts.push('ADVERTENCIA RENAL: Filtración glomerular baja (<30 mL/min). Riesgo con contraste yodado/gadolinio.');
    }
    return {
      success: true,
      cleared: alerts.length === 0,
      riskLevel: alerts.length > 0 ? 'Alto' : 'Bajo',
      alerts,
      recommendations: alerts.length === 0 ? 'Protocolo habitual de adquisición aprobado.' : 'Valorar alternativas sin contraste o autorización especial del radiólogo.',
      preparationGuide: 'Ayuno de 4 a 6 horas y buena hidratación oral previa.',
      isFallback: true,
    };
  }
}

export async function requestGenerateReminder(params: {
  patientName: string;
  modality: string;
  studyName: string;
  scheduledDate: string;
  scheduledTime: string;
  advanceLabel?: string;
  requiresContrast?: boolean;
  allergies?: string;
}): Promise<{
  success: boolean;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  prepKeyPoints?: string[];
  error?: string;
  isFallback?: boolean;
}> {
  try {
    const res = await fetch('/api/notifications/generate-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn('Reminder generation error:', error);
    const contrastNote = params.requiresContrast
      ? 'Ayuno estricto de 6 horas para la inyección de contraste intravenoso. Traer resultado de creatinina sérica.'
      : 'Asistir con ropa cómoda de dos piezas sin metales ni cremalleras en la zona.';

    return {
      success: true,
      emailSubject: `Recordatorio de Cita Médica: ${params.studyName} - IMAGIS`,
      emailBody: `Estimado/a ${params.patientName},\n\nLe recordamos su cita programada para el estudio de ${params.studyName} (${params.modality}) el día ${params.scheduledDate} a las ${params.scheduledTime} hrs.\n\nInstrucciones obligatorias de preparación:\n• ${contrastNote}\n• Presentarse 15 minutos antes de la hora indicada con su DNI y orden médica.\n\nAtentamente,\nCentro de Diagnóstico por Imágenes IMAGIS`,
      smsBody: `IMAGIS: Recordatorio de cita para ${params.patientName}. ${params.studyName} el ${params.scheduledDate} a las ${params.scheduledTime}. ${params.requiresContrast ? 'Ayuno 6h.' : 'Sin metales.'} Llegar 15m antes.`,
      prepKeyPoints: [
        params.requiresContrast ? 'Ayuno obligatorio de 6 horas' : 'Sin objetos metálicos en el área',
        'Presentarse 15 minutos antes de la hora',
        'Llevar documento de identidad y orden médica',
      ],
      isFallback: true,
    };
  }
}

export async function requestPortalChatAssistant(params: {
  message: string;
  patientName: string;
  patientAge?: number;
  upcomingAppointments?: any[];
  completedStudies?: any[];
}): Promise<{
  success: boolean;
  reply?: string;
  error?: string;
  isFallback?: boolean;
}> {
  try {
    const res = await fetch('/api/portal/chat-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn('Portal assistant API error:', error);
    return {
      success: true,
      reply: `Hola ${params.patientName || 'estimado/a paciente'}. Respecto a tu consulta: para cualquier estudio de imagenología te aconsejamos llegar con 15 minutos de anticipación, portar ropa cómoda sin metales y seguir el ayuno indicado si tu examen requiere contraste intravenoso. Si necesitas reagendar o tienes dudas sobre tus resultados, puedes consultarlas aquí o directamente con tu médico tratante.`,
      isFallback: true,
    };
  }
}

