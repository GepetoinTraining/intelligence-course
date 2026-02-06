# Comprehensive script to add missing schema imports
$apiPath = "src\app\api"
$updated = 0

$files = Get-ChildItem -Path $apiPath -Recurse -Filter "*.ts" -File

Write-Host "Scanning $($files.Count) files for missing imports..."

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if (-not $content) { continue }
        
        $originalContent = $content
        $changed = $false
        
        # Check what tables are used
        $needsPersons = ($content -match "\bpersons\.") -and ($content -notmatch "import.*\bpersons\b.*from '@/lib/db/schema'")
        $needsOrgMemberships = ($content -match "\borganizationMemberships\.") -and ($content -notmatch "import.*\borganizationMemberships\b.*from '@/lib/db/schema'")
        
        if ($needsPersons -or $needsOrgMemberships) {
            # Find schema import line
            if ($content -match "import \{([^}]+)\} from '@/lib/db/schema';") {
                $currentImports = $matches[1]
                $newImports = $currentImports
                
                if ($needsPersons -and $currentImports -notmatch "\bpersons\b") {
                    $newImports = $newImports.TrimEnd() + ", persons"
                    $changed = $true
                }
                if ($needsOrgMemberships -and $currentImports -notmatch "\borganizationMemberships\b") {
                    $newImports = $newImports.TrimEnd() + ", organizationMemberships"
                    $changed = $true
                }
                
                if ($changed) {
                    $content = $content -replace "import \{[^}]+\} from '@/lib/db/schema';", "import {$newImports } from '@/lib/db/schema';"
                }
            }
        }
        
        if ($changed -and $content -ne $originalContent) {
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
Write-Host "Fixed $updated files with missing schema imports"
Write-Host "=========================================="
