# Update HTML Paths Script
# Updates all old relative paths to new Vite-compatible absolute paths

Write-Host "Updating paths in HTML files..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src" -Filter "*.html"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..." -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    
    # Update stylesheet links
    $content = $content -replace 'href="style\.css"', 'href="/styles/main.css"'
    $content = $content -replace 'href="../style\.css"', 'href="/styles/main.css"'
    
    # Update favicon
    $content = $content -replace 'href="\.\./Images/favicon\.svg"', 'href="/assets/images/favicon.svg"'
    $content = $content -replace 'href="Images/favicon\.svg"', 'href="/assets/images/favicon.svg"'
    
    # Update all image paths
    $content = $content -replace 'src="\.\./Images/', 'src="/assets/images/'
    $content = $content -replace 'src="Images/', 'src="/assets/images/'
    
    # Update video paths
    $content = $content -replace 'src="\.\./Videos/', 'src="/assets/videos/'
    $content = $content -replace 'src="Videos/', 'src="/assets/videos/'
    
    # Update navigation links
    $content = $content -replace 'href="\.\./index\.html"', 'href="/index.html"'
    $content = $content -replace 'href="index\.html"', 'href="/index.html"'
    $content = $content -replace 'href="projets\.html"', 'href="/projets.html"'
    $content = $content -replace 'href="projets-personnels\.html"', 'href="/projets-personnels.html"'
    $content = $content -replace 'href="projet-', 'href="/projet-'
    
    # Update script tags
    $content = $content -replace '<script src="script\.js"></script>', '<script type="module" src="/scripts/main.js"></script>'
    $content = $content -replace '<script src="\.\./script\.js"></script>', '<script type="module" src="/scripts/main.js"></script>'
    
    # Remove inline footer clock script (now in main.js)
    $content = $content -replace '(?s)<script>\s*function updateFooterClock\(\).*?</script>', ''
    $content = $content -replace '(?s)<script>\s*// Mise à jour de l''horloge.*?</script>', ''
    $content = $content -replace '(?s)<script>\s*// Lightbox.*?</script>', ''
    
    # Add skip-to-content link if missing
    if ($content -notmatch 'skip-to-content') {
        $content = $content -replace '(<body>)', '$1`n  <!-- Accessibility: Skip to main content -->`n  <a href="#main" class="skip-to-content">Aller au contenu principal</a>`n'
    }
    
    # Add main id if missing
    $content = $content -replace '<main>', '<main id="main">'
    
    # Add loading="lazy" to images
    $content = $content -replace '(<img[^>]+src="/assets/images/[^"]+")(?![^>]*loading)', '$1 loading="lazy"'
    
    # Add width/height to images where missing (for better CLS)
    # This is a basic implementation - adjust sizes as needed
    $content = $content -replace '(<img[^>]+src="/assets/images/[^"]+")(?![^>]*width)(?![^>]*height)', '$1 width="800" height="450"'
    
    # Update external libraries to use defer
    $content = $content -replace '(<script src="https://cdn\.jsdelivr\.net/particles\.js[^>]+)>', '$1 defer>'
    $content = $content -replace '(<script src="https://cdnjs\.cloudflare\.com/ajax/libs/jsmediatags[^>]+)>', '$1 defer>'
    
    # Add meta description if missing
    if ($content -notmatch '<meta name="description"') {
        $content = $content -replace '(<title>[^<]+</title>)', '$1`n  <meta name="description" content="Portfolio d''Enzo Morello - Projets et réalisations">'
    }
    
    # Add ARIA labels
    $content = $content -replace '<nav>', '<nav aria-label="Navigation principale">'
    $content = $content -replace '<button id="back-to-top"', '<button id="back-to-top" aria-label="Retour en haut de la page"'
    
    # Save updated content
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "✓ Updated $($file.Name)" -ForegroundColor Green
}

Write-Host "`nAll files updated successfully!" -ForegroundColor Cyan
Write-Host "You can now test the site at http://localhost:3000" -ForegroundColor Yellow
