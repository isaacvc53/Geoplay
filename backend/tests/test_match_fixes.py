"""Revisión de la partida sincronizada: regiones con nombres idénticos, salir justo al
acabar el tiempo y aciertos fuera de plazo."""

from datetime import timedelta

from models.match_db import Match
from models.utc import now_utc_naive
from services import match_service
from services.regiones import resolver_nombre

from tests.test_match_play import guess, playing_match


# ------------------------------------------------------- nombres repetidos
# La regla de siempre se mantiene: con un nombre repetido el primer intento es ambiguo si
# otro nombre distingue a las regiones (ver test_nombres_compartidos_prefieren_la_region_que_falta).
# Lo único que se arregla es el callejón sin salida: regiones con EXACTAMENTE los mismos
# nombres (los dos "Veszprém" de Hungría), que antes no se podían acertar nunca.


def test_resolver_nombre_repetido_con_nombres_distintos_sigue_siendo_ambiguo():
    pares = [(1, "Zagreb"), (2, "Zagreb"), (2, "Zagreb Ciudad")]
    assert resolver_nombre(pares, "Zagreb", ya_acertadas=set()) is None


def test_resolver_nombre_repetido_e_indistinguible_elige_la_de_menor_id():
    pares = [(2, "Veszprém"), (2, "Veszprém County"), (1, "Veszprém"), (1, "Veszprém County"), (3, "Pécs")]
    assert resolver_nombre(pares, "Veszprem", ya_acertadas=set())["region_id"] == 1
    assert resolver_nombre(pares, "Veszprem County", ya_acertadas=set())["region_id"] == 1


def test_resolver_nombre_indistinguible_da_regiones_distintas_en_intentos_seguidos():
    pares = [(1, "Zagreb"), (2, "Zagreb"), (3, "Split")]
    primera = resolver_nombre(pares, "Zagreb", ya_acertadas=set())["region_id"]
    segunda = resolver_nombre(pares, "Zagreb", ya_acertadas={primera})["region_id"]
    assert {primera, segunda} == {1, 2}


def test_resolver_nombre_repetido_con_todas_acertadas_cuenta_como_ya_la_tenias():
    pares = [(1, "Zagreb"), (2, "Zagreb")]
    assert resolver_nombre(pares, "Zagreb", ya_acertadas={1, 2})["region_id"] == 1


def test_resolver_nombre_repetido_sin_contexto_sigue_siendo_ambiguo():
    # /regions/check no sabe qué lleva el jugador: no puede elegir entre las dos.
    pares = [(1, "Zagreb"), (2, "Zagreb")]
    assert resolver_nombre(pares, "Zagreb") is None


def test_regiones_indistinguibles_se_pueden_acertar_las_dos_en_una_partida(client, db_session):
    ana, bea, mid = playing_match(
        client, db_session, regions=("Zagreb", "Zagreb", "Split", "Rijeka", "Osijek", "Pula")
    )
    r1 = guess(client, ana, mid, "Zagreb").json()
    r2 = guess(client, ana, mid, "Zagreb").json()
    r3 = guess(client, ana, mid, "Zagreb").json()
    assert (r1["result"], r2["result"], r3["result"]) == ("correct", "correct", "already")
    assert r1["region_id"] != r2["region_id"]
    assert r2["score"] == 2 and r3["score"] == 2


# --------------------------------------------- salir justo al acabar el tiempo


def _tiempo_agotado_hace(db, mid, **delta):
    """El tiempo se acabó hace poco, dentro del margen GRACE (la partida sigue 'playing')."""
    m = db.get(Match, mid)
    m.ends_at = now_utc_naive() - timedelta(**delta)
    db.commit()
    db.expire_all()


def test_salir_dentro_del_margen_no_es_abandono_gana_quien_va_por_delante(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"  # ana 1 - 0
    _tiempo_agotado_hace(db_session, mid, milliseconds=300)
    assert client.delete(f"/matches/{mid}", headers=ana).status_code == 204
    out = client.get(f"/matches/{mid}", headers=ana).json()
    assert out["status"] == "finished"
    assert out["winner_id"] == out["host"]["user_id"]  # ana gana, no bea
    assert out["end_reason"] == "time"


def test_salir_dentro_del_margen_perdiendo_tampoco_regala_la_victoria(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"  # ana 1 - 0
    _tiempo_agotado_hace(db_session, mid, milliseconds=300)
    assert client.delete(f"/matches/{mid}", headers=bea).status_code == 204  # bea sale
    out = client.get(f"/matches/{mid}", headers=bea).json()
    assert out["winner_id"] == out["host"]["user_id"]
    assert out["end_reason"] == "time"


def test_salir_dentro_del_margen_con_empate_es_empate(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    _tiempo_agotado_hace(db_session, mid, milliseconds=300)
    assert client.delete(f"/matches/{mid}", headers=ana).status_code == 204
    out = client.get(f"/matches/{mid}", headers=ana).json()
    assert out["status"] == "finished" and out["winner_id"] is None


def test_salir_con_el_tiempo_corriendo_sigue_siendo_abandono(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=180)
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"  # ana va ganando
    assert client.delete(f"/matches/{mid}", headers=ana).status_code == 204
    out = client.get(f"/matches/{mid}", headers=ana).json()
    assert out["winner_id"] == out["guest"]["user_id"]  # bea gana por abandono
    assert out["end_reason"] == "forfeit"


# ------------------------------------------------------ aciertos fuera de plazo


def test_un_acierto_dentro_del_margen_se_cuenta(client, db_session):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    _tiempo_agotado_hace(db_session, mid, milliseconds=300)
    r = guess(client, ana, mid, "Alfa")
    assert r.status_code == 200 and r.json()["result"] == "correct"


def test_un_acierto_pasado_el_margen_no_cuenta_aunque_el_cierre_automatico_no_llegue(
    client, db_session, monkeypatch
):
    ana, bea, mid = playing_match(client, db_session, duration=60)
    assert guess(client, ana, mid, "Alfa").json()["result"] == "correct"  # ana 1 - 0
    _tiempo_agotado_hace(db_session, mid, seconds=5)
    # Simula la carrera: el cierre automático de principio de petición no llegó a cerrarla.
    monkeypatch.setattr(match_service, "_expire_stale", lambda db: None)
    r = guess(client, bea, mid, "Beta")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "match_not_playing"
    out = client.get(f"/matches/{mid}", headers=bea).json()
    assert out["status"] == "finished"
    assert (out["host"]["score"], out["guest"]["score"]) == (1, 0)  # el acierto de bea no sumó
    assert out["winner_id"] == out["host"]["user_id"]
