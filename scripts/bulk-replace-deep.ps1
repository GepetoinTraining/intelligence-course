# Bulk replace remaining users column refs - deeper scan
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" -Force

$updated = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and ($content -match "users\.(name|email|role|organizationId|avatarUrl)")) {
        $newContent = $content
        
        # Replace column refs
        $newContent = $newContent -replace "users\.email", "persons.primaryEmail"
        $newContent = $newContent -replace "users\.name", "persons.firstName"
        $newContent = $newContent -replace "users\.avatarUrl", "persons.avatarUrl"
        # For organizationId and role, these need to come from organizationMemberships
        # For now, let's comment them out to see what breaks
        $newContent = $newContent -replace "users\.organizationId", "/* MIGRATION: users.organizationId removed */ null"
        $newContent = $newContent -replace "users\.role", "/* MIGRATION: users.role removed */ null"
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent
            $updated++
            Write-Host "Updated: $($file.FullName)"
        }
    }
}

Write-Host "Done! Updated $updated files."
