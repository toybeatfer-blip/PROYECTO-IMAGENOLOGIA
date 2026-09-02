import React, { useState, useRef } from 'react';
import {
  Patient,
  MedicalStudy,
  ModalityType,
  MedicalStudySeries,
  MedicalImageSlice,
} from '../../types';
import {
  Upload,
  Layers,
  FileText,
  Image as ImageIcon,
  Film,
  FolderArchive,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  User,
  Activity,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';

interface UploadMedicalStudyModalProps {
  patients: Patient[];
  onSaveStudy: (study: MedicalStudy, openInViewer?: boolean) => void;
  onClose: () => void;
}

export const UploadMedicalStudyModal: React.FC<UploadMedicalStudyModalProps> = ({
  patients = [],
  onSaveStudy,
  onClose,
}) => {
  const safePatients = Array.isArray(patients) ? patients : [];

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    safePatients.length > 0 ? safePatients[0].id : ''
  );
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientDni, setNewPatientDni] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState(45);
  const [newPatientGender, setNewPatientGender] = useState<'M' | 'F'>('M');

  const [modality, setModality] = useState<ModalityType>('ULTRASONIDO');
  const [studyName, setStudyName] = useState('Ecografía Abdominal Completa');
  const [anatomicalRegion, setAnatomicalRegion] = useState('Abdomen Superior');
  const [equipmentModel, setEquipmentModel] = useState('Canon Aplio i800 HD Matrix');
  const [referringDoctor, setReferringDoctor] = useState('Dr. Médico Tratante Externo');
  const [clinicalIndication, setClinicalIndication] = useState('Evaluación diagnóstica por dolor abdominal.');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().substring(0, 10));
  const [studyTime, setStudyTime] = useState('10:00');
  const [contrastUsed, setContrastUsed] = useState(false);

  // Uploaded Files State
  const [uploadedSlices, setUploadedSlices] = useState<
    { name: string; size: string; previewUrl: string; fileType: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modality presets for quick selection
  const MODALITY_PRESETS: {
    id: ModalityType;
    label: string;
    icon: string;
    color: string;
    defaultStudy: string;
    defaultRegion: string;
    defaultEquipment: string;
  }[] = [
    {
      id: 'ULTRASONIDO',
      label: 'Ultrasonido (Ecografía)',
      icon: 'Radio',
      color: 'border-cyan-500 text-cyan-800 bg-cyan-50 ring-1 ring-cyan-400',
      defaultStudy: 'Ecografía Abdominal y Hepatobiliar Completa',
      defaultRegion: 'Abdomen Superior',
      defaultEquipment: 'Canon Aplio i800 HD Matrix / Siemens Acuson',
    },
    {
      id: 'DENSITOMETRIA',
      label: 'Densitometría Ósea (DEXA)',
      icon: 'Bone',
      color: 'border-amber-500 text-amber-800 bg-amber-50 ring-1 ring-amber-400',
      defaultStudy: 'Densitometría Ósea Columna Lumbar y Fémur Proximal (DEXA)',
      defaultRegion: 'Columna Lumbar y Cadera',
      defaultEquipment: 'Hologic Horizon A Bone Densitometer',
    },
    {
      id: 'RAYOS_X',
      label: 'Rayos X (Radiología)',
      icon: 'Activity',
      color: 'border-emerald-500 text-emerald-800 bg-emerald-50 ring-1 ring-emerald-400',
      defaultStudy: 'Radiografía Digital de Tórax PA y Lateral',
      defaultRegion: 'Tórax / Pulmones',
      defaultEquipment: 'Philips DigitalDiagnost C90 Flat Panel',
    },
    {
      id: 'RESONANCIA',
      label: 'Resonancia Magnética (RMN)',
      icon: 'Scan',
      color: 'border-purple-500 text-purple-800 bg-purple-50 ring-1 ring-purple-400',
      defaultStudy: 'RMN de Columna Lumbar 3.0 Tesla Multiplanar',
      defaultRegion: 'Columna Lumbar',
      defaultEquipment: 'Siemens Magnetom Lumina 3.0T High Field',
    },
  ];

  const handleModalityChange = (mod: ModalityType) => {
    setModality(mod);
    const preset = MODALITY_PRESETS.find(p => p.id === mod);
    if (preset) {
      setStudyName(preset.defaultStudy);
      setAnatomicalRegion(preset.defaultRegion);
      setEquipmentModel(preset.defaultEquipment);
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
      const isDicom = file.name.endsWith('.dcm') || file.name.endsWith('.dicom') || file.name.endsWith('.ima');
      const isZip = file.name.endsWith('.zip');

      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => {
          const previewUrl = e.target?.result as string;
          setUploadedSlices(prev => [
            ...prev,
            {
              name: file.name,
              size: sizeStr,
              previewUrl,
              fileType: 'Imagen Médica',
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // For DICOM, PDF, Video, Zip create a placeholder preview
        let previewUrl = '';
        let fileType = 'Documento';
        if (isDicom) fileType = 'Archivo DICOM (.dcm)';
        else if (isPdf) fileType = 'Informe PDF';
        else if (isVideo) fileType = 'Video Cine Ultrasonido';
        else if (isZip) fileType = 'Paquete de Series ZIP';

        setUploadedSlices(prev => [
          ...prev,
          {
            name: file.name,
            size: sizeStr,
            previewUrl,
            fileType,
          },
        ]);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleRemoveSlice = (index: number) => {
    setUploadedSlices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (openInViewer: boolean = false) => {
    let patName = '';
    let patDni = '';
    let patAge = 45;
    let patGender: 'M' | 'F' = 'M';
    let patId = selectedPatientId;

    if (isNewPatient) {
      patName = newPatientName.trim() || 'Paciente Ingreso Rápido';
      patDni = newPatientDni.trim() || `${Math.floor(10000000 + Math.random() * 90000000)}`;
      patAge = Number(newPatientAge) || 45;
      patGender = newPatientGender;
      patId = `pat-${Date.now()}`;
    } else {
      const existing = patients.find(p => p.id === selectedPatientId);
      if (existing) {
        patName = existing.fullName || existing.name;
        patDni = existing.dni || existing.documentNumber;
        patAge = existing.age || 45;
        patGender = (existing.gender as any) === 'F' ? 'F' : 'M';
      }
    }

    const accessionNumber = `ACC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build slices from uploaded files or procedural anatomy keys
    const slices: MedicalImageSlice[] =
      uploadedSlices.length > 0
        ? uploadedSlices.map((item, idx) => ({
            id: `sl-up-${Date.now()}-${idx}`,
            sliceIndex: idx + 1,
            sliceLocation: `Corte ${idx + 1} (${item.fileType})`,
            sliceThickness: 'Digital HD',
            instanceNumber: idx + 1,
            huCenterRange: 'Auto Window',
            svgIllustrationKey: modality === 'ULTRASONIDO' ? 'ultrasound_liver' : modality === 'DENSITOMETRIA' ? 'dexa_lumbar_spine' : 'brain_ventricles_lateral',
            customImageUrl: item.previewUrl || undefined,
          }))
        : [
            {
              id: `sl-def-${Date.now()}-1`,
              sliceIndex: 1,
              sliceLocation: 'Corte Adquisición 1',
              sliceThickness: 'Digital HD',
              instanceNumber: 1,
              huCenterRange: 'Auto Window',
              svgIllustrationKey: modality === 'ULTRASONIDO' ? 'ultrasound_liver' : modality === 'DENSITOMETRIA' ? 'dexa_lumbar_spine' : modality === 'RAYOS_X' ? 'chest_xray_pa' : 'brain_ventricles_lateral',
            },
          ];

    const series: MedicalStudySeries[] = [
      {
        id: `ser-up-${Date.now()}-1`,
        seriesNumber: 1,
        name: `${modality === 'ULTRASONIDO' ? 'Ecografía' : modality === 'DENSITOMETRIA' ? 'DEXA Scan' : 'Serie 1'} (${anatomicalRegion})`,
        plane: modality === 'RESONANCIA' ? 'SAGITTAL' : 'CORONAL',
        description: `Adquisición digital de ${studyName} cargada en PACS`,
        matrixSize: '1024 x 1024',
        pixelSpacing: '0.25 mm',
        slices,
      },
    ];

    const newStudy: MedicalStudy = {
      id: `study-${Date.now()}`,
      accessionNumber,
      patientId: patId,
      patientName: patName,
      patientAge: patAge,
      patientGender: patGender,
      patientDni: patDni,
      modality,
      studyName,
      anatomicalRegion,
      studyDate,
      studyTime,
      equipmentModel,
      institutionName: 'Centro de Diagnóstico por Imágenes Especializado',
      referringDoctor,
      clinicalIndication,
      contrastMediaUsed: contrastUsed ? 'Medio de contraste administrado' : undefined,
      acquisitionParams: {
        sliceThickness: 'Digital Adquisición',
      },
      series,
      keyFindingsSummary: `Estudio de ${studyName} importado al repositorio PACS. Pendiente de informe final.`,
      report: {
        id: `rep-${Date.now()}`,
        studyId: `study-${Date.now()}`,
        radiologistName: 'Dr. Víctor Hugo Peñaloza R.',
        radiologistLicense: 'C.M.P. 49201 / R.N.E. 21094',
        reportDate: `${studyDate} ${studyTime}`,
        technique: `Estudio de ${studyName} realizado con equipo ${equipmentModel} en cortes multiplanares.`,
        findings: 'Imágenes cargadas correctamente al visor PACS. Estudio disponible para interpretación diagnóstica.',
        impression: `ESTUDIO DE ${studyName.toUpperCase()} EN PROCESO DE EVALUACIÓN RADIOLÓGICA.`,
        recommendations: 'Evaluación y correlación con antecedentes clínicos del médico solicitante.',
        status: 'BORRADOR',
      },
    };

    onSaveStudy(newStudy, openInViewer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-2xl text-cyan-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Cargar & Digitalizar Estudio Clínico (PACS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Importe archivos DICOM (.dcm), imágenes (.jpg, .png), videos ecográficos (.mp4) o paquetes ZIP
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

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700">
          {/* Step 1: Patient Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-700" />
                <span>1. Paciente Asignado:</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPatient(false)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isNewPatient
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Paciente Existente
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPatient(true)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isNewPatient
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Nuevo / Express
                </button>
              </div>
            </div>

            {!isNewPatient ? (
              <div>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-medium"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.name} — DNI: {p.dni || p.documentNumber} ({p.age} años, {p.gender === 'M' ? 'Masc' : 'Fem'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Manuel Pérez Ramos"
                    value={newPatientName}
                    onChange={e => setNewPatientName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">DNI / Documento:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 45892104"
                    value={newPatientDni}
                    onChange={e => setNewPatientDni(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-cyan-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Edad y Sexo:</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={110}
                      value={newPatientAge}
                      onChange={e => setNewPatientAge(Number(e.target.value))}
                      className="w-16 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 text-center font-mono focus:outline-hidden focus:border-cyan-600"
                    />
                    <select
                      value={newPatientGender}
                      onChange={e => setNewPatientGender(e.target.value as any)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600 font-semibold"
                    >
                      <option value="M">Masc</option>
                      <option value="F">Fem</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Modality Selection & Parameters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-700" />
              <span>2. Seleccionar Modalidad del Estudio:</span>
            </label>

            {/* Modality Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MODALITY_PRESETS.map(preset => {
                const isSelected = modality === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleModalityChange(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? `${preset.color} shadow-xs`
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs">{preset.label}</span>
                    <span className="text-[10px] text-slate-500 truncate mt-1">
                      {preset.defaultRegion}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Study Specific Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Nombre del Estudio:</label>
                <input
                  type="text"
                  required
                  value={studyName}
                  onChange={e => setStudyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Región Anatómica:</label>
                <input
                  type="text"
                  required
                  value={anatomicalRegion}
                  onChange={e => setAnatomicalRegion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Equipo / Scanner:</label>
                <input
                  type="text"
                  value={equipmentModel}
                  onChange={e => setEquipmentModel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Fecha de Adquisición:</label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={e => setStudyDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Hora:</label>
                <input
                  type="time"
                  value={studyTime}
                  onChange={e => setStudyTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-cyan-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Médico Solicitante:</label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={e => setReferringDoctor(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-1 font-semibold">Indicación Clínica:</label>
                <input
                  type="text"
                  value={clinicalIndication}
                  onChange={e => setClinicalIndication(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-cyan-600"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Drag & Drop Files Upload Area */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-700" />
                <span>3. Carga de Archivos de Imágenes / DICOM / Series:</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Formatos: .DCM, .DICOM, .JPG, .PNG, .TIFF, .MP4, .PDF, .ZIP
              </span>
            </div>

            {/* Drop Zone Box */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-slate-300 hover:border-cyan-500 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".dcm,.dicom,.ima,image/*,video/*,.pdf,.zip"
                onChange={e => processFiles(e.target.files)}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Arrastre sus archivos aquí o haga clic para examinar
                </span>
                <span className="text-[11px] text-slate-500">
                  Puede cargar múltiples cortes, imágenes de ecografía, densitometría o archivos DICOM
                </span>
              </div>
            </div>

            {/* Uploaded Files Gallery */}
            {uploadedSlices.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Archivos preparados para importación ({uploadedSlices.length}):</span>
                  <button
                    type="button"
                    onClick={() => setUploadedSlices([])}
                    className="text-rose-600 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                  >
                    Quitar todos
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {uploadedSlices.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-2xl bg-white border border-slate-200 relative group flex flex-col justify-between overflow-hidden shadow-xs"
                    >
                      {item.previewUrl ? (
                        <div className="w-full h-20 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center mb-1.5">
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-20 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-500 mb-1.5 p-2 text-center">
                          <FileText className="w-6 h-6 text-cyan-700 mb-1" />
                          <span className="text-[9px] font-mono truncate max-w-full font-bold">{item.fileType}</span>
                        </div>
                      )}

                      <div className="text-[10px] truncate text-slate-900 font-bold" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                        <span>Corte {idx + 1}</span>
                        <span>{item.size}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSlice(idx)}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-white/90 text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                        title="Eliminar corte"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer font-semibold"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Guardar en Repositorio</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <Eye className="w-4 h-4" />
              <span>Guardar & Abrir en Visor DICOM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
