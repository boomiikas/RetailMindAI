"""Real-Time WebSocket Connection Manager for RetailMind AI.

Broadcasts live operational events (alerts, approvals, replanning, execution updates)
to connected React dashboard frontend clients.
"""

from typing import List, Dict, Any
from fastapi import WebSocket
from backend.app.core.logging import logger

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocket] Client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocket] Client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_event(self, event_type: str, data: Dict[str, Any]):
        """Broadcasts a typed JSON event to all connected dashboard subscribers."""
        payload = {
            "event": event_type,
            "data": data
        }
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"[WebSocket] Failed to send to client: {e}")
                disconnected.append(connection)

        for dead_conn in disconnected:
            self.disconnect(dead_conn)

ws_manager = WebSocketManager()
