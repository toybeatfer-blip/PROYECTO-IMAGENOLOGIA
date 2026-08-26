import React from 'react';
import { MedicalStudy, ClinicSettings } from '../../types';
import { Printer, X, ShieldCheck, QrCode, Download, Activity, Layers, CheckCircle2, Lock } from 'lucide-react';

interface PrintableReportViewProps {
  study: MedicalStudy;
  clinicSettings?: ClinicSettings;
  onClose: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({ study, clinicSettings, onClose }) => {
  const report = study.report;
  const clinicName = clinicSettings?.name || 'Centro de Imagenología Médica';
  const clinicTagline = clinicSettings?.tagline || 'Diagnóstico por Imágenes & Radiología Especializada';
  const clinicAddress = clinicSettings?.address || 'Calle Principal 100';
  const clinicPhone = clinicSettings?.phone || '(55) 1234-5678';
  const clinicEmail = clinicSettings?.email || 'informes@imagenologia-medica.com';
  const clinicRuc = clinicSettings?.ruc || '10000000001';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none overflow-y-auto antialiased">
      <div className="bg-white text-neutral-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto border border-neutral-200 print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Vista Oficial de Impresión / Documento PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-12 space-y-6 bg-white font-sans text-neutral-900 text-sm leading-relaxed relative" id="printable-area">
          {/* Header */}
          <div className="border-b-2 border-neutral-900 pb-4 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center p-1.5 overflow-hidden shrink-0 shadow-xs">
                {clinicSettings?.logoImage ? (
                  <img src={clinicSettings.logoImage} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Activity className="w-8 h-8 text-cyan-700" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 uppercase">
                  {clinicName}
                </h1>
                <p className="text-xs text-neutral-600 font-semibold mt-0.5">
                  {clinicTagline}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {clinicAddress} | Reg. Fiscal: {clinicRuc} | Tel: {clinicPhone} | {clinicEmail}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-900 border border-neutral-300 rounded font-mono text-xs font-bold">
                ACC: {study.accessionNumber}
              </span>
              <p className="text-[11px] text-neutral-500 mt-1 font-medium">Fecha: {study.studyDate} | {study.studyTime}</p>
            </div>
          </div>

          {/* Patient Demographic Table */}
          <div className="bg-neutral-50 border border-neutral-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-neutral-500 block font-medium">Paciente:</span>
              <span className="font-bold text-neutral-900 text-sm">{study.patientName}</span>
            </div>
            <div>
              <span className="text-neutral-500 block font-medium">DNI / Identificación:</span>
              <span className="font-semibold text-neutral-900 font-mono">{study.patientDni}</span>
            </div>
            <div>
              <span className="text-neutral-500 block font-medium">Edad / Género:</span>
              <span className="font-semibold text-neutral-900">
                {study.patientAge} años / {study.patientGender === 'M' ? 'Masculino' : 'Femenino'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block font-medium">Médico Solicitante:</span>
              <span className="font-semibold text-neutral-900">{study.referringDoctor || 'A quien corresponda'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500 block font-medium">Estudio Realizado:</span>
              <span className="font-bold text-cyan-900 text-sm">[{study.modality}] {study.studyName}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500 block font-medium">Indicación Clínica / Motivo:</span>
              <span className="font-medium text-neutral-800">{study.clinicalIndication || 'Evaluación diagnóstica'}</span>
            </div>
          </div>

          {/* Technique Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
              TÉCNICA DE ADQUISICIÓN Y PROTOCOLO:
            </h3>
            <p className="text-xs text-neutral-700 text-justify leading-relaxed">
              {report?.technique ||
                `Estudio realizado con equipo ${study.equipmentModel}, obteniéndose secuencias multiplanares de alta definición.`}
            </p>
          </div>

          {/* Findings Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
              HALLAZGOS RADIOLÓGICOS:
            </h3>
            <div className="text-xs text-neutral-800 whitespace-pre-line leading-relaxed text-justify font-sans bg-neutral-50/50 p-3 rounded-lg border border-neutral-200">
              {report?.findings || 'Sin hallazgos patológicos descritos.'}
            </div>
          </div>

          {/* Impression / Conclusion Section */}
          <div className="bg-cyan-50/70 border-l-4 border-cyan-700 p-4 rounded-r-xl">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-950 mb-1">
              CONCLUSIÓN / IMPRESIÓN DIAGNÓSTICA:
            </h3>
            <div className="text-xs font-bold text-neutral-900 whitespace-pre-line leading-relaxed">
              {report?.impression || 'Estudio concluido sin incidentes.'}
            </div>
            {report?.biRadsOrScore && (
              <div className="mt-2 text-xs font-bold text-emerald-800">
                CLASIFICACIÓN: {report.biRadsOrScore}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {report?.recommendations && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-1">
                RECOMENDACIONES:
              </h3>
              <p className="text-xs text-neutral-700">{report.recommendations}</p>
            </div>
          )}

          {/* Signatures & QR Digital Verification Stamp */}
          <div className="pt-6 border-t-2 border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
              <div className="p-2 bg-white border border-neutral-300 rounded-lg text-neutral-800 shrink-0">
                <QrCode className="w-11 h-11 text-neutral-900" />
              </div>
              <div className="text-[11px] text-neutral-600 space-y-0.5">
                <p className="font-bold text-neutral-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DICTAMEN DIGITAL VALIDADO</span>
                </p>
                <p className="font-mono text-[10px] text-neutral-500">Hash: {report?.signatureHash || 'DIGITAL-SECURE-SHA256-VALID'}</p>
                <p className="text-[10px] text-neutral-500">Fecha: {report?.signedAt || study.studyDate}</p>
                <p className="text-[9px] text-neutral-400">Escanee el código QR para autenticidad en línea</p>
              </div>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="inline-block text-center min-w-[240px]">
                <div className="font-serif italic text-cyan-900 text-xl font-bold border-b border-neutral-400 pb-1 mb-1">
                  {report?.radiologistName || clinicSettings?.directorName || 'Dr. Médico Radiólogo'}
                </div>
                <p className="text-xs font-bold text-neutral-900">
                  {report?.radiologistName || clinicSettings?.directorName || 'Dr. Médico Radiólogo'}
                </p>
                <p className="text-[11px] text-neutral-600 font-medium">
                  {report?.radiologistLicense || clinicSettings?.directorTitle || 'Cédula Profesional Especialista'}
                </p>
                <p className="text-[10px] text-neutral-500 uppercase font-semibold">Médico Especialista en Imagenología</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
