"""Pytest configuration and fixtures for RetailMind AI."""
import pytest
import pytest_asyncio
from backend.app.database.session import engine

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db_connections():
    """Ensure connection pool is cleanly disposed between test event loops."""
    yield
    await engine.dispose()
