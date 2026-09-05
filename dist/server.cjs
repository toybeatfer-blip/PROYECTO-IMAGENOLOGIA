var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(import_express.default.json({ limit: "10mb" }));
var rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 3e5);
function createRateLimiter(maxRequests, windowMs, message) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1e3).toString());
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1e3)
      });
    }
    record.count += 1;
    next();
  };
}
var generalApiLimiter = createRateLimiter(120, 6e4, "L\xEDmite de peticiones de API excedido. Por favor intente m\xE1s tarde.");
var aiGenerationLimiter = createRateLimiter(30, 6e4, "L\xEDmite de solicitudes de IA excedido (m\xE1x 30/min). Por favor espere un momento.");
app.use("/api", generalApiLimiter);
var aiClient = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Medical Imaging Management System", environment: process.env.NODE_ENV || "production" });
});
var DATA_VAULT_FILE = import_path.default.resolve(process.cwd(), "data_vault.json");
var DEFAULT_PHONES_BLACKLIST = [
  "+52 1 55 1234 5678",
  "+52 55 1234 5678",
  "55 1234 5678",
  "1234 5678",
  "+52 81 8300 0000",
  "0000 0000"
];
var DEFAULT_EMAILS_BLACKLIST = [
  "licencias@imagis-pacs.cloud",
  "admin@clinica.com",
  "super.admin@vetcare.master.com"
];
var sanitizeSuperAdminContactServer = (contact) => {
  const fallback = {
    name: "Fernando (Administrador Maestro)",
    phone: "+52 474 1539891",
    email: "toybeatfer@gmail.com",
    helpMessage: "Estimado doctor/a, para reactivar o renovar su suscripci\xF3n mensual de su consultorio, comun\xEDquese directamente con el Administrador por WhatsApp o correo electr\xF3nico.",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (!contact || typeof contact !== "object") return fallback;
  const res = { ...fallback, ...contact };
  const phone = String(res.phone || "").trim();
  const email = String(res.email || "").trim().toLowerCase();
  if (!phone || DEFAULT_PHONES_BLACKLIST.some((d) => phone.includes(d))) {
    res.phone = "+52 474 1539891";
  }
  if (!email || DEFAULT_EMAILS_BLACKLIST.some((d) => email.includes(d))) {
    res.email = "toybeatfer@gmail.com";
  }
  return res;
};
var readVault = () => {
  try {
    if (import_fs.default.existsSync(DATA_VAULT_FILE)) {
      const data = JSON.parse(import_fs.default.readFileSync(DATA_VAULT_FILE, "utf-8"));
      data.superAdminContact = sanitizeSuperAdminContactServer(data.superAdminContact);
      return data;
    }
  } catch (e) {
    console.error("Error reading data_vault.json:", e);
  }
  return {
    clinics: [],
    superAdminContact: sanitizeSuperAdminContactServer(null),
    tombstones: [],
    clinicRecords: {},
    clinicSettings: {},
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
};
var writeVault = (data) => {
  try {
    import_fs.default.writeFileSync(DATA_VAULT_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing data_vault.json:", e);
    return false;
  }
};
app.get("/api/cloud-sync/vault", (_req, res) => {
  const vault = readVault();
  res.json({ success: true, vault, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/cloud-sync/vault", (req, res) => {
  try {
    const payload = req.body || {};
    const currentVault = readVault();
    const tombstonesSet = /* @__PURE__ */ new Set([
      ...currentVault.tombstones || [],
      ...payload.tombstones || []
    ]);
    const clinicMap = /* @__PURE__ */ new Map();
    (currentVault.clinics || []).forEach((c) => {
      if (c && c.id) clinicMap.set(c.id, c);
    });
    (payload.clinics || []).forEach((c) => {
      if (c && c.id && !tombstonesSet.has(c.id)) {
        const prev = clinicMap.get(c.id);
        if (!prev) {
          clinicMap.set(c.id, c);
        } else {
          const t1 = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
          const t2 = new Date(c.updatedAt || c.createdAt || 0).getTime();
          clinicMap.set(c.id, t2 >= t1 ? { ...prev, ...c } : { ...c, ...prev });
        }
      }
    });
    const mergedClinics = Array.from(clinicMap.values()).filter((c) => !tombstonesSet.has(c.id));
    const mergedContact = sanitizeSuperAdminContactServer({
      ...currentVault.superAdminContact || {},
      ...payload.superAdminContact || {}
    });
    const mergedRecords = {
      ...currentVault.clinicRecords || {},
      ...payload.clinicRecords || {}
    };
    const mergedSettings = {
      ...currentVault.clinicSettings || {},
      ...payload.clinicSettings || {}
    };
    const newVault = {
      clinics: mergedClinics,
      superAdminContact: mergedContact,
      tombstones: Array.from(tombstonesSet),
      clinicRecords: mergedRecords,
      clinicSettings: mergedSettings,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    writeVault(newVault);
    return res.json({
      success: true,
      vault: newVault,
      timestamp: newVault.lastUpdated
    });
  } catch (err) {
    console.error("Error in POST /api/cloud-sync/vault:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/gemini/generate-report", aiGenerationLimiter, async (req, res) => {
  try {
    const { patientName, age, gender, modality, studyName, clinicalIndication, keyObservations, priorStudies } = req.body;
    const ai = getAI();
    if (!ai) {
      const fallbackReport = {
        technique: `Se realiz\xF3 ${studyName || modality} mediante equipo de alta resoluci\xF3n bajo protocolo est\xE1ndar para ${modality}.`,
        findings: `Hallazgos principales:
- ${keyObservations || "Estructuras anat\xF3micas evaluadas sin alteraciones morfol\xF3gicas evidentes en cortes axiales, coronales y sagitales."}
- No se identifican lesiones ocupantes de espacio ni colecciones an\xF3malas.
- Relaciones \xF3seas y de tejidos blandos conservadas dentro de los l\xEDmites esperados para la edad del paciente (${age || "N/A"} a\xF1os).`,
        impression: `CONCLUSI\xD3N:
1. Estudio de ${studyName || modality} representativo sin signos de patolog\xEDa aguda evolutiva.
2. Se correlaciona cl\xEDnicamente con el cuadro referido: "${clinicalIndication || "Evaluaci\xF3n diagn\xF3stica"}".`,
        recommendations: "Correlaci\xF3n con evoluci\xF3n cl\xEDnica y seguimiento seg\xFAn criterio del m\xE9dico tratante.",
        biRadsOrScore: modality?.includes("Mamograf\xEDa") ? "BI-RADS 2 (Benigno)" : void 0
      };
      return res.json({ success: true, report: fallbackReport, isFallback: true });
    }
    const systemPrompt = `Eres un M\xE9dico Radi\xF3logo Especialista de alto nivel con amplia experiencia en diagn\xF3stico por im\xE1genes (Rayos X, TAC, RMN, Ecograf\xEDa, Mamograf\xEDa).
Tu tarea es redactar un informe radiol\xF3gico estructurado, profesional, en espa\xF1ol m\xE9dico formal y riguroso.
Usa terminolog\xEDa t\xE9cnica precisa (t\xE9cnica de adquisici\xF3n, hallazgos por planos anat\xF3micos, conclusi\xF3n/impresi\xF3n diagn\xF3stica, recomendaciones y clasificaci\xF3n diagn\xF3stica est\xE1ndar si aplica, como BI-RADS, Lung-RADS, o Gleason/PIRADS).

Debes devolver EXCLUSIVAMENTE un objeto JSON v\xE1lido con los campos:
{
  "technique": "Descripci\xF3n precisa de la t\xE9cnica y secuencias utilizadas",
  "findings": "Texto detallado de hallazgos anat\xF3micos divididos l\xF3gicamente",
  "impression": "Conclusi\xF3n diagn\xF3stica numerada y contundente",
  "recommendations": "Recomendaciones cl\xEDnicas o estudios complementarios",
  "biRadsOrScore": "Puntaje/Clasificaci\xF3n est\xE1ndar (ej. BI-RADS 1-6 si es mama, o null)"
}`;
    const userPrompt = `Datos del paciente:
- Nombre: ${patientName || "Paciente"}
- Edad: ${age || "Adulto"} a\xF1os | G\xE9nero: ${gender || "No especificado"}
- Modalidad: ${modality}
- Estudio solicitado: ${studyName}
- Indicaci\xF3n cl\xEDnica / Sospecha diagn\xF3stica: ${clinicalIndication || "Control de rutina"}
- Notas y observaciones visuales preliminares del radi\xF3logo: ${keyObservations || "Estudio completado sin incidentes t\xE9cnicos."}
- Antecedentes/Estudios previos: ${priorStudies || "No se aportan estudios previos para cotejo."}

Por favor genera el informe radiol\xF3gico formal.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });
    const text = response.text || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        technique: "T\xE9cnica est\xE1ndar de adquisici\xF3n multiplanar.",
        findings: text,
        impression: "Impresi\xF3n diagn\xF3stica seg\xFAn hallazgos descritos.",
        recommendations: "Control cl\xEDnico seg\xFAn criterio m\xE9dico."
      };
    }
    return res.json({ success: true, report: parsed, isFallback: false });
  } catch (error) {
    console.error("Error generating report with Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error al generar el informe con IA"
    });
  }
});
app.post("/api/gemini/explain-to-patient", aiGenerationLimiter, async (req, res) => {
  try {
    const { reportText, studyName, patientName } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.json({
        success: true,
        explanation: `Hola ${patientName || "estimado paciente"}, su estudio de ${studyName || "imagenolog\xEDa"} fue interpretado por el m\xE9dico especialista. En t\xE9rminos sencillos, el estudio revis\xF3 las estructuras correspondientes para comprobar que se encuentren en buen estado y descartar inflamaci\xF3n o lesiones de cuidado. Le recomendamos llevar este informe oficial con su m\xE9dico tratante para definir los siguientes pasos de su tratamiento.`,
        isFallback: true
      });
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Explica en un lenguaje c\xE1lido, emp\xE1tico, muy claro y 100% entendible para un paciente sin conocimientos m\xE9dicos el siguiente informe de imagenolog\xEDa (${studyName}):

${reportText}

Incluye: 1. Qu\xE9 se evalu\xF3 en palabras sencillas. 2. Qu\xE9 significa la conclusi\xF3n en su vida diaria. 3. Preguntas \xFAtiles que puede hacerle a su m\xE9dico tratante. Recuerda aclararle que debe siempre consultar a su m\xE9dico tratante.`,
      config: {
        systemInstruction: "Eres un m\xE9dico especialista en comunicaci\xF3n paciente-m\xE9dico que traduce terminolog\xEDa m\xE9dica compleja a un lenguaje accesible, tranquilizador y educativo en espa\xF1ol."
      }
    });
    return res.json({ success: true, explanation: response.text, isFallback: false });
  } catch (error) {
    console.error("Error explaining report:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/gemini/safety-check", aiGenerationLimiter, async (req, res) => {
  try {
    const { modality, contrastRequired, allergies, eGFR, creatinine, hasPacemaker, hasMetalImplants, isPregnant } = req.body;
    const ai = getAI();
    if (!ai) {
      const issues = [];
      if (modality?.includes("Resonancia") && (hasPacemaker || hasMetalImplants)) {
        issues.push("Alerta Cr\xEDtica: Contraindicaci\xF3n para RMN por presencia de marcapasos o implantes ferromagn\xE9ticos sin certificaci\xF3n MR-Conditional.");
      }
      if (contrastRequired && eGFR && Number(eGFR) < 30) {
        issues.push("Alerta Renal: Tasa de filtraci\xF3n glomerular < 30 mL/min/1.73m\xB2. Riesgo elevado de nefropat\xEDa inducida por contraste o fibrosis sist\xE9mica nefrog\xE9nica.");
      }
      if (contrastRequired && allergies && allergies.toLowerCase().includes("yod")) {
        issues.push("Alerta de Alergia: Antecedente de reacci\xF3n a medio de contraste yodado. Requiere protocolo de premedicaci\xF3n con corticoides y antihistam\xEDnicos.");
      }
      return res.json({
        success: true,
        cleared: issues.length === 0,
        alerts: issues,
        recommendation: issues.length === 0 ? "Paciente apto bajo protocolo regular de adquisici\xF3n." : "Requiere valoraci\xF3n por el m\xE9dico radi\xF3logo previo al estudio.",
        isFallback: true
      });
    }
    const prompt = `Eval\xFAa la seguridad del paciente para el siguiente procedimiento de imagenolog\xEDa:
- Modalidad: ${modality}
- Requiere contraste IV: ${contrastRequired ? "S\xCD" : "NO"}
- Alergias reportadas: ${allergies || "Ninguna conocida"}
- Funci\xF3n renal: Creatinina ${creatinine || "N/A"} mg/dL, eGFR ${eGFR || "N/A"} mL/min
- Marcapasos / Dispositivos card\xEDacos: ${hasPacemaker ? "S\xCD" : "NO"}
- Implantes met\xE1licos / clips de aneurisma: ${hasMetalImplants ? "S\xCD" : "NO"}
- Embarazo / Sospecha: ${isPregnant ? "S\xCD" : "NO"}

Genera un JSON con el formato:
{
  "cleared": boolean,
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Cr\xEDtico",
  "alerts": ["Lista de advertencias espec\xEDficas"],
  "recommendations": "Instrucciones de preparaci\xF3n o contraindicaciones concretas",
  "preparationGuide": "Instrucciones que debe seguir el paciente (ej. horas de ayuno, toma de agua, etc.)"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un especialista en seguridad radiol\xF3gica y protocolos de medios de contraste en imagenolog\xEDa diagn\xF3stica.",
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error) {
    console.error("Error in safety check:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/notifications/generate-reminder", aiGenerationLimiter, async (req, res) => {
  try {
    const { patientName, modality, studyName, scheduledDate, scheduledTime, advanceLabel, requiresContrast, allergies } = req.body;
    const ai = getAI();
    if (!ai) {
      const emailBody = `Estimado/a ${patientName || "Paciente"},

Le recordamos su cita programada en IMAGIS Radiolog\xEDa:
- Estudio: ${studyName || modality}
- Fecha: ${scheduledDate || "Pr\xF3ximamente"} a las ${scheduledTime || "09:00"} hrs
- Anticipaci\xF3n: ${advanceLabel || "Recordatorio de cita"}
- Indicaci\xF3n de preparaci\xF3n: ${requiresContrast ? "Ayuno obligatorio de 6 horas para el medio de contraste. Traer estudio previo de creatinina." : "Presentarse con ropa c\xF3moda sin adornos met\xE1licos."}

Por favor presentarse con 15 minutos de anticipaci\xF3n con su documento de identidad y orden m\xE9dica.`;
      const smsBody = `IMAGIS: ${patientName}, recordatorio de su ${studyName} el ${scheduledDate} a las ${scheduledTime}. ${requiresContrast ? "Ayuno de 6 horas." : "Sin objetos met\xE1licos."} Llegar 15 min antes.`;
      return res.json({
        success: true,
        emailSubject: `Recordatorio de cita m\xE9dica: ${studyName} - ${scheduledDate}`,
        emailBody,
        smsBody,
        isFallback: true
      });
    }
    const prompt = `Genera un recordatorio m\xE9dico claro, emp\xE1tico y profesional para un paciente de imagenolog\xEDa diagn\xF3stica.
Datos:
- Paciente: ${patientName}
- Estudio: ${studyName} (${modality})
- Fecha y Hora: ${scheduledDate} a las ${scheduledTime}
- Tipo de Recordatorio: ${advanceLabel || "24 horas antes"}
- Requiere Medio de Contraste: ${requiresContrast ? "S\xCD" : "NO"}
- Antecedentes/Alergias: ${allergies || "Ninguno"}

Devuelve un JSON con:
{
  "emailSubject": "Asunto claro y formal para correo",
  "emailBody": "Texto completo y bien estructurado para el correo con saludo, detalles de la cita, preparaci\xF3n paso a paso e instrucciones de llegada",
  "smsBody": "Mensaje SMS conciso (m\xE1ximo 160 caracteres) con nombre, estudio, fecha/hora y advertencia clave",
  "prepKeyPoints": ["Punto 1", "Punto 2"]
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres el coordinador del centro de atenci\xF3n al paciente de un centro de radiolog\xEDa e imagenolog\xEDa m\xE9dica de prestigio.",
        responseMimeType: "application/json"
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed, isFallback: false });
  } catch (error) {
    console.error("Error generating reminder with AI:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/portal/chat-assistant", aiGenerationLimiter, async (req, res) => {
  try {
    const { message, patientName, patientAge, upcomingAppointments, completedStudies } = req.body;
    const ai = getAI();
    if (!ai) {
      return res.json({
        success: true,
        reply: `Hola ${patientName || "estimado/a paciente"}, estoy aqu\xED para ayudarte. Si tienes dudas sobre tu preparaci\xF3n (ayuno, metales o contraste) para tus estudios, te recomendamos revisar las indicaciones de tu cita o presentarte 15 minutos antes de la hora acordada. Para emergencias o consultas m\xE9dicas espec\xEDficas, consulta siempre a tu m\xE9dico tratante.`,
        isFallback: true
      });
    }
    const contextPrompt = `Contexto del paciente en el portal:
- Nombre: ${patientName || "Paciente"} (${patientAge || "N/A"} a\xF1os)
- Pr\xF3ximas citas: ${JSON.stringify(upcomingAppointments || [])}
- Estudios previos: ${JSON.stringify(completedStudies || [])}

Pregunta o duda del paciente:
"${message}"`;
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contextPrompt,
      config: {
        systemInstruction: `Eres el Asistente Virtual Inteligente del Portal de Pacientes de IMAGIS Radiolog\xEDa.
Tu objetivo es resolver de manera muy emp\xE1tica, tranquilizadora, clara y precisa dudas sobre:
1. Preparaci\xF3n para estudios de imagen (TAC, RMN, Rayos X, Ecograf\xEDa, Mamograf\xEDa): horas de ayuno, toma de agua, uso de ropa sin metal, retiro de joyas/cosm\xE9ticos.
2. Procedimientos y qu\xE9 esperar durante el examen (ruidos en RMN, calor leve con contraste en TAC, compresi\xF3n en mamograf\xEDa).
3. C\xF3mo interpretar sus resultados en t\xE9rminos sencillos sin dar diagn\xF3sticos definitivos (siempre orientando a consultar a su m\xE9dico tratante).
4. Horarios de atenci\xF3n y tiempos de entrega de informes radiol\xF3gicos.

Mant\xE9n un tono c\xE1lido, humano, profesional y en espa\xF1ol claro. Si el paciente pregunta algo no relacionado con salud o con la cl\xEDnica, gu\xEDalo amablemente de vuelta a sus citas o dudas de imagenolog\xEDa.`
      }
    });
    return res.json({ success: true, reply: response.text, isFallback: false });
  } catch (error) {
    console.error("Error in portal chat assistant:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
