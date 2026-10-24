$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskRelease = Join-Path $taskRoot 'installation'
$taskStage = Join-Path $taskRelease ('.build-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
$taskBuild = Join-Path $taskStage 'Ceylon-Pure-Windows'
$taskFinal = Join-Path $taskRelease 'Ceylon-Pure-Windows'
$taskApplication = Join-Path $taskBuild 'Application'
New-Item -ItemType Directory -Path $taskApplication -Force | Out-Null
foreach ($taskName in @('server.js','database.js','auth.js','workspace.js','operations.js','package.json')) {
    Copy-Item -LiteralPath (Join-Path $taskRoot $taskName) -Destination $taskApplication
}
Copy-Item -LiteralPath (Join-Path $taskRoot 'public') -Destination $taskApplication -Recurse
New-Item -ItemType Directory -Path (Join-Path $taskApplication 'runtime'),(Join-Path $taskApplication 'data'),(Join-Path $taskApplication 'docs') -Force | Out-Null
Copy-Item -LiteralPath (Get-Command node.exe).Source -Destination (Join-Path $taskApplication 'runtime\node.exe')
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Node-LICENSE.txt') -Destination (Join-Path $taskApplication 'runtime\LICENSE.txt')
Copy-Item -LiteralPath (Join-Path $taskRoot 'docs\HANDOVER.md') -Destination (Join-Path $taskApplication 'docs')
foreach ($taskName in @('Open Ceylon Pure.vbs','Launch.ps1')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $taskName) -Destination $taskApplication }
foreach ($taskName in @('Install.cmd','READ FIRST.txt')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $taskName) -Destination $taskBuild }
$taskSetup = Join-Path $taskBuild 'Setup'
New-Item -ItemType Directory -Path $taskSetup -Force | Out-Null
foreach ($taskName in @('Install.ps1','Update.ps1')) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $taskName) -Destination $taskSetup }

# Native icon artwork, stored as an ICO containing a 256px PNG.
Add-Type -AssemblyName System.Drawing
$taskBitmap = New-Object System.Drawing.Bitmap(256,256)
$taskGraphics = [System.Drawing.Graphics]::FromImage($taskBitmap)
$taskGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$taskGraphics.Clear([System.Drawing.Color]::FromArgb(18,68,48))
$taskBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(231,255,242))
$taskFont = New-Object System.Drawing.Font('Georgia',92,[System.Drawing.FontStyle]::Bold)
$taskFormat = New-Object System.Drawing.StringFormat
$taskFormat.Alignment = [System.Drawing.StringAlignment]::Center
$taskFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$taskGraphics.DrawString('CP',$taskFont,$taskBrush,(New-Object System.Drawing.RectangleF(0,0,256,256)),$taskFormat)
$taskMemory = New-Object System.IO.MemoryStream
$taskBitmap.Save($taskMemory,[System.Drawing.Imaging.ImageFormat]::Png)
$taskPng = $taskMemory.ToArray()
$taskIconStream = [System.IO.File]::Create((Join-Path $taskApplication 'ceylon-pure.ico'))
$taskWriter = New-Object System.IO.BinaryWriter($taskIconStream)
$taskWriter.Write([uint16]0);$taskWriter.Write([uint16]1);$taskWriter.Write([uint16]1)
$taskWriter.Write([byte]0);$taskWriter.Write([byte]0);$taskWriter.Write([byte]0);$taskWriter.Write([byte]0)
$taskWriter.Write([uint16]1);$taskWriter.Write([uint16]32);$taskWriter.Write([uint32]$taskPng.Length);$taskWriter.Write([uint32]22);$taskWriter.Write($taskPng)
$taskWriter.Dispose();$taskMemory.Dispose();$taskGraphics.Dispose();$taskBitmap.Dispose();$taskBrush.Dispose();$taskFont.Dispose();$taskFormat.Dispose()

if (Get-ChildItem -LiteralPath (Join-Path $taskApplication 'data') -Force) { throw 'The installation data folder must be empty.' }
if ((Test-Path -LiteralPath (Join-Path $taskFinal 'Application\data')) -and (Get-ChildItem -LiteralPath (Join-Path $taskFinal 'Application\data') -Force)) { throw 'The extracted installation contains local data. Preserve that data before rebuilding this package.' }
$taskArchive = Join-Path $taskRelease 'Ceylon-Pure-Setup-Windows-x64.zip'
Compress-Archive -LiteralPath $taskBuild -DestinationPath $taskArchive -Force
$taskHash = (Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash
Set-Content -LiteralPath ($taskArchive + '.sha256.txt') -Value ($taskHash + '  ' + [System.IO.Path]::GetFileName($taskArchive))
# Only replace generated files inside this project's installation directory.
$taskBoundary = [IO.Path]::GetFullPath($taskRelease).TrimEnd('\') + '\'
foreach ($taskGeneratedPath in @($taskStage,$taskBuild,$taskFinal)) {
    if (-not [IO.Path]::GetFullPath($taskGeneratedPath).StartsWith($taskBoundary,[StringComparison]::OrdinalIgnoreCase)) { throw 'Generated package path is outside the installation directory.' }
}
if (Test-Path -LiteralPath $taskFinal) { Remove-Item -LiteralPath $taskFinal -Recurse -Force }
Move-Item -LiteralPath $taskBuild -Destination $taskFinal
Remove-Item -LiteralPath $taskStage
Write-Output ('Package: ' + $taskArchive)
Write-Output ('Source: ' + $taskFinal)
Write-Output ('SHA256: ' + $taskHash)
