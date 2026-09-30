from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    property_requirement = Column(String, nullable=False)
    budget = Column(String, nullable=False)
    buying_timeline = Column(String, nullable=False)
    customer_message = Column(Text, nullable=False)
    analysis = Column(Text, nullable=True)  # JSON string of AI analysis
    score = Column(Integer, nullable=True)   # 0 - 100
    priority = Column(String, nullable=True)  # HOT / WARM / COLD
    follow_up_plan = Column(Text, nullable=True)  # JSON string of follow_up_plan
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
