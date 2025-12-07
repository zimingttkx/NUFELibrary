#!/bin/bash

# Get the directory where the script is located
DIR="$(cd "$(dirname "$0")" && pwd)"
OS="$(uname -s)"

echo "Checking system type..."

if [ "$OS" = "Darwin" ]; then
    echo "Detected macOS system."
    TARGET="$DIR/cli/dist/library-reserve-cli-macos"
    if [ -f "$TARGET" ]; then
        echo "Launching macOS version..."
        chmod +x "$TARGET"
        "$TARGET"
    else
        echo "Error: macOS executable not found at $TARGET"
        echo "Please run 'npm run build' in the cli directory first."
        exit 1
    fi
elif [ "$OS" = "Linux" ]; then
    echo "Detected Linux system."
    TARGET="$DIR/cli/dist/library-reserve-cli-linux"
    if [ -f "$TARGET" ]; then
        echo "Launching Linux version..."
        chmod +x "$TARGET"
        "$TARGET"
    else
        echo "Error: Linux executable not found at $TARGET"
        echo "Please run 'npm run build' in the cli directory first."
        exit 1
    fi
else
    # Fallback/Check for Windows environment (e.g., Git Bash, Cygwin)
    if [[ "$OS" == MINGW* ]] || [[ "$OS" == CYGWIN* ]] || [[ "$OS" == MSYS* ]]; then
        echo "Detected Windows environment (Bash)."
        TARGET="$DIR/cli/dist/library-reserve-cli-win.exe"
        if [ -f "$TARGET" ]; then
            echo "Launching Windows version..."
            "$TARGET"
        else
            echo "Error: Windows executable not found at $TARGET"
            exit 1
        fi
    else
        echo "Unknown or unsupported operating system: $OS"
        exit 1
    fi
fi
