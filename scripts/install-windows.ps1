# install-windows.ps1 - copy the m4l-strudel device folder into the Ableton
# User Library (Max For Live/m4l-strudel), replacing any previous install.
#
# The User Library path is read from the newest Live preferences file
# (%APPDATA%\Ableton\Live <version>\Preferences\Library.cfg, <ProjectPath>);
# Live's default location is used as a fallback. No registry or env vars are
# involved - Live keeps all of this in plain config files.
$ErrorActionPreference = "Stop"
$deviceName = "m4l-strudel"
# The three device variants produced by the build (see scripts/postbuild.mjs).
$amxdFiles = @(
    "alienmind-strudel-midi.amxd",
    "alienmind-strudel-sampler.amxd",
    "alienmind-strudel-audio.amxd"
)

# Source: ./m4l-strudel next to this script (zip layout) or ../dist/m4l-strudel (repo layout).
$src = Join-Path $PSScriptRoot $deviceName
if (-not (Test-Path (Join-Path $src $amxdFiles[0]))) {
    $src = Join-Path (Split-Path $PSScriptRoot) "dist\$deviceName"
}
if (-not (Test-Path (Join-Path $src $amxdFiles[0]))) {
    Write-Error "Device folder not found next to this script or in dist\. Run 'pnpm build' first."
}

# User Library: newest Library.cfg wins.
$userLib = $null
$cfg = Get-ChildItem "$env:APPDATA\Ableton\Live *\Preferences\Library.cfg" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($cfg) {
    $m = [regex]::Match((Get-Content $cfg.FullName -Raw), '<ProjectPath Value="([^"]+)"')
    if ($m.Success) {
        $p = $m.Groups[1].Value -replace "/", "\"
        # ProjectPath may point at the library root that contains "User Library".
        if (Test-Path (Join-Path $p "User Library")) { $userLib = Join-Path $p "User Library" }
        elseif (Test-Path $p) { $userLib = $p }
    }
}
if (-not $userLib) {
    $userLib = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Ableton\User Library"
}
if (-not (Test-Path $userLib)) {
    Write-Error "Ableton User Library not found ($userLib). Is Live installed?"
}

$dest = Join-Path $userLib "Max For Live\$deviceName"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Force $dest | Out-Null
# Each .amxd is self-contained (UI + node engine embedded as payloads in wrapper.js).
foreach ($f in $amxdFiles) {
    Copy-Item (Join-Path $src $f) $dest -Force
}

Write-Host "Installed to $dest"
Write-Host "In Live: User Library > Max For Live > $deviceName > {midi, sampler, audio}"
