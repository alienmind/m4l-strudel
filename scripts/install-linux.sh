#!/bin/sh
# install-linux.sh - copy the m4l-strudel device folder into an Ableton
# User Library inside a Wine prefix (Live has no native Linux build).
#
# Looks for Library.cfg under the Wine prefix's AppData
# ($WINEPREFIX or ~/.wine: drive_c/users/*/AppData/Roaming/Ableton/...),
# falling back to the default Documents/Ableton/User Library in the prefix.
set -eu
device="m4l-strudel"
here="$(cd "$(dirname "$0")" && pwd)"
prefix="${WINEPREFIX:-$HOME/.wine}"

# Source: ./m4l-strudel next to this script (zip layout) or ../dist/m4l-strudel (repo layout).
src="$here/$device"
[ -f "$src/$device.amxd" ] || src="$here/../dist/$device"
[ -f "$src/$device.amxd" ] || { echo "Device folder not found. Run 'pnpm build' first." >&2; exit 1; }

[ -d "$prefix/drive_c" ] || { echo "No Wine prefix at $prefix (set WINEPREFIX). Live is not native on Linux." >&2; exit 1; }

user_lib=""
cfg=$(ls -t "$prefix"/drive_c/users/*/AppData/Roaming/Ableton/Live\ */Preferences/Library.cfg 2>/dev/null | head -1 || true)
if [ -n "$cfg" ]; then
	p=$(sed -n 's/.*<ProjectPath Value="\([^"]*\)".*/\1/p' "$cfg" | head -1)
	if [ -n "$p" ]; then
		# Map a Windows path like C:/Users/... onto the prefix.
		drive=$(printf '%s' "$p" | cut -c1 | tr 'A-Z' 'a-z')
		unix="$prefix/drive_$drive/$(printf '%s' "$p" | cut -c4- | tr '\\' '/')"
		if [ -d "$unix/User Library" ]; then user_lib="$unix/User Library"
		elif [ -d "$unix" ]; then user_lib="$unix"
		fi
	fi
fi
if [ -z "$user_lib" ]; then
	user_lib=$(ls -d "$prefix"/drive_c/users/*/Documents/Ableton/User\ Library 2>/dev/null | head -1 || true)
fi
[ -n "$user_lib" ] && [ -d "$user_lib" ] || { echo "Ableton User Library not found in $prefix." >&2; exit 1; }

dest="$user_lib/Max For Live/$device"
rm -rf "$dest"
mkdir -p "$dest"
cp -R "$src/." "$dest/"

echo "Installed to $dest"
echo "In Live: User Library > Max For Live > $device > $device.amxd"
