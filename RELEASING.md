# PDF Toolkit: Automated Releasing Guide (Mandatory GitHub Actions)

The release process for PDF Toolkit is **fully automated and must be handled exclusively by GitHub Actions**. Manual release creation (via GitHub UI or `gh` CLI) is strictly forbidden as it bypasses the automated build, signing, and auto-updater metadata generation.

---

## 1. The Automated Release Mandate
All releases **MUST** be triggered by pushing a version tag. The GitHub Action workflow handles:
- Cross-compiling for Apple Silicon (arm64).
- Cryptographic signing of the application.
- Generating the DMG and auto-updater artifacts.
- Creating the GitHub Release (as a Draft).
- Updating `update.json` on the `gh-pages` branch.

**NEVER** use `gh release create` or the GitHub "Create a new release" button manually.

---

## 2. Release Workflow (Triggering a Build)

To release version `v3.0.0`:

1. **Update Version Strings**: Ensure `package.json`, `tauri.conf.json`, and `Cargo.toml` reflect the target version.
2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "chore: prepare release v3.0.0"
   git push origin main
   ```
3. **Trigger Deployment**: Push the version tag to GitHub.
   ```bash
   git tag v3.0.0
   git push origin v3.0.0
   ```

---

## 3. Finalizing the Release

Once the GitHub Action completes:
1. Navigate to **GitHub > Releases**.
2. Find the new **Draft** release created by the action.
3. Review the artifacts and click **Publish release**.
4. The auto-updater will now detect the update and notify users.

---

## 4. Troubleshooting
If a build fails or you need to re-trigger a release for the same version:
1. Delete the tag locally and remotely:
   ```bash
   git tag -d v3.0.0
   git push origin :refs/tags/v3.0.0
   ```
2. Re-create and re-push the tag as shown in Step 2.
