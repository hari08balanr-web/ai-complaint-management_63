from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Technical Support Classifier Microservice",
    description="FastAPI service calling Gemini API to classify support tickets and complaints.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TicketClassifyRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None

class TicketClassifyResponse(BaseModel):
    category: str
    priority: str
    suggestedResponse: str
    slaHours: int

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "MY_GEMINI_API_KEY":
        return None
    return genai.Client(api_key=api_key)

@app.get("/health")
def health_check():
    has_key = bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "MY_GEMINI_API_KEY")
    return {"status": "ok", "service": "fastapi-gemini-classifier", "gemini_configured": has_key}

@app.post("/classify", response_model=TicketClassifyResponse)
async def classify_ticket(req: TicketClassifyRequest):
    if not req.title or not req.description:
        raise HTTPException(status_code=400, detail="Title and description are required.")

    client = get_gemini_client()
    
    # Heuristic fallback if GEMINI_API_KEY is not configured
    if not client:
        text = f"{req.title} {req.description}".lower()
        category = req.category or "Software Bug"
        priority = "Medium"
        sla_hours = 24
        
        if any(w in text for w in ["outage", "down", "critical", "crash", "504", "fatal", "emergency"]):
            category = "Cloud & Infrastructure"
            priority = "Critical"
            sla_hours = 1
        elif any(w in text for w in ["sso", "auth", "login", "security", "breach", "token", "password"]):
            category = "Account & Authentication"
            priority = "High"
            sla_hours = 4
        elif any(w in text for w in ["billing", "invoice", "refund", "charge", "payment", "card"]):
            category = "Billing & Invoicing"
            priority = "Medium"
            sla_hours = 24
        elif any(w in text for w in ["latency", "slow", "timeout", "lag", "performance"]):
            category = "Performance & Latency"
            priority = "High"
            sla_hours = 4
            
        suggested = (
            f"Hello, thank you for submitting this ticket regarding \"{req.title}\". "
            f"Based on automated triage, this request has been assigned **{priority}** priority "
            f"under the **{category}** category (target SLA window: {sla_hours} hours). "
            f"Our engineering team has been notified. If you have relevant stack traces or environment logs, "
            f"please share them in this thread."
        )
        return TicketClassifyResponse(
            category=category,
            priority=priority,
            suggestedResponse=suggested,
            slaHours=sla_hours
        )

    prompt = f"""You are a Principal Technical Support Dispatcher and Incident Response Specialist.
Analyze the following service request / customer complaint:
Title: {req.title}
Description: {req.description}
User-Selected Category: {req.category or 'Unspecified'}

Classify the issue and return ONLY a valid JSON object matching this schema:
{{
  "category": "One of: Software Bug, Network & Connectivity, Cloud & Infrastructure, Account & Authentication, Billing & Invoicing, Performance & Latency, Hardware Issue, Service Complaint",
  "priority": "One of: Critical, High, Medium, Low",
  "slaHours": (1 for Critical, 4 for High, 24 for Medium, 48 for Low),
  "suggestedResponse": "A professional, empathetic, and actionable technical first response from the AI Assistant directly to the user. Explain understanding of the issue, offer 1-3 immediate troubleshooting checks or steps, and confirm their ticket is being actively tracked."
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        data = json.loads(response.text)
        
        valid_priorities = ["Critical", "High", "Medium", "Low"]
        priority = data.get("priority", "Medium")
        if priority not in valid_priorities:
            priority = "Medium"
            
        sla_map = {"Critical": 1, "High": 4, "Medium": 24, "Low": 48}
        sla_hours = data.get("slaHours", sla_map.get(priority, 24))
        
        return TicketClassifyResponse(
            category=data.get("category", req.category or "Software Bug"),
            priority=priority,
            suggestedResponse=data.get("suggestedResponse", "Your request has been received and is being analyzed by our technical support engineers."),
            slaHours=sla_hours
        )
    except Exception as e:
        print(f"Error invoking Gemini API: {e}")
        # Return intelligent graceful triage
        return TicketClassifyResponse(
            category=req.category or "Software Bug",
            priority="Medium",
            suggestedResponse=f"Thank you for contacting technical support regarding \"{req.title}\". We have received your submission and our team is reviewing your diagnostics.",
            slaHours=24
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
