# Bulk replace users.email -> persons.primaryEmail in API routes
# Note: These all need JOINs to persons table, but first pass just updates column refs
$files = Get-ChildItem -Path "src\app\api" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $newContent = $content
        
        # Replace users.email -> persons.primaryEmail
        $newContent = $newContent -replace "users\.email", "persons.primaryEmail"
        $newContent = $newContent -replace "users\.name", "persons.firstName"
        $newContent = $newContent -replace "users\.avatarUrl", "persons.avatarUrl"
        $newContent = $newContent -replace "users\.role", "organizationMemberships.role"
        
        # Replace userEmail -> personEmail in variable names
        $newContent = $newContent -replace "userEmail:", "personEmail:"
        $newContent = $newContent -replace "targetUserEmail:", "targetPersonEmail:"
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent
            Write-Host "Updated: $($file.Name)"
        }
    }
}

Write-Host "Done!"
