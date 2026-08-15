#!/usr/bin/env bash
set -euo pipefail

REPO="axelson/obsidian-another-quick-switcher"
DATE_PART="33.$(date +%Y%m%d)"
PREV_VERSION=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName' 2>/dev/null || echo "")
if [[ "$PREV_VERSION" == "$DATE_PART"* ]]; then
  PATCH=$(echo "$PREV_VERSION" | cut -d. -f3)
  VERSION="$DATE_PART.$((PATCH + 1))"
else
  VERSION="$DATE_PART.0"
fi
BRANCH="$(git branch --show-current)"

echo "Building plugin..."
bun run build

echo "Preparing release assets (version: $VERSION)..."
ASSETS_DIR=$(mktemp -d)
trap 'rm -rf "$ASSETS_DIR"' EXIT

cp main.js "$ASSETS_DIR/"
[[ -f styles.css ]] && cp styles.css "$ASSETS_DIR/"

# Set fork version in manifest for release only — repo copy stays in sync with upstream
sed "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" manifest.json > "$ASSETS_DIR/manifest.json"

ASSETS=("$ASSETS_DIR/main.js" "$ASSETS_DIR/manifest.json")
[[ -f "$ASSETS_DIR/styles.css" ]] && ASSETS+=("$ASSETS_DIR/styles.css")

echo "Creating release $VERSION on branch $BRANCH..."
git tag -f "$VERSION"
git push origin "refs/tags/$VERSION"

gh release create "$VERSION" \
  "${ASSETS[@]}" \
  --title "Fork Release $VERSION" \
  --notes "Fork build $VERSION ($(date +%Y-%m-%d))" \
  --verify-tag \
  --repo "$REPO"

echo "Done! Released version $VERSION"
