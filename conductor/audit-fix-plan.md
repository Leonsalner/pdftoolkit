# PDF Toolkit Audit Fix Plan

This document outlines the precise fixes for the three issues identified during the security and functionality audit.

## 1. Digital Signature Feature is a No-Op
**Issue:** `sign_pdf_file_based` simulates success by copying the file without applying a signature, but the UI misleadingly claims to provide a "verifiable digital signature".
**Fix:**
Since full PKCS#7 byte-range signature injection is highly complex and missing from the current backend, we must stop deceiving the user.
- **Backend (`src-tauri/src/commands/sign.rs`)**: Remove the `std::fs::copy` block. The command must return an explicit error indicating the feature is not yet available, to prevent silent failures.
  ```rust
  // Remove std::fs::copy(...)
  return Err("Digital signing is currently in preview and not yet implemented. No changes were made to your document.".to_string());
  ```
- **Frontend (`src/lib/i18n.tsx`)**: Update the translation strings to remove the word "verifiable" so it doesn't make false security promises.
  ```javascript
  'sign.desc': 'Add a digital signature to your PDF using a certificate or smart card. (Coming Soon)',
  ```
- **Frontend (`src/pages/SignPage.tsx`)**: Disable the "Sign PDF" button, or add a "Preview" badge warning the user that the functionality is not active yet.

## 2. Hardcoded Owner Password Fallback
**Issue:** In `src-tauri/src/commands/security.rs`, when the frontend sends an empty `owner_password` for permission restrictions, the backend falls back to `"owner"`. This makes permission removal trivial for attackers.
**Fix:**
When the user wants to restrict permissions but doesn't care about setting an owner password for themselves, we must lock the document with a secure, random password.
- **Backend (`src-tauri/src/commands/security.rs`)**: Use the `uuid` crate (which is already in the lockfile) to generate a random string if the owner password is not provided.
  ```rust
  // Replace:
  // args.push(owner_password.unwrap_or_else(|| "owner".to_string()));

  // With:
  let final_owner_pass = owner_password
      .filter(|s| !s.trim().is_empty())
      .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
  args.push(final_owner_pass);
  ```

## 3. Watermark Overwrites Shared Resource Names
**Issue:** `src-tauri/src/commands/watermark.rs` hardcodes resource names (`/F1` for fonts, `/Im1` for images, `/GS1` for graphic states). If the original page already uses these identifiers, the watermark command will overwrite them, corrupting the original page content.
**Fix:**
Use highly unique identifiers that are practically guaranteed not to collide with existing PDF generators.
- **Text Watermark (`add_text_watermark`)**:
  - In the `Content` operations: change `Object::Name(b"F1".to_vec())` to `Object::Name(b"F_PDFTK_WM".to_vec())`.
  - In the Resource dictionary insertion: change `font_dict.set("F1", ...)` to `font_dict.set("F_PDFTK_WM", ...)`.
- **Image Watermark (`add_image_watermark`)**:
  - In the `Content` operations: change `Object::Name(b"GS1".to_vec())` to `Object::Name(b"GS_PDFTK_WM".to_vec())`, and `Object::Name(b"Im1".to_vec())` to `Object::Name(b"Im_PDFTK_WM".to_vec())`.
  - In the Resource dictionary insertion: change `xobj_dict.set("Im1", ...)` to `xobj_dict.set("Im_PDFTK_WM", ...)`.
  - In the Resource dictionary insertion: change `gs_dict.set("GS1", ...)` to `gs_dict.set("GS_PDFTK_WM", ...)`.