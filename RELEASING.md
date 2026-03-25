# PDF Toolkit: Comprehensive Releasing & Auto-Updater Guide

This document explains how to build, sign, and release updates for PDF Toolkit. The process is fully automated: pushing a version tag triggers a build, creates a GitHub Release, and updates the Auto-Updater metadata.

---

## 1. Prerequisites (One-Time Setup)

### A. Generate Signing Keys
Tauri requires signed updates. Run this in your terminal:
```bash
npx tauri signer generate -w ~/.tauri/pdf-toolkit.key
```
- **Public Key**: Copy this and paste it into `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
- **Private Key**: Keep this secret. You will need it for GitHub Actions.

### B. Configure GitHub Secrets
Go to your repo **Settings > Secrets and variables > Actions** and add:
1. `TAURI_SIGNING_PRIVATE_KEY`: Your private key string from Step A.
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: (Optional) The password if you set one. Leave blank if you didn't.

### C. GitHub Actions Permissions
Go to **Settings > Actions > General > Workflow permissions**.
Select **Read and write permissions** so the build script can create Releases and update the `gh-pages` branch.

---

## 2. Automated Update Server (gh-pages)

The app is configured to check `https://leonsalner.github.io/pdftoolkit/update.json`. 
**You do not need to update this manually.** The GitHub Action handles this automatically by:
1. Building the new version.
2. Extracting the new cryptographic signature.
3. Committing an updated `update.json` to the `gh-pages` branch.

---

## 3. The Release Workflow (How to push an update)

Follow these steps to release a new version (e.g., `v2.1.0`):

1. **Update Local Files**: 
   - Bump version in `package.json`.
   - Bump version in `src-tauri/tauri.conf.json`.
2. **Commit & Push**:
   ```bash
   git add .
   git commit -m "chore: bump version to 2.1.0"
   git push origin main
   ```
3. **Tag the Release**:
   ```bash
   git tag v2.1.0
   git push origin v2.1.0
   ```
4. **Sit back and relax**: 
   - The GitHub Action builds the DMG and TAR.GZ.
   - It creates a **Draft Release** (Go to GitHub > Releases to review and click "Publish").
   - It automatically updates `update.json` on the `gh-pages` branch.
   - Users will see the "Update Available" notification automatically.

---

## 4. Final Setup Checklist

Before your first release, check off these items:

- [ ] **Signing Keys**: Generated via `npx tauri signer generate`.
- [ ] **Public Key**: Added to `src-tauri/tauri.conf.json` -> `plugins.updater.pubkey`.
- [ ] **Private Key**: Added to GitHub Secret `TAURI_SIGNING_PRIVATE_KEY`.
- [ ] **Repo Secrets**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` added (even if empty).
- [ ] **Permissions**: GitHub Actions "Workflow permissions" set to **Read and write**.
- [ ] **Branch**: A `gh-pages` branch exists (create an empty one if not: `git checkout --orphan gh-pages && git rm -rf . && touch .nojekyll && git add . && git commit -m "init" && git push origin gh-pages`).
- [ ] **Endpoint**: The URL in `tauri.conf.json` matches your GitHub Pages URL.
