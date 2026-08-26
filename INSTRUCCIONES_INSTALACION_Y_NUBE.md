# 🏥 IMAGIS — Sistema de Gestión de Imagenología Médica & Visor DICOM
### Manual Oficial de Instalación, Nube y Compatibilidad Universal (Windows x32 y x64)

---

## 💻 1. Compatibilidad Universal de Sistemas Operativos

El sistema y sus instaladores son **100% compatibles de forma nativa** con:
- **Windows 11** (64-bit / ARM64)
- **Windows 10** (32-bit x86 y 64-bit x64)
- **Windows 8.1 / 8** (32-bit y 64-bit)
- **Windows 7 SP1** (32-bit y 64-bit)
- **Windows Server** 2016, 2019, 2022 y 2025

El instalador detecta automáticamente la arquitectura (`32-bit (x86)` o `64-bit (x64)`) y configura el entorno de ejecución adecuado.

---

## 📦 2. Archivos del Instalador en Windows

| Archivo | Función |
| :--- | :--- |
| **`INSTALAR_Y_ABRIR_1_CLIC.bat`** | **Instalador y Ejecutor Rápido en 1 Clic.** Detecta si el sistema es 32-bit o 64-bit, configura dependencias y abre el sistema en el navegador automáticamente. |
| **`CONFIGURAR_CLINICA.bat`** | **Acceso Directo para Configurar la Clínica.** Abre directamente el panel de personalización de logotipo, nombre, dirección y usuarios. |
| **`INSTALADOR_WINDOWS.bat`** | **Instalador Completo con Asistente.** Solicita los datos de la clínica y crea el primer usuario Administrador interactivo. |
| **`INICIAR_SISTEMA.bat`** | Inicia el servidor y abre el navegador en `http://localhost:3000`. |
| **`DETENER_SISTEMA.bat`** | Detiene el servidor y libera el puerto 3000 de forma segura. |
| **`CREAR_ACCESO_DIRECTO.vbs`** | Genera los 2 accesos directos en el Escritorio de Windows con sus respectivos iconos. |
| **`CREAR_PAQUETE_NUBE_ZIP.bat`** | Genera el archivo comprimido `IMAGIS_Sistema_Imagenologia_Windows.zip` para subir a la nube. |
| **`IMAGIS_Sistema_Imagenologia_Windows.zip`** | **Paquete portátil listo para la nube** (Google Drive, OneDrive, Dropbox, etc.). |

---

## ☁️ 3. Cómo Guardar en la Nube y Distribuir

El archivo **`IMAGIS_Sistema_Imagenologia_Windows.zip`** ya se encuentra generado en la raíz del proyecto (~830 KB).

### Pasos:
1. **Sube el ZIP**: Arrastra `IMAGIS_Sistema_Imagenologia_Windows.zip` a tu Google Drive, OneDrive o Dropbox.
2. **Descarga en cualquier PC**: En la computadora de destino (32-bit o 64-bit), descarga el ZIP y extráelo.
3. **Ejecuta en 1 clic**: Haz doble clic en **`INSTALAR_Y_ABRIR_1_CLIC.bat`**.

---

## 👥 4. Credenciales de Acceso al Sistema

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| 👑 **Administrador** | `admin` | `admin123` | Acceso Total + Pestaña de Configuración y Gestión de Usuarios |
| 🛡️ **Encargado** | `encargado` | `staff123` | Citas, Pacientes, Visor DICOM y Notificaciones *(Botón Configuración Oculto)* |

*(Las contraseñas se pueden cambiar en cualquier momento desde el menú de `Configuración -> Usuarios & Contraseñas`).*

---

## 🩺 5. Módulos y Pestañas Probadas y Verificadas (100% Operativas)

1. **📅 Citas & Agenda**:
   - Modalidades: *Ultrasonido, Densitometría, Rayos X, Resonancia*.
   - Filtro por fecha: *Hoy, Mañana, Todos*.
   - Gestión de estados de atención y triaje de seguridad radiológica.
   - Aprobación de solicitudes web del portal de pacientes.
2. **👁️ Visor DICOM**:
   - Visualización multicorte, calibración de brillo y contraste (Window/Level).
   - Herramientas de medición (Regla, Ángulo, ROI de Densidad).
   - Mapas de falso color (PET Hot, Doppler vascular, Bone Warm).
   - Generación de informes con IA y vista de impresión oficial en PDF con firma digital.
3. **👥 Directorio de Pacientes**:
   - Historial clínico radiológico 360°.
   - Agendamiento directo y apertura de estudios anteriores.
4. **📤 Carga de Estudios Clínicos**:
   - Compatible con `.dcm`, `.jpg`, `.png`, `.mp4`, `.pdf` y `.zip`.
5. **⚙️ Configuración Institucional (Solo Administrador)**:
   - Carga de Logotipo en imagen o icono vectorial.
   - Datos fiscales, dirección, teléfonos y director médico.
   - **Gestión de Usuarios**: Crear nuevos encargados y cambiar contraseñas.
6. **🔔 Notificaciones**:
   - Recordatorios automáticos multicanal (SMS, Correo, WhatsApp).
   - Simulador en vivo con redacción asistida por IA.
7. **🌐 Portal del Paciente**:
   - Acceso con DNI y PIN, descarga de informes y asistente virtual 24/7.
