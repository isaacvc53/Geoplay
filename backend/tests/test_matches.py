from datetime import timedelta

from models.match_db import Match
from models.utc import now_utc_naive
from services import match_service

from tests.test_friends_compare import befriend, make_country, register, user_id


def setup_pair(client, db):
    """Dos usuarios amigos (ana y bea) y un país con regiones suficientes."""
    ana = register(client, "ana")
    bea = register(client, "bea")
    befriend(client, ana, bea, "bea")
    make_country(db, "spain", regions=("A", "B", "C", "D", "E", "F"))
    return ana, bea


def invite(client, headers, username="bea", duration=180):
    return client.post(
        "/matches", json={"username": username, "duration_seconds": duration}, headers=headers
    )


# ------------------------------------------------------------------ invitar


def test_invitar_a_un_amigo(client, db_session):
    ana, bea = setup_pair(client, db_session)
    r = invite(client, ana, duration=120)
    assert r.status_code == 201, r.text
    m = r.json()
    assert m["status"] == "invited"
    assert m["my_role"] == "host"
    assert m["duration_seconds"] == 120
    assert m["host"]["username"] == "ana"
    assert m["guest"]["username"] == "bea"
    assert m["country"] is None  # el país aún no se ha sorteado
    assert m["invite_expires_at"] is not None


def test_solo_se_puede_invitar_a_amigos(client, db_session):
    ana = register(client, "ana")
    register(client, "bea")  # existe, pero no son amigos
    r = invite(client, ana)
    assert r.status_code == 404
    assert r.json()["detail"]["code"] == "friend_not_found"


def test_no_invitar_con_solicitud_de_amistad_pendiente(client, db_session):
    ana = register(client, "ana")
    register(client, "bea")
    client.post("/friends/requests", json={"username": "bea"}, headers=ana)
    assert invite(client, ana).status_code == 404


def test_duracion_no_permitida(client, db_session):
    ana, _ = setup_pair(client, db_session)
    r = invite(client, ana, duration=7)
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "invalid_duration"


def test_no_dos_partidas_abiertas_como_anfitrion(client, db_session):
    ana, bea = setup_pair(client, db_session)
    cai = register(client, "cai")
    befriend(client, ana, cai, "cai")
    assert invite(client, ana).status_code == 201
    r = invite(client, ana, username="cai")
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "already_in_match"


def test_no_invitar_a_un_amigo_ocupado(client, db_session):
    ana, bea = setup_pair(client, db_session)
    cai = register(client, "cai")
    befriend(client, bea, cai, "cai")
    # bea invita a cai (bea queda ocupada como anfitriona)
    assert client.post(
        "/matches", json={"username": "cai", "duration_seconds": 60}, headers=bea
    ).status_code == 201
    r = invite(client, ana)  # ana intenta invitar a bea
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "friend_busy"


# ------------------------------------------------------------------ aceptar


