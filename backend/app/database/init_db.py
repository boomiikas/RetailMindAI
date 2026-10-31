"""Database table creation and initialization utility."""
import asyncio
from backend.app.database.session import engine, Base
from backend.app.models import * # Import all models so metadata is complete
from backend.app.core.logging import logger

async def init_db():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Initialized {len(Base.metadata.tables)} database tables successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
