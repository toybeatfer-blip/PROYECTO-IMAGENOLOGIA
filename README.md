# 🏥 IMAGIS • Sistema Multi-Tenant de Imagenología Médica & Visor PACS

Plataforma SaaS integral para la gestión de consultorios y clínicas de imagenología médica, archivo y comunicación de imágenes diagnósticas (**PACS**), redacción de informes radiológicos con dictado por voz y asistencia de IA (Google Gemini), portal web del paciente, estaciones de trabajo multi-pantalla con atajos de teclado y panel maestro de administración y licenciamiento mensual.

---

## 🌟 Características Principales

### 🏢 1. Arquitectura Multi-Inquilino (Multi-Tenant)
- **Aislamiento Total de Datos:** Cada consultorio registrado cuenta con almacenamiento clínico independiente y base de datos completamente en blanco (`records_clinic_<id>`, `settings_clinic_<id>`).
- **Registro Público de Clínicas:** Auto-registro con formulario de perfil institucional y médico responsable, asignando automáticamente **1 mes (30 días)** de suscripción de prueba.
- **Sincronización en la Nube (Cloud Vault):** Bóveda centralizada con resolución de conflictos por marcas de tiempo (`updatedAt`) y soporte de eliminaciones mediante *tombstones*.

### 👑 2. Panel de Super Administrador Maestro
- **Acceso Exclusivo:** Panel de control de alto nivel para supervisión de todas las clínicas clientes.
- **Gestión de Suscripciones:**
  - Control de estados: *Activa*, *Vencida*, *Suspendida*.
  - Acciones rápidas: Renovar +1 Mes, Suspender / Reactivar, Editar credenciales, Eliminar definitivo con *Tombstone*.
  - Visibilidad de contraseñas para soporte técnico.
  - Impersonación directa de consultorios para asistencia remota.
  - Escáner de rescate profundo (`🗄️ Recuperar Previos`) para restaurar bases de datos no vinculadas.
  - Exportación e importación de copias de seguridad maestras en formato JSON.

### 🖥️ 3. Visor PACS Diagnóstico Multi-Pantalla (Dual-Screen Workstation)
- **Apertura Desacoplada en Ventana Secundaria:** Permite abrir el visor de imágenes en una ventana flotante o maximizada en un segundo monitor mientras se redacta la interpretación en la consola principal.
- **Sincronización en Tiempo Real (`BroadcastChannel`):** Al cambiar de estudio en la pantalla principal, la pantalla secundaria actualiza automáticamente el estudio sin abrir pestañas redundantes.
- **Atajos de Teclado Ergonómicos (PACS Shortcuts):**
  - `W` ➔ Ventana / Nivel (Contraste)
  - `Z` ➔ Zoom dinámico
  - `P` ➔ Desplazamiento (Pan)
  - `R` ➔ Regla / Calibrador milimétrico
  - `A` ➔ Medidor de ángulo
  - `C` ➔ Región de Interés (ROI HU)
  - `S` ➔ Puntero / Selección
  - `D` ➔ Comparación lado a lado (*Dual-Split Screen*)
  - `F` ➔ Pantalla completa
  - `1` al `5` ➔ Presets W/L (*Auto, Cerebro, Hueso, Pulmón, Tejido Blando*)
  - `↑` / `↓` o `[` / `]` ➔ Corte anterior / siguiente
- **Herramientas de Visualización Avanzadas:**
  - Presets de Ventana / Nivel (*Cerebro, Hueso, Pulmón, Tejido Blando*).
  - Herramientas interactivas: Calibrador/Regla milimétrica, Medidor de ángulos, ROI (densitometría en Unidades Hounsfield HU), Flechas de anotación.
  - Comparación lado a lado (*Dual-Split Screen*) y reproducción de bucles dinámicos (CINE).
  - Paletas de falso color: Escala de Grises, Invertido, Rainbow, PET/Térmico, Doppler Vascular y Matiz Óseo.

### 🎙️ 4. Dictado por Voz & Plantillas Normales con 1 Clic
- **Dictado Médico por Voz (Speech-to-Text):** Reconocimiento de voz nativo en español para dictar hallazgos e impresiones mientras se observan las imágenes.
- **Plantillas Normales Rápidas:** Selector de macros clínicos para autocompletar estudios rutinarios en 1 segundo (Tórax PA Normal, USG Abdominal, USG Renal, Mastografía BI-RADS 1, TAC Cráneo Simple, RMN Columna, Densitometría DEXA Normal).
- **Firma Digital con Sello y Código QR:** Informes oficiales con membrete institucional, firma digitalizada, cédula profesional y código QR de validación en línea.
- **Compartir por WhatsApp y Enlace Rápido:** Envío de enlaces seguros directamente al médico tratante o al paciente.

### 🤖 5. Asistencia Radiológica con Inteligencia Artificial (Gemini)
- **Triaje de Seguridad y Medios de Contraste:** Validación automática de función renal (eGFR / Creatinina), alergias a medios iodados o gadolinio, marcapasos e implantes.
- **Redacción y Estructuración de Informes:** Generación automática de hallazgos e impresiones diagnósticas sugeridas.
- **Traductor a Lenguaje del Paciente:** Explicación de informes clínicos en términos comprensibles y tranquilizadores para el paciente.
- **Asistente Virtual en el Portal del Paciente:** Chat interactivo 24/7 para resolver dudas de preparación (ayuno, toma de agua, ropa sin metal).

### 📱 6. Portal Web para Pacientes
- Acceso directo mediante DNI y PIN seguro.
- Visualización de citas, preparación previa y descarga de informes radiológicos e imágenes DICOM.
- Solicitud de citas en línea con triaje preventivo.

---

## 🔐 Credenciales de Acceso

### 👑 Super Administrador Maestro:
- **Usuario:** `Fernando01` *(o `Fernando`)*
- **Contraseña:** `Bazzoka1313AS.`
- *Acceso directo al Panel de Control Maestro y Gestión de Licencias.*

### 🏥 Consultorio Predeterminado (Clínica Demo):
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- *Acceso a la consola clínica de radiología (Agenda, Visor DICOM, Pacientes y Estudios).*

### 👤 Portal del Paciente:
- **Usuario (DNI):** DNI del paciente (ej. `12345678`)
- **Contraseña:** PIN de 4 dígitos registrado en su ficha clínica.

---

## 🚀 Requisitos e Instalación

### Prerrequisitos:
- [Node.js](https://nodejs.org/) (versión 18.0 o superior)
- [GitHub Desktop](https://desktop.github.com/) o Git CLI

### Pasos de Instalación:

1. **Clonar o Abrir en GitHub Desktop:**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   cd "PROYECTO RUELAS"
   ```

2. **Instalar Dependencias:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno (Opcional):**
   - Copiar el archivo `.env.example` a `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Configurar `GEMINI_API_KEY` con tu clave de API de Google AI Studio.

4. **Iniciar en Modo Desarrollo:**
   ```bash
   npm run dev
   ```
   Abrir en el navegador: **[http://localhost:3000](http://localhost:3000)**

5. **Compilar para Producción:**
   ```bash
   npm run build
   npm start
   ```

---

## 📄 Licencia y Distribución
Desarrollado para distribución comercial y despliegue en consultorios médicos y gabinetes radiológicos.