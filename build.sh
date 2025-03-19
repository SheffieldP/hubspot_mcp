#!/bin/bash

# Install Python dependencies
python -m pip install -r requirements.txt 2>/dev/null || pip3 install -r requirements.txt 2>/dev/null || echo "Warning: Failed to install Python dependencies"

# Create necessary directories
mkdir -p api

# Create the public directory that Vercel requires
mkdir -p public
touch public/.gitkeep

# Print debug info
echo "Build script executed successfully"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la
echo "Files in public directory:"
ls -la public

# Exit successfully
exit 0
