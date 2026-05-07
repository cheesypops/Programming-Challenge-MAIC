import os

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional dependency until user adds it
    load_dotenv = None

if load_dotenv is not None:
    load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.allowed_origins = [
            "https://analisis-al-instante-con-ia.vercel.app",
            "http://localhost:5173",
        ]
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.google_model = os.getenv("GOOGLE_MODEL")


settings = Settings()
