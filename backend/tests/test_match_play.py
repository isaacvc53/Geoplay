"""Parte 3A: empezar la partida, reloj del servidor, validación de aciertos,
puntuación, final de la partida y abandono."""

import json
from datetime import timedelta

from models.match_db import Match
from models.utc import now_utc_naive
from services import match_service

from tests.test_friends_compare import befriend, make_country, register, user_id
from tests.test_matches import invite

REGIONS = ("Alfa", "Beta", "Gamma", "Delta", "Epsilon", "Zeta")


def setup_pair(client, db, slug="spain", regions=REGIONS):
    """Ana y bea, amigas, y un país jugable con las regiones indicadas."""
    ana = register(client, "ana")
    bea = register(client, "bea")
    befriend(client, ana, bea, "bea")
    make_country(db, slug, regions=regions)
    return ana, bea


def ready_match(client, db, duration=180, **kw):
    ana, bea = setup_pair(client, db, **kw)
    mid = invite(client, ana, duration=duration).json()["id"]
    assert client.post(f"/matches/{mid}/accept", headers=bea).status_code == 200
    return ana, bea, mid


def start(client, headers, mid):
    return client.post(f"/matches/{mid}/start", headers=headers)


def guess(client, headers, mid, text):
    return client.post(f"/matches/{mid}/guess", json={"text": text}, headers=headers)


def open_clock(db, mid):
    """Salta la cuenta atrás: el tiempo ya corre desde hace 1 s."""
    m = db.get(Match, mid)
    m.started_at = now_utc_naive() - timedelta(seconds=1)
    m.ends_at = m.started_at + timedelta(seconds=m.duration_seconds)
    db.commit()
    db.expire_all()


def playing_match(client, db, duration=180, **kw):
    ana, bea, mid = ready_match(client, db, duration, **kw)
    assert start(client, ana, mid).status_code == 200
    open_clock(db, mid)
    return ana, bea, mid


# -------------------------------------------------------------------- sorteo


def test_el_sorteo_solo_usa_paises_con_mapa_en_el_frontend(client, db_session, monkeypatch):
    ana, bea = setup_pair(client, db_session)  # crea "spain"
    make_country(db_session, "sin-mapa", regions=REGIONS)
    monkeypatch.setattr(match_service, "_available_slugs", lambda: {"spain"})
    for _ in range(12):
        mid = invite(client, ana).json()["id"]
        m = client.post(f"/matches/{mid}/accept", headers=bea).json()
        assert m["country"]["slug"] == "spain"
        client.delete(f"/matches/{mid}", headers=ana)


def test_si_ningun_pais_tiene_mapa_no_hay_partida(client, db_session, monkeypatch):
    ana, bea = setup_pair(client, db_session)
    monkeypatch.setattr(match_service, "_available_slugs", lambda: set())
    mid = invite(client, ana).json()["id"]
    r = client.post(f"/matches/{mid}/accept", headers=bea)
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "no_countries_available"


def test_lee_el_manifiesto_del_frontend(tmp_path, monkeypatch):
    f = tmp_path / "available-countries.json"
    f.write_text(json.dumps(["spain", "france", 7]))
    monkeypatch.undo()  # quita el parche autouse de conftest
    monkeypatch.setenv("AVAILABLE_COUNTRIES_FILE", str(f))
    match_service._MANIFEST_CACHE.update(path=None, mtime=None, slugs=None)
    assert match_service._available_slugs() == {"spain", "france"}
    # Si el archivo cambia, se vuelve a leer.
    f.write_text(json.dumps(["italy"]))
    import os
    os.utime(f, (f.stat().st_atime, f.stat().st_mtime + 5))
    assert match_service._available_slugs() == {"italy"}


# --------------------------------------------------------------------- start


