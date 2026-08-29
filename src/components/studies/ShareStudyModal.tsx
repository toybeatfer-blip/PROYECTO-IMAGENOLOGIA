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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none overflow-y-auto animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Compartir Estudio e Informe</h3>
              <p className="text-[11px] text-neutral-400">Generador de Enlaces Rápidos y WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Audience Selector */}
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setRecipientType('DOCTOR')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                recipientType === 'DOCTOR'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              👨‍⚕️ Para Médico Solicitante / Tratante
            </button>
            <button
              onClick={() => setRecipientType('PATIENT')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                recipientType === 'PATIENT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              👤 Para el Paciente
            </button>
          </div>

          {/* Study Summary Card */}
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">{study.patientName}</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-cyan-400">
                {study.modality}
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              {study.studyName} • {study.studyDate} ({study.studyTime})
            </p>
          </div>

          {/* Phone input for WhatsApp */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Teléfono / WhatsApp de Destino (Opcional):
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="+52 1 55 ... o 10 dígitos"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Formatted Message Preview */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Mensaje Pre-redactado Listo para Enviar:
            </label>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-neutral-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-l-4 border-l-emerald-600">
              {messageText}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleCopyFullMessage}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>
          </div>

          {/* Link Quick Copy */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div className="flex items-center gap-1.5 truncate text-neutral-400 text-[11px]">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{viewerUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              {copied ? 'Listo' : 'Copiar Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
