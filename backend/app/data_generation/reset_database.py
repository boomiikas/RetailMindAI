"""Database reset utility for RetailMind AI.

Drops all database tables and cleans state for fresh experiments.
"""

import asyncio
from backend.app.database.session import engine, Base
from backend.app.models import *
from backend.app.core.logging import logger

async def reset_db():
    print("=" * 70)
    print(" WARNING: Resetting RetailMind AI Database (Dropping all tables)...")
    print("=" * 70)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("[OK] Dropped all existing tables.")
        await conn.run_sync(Base.metadata.create_all)
        print("[OK] Re-created all 27 tables cleanly.")
    print("=" * 70)
    print(" Database Reset Completed!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(reset_db())
