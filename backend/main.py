from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.charts import router as charts_router
from app.core.config import settings

app = FastAPI(title="Charts API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.allowed_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(charts_router)
