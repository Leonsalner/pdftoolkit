# PDF Toolkit: Comprehensive Releasing & Auto-Updater Guide

This document explains how to build, sign, and release updates for PDF Toolkit, and how to manage the GitHub Pages update server.

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
1. `TAURI_SIGNING_PRIVATE_KEY`: Your private key string.
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: (Optional) The password if you set one during generation.

### C. GitHub Actions Permissions
Go to **Settings > Actions > General > Workflow permissions**.
Select **Read and write permissions** so the build script can create Releases.

---

## 2. GitHub Pages: The Update Server

To trigger updates for existing users, you need to host a single `update.json` file. The easiest way is using **GitHub Pages**.

### A. Setup GitHub Pages
1. Create a new branch named `gh-pages` (or use your `main` branch with a `/docs` folder).
2. Ensure GitHub Pages is enabled in **Settings > Pages**.

### B. The `update.json` Structure
Place this file at the root of your `gh-pages` branch. The app is configured to look for it at: `https://leonsalner.github.io/pdftoolkit/update.json`

```json
{
  "version": "2.1.0",
  "notes": "Premium UI overhaul and Auto-Updater support!",
  "pub_date": "2026-03-24T23:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "CONTENT_OF_THE_SIG_FILE",
      "url": "https://github.com/Leonsalner/pdftoolkit/releases/download/app-v2.1.0/PDF_Toolkit_2.1.0_aarch64.app.tar.gz"
    }
  }
}
```

---

## 3. The Release Workflow (How to push an update)

Follow these steps exactly to release a new version (e.g., `v2.1.0`):

1. **Update Local Files**: 
   - Change `"version": "2.1.0"` in `package.json`.
   - Change `"version": "2.1.0"` in `src-tauri/tauri.conf.json`.
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
4. **GitHub Action**: 
   - Pushing the tag triggers `.github/workflows/release.yml`.
   - It will build the `.dmg` (for new users) and `.app.tar.gz` (for the updater).
   - It will automatically create a **Draft Release** on GitHub.
5. **Publish the Release**:
   - Go to your GitHub Releases, edit the draft, and click **Publish**.
6. **Trigger the Updater**:
   - Download the `.sig` file that the GitHub Action attached to the release.
   - Update your `update.json` file on the `gh-pages` branch with the new **version**, **url** of the `.tar.gz`, and the contents of the **.sig** file.
   - As soon as you push the change to `update.json`, all current users will receive an "Update Available" notification in the app.

---

## 4. Troubleshooting
- **Build Fails on Sidecars**: Ensure `setup_env.sh` is executable and valid. The GitHub Action runs this script to fetch Ghostscript/Tesseract before building.
- **Update not triggering**: Ensure the `version` in `update.json` is strictly higher than the version currently installed on the user's machine.
- **Signature Error**: Ensure the `pubkey` in `tauri.conf.json` matches the private key used by the GitHub Action.
