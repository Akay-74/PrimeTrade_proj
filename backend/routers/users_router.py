from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

import models
import schemas
from database import get_db
from deps import require_admin

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = select(models.User)
    if search:
        s = f"%{search}%"
        q = q.where(models.User.name.ilike(s) | models.User.email.ilike(s))

    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    paginated = q.order_by(models.User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(paginated)
    users = result.scalars().all()

    user_list = []
    for u in users:
        trades_result = await db.execute(select(models.Trade).where(models.Trade.user_id == u.id))
        trades = trades_result.scalars().all()
        portfolio = sum(t.total_value for t in trades if t.status == "OPEN")
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "tradeCount": len(trades),
            "portfolioValue": portfolio,
            "createdAt": u.created_at.isoformat() if u.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "users": user_list,
            "total": total,
            "page": page,
            "totalPages": max(1, -(-total // limit)),
        },
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    trades_result = await db.execute(select(models.Trade).where(models.Trade.user_id == user.id))
    trades = trades_result.scalars().all()
    trade_list = []
    for t in trades:
        trade_list.append({
            "id": t.id, "coin": t.coin, "type": t.type,
            "amount": t.amount, "price": t.price, "totalValue": t.total_value,
            "status": t.status, "notes": t.notes,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "user": {
                "id": user.id, "name": user.name, "email": user.email,
                "role": user.role,
                "createdAt": user.created_at.isoformat() if user.created_at else None,
            },
            "trades": trade_list,
        },
    }


@router.patch("/{user_id}/role")
async def update_role(
    user_id: str,
    req: schemas.RoleUpdate,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = req.role
    await db.commit()
    return {"success": True, "message": f"Role updated to {req.role}"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: models.User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()
    return {"success": True, "message": "User and their trades deleted"}
