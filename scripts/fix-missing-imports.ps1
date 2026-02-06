# Add missing organizationMemberships and persons imports to files that reference them
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Fixing missing imports in $($files.Count) files..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        $needsUpdate = $false
        
        # Check if file uses organizationMemberships but doesn't import it
        if ($content -match "organizationMemberships\." -and $content -notmatch "organizationMemberships[,\s\}].*from '@/lib/db/schema'") {
            # Find the schema import line and add organizationMemberships
            $content = $content -replace "(import \{[^}]+)(} from '@/lib/db/schema';)", {
                $imports = $matches[1]
                if ($imports -notmatch "organizationMemberships") {
                    $imports = $imports.TrimEnd() -replace "\s*$", ", organizationMemberships "
                }
                return $imports + $matches[2]
            }
            $needsUpdate = $true
        }
        
        # Check if file uses persons but doesn't import it
        if ($content -match "persons\." -and $content -notmatch "persons[,\s\}].*from '@/lib/db/schema'") {
            # Find the schema import line and add persons
            $content = $content -replace "(import \{[^}]+)(} from '@/lib/db/schema';)", {
                $imports = $matches[1]
                if ($imports -notmatch "\bpersons\b") {
                    $imports = $imports.TrimEnd() -replace "\s*$", ", persons "
                }
                return $imports + $matches[2]
            }
            $needsUpdate = $true
        }
        
        if ($needsUpdate -and $content -ne $originalContent) {
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
Write-Host "Missing imports fixed! Files updated: $updated"
Write-Host "=========================================="
