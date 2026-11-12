#!/usr/bin/env bash
# Publish local release/ installers + electron-updater metadata to a GitHub Release.
# Copies artifacts to hyphenated names that match latest.yml / latest-mac.yml.
# Requires: gh auth login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-$(node -p "require('./package.json').version")}"
TAG="v${VERSION}"
REPO="${GITHUB_REPO:-landogz/-Corrlinks-Automation}"
PRODUCT="Inside Scores"
PRODUCT_HYPHEN="Inside-Scores"

need() {
  local path="$1"
  [[ -f "$path" ]] || { echo "Missing: $path" >&2; exit 1; }
}

need "release/latest.yml"
need "release/latest-mac.yml"
need "release/${PRODUCT} Setup ${VERSION}.exe"
need "release/${PRODUCT} Setup ${VERSION}.exe.blockmap"
need "release/${PRODUCT} ${VERSION}.exe"
need "release/${PRODUCT}-${VERSION}-mac.zip"
need "release/${PRODUCT}-${VERSION}-mac.zip.blockmap"
need "release/${PRODUCT}-${VERSION}-arm64-mac.zip"
need "release/${PRODUCT}-${VERSION}-arm64-mac.zip.blockmap"
need "release/${PRODUCT}-${VERSION}.dmg"
need "release/${PRODUCT}-${VERSION}.dmg.blockmap"
need "release/${PRODUCT}-${VERSION}-arm64.dmg"
need "release/${PRODUCT}-${VERSION}-arm64.dmg.blockmap"

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# GitHub asset names come from the uploaded filename. Spaces become dots and break
# electron-updater lookups against latest.yml, so stage hyphenated copies first.
# Also rewrite latest*.yml URLs to the hyphenated names.
python3 - <<PY
from pathlib import Path
version = "${VERSION}"
tmp = Path("${TMP}")
for name in ("latest.yml", "latest-mac.yml"):
    text = Path("release", name).read_text()
    text = text.replace(f"Inside Scores Setup {version}", f"Inside-Scores-Setup-{version}")
    text = text.replace(f"Inside Scores {version}", f"Inside-Scores-{version}")
    text = text.replace(f"Inside Scores-{version}", f"Inside-Scores-{version}")
    (tmp / name).write_text(text)
PY

cp "release/${PRODUCT} Setup ${VERSION}.exe" "$TMP/${PRODUCT_HYPHEN}-Setup-${VERSION}.exe"
cp "release/${PRODUCT} Setup ${VERSION}.exe.blockmap" "$TMP/${PRODUCT_HYPHEN}-Setup-${VERSION}.exe.blockmap"
cp "release/${PRODUCT} ${VERSION}.exe" "$TMP/${PRODUCT_HYPHEN}-${VERSION}.exe"
cp "release/${PRODUCT}-${VERSION}-mac.zip" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-mac.zip"
cp "release/${PRODUCT}-${VERSION}-mac.zip.blockmap" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-mac.zip.blockmap"
cp "release/${PRODUCT}-${VERSION}-arm64-mac.zip" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64-mac.zip"
cp "release/${PRODUCT}-${VERSION}-arm64-mac.zip.blockmap" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64-mac.zip.blockmap"
cp "release/${PRODUCT}-${VERSION}.dmg" "$TMP/${PRODUCT_HYPHEN}-${VERSION}.dmg"
cp "release/${PRODUCT}-${VERSION}.dmg.blockmap" "$TMP/${PRODUCT_HYPHEN}-${VERSION}.dmg.blockmap"
cp "release/${PRODUCT}-${VERSION}-arm64.dmg" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64.dmg"
cp "release/${PRODUCT}-${VERSION}-arm64.dmg.blockmap" "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64.dmg.blockmap"

NOTES="$(cat <<EOF
## Downloads

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | \`${PRODUCT_HYPHEN}-${VERSION}-arm64.dmg\` / \`-arm64-mac.zip\` |
| macOS (Intel) | \`${PRODUCT_HYPHEN}-${VERSION}.dmg\` / \`-mac.zip\` |
| Windows | \`${PRODUCT_HYPHEN}-Setup-${VERSION}.exe\` (installer) or portable \`.exe\` |

In-app updates use \`latest.yml\` / \`latest-mac.yml\` on this release.
EOF
)"

if ! gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Creating GitHub release ${TAG}..."
  gh release create "$TAG" \
    --repo "$REPO" \
    --title "Inside Scores ${VERSION}" \
    --notes "$NOTES"
else
  echo "Release ${TAG} already exists"
fi

echo "Uploading assets (hyphenated names for electron-updater)..."
gh release upload "$TAG" --repo "$REPO" --clobber \
  "$TMP/latest.yml" \
  "$TMP/latest-mac.yml" \
  "$TMP/${PRODUCT_HYPHEN}-Setup-${VERSION}.exe" \
  "$TMP/${PRODUCT_HYPHEN}-Setup-${VERSION}.exe.blockmap" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}.exe" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-mac.zip" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-mac.zip.blockmap" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64-mac.zip" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64-mac.zip.blockmap" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}.dmg" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}.dmg.blockmap" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64.dmg" \
  "$TMP/${PRODUCT_HYPHEN}-${VERSION}-arm64.dmg.blockmap"

echo "Published ${TAG} → https://github.com/${REPO}/releases/tag/${TAG}"
