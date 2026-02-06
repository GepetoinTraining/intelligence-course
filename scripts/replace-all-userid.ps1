# Comprehensive replacement for ALL remaining userId occurrences
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Replacing ALL remaining userId occurrences in $($files.Count) files..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Only process files that have getApiAuthWithOrg (already migrated auth)
        if ($content -match "getApiAuthWithOrg") {
            # Replace ALL word-boundary userId with personId
            $content = $content -replace "\buserId\b", "personId"
        }
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $updated++
            Write-Host "Updated: $($file.Name)"
        }
    } catch {
        Write-Host "Error: $($file.FullName) - $_"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Comprehensive userId→personId replacement complete! Files updated: $updated"
Write-Host "=========================================="
