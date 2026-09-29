from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models.compare import ComparisonOut, CountryComparisonOut
from models.country_db import Country
from models.user_db import User
from routes.auth import get_current_user, get_db
from routes.friends import errores_de_amigos
from services import compare_service, friends_service

compare_router = APIRouter(prefix="/compare", tags=["compare"])

# El nombre del amigo va en query (?with=) y no en el path: un username puede
# llevar caracteres como "/" que romperían la ruta.
WithUser = Query(alias="with", min_length=1, max_length=50)


@compare_router.get("", response_model=ComparisonOut)
def comparar_con_amigo(
    with_user: str = WithUser,
    # Minutos de diferencia con UTC, como getTimezoneOffset() de JavaScript;
    # sirve para calcular la racha en la zona horaria del navegador.
    tz_offset: int = Query(0, ge=-840, le=840),
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Estadísticas globales de los dos y resumen por país (solo con amigos)."""
    with errores_de_amigos():
        amigo = friends_service.get_friend_user(db, usuario_actual, with_user)
    return compare_service.get_comparison(db, usuario_actual, amigo, tz_offset)


@compare_router.get("/countries/{country_id}", response_model=CountryComparisonOut)
def comparar_pais(
    country_id: int,
    with_user: str = WithUser,
    usuario_actual: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Detalle región a región de un país (solo con amigos)."""
    with errores_de_amigos():
        amigo = friends_service.get_friend_user(db, usuario_actual, with_user)
    pais = db.query(Country).filter(Country.id == country_id).first()
    if not pais:
        raise HTTPException(status_code=404, detail="País no encontrado")
    return compare_service.get_country_comparison(db, usuario_actual, amigo, pais)
