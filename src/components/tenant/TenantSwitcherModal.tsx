import React, { useState } from 'react';
import { Tenant, ClinicSettings, Patient, Appointment, MedicalStudy } from '../../types';
import {
  Building2,
  CheckCircle2,
  Plus,
  X,
  Layers,
  Activity,
  HeartPulse,
  Shield,
  Scan,
  Stethoscope,
  MapPin,
  Phone,
  UserCheck,
  Calendar,
  Users,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TenantSwitcherModalProps {
  tenants: Tenant[];
  activeTenantId: string;
  allPatients: Patient[];
  allAppointments: Appointment[];
  allStudies: MedicalStudy[];
  onSelectTenant: (tenantId: string) => void;
  onCreateTenant: (newTenant: {
    name: string;
    slug?: string;
    plan?: Tenant['plan'];
    settings: Partial<ClinicSettings>;
  }) => void;
  onClose: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  tenants = [],
  activeTenantId,
  allPatients = [],
  allAppointments = [],
  allStudies = [],
  onSelectTenant,
  onCreateTenant,
  onClose,
}) => {
  const safeTenants = Array.isArray(tenants) ? tenants : [];
  const safePatients = Array.isArray(allPatients) ? allPatients : [];
  const safeAppointments = Array.isArray(allAppointments) ? allAppointments : [];
  const safeStudies = Array.isArray(allStudies) ? allStudies : [];

  const [showCreateForm, setShowCreateForm] = useState(false);

  // New Tenant Form State
  const [newName, setNewName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Lima, Perú');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRuc, setNewRuc] = useState('');
  const [newDirector, setNewDirector] = useState('');
  const [newDirectorTitle, setNewDirectorTitle] = useState('Especialista en Radiología');
  const [newPlan, setNewPlan] = useState<Tenant['plan']>('HOSPITAL_PRO');
  const [newAccentColor, setNewAccentColor] = useState<ClinicSettings['accentColor']>('cyan');
  const [newLogoIcon, setNewLogoIcon] = useState<ClinicSettings['logoIcon']>('Activity');
  const [formError, setFormError] = useState<string | null>(null);

  const ICON_OPTIONS = [
    { id: 'Activity', label: 'Pulso Clínico', icon: Activity },
    { id: 'Layers', label: 'Capas / PACS', icon: Layers },
    { id: 'HeartPulse', label: 'Cardio / Diagnóstico', icon: HeartPulse },
    { id: 'Shield', label: 'Protección Médica', icon: Shield },
    { id: 'Scan', label: 'Escaneo Radiológico', icon: Scan },
    { id: 'Stethoscope', label: 'Estetoscopio', icon: Stethoscope },
  ] as const;

  const COLOR_OPTIONS: { id: ClinicSettings['accentColor']; label: string; bgClass: string }[] = [
    { id: 'cyan', label: 'Cian', bgClass: 'bg-cyan-500' },
    { id: 'emerald', label: 'Esmeralda', bgClass: 'bg-emerald-500' },
    { id: 'blue', label: 'Azul', bgClass: 'bg-blue-500' },
    { id: 'indigo', label: 'Índigo', bgClass: 'bg-indigo-500' },
    { id: 'purple', label: 'Púrpura', bgClass: 'bg-purple-500' },
    { id: 'amber', label: 'Ámbar', bgClass: 'bg-amber-500' },
    { id: 'rose', label: 'Rosa', bgClass: 'bg-rose-500' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim() || !newDirector.trim()) {
      setFormError('Por favor complete el nombre de la sede y el director médico.');
      return;
    }

    onCreateTenant({
      name: newName.trim(),
      plan: newPlan,
      settings: {
        name: newName.trim(),
        shortName: newShortName.trim() || newName.trim(),
        tagline: newTagline.trim() || 'Centro de Diagnóstico por Imágenes & Radiología Médica',
        address: newAddress.trim() || 'Sede Principal',
        city: newCity.trim(),
        phone: newPhone.trim() || '(01) 700-0000',
        emergencyPhone: newPhone.trim(),
        email: newEmail.trim() || 'contacto@clinica.com',
        website: 'www.redclinica.com',
        ruc: newRuc.trim() || '20000000000',
        directorName: newDirector.trim(),
        directorTitle: newDirectorTitle.trim(),
        logoIcon: newLogoIcon,
        accentColor: newAccentColor,
      },
    });

    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs select-none font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-2xl text-cyan-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Gestión de Sedes & Clínicas (Multi-Tenant SaaS)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono font-bold">
                  {tenants.length} SEDES
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Alterne instantáneamente entre clínicas. Todos los pacientes, citas y estudios están 100% aislados por sede.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Bar Action */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Sedes Clínicas Registradas
            </span>
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreateForm ? 'Ver Lista de Sedes' : 'Dar de Alta Nueva Sede / Tenant'}</span>
            </button>
          </div>

          {/* Create New Tenant Form */}
          {showCreateForm ? (
            <form onSubmit={handleCreateSubmit} className="bg-slate-50 p-5 rounded-2xl border border-cyan-300 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-cyan-900 text-sm font-bold border-b border-slate-200 pb-2.5">
                <Sparkles className="w-4 h-4 text-cyan-700" />
                <span>Registrar Nueva Sede / Clínica Independiente</span>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Oficial de la Sede / Clínica:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Clínica Radiológica San Borja"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre Corto / Sistema (Badge):</label>
                  <input
                    type="text"
                    placeholder="Ej. San Borja PACS"
                    value={newShortName}
                    onChange={e => setNewShortName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dirección y Ciudad:</label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Guardia Civil 380, San Borja"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Director Médico / Responsable:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dra. Mónica Estrada - C.M.P. 51203"
                    value={newDirector}
                    onChange={e => setNewDirector(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono y Correo:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan & Tipo de Sede:</label>
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value as Tenant['plan'])}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-hidden focus:border-cyan-600"
                  >
                    <option value="HOSPITAL_PRO">🏥 HOSPITAL PRO (PACS + Visor Multiplanar)</option>
                    <option value="ENTERPRISE_PACS">⚡ ENTERPRISE PACS (Alta Demanda)</option>
                    <option value="CLINICA_BASIC">🩺 CLINICA BASIC (Consultorio Individual)</option>
                  </select>
                </div>
              </div>

              {/* Icon & Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Color Temático de la Sede:</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewAccentColor(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-pointer ${
                          newAccentColor === c.id
                            ? 'bg-white border-cyan-600 text-cyan-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${c.bgClass}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Icono Institucional:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {ICON_OPTIONS.map(opt => {
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setNewLogoIcon(opt.id as any)}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer ${
                            newLogoIcon === opt.id
                              ? 'bg-cyan-50 border-cyan-500 text-cyan-800 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span className="text-[8px] truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Sede e Iniciar con Aislamiento Total</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tenant Cards List */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {safeTenants.map(tenant => {
                const isActive = tenant.id === activeTenantId;
                const tenantPatients = safePatients.filter(p => p && (p.tenantId || 'tenant-imagis-central') === tenant.id);
                const tenantAppointments = safeAppointments.filter(a => a && (a.tenantId || 'tenant-imagis-central') === tenant.id);
                const tenantStudies = safeStudies.filter(s => s && (s.tenantId || 'tenant-imagis-central') === tenant.id);

                return (
                  <div
                    key={tenant.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                      isActive
                        ? 'bg-cyan-50/40 border-cyan-400 shadow-sm ring-1 ring-cyan-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${
                            isActive
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {tenant.plan}
                        </span>

                        {isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>SEDE ACTIVA</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{tenant.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{tenant.settings.tagline}</p>

                      {/* Details */}
                      <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                          <span className="truncate">{tenant.settings.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{tenant.settings.directorName}</span>
                        </div>
                      </div>

                      {/* Live Isolated Metrics */}
                      <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Pacientes</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{tenantPatients.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Citas</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{tenantAppointments.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Estudios</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{tenantStudies.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Switch Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTenant(tenant.id);
                        onClose();
                      }}
                      disabled={isActive}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-100 text-slate-500 cursor-default border border-slate-200'
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs active:scale-[0.99]'
                      }`}
                    >
                      {isActive ? (
                        <span>En uso actualmente</span>
                      ) : (
                        <>
                          <span>Cambiar a esta Sede</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Aislamiento de base de datos multi-tenant garantizado por clave `tenantId`</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
