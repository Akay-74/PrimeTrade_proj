import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

import models
import schemas
from database import get_db
from deps import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/trades", tags=["trades"])


@router.get("/")
async def list_trades(
    type: Optional[str] = None,
    status: Optional[str] = None,
    coin: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(models.Trade)
    if current_user.role != "ADMIN":
        q = q.where(models.Trade.user_id == current_user.id)
    if type:
        q = q.where(models.Trade.type == type.upper())
    if status:
        q = q.where(models.Trade.status == status.upper())
    if coin:
        q = q.where(models.Trade.coin == coin.upper())

    # Count
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginated results
    paginated = q.order_by(models.Trade.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(paginated)
    trades = result.scalars().all()

    # Summary for current user
    summary_q = select(models.Trade)
    if current_user.role != "ADMIN":
        summary_q = summary_q.where(models.Trade.user_id == current_user.id)
    summary_result = await db.execute(summary_q)
    all_trades = summary_result.scalars().all()

    total_invested = sum(t.total_value for t in all_trades if t.status == "OPEN")
    open_count = sum(1 for t in all_trades if t.status == "OPEN")

    trade_list = []
    for t in trades:
        td = _trade_dict(t)
        if current_user.role == "ADMIN":
            # Eagerly load user name
            user_result = await db.execute(select(models.User.name).where(models.User.id == t.user_id))
            td["userName"] = user_result.scalar() or "Unknown"
        trade_list.append(td)

    return {
        "success": True,
        "data": {
            "trades": trade_list,
            "total": total,
            "page": page,
            "totalPages": max(1, -(-total // limit)),
            "summary": {
                "totalInvested": total_invested,
                "totalTrades": len(all_trades),
                "openTrades": open_count,
            },
        },
    }


@router.post("/", status_code=201)
async def create_trade(
    req: schemas.TradeCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_value = req.amount * req.price
    trade = models.Trade(
        id=str(uuid.uuid4()),
        coin=req.coin.upper(),
        type=req.type,
        amount=req.amount,
        price=req.price,
        total_value=total_value,
        status="OPEN",
        notes=req.notes or "",
        user_id=current_user.id,
    )
    db.add(trade)
    await db.commit()
    await db.refresh(trade)
    return {"success": True, "message": "Trade created", "data": {"trade": _trade_dict(trade)}}


@router.get("/summary")
async def trade_summary(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(models.Trade)
    if current_user.role != "ADMIN":
        q = q.where(models.Trade.user_id == current_user.id)
    result = await db.execute(q)
    trades = result.scalars().all()

    total_buy = sum(t.total_value for t in trades if t.type == "BUY")
    total_sell = sum(t.total_value for t in trades if t.type == "SELL")
    open_trades = sum(1 for t in trades if t.status == "OPEN")
    closed_trades = sum(1 for t in trades if t.status == "CLOSED")
    cancelled_trades = sum(1 for t in trades if t.status == "CANCELLED")
    total_invested = sum(t.total_value for t in trades if t.status == "OPEN")

    by_coin = {}
    by_type = {"BUY": 0, "SELL": 0}
    for t in trades:
        by_coin[t.coin] = by_coin.get(t.coin, 0) + 1
        if t.type in by_type:
            by_type[t.type] += 1

    top_coin = max(by_coin, key=by_coin.get) if by_coin else "-"

    return {
        "success": True,
        "data": {
            "totalInvested": total_invested,
            "totalBuyValue": total_buy,
            "totalSellValue": total_sell,
            "openTrades": open_trades,
            "closedTrades": closed_trades,
            "cancelledTrades": cancelled_trades,
            "totalTrades": len(trades),
            "topCoin": top_coin,
            "tradesByType": by_type,
            "tradesByCoin": by_coin,
        },
    }


@router.get("/{trade_id}")
async def get_trade(
    trade_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Trade).where(models.Trade.id == trade_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if trade.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"success": True, "data": {"trade": _trade_dict(trade)}}


@router.patch("/{trade_id}")
async def update_trade(
    trade_id: str,
    req: schemas.TradeUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Trade).where(models.Trade.id == trade_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if trade.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = req.model_dump(exclude_unset=True)
    if "coin" in update_data and update_data["coin"]:
        update_data["coin"] = update_data["coin"].upper()
    for k, v in update_data.items():
        setattr(trade, k, v)

    trade.total_value = trade.amount * trade.price
    await db.commit()
    await db.refresh(trade)
    return {"success": True, "message": "Trade updated", "data": {"trade": _trade_dict(trade)}}


@router.delete("/{trade_id}")
async def delete_trade(
    trade_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(models.Trade).where(models.Trade.id == trade_id))
    trade = result.scalar_one_or_none()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    if trade.user_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(trade)
    await db.commit()
    return {"success": True, "message": "Trade deleted"}


def _trade_dict(t: models.Trade) -> dict:
    return {
        "id": t.id,
        "coin": t.coin,
        "type": t.type,
        "amount": t.amount,
        "price": t.price,
        "totalValue": t.total_value,
        "status": t.status,
        "notes": t.notes,
        "userId": t.user_id,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
        "updatedAt": t.updated_at.isoformat() if t.updated_at else None,
    }
