#!/bin/sh
# POSIX-sh build step: works with dash (Ubuntu CI), bash and zsh.
set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

echo "=== Photobooth WASM Build Step ==="

if command -v wasm-pack >/dev/null 2>&1; then
  echo "Found wasm-pack. Building Rust crate..."
  cd "$ROOT_DIR/rust/photobooth-core"
  wasm-pack build --target web --out-dir "$ROOT_DIR/public/wasm" --release
  # wasm-pack emits an all-ignoring .gitignore; the artifacts are versioned on
  # purpose so Vercel (no Rust toolchain) can build from a clean clone.
  rm -f "$ROOT_DIR/public/wasm/.gitignore"
  echo "WASM build complete in public/wasm/"
elif [ -f "$ROOT_DIR/public/wasm/photobooth_core_bg.wasm" ]; then
  echo "wasm-pack not found in environment, but prebuilt WASM module exists in public/wasm/."
  echo "Proceeding with existing WASM module."
else
  echo "WARNING: wasm-pack not found and no prebuilt WASM found."
  echo "Photobooth will automatically use the JavaScript/Canvas 2D fallback engine."
fi

exit 0
