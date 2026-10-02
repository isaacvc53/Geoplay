"""Cola general de emparejamiento: buscar rival entre desconocidos (sin ser amigos)."""

from datetime import timedelta

from models.match import QUEUE_DURATIONS
from models.match_db import Match
from models.matchmaking_db import MatchQueueEntry
from models.utc import now_utc_naive
from services import matchmaking_service

from tests.test_friends_compare import befriend, make_country, register
from tests.test_matches import invite

REGIONS = ("Alfa", "Beta", "Gamma", "Delta", "Epsilon", "Zeta")


def players(client, db, *names, country=True):
    """Usuarios SIN amistad entre ellos y un país jugable."""
    if country:
        make_country(db, "spain", regions=REGIONS)
    return [register(client, n) for n in names]


def join(client, headers):
    return client.post("/matches/queue", headers=headers)


def status(client, headers):
    return client.get("/matches/queue", headers=headers)


def leave(client, headers):
    return client.post("/matches/queue/leave", headers=headers)


def entries(db):
    db.expire_all()
    return db.query(MatchQueueEntry).count()


def age(db, name_id, *, joined=None, seen=None):
    """Retrasa en el tiempo la entrada de un usuario en la cola (para probar esperas largas
    y latidos caducados)."""
    db.expire_all()
    e = db.query(MatchQueueEntry).filter(MatchQueueEntry.user_id == name_id).one()
    if joined is not None:
        e.joined_at = now_utc_naive() - joined
    if seen is not None:
        e.last_seen = now_utc_naive() - seen
    db.commit()
    db.expire_all()


