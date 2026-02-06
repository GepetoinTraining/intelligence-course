# Replace .userId table property access with .personId
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Replacing .userId property access with .personId in $($files.Count) files..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Replace table.userId with table.personId
        # This catches patterns like: runAnnotations.userId, users.userId, todos.userId, etc.
        $content = $content -replace "\.userId\b", ".personId"
        
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
Write-Host ".userId→.personId replacement complete! Files updated: $updated"
Write-Host "=========================================="