def test_start_pone_el_reloj_con_cuenta_atras(client, db_session):
    ana, bea, mid = ready_match(client, db_session, duration=120)
    r = start(client, bea, mid)  # puede empezar cualquiera de los dos
    assert r.status_code == 200, r.text
    m = r.json()
    assert m["status"] == "playing"
    from datetime import datetime
    started = datetime.fromisoformat(m["started_at"])
    ends = datetime.fromisoformat(m["ends_at"])
    server = datetime.fromisoformat(m["server_time"])
    assert (started - server).total_seconds() == pytest_approx(3, 0.5)
    assert (ends - started).total_seconds() == 120


def pytest_approx(value, tol):
    import pytest
    return pytest.approx(value, abs=tol)


def test_start_es_idempotente_y_no_mueve_el_reloj(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    first = start(client, ana, mid).json()
    second = start(client, bea, mid)
    assert second.status_code == 200
    assert second.json()["started_at"] == first["started_at"]
    assert second.json()["ends_at"] == first["ends_at"]


def test_start_solo_con_la_partida_lista(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]  # solo invitada, nadie ha aceptado
    r = start(client, ana, mid)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_ready"


def test_un_tercero_no_puede_empezar(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    cai = register(client, "cai")
    r = start(client, cai, mid)
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "match_not_found"


def test_la_partida_en_marcha_aparece_como_actual(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    start(client, ana, mid)
    for who in (ana, bea):
        cur = client.get("/matches/mine", headers=who).json()["current"]
        assert cur["id"] == mid and cur["status"] == "playing"


# --------------------------------------------------------------------- guess


def test_no_se_puede_responder_durante_la_cuenta_atras(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    start(client, ana, mid)  # el tiempo empieza dentro de 3 s
    r = guess(client, ana, mid, "Alfa")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_started"


def test_no_se_puede_responder_si_no_esta_en_marcha(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    r = guess(client, ana, mid, "Alfa")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_playing"


def test_acierto_error_y_repetido(client, db_session):
    ana, bea, mid = playing_match(client, db_session)

    ok = guess(client, ana, mid, "alfa").json()  # sin mayúsculas
    assert ok["result"] == "correct"
    assert ok["name"] == "Alfa" and ok["score"] == 1 and ok["region_id"]

    bad = guess(client, ana, mid, "Narnia").json()
    assert bad["result"] == "wrong" and bad["score"] == 1
    assert bad["region_id"] is None

    again = guess(client, ana, mid, "ALFA").json()
    assert again["result"] == "already"
    assert again["region_id"] == ok["region_id"] and again["score"] == 1


def test_acepta_parcial_no_ambiguo_y_tildes(client, db_session):
    ana, bea, mid = playing_match(
        client, db_session,
        regions=("Málaga", "Sevilla", "Cádiz", "Córdoba", "Jaén", "Huelva"),
    )
    assert guess(client, ana, mid, "malaga").json()["result"] == "correct"
    assert guess(client, ana, mid, "sev").json()["result"] == "correct"  # prefijo único
    assert guess(client, ana, mid, "co").json()["result"] == "wrong"  # demasiado corto
    assert guess(client, ana, mid, "c").json()["result"] == "wrong"


def test_cada_jugador_cuenta_sus_propios_puntos(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    guess(client, ana, mid, "Alfa")
    guess(client, ana, mid, "Beta")
    r = guess(client, bea, mid, "Alfa").json()  # bea también puede acertar Alfa
    assert r["result"] == "correct" and r["score"] == 1

    m = client.get(f"/matches/{mid}", headers=bea).json()
    assert m["host"]["score"] == 2 and m["guest"]["score"] == 1
    assert m["status"] == "playing"


def test_nombres_compartidos_prefieren_la_region_que_falta(client, db_session):
    """Dos regiones con exactamente el mismo nombre (como dos "Zagreb"): la primera
    vez es ambiguo, pero si ya tienes una, el nombre apunta a la que te falta."""
    from models.country_db import Country
    from models.region_db import Region
    from models.region_name_db import RegionName

    ana, bea, mid = playing_match(client, db_session)
    c = db_session.query(Country).first()
    # Región 1: solo "Zagreb". Región 2: "Zagreb" y también "Zagreb Ciudad".
    ids = []
    for names in (("Zagreb",), ("Zagreb", "Zagreb Ciudad")):
        r = Region(country_id=c.id)
        db_session.add(r)
        db_session.flush()
        for n in names:
            db_session.add(RegionName(region_id=r.id, language="es", name=n))
        ids.append(r.id)
    db_session.commit()
    uno, dos = ids

    # "Zagreb" casa exactamente con las dos y ninguna está acertada: ambiguo.
    assert guess(client, ana, mid, "Zagreb").json()["result"] == "wrong"
    # "Zagreb Ciudad" solo existe en la región 2.
    r2 = guess(client, ana, mid, "Zagreb Ciudad").json()
    assert r2["result"] == "correct" and r2["region_id"] == dos
    # Ahora "Zagreb" apunta a la que le falta: la 1 (no repite la 2).
    r1 = guess(client, ana, mid, "Zagreb").json()
    assert r1["result"] == "correct" and r1["region_id"] == uno
    # Y con las dos hechas, repetir da "ya la tenías".
    assert guess(client, ana, mid, "Zagreb").json()["result"] == "already"


def test_el_servidor_no_acepta_aciertos_fuera_de_tiempo(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    m = db_session.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(seconds=5)  # ya pasó el margen
    db_session.commit()
    db_session.expire_all()
    r = guess(client, ana, mid, "Alfa")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_playing"
    # y la partida quedó cerrada, sin aciertos
    m = client.get(f"/matches/{mid}", headers=ana).json()
    assert m["status"] == "finished" and m["host"]["score"] == 0


def test_margen_de_gracia_para_un_acierto_en_el_ultimo_instante(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    m = db_session.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(milliseconds=200)  # dentro del margen
    db_session.commit()
    db_session.expire_all()
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"


def test_un_tercero_no_puede_responder(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    cai = register(client, "cai")
    assert guess(client, cai, mid, "Alfa").status_code == 404


def test_texto_vacio_o_enorme_se_rechaza(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    assert guess(client, ana, mid, "").status_code == 422
    assert guess(client, ana, mid, "a" * 101).status_code == 422


# ----------------------------------------------------------------- final


def expire_clock(db, mid, seconds_ago=5):
    m = db.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(seconds=seconds_ago)
    m.started_at = m.ends_at - timedelta(seconds=m.duration_seconds)
    db.commit()
    db.expire_all()


def test_al_acabar_el_tiempo_gana_quien_tiene_mas(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    guess(client, ana, mid, "Alfa")
    guess(client, ana, mid, "Beta")
    guess(client, bea, mid, "Gamma")
    expire_clock(db_session, mid)

    m = client.get(f"/matches/{mid}", headers=bea).json()
    assert m["status"] == "finished"
    assert m["winner_id"] == user_id(client, ana)
    assert m["host"]["score"] == 2 and m["guest"]["score"] == 1
    assert m["end_reason"] == "time"
    assert m["finished_at"] == m["ends_at"]


def test_empate(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    guess(client, ana, mid, "Alfa")
    guess(client, bea, mid, "Beta")
    expire_clock(db_session, mid)
    m = client.get(f"/matches/{mid}", headers=ana).json()
    assert m["status"] == "finished" and m["winner_id"] is None


def test_la_partida_termina_sola_aunque_nadie_la_mire(client, db_session):
    """Nadie consulta la partida: la primera operación posterior (aquí, que otra
    pareja se reten) la cierra y libera a los jugadores."""
    ana, bea, mid = playing_match(client, db_session)
    expire_clock(db_session, mid)
    # ana está libre otra vez: puede retar de nuevo
    assert invite(client, ana).status_code == 201
    assert db_session.get(Match, mid).status == "finished"


def test_completar_el_mapa_termina_la_partida_en_el_acto(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    last = None
    for name in REGIONS:
        last = guess(client, ana, mid, name).json()
    assert last["result"] == "correct" and last["score"] == 6
    assert last["status"] == "finished"

    m = client.get(f"/matches/{mid}", headers=bea).json()
    assert m["status"] == "finished"
    assert m["winner_id"] == user_id(client, ana)
    assert m["end_reason"] == "completed"
    # y ya no se puede seguir respondiendo
    assert guess(client, bea, mid, "Alfa").status_code == 409


def test_abandonar_con_el_tiempo_corriendo_pierdes(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    guess(client, ana, mid, "Alfa")
    assert client.delete(f"/matches/{mid}", headers=ana).status_code == 204  # ana abandona
    m = client.get(f"/matches/{mid}", headers=bea).json()
    assert m["status"] == "finished"
    assert m["winner_id"] == user_id(client, bea)  # gana bea aunque tenga 0
    assert m["end_reason"] == "forfeit"
    assert m["host"]["score"] == 1  # se conservan los puntos


def test_abandonar_en_la_cuenta_atras_no_penaliza(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    start(client, ana, mid)  # todavía en cuenta atrás
    assert client.delete(f"/matches/{mid}", headers=bea).status_code == 204
    m = client.get(f"/matches/{mid}", headers=ana).json()
    assert m["status"] == "cancelled" and m["winner_id"] is None


def test_no_se_puede_cancelar_una_partida_terminada(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    expire_clock(db_session, mid)
    r = client.delete(f"/matches/{mid}", headers=ana)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_cancellable"


def test_al_terminar_los_jugadores_quedan_libres(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    expire_clock(db_session, mid)
    client.get(f"/matches/{mid}", headers=ana)
    assert client.get("/matches/mine", headers=ana).json()["current"] is None
    assert client.get("/matches/mine", headers=bea).json()["current"] is None
    assert invite(client, bea, username="ana").status_code == 201


# ------------------------------------------------------------------ answers


def test_answers_devuelve_los_mios_y_el_rival_solo_al_terminar(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    a1 = guess(client, ana, mid, "Alfa").json()["region_id"]
    a2 = guess(client, ana, mid, "Beta").json()["region_id"]
    b1 = guess(client, bea, mid, "Gamma").json()["region_id"]

    mine = client.get(f"/matches/{mid}/answers", headers=ana).json()
    assert mine == {"mine": [a1, a2], "opponent": None}  # el rival, oculto

    expire_clock(db_session, mid)
    done_ana = client.get(f"/matches/{mid}/answers", headers=ana).json()
    done_bea = client.get(f"/matches/{mid}/answers", headers=bea).json()
    assert done_ana == {"mine": [a1, a2], "opponent": [b1]}
    assert done_bea == {"mine": [b1], "opponent": [a1, a2]}


def test_rival_en_directo_devuelve_solo_ids_del_rival(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    a1 = guess(client, ana, mid, "Alfa").json()["region_id"]
    a2 = guess(client, ana, mid, "Beta").json()["region_id"]
    b1 = guess(client, bea, mid, "Gamma").json()["region_id"]

    # Cada uno ve las regiones del OTRO, en el orden en que las acertó, y nada más.
    assert client.get(f"/matches/{mid}/rival", headers=ana).json() == {"region_ids": [b1]}
    assert client.get(f"/matches/{mid}/rival", headers=bea).json() == {"region_ids": [a1, a2]}
    # /answers sigue ocultando al rival mientras la partida corre.
    assert client.get(f"/matches/{mid}/answers", headers=ana).json()["opponent"] is None


def test_rival_en_directo_vacio_antes_de_empezar(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    assert client.get(f"/matches/{mid}/rival", headers=ana).json() == {"region_ids": []}


def test_rival_en_directo_no_es_visible_para_un_tercero(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    cai = register(client, "cai")
    assert client.get(f"/matches/{mid}/rival", headers=cai).status_code == 404


def test_answers_no_es_visible_para_un_tercero(client, db_session):
    ana, bea, mid = playing_match(client, db_session)
    cai = register(client, "cai")
    assert client.get(f"/matches/{mid}/answers", headers=cai).status_code == 404


def test_server_time_viaja_en_cada_respuesta(client, db_session):
    ana, bea, mid = ready_match(client, db_session)
    m = client.get(f"/matches/{mid}", headers=ana).json()
    assert m["server_time"].endswith(("Z", "+00:00"))