def me(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


# ---------------------------------------------------------------- esperar y emparejar


def test_el_primero_en_entrar_espera(client, db_session):
    (ana,) = players(client, db_session, "ana")
    r = join(client, ana)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["searching"] is True
    assert body["match"] is None
    assert entries(db_session) == 1


def test_el_segundo_en_entrar_forma_la_pareja(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    r = join(client, bea)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["searching"] is False
    m = body["match"]
    assert m["status"] == "ready"
    assert m["my_role"] == "guest"  # ana esperaba desde antes: es la anfitriona
    assert m["host"]["username"] == "ana"
    assert m["guest"]["username"] == "bea"
    assert m["country"]["slug"] == "spain"
    assert m["country_chosen"] is False  # sorteado: el frontend enseña la ruleta
    assert m["duration_seconds"] in QUEUE_DURATIONS
    assert entries(db_session) == 0  # los dos salen de la cola


def test_el_que_esperaba_se_entera_en_su_siguiente_consulta(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    mid = join(client, bea).json()["match"]["id"]

    s = status(client, ana)
    assert s.status_code == 200
    body = s.json()
    assert body["searching"] is False
    assert body["match"]["id"] == mid
    assert body["match"]["my_role"] == "host"


def test_la_duracion_es_de_1_a_5_minutos_y_se_sortea(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    seen = set()
    for _ in range(40):
        join(client, ana)
        m = join(client, bea).json()["match"]
        seen.add(m["duration_seconds"])
        client.delete(f"/matches/{m['id']}", headers=ana)  # libera a los dos
    assert seen <= set(QUEUE_DURATIONS)
    assert QUEUE_DURATIONS == (60, 120, 180, 240, 300)
    assert len(seen) >= 3  # no sale siempre la misma (40 sorteos entre 5 valores)


def test_la_partida_de_la_cola_se_juega_como_cualquier_otra(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    mid = join(client, bea).json()["match"]["id"]

    r = client.post(f"/matches/{mid}/start", headers=bea)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "playing"
    # Cualquiera de los dos puede pulsar Start a la vez: idempotente.
    assert client.post(f"/matches/{mid}/start", headers=ana).json()["status"] == "playing"


# ---------------------------------------------------------------- idempotencia y reglas


def test_entrar_dos_veces_no_duplica_ni_te_empareja_contigo(client, db_session):
    (ana,) = players(client, db_session, "ana")
    join(client, ana)
    r = join(client, ana)
    assert r.status_code == 200
    assert r.json()["searching"] is True
    assert r.json()["match"] is None
    assert entries(db_session) == 1


def test_no_puedes_buscar_con_una_partida_abierta(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    befriend(client, ana, bea, "bea")
    assert invite(client, ana).status_code == 201
    r = join(client, ana)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "already_in_match"
    assert entries(db_session) == 0


def test_necesita_sesion(client):
    assert client.post("/matches/queue").status_code == 401
    assert client.get("/matches/queue").status_code == 401
    assert client.post("/matches/queue/leave").status_code == 401


def test_sin_buscar_el_estado_es_vacio(client, db_session):
    (ana,) = players(client, db_session, "ana")
    r = status(client, ana)
    assert r.status_code == 200
    assert r.json() == {"searching": False, "waited_seconds": 0, "match": None}


# ---------------------------------------------------------------- cancelar y caducar


def test_salir_de_la_cola(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    r = leave(client, ana)
    assert r.status_code == 200
    assert r.json()["searching"] is False
    assert entries(db_session) == 0
    # Ya no hay nadie esperando: bea no se empareja con una cancelada.
    assert join(client, bea).json()["searching"] is True


def test_salir_dos_veces_no_falla(client, db_session):
    (ana,) = players(client, db_session, "ana")
    assert leave(client, ana).status_code == 200
    assert leave(client, ana).status_code == 200


def test_quien_dejo_de_dar_senales_no_se_empareja(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    age(db_session, me(client, ana), seen=matchmaking_service.QUEUE_STALE + timedelta(seconds=5))

    r = join(client, bea)
    assert r.json()["searching"] is True  # ana era un fantasma
    assert r.json()["match"] is None
    assert entries(db_session) == 1  # solo queda bea


def test_el_latido_mantiene_viva_la_busqueda(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    join(client, ana)
    ana_id = me(client, ana)
    age(db_session, ana_id, seen=matchmaking_service.QUEUE_STALE - timedelta(seconds=3))
    assert status(client, ana).json()["searching"] is True  # consulta = latido
    # Con el latido recién renovado, bea sí se empareja con ella.
    assert join(client, bea).json()["match"] is not None


def test_cuenta_los_segundos_de_espera(client, db_session):
    (ana,) = players(client, db_session, "ana")
    join(client, ana)
    age(db_session, me(client, ana), joined=timedelta(seconds=42))
    body = status(client, ana).json()
    assert body["searching"] is True
    assert 42 <= body["waited_seconds"] <= 46


# ---------------------------------------------------------------- casos raros


def test_dos_que_entran_a_la_vez_se_emparejan_en_la_siguiente_consulta(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea")
    now = now_utc_naive()
    # Como si las dos peticiones hubieran apuntado a cada uno sin ver al otro todavía.
    for name, headers in (("ana", ana), ("bea", bea)):
        db_session.add(MatchQueueEntry(user_id=me(client, headers), joined_at=now, last_seen=now))
    db_session.commit()

    body = status(client, ana).json()
    assert body["searching"] is False
    assert body["match"]["status"] == "ready"
    assert status(client, bea).json()["match"]["id"] == body["match"]["id"]
    assert entries(db_session) == 0


def test_se_salta_al_que_abrio_otra_partida_mientras_esperaba(client, db_session):
    ana, bea, cleo = players(client, db_session, "ana", "bea", "cleo")
    befriend(client, ana, cleo, "cleo")
    join(client, ana)
    assert invite(client, ana, username="cleo").status_code == 201  # ana abre un reto

    r = join(client, bea)
    assert r.json()["searching"] is True  # ana ya no está libre
    assert r.json()["match"] is None
    assert db_session.query(Match).count() == 1  # solo el reto de ana a cleo
    assert entries(db_session) == 1  # y la entrada de ana se limpió


def test_no_empareja_a_cuatro_a_la_vez(client, db_session):
    ana, bea, cleo, dani = players(client, db_session, "ana", "bea", "cleo", "dani")
    join(client, ana)
    m1 = join(client, bea).json()["match"]
    assert join(client, cleo).json()["searching"] is True
    m2 = join(client, dani).json()["match"]
    assert m1["id"] != m2["id"]
    assert m2["host"]["username"] == "cleo"
    assert entries(db_session) == 0


def test_sin_paises_jugables_no_se_queda_nadie_esperando(client, db_session):
    ana, bea = players(client, db_session, "ana", "bea", country=False)
    assert join(client, ana).json()["searching"] is True
    r = join(client, bea)
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "no_countries_available"
    assert status(client, bea).json()["searching"] is False
