#!/bin/sh
# Builds dist/Thread.app (universal, ad-hoc signed) and dist/Thread-mac.zip for itch.io.
set -e
cd "$(dirname "$0")/.."
APP=dist/Thread.app
rm -rf dist && mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
for a in arm64 x86_64; do
  swiftc -O -target $a-apple-macos12 mac/main.swift -o dist/Thread-$a
done
lipo -create dist/Thread-arm64 dist/Thread-x86_64 -output "$APP/Contents/MacOS/Thread"
rm dist/Thread-arm64 dist/Thread-x86_64
cp -R web "$APP/Contents/Resources/web"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Thread</string>
<key>CFBundleExecutable</key><string>Thread</string>
<key>CFBundleIdentifier</key><string>com.designmastersolutions.thread</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>0.1</string>
<key>LSMinimumSystemVersion</key><string>12.0</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --deep -s - "$APP"
(cd dist && ditto -c -k --keepParent Thread.app Thread-mac.zip)
echo "built $(du -sh dist/Thread-mac.zip)"
