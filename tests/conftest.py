import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
for demo in sorted((ROOT / "demos").iterdir()):
    if demo.is_dir():
        sys.path.insert(0, str(demo))
