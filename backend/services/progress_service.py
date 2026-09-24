from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from models.country_db import Country
from models.progress import (
    BestScoreOut,
    CountryProgressOut,
    GameSessionCreate,
    GameSessionSummaryOut,
    RegionProgressOut,
)
from models.progress_db import GameSession, GameSessionAnswer
from models.region_db import Region
from models.user_db import User


def create_session(db: Session, user: User, data: GameSessionCreate) -> GameSession:
    correct_count = sum(1 for a in data.answers if a.correct)

    sesion = GameSession(
        user_id=user.id,
        country_id=data.country_id,
        total_regions=len(data.answers),
        correct_regions=correct_count,
        time_seconds=data.time_seconds,
    )
    db.add(sesion)
    db.flush()  # para tener sesion.id antes de crear las respuestas

    for respuesta in data.answers:
        db.add(
            GameSessionAnswer(
                session_id=sesion.id,
                region_id=respuesta.region_id,
                correct=respuesta.correct,
            )
        )

    db.commit()
    db.refresh(sesion)
    return sesion


def _nombre_region(region: Region) -> str:
    """Nombre a mostrar de la región: preferimos español, si no el primero disponible."""
    for rn in region.names:
        if rn.language == "es":
            return rn.name
    if region.names:
        return region.names[0].name
    return f"Región {region.id}"


def _mejor_sesion(sesiones: list[GameSession]) -> GameSession | None:
    """Best score al estilo JetPunk: mayor % de acierto; en empate, tiempo más rápido
    (una sesión sin tiempo registrado nunca gana el desempate frente a una que sí lo tiene)."""
    mejor: GameSession | None = None
    mejor_pct = -1.0

    for sesion in sesiones:
        pct = (sesion.correct_regions / sesion.total_regions * 100) if sesion.total_regions else 0.0

        if mejor is None or pct > mejor_pct:
            mejor, mejor_pct = sesion, pct
            continue

        if pct == mejor_pct:
            if sesion.time_seconds is not None and (
                mejor.time_seconds is None or sesion.time_seconds < mejor.time_seconds
            ):
                mejor = sesion

    return mejor


def get_country_progress(db: Session, user: User, country: Country) -> CountryProgressOut:
    # OJO: selectinload(Region.names) evita que _nombre_region(region) más
    # abajo dispare una query de lazy-load POR CADA región (N+1). Con esto
    # pasamos de "1 + N" queries a solo 2, sin importar cuántas regiones
    # tenga el país. Es el mismo fix que ya usa get_all_countries_progress.
    regiones = (
        db.query(Region)
        .options(selectinload(Region.names))
        .filter(Region.country_id == country.id)
        .all()
    )
    total_regiones = len(regiones)

    # % de acierto acumulado por región: de todos los intentos que ha tenido
    # el usuario sobre esa región (en cualquier partida), qué % acertó.
    filas_por_region = (
        db.query(
            GameSessionAnswer.region_id,
            func.count(GameSessionAnswer.id).label("intentos"),
            func.sum(case((GameSessionAnswer.correct.is_(True), 1), else_=0)).label("aciertos"),
        )
        .join(GameSession, GameSessionAnswer.session_id == GameSession.id)
        .filter(
            GameSession.user_id == user.id,
            GameSession.country_id == country.id,
        )
        .group_by(GameSessionAnswer.region_id)
        .all()
    )
    stats_por_region = {
        fila.region_id: (fila.intentos, fila.aciertos or 0) for fila in filas_por_region
    }

    regiones_progreso = []
    for region in regiones:
        intentos, aciertos = stats_por_region.get(region.id, (0, 0))
        precision = round((aciertos / intentos) * 100, 1) if intentos else 0.0
        regiones_progreso.append(
            RegionProgressOut(
                region_id=region.id,
                region_name=_nombre_region(region),
                attempts=intentos,
                correct=aciertos,
                accuracy=precision,
            )
        )
    regiones_progreso.sort(key=lambda r: r.region_name)

    # Best score: tu mejor partida histórica en este país.
    sesiones = (
        db.query(GameSession)
        .filter(GameSession.user_id == user.id, GameSession.country_id == country.id)
        .all()
    )
    mejor_sesion = _mejor_sesion(sesiones)

    best_score = None
    porcentaje_cabecera = 0.0
    if mejor_sesion is not None:
        porcentaje_cabecera = (
            round((mejor_sesion.correct_regions / mejor_sesion.total_regions) * 100, 1)
            if mejor_sesion.total_regions
            else 0.0
        )
        best_score = BestScoreOut(
            correct_regions=mejor_sesion.correct_regions,
            total_regions=mejor_sesion.total_regions,
            percentage=porcentaje_cabecera,
            time_seconds=mejor_sesion.time_seconds,
            played_at=mejor_sesion.played_at,
        )

    # NUEVO: última vez que se jugó este país (para el widget "Last played"
    # del index). OJO: no es lo mismo que best_score.played_at, que es la
    # fecha de tu MEJOR partida, no la más reciente.
    ultima_partida = max((s.played_at for s in sesiones), default=None)

    return CountryProgressOut(
        country_id=country.id,
        country_name=country.nombre,
        country_slug=getattr(country, "slug", None),
        total_regions=total_regiones,
        percentage=porcentaje_cabecera,
        games_played=len(sesiones),
        best_score=best_score,
        last_played_at=ultima_partida,
        regions=regiones_progreso,
    )


