#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir -p api

# Print debug info
echo "Build script executed successfully"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Exit successfully
exit 0
