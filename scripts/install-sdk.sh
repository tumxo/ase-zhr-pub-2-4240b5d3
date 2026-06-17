#!/usr/bin/env bash
set -e

echo "==> Installing Java 21..."
sudo apt-get update -q
sudo apt-get install -y openjdk-21-jdk-headless unzip

echo ""
echo "==> Installed versions:"
java -version
echo ""
echo "==> Done."
