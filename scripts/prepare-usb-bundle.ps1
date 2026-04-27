param(
  [string]$OutputDir = "dist-tablet",
  [string]$BundleName = "inventory-system-tablet-usb.zip"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$OutputPath = Join-Path $ProjectRoot $OutputDir
$Staging = Join-Path $OutputPath "staging"
$BundlePath = Join-Path $OutputPath $BundleName

$requiredBackup = "backup-pre-sku-migration-2026-03-10T17-47-22-715Z.json"
$requiredBackupSrc = Join-Path $ProjectRoot (Join-Path "backups" $requiredBackup)

if (!(Test-Path $requiredBackupSrc)) {
  throw "Required backup not found: $requiredBackupSrc"
}

Write-Host "Preparing USB bundle from: $ProjectRoot"

if (Test-Path $OutputPath) {
  Remove-Item $OutputPath -Recurse -Force
}
New-Item -ItemType Directory -Path $Staging -Force | Out-Null

$dirsToCopy = @("app", "lib", "prisma", "public", "scripts")
$filesToCopy = @(
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "next-env.d.ts",
  "eslint.config.mjs",
  "README.md",
  ".env.local"
)

foreach ($dir in $dirsToCopy) {
  $src = Join-Path $ProjectRoot $dir
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination (Join-Path $Staging $dir) -Recurse -Force
  }
}

foreach ($file in $filesToCopy) {
  $src = Join-Path $ProjectRoot $file
  if (Test-Path $src) {
    Copy-Item -Path $src -Destination (Join-Path $Staging $file) -Force
  }
}

$backupTargetDir = Join-Path $Staging "backups"
New-Item -ItemType Directory -Path $backupTargetDir -Force | Out-Null
Copy-Item -Path $requiredBackupSrc -Destination (Join-Path $backupTargetDir $requiredBackup) -Force

# Remove files never needed on tablet runtime.
$removeIfExists = @(
  (Join-Path $Staging "node_modules"),
  (Join-Path $Staging ".next"),
  (Join-Path $Staging ".git"),
  (Join-Path $Staging ".vercel"),
  (Join-Path $Staging "prisma\local.db")
)
foreach ($path in $removeIfExists) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
  }
}

Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $BundlePath -Force

Write-Host ""
Write-Host "Bundle ready: $BundlePath" -ForegroundColor Green
Write-Host "Copy this ZIP to tablet storage and extract it." -ForegroundColor Green
Write-Host "Then in Termux run: bash scripts/setup-termux.sh" -ForegroundColor Green
