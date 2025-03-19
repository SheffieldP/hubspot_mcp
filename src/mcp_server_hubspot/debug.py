#!/usr/bin/env python
# Debug script to test Python environment in Replit

import sys
import os
import json
import traceback

def main():
    # Print debug information about the environment
    debug_info = {
        "python_version": sys.version,
        "python_path": sys.executable,
        "cwd": os.getcwd(),
        "env_vars": {k: v for k, v in os.environ.items() if not k.startswith("_")},
        "sys_path": sys.path,
        "arguments": sys.argv
    }
    
    # Try to import important modules
    try:
        import hubspot
        debug_info["hubspot_version"] = hubspot.__version__
    except Exception as e:
        debug_info["hubspot_import_error"] = str(e)
        debug_info["hubspot_traceback"] = traceback.format_exc()
    
    try:
        from mcp import server
        debug_info["mcp_found"] = True
    except Exception as e:
        debug_info["mcp_import_error"] = str(e)
        debug_info["mcp_traceback"] = traceback.format_exc()
    
    print(json.dumps(debug_info, indent=2, default=str))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        error_info = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_info, indent=2))
