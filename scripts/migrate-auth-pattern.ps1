# Bulk migrate auth pattern across all API routes
# Replaces: const { userId } = await auth() → const { personId, orgId } = await getApiAuthWithOrg()
# Also replaces userId variable uses with personId

$apiPath = "src\app\api"
$updated = 0
$skipped = 0

# Get all TS files in api directory
$files = Get-ChildItem -Path $apiPath -Recurse -Include "*.ts" -Force

foreach ($file in $files) {
    try {
        $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction Stop
        if (-not $content) { continue }
        
        $originalContent = $content
        $changed = $false
        
        # Pattern 1: Replace auth import with getApiAuthWithOrg import
        if ($content -match "import \{ auth \} from '@clerk/nextjs/server'") {
            $content = $content -replace "import \{ auth \} from '@clerk/nextjs/server';", "import { getApiAuthWithOrg } from '@/lib/auth';"
            $changed = $true
        }
        
        # Pattern 2: Replace auth() destructuring → getApiAuthWithOrg()
        # const { userId } = await auth(); → const { personId, orgId } = await getApiAuthWithOrg();
        if ($content -match "const \{ userId \} = await auth\(\)") {
            $content = $content -replace "const \{ userId \} = await auth\(\);", "const { personId, orgId } = await getApiAuthWithOrg();"
            $changed = $true
        }
        
        # Pattern 3: Replace if (!userId) checks with if (!personId)
        if ($content -match "if \(!userId\)") {
            $content = $content -replace "if \(!userId\)", "if (!personId)"
            $changed = $true
        }
        
        # Pattern 4: Replace userId variable uses with personId (careful - only standalone word)
        # Skip patterns that are part of object property names like userId: or .userId
        # Replace standalone userId variable references
        if ($content -match "\buserId\b" -and $content -notmatch "getApiAuthWithOrg") {
            # Only replace if we're not in a schema definition context
            if ($content -notmatch "userId:.*z\.string") {
                $content = $content -replace "([^\.])userId([^:])", '$1personId$2'
                $changed = $true
            }
        }
        
        if ($changed -and $content -ne $originalContent) {
            Set-Content -LiteralPath $file.FullName -Value $content -NoNewline
            $updated++
            Write-Host "Updated: $($file.Name)"
        } else {
            $skipped++
        }
    } catch {
        Write-Host "Error processing: $($file.FullName) - $_"
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Migration complete!"
Write-Host "Files updated: $updated"
Write-Host "Files skipped: $skipped"
Write-Host "=========================================="
