import React, { useState } from 'react';
import { MedicalStudy, ClinicSettings } from '../../types';
import {
  Share2,
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface ShareStudyModalProps {
  study: MedicalStudy;
  clinicSettings?: ClinicSettings;
  onClose: () => void;
}

export const ShareStudyModal: React.FC<ShareStudyModalProps> = ({
  study,
  clinicSettings,
  onClose,
}) => {
  const [recipientType, setRecipientType] = useState<'DOCTOR' | 'PATIENT'>('DOCTOR');
  const [copied, setCopied] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');

  const clinicName = clinicSettings?.name || 'Centro de Imagenología Médica';
  const viewerUrl = `${window.location.origin}${window.location.pathname}#viewer?studyId=${encodeURIComponent(study.id)}`;

  const messageText =
    recipientType === 'DOCTOR'
      ? `🏥 *${clinicName}* — *Entrega de Estudio Radiológico*\n\nEstimado/a *Dr(a). ${study.referringDoctor || study.orderingPhysician || 'Colega Médico'}*:\nLe compartimos el informe e imágenes diagnósticas de su paciente:\n\n👤 *Paciente:* ${study.patientName} (${study.patientAge} años)\n📋 *Estudio:* ${study.studyName} (${study.modality})\n📅 *Fecha:* ${study.studyDate}\n🔒 *Acceso Directo al Visor PACS:* ${viewerUrl}\n\nQuedamos a su disposición para cualquier correlación clínica.`
      : `🏥 *${clinicName}* — *Resultados de su Estudio*\n\nEstimado/a *${study.patientName}*:\nSu estudio de *${study.studyName}* realizado el *${study.studyDate}* ya se encuentra disponible.\n\n🔗 *Puede visualizar sus imágenes e informe aquí:* ${viewerUrl}\n\nRecuerde presentar este informe a su médico tratante.`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(messageText);
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Compartir Estudio e Informe</h3>
              <p className="text-[11px] text-slate-500">Generador de Enlaces Rápidos y WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Audience Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setRecipientType('DOCTOR')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                recipientType === 'DOCTOR'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍⚕️ Para Médico Solicitante
            </button>
            <button
              onClick={() => setRecipientType('PATIENT')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                recipientType === 'PATIENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 Para el Paciente
            </button>
          </div>

          {/* Study Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{study.patientName}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-mono text-cyan-700 font-bold">
                {study.modality}
              </span>
            </div>
            <p className="text-slate-500 text-xs">
              {study.studyName} • {study.studyDate} ({study.studyTime})
            </p>
          </div>

          {/* Phone input for WhatsApp */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Teléfono / WhatsApp de Destino (Opcional):
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="+52 1 55 ... o 10 dígitos"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 text-xs focus:outline-hidden focus:bg-white focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Formatted Message Preview */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Mensaje Pre-redactado Listo para Enviar:
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-600">
              {messageText}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleCopyFullMessage}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>
          </div>

          {/* Link Quick Copy */}
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-1.5 truncate text-slate-500 text-[11px]">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
              <span className="truncate font-mono">{viewerUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-3 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              {copied ? 'Listo' : 'Copiar Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
