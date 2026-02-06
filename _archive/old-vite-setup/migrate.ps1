# Migration Script
# Moves assets to new public directory structure

Write-Host "Starting portfolio migration..." -ForegroundColor Cyan

# Create public subdirectories
$publicDirs = @(
    "public\assets\images",
    "public\assets\music",
    "public\assets\videos"
)

foreach ($dir in $publicDirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

# Copy Images
if (Test-Path "Images") {
    Write-Host "Copying images..." -ForegroundColor Yellow
    Copy-Item -Path "Images\*" -Destination "public\assets\images\" -Recurse -Force
    Write-Host "Images copied successfully" -ForegroundColor Green
}

# Copy Music
if (Test-Path "Music") {
    Write-Host "Copying music files..." -ForegroundColor Yellow
    Copy-Item -Path "Music\*" -Destination "public\assets\music\" -Force
    Write-Host "Music files copied successfully" -ForegroundColor Green
}

# Copy Videos
if (Test-Path "Videos") {
    Write-Host "Copying videos..." -ForegroundColor Yellow
    Copy-Item -Path "Videos\*" -Destination "public\assets\videos\" -Force
    Write-Host "Videos copied successfully" -ForegroundColor Green
}

Write-Host "`nMigration complete!" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host "2. Test all pages at http://localhost:3000" -ForegroundColor White
Write-Host "3. Run 'npm run build' when ready for production" -ForegroundColor White
