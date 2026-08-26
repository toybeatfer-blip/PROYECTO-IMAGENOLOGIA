import React, { useState } from 'react';
import { Appointment, Patient, NotificationLog, NotificationChannel } from '../../types';
import {
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { requestGenerateReminder } from '../../utils/geminiService';

interface SendManualReminderModalProps {
  appointment: Appointment;
  patient?: Patient;
  onSend: (log: NotificationLog) => void;
  onClose: () => void;
}

export const SendManualReminderModal: React.FC<SendManualReminderModalProps> = ({
  appointment,
  patient,
  onSend,
  onClose,
}) => {
  const [channel, setChannel] = useState<NotificationChannel>('EMAIL');
  const [advanceLabel, setAdvanceLabel] = useState('Envío Inmediato');
  const [emailSubject, setEmailSubject] = useState(
    `Recordatorio de Cita Médica: ${appointment.studyName} - IMAGIS`
  );
  const [messageBody, setMessageBody] = useState(
    `Estimado/a ${appointment.patientName},\n\nLe recordamos su cita para ${appointment.studyName} programada para el ${appointment.scheduledDate} a las ${appointment.scheduledTime} hrs en IMAGIS Radiología.\n\n${
      appointment.requiresContrast
        ? '⚠️ Indicación de preparación: Ayuno de 6 horas para el medio de contraste y traer resultado reciente de creatinina.'
        : 'Por favor asistir con ropa cómoda y sin objetos metálicos en el área anatómica a evaluar.'
    }\n\nPresentarse 15 minutos antes con su documento de identidad y orden médica.`
  );

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await requestGenerateReminder({
        patientName: appointment.patientName,
        modality: appointment.modality,
        studyName: appointment.studyName,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        advanceLabel: advanceLabel,
        requiresContrast: appointment.requiresContrast,
      });

      if (channel === 'SMS') {
        setMessageBody(res.smsBody || messageBody);
      } else {
        if (res.emailSubject) setEmailSubject(res.emailSubject);
        if (res.emailBody) setMessageBody(res.emailBody);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendNow = () => {
    setIsSending(true);
    const recipient =
      channel === 'EMAIL'
        ? patient?.email || `${appointment.patientName.toLowerCase().replace(/\s+/g, '.')}@email.com`
        : appointment.patientPhone;

    const newLog: NotificationLog = {
      id: `notif-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientDni: appointment.patientDni,
      recipient,
      channel,
      type: 'RECORDATORIO_CITA',
      title: emailSubject,
      body: messageBody,
      status: 'ENTREGADO',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      advanceRuleLabel: advanceLabel,
      modality: appointment.modality,
      studyName: appointment.studyName,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
    };

    setTimeout(() => {
      onSend(newLog);
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/70 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enviar Recordatorio Inmediato</h3>
              <p className="text-xs text-neutral-400">
                Notificación para {appointment.patientName} ({appointment.studyName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-neutral-300">
          {/* Channel selector */}
          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Canal de Comunicación:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  channel === 'EMAIL'
                    ? 'bg-blue-950/80 border-blue-600 text-blue-300 shadow-xs'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Correo Electrónico</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  channel === 'SMS'
                    ? 'bg-purple-950/80 border-purple-600 text-purple-300 shadow-xs'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS Celular</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-xs'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Clínico</span>
              </button>
            </div>
          </div>

          {/* Recipient summary */}
          <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block">Destinatario confirmado:</span>
              <span className="font-bold text-white">
                {channel === 'EMAIL'
                  ? patient?.email || 'roberto.silva@email.com'
                  : appointment.patientPhone}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Cita:</span>
              <span className="text-cyan-300 font-semibold">
                {appointment.scheduledDate} a las {appointment.scheduledTime} hrs
              </span>
            </div>
          </div>

          {channel === 'EMAIL' && (
            <div>
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Asunto del Correo:
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Cuerpo del Mensaje:
              </label>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAI ? 'Generando...' : 'Optimizar con IA'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-xs text-neutral-200 leading-relaxed font-sans focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSendNow}
            disabled={isSending || sentSuccess}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              sentSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {sentSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Mensaje Enviado con Éxito!</span>
              </>
            ) : isSending ? (
              <>
                <Send className="w-4 h-4 animate-spin" />
                <span>Transmitiendo...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Recordatorio Ahora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
