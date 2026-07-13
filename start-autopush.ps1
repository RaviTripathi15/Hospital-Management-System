# Monitors the workspace directory for changes and automatically auto-commits and auto-pushes to GitHub.

$folder = Get-Item .
$filter = "*.*"

$fsw = New-Object IO.FileSystemWatcher $folder, $filter
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " ACTIVE MONITORING: Auto-Pushing to GitHub on save..." -ForegroundColor Green
Write-Host " Press Ctrl+C to stop the watcher script." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # Exclude internal / build folders
    if ($path -like "*\.git\*" -or $path -like "*\node_modules\*" -or $path -like "*\dist\*" -or $path -like "*.system_generated*") {
        return
    }
    
    Write-Host "[$changeType] File changed: $path" -ForegroundColor Cyan
    Write-Host "Executing auto-commit and push..." -ForegroundColor Yellow
    
    # Stage, commit, and push
    git add .
    git commit -m "auto: synchronize updates on save [$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')]"
    git push origin main
    
    Write-Host "--> Synchronized successfully!" -ForegroundColor Green
    Write-Host "Waiting for next change..." -ForegroundColor Gray
}

# Bind watcher events
$handlers = @()
$handlers += Register-ObjectEvent $fsw Changed -Action $action
$handlers += Register-ObjectEvent $fsw Created -Action $action
$handlers += Register-ObjectEvent $fsw Deleted -Action $action

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Clean up event handlers on exit
    Write-Host "Stopping monitoring..." -ForegroundColor Red
    foreach ($h in $handlers) {
        Unregister-Event -SourceIdentifier $h.Name
    }
}
