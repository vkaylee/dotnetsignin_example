#!/bin/bash

# ==============================================================================
# Angular CLI Docker Wrapper (Zero-Install Host)
# ==============================================================================
# This script acts exactly like the Angular CLI (`ng`), but inside a container!
# It spins up an ephemeral Node.js 20 container, mounts your current code
# directly into it, runs your command, and then immediately destroys the container.
#
# This keeps your host OS completely clean of any Node.js / npm installations.
#
# Quick Reference & Equivalents:
# ------------------------------------------------------------------------------
# [Angular CLI]                         -> [Your Command Here]
# ng new Frontend                       -> ./ng.sh new Frontend --routing --style=css --ssr=false --skip-git
# ng generate component pages/login     -> ./ng.sh generate component pages/login
# ng serve                              -> (Use 'podman compose up frontend-dev' instead for HMR)
# ng build                              -> ./ng.sh build
#
# [npm commands]
# npm install                           -> ./ng.sh npm install
# npm install @angular/material         -> ./ng.sh npm install @angular/material
#
# [npx commands]
# npx some-tool                         -> ./ng.sh npx some-tool
#
# Note: This relies on the 'cli' profile in compose.yml, meaning this service
# remains completely dormant and consumes 0 RAM until you execute this script.
# ==============================================================================

# Check & Auto-install Podman Engine & Compose
source "$(dirname "$0")/install_podman_deps.sh"

# 3. Route commands to the appropriate entrypoint
CMD="$1"

case "$CMD" in
    npm)
        # npm commands: ./ng.sh npm install, ./ng.sh npm install @angular/material
        shift
        podman-compose --profile cli run --rm ng "cd /app/Frontend && npm $*"
        ;;
    npx)
        # npx commands: ./ng.sh npx some-tool
        shift
        podman-compose --profile cli run --rm ng "cd /app/Frontend && npx $*"
        ;;
    new)
        # Scaffold new project: ./ng.sh new Frontend --routing --style=css
        # Runs from project root so 'Frontend/' is created as a subdirectory
        podman-compose --profile cli run --rm ng "npx -y @angular/cli $*"
        ;;
    *)
        # Default: Angular CLI commands (generate, build, test, lint, etc.)
        # Runs from inside Frontend/ directory
        podman-compose --profile cli run --rm ng "cd /app/Frontend && npx @angular/cli $*"
        ;;
esac
