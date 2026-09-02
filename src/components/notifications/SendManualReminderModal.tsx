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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enviar Recordatorio Inmediato</h3>
              <p className="text-xs text-slate-500">
                Notificación para {appointment.patientName} ({appointment.studyName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Channel selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Canal de Comunicación:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  channel === 'EMAIL'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Correo Electrónico</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  channel === 'SMS'
                    ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS Celular</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('WHATSAPP')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  channel === 'WHATSAPP'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Clínico</span>
              </button>
            </div>
          </div>

          {/* Recipient summary */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block font-semibold">Destinatario confirmado:</span>
              <span className="font-bold text-slate-900">
                {channel === 'EMAIL'
                  ? patient?.email || 'roberto.silva@email.com'
                  : appointment.patientPhone}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block font-semibold">Cita:</span>
              <span className="text-cyan-800 font-bold">
                {appointment.scheduledDate} a las {appointment.scheduledTime} hrs
              </span>
            </div>
          </div>

          {channel === 'EMAIL' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Asunto del Correo:
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-cyan-600"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Cuerpo del Mensaje:
              </label>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-1.5 text-xs text-cyan-700 hover:text-cyan-800 font-bold transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAI ? 'Generando...' : 'Optimizar con IA'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 leading-relaxed font-sans focus:outline-hidden focus:bg-white focus:border-cyan-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={handleSendNow}
            disabled={isSending || sentSuccess}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              sentSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
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
