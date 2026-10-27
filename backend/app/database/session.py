import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logging_config import logger


def get_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        return create_engine(db_url, connect_args=connect_args)
    else:
        # PostgreSQL with psycopg2 or psycopg
        try:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 2}
            )
            # Test connection
            with engine.connect() as conn:
                pass
            return engine
        except Exception as e:
            logger.warning(
                f"Could not connect to PostgreSQL at {db_url} ({e}). "
                "Falling back to local SQLite database for development."
            )
            fallback_url = "sqlite:///./projectpulse.db"
            return create_engine(fallback_url, connect_args={"check_same_thread": False})


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
