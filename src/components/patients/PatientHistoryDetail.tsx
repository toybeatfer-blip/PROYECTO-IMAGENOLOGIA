import { Patient, MedicalStudy, Appointment, ClinicSettings } from '../../types';
import {
  User,
  ArrowLeft,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Eye,
  FileText,
  Clock,
  Plus,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Activity,
  AlertTriangle,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { openStudyInStandaloneWindow } from '../../utils/windowSync';
import { ShareStudyModal } from '../studies/ShareStudyModal';

interface PatientHistoryDetailProps {
  patient: Patient;
  studies: MedicalStudy[];
  appointments: Appointment[];
  clinicSettings?: ClinicSettings;
  onBack: () => void;
  onOpenViewerWithStudy: (studyId: string) => void;
  onOpenNewAppointmentForPatient: (patientId: string) => void;
  onOpenCredentialsModal?: (patient: Patient) => void;
  onOpenPatientPortal?: (patient: Patient) => void;
}

export const PatientHistoryDetail: React.FC<PatientHistoryDetailProps> = ({
  patient,
  studies,
  appointments,
  clinicSettings,
  onBack,
  onOpenViewerWithStudy,
  onOpenNewAppointmentForPatient,
  onOpenCredentialsModal,
  onOpenPatientPortal,
}) => {
  const [copiedCredentials, setCopiedCredentials] = React.useState(false);
  const [selectedStudyForShare, setSelectedStudyForShare] = React.useState<MedicalStudy | null>(null);

  const safeStudies = Array.isArray(studies) ? studies : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  // Find all studies belonging to this patient
  const patientStudies = safeStudies.filter(
    s => s && (s.patientId === patient?.id || s.patientDni === patient?.dni || s.patientName === patient?.fullName)
  );

  // Find all appointments belonging to this patient
  const patientAppointments = safeAppointments.filter(
    a => a && (a.patientId === patient?.id || a.patientDni === patient?.dni)
  );

  const username = patient.dni;
  const password = patient.portalPin || '1234';

  const handleCopyCredentials = () => {
    const text = `🏥 Acceso al Expediente Digital - ${patient.fullName}\nUsuario (DNI): ${username}\nContraseña / PIN: ${password}\nPortal Web: Ingrese en modo "Portal Paciente" con su DNI y Contraseña.`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <span>Historial Clínico Radiológico</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Expediente digital, estudios históricos y perfil de seguridad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCredentialsModal && (
            <button
              onClick={() => onOpenCredentialsModal(patient)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title="Ver e imprimir carnet de usuario y contraseña para el paciente"
            >
              <span>🔑 Carnet de Acceso</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewAppointmentForPatient(patient.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Nuevo Estudio</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Patient Profile Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-bold text-white text-lg shadow-md">
                {patient.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{patient.fullName}</h3>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5">
                  <span className="font-mono text-neutral-300">DNI: {patient.dni}</span>
                  <span>• {patient.age} años</span>
                  <span>• {patient.gender === 'M' ? 'Masculino' : 'Femenino'}</span>
                  <span>• Grupo Sanguíneo: {patient.bloodType}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block text-[10px]">Seguro / EPS:</span>
                <span className="font-semibold text-cyan-400">{patient.insuranceProvider}</span>
              </div>
              <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block text-[10px]">Registro Inicial:</span>
                <span>{patient.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Contact Details & Generated Credentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
              <Phone className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{patient.phone || 'Sin teléfono'}</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
              <Mail className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{patient.email || 'Sin correo'}</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
              <MapPin className="w-4 h-4 text-neutral-500" />
              <span className="truncate">{patient.address || 'Lima, Perú'}</span>
            </div>

            {/* Generated Portal Credentials Widget */}
            <div className="bg-gradient-to-r from-cyan-950/60 to-neutral-950 p-2.5 rounded-lg border border-cyan-800/60 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 block font-mono">Usuario: <strong>{username}</strong></span>
                <span className="text-[10px] text-emerald-400 block font-mono">PIN: <strong>{password}</strong></span>
              </div>
              <button
                onClick={handleCopyCredentials}
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Copiar credenciales para enviar al paciente"
              >
                {copiedCredentials ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        {/* Safety & Pre-Imaging Protocol Screening Banner */}
        {(() => {
          const profile = patient.safetyProfile || {
            hasPacemaker: false,
            hasMetalImplants: false,
            hasClaustrophobia: false,
            isPregnantOrPossible: false,
            contrastAllergy: false,
            diabeticOnMetformin: false,
            allergies: [],
          };
          const allergiesList = profile.allergies || [];
          return (
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Perfil de Seguridad y Precauciones Radiológicas</span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Allergies */}
                <div
                  className={`p-3 rounded-xl border ${
                    allergiesList.length > 0
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 block font-medium">Alergias Conocidas</span>
                  <span className="font-bold text-xs mt-0.5 block">
                    {allergiesList.length > 0
                      ? allergiesList.join(', ')
                      : 'Sin alergias registradas'}
                  </span>
                </div>

                {/* Renal Function (eGFR) */}
                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl text-neutral-300">
                  <span className="text-[10px] text-neutral-400 block font-medium">Función Renal (eGFR)</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-bold text-white text-sm">{profile.eGFR || 90}</span>
                    <span className="text-[10px] text-neutral-400">mL/min</span>
                    <span className="text-[10px] text-emerald-400 ml-auto font-medium">
                      {profile.eGFR && profile.eGFR > 60 ? 'Normal' : 'Observación'}
                    </span>
                  </div>
                </div>

                {/* Pacemaker */}
                <div
                  className={`p-3 rounded-xl border ${
                    profile.hasPacemaker
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 block font-medium">Marcapasos / Implante RMN</span>
                  <span className="font-bold text-xs mt-0.5 block">
                    {profile.hasPacemaker ? '⚠️ PORTADOR (NO RMN)' : 'Sin Dispositivos'}
                  </span>
                </div>

                {/* Metal Implants */}
                <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl text-neutral-300">
                  <span className="text-[10px] text-neutral-400 block font-medium">Prótesis / Metálicos</span>
                  <span className="font-semibold text-xs mt-0.5 block">
                    {profile.hasMetalImplants ? 'Material de osteosíntesis' : 'Negativo'}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Diagnostic Imaging Studies History Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Estudios e Imágenes Diagnósticas ({patientStudies.length})</span>
            </h3>
          </div>

          {patientStudies.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-8 text-center text-neutral-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-neutral-600 opacity-60" />
              <p className="text-sm">Aún no hay estudios de imagen registrados para este paciente.</p>
              <button
                onClick={() => onOpenNewAppointmentForPatient(patient.id)}
                className="text-xs text-cyan-400 hover:underline"
              >
                Agendar el primer estudio ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {patientStudies.map(st => {
                const hasReport = Boolean(st.report);
                const isSigned = st.report?.status === 'FIRMADO_FINAL';

                return (
                  <div
                    key={st.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-4.5 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Modality Icon Pill */}
                      <div className="bg-cyan-950 border border-cyan-800/80 text-cyan-300 p-3 rounded-xl text-center shrink-0">
                        <span className="font-bold text-xs block">{st.modality}</span>
                        <span className="text-[10px] text-neutral-400 block font-mono mt-0.5">
                          {st.series.length} series
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{st.studyName}</span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            {st.studyDate} ({st.studyTime})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                            ACC: {st.accessionNumber}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-300">
                          <span className="text-neutral-500">Indicación:</span> {st.clinicalIndication}
                        </p>

                        {hasReport && (
                          <div className="text-xs text-emerald-400/90 font-mono line-clamp-1">
                            <span className="font-semibold text-neutral-400">Conclusión:</span>{' '}
                            {st.report?.impression.split('\n')[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-neutral-800">
                      {isSigned && (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Informe Firmado</span>
                        </span>
                      )}

                      <button
                        onClick={() => onOpenViewerWithStudy(st.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shadow-xs transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir Visor</span>
                      </button>

                      <button
                        onClick={() => openStudyInStandaloneWindow(st.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-neutral-700 hover:border-cyan-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Abrir estudio en ventana independiente para segunda pantalla (Dual Screen)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pantalla 2</span>
                      </button>

                      <button
                        onClick={() => setSelectedStudyForShare(st)}
                        className="p-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        title="Compartir estudio por WhatsApp o enlace"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Share Study Modal */}
      {selectedStudyForShare && (
        <ShareStudyModal
          study={selectedStudyForShare}
          clinicSettings={clinicSettings}
          onClose={() => setSelectedStudyForShare(null)}
        />
      )}
    </div>
  );
};
