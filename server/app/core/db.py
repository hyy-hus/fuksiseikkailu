import time
import logging
from sqlmodel import create_engine, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

for _ in range(10):
    try:
        engine = create_engine(settings.DATABASE_URL, echo=False)
        break
    except Exception as e:
        logger.warning("Database not ready, retrying in 3s...")
        logger.error(f"Error: {e}")
        time.sleep(3)
else:
    raise RuntimeError("Database not reachable")


def get_session():
    with Session(engine) as session:
        yield session
