from datetime import timedelta

from models.country_db import Country
from models.progress_db import GameSession, GameSessionAnswer
from models.region_db import Region
from models.region_name_db import RegionName
from models.utc import now_utc_naive


def register(client, name):
    r = client.post(
        "/auth/register",
        json={"email": f"{name}@x.com", "username": name, "password": "password123"},
    )
    assert r.status_code == 201, r.text
    t = client.post("/auth/login", data={"username": f"{name}@x.com", "password": "password123"})
    return {"Authorization": f"Bearer {t.json()['access_token']}"}


def befriend(client, a, b, b_name):
    r = client.post("/friends/requests", json={"username": b_name}, headers=a)
    fid = r.json()["friendship_id"]
    assert client.post(f"/friends/requests/{fid}/accept", json={}, headers=b).status_code == 200


def make_country(db, slug="espana", regions=("Madrid", "Sevilla", "Bilbao")):
    c = Country(nombre=slug.title(), slug=slug, capital="X", continente="Europa")
    db.add(c)
    db.flush()
    rs = []
    for n in regions:
        r = Region(country_id=c.id)
        db.add(r)
        db.flush()
        db.add(RegionName(region_id=r.id, language="es", name=n))
        rs.append(r)
    db.commit()
    return c, rs


def play(db, user_id, country, regions, correct_flags, time=60, days_ago=0):
    s = GameSession(
        user_id=user_id,
        country_id=country.id,
        total_regions=len(regions),
        correct_regions=sum(correct_flags),
        time_seconds=time,
        played_at=now_utc_naive() - timedelta(days=days_ago),
    )
    db.add(s)
    db.flush()
    for r, ok in zip(regions, correct_flags):
        db.add(GameSessionAnswer(session_id=s.id, region_id=r.id, correct=ok))
    db.commit()


def user_id(client, headers):
    return client.get("/auth/me", headers=headers).json()["id"]


def test_overview_includes_accuracy_and_last_played(client, db_session):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    c, rs = make_country(db_session)
    play(db_session, user_id(client, b), c, rs, [True, True, False])

    friends = client.get("/friends", headers=a).json()["friends"]
    assert len(friends) == 1
    assert friends[0]["games_played"] == 1
    assert friends[0]["accuracy"] == 66.7
    assert friends[0]["last_played_at"] is not None


def test_overview_friend_without_games(client):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    f = client.get("/friends", headers=a).json()["friends"][0]
    assert f["accuracy"] is None and f["last_played_at"] is None


def test_compare_requires_friendship(client):
    a, _b, = register(client, "alice"), register(client, "bob")
    # ni solicitud
    assert client.get("/compare", params={"with": "bob"}, headers=a).status_code == 404
    # solicitud pendiente: tampoco
    client.post("/friends/requests", json={"username": "bob"}, headers=a)
    assert client.get("/compare", params={"with": "bob"}, headers=a).status_code == 404
    # inexistente y uno mismo: mismo error (no filtra qué usuarios existen)
    r = client.get("/compare", params={"with": "nadie"}, headers=a)
    assert r.status_code == 404 and r.json()["detail"]["code"] == "friend_not_found"
    assert client.get("/compare", params={"with": "alice"}, headers=a).status_code == 404


def test_compare_requires_auth(client):
    assert client.get("/compare", params={"with": "bob"}).status_code == 401


def test_compare_summary_and_countries(client, db_session):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    ua, ub = user_id(client, a), user_id(client, b)
    es, es_r = make_country(db_session, "espana")
    fr, fr_r = make_country(db_session, "francia", ("Paris", "Lyon"))

    # alice: España 2 partidas (50 % y 100 % en 45 s), Francia no
    play(db_session, ua, es, es_r, [True, False, False], time=90, days_ago=1)
    play(db_session, ua, es, es_r, [True, True, True], time=45, days_ago=0)
    # bob: España 1 partida (66,7 %), Francia 1 (100 % en 30 s), sin jugar hoy
    play(db_session, ub, es, es_r, [True, True, False], time=70, days_ago=3)
    play(db_session, ub, fr, fr_r, [True, True], time=30, days_ago=2)

    r = client.get("/compare", params={"with": "bob", "tz_offset": 0}, headers=a)
    assert r.status_code == 200, r.text
    d = r.json()

    assert d["me"]["username"] == "alice" and d["friend"]["username"] == "bob"
    assert d["me"]["games_played"] == 2 and d["friend"]["games_played"] == 2
    assert d["me"]["countries_played"] == 1 and d["friend"]["countries_played"] == 2
    assert d["me"]["mastered_count"] == 1 and d["friend"]["mastered_count"] == 1
    assert d["me"]["fastest_perfect_seconds"] == 45
    assert d["friend"]["fastest_perfect_seconds"] == 30
    assert d["me"]["accuracy"] == 66.7  # 4 aciertos de 6
    assert d["me"]["streak"] == 2  # ayer y hoy
    assert d["friend"]["streak"] == 0  # última partida hace 2 días

    by_slug = {c["country_slug"]: c for c in d["countries"]}
    assert set(by_slug) == {"espana", "francia"}
    assert by_slug["espana"]["me"]["best_percentage"] == 100.0
    assert by_slug["espana"]["me"]["best_time_seconds"] == 45
    assert by_slug["espana"]["me"]["games_played"] == 2
    assert by_slug["espana"]["friend"]["best_percentage"] == 66.7
    assert by_slug["francia"]["me"] is None
    assert by_slug["francia"]["friend"]["best_percentage"] == 100.0


