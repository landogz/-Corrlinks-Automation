#!/usr/bin/env bash
# Publish local release/ installers as a GitLab Release.
# Requires: GITLAB_TOKEN with api scope (Project Access Token or Personal Access Token).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-$(node -p "require('./package.json').version")}"
TAG="v${VERSION}"
PROJECT_PATH="${GITLAB_PROJECT_PATH:-sportsdata1/corrlinks-automation}"
PROJECT_ENC="$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$PROJECT_PATH")"
API="https://gitlab.com/api/v4/projects/${PROJECT_ENC}"

if [[ -z "${GITLAB_TOKEN:-}" ]]; then
  echo "Set GITLAB_TOKEN (api scope), then re-run:" >&2
  echo "  GITLAB_TOKEN=glpat-... npm run publish:release" >&2
  exit 1
fi

AUTH_HEADER=("PRIVATE-TOKEN: ${GITLAB_TOKEN}")

echo "Ensuring release ${TAG} exists..."
if ! curl -fsS --header "${AUTH_HEADER[@]}" "${API}/releases/${TAG}" >/dev/null 2>&1; then
  curl -fsS --request POST --header "${AUTH_HEADER[@]}" --header "Content-Type: application/json" \
    --data "$(python3 - <<PY
import json
print(json.dumps({
  "name": f"Inmate Exchange Auto ${VERSION}",
  "tag_name": "${TAG}",
  "description": f"""## Downloads

| Platform | File |
| --- | --- |
| macOS (Apple Silicon) | \`Inmate Exchange Auto-${VERSION}-arm64.dmg\` or \`Inmate Exchange Auto-${VERSION}-arm64-mac.zip\` |
| macOS (Intel) | \`Inmate Exchange Auto-${VERSION}.dmg\` or \`Inmate Exchange Auto-${VERSION}-mac.zip\` |
| Windows | \`Inmate Exchange Auto Setup ${VERSION}.exe\` or \`Inmate Exchange Auto ${VERSION}.exe\` (portable) |
"""
}))
PY
)" \
    "${API}/releases" >/dev/null
  echo "Created release ${TAG}"
else
  echo "Release ${TAG} already exists"
fi

shopt -s nullglob
FILES=(
  "release/Inmate Exchange Auto-${VERSION}-arm64.dmg"
  "release/Inmate Exchange Auto-${VERSION}-arm64-mac.zip"
  "release/Inmate Exchange Auto-${VERSION}.dmg"
  "release/Inmate Exchange Auto-${VERSION}-mac.zip"
  "release/Inmate Exchange Auto Setup ${VERSION}.exe"
  "release/Inmate Exchange Auto ${VERSION}.exe"
)

for file in "${FILES[@]}"; do
  [[ -f "$file" ]] || { echo "Missing: $file" >&2; exit 1; }
  name="$(basename "$file")"
  echo "Uploading ${name}..."
  curl -fsS --request PUT --header "${AUTH_HEADER[@]}" \
    --upload-file "$file" \
    "${API}/packages/generic/inmate-exchange-auto/${VERSION}/${name}" >/dev/null

  url="https://gitlab.com/${PROJECT_PATH}/-/package_files/generic/inmate-exchange-auto/${VERSION}/${name}"
  # Prefer project package download URL shape used by GitLab generic packages:
  pkg_url="${API}/packages/generic/inmate-exchange-auto/${VERSION}/$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$name")"
  # Public download path for release link:
  link_url="https://gitlab.com/api/v4/projects/${PROJECT_ENC}/packages/generic/inmate-exchange-auto/${VERSION}/$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$name")"

  # Create or skip link
  existing="$(curl -fsS --header "${AUTH_HEADER[@]}" "${API}/releases/${TAG}/assets/links" || echo '[]')"
  if python3 -c "import json,sys; links=json.loads(sys.argv[1]); raise SystemExit(0 if any(l.get('name')==sys.argv[2] for l in links) else 1)" "$existing" "$name"; then
    echo "Link already present for ${name}"
  else
    curl -fsS --request POST --header "${AUTH_HEADER[@]}" --header "Content-Type: application/json" \
      --data "$(python3 - <<PY
import json
print(json.dumps({
  "name": """${name}""",
  "url": """${link_url}""",
  "link_type": "package",
}))
PY
)" \
      "${API}/releases/${TAG}/assets/links" >/dev/null
    echo "Linked ${name}"
  fi
done

echo "Done: https://gitlab.com/${PROJECT_PATH}/-/releases/${TAG}"
echo "Latest: https://gitlab.com/${PROJECT_PATH}/-/releases/permalink/latest"
