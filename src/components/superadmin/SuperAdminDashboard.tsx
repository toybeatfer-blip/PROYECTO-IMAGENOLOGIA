import React, { useState, useEffect, useMemo } from 'react';
import {
  ClinicAccount,
  SuperAdminContactInfo,
  StaffUser,
  LicenseEvaluation,
} from '../../types';
import {
  getStoredClinics,
  saveStoredClinics,
  calculateLicenseDays,
  toggleClinicSuspension,
  renewClinicLicense,
  updateClinic,
  deleteClinicPermanently,
  getSuperAdminContact,
  saveSuperAdminContact,
  getClinicPatients,
  deepRecoveryScanner,
} from '../../utils/clinicDatabase';
import {
  syncWithCloud,
  triggerCloudPush,
  getCloudSyncStatus,
  startCloudSyncPolling,
  CloudSyncStatus,
} from '../../utils/cloudSync';
import { ClinicRegisterModal } from '../auth/ClinicRegisterModal';
import {
  Crown,
  Building2,
  Key,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Users,
  Eye,
  Plus,
  Lock,
  Sparkles,
  Search,
  RefreshCw,
  LogOut,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  MapPin,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Download,
  Upload,
  UserCheck,
  Stethoscope,
  Copy,
  Check,
  Play,
  Pause,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  currentUser: StaffUser;
  onSelectClinicToImpersonate: (clinicId: string) => void;
  onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  currentUser,
  onSelectClinicToImpersonate,
  onLogout,
}) => {
  const [clinics, setClinics] = useState<ClinicAccount[]>(() => getStoredClinics());
  const [superAdminContact, setSuperAdminContactState] = useState<SuperAdminContactInfo>(() => getSuperAdminContact());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => getCloudSyncStatus());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'>('ALL');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<ClinicAccount | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  // Edit Contact Form State
  const [contactName, setContactName] = useState(superAdminContact.name);
  const [contactPhone, setContactPhone] = useState(superAdminContact.phone);
  const [contactEmail, setContactEmail] = useState(superAdminContact.email);
  const [contactHelpMessage, setContactHelpMessage] = useState(superAdminContact.helpMessage);

  // Background Cloud Sync & Event Listeners (1-minute cycle)
  useEffect(() => {
    const stopPolling = startCloudSyncPolling(60);

    const handleClinicsUpdated = (e: any) => {
      if (e.detail) setClinics(e.detail);
    };

    const handleContactUpdated = (e: any) => {
      if (e.detail) {
        setSuperAdminContactState(e.detail);
      }
    };

    const handleCloudStatusUpdated = (e: any) => {
      if (e.detail) setCloudStatus(e.detail);
    };

    window.addEventListener('clinics-updated', handleClinicsUpdated);
    window.addEventListener('superadmin-contact-updated', handleContactUpdated);
    window.addEventListener('cloud-sync-status', handleCloudStatusUpdated);

    return () => {
      stopPolling();
      window.removeEventListener('clinics-updated', handleClinicsUpdated);
      window.removeEventListener('superadmin-contact-updated', handleContactUpdated);
      window.removeEventListener('cloud-sync-status', handleCloudStatusUpdated);
    };
  }, []);

  const showNotification = (text: string, isError = false) => {
    setNotificationMsg({ text, isError });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleCopy = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(idKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (clinicId: string) => {
    setShowPasswords(prev => ({ ...prev, [clinicId]: !prev[clinicId] }));
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let expired = 0;
    let totalPatients = 0;

    for (const c of clinics) {
      const evalInfo = calculateLicenseDays(c.licenseValidUntil, c.licenseStatus);
      if (evalInfo.isSuspended) suspended++;
      else if (evalInfo.isExpired) expired++;
      else active++;

      // Count patient records inside this clinic's database
      const patients = getClinicPatients(c.id);
      totalPatients += patients.length;
    }

    return {
      totalClinics: clinics.length,
      activeClinics: active,
      inactiveClinics: suspended + expired,
      totalPatients,
    };
  }, [clinics]);

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter(c => {
      const evalInfo = calculateLicenseDays(c.licenseValidUntil, c.licenseStatus);

      if (filterStatus === 'ACTIVE' && (evalInfo.isExpired || evalInfo.isSuspended)) return false;
      if (filterStatus === 'SUSPENDED' && !evalInfo.isSuspended) return false;
      if (filterStatus === 'EXPIRED' && (!evalInfo.isExpired || evalInfo.isSuspended)) return false;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      return (
        c.clinicName.toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q) ||
        c.doctorName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.generalLicense && c.generalLicense.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    });
  }, [clinics, searchTerm, filterStatus]);

  // ==========================================
  // QUICK ACTIONS
  // ==========================================
  const handleToggleSuspension = (clinicId: string) => {
    const updated = toggleClinicSuspension(clinicId);
    if (updated) {
      triggerCloudPush();
      showNotification(
        `Consultorio "${updated.clinicName}" ${updated.licenseStatus === 'suspended' ? 'suspendido' : 'reactivado'} con éxito.`
      );
    }
  };

  const handleRenewLicense = (clinicId: string) => {
    const updated = renewClinicLicense(clinicId, 1);
    if (updated) {
      triggerCloudPush();
      showNotification(
        `Licencia renovada +1 Mes (30 días) para "${updated.clinicName}". Nueva vigencia: ${updated.licenseValidUntil}`
      );
    }
  };

  const handleDeleteClinic = (clinicId: string) => {
    const toDelete = clinics.find(c => c.id === clinicId);
    const success = deleteClinicPermanently(clinicId);
    if (success) {
      triggerCloudPush();
      setShowDeleteConfirmId(null);
      showNotification(`Consultorio "${toDelete?.clinicName || clinicId}" eliminado definitivamente.`);
    }
  };

  const handleSaveEditedClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic) return;

    const updated = updateClinic(editingClinic.id, {
      clinicName: editingClinic.clinicName,
      branch: editingClinic.branch,
      doctorPrefix: editingClinic.doctorPrefix,
      doctorName: editingClinic.doctorName,
      generalLicense: editingClinic.generalLicense,
      specialtyLicense: editingClinic.specialtyLicense,
      medicalSpecialty: editingClinic.medicalSpecialty,
      university: editingClinic.university,
      username: editingClinic.username,
      password: editingClinic.password,
      phone: editingClinic.phone,
      email: editingClinic.email,
      address: editingClinic.address,
      licenseValidUntil: editingClinic.licenseValidUntil,
      licenseStatus: editingClinic.licenseStatus,
    });

    if (updated) {
      triggerCloudPush();
      setEditingClinic(null);
      showNotification(`Consultorio "${updated.clinicName}" actualizado exitosamente.`);
    }
  };

  const handleSaveSuperAdminContact = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedContact: SuperAdminContactInfo = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      helpMessage: contactHelpMessage.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveSuperAdminContact(updatedContact);
    triggerCloudPush();
    setShowContactModal(false);
    showNotification('Datos de contacto del Administrador actualizados y sincronizados.');
  };

  const handleRunDeepRecovery = () => {
    const result = deepRecoveryScanner();
    triggerCloudPush();
    if (result.recoveredCount > 0) {
      showNotification(`¡Recuperación exitosa! Se encontraron y rescataron ${result.recoveredCount} consultorios previos.`);
    } else {
      showNotification('Escáner completado. Todas las bases de datos ya se encuentran en el registro maestro.');
    }
  };

  // Export / Import Master Backup
  const handleExportBackup = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      superAdminContact,
      clinics,
      system: 'IMAGIS SaaS Master Backup v3.0',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IMAGIS_RESPALDO_MAESTRO_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Respaldo maestro JSON exportado correctamente.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.clinics && Array.isArray(parsed.clinics)) {
          saveStoredClinics(parsed.clinics);
          if (parsed.superAdminContact) {
            saveSuperAdminContact(parsed.superAdminContact);
          }
          triggerCloudPush();
          showNotification(`Respaldo importado con éxito: ${parsed.clinics.length} consultorios cargados.`);
        } else {
          showNotification('Formato de archivo inválido.', true);
        }
      } catch (err) {
        showNotification('Error al leer el archivo de respaldo.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 border-b border-amber-500/30 backdrop-blur-md px-6 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 font-extrabold shadow-lg shadow-amber-950/40">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">Panel de Super Administrador</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/80">
                  Fernando01 (Maestro)
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gestión Central de Consultorios, Licencias Mensuales de 1 Mes y Sincronización en la Nube
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Cloud Sync Status Indicator */}
            <div
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold min-w-[145px] transition-all ${
                cloudStatus.isConnected
                  ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}
              title={cloudStatus.error || 'Bóveda central en la nube activa'}
            >
              {cloudStatus.isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Sincronizando...</span>
                </>
              ) : cloudStatus.isConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nube Conectada</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sin Nube</span>
                </>
              )}
            </div>

            {/* Sync Now Button */}
            <button
              onClick={() => syncWithCloud().then(() => showNotification('Sincronización con la nube completada.'))}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
              title="Forzar Sincronización Inmediata con la Nube"
            >
              <RefreshCw className={`w-4 h-4 ${cloudStatus.isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Visible Red Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/50 transition-all cursor-pointer"
              title="Cerrar Sesión Maestra y Salir"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Toast Notification */}
        {notificationMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-4 duration-150 ${
              notificationMsg.isError
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : 'bg-emerald-950 border-emerald-700 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notificationMsg.isError ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span>{notificationMsg.text}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. KPIs Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              Consultorios Totales
            </span>
            <div className="text-2xl font-extrabold text-white font-mono">{metrics.totalClinics}</div>
            <p className="text-[10px] text-neutral-500">Espacios multi-tenant registrados</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md space-y-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Licencias Activas
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{metrics.activeClinics}</div>
            <p className="text-[10px] text-neutral-500">Con vigencia de 30 días vigente</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Suspendidas / Vencidas
            </span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">{metrics.inactiveClinics}</div>
            <p className="text-[10px] text-neutral-500">Requieren renovación mensual</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md space-y-1">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Expedientes Totales
            </span>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono">{metrics.totalPatients}</div>
            <p className="text-[10px] text-neutral-500">Pacientes acumulados en el sistema</p>
          </div>
        </div>

        {/* 2. Global Actions Toolbar */}
        <div className="bg-neutral-900/90 border border-neutral-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Consultorio</span>
            </button>

            <button
              onClick={handleRunDeepRecovery}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Escanea el almacenamiento local en busca de datos o consultorios huérfanos"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>🗄️ Recuperar Previos</span>
            </button>

            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Editar nombre, WhatsApp, correo y mensaje de Fernando para los modales de renovación"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Mis Datos de Contacto</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="Descargar respaldo maestro en JSON"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Exportar JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-xl text-xs font-medium transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span>Importar JSON</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* 3. Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por clínica, médico, usuario, cédula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos ({clinics.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Activos ({metrics.activeClinics})
            </button>
            <button
              onClick={() => setFilterStatus('SUSPENDED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'SUSPENDED' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Suspendidos
            </button>
            <button
              onClick={() => setFilterStatus('EXPIRED')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'EXPIRED' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vencidos
            </button>
          </div>
        </div>

        {/* 4. Master Table of Clinics */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Consultorio / Sede</th>
                  <th className="py-3 px-4">Médico Titular & Cédula</th>
                  <th className="py-3 px-4">Usuario & Contraseña</th>
                  <th className="py-3 px-4">Estado de Licencia</th>
                  <th className="py-3 px-4">Vigencia (1 Mes)</th>
                  <th className="py-3 px-4 text-center">Pacientes</th>
                  <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No se encontraron consultorios con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map(clinic => {
                    const evalInfo = calculateLicenseDays(clinic.licenseValidUntil, clinic.licenseStatus);
                    const patientsCount = getClinicPatients(clinic.id).length;
                    const isPassVisible = !!showPasswords[clinic.id];

                    return (
                      <tr key={clinic.id} className="hover:bg-neutral-800/40 transition-colors">
                        {/* 1. Clinic Name & Branch */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{clinic.clinicName}</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                            <span className="text-cyan-400 font-medium">{clinic.branch}</span>
                            <span>• {clinic.phone || 'Sin tel'}</span>
                          </div>
                        </td>

                        {/* 2. Doctor & License */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-neutral-200">
                            {clinic.doctorPrefix} {clinic.doctorName}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Céd. Gral: <strong className="text-neutral-300">{clinic.generalLicense || 'N/A'}</strong>
                            {clinic.specialtyLicense && ` • Esp: ${clinic.specialtyLicense}`}
                          </div>
                        </td>

                        {/* 3. Username & Password */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <span>{clinic.username}</span>
                            <button
                              onClick={() => handleCopy(clinic.username, `u-${clinic.id}`)}
                              className="text-neutral-500 hover:text-white"
                              title="Copiar usuario"
                            >
                              {copiedKey === `u-${clinic.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400 text-[11px] mt-0.5">
                            <span>Pass: <strong>{isPassVisible ? clinic.password : '••••••••'}</strong></span>
                            <button
                              onClick={() => togglePasswordVisibility(clinic.id)}
                              className="text-neutral-500 hover:text-white cursor-pointer"
                              title={isPassVisible ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 4. License Status Badge */}
                        <td className="py-3.5 px-4">
                          {evalInfo.isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              <ShieldAlert className="w-3 h-3" />
                              <span>SUSPENDIDA</span>
                            </span>
                          ) : evalInfo.isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>VENCIDA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <ShieldCheck className="w-3 h-3" />
                              <span>ACTIVA</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Remaining Days / Expiry Date */}
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="text-white font-bold">{evalInfo.label}</div>
                          <div className="text-[10px] text-neutral-500">Hasta: {clinic.licenseValidUntil}</div>
                        </td>

                        {/* 6. Patients Count */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-cyan-300 font-bold">
                            {patientsCount}
                          </span>
                        </td>

                        {/* 7. Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Suspender / Reactivar */}
                            <button
                              onClick={() => handleToggleSuspension(clinic.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                evalInfo.isSuspended
                                  ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                                  : 'bg-rose-950 hover:bg-rose-900 border-rose-800 text-rose-300'
                              }`}
                              title={evalInfo.isSuspended ? 'Reactivar acceso' : 'Suspender acceso inmediatamente'}
                            >
                              {evalInfo.isSuspended ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                            </button>

                            {/* Renovar +1 Mes */}
                            <button
                              onClick={() => handleRenewLicense(clinic.id)}
                              className="p-1.5 bg-neutral-800 hover:bg-cyan-950 border border-neutral-700 hover:border-cyan-600 text-cyan-300 rounded-lg transition-colors cursor-pointer"
                              title="Renovar Licencia (+1 Mes / +30 días)"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => setEditingClinic({ ...clinic })}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-amber-300 rounded-lg transition-colors cursor-pointer"
                              title="Editar datos del consultorio y médico"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Entrar / Impersonar */}
                            <button
                              onClick={() => onSelectClinicToImpersonate(clinic.id)}
                              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                              title="Entrar a la consola de este consultorio"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar Definitivo */}
                            <button
                              onClick={() => setShowDeleteConfirmId(clinic.id)}
                              className="p-1.5 bg-neutral-800 hover:bg-rose-900 border border-neutral-700 hover:border-rose-700 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar consultorio permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}

      {/* 1. Register New Clinic Modal */}
      {showCreateModal && (
        <ClinicRegisterModal
          onSuccess={created => {
            setShowCreateModal(false);
            showNotification(`Consultorio "${created.clinicName}" registrado exitosamente con 30 días de licencia.`);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* 2. Edit Clinic Modal */}
      {editingClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Editar Consultorio / Clínica</h3>
              </div>
              <button onClick={() => setEditingClinic(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedClinic} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Nombre de la Clínica:</label>
                  <input
                    type="text"
                    required
                    value={editingClinic.clinicName}
                    onChange={e => setEditingClinic({ ...editingClinic, clinicName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Sucursal / Ciudad:</label>
                  <input
                    type="text"
                    value={editingClinic.branch}
                    onChange={e => setEditingClinic({ ...editingClinic, branch: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Prefijo:</label>
                  <select
                    value={editingClinic.doctorPrefix}
                    onChange={e => setEditingClinic({ ...editingClinic, doctorPrefix: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Dr.">Dr.</option>
                    <option value="Dra.">Dra.</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Médico Titular:</label>
                  <input
                    type="text"
                    required
                    value={editingClinic.doctorName}
                    onChange={e => setEditingClinic({ ...editingClinic, doctorName: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Cédula General:</label>
                  <input
                    type="text"
                    value={editingClinic.generalLicense}
                    onChange={e => setEditingClinic({ ...editingClinic, generalLicense: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Cédula Especialidad:</label>
                  <input
                    type="text"
                    value={editingClinic.specialtyLicense}
                    onChange={e => setEditingClinic({ ...editingClinic, specialtyLicense: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Usuario de Acceso:</label>
                  <input
                    type="text"
                    required
                    value={editingClinic.username}
                    onChange={e => setEditingClinic({ ...editingClinic, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Contraseña:</label>
                  <input
                    type="text"
                    required
                    value={editingClinic.password}
                    onChange={e => setEditingClinic({ ...editingClinic, password: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Fecha Vencimiento Licencia:</label>
                  <input
                    type="date"
                    required
                    value={editingClinic.licenseValidUntil}
                    onChange={e => setEditingClinic({ ...editingClinic, licenseValidUntil: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Estado de Licencia:</label>
                  <select
                    value={editingClinic.licenseStatus}
                    onChange={e => setEditingClinic({ ...editingClinic, licenseStatus: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="active">Activa (Acceso Permitido)</option>
                    <option value="suspended">Suspendida (Bloqueo Manual)</option>
                    <option value="expired">Vencida</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingClinic(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold rounded-xl shadow-md"
                >
                  Guardar Modificaciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SuperAdmin Contact Edit Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Mis Datos de Contacto (Fernando)</h3>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSuperAdminContact} className="p-5 space-y-3.5 text-xs">
              <p className="text-[11px] text-neutral-400">
                Estos datos aparecen en los modales de bloqueo para que las clínicas vencidas te contacten directamente por WhatsApp o correo.
              </p>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Nombre para Mostrar:</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Teléfono / WhatsApp (con código de país):</label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="Ej. +52 1 55 1234 5678"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300 block mb-1">Mensaje de Ayuda Predeterminado:</label>
                <textarea
                  rows={2}
                  value={contactHelpMessage}
                  onChange={e => setContactHelpMessage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-md"
                >
                  Guardar & Sincronizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      {showDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
          <div className="bg-neutral-900 border border-rose-600/50 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">¿Eliminar Consultorio Definitivamente?</h4>
              <p className="text-xs text-neutral-400">
                Esta acción eliminará la base de datos local y registrará una marca de borrado permanente (Tombstone) en la nube.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmId(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClinic(showDeleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/40"
              >
                Sí, Eliminar Definitivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
