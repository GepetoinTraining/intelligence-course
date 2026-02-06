# Replace remaining userId variable uses with personId
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Found $($files.Count) files to scan for userId usages..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Only process files that have getApiAuthWithOrg (already migrated auth)
        # and still have userId references
        if ($content -match "getApiAuthWithOrg" -and $content -match "\buserId\b") {
            # Replace userId with personId (word boundary)
            # Skip if it's part of a property name like userId: or .userId
            # This is a simpler approach - replace all standalone userId with personId
            
            # Pattern: standalone userId that's not a property definition
            $content = $content -replace ": userId\b", ": personId"
            $content = $content -replace "= userId\b", "= personId"
            $content = $content -replace ", userId\)", ", personId)"
            $content = $content -replace ", userId,", ", personId,"
            $content = $content -replace "\(userId\)", "(personId)"
            $content = $content -replace "\(userId,", "(personId,"
        }
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $updated++
            Write-Host "Updated: $($file.FullName)"
        }
    } catch {
        Write-Host "Error: $($file.FullName) - $_"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "userId→personId replacement complete! Files updated: $updated"
Write-Host "=========================================="
