"""
Module entry point for running src package as a module

Usage:
    python -m src.init_config [options]
"""

import sys

if __name__ == '__main__':
    # Check which submodule to run based on command
    if len(sys.argv) > 1 and 'init_config' in sys.argv[0]:
        from .init_config import main
        main()
    else:
        print("Usage: python -m src.init_config [options]")
        sys.exit(1)
