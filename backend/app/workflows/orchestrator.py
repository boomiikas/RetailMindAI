"""LangGraph Workflow Orchestrator for RetailMind AI.

Builds a compiled state graph connecting the 7 specialized agents with
persistent checkpointing, conditional branching, and human-in-the-loop approvals.
"""

from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.agents.state import AgentState
from backend.app.agents.monitoring_agent import MonitoringAgent
from backend.app.agents.impact_agent import ImpactAnalysisAgent
from backend.app.agents.optimization_agent import DecisionOptimizationAgent
from backend.app.agents.execution_agent import ExecutionAgent
from backend.app.agents.replanning_agent import DynamicReplanningAgent
from backend.app.core.logging import logger

class RetailMindOrchestrator:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.monitoring_agent = MonitoringAgent(session)
        self.impact_agent = ImpactAnalysisAgent(session)
        self.optimization_agent = DecisionOptimizationAgent(session)
        self.execution_agent = ExecutionAgent(session)
        self.replanning_agent = DynamicReplanningAgent(session)

        self.memory = MemorySaver()
        self.app = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # 1. Define Nodes
        async def monitoring_node(state: AgentState) -> AgentState:
            return await self.monitoring_agent.run(state)

        async def impact_node(state: AgentState) -> AgentState:
            return await self.impact_agent.run(state)

        async def optimization_node(state: AgentState) -> AgentState:
            return await self.optimization_agent.run(state)

        async def execution_node(state: AgentState) -> AgentState:
            return await self.execution_agent.execute_approved_plan(state)

        workflow.add_node("monitoring", monitoring_node)
        workflow.add_node("impact_analysis", impact_node)
        workflow.add_node("optimization", optimization_node)
        workflow.add_node("execution", execution_node)

        # 2. Define Edges & Conditional Routing
        workflow.set_entry_point("monitoring")

        def route_after_monitoring(state: AgentState) -> str:
            if state.get("disruption_type") == "NORMAL":
                return END
            return "impact_analysis"

        workflow.add_conditional_edges(
            "monitoring",
            route_after_monitoring,
            {
                END: END,
                "impact_analysis": "impact_analysis"
            }
        )

        workflow.add_edge("impact_analysis", "optimization")
        workflow.add_edge("optimization", END)
        
        # When approval received, proceeds to execution
        workflow.add_edge("execution", END)

        return workflow.compile(checkpointer=self.memory)

    async def run_detection_pipeline(
        self,
        store_id: str,
        product_id: str
    ) -> AgentState:
    """Runs the monitoring -> impact -> optimization recommendation pipeline."""
        initial_state: AgentState = {
            "workflow_id": f"WF_{store_id}_{product_id}",
            "triggered_at": str(logger),
            "store_id": store_id,
            "product_id": product_id,
            "disruption_type": "UNKNOWN",
            "detected_risk": None,
            "ripple_impact": None,
            "forecast_summary": None,
            "recommendations": [],
            "chosen_recommendation": None,
            "decision_id": None,
            "current_version": 1,
            "decision_status": "PENDING",
            "execution_status": "NOT_STARTED",
            "approval_channel": None,
            "manager_decision": None,
            "option_selected": None,
            "idempotency_key": None,
            "approval_timestamp": None,
            "previous_version_data": None,
            "replanning_reason": None,
            "is_replanned": False,
            "structured_explanation": None,
            "transfer_order_id": None,
            "purchase_order_id": None,
            "execution_logs": [],
            "actual_outcome": None
        }

        config = {"configurable": {"thread_id": f"thread_{store_id}_{product_id}"}}
        result_state = await self.app.ainvoke(initial_state, config=config)
        return result_state
