"""Execution Agent (Backward Compatibility Wrapper).

Routes directly to deterministic ExecutionService.
"""
from backend.app.services.execution.execution_service import ExecutionService, ExecutionAgent

__all__ = ["ExecutionService", "ExecutionAgent"]