def test_aceptar_sortea_pais_y_deja_la_partida_lista(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    r = client.post(f"/matches/{mid}/accept", headers=bea)
    assert r.status_code == 200, r.text
    m = r.json()
    assert m["status"] == "ready"
    assert m["my_role"] == "guest"
    assert m["country"]["slug"] == "spain"
    assert m["country"]["total_regions"] == 6
    assert m["invite_expires_at"] is None


def test_aceptar_dos_veces_no_falla(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    first = client.post(f"/matches/{mid}/accept", headers=bea).json()
    second = client.post(f"/matches/{mid}/accept", headers=bea)
    assert second.status_code == 200
    assert second.json()["country"]["id"] == first["country"]["id"]


def test_solo_el_invitado_puede_aceptar(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    r = client.post(f"/matches/{mid}/accept", headers=ana)
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "not_invited"


def test_el_pais_sorteado_siempre_tiene_regiones_suficientes(client, db_session):
    ana, bea = setup_pair(client, db_session)
    # Con 2 regiones NO puede salir sorteado; con 6 sí.
    make_country(db_session, "tiny", regions=("A", "B"))
    make_country(db_session, "empty", regions=())
    for _ in range(15):
        mid = invite(client, ana).json()["id"]
        m = client.post(f"/matches/{mid}/accept", headers=bea).json()
        assert m["country"]["slug"] == "spain"
        client.delete(f"/matches/{mid}", headers=ana)


def test_sin_paises_jugables(client, db_session):
    ana = register(client, "ana")
    bea = register(client, "bea")
    befriend(client, ana, bea, "bea")
    mid = invite(client, ana).json()["id"]
    r = client.post(f"/matches/{mid}/accept", headers=bea)
    assert r.status_code == 503
    assert r.json()["detail"]["code"] == "no_countries_available"


def test_no_aceptar_si_ya_estas_en_otra_partida(client, db_session):
    ana, bea = setup_pair(client, db_session)
    cai = register(client, "cai")
    befriend(client, ana, cai, "cai")
    befriend(client, bea, cai, "cai")
    # cai invita a bea, y ana también invita a bea
    m_cai = client.post(
        "/matches", json={"username": "bea", "duration_seconds": 60}, headers=cai
    ).json()["id"]
    m_ana = invite(client, ana).json()["id"]
    assert client.post(f"/matches/{m_cai}/accept", headers=bea).status_code == 200
    r = client.post(f"/matches/{m_ana}/accept", headers=bea)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "already_in_match"


# --------------------------------------------------- rechazar y cancelar


def test_rechazar(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    assert client.post(f"/matches/{mid}/decline", headers=bea).json()["status"] == "declined"
    # el anfitrión lo ve rechazado y queda libre para invitar a otro
    assert client.get(f"/matches/{mid}", headers=ana).json()["status"] == "declined"
    assert invite(client, ana).status_code == 201


def test_el_anfitrion_no_puede_rechazar(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    assert client.post(f"/matches/{mid}/decline", headers=ana).status_code == 403


def test_cancelar_invitacion(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    assert client.delete(f"/matches/{mid}", headers=ana).status_code == 204
    assert client.get(f"/matches/{mid}", headers=bea).json()["status"] == "cancelled"
    assert client.get("/matches/mine", headers=bea).json()["invitations"] == []
    assert client.post(f"/matches/{mid}/accept", headers=bea).status_code == 409


def test_abandonar_partida_lista(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    assert client.delete(f"/matches/{mid}", headers=bea).status_code == 204
    assert client.get(f"/matches/{mid}", headers=ana).json()["status"] == "cancelled"
    assert client.get("/matches/mine", headers=ana).json()["current"] is None


# ------------------------------------------------------------ consultas


def test_mine_muestra_partida_actual_e_invitaciones(client, db_session):
    ana, bea = setup_pair(client, db_session)
    assert client.get("/matches/mine", headers=bea).json() == {
        "current": None,
        "invitations": [],
    }

    mid = invite(client, ana).json()["id"]
    de_ana = client.get("/matches/mine", headers=ana).json()
    assert de_ana["current"]["id"] == mid and de_ana["invitations"] == []

    de_bea = client.get("/matches/mine", headers=bea).json()
    # la invitación recibida aún no ocupa a bea: aparece en la lista, no en "current"
    assert de_bea["current"] is None
    assert [i["id"] for i in de_bea["invitations"]] == [mid]
    assert de_bea["invitations"][0]["my_role"] == "guest"

    client.post(f"/matches/{mid}/accept", headers=bea)
    de_bea = client.get("/matches/mine", headers=bea).json()
    assert de_bea["current"]["status"] == "ready"
    assert de_bea["invitations"] == []


def test_un_tercero_no_ve_la_partida(client, db_session):
    ana, bea = setup_pair(client, db_session)
    cai = register(client, "cai")
    mid = invite(client, ana).json()["id"]
    for call in (
        client.get(f"/matches/{mid}", headers=cai),
        client.post(f"/matches/{mid}/accept", headers=cai),
        client.post(f"/matches/{mid}/decline", headers=cai),
        client.delete(f"/matches/{mid}", headers=cai),
    ):
        assert call.status_code == 404
        assert call.json()["detail"]["code"] == "match_not_found"


def test_requiere_sesion(client, db_session):
    assert client.get("/matches/mine").status_code == 401
    assert client.post("/matches", json={"username": "bea"}).status_code == 401


# ------------------------------------------------------------ caducidad


def test_la_invitacion_caduca(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    m = db_session.get(Match, mid)
    m.created_at = now_utc_naive() - match_service.INVITE_TTL - timedelta(seconds=1)
    db_session.commit()

    assert client.get(f"/matches/{mid}", headers=ana).json()["status"] == "expired"
    assert client.get("/matches/mine", headers=bea).json()["invitations"] == []
    assert client.post(f"/matches/{mid}/accept", headers=bea).status_code == 409
    assert invite(client, ana).status_code == 201  # anfitrión libre otra vez


def test_la_partida_lista_sin_empezar_caduca(client, db_session):
    ana, bea = setup_pair(client, db_session)
    mid = invite(client, ana).json()["id"]
    client.post(f"/matches/{mid}/accept", headers=bea)
    m = db_session.get(Match, mid)
    m.accepted_at = now_utc_naive() - match_service.READY_TTL - timedelta(seconds=1)
    db_session.commit()

    assert client.get("/matches/mine", headers=ana).json()["current"] is None
    assert client.get("/matches/mine", headers=bea).json()["current"] is None


def test_ids_de_usuario_en_la_respuesta(client, db_session):
    ana, bea = setup_pair(client, db_session)
    m = invite(client, ana).json()
    assert m["host"]["user_id"] == user_id(client, ana)
    assert m["guest"]["user_id"] == user_id(client, bea)


# ------------------------------------------------- país elegido por el anfitrión


def invite_with_country(client, headers, country_id, username="bea", duration=180):
    return client.post(
        "/matches",
        json={"username": username, "duration_seconds": duration, "country_id": country_id},
        headers=headers,
    )


def test_listar_paises_jugables(client, db_session):
    ana, _ = setup_pair(client, db_session)
    make_country(db_session, "tiny", regions=("A", "B"))  # pocas regiones: no sale
    make_country(db_session, "empty", regions=())
    r = client.get("/matches/countries", headers=ana)
    assert r.status_code == 200, r.text
    assert [c["slug"] for c in r.json()] == ["spain"]
    assert r.json()[0]["total_regions"] == 6


def test_listar_paises_requiere_sesion(client, db_session):
    assert client.get("/matches/countries").status_code in (401, 403)


def test_retar_eligiendo_pais(client, db_session):
    ana, bea = setup_pair(client, db_session)
    other, _ = make_country(db_session, "france", regions=("A", "B", "C", "D", "E"))
    r = invite_with_country(client, ana, other.id)
    assert r.status_code == 201, r.text
    m = r.json()
    # El país ya se ve en la invitación, antes de aceptar.
    assert m["status"] == "invited"
    assert m["country"]["slug"] == "france"
    assert m["country_chosen"] is True
    # El invitado lo ve igual en su lista de invitaciones.
    inv = client.get("/matches/mine", headers=bea).json()["invitations"]
    assert inv[0]["country"]["slug"] == "france"


def test_aceptar_mantiene_el_pais_elegido(client, db_session):
    ana, bea = setup_pair(client, db_session)
    other, _ = make_country(db_session, "france", regions=("A", "B", "C", "D", "E"))
    # Con "spain" también disponible, el sorteo podría dar otro: debe salir siempre france.
    for _ in range(10):
        mid = invite_with_country(client, ana, other.id).json()["id"]
        m = client.post(f"/matches/{mid}/accept", headers=bea).json()
        assert m["status"] == "ready"
        assert m["country"]["slug"] == "france"
        assert m["country_chosen"] is True
        client.delete(f"/matches/{mid}", headers=ana)


def test_sin_elegir_pais_sigue_siendo_al_azar(client, db_session):
    ana, bea = setup_pair(client, db_session)
    m = invite(client, ana).json()
    assert m["country"] is None
    assert m["country_chosen"] is False
    accepted = client.post(f"/matches/{m['id']}/accept", headers=bea).json()
    assert accepted["country"]["slug"] == "spain"
    assert accepted["country_chosen"] is False


def test_no_se_puede_retar_con_un_pais_no_jugable(client, db_session):
    ana, _ = setup_pair(client, db_session)
    tiny, _ = make_country(db_session, "tiny", regions=("A", "B"))
    r = invite_with_country(client, ana, tiny.id)
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "country_not_playable"
    r = invite_with_country(client, ana, 99999)  # no existe
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "country_not_playable"
    # No quedó ninguna partida abierta por el intento fallido.
    assert client.get("/matches/mine", headers=ana).json()["current"] is None


def test_pais_sin_mapa_en_el_frontend_no_se_puede_elegir(client, db_session, monkeypatch):
    ana, _ = setup_pair(client, db_session)
    other, _ = make_country(db_session, "france", regions=("A", "B", "C", "D", "E"))
    monkeypatch.setattr(match_service, "_available_slugs", lambda: {"spain"})
    assert [c["slug"] for c in client.get("/matches/countries", headers=ana).json()] == ["spain"]
    r = invite_with_country(client, ana, other.id)
    assert r.status_code == 400
    assert r.json()["detail"]["code"] == "country_not_playable"
