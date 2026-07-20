import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.db.base import Base, SessionLocal, engine
from app.routers import benchmarks, change_orders, projects
from app.seed import seed_database


def init_db_and_seed() -> None:
    """Create tables and seed. Retries Postgres briefly while Docker DNS comes up."""
    settings = get_settings()
    is_sqlite = settings.database_url.startswith("sqlite")
    attempts = 1 if is_sqlite else 15
    delay_seconds = 2.0

    for attempt in range(1, attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            if settings.seed_on_startup:
                db = SessionLocal()
                try:
                    seed_database(db, settings.seed_path)
                finally:
                    db.close()
            return
        except OperationalError:
            if attempt == attempts:
                raise
            time.sleep(delay_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_and_seed()
    yield


app = FastAPI(
    title="Project Controls Hub API",
    version="1.0.0",
    description=(
        "Base-app API for the Turner & Townsend interview kit. "
        "OpenAPI is exported from this app to contracts/openapi.json."
    ),
    lifespan=lifespan,
)

# The Angular dev server (http://localhost:4200) calls this API directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(change_orders.router)
app.include_router(benchmarks.router)
