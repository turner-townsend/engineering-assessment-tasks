#!/usr/bin/env python
"""Manually (re)seed the database from contracts/seed-data.json.

Usage (from apps/api with its venv active, or in the api container):
    python ../../tools/seed/seed.py

The API also seeds automatically on startup (HUB_SEED_ON_STARTUP=true), so this
script is mainly for re-seeding or running the seed outside the app lifecycle.
"""
import sys
from pathlib import Path

# Make the api package importable when run from the repo root.
API_DIR = Path(__file__).resolve().parents[2] / "apps" / "api"
sys.path.insert(0, str(API_DIR))

from app.db.base import Base, SessionLocal, engine  # noqa: E402
from app.seed import seed_database  # noqa: E402


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        inserted = seed_database(db)
        print("Seed inserted" if inserted else "Seed skipped (data already present)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