def test_compare_with_nobody_playing(client):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    d = client.get("/compare", params={"with": "BOB"}, headers=a).json()  # sin distinguir mayúsculas
    assert d["countries"] == []
    assert d["me"]["accuracy"] is None and d["me"]["streak"] == 0
    assert d["friend"]["fastest_perfect_seconds"] is None


def test_compare_streak_uses_viewer_timezone(client, db_session, monkeypatch):
    """Con el reloj fijo a 29-sep 00:30 UTC y partidas el 28 a las 23:30 UTC y el
    27 a las 12:00 UTC, la racha depende de la zona horaria de quien consulta."""
    from datetime import datetime

    import services.compare_service as cs

    monkeypatch.setattr(cs, "now_utc_naive", lambda: datetime(2026, 9, 29, 0, 30))
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    es, es_r = make_country(db_session)
    ua = user_id(client, a)
    for when in (datetime(2026, 9, 28, 23, 30), datetime(2026, 9, 27, 12, 0)):
        play(db_session, ua, es, es_r, [True, True, True])
        db_session.query(GameSession).filter(GameSession.user_id == ua).order_by(
            GameSession.id.desc()
        ).first().played_at = when
        db_session.commit()

    def streak(offset):
        r = client.get("/compare", params={"with": "bob", "tz_offset": offset}, headers=a)
        assert r.status_code == 200, r.text
        return r.json()["me"]["streak"]

    assert streak(0) == 2  # UTC: hoy (29) sin jugar -> cuenta 28 y 27
    assert streak(-120) == 1  # UTC+2: la del 28 23:30 UTC ya es "hoy" (29) y el 28 no se jugó
    # offset fuera de rango -> 422
    assert client.get("/compare", params={"with": "bob", "tz_offset": 9999}, headers=a).status_code == 422


def test_country_comparison_regions(client, db_session):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    ua, ub = user_id(client, a), user_id(client, b)
    es, es_r = make_country(db_session)
    play(db_session, ua, es, es_r, [True, True, False])
    play(db_session, ua, es, es_r, [True, False, False])
    play(db_session, ub, es, es_r[:2], [False, True])  # bob nunca vio Bilbao

    r = client.get(f"/compare/countries/{es.id}", params={"with": "bob"}, headers=a)
    assert r.status_code == 200, r.text
    regs = {x["region_name"]: x for x in r.json()["regions"]}
    assert set(regs) == {"Madrid", "Sevilla", "Bilbao"}
    assert regs["Madrid"]["me"] == {"attempts": 2, "correct": 2, "accuracy": 100.0}
    assert regs["Madrid"]["friend"]["accuracy"] == 0.0
    assert regs["Sevilla"]["me"]["accuracy"] == 50.0
    assert regs["Bilbao"]["friend"] is None
    assert regs["Bilbao"]["me"]["attempts"] == 2

    assert client.get("/compare/countries/9999", params={"with": "bob"}, headers=a).status_code == 404


def test_country_comparison_requires_friendship(client, db_session):
    a, _ = register(client, "alice"), register(client, "bob")
    es, _rs = make_country(db_session)
    r = client.get(f"/compare/countries/{es.id}", params={"with": "bob"}, headers=a)
    assert r.status_code == 404


def test_compare_ignores_third_parties(client, db_session):
    """Las partidas de un tercero (carol) no deben colarse en la comparación."""
    a, b, c_ = register(client, "alice"), register(client, "bob"), register(client, "carol")
    befriend(client, a, b, "bob")
    es, es_r = make_country(db_session)
    play(db_session, user_id(client, c_), es, es_r, [True, True, True])
    d = client.get("/compare", params={"with": "bob"}, headers=a).json()
    assert d["countries"] == [] and d["me"]["games_played"] == 0 and d["friend"]["games_played"] == 0


def test_removed_friend_cannot_be_compared(client):
    a, b = register(client, "alice"), register(client, "bob")
    befriend(client, a, b, "bob")
    fid = client.get("/friends", headers=a).json()["friends"][0]["friendship_id"]
    assert client.delete(f"/friends/{fid}", headers=a).status_code == 204
    assert client.get("/compare", params={"with": "bob"}, headers=a).status_code == 404
