import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const VAULT_FILE_PATH = path.join(process.cwd(), "data_vault.json");

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "10mb" }));

// In-Memory Rate Limiting for Internet & Cloud Protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

function createRateLimiter(maxRequests: number, windowMs: number, message: string) {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000).toString());
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count += 1;
    next();
  };
}

const generalApiLimiter = createRateLimiter(600, 60000, "Límite de peticiones de API excedido. Por favor intente más tarde.");
const aiGenerationLimiter = createRateLimiter(60, 60000, "Límite de solicitudes de IA excedido. Por favor espere un momento.");

// Exclude internal heartbeat, time verification, and cloud sync routes from rate limiting
app.use((req, res, next) => {
  if (
    req.path === "/api/health" ||
    req.path === "/api/time" ||
    req.path.startsWith("/api/cloud-sync")
  ) {
    return next();
  }
  generalApiLimiter(req, res, next);
});

// Lazy initializer for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "Medical Imaging Management System", environment: process.env.NODE_ENV || "production" });
});

// Official Cloud Time & License Verification Endpoint (Tamper-Proof)
app.get("/api/time", (_req: Request, res: Response) => {
  const now = new Date();
  res.json({
    success: true,
    timestamp: now.getTime(),
    utcIso: now.toISOString(),
    formattedDate: now.toISOString().split("T")[0],
    formattedTime: now.toTimeString().split(" ")[0],
    timezoneOffset: now.getTimezoneOffset(),
    serverOnline: true,
  });
});

// ==========================================
// CENTRAL CLOUD VAULT (MULTI-DEVICE SYNCHRONIZATION)
// ==========================================
interface CentralVaultData {
  clinics: any[];
  superAdminContact: any;
  tombstones: string[];
  lastUpdated: string;
}

