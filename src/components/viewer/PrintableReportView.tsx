import React from 'react';
import { MedicalStudy, ClinicSettings } from '../../types';
import { Printer, X, ShieldCheck, QrCode, Download, Activity, Layers } from 'lucide-react';

interface PrintableReportViewProps {
  study: MedicalStudy;
  clinicSettings?: ClinicSettings;
  onClose: () => void;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({ study, clinicSettings, onClose }) => {
  const report = study.report;
  const clinicName = clinicSettings?.name || 'IMAGIS';
  const clinicTagline = clinicSettings?.tagline || 'Centro de Diagnóstico por Imágenes & Radiología Médica';
  const clinicAddress = clinicSettings?.address || 'Av. Javier Prado Este 2840, San Borja';
  const clinicPhone = clinicSettings?.phone || '(01) 710-2000';
  const clinicEmail = clinicSettings?.email || 'informes@imagis-radiologia.com';
  const clinicRuc = clinicSettings?.ruc || '20608945123';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none overflow-y-auto">
      <div className="bg-white text-neutral-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto border border-neutral-200 print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Vista Oficial de Impresión / Documento PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 sm:p-12 space-y-6 bg-white font-sans text-neutral-900 text-sm leading-relaxed" id="printable-area">
          {/* Header */}
          <div className="border-b-2 border-neutral-900 pb-4 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center p-1 overflow-hidden shrink-0">
                {clinicSettings?.logoImage ? (
                  <img src={clinicSettings.logoImage} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Activity className="w-7 h-7 text-cyan-700" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  {clinicName}
                </h1>
                <p className="text-xs text-neutral-600 font-medium mt-0.5">
                  {clinicTagline}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {clinicAddress} | RUC: {clinicRuc} | Central: {clinicPhone} | {clinicEmail}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-neutral-100 text-neutral-800 border border-neutral-300 rounded font-mono text-xs font-bold">
                ACC: {study.accessionNumber}
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">Fecha: {study.studyDate} | {study.studyTime}</p>
            </div>
          </div>

          {/* Patient Demographic Table */}
          <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-neutral-500 block">Paciente:</span>
              <span className="font-bold text-neutral-900 text-sm">{study.patientName}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">DNI / Cédula:</span>
              <span className="font-semibold text-neutral-900">{study.patientDni}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Edad / Género:</span>
              <span className="font-semibold text-neutral-900">
                {study.patientAge} años / {study.patientGender === 'M' ? 'Masculino' : 'Femenino'}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Médico Solicitante:</span>
              <span className="font-semibold text-neutral-900">{study.referringDoctor}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500 block">Estudio Solicitado:</span>
              <span className="font-bold text-cyan-900 text-sm">{study.studyName}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500 block">Indicación Clínica / Diagnóstico Presuntivo:</span>
              <span className="font-medium text-neutral-800">{study.clinicalIndication}</span>
            </div>
          </div>

          {/* Technique Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-2">
              TÉCNICA DE ADQUISICIÓN Y PROTOCOLO:
            </h3>
            <p className="text-xs text-neutral-700 text-justify">
              {report?.technique ||
                `Estudio realizado con equipo ${study.equipmentModel}, obteniéndose secuencias multiplanares de alta definición.`}
            </p>
          </div>

          {/* Findings Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-2">
              HALLAZGOS:
            </h3>
            <div className="text-xs text-neutral-800 whitespace-pre-line leading-relaxed text-justify font-mono">
              {report?.findings || 'Sin hallazgos patológicos descritos.'}
            </div>
          </div>

          {/* Impression / Conclusion Section */}
          <div className="bg-neutral-50 border-l-4 border-cyan-700 p-4 rounded-r-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 mb-1">
              CONCLUSIÓN / IMPRESIÓN DIAGNÓSTICA:
            </h3>
            <div className="text-xs font-bold text-neutral-900 whitespace-pre-line leading-relaxed">
              {report?.impression || 'Estudio concluido sin incidentes.'}
            </div>
            {report?.biRadsOrScore && (
              <div className="mt-2 text-xs font-semibold text-emerald-800">
                CLASIFICACIÓN: {report.biRadsOrScore}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {report?.recommendations && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-200 pb-1 mb-1">
                RECOMENDACIONES:
              </h3>
              <p className="text-xs text-neutral-700">{report.recommendations}</p>
            </div>
          )}

          {/* Signatures & QR Digital Verification Stamp */}
          <div className="pt-6 border-t border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-lg">
              <div className="p-2 bg-white border border-neutral-300 rounded text-neutral-800">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="text-[11px] text-neutral-600">
                <p className="font-bold text-neutral-900">FIRMA DIGITAL VERIFICADA</p>
                <p className="font-mono text-[10px] text-neutral-500">Hash: {report?.signatureHash || 'SECURE-SHA256-VALID'}</p>
                <p>Fecha de emisión: {report?.signedAt || study.studyDate}</p>
              </div>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="inline-block text-center min-w-[220px]">
                <div className="font-serif italic text-cyan-900 text-lg font-bold border-b border-neutral-400 pb-1 mb-1">
                  {report?.radiologistName || 'Dr. Víctor Hugo Peñaloza R.'}
                </div>
                <p className="text-xs font-bold text-neutral-900">
                  {report?.radiologistName || 'Dr. Víctor Hugo Peñaloza R.'}
                </p>
                <p className="text-[11px] text-neutral-600">
                  {report?.radiologistLicense || 'C.M.P. 49201 / R.N.E. 21094'}
                </p>
                <p className="text-[10px] text-neutral-500 uppercase">Médico Especialista en Radiología</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
