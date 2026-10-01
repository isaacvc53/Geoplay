"""Duelo SIN tiempo (duration_seconds == 0) e historial de partidas terminadas."""

from datetime import timedelta

from models.match_db import Match
from models.utc import now_utc_naive
from services import match_service

from tests.test_friends_compare import register, user_id
from tests.test_match_play import REGIONS, guess, ready_match, setup_pair, start
from tests.test_matches import invite


def open_untimed_clock(db, mid):
    """Salta la cuenta atrás de una partida sin tiempo: lleva 1 s corriendo y el tope de
    seguridad queda a UNTIMED_CAP de su inicio."""
    m = db.get(Match, mid)
    m.started_at = now_utc_naive() - timedelta(seconds=1)
    m.ends_at = m.started_at + match_service.UNTIMED_CAP
    db.commit()
    db.expire_all()


def untimed_playing(client, db):
    ana, bea, mid = ready_match(client, db, duration=0)
    assert start(client, ana, mid).status_code == 200
    open_untimed_clock(db, mid)
    return ana, bea, mid


# ------------------------------------------------------------- sin tiempo


def test_se_puede_retar_sin_tiempo(client, db_session):
    ana, _ = setup_pair(client, db_session)
    r = invite(client, ana, duration=0)
    assert r.status_code == 201, r.text
    assert r.json()["duration_seconds"] == 0


def test_otras_duraciones_siguen_validandose(client, db_session):
    ana, _ = setup_pair(client, db_session)
    assert invite(client, ana, duration=-60).status_code == 400
    assert invite(client, ana, duration=7).status_code == 400


def test_start_sin_tiempo_pone_un_tope_de_seguridad(client, db_session):
    ana, bea, mid = ready_match(client, db_session, duration=0)
    m = start(client, ana, mid).json()
    assert m["status"] == "playing"
    assert m["duration_seconds"] == 0
    started = db_session.get(Match, mid).started_at
    ends = db_session.get(Match, mid).ends_at
    assert ends - started == match_service.UNTIMED_CAP


def test_sin_tiempo_no_termina_por_reloj_corto(client, db_session):
    ana, bea, mid = untimed_playing(client, db_session)
    # Pasado el tiempo que habría durado una partida normal de 5 min, sigue en juego.
    m = db_session.get(Match, mid)
    m.started_at = now_utc_naive() - timedelta(minutes=20)
    db_session.commit()
    db_session.expire_all()
    got = client.get(f"/matches/{mid}", headers=bea).json()
    assert got["status"] == "playing"
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"


def test_sin_tiempo_gana_quien_completa_el_mapa(client, db_session):
    ana, bea, mid = untimed_playing(client, db_session)
    guess(client, bea, mid, "Alfa")
    last = None
    for name in REGIONS:
        last = guess(client, ana, mid, name).json()
    assert last["status"] == "finished"
    m = client.get(f"/matches/{mid}", headers=bea).json()
    assert m["winner_id"] == user_id(client, ana)
    assert m["end_reason"] == "completed"


def test_sin_tiempo_abandonar_da_la_victoria_al_rival(client, db_session):
    ana, bea, mid = untimed_playing(client, db_session)
    assert client.delete(f"/matches/{mid}", headers=bea).status_code == 204
    m = client.get(f"/matches/{mid}", headers=ana).json()
    assert m["status"] == "finished"
    assert m["winner_id"] == user_id(client, ana)
    assert m["end_reason"] == "forfeit"


def test_sin_tiempo_el_tope_cierra_la_partida_por_puntos(client, db_session):
    ana, bea, mid = untimed_playing(client, db_session)
    guess(client, ana, mid, "Alfa")
    guess(client, ana, mid, "Beta")
    guess(client, bea, mid, "Gamma")
    # Se pasa del tope de seguridad: nadie la miraba, pero la siguiente petición la cierra.
    m = db_session.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(seconds=5)
    m.started_at = m.ends_at - match_service.UNTIMED_CAP
    db_session.commit()
    db_session.expire_all()
    got = client.get(f"/matches/{mid}", headers=bea).json()
    assert got["status"] == "finished"
    assert got["winner_id"] == user_id(client, ana)
    assert got["end_reason"] == "time"
    # y los dos jugadores quedan libres
    assert client.get("/matches/mine", headers=ana).json()["current"] is None
    assert client.get("/matches/mine", headers=bea).json()["current"] is None


# ---------------------------------------------------------------- historial


def play_and_forfeit(client, db, host, guest, quitter, duration=180, mid=None):
    if mid is None:
        mid = invite(client, host, duration=duration).json()["id"]
        assert client.post(f"/matches/{mid}/accept", headers=guest).status_code == 200
    assert start(client, host, mid).status_code == 200
    m = db.get(Match, mid)
    m.started_at = now_utc_naive() - timedelta(seconds=1)
    m.ends_at = m.started_at + (
        match_service.UNTIMED_CAP if m.duration_seconds == 0 else timedelta(seconds=m.duration_seconds)
    )
    db.commit()
    db.expire_all()
    assert client.delete(f"/matches/{mid}", headers=quitter).status_code == 204
    return mid


def test_historial_vacio(client, db_session):
    ana, _ = setup_pair(client, db_session)
    r = client.get("/matches/history", headers=ana)
    assert r.status_code == 200, r.text
    assert r.json() == {
        "items": [],
        "total": 0,
        "record": {"wins": 0, "losses": 0, "draws": 0},
    }


def test_historial_requiere_sesion(client, db_session):
    assert client.get("/matches/history").status_code in (401, 403)


