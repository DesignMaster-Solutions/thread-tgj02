#!/bin/sh
# Builds dist/Thread-windows.zip: stock Electron win32-x64 + web/ in resources/app. Runs on macOS, no Wine.
# (@electron/packager dies silently while unzipping on Node 26, so the layout is assembled by hand.)
set -e
cd "$(dirname "$0")"
V=45.1.0
Z="$HOME/Library/Caches/electron/electron-v$V-win32-x64.zip"
[ -f "$Z" ] || curl -fL -o "$Z" "https://github.com/electron/electron/releases/download/v$V/electron-v$V-win32-x64.zip"
OUT=../dist/Thread-win32-x64
rm -rf "$OUT" && mkdir -p "$OUT" && unzip -q "$Z" -d "$OUT"
mv "$OUT/electron.exe" "$OUT/Thread.exe" && rm -f "$OUT/resources/default_app.asar"
mkdir -p "$OUT/resources/app" && cp main.js package.json "$OUT/resources/app/" && cp -R ../web "$OUT/resources/app/web"
cd ../dist && rm -f Thread-windows.zip && zip -qry Thread-windows.zip Thread-win32-x64 && ls -lh Thread-windows.zip
