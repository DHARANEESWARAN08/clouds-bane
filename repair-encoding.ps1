$path = ".\client\src\pages\Pages.tsx"

$content = [System.IO.File]::ReadAllText(
    (Resolve-Path $path),
    [System.Text.Encoding]::UTF8
)

# Build corrupted sequences from character codes.
$emDash = [string][char]0x00E2 + [char]0x20AC + [char]0x201D
$ellipsis = [string][char]0x00E2 + [char]0x20AC + [char]0x00A6
$apostrophe = [string][char]0x00E2 + [char]0x20AC + [char]0x2122
$middleDot = [string][char]0x00C2 + [char]0x00B7
$enDash = [string][char]0x00E2 + [char]0x20AC + [char]0x201C

# Keep fallbacks readable and UI punctuation simple.
$content = $content.Replace($emDash, "Unavailable")
$content = $content.Replace($ellipsis, "...")
$content = $content.Replace($apostrophe, "'")
$content = $content.Replace($middleDot, "|")
$content = $content.Replace($enDash, "-")

# Repair the project name if present.
$branding = "Cloud" + $apostrophe + "s Bane"
$content = $content.Replace($branding, "Cloud's Bane")

# Save UTF-8 without changing the JSX structure.
[System.IO.File]::WriteAllText(
    (Resolve-Path $path),
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Repair script completed. Verify the file before building."