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

need() {
  local path="$1"
  [[ -f "$path" ]] || { echo "Missing: $path" >&2; exit 1; }
}

need "release/latest.yml"
need "release/latest-mac.yml"
need "release/Inmate Exchange Auto Setup ${VERSION}.exe"
need "release/Inmate Exchange Auto Setup ${VERSION}.exe.blockmap"
need "release/Inmate Exchange Auto ${VERSION}.exe"
need "release/Inmate Exchange Auto-${VERSION}-mac.zip"
need "release/Inmate Exchange Auto-${VERSION}-mac.zip.blockmap"
need "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip"
need "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip.blockmap"
need "release/Inmate Exchange Auto-${VERSION}.dmg"
need "release/Inmate Exchange Auto-${VERSION}.dmg.blockmap"
need "release/Inmate Exchange Auto-${VERSION}-arm64.dmg"
need "release/Inmate Exchange Auto-${VERSION}-arm64.dmg.blockmap"

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# GitHub asset names come from the uploaded filename. Spaces become dots and break
# electron-updater lookups against latest.yml, so stage hyphenated copies first.
cp "release/latest.yml" "$TMP/latest.yml"
cp "release/latest-mac.yml" "$TMP/latest-mac.yml"
cp "release/Inmate Exchange Auto Setup ${VERSION}.exe" "$TMP/Inmate-Exchange-Auto-Setup-${VERSION}.exe"
cp "release/Inmate Exchange Auto Setup ${VERSION}.exe.blockmap" "$TMP/Inmate-Exchange-Auto-Setup-${VERSION}.exe.blockmap"
cp "release/Inmate Exchange Auto ${VERSION}.exe" "$TMP/Inmate-Exchange-Auto-${VERSION}.exe"
cp "release/Inmate Exchange Auto-${VERSION}-mac.zip" "$TMP/Inmate-Exchange-Auto-${VERSION}-mac.zip"
cp "release/Inmate Exchange Auto-${VERSION}-mac.zip.blockmap" "$TMP/Inmate-Exchange-Auto-${VERSION}-mac.zip.blockmap"
cp "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip" "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip"
cp "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip.blockmap" "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip.blockmap"
cp "release/Inmate Exchange Auto-${VERSION}.dmg" "$TMP/Inmate-Exchange-Auto-${VERSION}.dmg"
cp "release/Inmate Exchange Auto-${VERSION}.dmg.blockmap" "$TMP/Inmate-Exchange-Auto-${VERSION}.dmg.blockmap"
cp "release/Inmate Exchange Auto-${VERSION}-arm64.dmg" "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64.dmg"
cp "release/Inmate Exchange Auto-${VERSION}-arm64.dmg.blockmap" "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64.dmg.blockmap"

NOTES="$(cat <<EOF
## Downloads

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | \`Inmate-Exchange-Auto-${VERSION}-arm64.dmg\` / \`-arm64-mac.zip\` |
| macOS (Intel) | \`Inmate-Exchange-Auto-${VERSION}.dmg\` / \`-mac.zip\` |
| Windows | \`Inmate-Exchange-Auto-Setup-${VERSION}.exe\` (installer) or portable \`.exe\` |

In-app updates use \`latest.yml\` / \`latest-mac.yml\` on this release.
EOF
)"

if ! gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Creating GitHub release ${TAG}..."
  gh release create "$TAG" \
    --repo "$REPO" \
    --title "Inmate Exchange Auto ${VERSION}" \
    --notes "$NOTES"
else
  echo "Release ${TAG} already exists"
fi

echo "Uploading assets (hyphenated names for electron-updater)..."
gh release upload "$TAG" --repo "$REPO" --clobber \
  "$TMP/latest.yml" \
  "$TMP/latest-mac.yml" \
  "$TMP/Inmate-Exchange-Auto-Setup-${VERSION}.exe" \
  "$TMP/Inmate-Exchange-Auto-Setup-${VERSION}.exe.blockmap" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}.exe" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-mac.zip" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-mac.zip.blockmap" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip.blockmap" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}.dmg" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}.dmg.blockmap" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64.dmg" \
  "$TMP/Inmate-Exchange-Auto-${VERSION}-arm64.dmg.blockmap"

echo "Published ${TAG} → https://github.com/${REPO}/releases/tag/${TAG}"
