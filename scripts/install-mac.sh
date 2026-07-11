#!/bin/sh
# install-mac.sh - copy the m4l-strudel device folder into the Ableton
# User Library (Max For Live/m4l-strudel), replacing any previous install.
#
# The User Library path is read from the newest Live preferences file
# (~/Library/Preferences/Ableton/Live <version>/Library.cfg, <ProjectPath>);
# Live's default (~/Music/Ableton/User Library) is the fallback.
set -eu
device="m4l-strudel"
# The three device variants produced by the build (see scripts/postbuild.mjs).
amxd_files="alienmind-strudel-midi.amxd alienmind-strudel-sampler.amxd alienmind-strudel-audio.amxd"
probe="alienmind-strudel-midi.amxd"
here="$(cd "$(dirname "$0")" && pwd)"

# Source: ./m4l-strudel next to this script (zip layout) or ../dist/m4l-strudel (repo layout).
src="$here/$device"
[ -f "$src/$probe" ] || src="$here/../dist/$device"
[ -f "$src/$probe" ] || { echo "Device folder not found. Run 'pnpm build' first." >&2; exit 1; }

user_lib=""
cfg=$(ls -t "$HOME/Library/Preferences/Ableton/Live "*/Library.cfg 2>/dev/null | head -1 || true)
if [ -n "$cfg" ]; then
	p=$(sed -n 's/.*<ProjectPath Value="\([^"]*\)".*/\1/p' "$cfg" | head -1)
	if [ -n "$p" ]; then
		# ProjectPath may point at the library root that contains "User Library".
		if [ -d "$p/User Library" ]; then user_lib="$p/User Library"
		elif [ -d "$p" ]; then user_lib="$p"
		fi
	fi
fi
[ -n "$user_lib" ] || user_lib="$HOME/Music/Ableton/User Library"
[ -d "$user_lib" ] || { echo "Ableton User Library not found ($user_lib). Is Live installed?" >&2; exit 1; }

dest="$user_lib/Max For Live/$device"
rm -rf "$dest"
mkdir -p "$dest"
# Each .amxd is self-contained (UI + node engine embedded as payloads in wrapper.js).
for f in $amxd_files; do cp "$src/$f" "$dest/"; done

echo "Installed to $dest"
echo "In Live: User Library > Max For Live > $device > {midi, sampler, audio}"
