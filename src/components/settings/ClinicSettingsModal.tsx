import React, { useState, useRef } from 'react';
import { ClinicSettings, StaffUser, TenantLicense } from '../../types';
import { INITIAL_CLINIC_SETTINGS, INITIAL_STAFF_USERS } from '../../data/initialData';
import { activateLicenseKey, createDefaultTenantLicense, checkLicenseStatus } from '../../utils/license';
import {
  Settings,
  Building2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Palette,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  UserCheck,
  CheckCircle2,
  X,
  Sparkles,
  Activity,
  Layers,
  HeartPulse,
  Shield,
  Scan,
  Stethoscope,
  RefreshCw,
  Eye,
  Users,
  ShieldCheck,
  Key,
  Plus,
  Lock,
  User,
  Edit2,
  AlertTriangle,
  Server,
  Zap,
  Calendar,
  CreditCard,
  Clock,
} from 'lucide-react';

interface ClinicSettingsModalProps {
  settings: ClinicSettings;
  staffUsers?: StaffUser[];
  onSave: (newSettings: ClinicSettings) => void;
  onSaveStaffUsers?: (users: StaffUser[]) => void;
  onClose: () => void;
}

export const ClinicSettingsModal: React.FC<ClinicSettingsModalProps> = ({
  settings,
  staffUsers = INITIAL_STAFF_USERS,
  onSave,
  onSaveStaffUsers,
  onClose,
}) => {
  const [formData, setFormData] = useState<ClinicSettings>(() => ({
    ...INITIAL_CLINIC_SETTINGS,
    ...(settings || {}),
    enableDemoMode: settings?.enableDemoMode ?? false,
    enableBruteForceProtection: settings?.enableBruteForceProtection ?? true,
    sessionTimeoutMinutes: settings?.sessionTimeoutMinutes ?? 30,
    license: settings?.license || createDefaultTenantLicense('MONTHLY', 1),
  }));
  const [staffList, setStaffList] = useState<StaffUser[]>(() => Array.isArray(staffUsers) ? staffUsers : INITIAL_STAFF_USERS);
  const [activeTab, setActiveTab] = useState<
    'BRANDING' | 'CONTACT' | 'MEDICAL_DIRECTION' | 'USERS' | 'SECURITY' | 'LICENSE' | 'PREVIEW'
  >('BRANDING');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User management state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showUserPasswords, setShowUserPasswords] = useState<Record<string, boolean>>({});

  // New user fields
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'ENCARGADO'>('ENCARGADO');
  const [newEmail, setNewEmail] = useState('');
  const [newPosition, setNewPosition] = useState('Encargado / Tecnólogo Radiólogo');
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // License state
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseMsg, setLicenseMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const ICON_OPTIONS = [
    { id: 'Activity', label: 'Pulso Clínico', icon: Activity },
    { id: 'Layers', label: 'Capas / Tomografía', icon: Layers },
    { id: 'HeartPulse', label: 'Cardio / Diagnóstico', icon: HeartPulse },
    { id: 'Shield', label: 'Protección Médica', icon: Shield },
    { id: 'Scan', label: 'Escaneo Radiológico', icon: Scan },
    { id: 'Stethoscope', label: 'Estetoscopio', icon: Stethoscope },
  ] as const;

  const COLOR_OPTIONS: { id: ClinicSettings['accentColor']; label: string; bgClass: string; borderClass: string }[] = [
    { id: 'cyan', label: 'Cian Radiológico', bgClass: 'bg-cyan-500', borderClass: 'border-cyan-400' },
    { id: 'emerald', label: 'Verde Esmeralda', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-400' },
    { id: 'blue', label: 'Azul Clínico', bgClass: 'bg-blue-500', borderClass: 'border-blue-400' },
    { id: 'indigo', label: 'Índigo Digital', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-400' },
    { id: 'purple', label: 'Púrpura Diagnóstico', bgClass: 'bg-purple-500', borderClass: 'border-purple-400' },
    { id: 'amber', label: 'Ámbar Hospitalario', bgClass: 'bg-amber-500', borderClass: 'border-amber-400' },
    { id: 'rose', label: 'Rosa Salud', bgClass: 'bg-rose-500', borderClass: 'border-rose-400' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2 MB para un óptimo rendimiento.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, logoImage: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setFormData(prev => ({ ...prev, logoImage: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Desea restablecer todos los datos del centro y logotipo a los valores predeterminados?')) {
      setFormData(INITIAL_CLINIC_SETTINGS);
    }
  };

  // Staff User Handlers
  const handleToggleShowPassword = (userId: string) => {
    setShowUserPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleUpdateUserField = (userId: string, field: keyof StaffUser, value: string) => {
    const target = staffList.find(u => u.id === userId);
    if (target?.isSuperAdmin || target?.isProtected || target?.role === 'SUPER_ADMIN') {
      alert('La cuenta del Creador del Sistema está protegida permanentemente contra modificaciones locales.');
      return;
    }
    setStaffList(prev =>
      prev.map(u => (u.id === userId ? { ...u, [field]: value } : u))
    );
  };

  const handleAddNewUser = () => {
    setUserFormError(null);
    if (!newUsername.trim() || !newPassword.trim() || !newFullName.trim()) {
      setUserFormError('Por favor complete el nombre, usuario y contraseña.');
      return;
    }

    const exists = staffList.some(
      u => u.username.toLowerCase() === newUsername.trim().toLowerCase()
    );
    if (exists) {
      setUserFormError('El nombre de usuario ya está registrado.');
      return;
    }

    const newUser: StaffUser = {
      id: `usr-${Date.now()}`,
      tenantId: formData.tenantId || 'tenant-imagis-central',
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      fullName: newFullName.trim(),
      role: newRole,
      email: newEmail.trim() || `${newUsername.trim()}@clinica.com`,
      position: newPosition.trim(),
      avatarIcon: newRole === 'ADMIN' ? 'ShieldCheck' : 'UserCheck',
    };

    setStaffList(prev => [...prev, newUser]);
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewEmail('');
    setNewRole('ENCARGADO');
    setShowAddUserForm(false);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = staffList.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.isSuperAdmin || userToDelete.isProtected || userToDelete.role === 'SUPER_ADMIN') {
      alert('Este es el usuario Maestro del Creador del Sistema y no puede ser eliminado.');
      return;
    }

    if (userToDelete.role === 'ADMIN' && staffList.filter(u => u.role === 'ADMIN').length <= 1) {
      alert('No se puede eliminar el único usuario Administrador del sistema.');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar al usuario ${userToDelete.fullName} (${userToDelete.username})?`)) {
      setStaffList(prev => prev.filter(u => u.id !== userId));
    }
  };

  // License Handlers
  const handleApplyLicenseKey = (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseMsg(null);
    const res = activateLicenseKey(licenseKeyInput, formData.license);
    if (res.success && res.newLicense) {
      setFormData(prev => ({ ...prev, license: res.newLicense }));
      setLicenseMsg({ text: '¡Clave de activación aplicada con éxito!', isError: false });
      setLicenseKeyInput('');
    } else {
      setLicenseMsg({ text: res.error || 'Clave de activación no válida.', isError: true });
    }
  };

  const handleExtendDuration = (days: number, type: 'MONTHLY' | 'ANNUAL') => {
    const now = new Date();
    const newExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newLicense: TenantLicense = {
      ...(formData.license || createDefaultTenantLicense(type)),
      billingType: type,
      expirationDate: newExp,
      status: 'ACTIVE',
      lastPaymentDate: now.toISOString().split('T')[0],
    };
    setFormData(prev => ({ ...prev, license: newLicense }));
    setLicenseMsg({
      text: `¡Licencia extendida por ${days === 365 ? '1 año' : '30 días'} con éxito!`,
      isError: false,
    });
  };

  const handleSimulateLock = () => {
    // Set expiration 10 days in past to trigger immediate hard lock
    const past = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiredLicense: TenantLicense = {
      ...(formData.license || createDefaultTenantLicense('MONTHLY')),
      expirationDate: past,
      status: 'EXPIRED_LOCKED',
    };
    const updated = { ...formData, license: expiredLicense };
    setFormData(updated);
    onSave(updated);
    alert('Simulación activada: La licencia se ha marcado como vencida. Al cerrar el panel verá la pantalla de bloqueo de renta.');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if (onSaveStaffUsers) {
      onSaveStaffUsers(staffList);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const CurrentLogoIcon = ICON_OPTIONS.find(i => i.id === formData.logoIcon)?.icon || Activity;
  const licenseCheck = checkLicenseStatus(formData.license);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Configuración Institucional & Licenciamiento</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  SOLO ADMIN
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Personalice los datos de la clínica, membretes oficiales, usuarios, seguridad y renta mensual/anual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="px-5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('BRANDING')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'BRANDING'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Nombre & Logo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CONTACT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'CONTACT'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Dirección & Contacto</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MEDICAL_DIRECTION')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'MEDICAL_DIRECTION'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Dirección Médica</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('USERS')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'USERS'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Usuarios & Claves</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                {staffList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SECURITY')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'SECURITY'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>🛡️ Seguridad & Nube</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LICENSE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'LICENSE'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>🔑 Renta & Licencia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PREVIEW'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vista Previa</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 text-xs px-2.5 py-1 rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer"
            title="Restablecer valores originales"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>

        {/* Tab Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-neutral-200">
          {/* TAB 1: BRANDING & LOGO */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Nombre Principal de la Clínica o Centro:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. IMAGIS, Centro Radiológico..."
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Se mostrará en la cabecera, portal del paciente e informes.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    Nombre Corto / Sistema (Badge):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shortName}
                    onChange={e => setFormData(prev => ({ ...prev, shortName: e.target.value }))}
                    placeholder="Ej. IMAGIS Radiología & PACS"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Eslogan o Subtítulo Institucional:
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Ej. Centro de Diagnóstico por Imágenes & Radiología Médica"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {/* Logo Management */}
              <div className="bg-neutral-950 p-4 sm:p-5 rounded-2xl border border-neutral-800 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Logotipo Oficial del Centro</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Suba el logo gráfico de su institución o elija un icono médico representativo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 text-center space-y-2">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-950 border border-neutral-700 flex items-center justify-center overflow-hidden shadow-inner p-2">
                      {formData.logoImage ? (
                        <img
                          src={formData.logoImage}
                          alt="Logo del Centro"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <CurrentLogoIcon className="w-10 h-10 text-cyan-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-300">
                      {formData.logoImage ? 'Logo personalizado cargado' : 'Icono institucional activo'}
                    </span>
                    {formData.logoImage && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomLogo}
                        className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Quitar imagen</span>
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-8 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Subir archivo de logotipo (PNG, JPG, SVG - máx 2MB):
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleImageUpload}
                        className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-cyan-400 hover:file:bg-neutral-700 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                        O seleccione un icono médico vectorial:
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {ICON_OPTIONS.map(opt => {
                          const IconComp = opt.icon;
                          const isSelected = !formData.logoImage && formData.logoIcon === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, logoIcon: opt.id, logoImage: undefined }));
                              }}
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-xs'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              <IconComp className="w-5 h-5" />
                              <span className="text-[9px] font-medium text-center leading-tight">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>Color de Acento del Sistema:</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {COLOR_OPTIONS.map(color => {
                    const isSelected = formData.accentColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, accentColor: color.id }))}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 border-white text-white shadow-sm'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${color.bgClass}`} />
                        <span>{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT */}
          {activeTab === 'CONTACT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dirección de la Sede Principal:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Ej. Av. Javier Prado Este 2840, San Borja"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ciudad y País:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ej. Lima, Perú"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Central Telefónica / Citas:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej. (01) 710-2000"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Teléfono Móvil / WhatsApp de Urgencias:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone}
                    onChange={e => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    placeholder="Ej. +51 987 654 321"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Correo Electrónico de Contacto:</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ej. contacto@imagis-radiologia.com"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sitio Web Oficial:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Ej. www.imagis-radiologia.com"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>RUC / Identificación Fiscal:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={e => setFormData(prev => ({ ...prev, ruc: e.target.value }))}
                    placeholder="Ej. 20608945123"
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEDICAL DIRECTION */}
          {activeTab === 'MEDICAL_DIRECTION' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Dirección Médica & Responsable de Radiología</span>
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Estos datos se incluyen en los informes médicos oficiales generados y exportados a PDF.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                      Nombre del Director Médico:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.directorName}
                      onChange={e => setFormData(prev => ({ ...prev, directorName: e.target.value }))}
                      placeholder="Ej. Dr. Alejandro Mendoza Valdivia"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                      Título y Registro Médico (C.M.P. / R.N.E.):
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.directorTitle}
                      onChange={e => setFormData(prev => ({ ...prev, directorTitle: e.target.value }))}
                      placeholder="Ej. Especialista en Radiología - R.N.E. 18452"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS & PASSWORDS MANAGEMENT */}
          {activeTab === 'USERS' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Control de Usuarios, Roles y Contraseñas</span>
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Modifique las contraseñas del Administrador o cree usuarios de tipo <strong>Encargado</strong> con acceso restringido.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Usuario</span>
                </button>
              </div>

              {/* Add New User Form */}
              {showAddUserForm && (
                <div className="bg-neutral-950 p-4 rounded-2xl border border-cyan-800/80 space-y-3 animate-fadeIn">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Registrar Nuevo Miembro del Personal</span>
                  </div>

                  {userFormError && (
                    <div className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] rounded-lg">
                      {userFormError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Nombre Completo:</label>
                      <input
                        type="text"
                        placeholder="Ej. Lic. Rosaura Flores"
                        value={newFullName}
                        onChange={e => setNewFullName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Nombre de Usuario (Login):</label>
                      <input
                        type="text"
                        placeholder="Ej. rflores"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Contraseña:</label>
                      <input
                        type="text"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Rol de Acceso:</label>
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value as 'ADMIN' | 'ENCARGADO')}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="ENCARGADO">🛡️ ENCARGADO (Sin botón de Configuración)</option>
                        <option value="ADMIN">👑 ADMINISTRADOR (Acceso Total)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Cargo / Especialidad:</label>
                      <input
                        type="text"
                        placeholder="Ej. Tecnólogo de Ultrasonido"
                        value={newPosition}
                        onChange={e => setNewPosition(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Correo Electrónico:</label>
                      <input
                        type="email"
                        placeholder="usuario@clinica.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(false)}
                      className="px-3 py-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewUser}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Guardar Nuevo Usuario
                    </button>
                  </div>
                </div>
              )}

              {/* Users List Table / Cards */}
              <div className="space-y-3">
                {staffList.map(user => {
                  const isPasswordVisible = !!showUserPasswords[user.id];
                  const isAdmin = user.role === 'ADMIN';

                  return (
                    <div
                      key={user.id}
                      className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              isAdmin
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{user.fullName}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  isAdmin
                                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                }`}
                              >
                                {user.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">{user.position}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg bg-neutral-900 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-300 border border-neutral-800 transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Credentials Inline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-900 text-xs">
                        <div>
                          <label className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                            Nombre de Usuario:
                          </label>
                          <input
                            type="text"
                            value={user.username}
                            onChange={e => handleUpdateUserField(user.id, 'username', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                            Contraseña de Acceso:
                          </label>
                          <div className="relative">
                            <input
                              type={isPasswordVisible ? 'text' : 'password'}
                              value={user.password || ''}
                              onChange={e => handleUpdateUserField(user.id, 'password', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-2.5 pr-8 py-1 text-xs text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleShowPassword(user.id)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                              title={isPasswordVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                              {isPasswordVisible ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-neutral-500 uppercase font-semibold block mb-1">
                            Permisos & Rol:
                          </label>
                          <select
                            value={user.role}
                            onChange={e =>
                              handleUpdateUserField(user.id, 'role', e.target.value as 'ADMIN' | 'ENCARGADO')
                            }
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white"
                          >
                            <option value="ADMIN">👑 ADMINISTRADOR (Acceso Total)</option>
                            <option value="ENCARGADO">🛡️ ENCARGADO (Sin Configuración)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & INTERNET CLOUD OPTIONS */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-5">
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Parámetros de Seguridad para Publicación en Internet</h4>
                    <p className="text-[11px] text-neutral-400">
                      Configure cómo interactúan los pacientes y la red externa con el servidor clínico.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div>
                      <span className="font-semibold text-white block">Ocultar Botones de Demostración en Portal de Pacientes</span>
                      <span className="text-[11px] text-neutral-400">
                        Exige obligatoriamente DNI y PIN real a los pacientes. Oculta accesos rápidos de prueba.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!formData.enableDemoMode}
                        onChange={e => setFormData(prev => ({ ...prev, enableDemoMode: !e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div>
                      <span className="font-semibold text-white block">Protección contra Ataques de Fuerza Bruta</span>
                      <span className="text-[11px] text-neutral-400">
                        Bloquea temporalmente el inicio de sesión por 30 segundos tras 5 intentos erróneos consecutivos.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableBruteForceProtection !== false}
                        onChange={e => setFormData(prev => ({ ...prev, enableBruteForceProtection: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div>
                      <span className="font-semibold text-white block">Cierre Automático de Sesión por Inactividad</span>
                      <span className="text-[11px] text-neutral-400">
                        Protección en consultorio si la pantalla queda desatendida.
                      </span>
                    </div>
                    <select
                      value={formData.sessionTimeoutMinutes || 30}
                      onChange={e => setFormData(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
                      className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white"
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos (Recomendado)</option>
                      <option value={60}>60 minutos</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Server Active Defenses Status */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Estado de Blindaje del Servidor en Producción</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cabeceras HTTP de Seguridad (Helmet)</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Protección contra sniffing MIME, clickjacking (X-Frame-Options SAMEORIGIN) y Cross-Site Scripting.
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Limitador de Tasa (Rate Limiting)</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Máx. 120 peticiones/min para APIs y máx. 30 peticiones/min para generación de informes IA (Gemini).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LICENSE & SUBSCRIPTION RENTAL MANAGEMENT */}
          {activeTab === 'LICENSE' && (
            <div className="space-y-5">
              {/* Current License Card */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        licenseCheck.isLocked
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : licenseCheck.isWarning
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">Licencia de Uso & Renta del Sistema</h4>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            licenseCheck.isLocked
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : licenseCheck.isWarning
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {licenseCheck.isLocked
                            ? 'BLOQUEADA / SUSPENDIDA'
                            : licenseCheck.isWarning
                            ? 'PRÓXIMA A VENCER'
                            : 'VIGENTE & ACTIVA'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Modalidad:{' '}
                        <strong>
                          {formData.license?.billingType === 'ANNUAL'
                            ? 'Renta Anual ($590 USD/año)'
                            : formData.license?.billingType === 'PERPETUAL'
                            ? 'Licencia Perpetua'
                            : 'Renta Mensual ($59 USD/mes)'}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* License Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Fecha de Vencimiento</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {formData.license?.expirationDate || 'No establecida'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Días Restantes</span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        licenseCheck.daysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {licenseCheck.daysRemaining > 0
                        ? `${licenseCheck.daysRemaining} días`
                        : `${licenseCheck.daysOverdue} días vencida`}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Periodo de Gracia</span>
                    <span className="text-xs font-bold text-neutral-300 font-mono">
                      {formData.license?.gracePeriodDays || 5} días
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 truncate">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Clave Actual</span>
                    <span className="text-[11px] font-bold text-cyan-300 font-mono truncate block">
                      {formData.license?.key || 'IMAGIS-MENS-2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewal Buttons */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Renovación Rápida de Periodo</span>
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Extienda la vigencia del servicio para esta sede.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExtendDuration(30, 'MONTHLY')}
                    className="p-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Renovar Renta Mensual</span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">$59 USD</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Suma 30 días de vigencia a partir de hoy.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExtendDuration(365, 'ANNUAL')}
                    className="p-3.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/80 rounded-xl text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Renovar Renta Anual (1 Año)</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">$590 USD</span>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Suma 365 días de vigencia (2 meses de ahorro).
                    </p>
                  </button>
                </div>
              </div>

              {/* Enter Activation Token */}
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Activar con Nueva Clave de Licencia</span>
                </h4>

                {licenseMsg && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      licenseMsg.isError
                        ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                        : 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                    }`}
                  >
                    {licenseMsg.isError ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span>{licenseMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={e => setLicenseKeyInput(e.target.value)}
                    placeholder="Ej. IMAGIS-ANUAL-2027-OK o DEMO-30-DAYS"
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLicenseKey}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Activar Clave
                  </button>
                </div>
              </div>

              {/* Simulation Sandbox for User Testing */}
              <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-900/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Herramienta de Prueba: Simulación de Bloqueo por Falta de Pago</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Permite simular qué ve el médico cuando la renta mensual vence sin haber realizado el pago.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateLock}
                    className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    🔴 Simular Vencimiento Inmediato (Ver Pantalla de Bloqueo)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PREVIEW */}
          {activeTab === 'PREVIEW' && (
            <div className="space-y-5">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Vista Previa en Barra Superior (Navbar):
                </span>
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-700 flex items-center justify-center p-1.5 overflow-hidden">
                      {formData.logoImage ? (
                        <img src={formData.logoImage} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <CurrentLogoIcon className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{formData.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                          v2.6
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">{formData.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-neutral-400">
                    <div>{formData.phone}</div>
                    <div className="text-[10px] text-neutral-500">{formData.address}</div>
                  </div>
                </div>
              </div>

              {/* PDF Report Header Preview */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Vista Previa en Membrete de Informe Médico Radiológico:
                </span>
                <div className="p-4 bg-white text-neutral-900 rounded-xl shadow-lg border border-neutral-300 space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-neutral-300 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-300 flex items-center justify-center p-1 overflow-hidden">
                        {formData.logoImage ? (
                          <img src={formData.logoImage} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <CurrentLogoIcon className="w-6 h-6 text-cyan-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-neutral-900">{formData.name}</h4>
                        <p className="text-[10px] text-neutral-600 font-medium">{formData.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-neutral-600">
                      <div><strong>RUC:</strong> {formData.ruc}</div>
                      <div>{formData.address} - {formData.city}</div>
                      <div>Central: {formData.phone} | {formData.email}</div>
                    </div>
                  </div>

                  <div className="text-center py-1">
                    <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      INFORME RADIOLÓGICO DEPARTAMENTAL
                    </span>
                  </div>

                  <div className="border-t border-neutral-200 pt-2 flex justify-between text-[9px] text-neutral-500">
                    <span>{formData.directorName} - {formData.directorTitle}</span>
                    <span>{formData.website}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={savedSuccess}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Configuración Guardada!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Aplicar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
