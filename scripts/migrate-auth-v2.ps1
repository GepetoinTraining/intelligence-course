# Fixed bulk migrate script that properly handles [id] bracket paths
$apiPath = "src\app\api"
$updated = 0

# Get all TS files using -LiteralPath approach via Get-ChildItem
$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Found $($files.Count) files to scan..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        
        # Pattern 1: Replace import { auth } from '@clerk/nextjs/server' 
        $content = $content -replace "import \{ auth \} from '@clerk/nextjs/server';", "import { getApiAuthWithOrg } from '@/lib/auth';"
        
        # Pattern 2: const { userId } = await auth(); → const { personId, orgId } = await getApiAuthWithOrg();
        $content = $content -replace "const \{ userId \} = await auth\(\);", "const { personId, orgId } = await getApiAuthWithOrg();"
        
        # Pattern 2b: const { userId, orgId } = await auth(); → const { personId, orgId } = await getApiAuthWithOrg();
        $content = $content -replace "const \{ userId, orgId \} = await auth\(\);", "const { personId, orgId } = await getApiAuthWithOrg();"
        
        # Pattern 3: if (!userId) → if (!personId)
        $content = $content -replace "if \(!userId\)", "if (!personId)"
        
        # Pattern 4: if (!userId || → if (!personId ||
        $content = $content -replace "if \(!userId \|\|", "if (!personId ||"
        
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
Write-Host "Migration complete! Files updated: $updated"
Write-Host "=========================================="
