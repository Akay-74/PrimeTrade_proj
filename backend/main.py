from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from seed import seed_database
from routers import auth_router, trades_router, users_router, events_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="PrimeTrade Portfolio API",
    description="Async REST API for crypto portfolio tracking",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(trades_router.router)
app.include_router(users_router.router)
app.include_router(events_router.router)


@app.get("/")
async def root():
    return {"message": "PrimeTrade API v2 — visit /docs for Swagger documentation"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
