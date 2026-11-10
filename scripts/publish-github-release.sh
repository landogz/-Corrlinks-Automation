#!/usr/bin/env bash
# Publish local release/ installers + electron-updater metadata to a GitHub Release.
# Asset names are normalized to match latest.yml / latest-mac.yml (hyphenated).
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
need "release/Inmate Exchange Auto-${VERSION}-arm64.dmg"

if ! gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Creating GitHub release ${TAG}..."
  gh release create "$TAG" \
    --repo "$REPO" \
    --title "Inmate Exchange Auto ${VERSION}" \
    --notes "$(cat <<EOF
## Downloads

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | \`Inmate-Exchange-Auto-${VERSION}-arm64.dmg\` / \`-arm64-mac.zip\` |
| macOS (Intel) | \`Inmate-Exchange-Auto-${VERSION}.dmg\` / \`-mac.zip\` |
| Windows | \`Inmate-Exchange-Auto-Setup-${VERSION}.exe\` (installer) or portable \`.exe\` |

In-app updates use \`latest.yml\` / \`latest-mac.yml\` on this release.
EOF
)"
else
  echo "Release ${TAG} already exists"
fi

echo "Uploading assets (names aligned with electron-updater metadata)..."
gh release upload "$TAG" --repo "$REPO" --clobber \
  "release/latest.yml" \
  "release/latest-mac.yml" \
  "release/Inmate Exchange Auto Setup ${VERSION}.exe#Inmate-Exchange-Auto-Setup-${VERSION}.exe" \
  "release/Inmate Exchange Auto Setup ${VERSION}.exe.blockmap#Inmate-Exchange-Auto-Setup-${VERSION}.exe.blockmap" \
  "release/Inmate Exchange Auto ${VERSION}.exe#Inmate-Exchange-Auto-${VERSION}.exe" \
  "release/Inmate Exchange Auto-${VERSION}-mac.zip#Inmate-Exchange-Auto-${VERSION}-mac.zip" \
  "release/Inmate Exchange Auto-${VERSION}-mac.zip.blockmap#Inmate-Exchange-Auto-${VERSION}-mac.zip.blockmap" \
  "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip#Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip" \
  "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip.blockmap#Inmate-Exchange-Auto-${VERSION}-arm64-mac.zip.blockmap" \
  "release/Inmate Exchange Auto-${VERSION}.dmg#Inmate-Exchange-Auto-${VERSION}.dmg" \
  "release/Inmate Exchange Auto-${VERSION}-arm64.dmg#Inmate-Exchange-Auto-${VERSION}-arm64.dmg" \
  "release/Inmate Exchange Auto-${VERSION}.dmg.blockmap#Inmate-Exchange-Auto-${VERSION}.dmg.blockmap" \
  "release/Inmate Exchange Auto-${VERSION}-arm64.dmg.blockmap#Inmate-Exchange-Auto-${VERSION}-arm64.dmg.blockmap"

echo "Published ${TAG} → https://github.com/${REPO}/releases/tag/${TAG}"
