param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$taskScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskPackageRoot = if ((Split-Path -Leaf $taskScriptRoot) -eq 'Setup') { Split-Path -Parent $taskScriptRoot } else { $taskScriptRoot }
$taskSource = Join-Path $taskPackageRoot 'Application'
$taskTarget = Join-Path $env:LOCALAPPDATA 'Ceylon Pure Homecare'
$taskFiles = @('server.js','database.js','auth.js','workspace.js','operations.js','package.json','Launch.ps1','Open Ceylon Pure.vbs')
try {
    foreach ($taskFile in ($taskFiles + @('public\app.js','public\billing.js'))) {
        if (-not (Test-Path -LiteralPath (Join-Path $taskSource $taskFile))) { throw 'Extract the complete updated ZIP before running Install.cmd.' }
    }
    $taskRuntime = [IO.Path]::GetFullPath((Join-Path $taskTarget 'runtime\node.exe'))
    if (-not (Test-Path -LiteralPath $taskRuntime) -or -not (Test-Path -LiteralPath (Join-Path $taskTarget 'server.js'))) { throw 'The installed system was not found. Use Install.cmd for a new installation.' }
    $taskBackup = Join-Path $taskTarget ('data\updates\' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
    New-Item -ItemType Directory -Path $taskBackup -Force | Out-Null
    foreach ($taskFile in $taskFiles) { if (Test-Path -LiteralPath (Join-Path $taskTarget $taskFile)) { Copy-Item -LiteralPath (Join-Path $taskTarget $taskFile) -Destination $taskBackup } }
    foreach ($taskFolder in @('public','docs')) { if (Test-Path -LiteralPath (Join-Path $taskTarget $taskFolder)) { Copy-Item -LiteralPath (Join-Path $taskTarget $taskFolder) -Destination $taskBackup -Recurse } }
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
        $_.ExecutablePath -eq $taskRuntime -and $_.CommandLine -match 'server\.js'
    } | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction Stop }
    $taskDatabase = Join-Path $taskTarget 'data\inventory.sqlite'
    if (Test-Path -LiteralPath $taskDatabase) {
        $env:CEYLON_UPDATE_DATABASE = $taskDatabase
        $env:CEYLON_UPDATE_BACKUP = Join-Path $taskBackup 'inventory.sqlite'
        & $taskRuntime --input-type=module -e "import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(process.env.CEYLON_UPDATE_DATABASE,{readOnly:true});if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('The current database needs repair before updating');db.prepare('VACUUM INTO ?').run(process.env.CEYLON_UPDATE_BACKUP);db.close();"
        if ($LASTEXITCODE -ne 0) { throw 'The safety backup failed. Application files were not changed.' }
        Remove-Item Env:CEYLON_UPDATE_DATABASE,Env:CEYLON_UPDATE_BACKUP -ErrorAction SilentlyContinue
    }
    foreach ($taskFile in $taskFiles) { Copy-Item -LiteralPath (Join-Path $taskSource $taskFile) -Destination (Join-Path $taskTarget $taskFile) -Force }
    foreach ($taskFolder in @('public','docs')) { Copy-Item -LiteralPath (Join-Path $taskSource $taskFolder) -Destination $taskTarget -Recurse -Force }
    # The data directory, installation identity, shortcuts and runtime are retained.
    if ($NoBrowser) { & (Join-Path $taskTarget 'Launch.ps1') -NoBrowser }
    else { & (Join-Path $taskTarget 'Launch.ps1') }
} catch {
    if ($NoBrowser) { throw }
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Update Ceylon Pure Homecare', 'OK', 'Error') | Out-Null
}
