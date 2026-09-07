#!/usr/bin/env bash
# Rasterize scripts/og-card.svg -> og-card.png, and favicon.svg -> logo-512.png.
#
# Hand-run, NOT a build step. Netlify never executes this; the PNGs are
# committed. Run it only when the card artwork changes, then eyeball the
# result before committing.
#
#   ./scripts/render-og-card.sh
#
# Why it is more than two rsvg-convert calls: the card sets Manrope and
# DM Mono, and neither is installed on a typical machine. Without them
# fontconfig silently substitutes Verdana and Andale Mono and you get a
# plausible-looking, off-brand card with no warning. So this script fetches
# the two fonts into a temp dir and points fontconfig at it for the duration.
# Nothing is installed system-wide.
#
# NOTE: og:image is cached hard by social scrapers, keyed on URL. If the
# artwork changes materially, ship it as og-card-2.png and update the six
# <meta property="og:image"> / twitter:image tags rather than overwriting.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for bin in rsvg-convert magick curl; do
  command -v "$bin" >/dev/null || { echo "missing: $bin" >&2; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/fonts" "$WORK/cache"

                                                                        # noqa
# Fetch STATIC instances at the exact weights the card uses. Google Fonts
# serves woff2 to a modern UA and plain TTF to an ancient one, so we ask as
# Android 4. The upstream google/fonts repo only ships Manrope as a variable
# font whose default instance is ExtraLight — rsvg-convert does not select a
# named instance from `font-weight`, so using it would render the headline in
# ExtraLight and look merely "a bit off" rather than obviously broken.
echo "fetching fonts…"
UA="Mozilla/5.0 (Linux; U; Android 4.0.3; en-us)"
fetch_font() {  # $1 = family query, $2 = output basename
  local url
  url="$(curl -fsSL -H "User-Agent: $UA" \
    "https://fonts.googleapis.com/css2?family=$1" \
    | grep -o "https://[^)]*\.ttf" | head -1)"
  [ -n "$url" ] || { echo "no TTF found for $1" >&2; exit 1; }
  curl -fsSL -o "$WORK/fonts/$2.ttf" "$url"
}
fetch_font "Manrope:wght@500"  Manrope-Medium
fetch_font "DM+Mono:wght@400"  DMMono-Regular
fetch_font "DM+Mono:wght@500"  DMMono-Medium

cat > "$WORK/fonts.conf" <<EOF
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>$WORK/fonts</dir>
  <cachedir>$WORK/cache</cachedir>
</fontconfig>
EOF
export FONTCONFIG_FILE="$WORK/fonts.conf"
fc-cache -f "$WORK/fonts" >/dev/null 2>&1

# REQUIRED on macOS. rsvg-convert draws through PangoCairo, whose default
# font backend here is CoreText — which ignores fontconfig completely, so
# FONTCONFIG_FILE alone changes nothing and every glyph silently comes out in
# Helvetica. This forces the fontconfig backend.
export PANGOCAIRO_BACKEND=fc

# Verify by RENDERING, not by asking fontconfig. fc-match honours
# FONTCONFIG_FILE even when the renderer does not, so it will happily report
# success while the card comes out in the wrong typeface — which is exactly
# what happened while writing this. In a monospaced face "iiii" and "WWWW"
# have identical advance widths; in a proportional fallback they do not.
probe() { # $1 = text -> trimmed pixel width
  printf '%s' "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='80'>
    <text x='10' y='50' font-family='DM Mono' font-size='40' fill='#000'>$1</text></svg>" \
    | rsvg-convert -f png 2>/dev/null \
    | magick png:- -trim +repage -format '%w' info:
}
narrow="$(probe iiii)"; wide="$(probe WWWW)"
if [ "$narrow" -eq 0 ] 2>/dev/null || [ "$wide" -eq 0 ] 2>/dev/null; then
  echo "font probe rendered nothing" >&2; exit 1
fi
# -trim measures the ink box, not the advance, so even a monospaced face is a
# little narrower for "iiii" than for "WWWW". Measured on this card: 1.09x with
# DM Mono applied, 4.87x when it is substituted. 1.5x separates them safely.
if [ "$((wide * 10))" -gt "$((narrow * 15))" ]; then
  echo "DM Mono is not being applied (iiii=${narrow}px vs WWWW=${wide}px)." >&2
  echo "The renderer is substituting a proportional font." >&2
  exit 1
fi
echo "fonts ok: Manrope, DM Mono (verified by render, iiii=${narrow}px WWWW=${wide}px)"

# -alpha remove: some scrapers composite transparent PNGs onto white, which
# would wreck a dark card.
rsvg-convert -w 1200 -h 630 -b '#090614' -f png scripts/og-card.svg \
  | magick png:- -alpha remove -alpha off -strip \
    -define png:compression-level=9 og-card.png

rsvg-convert -w 512 -h 512 -f png favicon.svg \
  | magick png:- -alpha remove -alpha off -strip \
    -define png:compression-level=9 logo-512.png

magick identify og-card.png logo-512.png
echo "done — eyeball og-card.png before committing"
