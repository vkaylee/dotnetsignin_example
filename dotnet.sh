#!/bin/bash

# ==============================================================================
# .NET CLI Docker Wrapper (Zero-Install Host)
# ==============================================================================
# This script acts exactly like Rust's `cargo` command, but inside a container!
# It spins up an ephemeral .NET 8 SDK container, mounts your current code
# directly into it, runs your command, and then immediately destroys the container.
#
# This keeps your host OS completely clean of any 1.5GB .NET SDK installations.
#
# Quick Reference & Equivalents:
# ------------------------------------------------------------------------------
# [Rust/Cargo]             -> [Your .NET Equivalent Here]
# cargo new MyApp          -> ./dotnet.sh new webapp -n MyApp
# cargo build              -> ./dotnet.sh build MyApp/
# cargo add serde          -> cd MyApp && ../dotnet.sh add package System.Text.Json
# cargo run                -> (Use 'podman compose up dotnet-dev' instead for hot-reload)
# cargo clean              -> ./dotnet.sh clean MyApp/
# 
# Note: This relies on the 'cli' profile in compose.yml, meaning this service 
# remains completely dormant and consumes 0 RAM until you execute this script.
# ==============================================================================

# Check & Auto-install Podman Engine & Compose
source "$(dirname "$0")/install_podman_deps.sh"

podman-compose --profile cli run --rm dotnet "$@"