def get_all_countries_progress(db: Session, user: User) -> list[CountryProgressOut]:
    """Versión "en bloque" de get_country_progress(), pensada para no golpear
    la base de datos una vez por país (antes: 3 queries + 1 por región y
    país -> cientos de queries; ahora: 4 queries fijas, sin importar cuántos
    países/regiones haya). Fundamental contra una BD remota (Neon), donde
    cada roundtrip de más se nota mucho más que en local."""
    paises = db.query(Country).all()

    # Todas las regiones de todos los países en una sola consulta, con sus
    # nombres precargados (selectinload) para que _nombre_region() no dispare
    # una query por región al leer region.names.
    regiones = db.query(Region).options(selectinload(Region.names)).all()
    regiones_por_pais: dict[int, list[Region]] = {}
    for region in regiones:
        regiones_por_pais.setdefault(region.country_id, []).append(region)

    # Estadísticas de acierto por región para TODAS las regiones del usuario
    # de una sola vez (antes se repetía esta misma consulta, filtrada por
    # country_id, una vez por cada país).
    filas_por_region = (
        db.query(
            GameSessionAnswer.region_id,
            func.count(GameSessionAnswer.id).label("intentos"),
            func.sum(case((GameSessionAnswer.correct.is_(True), 1), else_=0)).label("aciertos"),
        )
        .join(GameSession, GameSessionAnswer.session_id == GameSession.id)
        .filter(GameSession.user_id == user.id)
        .group_by(GameSessionAnswer.region_id)
        .all()
    )
    stats_por_region = {
        fila.region_id: (fila.intentos, fila.aciertos or 0) for fila in filas_por_region
    }

    # Todas las partidas del usuario de una sola vez, repartidas por país.
    sesiones = db.query(GameSession).filter(GameSession.user_id == user.id).all()
    sesiones_por_pais: dict[int, list[GameSession]] = {}
    for sesion in sesiones:
        sesiones_por_pais.setdefault(sesion.country_id, []).append(sesion)

    resultado = []
    for pais in paises:
        regiones_pais = regiones_por_pais.get(pais.id, [])
        sesiones_pais = sesiones_por_pais.get(pais.id, [])

        regiones_progreso = []
        for region in regiones_pais:
            intentos, aciertos = stats_por_region.get(region.id, (0, 0))
            precision = round((aciertos / intentos) * 100, 1) if intentos else 0.0
            regiones_progreso.append(
                RegionProgressOut(
                    region_id=region.id,
                    region_name=_nombre_region(region),
                    attempts=intentos,
                    correct=aciertos,
                    accuracy=precision,
                )
            )
        regiones_progreso.sort(key=lambda r: r.region_name)

        mejor_sesion = _mejor_sesion(sesiones_pais)
        best_score = None
        porcentaje_cabecera = 0.0
        if mejor_sesion is not None:
            porcentaje_cabecera = (
                round((mejor_sesion.correct_regions / mejor_sesion.total_regions) * 100, 1)
                if mejor_sesion.total_regions
                else 0.0
            )
            best_score = BestScoreOut(
                correct_regions=mejor_sesion.correct_regions,
                total_regions=mejor_sesion.total_regions,
                percentage=porcentaje_cabecera,
                time_seconds=mejor_sesion.time_seconds,
                played_at=mejor_sesion.played_at,
            )

        ultima_partida = max((s.played_at for s in sesiones_pais), default=None)

        resultado.append(
            CountryProgressOut(
                country_id=pais.id,
                country_name=pais.nombre,
                country_slug=getattr(pais, "slug", None),
                total_regions=len(regiones_pais),
                percentage=porcentaje_cabecera,
                games_played=len(sesiones_pais),
                best_score=best_score,
                last_played_at=ultima_partida,
                regions=regiones_progreso,
            )
        )

    return resultado


# NUEVO: últimas partidas del jugador (de todos los países), más recientes
# primero. Alimenta el feed de "actividad reciente" del perfil y la mini
# gráfica de evolución (precisión por partida a lo largo del tiempo).
def get_recent_sessions(db: Session, user: User, limit: int = 20) -> list[GameSessionSummaryOut]:
    sesiones = (
        db.query(GameSession)
        .filter(GameSession.user_id == user.id)
        .order_by(GameSession.played_at.desc())
        .limit(limit)
        .all()
    )

    # Traemos los países implicados en una sola consulta en vez de una por
    # sesión, para no golpear la base de datos N veces.
    country_ids = {s.country_id for s in sesiones}
    paises = (
        {pais.id: pais for pais in db.query(Country).filter(Country.id.in_(country_ids)).all()}
        if country_ids
        else {}
    )

    resumen = []
    for sesion in sesiones:
        pais = paises.get(sesion.country_id)
        porcentaje = (
            round((sesion.correct_regions / sesion.total_regions) * 100, 1)
            if sesion.total_regions
            else 0.0
        )
        resumen.append(
            GameSessionSummaryOut(
                id=sesion.id,
                country_id=sesion.country_id,
                country_name=pais.nombre if pais else "—",
                country_slug=getattr(pais, "slug", None) if pais else None,
                total_regions=sesion.total_regions,
                correct_regions=sesion.correct_regions,
                percentage=porcentaje,
                time_seconds=sesion.time_seconds,
                played_at=sesion.played_at,
            )
        )
    return resumen