def test_historial_muestra_la_partida_terminada_desde_cada_lado(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    start(client, ana, mid)
    open_clock = db_session.get(Match, mid)
    open_clock.started_at = now_utc_naive() - timedelta(seconds=1)
    open_clock.ends_at = open_clock.started_at + timedelta(seconds=180)
    db_session.commit()
    db_session.expire_all()
    guess(client, ana, mid, "Alfa")
    guess(client, ana, mid, "Beta")
    guess(client, bea, mid, "Gamma")
    open_clock = db_session.get(Match, mid)
    open_clock.ends_at = now_utc_naive() - timedelta(seconds=5)
    open_clock.started_at = open_clock.ends_at - timedelta(seconds=180)
    db_session.commit()
    db_session.expire_all()

    h_ana = client.get("/matches/history", headers=ana).json()
    assert h_ana["total"] == 1
    assert h_ana["record"] == {"wins": 1, "losses": 0, "draws": 0}
    item = h_ana["items"][0]
    assert item["id"] == mid
    assert item["result"] == "win"
    assert item["my_score"] == 2
    assert item["opponent"]["username"] == "bea"
    assert item["opponent"]["score"] == 1
    assert item["duration_seconds"] == 180
    assert item["country"]["slug"] == "spain"
    assert item["country"]["total_regions"] == 6
    assert item["end_reason"] == "time"
    assert item["finished_at"] is not None

    h_bea = client.get("/matches/history", headers=bea).json()
    assert h_bea["record"] == {"wins": 0, "losses": 1, "draws": 0}
    assert h_bea["items"][0]["result"] == "loss"
    assert h_bea["items"][0]["my_score"] == 1
    assert h_bea["items"][0]["opponent"]["username"] == "ana"


def test_historial_cuenta_empates_y_abandonos(client, db_session):
    ana, bea = setup_pair(client, db_session)
    # Abandono de bea -> gana ana.
    play_and_forfeit(client, db_session, ana, bea, quitter=bea)
    # Empate: 0 – 0 al acabarse el tiempo.
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    start(client, ana, mid)
    m = db_session.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(seconds=5)
    m.started_at = m.ends_at - timedelta(seconds=180)
    db_session.commit()
    db_session.expire_all()

    h = client.get("/matches/history", headers=ana).json()
    assert h["total"] == 2
    assert h["record"] == {"wins": 1, "losses": 0, "draws": 1}
    reasons = {i["end_reason"] for i in h["items"]}
    assert reasons == {"forfeit", "time"}
    assert {i["result"] for i in h["items"]} == {"win", "draw"}


def test_historial_incluye_partidas_sin_tiempo(client, db_session):
    ana, bea = setup_pair(client, db_session)
    play_and_forfeit(client, db_session, ana, bea, quitter=bea, duration=0)
    h = client.get("/matches/history", headers=ana).json()
    assert h["items"][0]["duration_seconds"] == 0


def test_historial_ignora_lo_que_no_llego_a_jugarse(client, db_session):
    ana, bea = setup_pair(client, db_session)
    # rechazada
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/decline", headers=bea)
    # cancelada antes de empezar
    mid = invite(client, ana).json()["id"]
    client.delete(f"/matches/{mid}", headers=ana)
    # cancelada en la cuenta atrás
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    start(client, ana, mid)
    client.delete(f"/matches/{mid}", headers=ana)
    # en marcha (aún no terminó)
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    start(client, ana, mid)
    m = db_session.get(Match, mid)
    m.started_at = now_utc_naive() - timedelta(seconds=1)
    m.ends_at = m.started_at + timedelta(seconds=180)
    db_session.commit()
    db_session.expire_all()

    h = client.get("/matches/history", headers=ana).json()
    assert h["total"] == 0 and h["items"] == []


def test_historial_orden_y_paginacion(client, db_session):
    ana, bea = setup_pair(client, db_session)
    ids = [play_and_forfeit(client, db_session, ana, bea, quitter=bea) for _ in range(3)]
    # Hacemos que la primera partida sea la MÁS reciente: manda finished_at, no el id.
    first = db_session.get(Match, ids[0])
    first.finished_at = now_utc_naive() + timedelta(minutes=5)
    db_session.commit()
    db_session.expire_all()

    page1 = client.get("/matches/history?limit=2&offset=0", headers=ana).json()
    page2 = client.get("/matches/history?limit=2&offset=2", headers=ana).json()
    assert page1["total"] == 3 and page2["total"] == 3
    assert [i["id"] for i in page1["items"]] == [ids[0], ids[2]]
    assert [i["id"] for i in page2["items"]] == [ids[1]]
    # El balance cuenta todas, no solo la página.
    assert page2["record"]["wins"] == 3


def test_historial_limites_de_paginacion(client, db_session):
    ana, _ = setup_pair(client, db_session)
    assert client.get("/matches/history?limit=0", headers=ana).status_code == 422
    assert client.get("/matches/history?limit=51", headers=ana).status_code == 422
    assert client.get("/matches/history?offset=-1", headers=ana).status_code == 422


def test_historial_es_privado(client, db_session):
    ana, bea = setup_pair(client, db_session)
    cai = register(client, "cai")
    play_and_forfeit(client, db_session, ana, bea, quitter=bea)
    h = client.get("/matches/history", headers=cai).json()
    assert h["total"] == 0 and h["items"] == []


def test_historial_no_se_confunde_con_un_id_de_partida(client, db_session):
    # /matches/history y /matches/countries son rutas fijas: no se interpretan como {match_id}.
    ana, _ = setup_pair(client, db_session)
    assert client.get("/matches/history", headers=ana).status_code == 200
    assert client.get("/matches/countries", headers=ana).status_code == 200
