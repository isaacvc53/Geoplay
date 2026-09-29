"""Comparación de estadísticas entre el usuario actual y uno de sus amigos.

Diseño: todo se calcula con un número FIJO de consultas (sesiones de los dos
jugadores, aciertos de los dos y países implicados), sin importar cuántas
partidas o países haya. Solo se puede comparar con amigos ya aceptados
(friends_service.get_friend_user lo comprueba).
"""
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from models.compare import (
    CompareCountryOut,
    CompareRegionOut,
    CompareRegionSideOut,
    CompareSideOut,
    CompareUserOut,
    ComparisonOut,
    CountryComparisonOut,
)
from models.country_db import Country
from models.progress_db import GameSession, GameSessionAnswer
from models.region_db import Region
from models.user_db import User
from models.utc import now_utc_naive
from services.progress_service import _mejor_sesion, _nombre_region


def _pct(correct: int, total: int) -> float:
    return round(correct / total * 100, 1) if total else 0.0


def _streak(played_at: list[datetime], tz_offset: int) -> int:
    """Días consecutivos jugando hasta hoy (si hoy aún no se jugó, cuenta desde
    ayer). Mismo criterio que el perfil, pero en la zona horaria de quien
    consulta: tz_offset es el de JavaScript (getTimezoneOffset: UTC - local,
    en minutos), así que hora local = UTC - tz_offset."""
    if not played_at:
        return 0
    shift = timedelta(minutes=tz_offset)
    days = {(d - shift).date() for d in played_at}
    cursor = (now_utc_naive() - shift).date()
    if cursor not in days:
        cursor -= timedelta(days=1)
    streak = 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _accuracy_by_user(db: Session, user_ids: list[int]) -> dict[int, float]:
    filas = (
        db.query(
            GameSession.user_id,
            func.count(GameSessionAnswer.id),
            func.sum(case((GameSessionAnswer.correct.is_(True), 1), else_=0)),
        )
        .join(GameSessionAnswer, GameSessionAnswer.session_id == GameSession.id)
        .filter(GameSession.user_id.in_(user_ids))
        .group_by(GameSession.user_id)
        .all()
    )
    return {uid: _pct(aciertos or 0, intentos) for uid, intentos, aciertos in filas if intentos}


def _side(sesiones: list) -> CompareSideOut:
    mejor = _mejor_sesion(sesiones)
    return CompareSideOut(
        games_played=len(sesiones),
        best_percentage=_pct(mejor.correct_regions, mejor.total_regions),
        best_time_seconds=mejor.time_seconds,
        last_played_at=max(s.played_at for s in sesiones),
    )


def get_comparison(db: Session, me: User, friend: User, tz_offset: int = 0) -> ComparisonOut:
    ids = [me.id, friend.id]

    filas = (
        db.query(
            GameSession.user_id,
            GameSession.country_id,
            GameSession.total_regions,
            GameSession.correct_regions,
            GameSession.time_seconds,
            GameSession.played_at,
        )
        .filter(GameSession.user_id.in_(ids))
        .all()
    )
    # user_id -> country_id -> [sesiones]
    por_usuario: dict[int, dict[int, list]] = {uid: defaultdict(list) for uid in ids}
    for fila in filas:
        por_usuario[fila.user_id][fila.country_id].append(fila)

    acierto = _accuracy_by_user(db, ids)

    def resumen(user: User) -> CompareUserOut:
        por_pais = por_usuario[user.id]
        todas = [s for lista in por_pais.values() for s in lista]
        mejores = [_mejor_sesion(lista) for lista in por_pais.values()]
        perfectas = [
            s.time_seconds
            for s in todas
            if s.total_regions and s.correct_regions == s.total_regions and s.time_seconds is not None
        ]
        return CompareUserOut(
            user_id=user.id,
            username=user.username,
            member_since=user.created_at,
            games_played=len(todas),
            countries_played=len(por_pais),
            accuracy=acierto.get(user.id),
            mastered_count=sum(
                1 for m in mejores if m.total_regions and m.correct_regions == m.total_regions
            ),
            streak=_streak([s.played_at for s in todas], tz_offset),
            fastest_perfect_seconds=min(perfectas) if perfectas else None,
            last_played_at=max((s.played_at for s in todas), default=None),
        )

    country_ids = set(por_usuario[me.id]) | set(por_usuario[friend.id])
    paises = (
        {p.id: p for p in db.query(Country).filter(Country.id.in_(country_ids))}
        if country_ids
        else {}
    )
    countries = []
    for cid in country_ids:
        pais = paises.get(cid)
        if pais is None:
            continue
        mias, suyas = por_usuario[me.id].get(cid), por_usuario[friend.id].get(cid)
        countries.append(
            CompareCountryOut(
                country_id=cid,
                country_name=pais.nombre,
                country_slug=getattr(pais, "slug", None),
                me=_side(mias) if mias else None,
                friend=_side(suyas) if suyas else None,
            )
        )
    countries.sort(key=lambda c: c.country_name)

    return ComparisonOut(me=resumen(me), friend=resumen(friend), countries=countries)


def get_country_comparison(
    db: Session, me: User, friend: User, country: Country
) -> CountryComparisonOut:
    """% de acierto acumulado por región de un país, para los dos jugadores."""
    regiones = (
        db.query(Region)
        .options(selectinload(Region.names))  # evita una query por región
        .filter(Region.country_id == country.id)
        .all()
    )

    filas = (
        db.query(
            GameSession.user_id,
            GameSessionAnswer.region_id,
            func.count(GameSessionAnswer.id),
            func.sum(case((GameSessionAnswer.correct.is_(True), 1), else_=0)),
        )
        .join(GameSessionAnswer, GameSessionAnswer.session_id == GameSession.id)
        .filter(
            GameSession.user_id.in_([me.id, friend.id]),
            GameSession.country_id == country.id,
        )
        .group_by(GameSession.user_id, GameSessionAnswer.region_id)
        .all()
    )
    stats: dict[tuple[int, int], CompareRegionSideOut] = {
        (uid, rid): CompareRegionSideOut(
            attempts=intentos, correct=aciertos or 0, accuracy=_pct(aciertos or 0, intentos)
        )
        for uid, rid, intentos, aciertos in filas
    }

    resultado = [
        CompareRegionOut(
            region_id=r.id,
            region_name=_nombre_region(r),
            me=stats.get((me.id, r.id)),
            friend=stats.get((friend.id, r.id)),
        )
        for r in regiones
    ]
    resultado.sort(key=lambda r: r.region_name)

    return CountryComparisonOut(
        country_id=country.id,
        country_name=country.nombre,
        country_slug=getattr(country, "slug", None),
        regions=resultado,
    )
