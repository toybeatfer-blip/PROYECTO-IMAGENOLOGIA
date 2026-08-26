import React from 'react';

interface AnatomyProps {
  svgKey: string;
  brightness: number; // 0 to 200 (100 is normal)
  contrast: number; // 0 to 200 (100 is normal)
  colormap: string;
}

export const AnatomySVGs: React.FC<AnatomyProps> = ({ svgKey, brightness, contrast, colormap }) => {
  // Compute CSS filter based on window/level and colormaps
  const filterStyle: React.CSSProperties = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) ${
      colormap === 'INVERTED' ? 'invert(1)' : ''
    } ${colormap === 'PET_HOT' ? 'hue-rotate(280deg) saturate(3)' : ''} ${
      colormap === 'DOPPLER' ? 'hue-rotate(180deg) saturate(2.5)' : ''
    } ${colormap === 'BONE_WARM' ? 'sepia(0.6) saturate(1.8)' : ''}`,
    transition: 'filter 0.1s ease-out',
  };

  // Render high-fidelity vector medical anatomy based on slice key
  switch (svgKey) {
    // -------------------------------------------------------------
    // BRAIN CT: Mid Ventricles (Axial)
    // -------------------------------------------------------------
    case 'brain_ventricles_lateral':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050508" />
          {/* Calvarium / Skull bone ring */}
          <ellipse cx="256" cy="256" rx="200" ry="225" fill="#15171e" stroke="#e2e8f0" strokeWidth="14" strokeLinejoin="round" />
          <ellipse cx="256" cy="256" rx="192" ry="217" fill="#1e222d" stroke="#64748b" strokeWidth="3" />
          
          {/* Cerebral Cortex Gyri & Sulci */}
          <path d="M 120 180 Q 90 250 110 330 Q 140 400 200 440 Q 256 460 312 440 Q 372 400 402 330 Q 422 250 392 180 Q 352 100 256 85 Q 160 100 120 180 Z" fill="#2d3342" />
          
          {/* Interhemispheric Fissure / Falx Cerebri */}
          <line x1="256" y1="85" x2="256" y2="445" stroke="#0f1117" strokeWidth="3" strokeDasharray="6,2" />
          
          {/* Lateral Ventricles (Frontal Horns, Body, Occipital Horns) */}
          <path d="M 248 180 C 230 190 215 220 225 260 C 235 290 248 310 248 330 C 235 340 220 370 230 390 C 238 400 248 385 252 350 C 255 310 254 230 252 185 Z" fill="#08090d" stroke="#3b4252" strokeWidth="2" />
          <path d="M 264 180 C 282 190 297 220 287 260 C 277 290 264 310 264 330 C 277 340 292 370 282 390 C 274 400 264 385 260 350 C 257 310 258 230 260 185 Z" fill="#08090d" stroke="#3b4252" strokeWidth="2" />
          
          {/* Septum Pellucidum */}
          <line x1="256" y1="185" x2="256" y2="280" stroke="#4c566a" strokeWidth="2.5" />
          
          {/* Third Ventricle */}
          <ellipse cx="256" cy="275" rx="3.5" ry="24" fill="#050608" />
          
          {/* Thalamus & Basal Ganglia */}
          <ellipse cx="215" cy="275" rx="26" ry="34" fill="#383f50" opacity="0.85" />
          <ellipse cx="297" cy="275" rx="26" ry="34" fill="#383f50" opacity="0.85" />
          <path d="M 180 235 Q 195 265 185 305" stroke="#434c5e" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M 332 235 Q 317 265 327 305" stroke="#434c5e" strokeWidth="6" fill="none" strokeLinecap="round" />

          {/* Choroid Plexus Calcifications (Normal Benign Hyperdensities) */}
          <circle cx="232" cy="335" r="4.5" fill="#f8fafc" opacity="0.9" />
          <circle cx="280" cy="335" r="4.5" fill="#f8fafc" opacity="0.9" />
          
          {/* Pineal Gland Calcification */}
          <circle cx="256" cy="310" r="3.5" fill="#f1f5f9" opacity="0.85" />
        </svg>
      );

    case 'brain_basal_ganglia':
    case 'brain_midbrain_temporal':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050508" />
          <ellipse cx="256" cy="256" rx="198" ry="220" fill="#14171d" stroke="#e2e8f0" strokeWidth="15" />
          <path d="M 115 190 Q 90 260 115 340 Q 155 410 256 445 Q 355 410 395 340 Q 420 260 395 190 Q 350 110 256 95 Q 160 110 115 190 Z" fill="#2b313f" />
          {/* Midbrain / Mesencephalon / Mickey Mouse shape */}
          <path d="M 235 240 C 215 220 210 260 225 285 C 235 305 256 315 277 305 C 292 260 287 220 267 240 Z" fill="#20242e" stroke="#4c566a" strokeWidth="2" />
          <circle cx="240" cy="250" r="14" fill="#1e222b" />
          <circle cx="272" cy="250" r="14" fill="#1e222b" />
          <circle cx="256" cy="285" r="3" fill="#050608" />
          {/* Sylvian Fissures */}
          <path d="M 125 230 Q 170 245 200 230" stroke="#0f1117" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 387 230 Q 342 245 312 230" stroke="#0f1117" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Temporal Lobes */}
          <ellipse cx="160" cy="265" rx="34" ry="42" fill="#353c4c" />
          <ellipse cx="352" cy="265" rx="34" ry="42" fill="#353c4c" />
        </svg>
      );

    case 'brain_posterior_fossa':
    case 'brain_skull_base':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050508" />
          <ellipse cx="256" cy="256" rx="195" ry="215" fill="#12151b" stroke="#f1f5f9" strokeWidth="18" />
          {/* Sphenoid bone & Petrous temporal bones */}
          <path d="M 130 250 L 220 280 L 256 295 L 292 280 L 382 250" stroke="#cbd5e1" strokeWidth="16" fill="none" strokeLinecap="round" />
          {/* Fourth Ventricle */}
          <polygon points="256,290 244,308 268,308" fill="#050508" stroke="#334155" strokeWidth="1.5" />
          {/* Cerebellar Hemispheres */}
          <ellipse cx="205" cy="355" rx="46" ry="50" fill="#2c3340" />
          <ellipse cx="307" cy="355" rx="46" ry="50" fill="#2c3340" />
          <line x1="256" y1="308" x2="256" y2="410" stroke="#161922" strokeWidth="4" />
          {/* Orbits / Eyeballs anteriorly */}
          <circle cx="190" cy="130" r="28" fill="#1e222d" stroke="#94a3b8" strokeWidth="4" />
          <circle cx="190" cy="115" r="7" fill="#cbd5e1" />
          <circle cx="322" cy="130" r="28" fill="#1e222d" stroke="#94a3b8" strokeWidth="4" />
          <circle cx="322" cy="115" r="7" fill="#cbd5e1" />
          {/* Ethmoid & Maxillary Sinuses */}
          <ellipse cx="256" cy="155" rx="20" ry="15" fill="#050508" stroke="#cbd5e1" strokeWidth="3" />
        </svg>
      );

    case 'brain_centrum_semiovale':
    case 'brain_vertex_cortex':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050508" />
          <ellipse cx="256" cy="256" rx="180" ry="205" fill="#13161c" stroke="#f1f5f9" strokeWidth="14" />
          <path d="M 125 210 Q 105 270 135 340 Q 185 410 256 425 Q 325 410 375 340 Q 405 270 385 210 Q 345 130 256 120 Q 165 130 125 210 Z" fill="#2a303e" />
          {/* High Centrum Semiovale White Matter */}
          <ellipse cx="205" cy="265" rx="42" ry="75" fill="#323a4a" />
          <ellipse cx="307" cy="265" rx="42" ry="75" fill="#323a4a" />
          {/* Sulci details */}
          <line x1="256" y1="120" x2="256" y2="425" stroke="#0d0f14" strokeWidth="3" />
          <path d="M 190 200 Q 160 215 140 205" stroke="#12151b" strokeWidth="2.5" fill="none" />
          <path d="M 322 200 Q 352 215 372 205" stroke="#12151b" strokeWidth="2.5" fill="none" />
          <path d="M 190 320 Q 160 330 145 345" stroke="#12151b" strokeWidth="2.5" fill="none" />
          <path d="M 322 320 Q 352 330 367 345" stroke="#12151b" strokeWidth="2.5" fill="none" />
        </svg>
      );

    // -------------------------------------------------------------
    // BONE WINDOWS
    // -------------------------------------------------------------
    case 'bone_skull_base':
    case 'bone_orbit_mastoid':
    case 'bone_calvarium_mid':
    case 'bone_vertex':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#000000" />
          <ellipse cx="256" cy="256" rx="196" ry="220" fill="#080808" stroke="#ffffff" strokeWidth="18" strokeDasharray="300 4 120 3" />
          <ellipse cx="256" cy="256" rx="182" ry="206" fill="#020202" stroke="#71717a" strokeWidth="2" />
          {/* Mastoid trabecular bone lattice */}
          <g fill="#ffffff" opacity="0.85">
            <circle cx="115" cy="285" r="3" />
            <circle cx="125" cy="295" r="2.5" />
            <circle cx="110" cy="305" r="3.5" />
            <circle cx="130" cy="315" r="2" />
            <circle cx="397" cy="285" r="3" />
            <circle cx="387" cy="295" r="2.5" />
            <circle cx="402" cy="305" r="3.5" />
            <circle cx="382" cy="315" r="2" />
          </g>
          {/* Calvarium suture lines */}
          <path d="M 256 75 Q 260 85 254 95 Q 260 105 256 115" stroke="#52525b" strokeWidth="2" fill="none" />
        </svg>
      );

    // -------------------------------------------------------------
    // KNEE MRI: Sagittal Views
    // -------------------------------------------------------------
    case 'knee_sagittal_medial_tear':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050608" />
          {/* Femoral Condyle (Bone Cortex & Marrow) */}
          <path d="M 160 80 L 160 180 C 160 250 200 290 270 290 C 330 290 370 240 370 170 L 370 80 Z" fill="#2d3342" stroke="#10131a" strokeWidth="6" />
          <path d="M 175 90 L 175 175 C 175 235 210 270 270 270 C 320 270 355 230 355 170 L 355 90 Z" fill="#3b4457" />
          
          {/* Tibial Plateau */}
          <path d="M 140 340 C 200 335 300 335 380 340 C 390 380 370 450 370 480 L 160 480 C 160 450 135 380 140 340 Z" fill="#2d3342" stroke="#10131a" strokeWidth="6" />
          <path d="M 155 352 C 210 348 290 348 365 352 C 372 385 355 440 355 470 L 175 470 C 175 440 150 385 155 352 Z" fill="#3b4457" />

          {/* Meniscus Anterior Horn (Triangle - Normal Low Signal Black) */}
          <polygon points="160,332 205,332 182,305" fill="#050508" stroke="#18181b" strokeWidth="1.5" />
          
          {/* Meniscus Posterior Horn (Triangle WITH TEAR HIGH SIGNAL LINE) */}
          <polygon points="320,332 375,332 350,305" fill="#090a0f" stroke="#18181b" strokeWidth="1.5" />
          {/* Meniscal Tear Line (Hyperintense Grade III tear) */}
          <line x1="332" y1="330" x2="360" y2="310" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />
          <line x1="333" y1="330" x2="355" y2="315" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

          {/* Articular Cartilage Layer */}
          <path d="M 180 275 C 230 292 300 292 345 275" stroke="#64748b" strokeWidth="4" fill="none" />
          <path d="M 165 342 C 220 338 310 338 365 342" stroke="#64748b" strokeWidth="4" fill="none" />

          {/* Joint Effusion Fluid (Bright signal in T2/PDFS) */}
          <path d="M 140 285 Q 160 310 150 335" stroke="#94a3b8" strokeWidth="5" fill="none" opacity="0.8" />
        </svg>
      );

    case 'knee_sagittal_cruciates':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050608" />
          <path d="M 170 80 L 170 170 C 170 240 210 280 270 280 C 330 280 360 230 360 170 L 360 80 Z" fill="#333b4b" />
          <path d="M 150 340 C 210 335 300 335 370 340 L 360 480 L 160 480 Z" fill="#333b4b" />
          {/* Anterior Cruciate Ligament (ACL) Dark taut band */}
          <line x1="220" y1="335" x2="310" y2="210" stroke="#050508" strokeWidth="12" strokeLinecap="round" />
          <line x1="222" y1="335" x2="308" y2="210" stroke="#1e2430" strokeWidth="6" strokeLinecap="round" />
          {/* Posterior Cruciate Ligament (PCL) Hockey-stick arch */}
          <path d="M 285 335 Q 260 270 220 230" stroke="#050508" strokeWidth="14" fill="none" strokeLinecap="round" />
          {/* Infrapatellar Hoffa Fat Pad */}
          <polygon points="120,240 180,240 200,320 130,320" fill="#475569" opacity="0.6" />
        </svg>
      );

    case 'knee_sagittal_patella':
    case 'knee_sagittal_lateral_meniscus':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050608" />
          {/* Femur */}
          <path d="M 180 80 L 180 180 C 180 250 220 285 275 285 C 330 285 365 240 365 180 L 365 80 Z" fill="#353e4f" />
          {/* Patella (Kneecap) */}
          <ellipse cx="120" cy="170" rx="30" ry="45" fill="#353e4f" stroke="#0a0d14" strokeWidth="4" />
          {/* Quadriceps and Patellar Tendons */}
          <line x1="125" y1="125" x2="140" y2="70" stroke="#050508" strokeWidth="10" />
          <line x1="115" y1="215" x2="135" y2="350" stroke="#050508" strokeWidth="10" />
          {/* Tibia */}
          <path d="M 145 340 L 360 340 L 350 480 L 160 480 Z" fill="#353e4f" />
        </svg>
      );

    case 'knee_coronal_anterior':
    case 'knee_coronal_midjoint':
    case 'knee_coronal_posterior':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#050608" />
          {/* Femoral Condyles (Medial & Lateral) */}
          <path d="M 180 60 L 180 160 C 180 230 140 260 140 260 C 170 275 220 270 240 240 L 256 215 L 272 240 C 292 270 342 275 372 260 C 372 260 332 230 332 160 L 332 60 Z" fill="#374151" stroke="#111827" strokeWidth="5" />
          {/* Tibial Plateaus */}
          <path d="M 130 310 C 170 305 235 315 256 325 C 277 315 342 305 382 310 L 370 460 L 140 460 Z" fill="#374151" stroke="#111827" strokeWidth="5" />
          {/* Medial & Lateral Menisci in coronal profile (Bow-tie wedges) */}
          <polygon points="125,290 165,295 125,305" fill="#050508" />
          <polygon points="387,290 347,295 387,305" fill="#050508" />
          {/* Collateral Ligaments */}
          <line x1="115" y1="200" x2="120" y2="360" stroke="#050508" strokeWidth="8" strokeLinecap="round" />
          <line x1="397" y1="200" x2="392" y2="360" stroke="#050508" strokeWidth="8" strokeLinecap="round" />
        </svg>
      );

    // -------------------------------------------------------------
    // CHEST X-RAY: PA View
    // -------------------------------------------------------------
    case 'chest_xray_pa':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#020204" />
          {/* Thoracic cage & Soft tissues */}
          <path d="M 120 70 Q 70 150 65 300 Q 60 420 110 470 L 402 470 Q 452 420 447 300 Q 442 150 392 70 Z" fill="#181b22" />
          
          {/* Lungs Parenchyma (Lucent/Dark) */}
          <path d="M 230 110 C 180 120 120 160 110 250 C 100 340 100 400 125 435 C 145 425 190 390 230 400 Z" fill="#07080b" stroke="#334155" strokeWidth="1" />
          <path d="M 282 110 C 332 120 392 160 402 250 C 412 340 412 400 387 435 C 367 425 322 390 282 400 Z" fill="#07080b" stroke="#334155" strokeWidth="1" />

          {/* Rib cage (White bones) */}
          <g stroke="#94a3b8" strokeWidth="7" fill="none" opacity="0.65" strokeLinecap="round">
            {/* Clavicles */}
            <path d="M 140 100 Q 200 115 245 125" />
            <path d="M 372 100 Q 312 115 267 125" />
            {/* Posterior Ribs */}
            <path d="M 115 170 Q 180 200 240 190" />
            <path d="M 397 170 Q 332 200 272 190" />
            <path d="M 105 220 Q 180 250 240 240" />
            <path d="M 407 220 Q 332 250 272 240" />
            <path d="M 98 275 Q 180 305 240 295" />
            <path d="M 414 275 Q 332 305 272 295" />
            <path d="M 98 335 Q 180 365 240 355" />
            <path d="M 414 335 Q 332 365 272 355" />
            <path d="M 105 395 Q 180 415 235 405" />
            <path d="M 407 395 Q 332 415 277 405" />
          </g>

          {/* Cardiac Silhouette & Mediastinum */}
          <path d="M 235 130 C 235 180 215 220 220 270 C 225 330 190 395 245 425 C 275 425 325 410 325 360 C 325 280 280 220 275 130 Z" fill="#475569" opacity="0.9" />
          <ellipse cx="270" cy="155" rx="16" ry="12" fill="#64748b" /> {/* Aortic knob */}

          {/* Trachea & Main Bronchi (Air column) */}
          <path d="M 252 60 L 252 170 L 230 200" stroke="#050608" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 256 170 L 280 200" stroke="#050608" strokeWidth="7" fill="none" strokeLinecap="round" />

          {/* Right Lower Lobe Pneumonia Patch (Pathology feature) */}
          <ellipse cx="170" cy="365" rx="38" ry="26" fill="#cbd5e1" opacity="0.75" />
          {/* Air bronchogram lines inside the consolidation */}
          <line x1="160" y1="350" x2="180" y2="375" stroke="#050608" strokeWidth="2.5" />
          <line x1="175" y1="355" x2="190" y2="380" stroke="#050608" strokeWidth="2" />

          {/* Diaphragmatic Domes & Costophrenic Angles */}
          <path d="M 90 445 Q 165 415 240 435" stroke="#cbd5e1" strokeWidth="5" fill="none" />
          <path d="M 272 435 Q 345 420 422 445" stroke="#cbd5e1" strokeWidth="5" fill="none" />
        </svg>
      );

    case 'chest_xray_lat':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#020204" />
          <path d="M 160 80 Q 380 80 400 450 L 150 450 Z" fill="#111319" />
          {/* Sternum anteriorly */}
          <line x1="150" y1="120" x2="160" y2="350" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
          {/* Spine posteriorly */}
          <path d="M 370 80 Q 380 260 370 460" stroke="#94a3b8" strokeWidth="26" fill="none" opacity="0.7" strokeDasharray="18 4" />
          {/* Heart mass */}
          <ellipse cx="230" cy="320" rx="65" ry="55" fill="#475569" opacity="0.85" />
          {/* Retrosternal Clear Space */}
          <path d="M 175 140 Q 230 180 200 240" fill="#050608" opacity="0.8" />
          {/* Retrocardiac Clear Space */}
          <path d="M 290 310 Q 330 330 330 400" fill="#050608" opacity="0.7" />
          {/* Infiltrate in posterior basal segment */}
          <circle cx="310" cy="385" r="28" fill="#cbd5e1" opacity="0.65" />
        </svg>
      );

    // -------------------------------------------------------------
    // MAMMOGRAPHY
    // -------------------------------------------------------------
    case 'mammo_mlo_right':
    case 'mammo_mlo_left':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#020202" />
          {/* Pectoralis Muscle Band */}
          <polygon points="50,40 240,40 50,340" fill="#475569" opacity="0.8" />
          {/* Breast Parenchyma Contour */}
          <path d="M 50 40 C 280 40 430 160 430 290 C 430 400 260 480 50 480 Z" fill="#181a20" stroke="#334155" strokeWidth="2" />
          {/* Fibroglandular Tissue (Type B Dispersion) */}
          <path d="M 120 120 Q 320 220 260 350 Q 140 410 90 280 Z" fill="#374151" opacity="0.75" />
          <path d="M 180 180 Q 280 240 230 310 Q 170 330 150 250 Z" fill="#4b5563" opacity="0.6" />
          {/* Benign simple cyst (Oval circumscribed with halo) */}
          <circle cx="280" cy="260" r="14" fill="#090a0f" stroke="#64748b" strokeWidth="2" />
          {/* Nipple Complex */}
          <ellipse cx="433" cy="290" rx="5" ry="10" fill="#64748b" />
        </svg>
      );

    case 'mammo_cc_right':
    case 'mammo_cc_left':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#020202" />
          {/* Chest wall baseline */}
          <line x1="50" y1="50" x2="50" y2="460" stroke="#475569" strokeWidth="12" />
          {/* CC Projection Breast Contour */}
          <path d="M 50 70 C 350 70 450 180 450 265 C 450 350 350 460 50 460 Z" fill="#181a20" stroke="#334155" strokeWidth="2" />
          {/* Fibroglandular Tissue */}
          <path d="M 70 120 Q 340 265 70 400 Z" fill="#374151" opacity="0.75" />
          <ellipse cx="230" cy="265" rx="70" ry="90" fill="#4b5563" opacity="0.5" />
          {/* Benign cyst CC projection */}
          <ellipse cx="290" cy="245" rx="12" ry="9" fill="#090a0f" stroke="#64748b" strokeWidth="1.5" />
          {/* Nipple anterior */}
          <ellipse cx="452" cy="265" rx="4" ry="8" fill="#64748b" />
        </svg>
      );

    // -------------------------------------------------------------
    // ULTRASONOGRAPHY (Ecografía en Tiempo Real)
    // -------------------------------------------------------------
    case 'ultrasound_liver':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#000000" />
          {/* Sector Acoustic Beam Grid Cone */}
          <path d="M 256 30 L 40 470 A 320 320 0 0 0 472 470 Z" fill="#111827" stroke="#1f2937" strokeWidth="2" />
          {/* Liver Parenchyma Granular Echotexture */}
          <path d="M 256 60 L 80 440 Q 256 460 432 440 Z" fill="#2d3748" opacity="0.9" />
          {/* Diaphragm Hyperechoic Curvilinear Line */}
          <path d="M 100 420 Q 256 460 412 420" stroke="#f8fafc" strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* Hepatic Veins & Portal Triad branches */}
          <path d="M 230 200 Q 280 260 320 340" stroke="#050508" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 280 260 Q 220 310 180 370" stroke="#050508" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Right Kidney Acoustic Interface below liver */}
          <ellipse cx="330" cy="380" rx="45" ry="30" fill="#1a202c" stroke="#94a3b8" strokeWidth="3" />
          <ellipse cx="330" cy="380" rx="18" ry="12" fill="#e2e8f0" opacity="0.8" />
          {/* Depth Scale Markers */}
          <line x1="485" y1="100" x2="495" y2="100" stroke="#94a3b8" strokeWidth="2" />
          <line x1="485" y1="200" x2="495" y2="200" stroke="#94a3b8" strokeWidth="2" />
          <line x1="485" y1="300" x2="495" y2="300" stroke="#94a3b8" strokeWidth="2" />
          <line x1="485" y1="400" x2="495" y2="400" stroke="#94a3b8" strokeWidth="2" />
        </svg>
      );

    case 'ultrasound_gallbladder':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#000000" />
          <path d="M 256 30 L 40 470 A 320 320 0 0 0 472 470 Z" fill="#111827" stroke="#1f2937" strokeWidth="2" />
          {/* Liver tissue background */}
          <path d="M 256 60 L 80 440 Q 256 460 432 440 Z" fill="#2d3748" />
          {/* Gallbladder Anechoic Lumen */}
          <ellipse cx="256" cy="260" rx="65" ry="110" fill="#020305" stroke="#f1f5f9" strokeWidth="4" />
          {/* Gallstone (Calculus) with Acoustic Shadow */}
          <circle cx="265" cy="330" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          {/* Posterior Acoustic Shadow */}
          <polygon points="251,344 279,344 310,470 220,470" fill="#000000" opacity="0.95" />
          <text x="256" y="80" fill="#38bdf8" fontSize="12" textAnchor="middle" fontFamily="monospace">VESICULA BILIAR - CORTE LONGITUDINAL</text>
        </svg>
      );

    case 'ultrasound_doppler_portal':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#000000" />
          <path d="M 256 30 L 40 470 A 320 320 0 0 0 472 470 Z" fill="#111827" stroke="#1f2937" strokeWidth="2" />
          <path d="M 256 60 L 80 440 Q 256 460 432 440 Z" fill="#2d3748" />
          {/* Doppler Color Sampling Box */}
          <polygon points="170,160 342,180 310,360 140,340" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="4,3" />
          {/* Hepatopetal Blood Flow (Red Color Stream) */}
          <path d="M 180 270 Q 256 250 310 210" stroke="#ef4444" strokeWidth="24" fill="none" strokeLinecap="round" opacity="0.9" />
          {/* Venous flow (Blue Color Stream) */}
          <path d="M 160 310 Q 230 300 290 280" stroke="#3b82f6" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.8" />
          {/* Doppler Velocity Scale Bar */}
          <rect x="25" y="100" width="18" height="180" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect x="27" y="102" width="14" height="85" fill="#ef4444" />
          <rect x="27" y="193" width="14" height="85" fill="#3b82f6" />
          <text x="34" y="95" fill="#ef4444" fontSize="10" fontFamily="monospace" textAnchor="middle">+35</text>
          <text x="34" y="295" fill="#3b82f6" fontSize="10" fontFamily="monospace" textAnchor="middle">-35</text>
        </svg>
      );

    // -------------------------------------------------------------
    // DENSITOMETRIA OSEA (DEXA)
    // -------------------------------------------------------------
    case 'dexa_lumbar_spine':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#030712" />
          {/* DEXA Scan Coordinate Grid */}
          <line x1="120" y1="40" x2="120" y2="470" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="392" y1="40" x2="392" y2="470" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
          {/* Lumbar Vertebrae L1 to L4 Densities */}
          {/* L1 */}
          <rect x="200" y="80" width="112" height="60" rx="8" fill="#cbd5e1" stroke="#38bdf8" strokeWidth="3" />
          <text x="160" y="115" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">L1</text>
          {/* L2 */}
          <rect x="195" y="160" width="122" height="65" rx="8" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="3" />
          <text x="160" y="200" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">L2</text>
          {/* L3 */}
          <rect x="190" y="245" width="132" height="70" rx="8" fill="#f1f5f9" stroke="#38bdf8" strokeWidth="3" />
          <text x="160" y="285" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">L3</text>
          {/* L4 */}
          <rect x="185" y="335" width="142" height="75" rx="8" fill="#e2e8f0" stroke="#38bdf8" strokeWidth="3" />
          <text x="160" y="380" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">L4</text>
          {/* Iliac Crest Wings Base */}
          <path d="M 120 430 Q 185 410 200 440 Q 256 460 312 440 Q 327 410 392 430" stroke="#94a3b8" strokeWidth="6" fill="none" />
          {/* DEXA T-Score Summary Table Overlay */}
          <rect x="360" y="80" width="120" height="140" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x="420" y="105" fill="#f8fafc" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">DEXA LUMBAR</text>
          <text x="420" y="130" fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="middle">BMD: 0.942</text>
          <text x="420" y="155" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle">T-Score: -1.4</text>
          <text x="420" y="180" fill="#10b981" fontSize="11" fontFamily="monospace" textAnchor="middle">Z-Score: -0.8</text>
          <text x="420" y="205" fill="#fbbf24" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">OSTEOPENIA</text>
        </svg>
      );

    case 'dexa_femur_hip':
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#030712" />
          {/* Pelvis & Acetabulum Outline */}
          <path d="M 80 120 Q 220 100 280 200" stroke="#64748b" strokeWidth="14" fill="none" strokeLinecap="round" />
          {/* Femoral Head and Neck */}
          <circle cx="280" cy="200" r="48" fill="#e2e8f0" stroke="#0ea5e9" strokeWidth="3" />
          {/* Femoral Neck ROI Box (Dual Energy region) */}
          <polygon points="260,240 340,200 360,240 280,280" fill="#f59e0b" opacity="0.35" stroke="#f59e0b" strokeWidth="2" />
          {/* Greater Trochanter & Femoral Shaft */}
          <path d="M 330 200 Q 390 230 380 290 L 360 460 L 290 460 L 280 280 Z" fill="#cbd5e1" stroke="#0ea5e9" strokeWidth="3" />
          {/* Diagnostic Overlay */}
          <rect x="30" y="320" width="150" height="130" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x="105" y="345" fill="#f8fafc" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">DEXA CADERA IZQ</text>
          <text x="105" y="370" fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="middle">BMD: 0.880 g/cm²</text>
          <text x="105" y="395" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle">T-Score: -1.1 DE</text>
          <text x="105" y="420" fill="#10b981" fontSize="11" fontFamily="monospace" textAnchor="middle">Z-Score: -0.5 DE</text>
          <text x="105" y="440" fill="#fbbf24" fontSize="9" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">OSTEOPENIA LEVE</text>
        </svg>
      );

    // Default fallback anatomical wireframe
    default:
      return (
        <svg viewBox="0 0 512 512" className="w-full h-full select-none" style={filterStyle}>
          <rect width="512" height="512" fill="#06070a" />
          <circle cx="256" cy="256" rx="180" ry="180" fill="#1c202a" stroke="#475569" strokeWidth="6" />
          <ellipse cx="256" cy="256" rx="90" ry="120" fill="#2d3342" />
          <line x1="256" y1="80" x2="256" y2="430" stroke="#0a0c10" strokeWidth="4" />
          <text x="256" y="260" fill="#94a3b8" textAnchor="middle" fontSize="16" fontFamily="sans-serif">
            DICOM Multiplanar Slice
          </text>
        </svg>
      );
  }
};
