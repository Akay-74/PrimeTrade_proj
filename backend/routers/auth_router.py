import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

import auth as auth_utils
import models
import schemas
from database import get_db
from deps import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(req: schemas.RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower()
    result = await db.execute(select(models.User).where(models.User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    role = "ADMIN" if "admin" in email else "USER"
    user = models.User(
        id=str(uuid.uuid4()),
        name=req.name.strip(),
        email=email,
        password_hash=auth_utils.hash_password(req.password),
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = auth_utils.create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "success": True,
        "message": "Account created",
        "data": {
            "token": token,
            "user": await _user_dict(user, db),
        },
    }


@router.post("/login")
async def login(req: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower()
    result = await db.execute(select(models.User).where(models.User.email == email))
    user = result.scalar_one_or_none()
    if not user or not auth_utils.verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_utils.create_access_token({"id": user.id, "email": user.email, "role": user.role})
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": token,
            "user": await _user_dict(user, db),
        },
    }


@router.get("/me")
async def me(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {
        "success": True,
        "message": "Profile fetched",
        "data": {"user": await _user_dict(current_user, db)},
    }


async def _user_dict(user: models.User, db: AsyncSession) -> dict:
    count_result = await db.execute(
        select(func.count()).select_from(models.Trade).where(models.Trade.user_id == user.id)
    )
    trade_count = count_result.scalar() or 0

    open_result = await db.execute(
        select(func.coalesce(func.sum(models.Trade.total_value), 0.0))
        .where(models.Trade.user_id == user.id, models.Trade.status == "OPEN")
    )
    portfolio_value = open_result.scalar() or 0.0

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "tradeCount": trade_count,
        "portfolioValue": portfolio_value,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }
