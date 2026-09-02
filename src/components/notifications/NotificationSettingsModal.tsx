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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sistema de Notificaciones & Recordatorios de Citas
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    localSettings.autoSendEnabled
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {localSettings.autoSendEnabled ? 'Servicio Activo' : 'Servicio en Pausa'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestión automatizada y multicanal (Correo Electrónico, SMS, WhatsApp) con antelación configurable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAutoSend}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                localSettings.autoSendEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {localSettings.autoSendEnabled ? 'Desactivar Envíos Automáticos' : 'Activar Envíos Automáticos'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              onClick={() => setActiveSubTab('RULES')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'RULES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reglas de Antelación ({(localSettings.rules || DEFAULT_RULES).filter(r => r.enabled).length} activas)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('TEMPLATES')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'TEMPLATES'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Plantillas por Modalidad</span>
            </button>

            <button
              onClick={() => setActiveSubTab('SIMULATOR')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'SIMULATOR'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Simulador de Vista Previa</span>
            </button>

            <button
              onClick={() => setActiveSubTab('LOGS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'LOGS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial & Auditoría ({logs.length})</span>
            </button>
          </div>

          <button
            onClick={handleSaveAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
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
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* TAB 1: RULES */}
          {activeSubTab === 'RULES' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-700" />
                    <span>Configuración de Temporización & Disparadores Automáticos</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define con cuánta antelación el sistema analiza la agenda y envía los recordatorios a los pacientes registrados.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-cyan-800 border border-slate-200 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Regla de Tiempo</span>
                </button>
              </div>

              {/* Add Rule Form */}
              {showAddRule && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-cyan-300 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-cyan-900 uppercase tracking-wider">
                    Nueva Regla de Notificación
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
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
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Etiqueta descriptiva:</label>
                      <input
                        type="text"
                        value={newRuleLabel}
                        onChange={e => setNewRuleLabel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Canales a disparar:</label>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newRuleEmail}
                            onChange={e => setNewRuleEmail(e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600"
                          />
                          <span>Correo</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newRuleSms}
                            onChange={e => setNewRuleSms(e.target.checked)}
                            className="rounded border-slate-300 text-purple-600"
                          />
                          <span>SMS</span>
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={newRuleWhatsapp}
                            onChange={e => setNewRuleWhatsapp(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          <span>WhatsApp</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddCustomRule}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
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
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      rule.enabled
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50/40 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="mt-1 sm:mt-0 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 bg-white cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{rule.label}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-mono font-bold">
                            T-{rule.hoursBefore}h
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{rule.customNote}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      {/* Channel toggles */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'email')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            rule.channels.email
                              ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Alternar Correo Electrónico"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'sms')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            rule.channels.sms
                              ? 'bg-purple-50 text-purple-800 border border-purple-200 font-bold'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title="Alternar SMS"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>SMS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleRuleChannel(rule.id, 'whatsapp')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            rule.channels.whatsapp
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                              : 'text-slate-400 hover:text-slate-600'
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sender Info Configuration */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Identidad del Remitente Clínico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Nombre remitente de Correo:</label>
                    <input
                      type="text"
                      value={localSettings.emailSenderName}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, emailSenderName: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">Dirección de Correo (From):</label>
                    <input
                      type="text"
                      value={localSettings.emailSenderAddress}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, emailSenderAddress: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1 font-semibold">ID Alfanumérico SMS / Gateway:</label>
                    <input
                      type="text"
                      value={localSettings.smsSenderId}
                      onChange={e =>
                        setLocalSettings(prev => ({ ...prev, smsSenderId: e.target.value }))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 font-mono"
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedModalityForTemplate === mod
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {mod.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Email Template */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Plantilla de Correo Electrónico ({selectedModalityForTemplate})</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">HTML / Texto enriquecido</span>
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
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:outline-hidden focus:border-cyan-600"
                  />
                  <div className="text-[11px] text-slate-500">
                    Variables disponibles: <code className="text-cyan-700 font-bold">{'{nombre_paciente}'}</code>,{' '}
                    <code className="text-cyan-700 font-bold">{'{estudio}'}</code>,{' '}
                    <code className="text-cyan-700 font-bold">{'{fecha_cita}'}</code>,{' '}
                    <code className="text-cyan-700 font-bold">{'{hora_cita}'}</code>,{' '}
                    <code className="text-cyan-700 font-bold">{'{indicaciones_preparacion}'}</code>
                  </div>
                </div>

                {/* SMS Template */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Plantilla SMS ({selectedModalityForTemplate})</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Límite óptimo: 160 caracteres</span>
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
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:outline-hidden focus:border-cyan-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      Longitud actual:{' '}
                      <strong className="text-slate-900">
                        {(localSettings.templatesByModality[selectedModalityForTemplate]?.smsText || '').length}
                      </strong>{' '}
                      caracteres
                    </span>
                    <span className="text-emerald-700 font-bold">Entrega rápida instantánea</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIMULATOR */}
          {activeSubTab === 'SIMULATOR' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Cita de prueba:</label>
                    <select
                      value={simSelectedAppId}
                      onChange={e => {
                        setSimSelectedAppId(e.target.value);
                        setSimGeneratedText(null);
                      }}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    >
                      {appointments.map(app => (
                        <option key={app.id} value={app.id}>
                          {app.patientName} - {app.studyName} ({app.scheduledDate} {app.scheduledTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Canal de prueba:</label>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                      <button
                        onClick={() => setSimChannel('EMAIL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          simChannel === 'EMAIL' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Email
                      </button>
                      <button
                        onClick={() => setSimChannel('SMS')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          simChannel === 'SMS' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                  className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${simIsGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{simIsGeneratingAI ? 'Generando con IA...' : 'Generar Redacción Asistida con IA'}</span>
                </button>
              </div>

              {/* Simulator Preview Screen */}
              {selectedApp && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Context Card */}
                  <div className="lg:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                      Ficha de Envío
                    </h4>
                    <div>
                      <span className="text-slate-500 block font-semibold">Paciente Destinatario:</span>
                      <span className="font-bold text-slate-900">{selectedApp.patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Teléfono / Correo:</span>
                      <span className="text-slate-700 font-mono">
                        {selectedApp.patientPhone} | {patients.find(p => p.id === selectedApp.patientId)?.email || 'correo@paciente.com'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Estudio Solicitado:</span>
                      <span className="font-bold text-cyan-800">{selectedApp.studyName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Fecha y Hora Programada:</span>
                      <span className="font-bold text-slate-900">
                        {selectedApp.scheduledDate} a las {selectedApp.scheduledTime} hrs
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-semibold">Requiere Contraste IV:</span>
                      <span
                        className={`font-bold ${
                          selectedApp.requiresContrast ? 'text-amber-800' : 'text-slate-600'
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
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                        {/* Email Top Bar */}
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Mail className="w-4 h-4 text-cyan-700" />
                            <span className="font-bold">Bandeja de Entrada del Paciente</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">protocol: IMAP/TLS</span>
                        </div>
                        {/* Email Header */}
                        <div className="p-4 bg-slate-50/50 border-b border-slate-200 text-xs space-y-1">
                          <div>
                            <span className="text-slate-500">De: </span>
                            <span className="text-slate-900 font-bold">
                              {localSettings.emailSenderName} &lt;{localSettings.emailSenderAddress}&gt;
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Para: </span>
                            <span className="text-slate-900">
                              {selectedApp.patientName} &lt;{patients.find(p => p.id === selectedApp.patientId)?.email || 'paciente@email.com'}&gt;
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Asunto: </span>
                            <span className="text-cyan-800 font-bold">
                              {simGeneratedText?.emailSubject ||
                                `Recordatorio de Cita Médica: ${selectedApp.studyName} - ${selectedApp.scheduledDate}`}
                            </span>
                          </div>
                        </div>
                        {/* Email Body Content */}
                        <div className="p-6 bg-white text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans space-y-4">
                          {simGeneratedText?.emailBody || (
                            <div className="space-y-3">
                              <p className="font-bold text-slate-900">
                                Estimado/a {selectedApp.patientName},
                              </p>
                              <p>
                                Le confirmamos y recordamos su cita para el estudio diagnóstico de{' '}
                                <strong className="text-cyan-800">{selectedApp.studyName}</strong> ({selectedApp.modality}).
                              </p>
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                                <div>📅 <strong>Fecha:</strong> {selectedApp.scheduledDate}</div>
                                <div>⏰ <strong>Hora:</strong> {selectedApp.scheduledTime} hrs (presentarse 15 min antes)</div>
                                <div>📍 <strong>Sede:</strong> IMAGIS Sede Central - Sala {selectedApp.modality}</div>
                              </div>
                              <div className="bg-cyan-50 p-3.5 rounded-xl border border-cyan-200 text-cyan-900">
                                <strong className="font-bold">Instrucciones Clave:</strong>
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
                              <p className="text-slate-500 text-[11px]">
                                Puede consultar sus instrucciones completas o solicitar cambios ingresando a su{' '}
                                <strong className="text-cyan-700">Portal del Paciente IMAGIS</strong>.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* SMS Smartphone Mockup */
                      <div className="max-w-sm mx-auto bg-slate-900 border-4 border-slate-300 rounded-3xl p-3 shadow-2xl">
                        {/* Phone Notch */}
                        <div className="w-24 h-3 bg-slate-800 rounded-full mx-auto mb-3"></div>
                        <div className="bg-white rounded-2xl p-4 min-h-[280px] flex flex-col justify-between">
                          <div className="text-center pb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-900">{localSettings.smsSenderId}</span>
                            <p className="text-[10px] text-slate-400">Mensaje de Texto SMS Oficial</p>
                          </div>

                          <div className="my-auto bg-slate-100 text-slate-800 p-3.5 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-xs border border-slate-200">
                            {simGeneratedText?.smsBody || (
                              <>
                                IMAGIS: Hola {selectedApp.patientName.split(' ')[0]}, le recordamos su cita para{' '}
                                <strong>{selectedApp.studyName}</strong> hoy {selectedApp.scheduledDate} a las{' '}
                                {selectedApp.scheduledTime} hrs.{' '}
                                {selectedApp.requiresContrast ? 'Ayuno 6h.' : 'Sin metales.'} Llegar 15 min antes.
                              </>
                            )}
                          </div>

                          <div className="text-center pt-2 text-[10px] text-slate-400">
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
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-cyan-700" />
                  <span className="font-bold text-slate-800">Filtrar Historial:</span>

                  <select
                    value={logChannelFilter}
                    onChange={e => setLogChannelFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-semibold"
                  >
                    <option value="ALL">Todos los canales</option>
                    <option value="EMAIL">Correo Electrónico</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>

                  <select
                    value={logStatusFilter}
                    onChange={e => setLogStatusFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-900 font-semibold"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="LEIDO">Leído</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="PROGRAMADO">Programado</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500">
                  Mostrando <strong>{filteredLogs.length}</strong> de {logs.length} envíos
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">Estudio / Cita</th>
                      <th className="p-3">Antelación</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Fecha & Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.channel === 'EMAIL'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : log.channel === 'SMS'
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {log.channel === 'EMAIL' && <Mail className="w-3 h-3" />}
                            {log.channel === 'SMS' && <Smartphone className="w-3 h-3" />}
                            {log.channel === 'WHATSAPP' && <MessageSquare className="w-3 h-3" />}
                            <span>{log.channel}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{log.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.recipient}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{log.studyName || log.title}</div>
                          <div className="text-[10px] text-slate-400">
                            Cita: {log.scheduledDate} {log.scheduledTime}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                            {log.advanceRuleLabel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'LEIDO'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : log.status === 'ENTREGADO'
                                ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{log.sentAt}</td>
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
