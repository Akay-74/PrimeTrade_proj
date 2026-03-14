from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime


# ── Auth ──
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_min(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least 1 uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least 1 number")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None
    trade_count: int = 0
    portfolio_value: float = 0.0

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    success: bool = True
    message: str
    data: dict


# ── Trade ──
class TradeCreate(BaseModel):
    coin: str
    type: str
    amount: float
    price: float
    notes: Optional[str] = ""

    @field_validator("coin")
    @classmethod
    def coin_upper(cls, v):
        v = v.strip().upper()
        if len(v) < 1 or len(v) > 10:
            raise ValueError("Coin must be 1–10 characters")
        return v

    @field_validator("type")
    @classmethod
    def type_valid(cls, v):
        if v not in ("BUY", "SELL"):
            raise ValueError("Type must be BUY or SELL")
        return v

    @field_validator("amount")
    @classmethod
    def amount_pos(cls, v):
        if v <= 0:
            raise ValueError("Amount must be > 0")
        return v

    @field_validator("price")
    @classmethod
    def price_pos(cls, v):
        if v <= 0:
            raise ValueError("Price must be > 0")
        return v


class TradeUpdate(BaseModel):
    coin: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    price: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TradeOut(BaseModel):
    id: str
    coin: str
    type: str
    amount: float
    price: float
    total_value: float
    status: str
    notes: Optional[str] = ""
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class TradeListResponse(BaseModel):
    success: bool = True
    data: dict


class TradeSummary(BaseModel):
    total_invested: float = 0
    total_buy_value: float = 0
    total_sell_value: float = 0
    open_trades: int = 0
    closed_trades: int = 0
    cancelled_trades: int = 0
    total_trades: int = 0
    top_coin: str = "-"
    trades_by_type: dict = {}
    trades_by_coin: dict = {}


# ── Coins ──
class CoinPriceCreate(BaseModel):
    price: float

    @field_validator("price")
    @classmethod
    def price_pos(cls, v):
        if v <= 0:
            raise ValueError("Price must be > 0")
        return v


class CoinPriceOut(BaseModel):
    symbol: str
    price: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Users (admin) ──
class RoleUpdate(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v):
        if v not in ("USER", "ADMIN"):
            raise ValueError("Role must be USER or ADMIN")
        return v


class ApiResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None
    errors: Optional[list] = None

# ── Events ──
class EventCreate(BaseModel):
    date: str
    title: str
    impact: str
    type: str
    description: str

class EventUpdate(BaseModel):
    date: Optional[str] = None
    title: Optional[str] = None
    impact: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None

class EventOut(BaseModel):
    id: str
    date: str
    title: str
    impact: str
    type: str
    description: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
