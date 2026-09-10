# AI Microservice (FastAPI + Gemini API)

This microservice provides automated classification, SLA determination, and initial response drafting for technical support tickets and customer complaints.

## Running Locally

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI application:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `GET /health`: Health check and Gemini API key status
- `POST /classify`: Classify a ticket and return `{category, priority, suggestedResponse, slaHours}`
