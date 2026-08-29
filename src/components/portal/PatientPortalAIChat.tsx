import React, { useState, useRef, useEffect } from 'react';
import { Patient, Appointment, MedicalStudy } from '../../types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  Clock,
  HelpCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { requestPortalChatAssistant } from '../../utils/geminiService';

interface ChatMessage {
  id: string;
  sender: 'PATIENT' | 'BOT';
  text: string;
  timestamp: string;
}

interface PatientPortalAIChatProps {
  patient: Patient;
  upcomingAppointments: Appointment[];
  completedStudies: MedicalStudy[];
}

export const PatientPortalAIChat: React.FC<PatientPortalAIChatProps> = ({
  patient,
  upcomingAppointments = [],
  completedStudies = [],
}) => {
  const safeAppointments = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];
  const safeStudies = Array.isArray(completedStudies) ? completedStudies : [];

  const displayName = patient?.fullName || (patient as any)?.name || 'Paciente';
  const firstName = displayName.split(' ')[0] || 'Paciente';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'BOT',
      text: `¡Hola ${firstName}! Soy tu Asistente Virtual de IMAGIS Radiología. 
Puedo orientarte sobre tu preparación para los estudios (ayuno, toma de agua, ropa adecuada), resolver dudas sobre tus citas programadas o explicarte términos de tus informes médicos en palabras sencillas. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await requestPortalChatAssistant({
        message: query,
        patientName: displayName,
        patientAge: patient?.age,
        upcomingAppointments: safeAppointments.map(a => ({
          study: a.studyName,
          modality: a.modality,
          date: a.scheduledDate,
          time: a.scheduledTime,
          requiresContrast: a.requiresContrast,
        })),
        completedStudies: safeStudies.map(s => ({
          study: s.studyName,
          modality: s.modality,
          date: s.studyDate,
          impression: s.keyFindingsSummary,
        })),
      });

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'BOT',
        text:
          response.reply ||
          'Te recomendamos verificar las indicaciones de tu cita o presentarte 15 minutos antes. Para dudas específicas sobre tu tratamiento, consulta siempre con tu médico.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'BOT',
        text:
          'Hubo una interrupción en la conexión. Para consultas urgentes de admisión, comunícate con recepción de IMAGIS o revisa la sección "Mis Citas".',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const QUICK_QUESTIONS = [
    '¿Cuántas horas de ayuno necesito para mi estudio?',
    '¿Qué ropa debo vestir para una resonancia magnética?',
    '¿Puedo tomar mis pastillas habituales antes del examen?',
    '¿Qué significa que mi informe diga "sin alteraciones significativas"?',
  ];

  return (
    <div className="max-w-4xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[680px]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-neutral-900 to-neutral-900 p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Asistente Inteligente del Paciente</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                Online 24/7
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Orientación personalizada sobre preparación de estudios, citas y comprensión de informes
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacidad Médica Protegida</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.sender === 'PATIENT' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                msg.sender === 'PATIENT'
                  ? 'bg-cyan-600'
                  : 'bg-neutral-800 border border-neutral-700 text-cyan-400'
              }`}
            >
              {msg.sender === 'PATIENT' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div className="space-y-1">
              <div
                className={`p-4 rounded-2xl leading-relaxed whitespace-pre-line shadow-sm text-xs ${
                  msg.sender === 'PATIENT'
                    ? 'bg-cyan-600 text-white rounded-tr-xs'
                    : 'bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
              <div
                className={`text-[10px] text-neutral-500 font-mono ${
                  msg.sender === 'PATIENT' ? 'text-right' : 'text-left'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center text-xs text-neutral-400 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>El asistente médico está redactando la respuesta...</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-2 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-neutral-500 shrink-0 flex items-center gap-1 font-semibold">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Sugerencias:</span>
        </span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-cyan-700 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Escriba su consulta médica sobre preparación, citas o informes..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
