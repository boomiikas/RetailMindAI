"""Meta WhatsApp Cloud API Client for RetailMind AI."""
from typing import Dict, Any, List, Optional
import httpx
from backend.app.config import settings
from backend.app.core.logging import logger

class WhatsAppClient:
    def __init__(self):
        self.base_url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}"
        self.token = settings.WHATSAPP_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def send_text_message(self, to_phone: str, text: str) -> Dict[str, Any]:
        """Sends a plain text message to a store manager."""
        if settings.USE_MOCK_WHATSAPP:
            logger.info(f"[Mock WhatsApp] To: {to_phone} | Msg: {text[:60]}...")
            return {"status": "mock_sent", "to": to_phone, "message": text}

        url = f"{self.base_url}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "text",
            "text": {"preview_url": False, "body": text}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                if resp.status_code != 200:
                    logger.error(f"WhatsApp API Error: {resp.status_code} - {resp.text}")
                return resp.json()
            except Exception as e:
                logger.error(f"WhatsApp API request failed: {e}")
                return {"error": str(e), "status": "failed"}

    async def send_interactive_options(
        self,
        to_phone: str,
        header_text: str,
        body_text: str,
        decision_id: str,
        version: int,
        options: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Sends an interactive button message presenting 2-3 feasible intervention options."""
        if settings.USE_MOCK_WHATSAPP:
            logger.info(f"[Mock WhatsApp Interactive] To: {to_phone} | Decision: {decision_id} (v{version}) | Options: {len(options)}")
            return {
                "status": "mock_interactive_sent",
                "decision_id": decision_id,
                "version": version,
                "options": options
            }

        url = f"{self.base_url}/messages"
        buttons = []
        for opt in options[:3]:
            buttons.append({
                "type": "reply",
                "reply": {
                    "id": f"{decision_id}:v{version}:{opt.get('action_type', 'OPT')}",
                    "title": opt.get("title", "Select")[:20]
                }
            })

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "header": {"type": "text", "text": header_text},
                "body": {"text": body_text},
                "action": {"buttons": buttons}
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.post(url, json=payload, headers=self.headers)
                return resp.json()
            except Exception as e:
                logger.error(f"WhatsApp API request failed: {e}")
                return {"error": str(e), "status": "failed"}
