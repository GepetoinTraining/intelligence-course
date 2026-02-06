# Bulk replace remaining users column refs
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $newContent = $content
        
        # Replace users.organizationId refs - these should use organizationMemberships or be removed
        # For now, delete these conditions as org filtering should use membership table
        $newContent = $newContent -replace "users\.organizationId", "organizationMemberships.organizationId"
        
        # Replace users.name -> persons.firstName (via join)
        $newContent = $newContent -replace "users\.name", "persons.firstName"
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent
            Write-Host "Updated: $($file.Name)"
        }
    }
}

Write-Host "Done!"
