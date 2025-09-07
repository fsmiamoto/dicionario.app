#!/bin/bash

# Script to bump version in package.json and create git commit + tag
# Usage: ./scripts/bump-version.sh [patch|minor|major] [-y|--yes]
# Default is patch if no argument provided
# Use -y or --yes to skip confirmation prompt

set -e

BUMP_TYPE=""
SKIP_CONFIRMATION=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        patch|minor|major)
            BUMP_TYPE="$1"
            shift
            ;;
        *)
            echo "Error: Unknown argument '$1'"
            echo "Usage: $0 [patch|minor|major] [-y|--yes]"
            exit 1
            ;;
    esac
done

# Default to patch if no bump type specified
BUMP_TYPE=${BUMP_TYPE:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Invalid bump type. Use 'patch', 'minor', or 'major'"
    exit 1
fi

# Check if package.json exists
if [[ ! -f "package.json" ]]; then
    echo "Error: package.json not found"
    exit 1
fi

# Check if git repo is clean
if [[ -n $(git status --porcelain) ]]; then
    echo "Error: Working directory is not clean. Please commit or stash your changes first."
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate what the new version will be (preview)
case $BUMP_TYPE in
    patch)
        PREVIEW_VERSION=$(node -e "
            const semver = '$CURRENT_VERSION'.split('.');
            semver[2] = String(parseInt(semver[2]) + 1);
            console.log(semver.join('.'));
        ")
        ;;
    minor)
        PREVIEW_VERSION=$(node -e "
            const semver = '$CURRENT_VERSION'.split('.');
            semver[1] = String(parseInt(semver[1]) + 1);
            semver[2] = '0';
            console.log(semver.join('.'));
        ")
        ;;
    major)
        PREVIEW_VERSION=$(node -e "
            const semver = '$CURRENT_VERSION'.split('.');
            semver[0] = String(parseInt(semver[0]) + 1);
            semver[1] = '0';
            semver[2] = '0';
            console.log(semver.join('.'));
        ")
        ;;
esac

echo "Will bump $BUMP_TYPE version: $CURRENT_VERSION → $PREVIEW_VERSION"

# Ask for confirmation unless skip flag is provided
if [[ "$SKIP_CONFIRMATION" = false ]]; then
    read -p "Continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Use npm version to bump
echo "Bumping $BUMP_TYPE version..."
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)

# Strip the 'v' prefix from NEW_VERSION for consistency
VERSION_NUMBER=${NEW_VERSION#v}

echo "Version bumped to: $VERSION_NUMBER"

# Create git commit
git add package.json package-lock.json
git commit -m "chore: bump version to $VERSION_NUMBER"

# Create git tag
git tag -a "v$VERSION_NUMBER" -m "Release v$VERSION_NUMBER"

echo "✅ Successfully bumped version to $VERSION_NUMBER"
echo "✅ Created commit and tag v$VERSION_NUMBER"
echo "Don't forget to push with: git push && git push --tags"
