import React, { useState } from 'react';
import {
  NotificationSettings,
  NotificationAdvanceRule,
  NotificationLog,
  Appointment,
  Patient,
  ModalityType,
} from '../../types';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Sliders,
  FileText,
  History,
  Eye,
  ShieldCheck,
  X,
  Sparkles,
  SmartphoneNfc,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { requestGenerateReminder } from '../../utils/geminiService';

interface NotificationSettingsModalProps {
  settings: NotificationSettings;
  logs?: NotificationLog[];
  appointments?: Appointment[];
  patients?: Patient[];
  onSaveSettings: (newSettings: NotificationSettings) => void;
  onSendManualReminder?: (log: NotificationLog) => void;
  onClose: () => void;
}

const DEFAULT_RULES: NotificationAdvanceRule[] = [
  {
    id: 'rule-48h',
    label: '48 horas antes (2 días)',
    hoursBefore: 48,
    enabled: true,
    channels: { email: true, sms: false, whatsapp: false },
    customNote: 'Aviso inicial de confirmación y preparación.',
  },
  {
    id: 'rule-24h',
    label: '24 horas antes (1 día)',
    hoursBefore: 24,
    enabled: true,
    channels: { email: true, sms: true, whatsapp: true },
    customNote: 'Recordatorio principal con instrucciones de ayuno y contraste.',
  },
  {
    id: 'rule-2h',
    label: '2 horas antes (Mismo día)',
    hoursBefore: 2,
    enabled: true,
    channels: { email: false, sms: true, whatsapp: true },
    customNote: 'Aviso urgente de presentación en sala de espera.',
  },
];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  settings,
  logs = [],
  appointments = [],
  patients = [],
  onSaveSettings,
  onSendManualReminder = () => {},
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'RULES' | 'TEMPLATES' | 'SIMULATOR' | 'LOGS'>('RULES');
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(() => ({
    ...settings,
    rules: Array.isArray(settings?.rules) && settings.rules.length > 0 ? settings.rules : DEFAULT_RULES,
    customTemplates: settings?.customTemplates || {},
  }));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Rule form state
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleHours, setNewRuleHours] = useState<number>(36);
  const [newRuleLabel, setNewRuleLabel] = useState<string>('36 horas antes');
  const [newRuleEmail, setNewRuleEmail] = useState(true);
  const [newRuleSms, setNewRuleSms] = useState(true);
  const [newRuleWhatsapp, setNewRuleWhatsapp] = useState(false);

  // Selected modality for template editing
  const [selectedModalityForTemplate, setSelectedModalityForTemplate] = useState<string>('ULTRASONIDO');

  // Simulator state
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeLogs = Array.isArray(logs) ? logs : [];
  const [simSelectedAppId, setSimSelectedAppId] = useState<string>(
    safeAppointments.length > 0 ? safeAppointments[0].id : ''
  );
  const [simChannel, setSimChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP'>('EMAIL');
  const [simAdvanceLabel, setSimAdvanceLabel] = useState('24 horas antes');
  const [simIsGeneratingAI, setSimIsGeneratingAI] = useState(false);
  const [simGeneratedText, setSimGeneratedText] = useState<{
    emailSubject?: string;
    emailBody?: string;
    smsBody?: string;
  } | null>(null);

  // Logs filter
  const [logChannelFilter, setLogChannelFilter] = useState<string>('ALL');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('ALL');

  const selectedApp = safeAppointments.length > 0
    ? safeAppointments.find(a => a.id === simSelectedAppId) || safeAppointments[0]
    : undefined;

  const handleToggleAutoSend = () => {
    setLocalSettings(prev => ({
      ...prev,
      autoSendEnabled: !prev.autoSendEnabled,
    }));
  };

  const handleToggleRule = (ruleId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      rules: (prev.rules || DEFAULT_RULES).map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
    }));
  };

  const handleToggleRuleChannel = (ruleId: string, channel: 'email' | 'sms' | 'whatsapp') => {
    setLocalSettings(prev => ({
      ...prev,
      rules: (prev.rules || DEFAULT_RULES).map(r =>
        r.id === ruleId
          ? {
              ...r,
              channels: {
                ...r.channels,
                [channel]: !r.channels[channel],
              },
            }
          : r
      ),
    }));
  };

  const handleDeleteRule = (ruleId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      rules: (prev.rules || DEFAULT_RULES).filter(r => r.id !== ruleId),
    }));
  };

  const handleAddCustomRule = () => {
    if (newRuleHours <= 0) return;
    const newRule: NotificationAdvanceRule = {
      id: `rule-${Date.now()}`,
      label: newRuleLabel || `${newRuleHours} horas antes`,
      hoursBefore: Number(newRuleHours),
      enabled: true,
      channels: {
        email: newRuleEmail,
        sms: newRuleSms,
        whatsapp: newRuleWhatsapp,
      },
      customNote: `Regla configurada manualmente para ${newRuleHours} horas antes.`,
    };
    setLocalSettings(prev => ({
      ...prev,
      rules: [...(prev.rules || DEFAULT_RULES), newRule].sort((a, b) => b.hoursBefore - a.hoursBefore),
    }));
    setShowAddRule(false);
  };

  const handleSaveAll = () => {
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleGenerateAISimulation = async () => {
    if (!selectedApp) return;
    setSimIsGeneratingAI(true);
    try {
      const res = await requestGenerateReminder({
        patientName: selectedApp.patientName,
        modality: selectedApp.modality,
        studyName: selectedApp.studyName,
        scheduledDate: selectedApp.scheduledDate,
        scheduledTime: selectedApp.scheduledTime,
        advanceLabel: simAdvanceLabel,
        requiresContrast: selectedApp.requiresContrast,
      });
      setSimGeneratedText({
        emailSubject: res.emailSubject,
        emailBody: res.emailBody,
        smsBody: res.smsBody,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSimIsGeneratingAI(false);
    }
  };

  const filteredLogs = safeLogs.filter(log => {
    if (!log) return false;
    const matchesChannel = logChannelFilter === 'ALL' || log.channel === logChannelFilter;
    const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
    return matchesChannel && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Sistema de Notificaciones & Recordatorios de Citas
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    localSettings.autoSendEnabled
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {localSettings.autoSendEnabled ? 'Servicio Activo' : 'Servicio en Pausa'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gestión automatizada y multicanal (Correo Electrónico, SMS, WhatsApp) con antelación configurable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAutoSend}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                localSettings.autoSendEnabled
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              {localSettings.autoSendEnabled ? 'Desactivar Envíos Automáticos' : 'Activar Envíos Automáticos'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveSubTab('RULES')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'RULES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reglas de Antelación ({(localSettings.rules || DEFAULT_RULES).filter(r => r.enabled).length} activas)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('TEMPLATES')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'TEMPLATES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plantillas por Modalidad</span>
            </button>

            <button
              onClick={() => setActiveSubTab('SIMULATOR')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'SIMULATOR'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Simulador de Vista Previa</span>
            </button>

            <button
              onClick={() => setActiveSubTab('LOGS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'LOGS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial & Auditoría ({logs.length})</span>
            </button>
          </div>

          <button
            onClick={handleSaveAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sm text-neutral-200">
          {/* TAB 1: RULES */}
          {activeSubTab === 'RULES' && (
            <div className="space-y-5">
              <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Configuración de Temporización & Disparadores Automáticos</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Define con cuánta antelación el sistema analiza la agenda y envía los recordatorios a los pacientes registrados.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-semibold transition-all self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Regla de Tiempo</span>
                </button>
              </div>

              {/* Add Rule Form */}
              {showAddRule && (
                <div className="bg-neutral-950 p-4 rounded-xl border border-cyan-800/60 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Nueva Regla de Notificación
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">
                        Antelación (en Horas antes):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={newRuleHours}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setNewRuleHours(val);
                          setNewRuleLabel(`${val} horas antes`);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Etiqueta descriptiva:</label>
                      <input
                        type="text"
                        value={newRuleLabel}
                        onChange={e => setNewRuleLabel(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Canales a disparar:</label>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRuleEmail}
                            onChange={e => setNewRuleEmail(e.target.checked)}
                            className="rounded border-neutral-700"
                          />
                          <span>Correo</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRuleSms}
                            onChange={e => setNewRuleSms(e.target.checked)}
                            className="rounded border-neutral-700"
                          />
                          <span>SMS</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRuleWhatsapp}
                            onChange={e => setNewRuleWhatsapp(e.target.checked)}
                            className="rounded border-neutral-700"
                          />
                          <span>WhatsApp</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddCustomRule}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Guardar Regla
                    </button>
                  </div>
                </div>
              )}

              {/* Rules List */}
              <div className="space-y-3">
                {(localSettings.rules || DEFAULT_RULES).map(rule => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      rule.enabled
                        ? 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/40 border-neutral-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="mt-1 sm:mt-0 w-4 h-4 rounded border-neutral-700 text-cyan-600 focus:ring-cyan-500 bg-neutral-900 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{rule.label}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono">
                            T-{rule.hoursBefore}h
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{rule.customNote}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {/* Channel toggles */}
                      <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'email')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                            rule.channels.email
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/80 font-semibold'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                          title="Alternar Correo Electrónico"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'sms')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                            rule.channels.sms
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/80 font-semibold'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                          title="Alternar SMS"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>SMS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'whatsapp')}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                            rule.channels.whatsapp
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-semibold'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                          title="Alternar WhatsApp Clínico"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sender Info Configuration */}
              <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Identidad del Remitente Clínico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1">Nombre remitente de Correo:</label>
                    <input
                      type="text"
                      value={localSettings.emailSenderName}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, emailSenderName: e.target.value }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Dirección de Correo (From):</label>
                    <input
                      type="text"
                      value={localSettings.emailSenderAddress}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, emailSenderAddress: e.target.value }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">ID Alfanumérico SMS / Gateway:</label>
                    <input
                      type="text"
                      value={localSettings.smsSenderId}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, smsSenderId: e.target.value }))
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEMPLATES */}
          {activeSubTab === 'TEMPLATES' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['ULTRASONIDO', 'DENSITOMETRIA', 'RAYOS_X', 'RESONANCIA'].map(mod => (
                  <button
                    key={mod}
                    onClick={() => setSelectedModalityForTemplate(mod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedModalityForTemplate === mod
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {mod.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Email Template */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Plantilla de Correo Electrónico ({selectedModalityForTemplate})</span>
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">HTML / Texto enriquecido</span>
                  </div>
                  <textarea
                    rows={8}
                    value={
                      localSettings.templatesByModality[selectedModalityForTemplate]?.emailText ||
                      localSettings.defaultEmailTemplate
                    }
                    onChange={e => {
                      const text = e.target.value;
                      setLocalSettings(prev => ({
                        ...prev,
                        templatesByModality: {
                          ...prev.templatesByModality,
                          [selectedModalityForTemplate]: {
                            ...(prev.templatesByModality[selectedModalityForTemplate] || {
                              smsText: '',
                              prepNotes: '',
                            }),
                            emailText: text,
                          },
                        },
                      }));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono leading-relaxed focus:outline-hidden focus:border-cyan-500"
                  />
                  <div className="text-[11px] text-neutral-400">
                    Variables disponibles: <code className="text-cyan-300">{'{nombre_paciente}'}</code>,{' '}
                    <code className="text-cyan-300">{'{estudio}'}</code>,{' '}
                    <code className="text-cyan-300">{'{fecha_cita}'}</code>,{' '}
                    <code className="text-cyan-300">{'{hora_cita}'}</code>,{' '}
                    <code className="text-cyan-300">{'{indicaciones_preparacion}'}</code>
                  </div>
                </div>

                {/* SMS Template */}
                <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Plantilla SMS ({selectedModalityForTemplate})</span>
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">Límite óptimo: 160 caracteres</span>
                  </div>
                  <textarea
                    rows={8}
                    value={
                      localSettings.templatesByModality[selectedModalityForTemplate]?.smsText ||
                      localSettings.defaultSmsTemplate
                    }
                    onChange={e => {
                      const text = e.target.value;
                      setLocalSettings(prev => ({
                        ...prev,
                        templatesByModality: {
                          ...prev.templatesByModality,
                          [selectedModalityForTemplate]: {
                            ...(prev.templatesByModality[selectedModalityForTemplate] || {
                              emailText: '',
                              prepNotes: '',
                            }),
                            smsText: text,
                          },
                        },
                      }));
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono leading-relaxed focus:outline-hidden focus:border-cyan-500"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>
                      Longitud actual:{' '}
                      <strong className="text-white">
                        {(localSettings.templatesByModality[selectedModalityForTemplate]?.smsText || '').length}
                      </strong>{' '}
                      caracteres
                    </span>
                    <span className="text-emerald-400">Entrega rápida instantánea</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULATOR */}
          {activeSubTab === 'SIMULATOR' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Cita de prueba:</label>
                    <select
                      value={simSelectedAppId}
                      onChange={e => {
                        setSimSelectedAppId(e.target.value);
                        setSimGeneratedText(null);
                      }}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    >
                      {appointments.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.patientName} - {app.studyName} ({app.scheduledDate} {app.scheduledTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Canal de prueba:</label>
                    <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-700">
                      <button
                        onClick={() => setSimChannel('EMAIL')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          simChannel === 'EMAIL' ? 'bg-cyan-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        onClick={() => setSimChannel('SMS')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          simChannel === 'SMS' ? 'bg-purple-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        SMS
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAISimulation}
                  disabled={simIsGeneratingAI}
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${simIsGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{simIsGeneratingAI ? 'Generando con IA...' : 'Generar Redacción Asistida con IA'}</span>
                </button>
              </div>

              {/* Simulator Preview Screen */}
              {selectedApp && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Context Card */}
                  <div className="lg:col-span-4 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 space-y-3 text-xs">
                    <h4 className="font-bold text-neutral-200 border-b border-neutral-800 pb-2">
                      Ficha de Envío
                    </h4>
                    <div>
                      <span className="text-neutral-400 block">Paciente Destinatario:</span>
                      <span className="font-bold text-white">{selectedApp.patientName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Teléfono / Correo:</span>
                      <span className="text-neutral-300 font-mono">
                        {selectedApp.patientPhone} | {patients.find(p => p.id === selectedApp.patientId)?.email || 'correo@paciente.com'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Estudio Solicitado:</span>
                      <span className="font-semibold text-cyan-300">{selectedApp.studyName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Fecha y Hora Programada:</span>
                      <span className="font-bold text-white">
                        {selectedApp.scheduledDate} a las {selectedApp.scheduledTime} hrs
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Requiere Contraste IV:</span>
                      <span
                        className={`font-semibold ${
                          selectedApp.requiresContrast ? 'text-amber-400' : 'text-neutral-400'
                        }`}
                      >
                        {selectedApp.requiresContrast ? 'SÍ (Requiere 6h de ayuno)' : 'NO'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Visual Device Mockup */}
                  <div className="lg:col-span-8">
                    {simChannel === 'EMAIL' ? (
                      /* Email Mockup */
                      <div className="bg-neutral-950 border border-neutral-700 rounded-xl overflow-hidden shadow-xl">
                        {/* Email Top Bar */}
                        <div className="bg-neutral-900 p-3 border-b border-neutral-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-neutral-300">
                            <Mail className="w-4 h-4 text-cyan-400" />
                            <span className="font-semibold">Bandeja de Entrada del Paciente</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono">protocol: IMAP/TLS</span>
                        </div>
                        {/* Email Header */}
                        <div className="p-4 bg-neutral-900/50 border-b border-neutral-800 text-xs space-y-1">
                          <div>
                            <span className="text-neutral-400">De: </span>
                            <span className="text-white font-semibold">
                              {localSettings.emailSenderName} &lt;{localSettings.emailSenderAddress}&gt;
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Para: </span>
                            <span className="text-white">
                              {selectedApp.patientName} &lt;{patients.find(p => p.id === selectedApp.patientId)?.email || 'paciente@email.com'}&gt;
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Asunto: </span>
                            <span className="text-cyan-300 font-bold">
                              {simGeneratedText?.emailSubject ||
                                `Recordatorio de Cita Médica: ${selectedApp.studyName} - ${selectedApp.scheduledDate}`}
                            </span>
                          </div>
                        </div>
                        {/* Email Body Content */}
                        <div className="p-6 bg-neutral-950 text-xs text-neutral-200 whitespace-pre-line leading-relaxed font-sans space-y-4">
                          {simGeneratedText?.emailBody || (
                            <div className="space-y-3">
                              <p className="font-semibold text-white">
                                Estimado/a {selectedApp.patientName},
                              </p>
                              <p>
                                Le confirmamos y recordamos su cita para el estudio diagnóstico de{' '}
                                <strong className="text-cyan-300">{selectedApp.studyName}</strong> ({selectedApp.modality}).
                              </p>
                              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 space-y-1">
                                <div>📅 <strong>Fecha:</strong> {selectedApp.scheduledDate}</div>
                                <div>⏰ <strong>Hora:</strong> {selectedApp.scheduledTime} hrs (presentarse 15 min antes)</div>
                                <div>📍 <strong>Sede:</strong> IMAGIS Sede Central - Sala {selectedApp.modality}</div>
                              </div>
                              <div className="bg-cyan-950/40 p-3 rounded-lg border border-cyan-800/80 text-cyan-200">
                                <strong>Instrucciones Clave:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-1 text-[11px]">
                                  {selectedApp.requiresContrast ? (
                                    <>
                                      <li>Ayuno obligatorio de 6 horas para el medio de contraste.</li>
                                      <li>Traer orden médica y examen de creatinina sérica.</li>
                                    </>
                                  ) : (
                                    <>
                                      <li>Asistir con ropa cómoda sin broches ni joyas metálicas.</li>
                                      <li>Presentar documento de identidad original.</li>
                                    </>
                                  )}
                                </ul>
                              </div>
                              <p className="text-neutral-400 text-[11px]">
                                Puede consultar sus instrucciones completas o solicitar cambios ingresando a su{' '}
                                <strong className="text-cyan-400">Portal del Paciente IMAGIS</strong>.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* SMS Smartphone Mockup */
                      <div className="max-w-sm mx-auto bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-3 shadow-2xl">
                        {/* Phone Notch */}
                        <div className="w-24 h-3 bg-neutral-800 rounded-full mx-auto mb-3"></div>
                        <div className="bg-neutral-900 rounded-2xl p-4 min-h-[280px] flex flex-col justify-between">
                          <div className="text-center pb-2 border-b border-neutral-800">
                            <span className="text-xs font-bold text-white">{localSettings.smsSenderId}</span>
                            <p className="text-[10px] text-neutral-500">Mensaje de Texto SMS Oficial</p>
                          </div>

                          <div className="my-auto bg-neutral-800 text-neutral-100 p-3.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-sm border border-neutral-700">
                            {simGeneratedText?.smsBody || (
                              <>
                                IMAGIS: Hola {selectedApp.patientName.split(' ')[0]}, le recordamos su cita para{' '}
                                <strong>{selectedApp.studyName}</strong> hoy {selectedApp.scheduledDate} a las{' '}
                                {selectedApp.scheduledTime} hrs.{' '}
                                {selectedApp.requiresContrast ? 'Ayuno 6h.' : 'Sin metales.'} Llegar 15 min antes.
                              </>
                            )}
                          </div>

                          <div className="text-center pt-2 text-[10px] text-neutral-500">
                            Entregado vía Red Celular Segura
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LOGS */}
          {activeSubTab === 'LOGS' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-neutral-300">Filtrar Historial:</span>

                  <select
                    value={logChannelFilter}
                    onChange={e => setLogChannelFilter(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="ALL">Todos los canales</option>
                    <option value="EMAIL">Correo Electrónico</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>

                  <select
                    value={logStatusFilter}
                    onChange={e => setLogStatusFilter(e.target.value)}
                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="LEIDO">Leído</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="PROGRAMADO">Programado</option>
                  </select>
                </div>

                <div className="text-xs text-neutral-400">
                  Mostrando <strong>{filteredLogs.length}</strong> de {logs.length} envíos
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 uppercase tracking-wider font-semibold text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">Estudio / Cita</th>
                      <th className="p-3">Antelación</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Fecha & Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.channel === 'EMAIL'
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                                : log.channel === 'SMS'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                            }`}
                          >
                            {log.channel === 'EMAIL' && <Mail className="w-3 h-3" />}
                            {log.channel === 'SMS' && <Smartphone className="w-3 h-3" />}
                            {log.channel === 'WHATSAPP' && <MessageSquare className="w-3 h-3" />}
                            <span>{log.channel}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{log.patientName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{log.recipient}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-neutral-200">{log.studyName || log.title}</div>
                          <div className="text-[10px] text-neutral-400">
                            Cita: {log.scheduledDate} {log.scheduledTime}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                            {log.advanceRuleLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'LEIDO'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                                : log.status === 'ENTREGADO'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
                                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-neutral-400 font-mono text-[11px]">{log.sentAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
