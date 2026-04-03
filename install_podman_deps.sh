#!/bin/bash

# 1. Check & Auto-install Podman Engine
if ! command -v podman &> /dev/null; then
    echo "Podman is not installed. Attempting to auto-install..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y podman
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y podman
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm podman
    else
        echo "Unsupported package manager. Please install Podman manually."
        exit 1
    fi
    echo "Podman installed successfully!"
fi

# 2. Check & Auto-install Podman Compose
if ! command -v podman-compose &> /dev/null; then
    echo "podman-compose is not installed. Attempting to auto-install..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y podman-compose
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y podman-compose
    elif command -v pip3 &> /dev/null; then
        pip3 install podman-compose
    else
        echo "Please install podman-compose manually."
        exit 1
    fi
    echo "podman-compose installed successfully!"
fi
