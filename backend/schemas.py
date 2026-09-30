from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class FollowUpPlanSchema(BaseModel):
    channel: Literal["WhatsApp", "Call", "Email", "SMS"]
    timing: str
    reason: str
    suggested_message: str
    qualification_questions: List[str]


class AnalysisResultSchema(BaseModel):
    lead_score: int = Field(..., ge=0, le=100)
    priority: Literal["HOT", "WARM", "COLD"]
    summary: str
    intent: str
    key_requirements: List[str]
    objections: List[str]
    recommended_action: str
    suggested_response: str
    follow_up_plan: FollowUpPlanSchema


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    property_requirement: str = Field(..., min_length=1)
    budget: str = Field(..., min_length=1)
    buying_timeline: str = Field(..., min_length=1)
    customer_message: str = Field(..., min_length=1)


class LeadResponse(BaseModel):
    id: int
    name: str
    location: str
    property_requirement: str
    budget: str
    buying_timeline: str
    customer_message: str
    analysis: Optional[str] = None
    score: Optional[int] = None
    priority: Optional[str] = None
    follow_up_plan: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer: str
