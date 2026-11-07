"""Learning Agent (Backward Compatibility Wrapper).

Routes directly to deterministic PerformanceEvaluationService.
"""
from backend.app.services.performance.performance_service import PerformanceEvaluationService, LearningAgent

__all__ = ["PerformanceEvaluationService", "LearningAgent"]
