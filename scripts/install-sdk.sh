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
echo "==> Installing jdtls (Java Language Server)..."
JDTLS_VERSION="1.44.0"
JDTLS_BUILD="202501221502"
JDTLS_TAR="jdt-language-server-${JDTLS_VERSION}-${JDTLS_BUILD}.tar.gz"
JDTLS_URL="https://download.eclipse.org/jdtls/milestones/${JDTLS_VERSION}/${JDTLS_TAR}"
JDTLS_DIR="/opt/jdtls"
if [ -d "$JDTLS_DIR" ]; then
    echo "    jdtls already installed at $JDTLS_DIR, skipping."
else
    sudo mkdir -p "$JDTLS_DIR"
    curl -sL "$JDTLS_URL" | sudo tar -xz -C "$JDTLS_DIR"
    sudo tee /usr/local/bin/jdtls > /dev/null <<'WRAPPER'
#!/usr/bin/env bash
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/java}"
JAVA_BIN="${JAVA_BIN:-$(find /usr/lib/jvm/java-21* -name java -type f 2>/dev/null | head -1)}"
JAVA_BIN="${JAVA_BIN:-java}"
exec "$JAVA_BIN" \
  -Declipse.application=org.eclipse.jdt.ls.core.id1 \
  -Dosgi.bundles.defaultStartLevel=4 \
  -Declipse.product=org.eclipse.jdt.ls.core.product \
  -Dlog.level=ALL \
  -Xmx1G \
  --add-modules=ALL-SYSTEM \
  --add-opens java.base/java.util=ALL-UNNAMED \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  -jar "$(ls /opt/jdtls/plugins/org.eclipse.equinox.launcher_*.jar | head -1)" \
  -configuration /opt/jdtls/config_linux \
  -data "${HOME}/.jdtls-workspace" \
  "$@"
WRAPPER
    sudo chmod +x /usr/local/bin/jdtls
    sudo chmod -R a+w "$JDTLS_DIR/config_linux"
    echo "    jdtls ${JDTLS_VERSION} installed."
fi

echo ""
echo "==> Installed versions:"
java -version
echo ""
echo "==> Done."
