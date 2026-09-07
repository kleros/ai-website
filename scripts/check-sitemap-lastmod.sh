#!/usr/bin/env bash
# Compare each sitemap <lastmod> against the last commit that touched that
# page, so a human can decide whether the change was substantive.
#
#   ./scripts/check-sitemap-lastmod.sh
#
# Nothing is rewritten. That is deliberate: Google uses lastmod only while it
# judges the value trustworthy, and a generator would bump all three dates on
# any commit touching all three files — which is exactly the dishonesty the
# policy in sitemap.xml forbids. Metadata edits, CSS tweaks and deploys are
# NOT content changes; leave the date alone for those.
#
# (This lives in a script rather than in a sitemap.xml comment because XML
# comments may not contain a double hyphen, and the command needs several.)

set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf '%-22s %-12s %-12s %s\n' PAGE SITEMAP LAST-COMMIT SUBJECT
drift=0
for f in index.html our-solutions.html builders.html; do
  case "$f" in
    index.html) loc="https://ai.kleros.io/" ;;
    *)          loc="https://ai.kleros.io/${f%.html}" ;;
  esac

  recorded="$(grep -A1 "<loc>${loc}</loc>" sitemap.xml \
    | sed -n 's/.*<lastmod>\(.*\)<\/lastmod>.*/\1/p')"
  actual="$(git log -1 --format=%cs -- "$f")"
  subject="$(git log -1 --format=%s -- "$f")"

  mark=""
  if [ "$recorded" != "$actual" ]; then mark="  <- differs"; drift=1; fi
  printf '%-22s %-12s %-12s %s%s\n' "$f" "${recorded:-MISSING}" "$actual" "${subject:0:44}" "$mark"
done

if [ "$drift" -eq 1 ]; then
  echo
  echo "A date differs from the last commit touching that file. That is only a"
  echo "problem if the commit changed the page's CONTENT. If it did, edit"
  echo "sitemap.xml by hand; if it was metadata, styling or a deploy, leave it."
fi
