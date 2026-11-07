"""Store Manager Agent (Backward Compatibility Wrapper).

Routes directly to DecisionCommunicationAgent.
"""
from backend.app.agents.communication_agent import DecisionCommunicationAgent, StoreManagerAgent

__all__ = ["DecisionCommunicationAgent", "StoreManagerAgent"]
