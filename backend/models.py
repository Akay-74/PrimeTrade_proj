from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from database import Base


class RoleEnum(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class TradeTypeEnum(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class TradeStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=RoleEnum.USER.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    trades = relationship("Trade", back_populates="user", cascade="all, delete-orphan")


class CoinPrice(Base):
    __tablename__ = "coin_prices"
    
    symbol = Column(String, primary_key=True, index=True) # e.g. BTC
    price = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Trade(Base):
    __tablename__ = "trades"

    id = Column(String, primary_key=True, index=True)
    coin = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    status = Column(String, default=TradeStatusEnum.OPEN.value)
    notes = Column(String, default="")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="trades")

class EventImpact(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class EventTypeEnum(str, enum.Enum):
    MACRO = "macro"
    CRYPTO = "crypto"
    EVENT = "event"

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    date = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    impact = Column(String, nullable=False)
    type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
