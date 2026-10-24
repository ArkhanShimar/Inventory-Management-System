param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$taskScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskSource = if ((Split-Path -Leaf $taskScriptRoot) -eq 'Setup') { Split-Path -Parent $taskScriptRoot } else { $taskScriptRoot }
$taskTarget = Join-Path $env:LOCALAPPDATA 'Ceylon Pure Homecare'
try {
    if (-not [Environment]::Is64BitOperatingSystem) { throw 'This package requires 64-bit Windows.' }
    $taskAppSource = Join-Path $taskSource 'Application'
    if (-not (Test-Path -LiteralPath (Join-Path $taskAppSource 'runtime\node.exe'))) { throw 'Please extract the complete ZIP before running Install.cmd.' }
    if (Test-Path -LiteralPath (Join-Path $taskTarget 'server.js')) {
        & (Join-Path $taskScriptRoot 'Update.ps1') -NoBrowser:$NoBrowser
        return
    }
    New-Item -ItemType Directory -Path $taskTarget -Force | Out-Null
    Get-ChildItem -LiteralPath $taskAppSource | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $taskTarget -Recurse -Force }
    $taskShell = New-Object -ComObject WScript.Shell
    $taskDesktop = [Environment]::GetFolderPath('Desktop')
    $taskLink = $taskShell.CreateShortcut((Join-Path $taskDesktop 'Ceylon Pure Homecare.lnk'))
    $taskLink.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
    $taskLink.Arguments = '"' + (Join-Path $taskTarget 'Open Ceylon Pure.vbs') + '"'
    $taskLink.WorkingDirectory = $taskTarget
    $taskLink.IconLocation = Join-Path $taskTarget 'ceylon-pure.ico'
    $taskLink.Description = 'Inventory, shop orders and collections'
    $taskLink.Save()
    $taskStartMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Ceylon Pure Homecare'
    New-Item -ItemType Directory -Path $taskStartMenu -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $taskDesktop 'Ceylon Pure Homecare.lnk') -Destination $taskStartMenu
    $taskDataLink = $taskShell.CreateShortcut((Join-Path $taskStartMenu 'Data and backups.lnk'))
    $taskDataLink.TargetPath = Join-Path $taskTarget 'data'
    New-Item -ItemType Directory -Path $taskDataLink.TargetPath -Force | Out-Null
    $taskDataLink.Save()
    if ($NoBrowser) { & (Join-Path $taskTarget 'Launch.ps1') -NoBrowser }
    else {
        [System.Windows.Forms.MessageBox]::Show('Installation complete. Use the Ceylon Pure Homecare icon on your desktop. Your browser will open automatically. On first use, create your own PIN.', 'Ceylon Pure Homecare', 'OK', 'Information') | Out-Null
        Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList ('"' + (Join-Path $taskTarget 'Open Ceylon Pure.vbs') + '"') -WindowStyle Hidden
    }
} catch {
    if ($NoBrowser) { throw }
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Installation', 'OK', 'Error') | Out-Null
}
