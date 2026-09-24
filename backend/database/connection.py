import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # comprueba la conexión antes de usarla; si Neon
                              # la cerró por autosuspend, la descarta y abre
                              # una nueva en vez de fallar o colgarse
    pool_recycle=280,        # recicla conexiones cada ~4.5 min, antes de que
                              # Neon las cierre por inactividad (autosuspend
                              # suele ser a los 5 min en el plan free)
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(bind=engine)