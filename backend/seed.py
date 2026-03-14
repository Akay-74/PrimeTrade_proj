import uuid
from sqlalchemy import select
from database import AsyncSessionLocal
import models
from auth import hash_password


async def seed_database():
    """Seed default users and sample trades if DB is empty."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(models.User).limit(1))
        if result.scalar_one_or_none():
            return  # Already seeded

        admin_id = str(uuid.uuid4())
        trader1_id = str(uuid.uuid4())
        trader2_id = str(uuid.uuid4())

        users = [
            models.User(
                id=admin_id,
                name="Prime Admin",
                email="admin@primetrade.ai",
                password_hash=hash_password("Admin@123"),
                role="ADMIN",
            ),
            models.User(
                id=trader1_id,
                name="Alex Trader",
                email="trader@primetrade.ai",
                password_hash=hash_password("Trader@123"),
                role="USER",
            ),
            models.User(
                id=trader2_id,
                name="Sarah Moon",
                email="sarah@primetrade.ai",
                password_hash=hash_password("Trader@123"),
                role="USER",
            ),
        ]
        db.add_all(users)
        await db.flush()

        trades = [
            models.Trade(id=str(uuid.uuid4()), coin="BTC", type="BUY", amount=0.5, price=67000.0, total_value=33500.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="ETH", type="BUY", amount=3.0, price=3500.0, total_value=10500.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="SOL", type="SELL", amount=20.0, price=180.0, total_value=3600.0, status="CLOSED", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="BNB", type="BUY", amount=10.0, price=420.0, total_value=4200.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="ETH", type="SELL", amount=1.0, price=3800.0, total_value=3800.0, status="CLOSED", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="BTC", type="BUY", amount=0.2, price=65000.0, total_value=13000.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="AVAX", type="BUY", amount=50.0, price=38.0, total_value=1900.0, status="CANCELLED", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="SOL", type="BUY", amount=15.0, price=195.0, total_value=2925.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="BNB", type="SELL", amount=5.0, price=430.0, total_value=2150.0, status="OPEN", user_id=trader1_id),
            models.Trade(id=str(uuid.uuid4()), coin="AVAX", type="BUY", amount=100.0, price=35.0, total_value=3500.0, status="OPEN", user_id=trader1_id),
        ]
        db.add_all(trades)
        await db.commit()
        print("✓ Database seeded with 3 users and 10 trades")
