# Bulk replace userId -> personId in API routes
$files = Get-ChildItem -Path "src\app\api" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $newContent = $content
        
        # Replace auth destructuring patterns
        $newContent = $newContent -replace "const \{ userId \} = await getApiAuth\(\)", "const { personId } = await getApiAuth()"
        $newContent = $newContent -replace "const \{ userId, orgId \} = await getApiAuthWithOrg\(\)", "const { personId, orgId } = await getApiAuthWithOrg()"
        $newContent = $newContent -replace "const \{ userId \} = await getApiAuthWithOrg\(\)", "const { personId } = await getApiAuthWithOrg()"
        
        # Replace !userId checks
        $newContent = $newContent -replace "if \(!userId\)", "if (!personId)"
        $newContent = $newContent -replace "!userId \|\|", "!personId ||"
        
        # Replace userId variable uses in db queries
        $newContent = $newContent -replace "eq\((\w+)\.userId, userId\)", 'eq($1.personId, personId)'
        $newContent = $newContent -replace "userId: userId", "personId: personId"
        $newContent = $newContent -replace "\{ userId,", "{ personId,"
        $newContent = $newContent -replace ", userId \}", ", personId }"
        $newContent = $newContent -replace ", userId,", ", personId,"
        
        if ($newContent -ne $content) {
            Set-Content $file.FullName $newContent
            Write-Host "Updated: $($file.Name)"
        }
    }
}

Write-Host "Done!"
