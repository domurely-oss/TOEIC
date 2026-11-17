# Updates public file names/IDs only; no sign-in, token, or transcript download.
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$folder = '1T7ukANBenmR298EYb2gFcpv1SAWtrMev'
$response = Invoke-WebRequest -UseBasicParsing -Uri ('https://drive.google.com/embeddedfolderview?id=' + $folder)
$items = @()
$seen = @{}
$pattern = '<a href="https://drive.google.com/file/d/([\w-]+)/[^"]*"[^>]*>(.*?)</a>'
foreach ($match in [regex]::Matches($response.Content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)) {
    $title = [regex]::Match($match.Groups[2].Value, 'class="flip-entry-title">(.*?)</div>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $fileId = $match.Groups[1].Value
    if ($title.Success -and -not $seen.ContainsKey($fileId)) {
        $name = [System.Net.WebUtility]::HtmlDecode([regex]::Replace($title.Groups[1].Value, '<[^>]+>', ''))
        $items += @{id=$fileId;name=$name}
        $seen[$fileId] = $true
    }
}
if ($items.Count -eq 0) { throw 'No public files found. Check folder sharing or Google page format. Existing catalog was preserved.' }
$payload = @{updated=(Get-Date -Format 'yyyy-MM-dd');files=@($items)} | ConvertTo-Json -Depth 5 -Compress
$destination = Join-Path $PSScriptRoot 'guest-catalog.js'
[System.IO.File]::WriteAllText($destination, ('window.TOEIC_GUEST_CATALOG = ' + $payload + ';'), (New-Object System.Text.UTF8Encoding($false)))
Write-Host ('Updated ' + $items.Count + ' public files. Upload guest-catalog.js to GitHub.')
