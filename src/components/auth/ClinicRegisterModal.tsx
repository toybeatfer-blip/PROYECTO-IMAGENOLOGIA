import React, { useState } from 'react';
import { ClinicAccount } from '../../types';
import { registerNewClinic } from '../../utils/clinicDatabase';
import { triggerCloudPush } from '../../utils/cloudSync';
import {
  Building2,
  Stethoscope,
  User,
  Lock,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ClinicRegisterModalProps {
  onSuccess: (createdClinic: ClinicAccount) => void;
  onClose: () => void;
}

export const ClinicRegisterModal: React.FC<ClinicRegisterModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [clinicName, setClinicName] = useState('');
  const [branch, setBranch] = useState('Sede Principal');
  const [doctorPrefix, setDoctorPrefix] = useState<'Dr.' | 'Dra.'>('Dr.');
  const [doctorName, setDoctorName] = useState('');
  const [generalLicense, setGeneralLicense] = useState('');
  const [specialtyLicense, setSpecialtyLicense] = useState('');
  const [medicalSpecialty, setMedicalSpecialty] = useState('Radiología e Imagenología Médica');
  const [university, setUniversity] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('admin123');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredClinic, setRegisteredClinic] = useState<ClinicAccount | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clinicName.trim()) {
      setErrorMessage('Por favor ingrese el nombre del consultorio o clínica.');
      return;
    }
    if (!doctorName.trim()) {
      setErrorMessage('Por favor ingrese el nombre del médico titular responsable.');
      return;
    }
    if (!generalLicense.trim()) {
      setErrorMessage('Por favor ingrese el número de cédula profesional.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Por favor elija un nombre de usuario de acceso.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Por favor ingrese una contraseña.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Por favor ingrese un teléfono o WhatsApp de contacto.');
      return;
    }

    setIsSubmitting(true);

    const result = registerNewClinic({
      clinicName,
      branch,
      doctorName,
      doctorPrefix,
      generalLicense,
      specialtyLicense,
      medicalSpecialty,
      university,
      username,
      password,
      phone,
      email,
      address,
    });

    setIsSubmitting(false);

    if (!result.success || !result.clinic) {
      setErrorMessage(result.error || 'Error al registrar consultorio.');
      return;
    }

    // Push to central cloud immediately
    triggerCloudPush();
    setRegisteredClinic(result.clinic);
  };

  const handleStartUsing = () => {
    if (registeredClinic) {
      onSuccess(registeredClinic);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-cyan-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Registro de Nuevo Consultorio / Clínica
              </h3>
              <p className="text-xs text-neutral-400">
                Alta de espacio multi-tenant con licencia de 1 mes (30 días) y base en blanco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-200">
          {registeredClinic ? (
            /* Success View */
            <div className="space-y-5 py-4 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">¡Consultorio Registrado con Éxito!</h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Su base de datos privada ha sido inicializada 100% en blanco y sincronizada en la nube.
                </p>
              </div>

              {/* Summary Card */}
              <div className="max-w-md mx-auto bg-neutral-950 p-4 rounded-2xl border border-cyan-500/30 text-left space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-neutral-400">Clínica / Sede:</span>
                  <strong className="text-white">{registeredClinic.clinicName} ({registeredClinic.branch})</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Médico Titular:</span>
                  <span className="text-neutral-200">{registeredClinic.doctorPrefix} {registeredClinic.doctorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Usuario de Acceso:</span>
                  <strong className="text-cyan-400">{registeredClinic.username}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Contraseña:</span>
                  <strong className="text-emerald-400">{registeredClinic.password}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-900 pt-2">
                  <span className="text-neutral-400">Vigencia de Licencia:</span>
                  <span className="text-amber-300 font-bold">1 Mes (30 días hasta {registeredClinic.licenseValidUntil})</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartUsing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Ingresar al Consultorio Ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* 1. Clinic Identification */}
              <div className="space-y-3 p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Datos del Consultorio / Clínica
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Nombre de la Clínica / Gabinete: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Centro Radiológico Santa María"
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Sucursal / Ciudad:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Matriz / Sucursal Norte"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                    Dirección Física:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Hidalgo 1450, Col. Centro"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* 2. Doctor In Charge */}
              <div className="space-y-3 p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  2. Médico Titular Responsable
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Prefijo:
                    </label>
                    <select
                      value={doctorPrefix}
                      onChange={e => setDoctorPrefix(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Dra.">Dra.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Nombre Completo del Médico: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Alejandro Mendoza Valdivia"
                      value={doctorName}
                      onChange={e => setDoctorName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Cédula Profesional General: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 10445588"
                      value={generalLicense}
                      onChange={e => setGeneralLicense(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Cédula de Especialidad (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. ESP-992314"
                      value={specialtyLicense}
                      onChange={e => setSpecialtyLicense(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Especialidad Médica:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Radiología e Imagenología"
                      value={medicalSpecialty}
                      onChange={e => setMedicalSpecialty(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Universidad / Escuela de Egreso:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Universidad Nacional Autónoma"
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Credentials & Contact */}
              <div className="space-y-3 p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  3. Credenciales de Acceso & Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Usuario de Acceso Único: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. dr_mendoza o clinica_norte"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Contraseña: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. pass123"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Teléfono / WhatsApp: *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. +52 1 55 9876 5432"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      placeholder="Ej. contacto@clinica.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* License Terms Note */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-[11px] text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Licencia Mensual de 1 Mes:</strong> Su cuenta se creará con 30 días de vigencia activa y base de datos aislada en blanco.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-neutral-950 -mx-6 -mb-6 border-t border-neutral-800 flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registrando...' : 'Completar Registro (1 Mes Gratis)'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
