#!/usr/bin/env bash
set -e

VERSION="${VERSION:-latest}"

echo "Installing kindling (version: ${VERSION})..."

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required but not found. Ensure a Node.js feature is installed first."
  exit 1
fi

# tsx is the runtime for kindling (shebang-based, no build step).
# Codex is installed alongside it so provider selection works inside containers.
# Kimi Code CLI is installed so the kimi provider works inside containers.
# agent-ci is installed for local CI execution (requires Docker at runtime).
npm install -g tsx @openai/codex @redwoodjs/agent-ci

# Install Kimi Code CLI (used by the kimi transport).
#
# context(justinvdm, 2026-04-21): Install as the vscode user so the binary
# lands at /home/vscode/.local/bin/kimi (where later docker-exec-as-vscode
# invocations find it). Previously this ran as root with a trailing
# `|| true` — silent failures meant kimi-transport containers shipped
# without the binary. Retry once, then hard-fail, so a bad container
# build is visible rather than silently-broken.
install_kimi_for_vscode() {
  # context(justinvdm, 2026-04-21): The uv installer (used by kimi install)
  # places uv in ~/.local/bin, but that directory is not on PATH in a
  # non-login shell. Export PATH so the installer can resolve its own
  # dependency and so subsequent which/verify steps succeed.
  if sudo -u vscode bash -c 'export PATH="$HOME/.local/bin:$PATH"; curl -L code.kimi.com/install.sh | bash'; then
    return 0
  fi
  echo "[kindling-agent-ready] kimi installer failed on first attempt; retrying once..."
  sleep 5
  sudo -u vscode bash -c 'export PATH="$HOME/.local/bin:$PATH"; curl -L code.kimi.com/install.sh | bash'
}

if ! install_kimi_for_vscode; then
  echo "[kindling-agent-ready] ERROR: kimi installer failed twice — containers will lack the kimi binary." >&2
  exit 1
fi

if [ -x /home/vscode/.local/bin/kimi ] && [ ! -e /usr/local/bin/kimi ]; then
  ln -sf /home/vscode/.local/bin/kimi /usr/local/bin/kimi
fi

if ! command -v kimi >/dev/null 2>&1 && [ ! -x /usr/local/bin/kimi ]; then
  echo "[kindling-agent-ready] ERROR: kimi installed but not resolvable via command -v or /usr/local/bin/kimi." >&2
  exit 1
fi

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
