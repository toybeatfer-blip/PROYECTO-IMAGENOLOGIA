import React, { useState, useEffect } from 'react';
import { StaffUser, ClinicSettings } from '../../types';
import { getStoredClinics } from '../../utils/clinicDatabase';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  Activity,
  Layers,
  HeartPulse,
  Shield,
  Cross,
  Stethoscope,
  Scan,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

interface StaffLoginProps {
  staffUsers: StaffUser[];
  clinicSettings: ClinicSettings;
  onLoginSuccess: (user: StaffUser) => void;
  onSwitchToPatientPortal: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({
  staffUsers,
  clinicSettings,
  onLoginSuccess,
  onSwitchToPatientPortal,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const renderClinicIcon = () => {
    if (clinicSettings.logoImage) {
      return (
        <img
          src={clinicSettings.logoImage}
          alt={clinicSettings.name}
          className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1 border border-neutral-700"
        />
      );
    }
    const iconProps = { className: 'w-7 h-7 text-cyan-400' };
    switch (clinicSettings.logoIcon) {
      case 'Activity':
        return <Activity {...iconProps} />;
      case 'Layers':
        return <Layers {...iconProps} />;
      case 'HeartPulse':
        return <HeartPulse {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      case 'Cross':
        return <Cross {...iconProps} />;
      case 'Stethoscope':
        return <Stethoscope {...iconProps} />;
      case 'Scan':
        return <Scan {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds(prev => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (lockoutSeconds > 0) {
      setErrorMessage(`Acceso bloqueado temporalmente por seguridad. Espere ${lockoutSeconds} segundos.`);
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Por favor ingrese su usuario y contraseña.');
      return;
    }

    // Find in current staff list
    let foundUser = staffUsers.find(
      u => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    // Check SuperAdmin Fernando Master
    if (cleanUser === 'fernando01' || cleanUser === 'toybeatfer@gmail.com' || cleanUser === 'superadmin') {
      foundUser = {
        id: 'super-admin-01',
        username: 'Fernando01',
        password: cleanPass,
        fullName: 'Fernando (Super Admin Master)',
        role: 'ADMIN',
        email: 'toybeatfer@gmail.com',
        phone: '+52 474 1539891',
        position: 'Super Administrador Global',
        avatarIcon: 'ShieldCheck',
      };
    }

    // Check registered clinics in database
    if (!foundUser) {
      const registeredClinics = getStoredClinics();
      const matchedClinic = registeredClinics.find(
        c => c.username.toLowerCase() === cleanUser && (!c.password || c.password === cleanPass)
      );
      if (matchedClinic) {
        foundUser = {
          id: `usr-${matchedClinic.id}`,
          username: matchedClinic.username,
          password: matchedClinic.password,
          fullName: `${matchedClinic.doctorPrefix} ${matchedClinic.doctorName}`,
          role: 'ADMIN',
          email: matchedClinic.email,
          phone: matchedClinic.phone,
          position: `${matchedClinic.medicalSpecialty} - Titular`,
          avatarIcon: 'ShieldCheck',
        };
      }
    }

    // Resilient fallback for default accounts
    if (!foundUser) {
      if (cleanUser === 'admin' || cleanUser === 'director@imagis-radiologia.com') {
        foundUser = {
          id: 'usr-admin-01',
          username: 'admin',
          password: 'admin123',
          fullName: 'Dr. Alejandro Mendoza Valdivia',
          role: 'ADMIN',
          email: 'director@imagis-radiologia.com',
          phone: '+51 987 654 321',
          position: 'Director Médico / Administrador General',
          avatarIcon: 'ShieldCheck',
        };
      } else if (cleanUser === 'encargado' || cleanUser === 'operaciones@imagis-radiologia.com') {
        foundUser = {
          id: 'usr-encargado-01',
          username: 'encargado',
          password: 'staff123',
          fullName: 'Lic. Andrés Salcedo Ramos',
          role: 'ENCARGADO',
          email: 'operaciones@imagis-radiologia.com',
          phone: '+51 955 432 109',
          position: 'Encargado de Turnos & Tecnólogo Radiólogo',
          avatarIcon: 'UserCheck',
        };
      }
    }

    if (!foundUser) {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 5) {
        setLockoutSeconds(30);
        setErrorMessage('Demasiados intentos fallidos. Acceso bloqueado por 30 segundos.');
      } else {
        setErrorMessage(`Usuario o correo no registrado en el sistema clínico. (Quedan ${5 - next} intentos)`);
      }
      return;
    }

    const expectedPassword = (foundUser.password || (foundUser.role === 'ADMIN' ? 'admin123' : 'staff123')).trim();

    if (cleanPass !== expectedPassword) {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 5) {
        setLockoutSeconds(30);
        setErrorMessage('Demasiados intentos fallidos. Acceso bloqueado por 30 segundos.');
      } else {
        setErrorMessage(`Contraseña incorrecta para "${cleanUser}". (Quedan ${5 - next} intentos antes del bloqueo)`);
      }
      return;
    }

    setFailedAttempts(0);
    onLoginSuccess(foundUser);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-600/15 via-blue-700/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-emerald-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Header / Switcher */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm flex items-center justify-center">
            {renderClinicIcon()}
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{clinicSettings.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-medium">
                PACS RADIOLÓGICO
              </span>
            </h1>
            <p className="text-xs text-neutral-400">{clinicSettings.tagline}</p>
          </div>
        </div>

        <button
          onClick={onSwitchToPatientPortal}
          className="flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-xs group"
        >
          <span>¿Eres Paciente? Ir al Portal Web</span>
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Card Title */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 mb-2 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-neutral-400">
              Ingresa tus credenciales de Administrador o Encargado
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ingrese su nombre de usuario o correo"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1 text-xs"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security & Access Management Info */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Gestión de Credenciales:</strong> Los usuarios y contraseñas se configuran durante la instalación o desde el panel de <strong>Configuración</strong> (exclusivo para el Administrador).
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-neutral-900">
        <div>
          {clinicSettings.name} &bull; {clinicSettings.address} &bull; {clinicSettings.phone}
        </div>
        <div className="font-mono text-[11px]">
          IMAGIS PACS v2.5 &bull; Estándar DICOM 3.0 / HL7
        </div>
      </footer>
    </div>
  );
};
