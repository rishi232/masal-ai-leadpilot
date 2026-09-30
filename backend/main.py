import json
import logging
import os
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

load_dotenv()

from database import Base, engine, get_db
import models
import schemas
from ai_service import analyze_lead, chat_with_lead

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("leadpilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    yield


app = FastAPI(
    title="LeadPilot AI API",
    description="Real-Estate Sales Inbound Lead Intelligence Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
)
origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "ok"}


@app.post("/leads", response_model=schemas.LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(lead_in: schemas.LeadCreate, db: Session = Depends(get_db)):
    new_lead = models.Lead(
        name=lead_in.name.strip(),
        location=lead_in.location.strip(),
        property_requirement=lead_in.property_requirement.strip(),
        budget=lead_in.budget.strip(),
        buying_timeline=lead_in.buying_timeline.strip(),
        customer_message=lead_in.customer_message.strip(),
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead


@app.get("/leads", response_model=List[schemas.LeadResponse], status_code=status.HTTP_200_OK)
def list_leads(db: Session = Depends(get_db)):
    # Sorted by score DESC (nulls last), then created_at DESC
    leads = (
        db.query(models.Lead)
        .order_by(
            models.Lead.score.is_(None),  # false (0) comes first, null (1) comes last
            models.Lead.score.desc(),
            models.Lead.created_at.desc(),
        )
        .all()
    )
    return leads


@app.get("/leads/{id}", response_model=schemas.LeadResponse, status_code=status.HTTP_200_OK)
def get_lead(id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {id} not found")
    return lead


@app.post("/leads/{id}/analyze", response_model=schemas.LeadResponse, status_code=status.HTTP_200_OK)
def analyze_lead_endpoint(id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {id} not found")

    lead_dict = {
        "id": lead.id,
        "name": lead.name,
        "location": lead.location,
        "property_requirement": lead.property_requirement,
        "budget": lead.budget,
        "buying_timeline": lead.buying_timeline,
        "customer_message": lead.customer_message,
    }

    validated_result = analyze_lead(lead_dict)

    # Save to database
    lead.score = validated_result.lead_score
    lead.priority = validated_result.priority
    lead.analysis = validated_result.model_dump_json()
    lead.follow_up_plan = validated_result.follow_up_plan.model_dump_json()
    lead.updated_at = models.utcnow()

    db.commit()
    db.refresh(lead)
    return lead


@app.post("/leads/{id}/chat", response_model=schemas.ChatResponse, status_code=status.HTTP_200_OK)
def chat_lead_endpoint(id: int, body: schemas.ChatRequest, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {id} not found")

    analysis_data = None
    if lead.analysis:
        try:
            analysis_data = json.loads(lead.analysis)
        except Exception:
            analysis_data = None

    lead_dict = {
        "id": lead.id,
        "name": lead.name,
        "location": lead.location,
        "property_requirement": lead.property_requirement,
        "budget": lead.budget,
        "buying_timeline": lead.buying_timeline,
        "customer_message": lead.customer_message,
    }

    answer = chat_with_lead(lead_dict, analysis_data, body.question)
    return schemas.ChatResponse(answer=answer)


@app.delete("/leads/{id}", status_code=status.HTTP_200_OK)
def delete_lead(id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with id {id} not found")

    db.delete(lead)
    db.commit()
    return {"detail": f"Lead {id} deleted successfully"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
