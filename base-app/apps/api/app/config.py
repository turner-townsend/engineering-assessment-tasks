from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root = base-app/ (three parents up from this file: app/ -> api/ -> apps/ -> base-app/)
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SEED_PATH = REPO_ROOT / "contracts" / "seed-data.json"


class Settings(BaseSettings):
    """Runtime configuration. Defaults work for local dev without Docker.

    SQLite by default so the API runs and tests pass with zero infra.
    Set DATABASE_URL to a Postgres DSN in Docker Compose.
    """

    model_config = SettingsConfigDict(env_prefix="HUB_", extra="ignore")

    database_url: str = "sqlite:///./local.db"
    seed_path: str = str(DEFAULT_SEED_PATH)
    seed_on_startup: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
