import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import models
import schemas
from database import get_db
from deps import require_admin, get_current_user
from typing import Optional

router = APIRouter(prefix="/api/v1/events", tags=["events"])

@router.get("/")
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Event).order_by(models.Event.date.asc()))
    events = result.scalars().all()
    events_out = [
        {
            "id": e.id,
            "date": e.date,
            "title": e.title,
            "impact": e.impact,
            "type": e.type,
            "description": e.description,
        }
        for e in events
    ]
    return {"success": True, "data": {"events": events_out}}

@router.post("/", status_code=201)
async def create_event(
    req: schemas.EventCreate,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    event = models.Event(
        id=str(uuid.uuid4()),
        date=req.date,
        title=req.title,
        impact=req.impact,
        type=req.type,
        description=req.description,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return {
        "success": True,
        "message": "Event created",
        "data": {
            "event": {
                "id": event.id,
                "date": event.date,
                "title": event.title,
                "impact": event.impact,
                "type": event.type,
                "description": event.description
            }
        }
    }

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Event).where(models.Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()
    return {"success": True, "message": "Event deleted"}
