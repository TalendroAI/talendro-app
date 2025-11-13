# extract-code.ps1
# PowerShell script to extract all parsing pipeline code files

$outputFile = "D:\download\Node_js_New\talendro-developer-package\server\TEST_Folder\PARSING_PIPELINE_CODE.txt"
$serverRoot = "D:\download\Node_js_New\talendro-developer-package\server"

# Define files to extract (excluding ._ macOS artifacts)
# Organized by function for clarity
$filesToExtract = @(
    # ============================================================
    # CORE ENTRY POINTS
    # ============================================================
    "index.js",                          # Main server entry point
    
    # ============================================================
    # API ROUTES - File intake and response formatting
    # ============================================================
    "routes\parse.js",                   # POST /api/resume/parse - Affinda-only route
    "routes\dashboard.js",               # Dashboard/job status routes
    
    # ============================================================
    # AFFINDA INTEGRATION - External parser adapter
    # ============================================================
    "vendor\affindaAdapter.js",          # v3 upload flow, workspace/documentType, wait=true
    
    # ============================================================
    # DATA MAPPERS - Transform Affinda response to app schema
    # ============================================================
    "mappers\mapToProfileDraft.js",      # Maps raw Affinda data to profileDraft/prefill
    "mappers\transforms.js",             # extractEmail, parseLocation, normalizeDate, extractSkills
    
    # ============================================================
    # PARSING PIPELINES - Alternative/fallback parsers
    # ============================================================
    "parsing-gateway.js",                # Normalized pipeline using mammoth/pdf-parse
    "resume-parser.js",                  # Active parser (check which one is imported)
    "resume-parser-final.js",            # Parser variant
    "resume-parser-robust.js",           # Parser variant
    "resume-parser-ultimate.js",         # Parser variant
    "resume-parser-working.js",          # Parser variant
    
    # ============================================================
    # FILE PROCESSING UTILITIES
    # ============================================================
    "docx-extractor.js",                 # DOCX text extraction
    "json-resume-schema.js",             # Schema definitions
    "profileDraftStore.js",              # Storage/caching layer
    
    # ============================================================
    # MIDDLEWARE - Upload handling and validation
    # ============================================================
    "middleware\formatProtection.js",    # File format validation
    "middleware\upload.js",              # Multer upload configuration (if exists)
    
    # ============================================================
    # CONFIGURATION - API keys, settings
    # ============================================================
    "config\affinda.js",                 # Affinda workspace/API config (if exists)
    "config\multer.js",                  # Multer storage config (if exists)
    
    # ============================================================
    # UTILITIES - Helper functions
    # ============================================================
    "utils\fileValidator.js",            # File validation utilities (if exists)
    "utils\textExtractor.js",            # Text extraction helpers (if exists)
    
    # ============================================================
    # TESTS - Quality validation and response contracts
    # ============================================================
    "test\resume-parser-quality-test.js",    # The test that validates summary object
    "test\test-summary-response.js",         # Summary response contract test (if exists)
    "test\affinda-integration-test.js"       # Affinda integration test (if exists)
)

# Clear output file if exists
if (Test-Path $outputFile) {
    Remove-Item $outputFile
}

# Header
@"
================================================================================
TALENDRO RESUME PARSER - PARSING PIPELINE CODE EXTRACTION
================================================================================
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Purpose: Analyze Affinda integration and data mapping flow
Server Path: $serverRoot

EXTRACTION TARGETS:
-------------------
✓ Routes: File intake endpoints (parse.js)
✓ Adapter: Affinda v3 integration (wait=true, documentType)
✓ Mappers: profileDraft/prefill transformation logic
✓ Transforms: Field extraction and normalization helpers
✓ Middleware: Upload handling (multer, formatProtection)
✓ Tests: Quality validation and expected response contracts

KNOWN ISSUES TO FIX:
--------------------
• Response format: Currently returns prefill/profileDraft instead of summary
• Field mapping: Name=N/A, skillsCount=0, workCount=0, eduCount=0
• Synchronous parsing: Need wait=true in Affinda adapter
• Array preservation: Skills/work/education may be collapsed
• Field name mismatch: Client sends "resume", server expects "file"

================================================================================

"@ | Out-File -FilePath $outputFile -Encoding UTF8

# Statistics
$foundFiles = 0
$missingFiles = 0

# Extract each file
foreach ($file in $filesToExtract) {
    $fullPath = Join-Path $serverRoot $file
    
    if (Test-Path $fullPath) {
        $foundFiles++
        Write-Host "✅ Extracting: $file" -ForegroundColor Green
        
        @"

################################################################################
# FILE: $file
# PATH: $fullPath
# SIZE: $((Get-Item $fullPath).Length) bytes
################################################################################

"@ | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        Get-Content $fullPath -Encoding UTF8 | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
        @"


################################################################################
# END OF FILE: $file
################################################################################


"@ | Out-File -FilePath $outputFile -Append -Encoding UTF8
        
    } else {
        $missingFiles++
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        
        @"

################################################################################
# FILE NOT FOUND: $file
# Note: This file may not exist in the project or may be optional
################################################################################


"@ | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
}

# Footer with statistics
@"

================================================================================
EXTRACTION COMPLETE
================================================================================
Total files targeted: $($filesToExtract.Count)
Files extracted: $foundFiles
Files not found: $missingFiles
Output file: $outputFile
Output size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB

NEXT STEPS:
-----------
1. Review routes\parse.js for response format alignment
2. Check vendor\affindaAdapter.js for wait=true parameter
3. Audit mappers\mapToProfileDraft.js for array preservation
4. Validate transforms.js field extraction logic
5. Compare actual response with test\resume-parser-quality-test.js expectations

FAST FIXES TO IMPLEMENT:
-------------------------
✓ Add summary object in parse route response
✓ Set wait=true in Affinda upload call
✓ Match multipart field name (file vs resume)
✓ Loosen work/education fallback conditions
✓ Preserve arrays from Affinda verbatim
✓ Compose candidate name robustly (first + last)

================================================================================

"@ | Out-File -FilePath $outputFile -Append -Encoding UTF8

# Console summary
Write-Host "`n✨ Extraction complete!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Statistics:" -ForegroundColor White
Write-Host "   • Files extracted: $foundFiles" -ForegroundColor Green
Write-Host "   • Files missing: $missingFiles" -ForegroundColor Yellow
Write-Host "   • Total targeted: $($filesToExtract.Count)" -ForegroundColor White
Write-Host "`n📄 Output saved to:" -ForegroundColor White
Write-Host "   $outputFile" -ForegroundColor Cyan
Write-Host "   Size: $([math]::Round((Get-Item $outputFile).Length / 1KB, 2)) KB" -ForegroundColor Gray
Write-Host "`n🔧 To convert to Word document, use:" -ForegroundColor Yellow
Write-Host "   .\extract-code-to-word.ps1" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Optional: Open the file in default text editor
$openFile = Read-Host "Open output file now? (y/n)"
if ($openFile -eq 'y' -or $openFile -eq 'Y') {
    Start-Process notepad.exe $outputFile
}
