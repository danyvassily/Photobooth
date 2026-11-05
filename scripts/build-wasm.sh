#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Photobooth WASM Build Step ==="

if command -v wasm-pack >/dev/null 2>&1; then
  echo "Found wasm-pack. Building Rust crate..."
  cd "$ROOT_DIR/rust/photobooth-core"
  wasm-pack build --target web --out-dir "$ROOT_DIR/public/wasm" --release
  echo "WASM build complete in public/wasm/"
elif [ -f "$ROOT_DIR/public/wasm/photobooth_core_bg.wasm" ]; then
  echo "wasm-pack not found in environment, but prebuilt WASM module exists in public/wasm/."
  echo "Proceeding with existing WASM module."
else
  echo "WARNING: wasm-pack not found and no prebuilt WASM found."
  echo "Photobooth will automatically use the JavaScript/Canvas 2D fallback engine."
fi

exit 0