function loadCentralVault(): CentralVaultData {
  try {
    if (fs.existsSync(VAULT_FILE_PATH)) {
      const raw = fs.readFileSync(VAULT_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error al leer bóveda central:", e);
  }
  return {
    clinics: [],
    superAdminContact: {
      name: "Fernando (Administrador Maestro)",
      phone: "+52 1 55 1234 5678",
      email: "licencias@imagis-pacs.cloud",
      helpMessage: "Para reactivar o renovar la suscripción de su consultorio, contacte al Super Administrador.",
      updatedAt: new Date().toISOString(),
    },
    tombstones: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveCentralVault(vault: CentralVaultData): void {
  try {
    const prevClinics = JSON.stringify(memoryVault.clinics || []);
    const nextClinics = JSON.stringify(vault.clinics || []);
    const prevContact = JSON.stringify(memoryVault.superAdminContact || {});
    const nextContact = JSON.stringify(vault.superAdminContact || {});
    const prevTombstones = JSON.stringify(memoryVault.tombstones || []);
    const nextTombstones = JSON.stringify(vault.tombstones || []);

    const hasChanged =
      prevClinics !== nextClinics ||
      prevContact !== nextContact ||
      prevTombstones !== nextTombstones ||
      !fs.existsSync(VAULT_FILE_PATH);

    if (hasChanged) {
      fs.writeFileSync(VAULT_FILE_PATH, JSON.stringify(vault, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Error al persistir bóveda central:", e);
  }
}

let memoryVault: CentralVaultData = loadCentralVault();

// GET: Pull Central Vault
app.get("/api/cloud-sync/vault", (_req: Request, res: Response) => {
  res.json({
    success: true,
    vault: {
      clinics: memoryVault.clinics || [],
      superAdminContact: memoryVault.superAdminContact,
      tombstones: memoryVault.tombstones || [],
      serverTimestamp: new Date().toISOString(),
    },
  });
});

// POST: Push & Merge with Conflict Resolution (Timestamp-based updatedAt)
app.post("/api/cloud-sync/vault", (req: Request, res: Response) => {
  try {
    const { clinics: incomingClinics = [], superAdminContact: incomingContact, tombstones: incomingTombstones = [] } = req.body;

    // 1. Merge tombstones (union)
    const tombstonesSet = new Set<string>([
      ...(memoryVault.tombstones || []),
      ...(incomingTombstones || []),
    ]);
    const mergedTombstones = Array.from(tombstonesSet);

    // 2. Merge clinics map with timestamp priority
    const clinicMap = new Map<string, any>();

    // Load existing
    for (const c of memoryVault.clinics || []) {
      if (!tombstonesSet.has(c.id)) {
        clinicMap.set(c.id, c);
      }
    }

    // Merge incoming
    for (const inc of incomingClinics) {
      if (tombstonesSet.has(inc.id)) {
        clinicMap.delete(inc.id);
        continue;
      }

      const existing = clinicMap.get(inc.id);
      if (!existing) {
        clinicMap.set(inc.id, inc);
      } else {
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const incomingTime = new Date(inc.updatedAt || inc.createdAt || 0).getTime();
        if (incomingTime >= existingTime) {
          clinicMap.set(inc.id, { ...existing, ...inc });
        }
      }
    }

    // 3. Merge superAdminContact with timestamp priority
    let mergedContact = memoryVault.superAdminContact;
    if (incomingContact) {
      const existingTime = new Date(mergedContact?.updatedAt || 0).getTime();
      const incomingTime = new Date(incomingContact.updatedAt || 0).getTime();
      if (incomingTime >= existingTime) {
        mergedContact = incomingContact;
      }
    }

    const updatedVault: CentralVaultData = {
      clinics: Array.from(clinicMap.values()),
      superAdminContact: mergedContact,
      tombstones: mergedTombstones,
      lastUpdated: new Date().toISOString(),
    };

    memoryVault = updatedVault;
    saveCentralVault(updatedVault);

    return res.json({
      success: true,
      vault: {
        ...updatedVault,
        serverTimestamp: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    console.error("Error en sincronización de bóveda en la nube:", e);
    return res.status(500).json({ success: false, error: e.message || "Error al sincronizar bóveda" });
  }
});

// Endpoint: Generate structured radiological report
app.post("/api/gemini/generate-report", aiGenerationLimiter, async (req: Request, res: Response) => {
  try {
    const { patientName, age, gender, modality, studyName, clinicalIndication, keyObservations, priorStudies } = req.body;

    const ai = getAI();
    if (!ai) {
      // Fallback generator when API key is not configured
      const fallbackReport = {
        technique: `Se realizó ${studyName || modality} mediante equipo de alta resolución bajo protocolo estándar para ${modality}.`,
        findings: `Hallazgos principales:\n- ${keyObservations || "Estructuras anatómicas evaluadas sin alteraciones morfológicas evidentes en cortes axiales, coronales y sagitales."}\n- No se identifican lesiones ocupantes de espacio ni colecciones anómalas.\n- Relaciones óseas y de tejidos blandos conservadas dentro de los límites esperados para la edad del paciente (${age || "N/A"} años).`,
        impression: `CONCLUSIÓN:\n1. Estudio de ${studyName || modality} representativo sin signos de patología aguda evolutiva.\n2. Se correlaciona clínicamente con el cuadro referido: "${clinicalIndication || "Evaluación diagnóstica"}".`,
        recommendations: "Correlación con evolución clínica y seguimiento según criterio del médico tratante.",
        biRadsOrScore: modality?.includes("Mamografía") ? "BI-RADS 2 (Benigno)" : undefined,
      };
      return res.json({ success: true, report: fallbackReport, isFallback: true });
    }

    const systemPrompt = `Eres un Médico Radiólogo Especialista de alto nivel con amplia experiencia en diagnóstico por imágenes (Rayos X, TAC, RMN, Ecografía, Mamografía).
Tu tarea es redactar un informe radiológico estructurado, profesional, en español médico formal y riguroso.
Usa terminología técnica precisa (técnica de adquisición, hallazgos por planos anatómicos, conclusión/impresión diagnóstica, recomendaciones y clasificación diagnóstica estándar si aplica, como BI-RADS, Lung-RADS, o Gleason/PIRADS).

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con los campos:
{
  "technique": "Descripción precisa de la técnica y secuencias utilizadas",
  "findings": "Texto detallado de hallazgos anatómicos divididos lógicamente",
  "impression": "Conclusión diagnóstica numerada y contundente",
  "recommendations": "Recomendaciones clínicas o estudios complementarios",
  "biRadsOrScore": "Puntaje/Clasificación estándar (ej. BI-RADS 1-6 si es mama, o null)"
}`;

    const userPrompt = `Datos del paciente:
- Nombre: ${patientName || "Paciente"}
- Edad: ${age || "Adulto"} años | Género: ${gender || "No especificado"}
- Modalidad: ${modality}
- Estudio solicitado: ${studyName}
- Indicación clínica / Sospecha diagnóstica: ${clinicalIndication || "Control de rutina"}
- Notas y observaciones visuales preliminares del radiólogo: ${keyObservations || "Estudio completado sin incidentes técnicos."}
- Antecedentes/Estudios previos: ${priorStudies || "No se aportan estudios previos para cotejo."}

Por favor genera el informe radiológico formal.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        technique: "Técnica estándar de adquisición multiplanar.",
        findings: text,
        impression: "Impresión diagnóstica según hallazgos descritos.",
        recommendations: "Control clínico según criterio médico.",
      };
    }

    return res.json({ success: true, report: parsed, isFallback: false });
  } catch (error: any) {
    console.error("Error generating report with Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al generar el informe con IA",
    });
  }
});

// Endpoint: Explain medical imaging report in simple words to patient
app.post("/api/gemini/explain-to-patient", aiGenerationLimiter, async (req: Request, res: Response) => {
  try {
    const { reportText, studyName, patientName } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        success: true,
        explanation: `Hola ${patientName || "estimado paciente"}, su estudio de ${studyName || "imagenología"} fue interpretado por el médico especialista. En términos sencillos, el estudio revisó las estructuras correspondientes para comprobar que se encuentren en buen estado y descartar inflamación o lesiones de cuidado. Le recomendamos llevar este informe oficial con su médico tratante para definir los siguientes pasos de su tratamiento.`,
        isFallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Explica en un lenguaje cálido, empático, muy claro y 100% entendible para un paciente sin conocimientos médicos el siguiente informe de imagenología (${studyName}):\n\n${reportText}\n\nIncluye: 1. Qué se evaluó en palabras sencillas. 2. Qué significa la conclusión en su vida diaria. 3. Preguntas útiles que puede hacerle a su médico tratante. Recuerda aclararle que debe siempre consultar a su médico tratante.`,
      config: {
        systemInstruction: "Eres un médico especialista en comunicación paciente-médico que traduce terminología médica compleja a un lenguaje accesible, tranquilizador y educativo en español.",
      },
    });

    return res.json({ success: true, explanation: response.text, isFallback: false });
  } catch (error: any) {
    console.error("Error explaining report:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Pre-study Safety & Protocol Check (Contrast & MRI screening)
app.post("/api/gemini/safety-check", aiGenerationLimiter, async (req: Request, res: Response) => {
  try {
    const { modality, contrastRequired, allergies, eGFR, creatinine, hasPacemaker, hasMetalImplants, isPregnant } = req.body;
    const ai = getAI();

    if (!ai) {
      const issues: string[] = [];
      if (modality?.includes("Resonancia") && (hasPacemaker || hasMetalImplants)) {
        issues.push("Alerta Crítica: Contraindicación para RMN por presencia de marcapasos o implantes ferromagnéticos sin certificación MR-Conditional.");
      }
      if (contrastRequired && eGFR && Number(eGFR) < 30) {
        issues.push("Alerta Renal: Tasa de filtración glomerular < 30 mL/min/1.73m². Riesgo elevado de nefropatía inducida por contraste o fibrosis sistémica nefrogénica.");
      }
      if (contrastRequired && allergies && allergies.toLowerCase().includes("yod")) {
        issues.push("Alerta de Alergia: Antecedente de reacción a medio de contraste yodado. Requiere protocolo de premedicación con corticoides y antihistamínicos.");
      }

      return res.json({
        success: true,
        cleared: issues.length === 0,
        alerts: issues,
        recommendation: issues.length === 0 ? "Paciente apto bajo protocolo regular de adquisición." : "Requiere valoración por el médico radiólogo previo al estudio.",
        isFallback: true,
      });
    }

    const prompt = `Evalúa la seguridad del paciente para el siguiente procedimiento de imagenología:
- Modalidad: ${modality}
- Requiere contraste IV: ${contrastRequired ? "SÍ" : "NO"}
- Alergias reportadas: ${allergies || "Ninguna conocida"}
- Función renal: Creatinina ${creatinine || "N/A"} mg/dL, eGFR ${eGFR || "N/A"} mL/min
- Marcapasos / Dispositivos cardíacos: ${hasPacemaker ? "SÍ" : "NO"}
- Implantes metálicos / clips de aneurisma: ${hasMetalImplants ? "SÍ" : "NO"}
- Embarazo / Sospecha: ${isPregnant ? "SÍ" : "NO"}

Genera un JSON con el formato:
{
  "cleared": boolean,
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Crítico",
  "alerts": ["Lista de advertencias específicas"],
  "recommendations": "Instrucciones de preparación o contraindicaciones concretas",
  "preparationGuide": "Instrucciones que debe seguir el paciente (ej. horas de ayuno, toma de agua, etc.)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un especialista en seguridad radiológica y protocolos de medios de contraste en imagenología diagnóstica.",
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error: any) {
    console.error("Error in safety check:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Generate specialized patient notification with preparation rules (SMS/Email/WhatsApp)
app.post("/api/notifications/generate-reminder", aiGenerationLimiter, async (req: Request, res: Response) => {
  try {
    const { patientName, modality, studyName, scheduledDate, scheduledTime, advanceLabel, requiresContrast, allergies } = req.body;
    const ai = getAI();

    if (!ai) {
      const emailBody = `Estimado/a ${patientName || "Paciente"},

Le recordamos su cita programada en IMAGIS Radiología:
- Estudio: ${studyName || modality}
- Fecha: ${scheduledDate || "Próximamente"} a las ${scheduledTime || "09:00"} hrs
- Anticipación: ${advanceLabel || "Recordatorio de cita"}
- Indicación de preparación: ${requiresContrast ? "Ayuno obligatorio de 6 horas para el medio de contraste. Traer estudio previo de creatinina." : "Presentarse con ropa cómoda sin adornos metálicos."}

Por favor presentarse con 15 minutos de anticipación con su documento de identidad y orden médica.`;

      const smsBody = `IMAGIS: ${patientName}, recordatorio de su ${studyName} el ${scheduledDate} a las ${scheduledTime}. ${requiresContrast ? "Ayuno de 6 horas." : "Sin objetos metálicos."} Llegar 15 min antes.`;

      return res.json({
        success: true,
        emailSubject: `Recordatorio de cita médica: ${studyName} - ${scheduledDate}`,
        emailBody,
        smsBody,
        isFallback: true,
      });
    }

    const prompt = `Genera un recordatorio médico claro, empático y profesional para un paciente de imagenología diagnóstica.
Datos:
- Paciente: ${patientName}
- Estudio: ${studyName} (${modality})
- Fecha y Hora: ${scheduledDate} a las ${scheduledTime}
- Tipo de Recordatorio: ${advanceLabel || "24 horas antes"}
- Requiere Medio de Contraste: ${requiresContrast ? "SÍ" : "NO"}
- Antecedentes/Alergias: ${allergies || "Ninguno"}

Devuelve un JSON con:
{
  "emailSubject": "Asunto claro y formal para correo",
  "emailBody": "Texto completo y bien estructurado para el correo con saludo, detalles de la cita, preparación paso a paso e instrucciones de llegada",
  "smsBody": "Mensaje SMS conciso (máximo 160 caracteres) con nombre, estudio, fecha/hora y advertencia clave",
  "prepKeyPoints": ["Punto 1", "Punto 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres el coordinador del centro de atención al paciente de un centro de radiología e imagenología médica de prestigio.",
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error: any) {
    console.error("Error generating reminder with AI:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Patient Portal Interactive Virtual Assistant
app.post("/api/portal/chat-assistant", aiGenerationLimiter, async (req: Request, res: Response) => {
  try {
    const { message, patientName, patientAge, upcomingAppointments, completedStudies } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        success: true,
        reply: `Hola ${patientName || "estimado/a paciente"}, estoy aquí para ayudarte. Si tienes dudas sobre tu preparación (ayuno, metales o contraste) para tus estudios, te recomendamos revisar las indicaciones de tu cita o presentarte 15 minutos antes de la hora acordada. Para emergencias o consultas médicas específicas, consulta siempre a tu médico tratante.`,
        isFallback: true,
      });
    }

    const contextPrompt = `Contexto del paciente en el portal:
- Nombre: ${patientName || "Paciente"} (${patientAge || "N/A"} años)
- Próximas citas: ${JSON.stringify(upcomingAppointments || [])}
- Estudios previos: ${JSON.stringify(completedStudies || [])}

Pregunta o duda del paciente:
"${message}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: `Eres el Asistente Virtual Inteligente del Portal de Pacientes de IMAGIS Radiología.
Tu objetivo es resolver de manera muy empática, tranquilizadora, clara y precisa dudas sobre:
1. Preparación para estudios de imagen (TAC, RMN, Rayos X, Ecografía, Mamografía): horas de ayuno, toma de agua, uso de ropa sin metal, retiro de joyas/cosméticos.
2. Procedimientos y qué esperar durante el examen (ruidos en RMN, calor leve con contraste en TAC, compresión en mamografía).
3. Cómo interpretar sus resultados en términos sencillos sin dar diagnósticos definitivos (siempre orientando a consultar a su médico tratante).
4. Horarios de atención y tiempos de entrega de informes radiológicos.

Mantén un tono cálido, humano, profesional y en español claro. Si el paciente pregunta algo no relacionado con salud o con la clínica, guíalo amablemente de vuelta a sus citas o dudas de imagenología.`,
      },
    });

    return res.json({ success: true, reply: response.text, isFallback: false });
  } catch (error: any) {
    console.error("Error in portal chat assistant:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data_vault.json', '**/*.json', '**/dist/**', '**/.git/**'],
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
