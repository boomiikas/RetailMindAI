"""Local Mock WhatsApp Adapter for RetailMind AI.

Simulates inbound store manager WhatsApp queries, button approvals, and daily summaries
without requiring live Meta WhatsApp Cloud API credentials.
"""

from typing import Dict, List, Any, Optional
from backend.app.core.logging import logger

class MockWhatsAppAdapter:
    def __init__(self):
        self.sent_messages: List[Dict[str, Any]] = []
        self.pending_interactions: Dict[str, Dict[str, Any]] = {}

    def record_sent(self, to_phone: str, content: Dict[str, Any]):
        self.sent_messages.append({"to": to_phone, "content": content})
        if "decision_id" in content:
            self.pending_interactions[content["decision_id"]] = content

    def simulate_manager_button_click(
        self,
        manager_phone: str,
        decision_id: str,
        version: int,
        option_chosen: str # e.g. "INTER_STORE_TRANSFER" or "1"
    ) -> Dict[str, Any]:
        """Simulates an interactive WhatsApp button reply webhook payload."""
        return {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "mock_waba_id",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "metadata": {"display_phone_number": "15550234567", "phone_number_id": "mock_phone_id"},
                                "contacts": [{"profile": {"name": "Store Manager"}, "wa_id": manager_phone.replace("+", "")}],
                                "messages": [
                                    {
                                        "from": manager_phone.replace("+", ""),
                                        "id": f"wamid_mock_{decision_id}_{version}",
                                        "timestamp": "1730370000",
                                        "type": "interactive",
                                        "interactive": {
                                            "type": "button_reply",
                                            "button_reply": {
                                                "id": f"{decision_id}:v{version}:{option_chosen}",
                                                "title": f"Approve {option_chosen}"
                                            }
                                        }
                                    }
                                ]
                            },
                            "field": "messages"
                        }
                    ]
                }
            ]
        }

    def simulate_manager_text_message(
        self,
        manager_phone: str,
        text: str
    ) -> Dict[str, Any]:
        """Simulates an incoming plain text question from a manager."""
        return {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "mock_waba_id",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "metadata": {"display_phone_number": "15550234567", "phone_number_id": "mock_phone_id"},
                                "contacts": [{"profile": {"name": "Store Manager"}, "wa_id": manager_phone.replace("+", "")}],
                                "messages": [
                                    {
                                        "from": manager_phone.replace("+", ""),
                                        "id": f"wamid_text_{int(logger.name.__hash__())}",
                                        "timestamp": "1730370000",
                                        "type": "text",
                                        "text": {"body": text}
                                    }
                                ]
                            },
                            "field": "messages"
                        }
                    ]
                }
            ]
        }

mock_whatsapp = MockWhatsAppAdapter()
