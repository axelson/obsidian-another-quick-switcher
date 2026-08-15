#!/usr/bin/env bash
set -euo pipefail

RELEASE_TAG="fork-latest"
DATE_PART="33.$(date +%Y%m%d)"
PREV_VERSION=$(gh release view "$RELEASE_TAG" --json tagName,name --jq '.name' --repo axelson/obsidian-another-quick-switcher 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "")
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

echo "Updating release $RELEASE_TAG on branch $BRANCH..."
gh release delete "$RELEASE_TAG" --yes --repo axelson/obsidian-another-quick-switcher 2>/dev/null || true
git tag -f "$RELEASE_TAG"
git push origin ":refs/tags/$RELEASE_TAG" 2>/dev/null || true
git push origin "refs/tags/$RELEASE_TAG"

gh release create "$RELEASE_TAG" \
  "${ASSETS[@]}" \
  --title "Fork Release $VERSION" \
  --notes "Fork build $VERSION ($(date +%Y-%m-%d))" \
  --verify-tag \
  --repo axelson/obsidian-another-quick-switcher

echo "Done! Released version $VERSION"
