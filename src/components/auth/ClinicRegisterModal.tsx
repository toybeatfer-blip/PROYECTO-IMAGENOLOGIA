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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-2xl text-cyan-700">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Registro de Nuevo Consultorio / Clínica
              </h3>
              <p className="text-xs text-slate-500">
                Alta de espacio multi-tenant con licencia de 1 mes (30 días) y base en blanco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {registeredClinic ? (
            /* Success View */
            <div className="space-y-5 py-4 text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">¡Consultorio Registrado con Éxito!</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Su base de datos privada ha sido inicializada 100% en blanco y sincronizada en la nube.
                </p>
              </div>

              {/* Summary Card */}
              <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-cyan-300 text-left space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans font-semibold">Clínica / Sede:</span>
                  <strong className="text-slate-900">{registeredClinic.clinicName} ({registeredClinic.branch})</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-semibold">Médico Titular:</span>
                  <span className="text-slate-800 font-bold">{registeredClinic.doctorPrefix} {registeredClinic.doctorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-semibold">Usuario de Acceso:</span>
                  <strong className="text-cyan-800">{registeredClinic.username}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans font-semibold">Contraseña:</span>
                  <strong className="text-emerald-800">{registeredClinic.password}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-sans font-semibold">Vigencia de Licencia:</span>
                  <span className="text-amber-800 font-bold">1 Mes (30 días hasta {registeredClinic.licenseValidUntil})</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartUsing}
                  className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
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
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* 1. Clinic Identification */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  1. Datos del Consultorio / Clínica
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre de la Clínica / Gabinete: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Centro Radiológico Santa María"
                      value={clinicName}
                      onChange={e => setClinicName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Sucursal / Ciudad:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Matriz / Sucursal Norte"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Dirección Física:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Hidalgo 1450, Col. Centro"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>
              </div>

              {/* 2. Doctor In Charge */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  2. Médico Titular Responsable
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Prefijo:
                    </label>
                    <select
                      value={doctorPrefix}
                      onChange={e => setDoctorPrefix(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 cursor-pointer font-bold"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Dra.">Dra.</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre Completo del Médico: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Alejandro Mendoza Valdivia"
                      value={doctorName}
                      onChange={e => setDoctorName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cédula Profesional General: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 10445588"
                      value={generalLicense}
                      onChange={e => setGeneralLicense(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cédula de Especialidad (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. ESP-992314"
                      value={specialtyLicense}
                      onChange={e => setSpecialtyLicense(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Especialidad Médica:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Radiología e Imagenología"
                      value={medicalSpecialty}
                      onChange={e => setMedicalSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Universidad / Escuela de Egreso:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Universidad Nacional Autónoma"
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Credentials & Contact */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  3. Credenciales de Acceso & Contacto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Usuario de Acceso Único: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. dr_mendoza o clinica_norte"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Contraseña: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. pass123"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Teléfono / WhatsApp: *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. +52 1 55 9876 5432"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Correo Electrónico:
                    </label>
                    <input
                      type="email"
                      placeholder="Ej. contacto@clinica.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                    />
                  </div>
                </div>
              </div>

              {/* License Terms Note */}
              <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-2xl text-[11px] text-cyan-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-700 shrink-0" />
                <span>
                  <strong className="font-bold">Licencia Mensual de 1 Mes:</strong> Su cuenta se creará con 30 días de vigencia activa y base de datos aislada en blanco.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 -mx-6 -mb-6 border-t border-slate-200 flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
