#!/bin/bash

set -e

echo "Setting up local environment and sidecars for Tauri PDF Toolkit..."

# 0. Check for Homebrew (macOS)
if [[ "$OSTYPE" == "darwin"* ]] && ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found! Attempting to install..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 1. Check for basic requirements
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found! Attempting to install Node.js via Homebrew..."
    command -v brew >/dev/null 2>&1 || { echo >&2 "brew is required to install node. Aborting."; exit 1; }
    brew install node@24
    brew link --force node@24
fi

if ! command -v rustc >/dev/null 2>&1; then
    echo "rustc not found! Attempting to install Rust via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 2. Check for gs and tesseract
if ! command -v gs >/dev/null 2>&1; then
    echo "Ghostscript not found! Attempting to install via Homebrew..."
    command -v brew >/dev/null 2>&1 || { echo >&2 "brew is required to install ghostscript. Aborting."; exit 1; }
    brew install ghostscript
fi

if ! command -v tesseract >/dev/null 2>&1; then
    echo "Tesseract not found! Attempting to install via Homebrew..."
    command -v brew >/dev/null 2>&1 || { echo >&2 "brew is required to install tesseract. Aborting."; exit 1; }
    brew install tesseract
fi

if ! command -v qpdf >/dev/null 2>&1; then
    echo "qpdf not found! Attempting to install via Homebrew..."
    command -v brew >/dev/null 2>&1 || { echo >&2 "brew is required to install qpdf. Aborting."; exit 1; }
    brew install qpdf
fi

echo "All required dependencies are installed locally."

# 3. Create Sidecar directories
mkdir -p src-tauri/bin
mkdir -p src-tauri/tessdata

# 4. Get Rust target architecture
TARGET=$(rustc -vV | sed -n 's|host: ||p')
echo "Detected target architecture: $TARGET"

# 5. Copy Ghostscript executable
GS_PATH=$(command -v gs)
echo "Bundling Ghostscript from $GS_PATH..."
rm -f "src-tauri/bin/gs-$TARGET"
cp "$GS_PATH" "src-tauri/bin/gs-$TARGET"
chmod +x "src-tauri/bin/gs-$TARGET"

# 6. Copy Tesseract executable
TESS_PATH=$(command -v tesseract)
echo "Bundling Tesseract from $TESS_PATH..."
rm -f "src-tauri/bin/tesseract-$TARGET"
cp "$TESS_PATH" "src-tauri/bin/tesseract-$TARGET"
chmod +x "src-tauri/bin/tesseract-$TARGET"

# 6b. Copy qpdf executable
QPDF_PATH=$(command -v qpdf)
echo "Bundling qpdf from $QPDF_PATH..."
rm -f "src-tauri/bin/qpdf-$TARGET"
cp "$QPDF_PATH" "src-tauri/bin/qpdf-$TARGET"
chmod +x "src-tauri/bin/qpdf-$TARGET"

# 7. Copy Tesseract language data (tessdata)
# Finding tessdata path. On Homebrew, it's usually at $(brew --prefix tesseract)/share/tessdata
if command -v brew >/dev/null 2>&1; then
    TESSDATA_PATH="$(brew --prefix tesseract)/share/tessdata"
    if [ -d "$TESSDATA_PATH" ]; then
        echo "Bundling Tesseract language data from $TESSDATA_PATH..."
        cp -r "$TESSDATA_PATH/"* src-tauri/tessdata/
    else
        echo "Warning: Could not find tessdata at $TESSDATA_PATH"
    fi
else
    echo "Warning: Non-homebrew installations need manual tessdata copying."
fi

# 8. Download Slovak trained data if missing
SLK_DATA_PATH="src-tauri/tessdata/slk.traineddata"
if [ ! -f "$SLK_DATA_PATH" ]; then
    echo "Downloading Slovak Tesseract data..."
    curl -sL "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/slk.traineddata" -o "$SLK_DATA_PATH"
fi

# 9. Download Czech trained data if missing
CES_DATA_PATH="src-tauri/tessdata/ces.traineddata"
if [ ! -f "$CES_DATA_PATH" ]; then
    echo "Downloading Czech Tesseract data..."
    curl -sL "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/ces.traineddata" -o "$CES_DATA_PATH"
fi

echo "Setup complete! Ghostscript and Tesseract are now bundled as sidecars."
