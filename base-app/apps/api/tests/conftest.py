import os
import tempfile
from pathlib import Path

import pytest

# Fixed seed ids reused across tests.
RIVERSIDE_ID = "11111111-1111-1111-1111-111111111111"
METRO_ID = "22222222-2222-2222-2222-222222222222"
HARBOUR_ID = "33333333-3333-3333-3333-333333333333"

_TMP_DB = Path(tempfile.gettempdir()) / "pch_test.db"


def pytest_configure(config: pytest.Config) -> None:
    if _TMP_DB.exists():
        _TMP_DB.unlink()
    os.environ["HUB_DATABASE_URL"] = f"sqlite:///{_TMP_DB}"
    os.environ["HUB_SEED_ON_STARTUP"] = "true"


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    with TestClient(app) as c:  # triggers lifespan -> create tables + seed
        yield c
