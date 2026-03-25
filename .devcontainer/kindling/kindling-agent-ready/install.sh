#!/usr/bin/env bash
set -e

VERSION="${VERSION:-latest}"

echo "Installing kindling (version: ${VERSION})..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required but not found. Ensure a Node.js feature is installed first."
  exit 1
fi

# tsx is the runtime for kindling (shebang-based, no build step).
# Codex and Cline are installed alongside it so provider selection works inside containers.
npm install -g tsx @openai/codex cline

# Install GitHub Copilot CLI for the copilot provider.
curl -fsSL https://gh.io/copilot-install | bash

# --GROK--: kindling is not yet published to npm. When it is, uncomment below.
# For dev, the kindling repo is mounted at /workspaces/kindling and linked in postCreateCommand.
# if [ "$VERSION" = "latest" ]; then
#   npm install -g kindling
# else
#   npm install -g "kindling@${VERSION}"
# fi

echo "kindling agent-ready environment configured (install kindling from local mount or npm)."
