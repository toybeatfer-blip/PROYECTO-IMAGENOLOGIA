Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = WshShell.CurrentDirectory

' 1. Acceso Directo Principal
Set oLink1 = WshShell.CreateShortcut(strDesktop & "\IMAGIS - Iniciar Sistema.lnk")
oLink1.TargetPath = strCurrentDir & "\INICIAR_SISTEMA.bat"
oLink1.WorkingDirectory = strCurrentDir
oLink1.Description = "Sistema de Gestión de Imagenología Médica y Visor PACS"
oLink1.WindowStyle = 1
oLink1.IconLocation = "shell32.dll, 301"
oLink1.Save

' 2. Acceso Directo de Configuración de la Clínica
Set oLink2 = WshShell.CreateShortcut(strDesktop & "\IMAGIS - Configurar Datos de la Clinica.lnk")
oLink2.TargetPath = strCurrentDir & "\CONFIGURAR_CLINICA.bat"
oLink2.WorkingDirectory = strCurrentDir
oLink2.Description = "Configurar Nombre, Dirección, Logotipo y Director Médico de la Clínica"
oLink2.WindowStyle = 1
oLink2.IconLocation = "shell32.dll, 269"
oLink2.Save
