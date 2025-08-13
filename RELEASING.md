# 🚀 Release & Publishing Guide

## Automated Release Process

This package uses GitHub Actions to automate NPM publishing. Here's how to set it up and use it.

## Setup (One-time)

### 1. Get Your NPM Token

1. Login to [npmjs.com](https://www.npmjs.com)
2. Click your profile → Access Tokens
3. Generate New Token → Classic Token
4. Select "Automation" type
5. Copy the token (starts with `npm_`)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your NPM token
5. Click "Add secret"

## Release Methods

### Method 1: Automatic Release on Tag (Recommended)

```bash
# 1. Make your changes and commit
git add .
git commit -m "fix: resolve download issue"

# 2. Bump version and create tag
npm version patch  # or minor/major
# This creates commit and tag automatically

# 3. Push with tags
git push origin main --tags

# GitHub Action automatically publishes to NPM!
```

### Method 2: Manual Release via GitHub UI

1. Go to GitHub repo → Actions → "Publish to NPM"
2. Click "Run workflow"
3. Select version type (patch/minor/major)
4. Click "Run workflow"
5. Action will bump version, create tag, and publish

### Method 3: Create GitHub Release

1. Go to GitHub repo → Releases → "Create a new release"
2. Create new tag (e.g., `v0.2.0`)
3. Write release notes
4. Click "Publish release"
5. Action automatically publishes to NPM

## Version Conventions

Follow semantic versioning:

- **Patch** (`0.1.0` → `0.1.1`): Bug fixes, documentation
- **Minor** (`0.1.0` → `0.2.0`): New features (backwards compatible)
- **Major** (`0.1.0` → `1.0.0`): Breaking changes

## Commit Message Conventions

For better release notes, use conventional commits:

```bash
feat: add new export format        # Minor version bump
fix: resolve memory leak           # Patch version bump
docs: update README                # No version bump (or patch)
chore: update dependencies         # No version bump
BREAKING CHANGE: change API        # Major version bump
```

## Manual Release (Fallback)

If automation fails, you can still release manually:

```bash
# 1. Ensure you're logged in to NPM
npm login

# 2. Update version
npm version patch

# 3. Build
npm run build

# 4. Publish
npm publish

# 5. Push tags
git push origin main --tags
```

## Workflow Files

- `.github/workflows/ci.yml` - Runs tests on every push/PR
- `.github/workflows/release.yml` - Publishes when tags are pushed
- `.github/workflows/publish.yml` - Manual publish with version bump

## Troubleshooting

### NPM Token Issues
- Ensure token has "Automation" permissions
- Token should start with `npm_`
- Check token hasn't expired

### Build Failures
- Run `npm run build` locally first
- Check Node.js version compatibility
- Ensure all dependencies are installed

### Version Conflicts
- Can't republish same version
- Always bump version before publishing
- Use `npm view vanta-auditor-tui version` to check current version

## Quick Release Checklist

- [ ] Code changes complete and tested
- [ ] `npm run build` succeeds
- [ ] `npm audit` shows no vulnerabilities
- [ ] README updated if needed
- [ ] Ready to bump version
- [ ] Push to GitHub with tags

## Example: Complete Feature Release

```bash
# 1. Create feature branch
git checkout -b feature/add-csv-export

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run dev
npm run build

# 4. Commit with conventional commit
git add .
git commit -m "feat: add CSV export format for audit data"

# 5. Merge to main
git checkout main
git merge feature/add-csv-export

# 6. Version bump (minor for new feature)
npm version minor -m "feat: release %s - add CSV export"

# 7. Push with tags (triggers auto-publish)
git push origin main --tags

# ✅ GitHub Action publishes to NPM automatically!
```

---

📦 Your package will be live at: https://www.npmjs.com/package/vanta-auditor-tui