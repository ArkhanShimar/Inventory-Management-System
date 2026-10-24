param([switch]$NoBrowser, [int]$PreferredPort = 43127)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$taskAppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskMutex = New-Object System.Threading.Mutex($false, 'Local\CeylonPureHomecareLauncher')
$taskLocked = $false
try {
    $taskLocked = $taskMutex.WaitOne(20000)
    if (-not $taskLocked) { throw 'Another launch is in progress. Please try again in a moment.' }
    $taskRuntime = Join-Path $taskAppRoot 'runtime\node.exe'
    if (-not (Test-Path -LiteralPath $taskRuntime)) { throw 'The included runtime is missing. Please reinstall the application.' }
    $taskDataRoot = Join-Path $taskAppRoot 'data'
    $taskLogRoot = Join-Path $taskDataRoot 'logs'
    New-Item -ItemType Directory -Path $taskLogRoot -Force | Out-Null
    $taskConfigPath = Join-Path $taskDataRoot 'launcher.json'
    $taskInstance = [Guid]::NewGuid().ToString()
    $taskSavedPort = $PreferredPort
    if (Test-Path -LiteralPath $taskConfigPath) {
        $taskConfig = Get-Content -LiteralPath $taskConfigPath -Raw | ConvertFrom-Json
        $taskGuid = [Guid]::Empty
        if (-not [Guid]::TryParse([string]$taskConfig.instanceId, [ref]$taskGuid)) { throw 'The launcher settings are damaged. Contact your installer to repair launcher.json; your database is safe.' }
        $taskInstance = $taskGuid.ToString()
        $taskSavedPort = [int]$taskConfig.port
        if ($taskSavedPort -lt 1024 -or $taskSavedPort -gt 65535) { throw 'The saved workspace port is invalid. Contact your installer to repair launcher.json.' }
    }
    function Test-Workspace([int]$taskPort) {
        try {
            $taskResponse = Invoke-RestMethod -Uri ("http://127.0.0.1:$taskPort/api/health") -TimeoutSec 1 -Proxy $null
            return ($taskResponse.application -eq 'ceylon-pure-homecare' -and $taskResponse.instanceId -eq $taskInstance)
        } catch { return $false }
    }
    $taskReadyPort = $null
    if (Test-Workspace $taskSavedPort) { $taskReadyPort = $taskSavedPort }
    if ($null -eq $taskReadyPort) {
        # Persist the installation identity before starting, including after an interrupted launch.
        $taskConfigTemp = $taskConfigPath + '.tmp'
        @{instanceId=$taskInstance;port=$taskSavedPort} | ConvertTo-Json | Set-Content -LiteralPath $taskConfigTemp -Encoding UTF8
        Move-Item -LiteralPath $taskConfigTemp -Destination $taskConfigPath -Force
        $taskCandidates = @($taskSavedPort) + @($PreferredPort..($PreferredPort + 19)) | Select-Object -Unique
        $taskLastError = ''
        foreach ($taskCandidate in $taskCandidates) {
            if (Test-Workspace $taskCandidate) { $taskReadyPort = $taskCandidate; break }
            # An occupied port belongs to another workspace or application. Leave it running.
            $taskListener = $null
            try {
                $taskListener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, [int]$taskCandidate)
                $taskListener.Start()
            } catch { continue } finally { if ($null -ne $taskListener) { $taskListener.Stop() } }
            Remove-Item Env:DB_PATH -ErrorAction SilentlyContinue
            $env:PORT = [string]$taskCandidate
            $env:WORKSPACE_INSTANCE = $taskInstance
            $taskStamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
            $taskOutput = Join-Path $taskLogRoot "server-$taskStamp-output.log"
            $taskErrors = Join-Path $taskLogRoot "server-$taskStamp-error.log"
            $taskProcess = Start-Process -FilePath $taskRuntime -ArgumentList @('server.js') -WorkingDirectory $taskAppRoot -WindowStyle Hidden -RedirectStandardOutput $taskOutput -RedirectStandardError $taskErrors -PassThru
            for ($taskAttempt = 0; $taskAttempt -lt 60; $taskAttempt++) {
                if (Test-Workspace $taskCandidate) { $taskReadyPort = $taskCandidate; break }
                $taskProcess.Refresh()
                if ($taskProcess.HasExited) { break }
                Start-Sleep -Milliseconds 200
            }
            if ($null -ne $taskReadyPort) { break }
            $taskLastError = if (Test-Path -LiteralPath $taskErrors) { (Get-Content -LiteralPath $taskErrors -Tail 18) -join [Environment]::NewLine } else { '' }
            if (-not $taskProcess.HasExited) {
                # Stop only the process created by this attempt; never another application's server.
                $taskProcess.Kill()
                throw "The workspace took too long to start. Logs: $taskLogRoot"
            }
            if ($taskLastError -notmatch 'EADDRINUSE|EACCES') { throw "The workspace could not start. Logs: $taskLogRoot`n`n$taskLastError" }
        }
        if ($null -eq $taskReadyPort) { throw "No local workspace port was available. Logs: $taskLogRoot`n`n$taskLastError" }
        @{instanceId=$taskInstance;port=[int]$taskReadyPort} | ConvertTo-Json | Set-Content -LiteralPath $taskConfigTemp -Encoding UTF8
        Move-Item -LiteralPath $taskConfigTemp -Destination $taskConfigPath -Force
    }
    $taskUrl = "http://127.0.0.1:$taskReadyPort/"
    if ($NoBrowser) { Write-Output $taskUrl } else { Start-Process $taskUrl }
} catch {
    if ($NoBrowser) { throw }
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Ceylon Pure Homecare', 'OK', 'Error') | Out-Null
} finally {
    if ($taskLocked) { $taskMutex.ReleaseMutex() }
    $taskMutex.Dispose()
}
