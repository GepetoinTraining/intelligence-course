# Replace userId object property keys in insert/update operations
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Replacing userId object properties in $($files.Count) files..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Replace object property key userId with personId
        # Pattern: userId, (at start of line or after whitespace/newline)
        $content = $content -replace "(\s+)userId,(\r?\n)", '$1personId,$2'
        
        # Pattern: userId: value
        $content = $content -replace "(\s+)userId:", '$1personId:'
        
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
Write-Host "Object property userId→personId replacement complete! Files updated: $updated"
Write-Host "=========================================="
