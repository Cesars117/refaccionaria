# Configuración
$User = "u441730936"
$HostIP = "82.29.86.160"
$Port = "65002"
$RemotePath = "inventory-system"
$Conn = "$User@$HostIP"

Write-Host "--- DESPLIEGUE HOSTINGER V5 ---" -ForegroundColor Cyan
Write-Host "IMPORTANTE: Se te pedira la contrasena 3 VECES." -ForegroundColor Yellow
Write-Host "1. Para crear carpetas"
Write-Host "2. Para subir archivos"
Write-Host "3. Para instalar"
Write-Host "----------------------------------"

# 1. Preparar archivos
Write-Host "[1/5] Preparando archivos locales..."
$StandalonePath = ".next\standalone"
if (!(Test-Path "$StandalonePath\public")) { New-Item -ItemType Directory -Force -Path "$StandalonePath\public" | Out-Null }
if (!(Test-Path "$StandalonePath\.next\static")) { New-Item -ItemType Directory -Force -Path "$StandalonePath\.next\static" | Out-Null }
Copy-Item -Path "public\*" -Destination "$StandalonePath\public" -Recurse -Force | Out-Null
Copy-Item -Path ".next\static\*" -Destination "$StandalonePath\.next\static" -Recurse -Force | Out-Null

# 2. Comprimir
Write-Host "[2/5] Comprimiendo deploy.zip..."
if (Test-Path "deploy.zip") { Remove-Item "deploy.zip" }
Compress-Archive -Path "$StandalonePath\*" -DestinationPath "deploy.zip"

# 3. Crear Carpeta Remota
Write-Host "[3/5] Creando carpeta remota..." -ForegroundColor Cyan
Write-Host "   -> INGRESA CONTRASENA (1 de 3) <-" -ForegroundColor Yellow
# Usamos cmd /c y variables pre-construidas para evitar confusión de PowerShell
$MkdirCmd = "mkdir -p $RemotePath && rm -rf $RemotePath/*"
cmd /c "ssh -p $Port $Conn ""$MkdirCmd"""

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo conectar. Verifica tu password." -ForegroundColor Red
    exit
}

# 4. Subir Archivo
Write-Host "[4/5] Subiendo deploy.zip..." -ForegroundColor Cyan
Write-Host "   -> INGRESA CONTRASENA (2 de 3) <-" -ForegroundColor Yellow

# FIX: Usamos ${Conn} para que PowerShell no piense que $Conn: es una unidad de disco
$ScpTarget = "${Conn}:${RemotePath}/deploy.zip"
cmd /c "scp -P $Port deploy.zip $ScpTarget"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la subida del archivo." -ForegroundColor Red
    exit
}

# 5. Instalar
Write-Host "[5/5] Instalando y desplegando..." -ForegroundColor Cyan
Write-Host "   -> INGRESA CONTRASENA (3 de 3) <-" -ForegroundColor Yellow
$InstallCmd = "cd $RemotePath && unzip -o deploy.zip > /dev/null && rm deploy.zip && echo 'Instalando dependencias...' && npm install --omit=dev"
cmd /c "ssh -p $Port $Conn ""$InstallCmd"""

Write-Host "--- LISTO ---" -ForegroundColor Green
Write-Host "Ahora ve a tu panel de Hostinger y reinicia la aplicacion."
