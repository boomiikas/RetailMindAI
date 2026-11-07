"""Replanning Agent (Backward Compatibility Wrapper).

Routes directly to deterministic DynamicReplanningService.
"""
from backend.app.services.replanning.replanning_service import DynamicReplanningService, DynamicReplanningAgent

__all__ = ["DynamicReplanningService", "DynamicReplanningAgent"]
