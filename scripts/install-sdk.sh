#!/usr/bin/env bash
set -e

echo "==> Installing Java 21..."
sudo apt-get update -q
sudo apt-get install -y openjdk-21-jdk-headless unzip

echo ""
echo "==> Installing Playwright browsers for @playwright/mcp..."
# Use the playwright binary bundled with @playwright/mcp to install the compatible chromium revision
MCP_PKG=$(find ~/.npm/_npx -path "*/@playwright/mcp" -maxdepth 5 -type d 2>/dev/null | head -1)
MCP_PLAYWRIGHT="${MCP_PKG:+$(dirname "$(dirname "$MCP_PKG")")/.bin/playwright}"
if [ -n "$MCP_PLAYWRIGHT" ]; then
    "$MCP_PLAYWRIGHT" install chromium
else
    echo "    (MCP playwright not cached yet, run: npx @playwright/mcp@latest --help first)"
    npx --yes playwright install chromium
fi

echo ""
echo "==> Installed versions:"
java -version
echo ""
echo "==> Done."
