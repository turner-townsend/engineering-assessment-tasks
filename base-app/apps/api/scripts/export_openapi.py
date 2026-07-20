"""Export the FastAPI OpenAPI schema to contracts/ for client generation."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CONTRACTS_DIR = REPO_ROOT / "contracts"


def export_openapi() -> dict:
    from app.main import app

    return app.openapi()


def main() -> None:
    schema = export_openapi()
    CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)

    json_path = CONTRACTS_DIR / "openapi.json"
    json_path.write_text(json.dumps(schema, indent=2) + "\n")

    print(f"Wrote {json_path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"openapi export failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
