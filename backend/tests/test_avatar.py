import struct
import zlib



def register(client, name):
    r = client.post(
        "/auth/register",
        json={"email": f"{name}@x.com", "username": name, "password": "password123"},
    )
    assert r.status_code == 201, r.text
    t = client.post("/auth/login", data={"username": f"{name}@x.com", "password": "password123"})
    return {"Authorization": f"Bearer {t.json()['access_token']}"}


def tiny_png() -> bytes:
    def chunk(tag: bytes, body: bytes) -> bytes:
        crc = zlib.crc32(tag + body) & 0xFFFFFFFF
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\x00\x00")
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


def put(client, headers, data, name="a.png"):
    return client.put("/auth/me/avatar", files={"archivo": (name, data, "image/png")}, headers=headers)


def test_sin_foto_por_defecto(client):
    h = register(client, "ana")
    assert client.get("/auth/me", headers=h).json()["avatar_updated_at"] is None
    assert client.get("/auth/me/avatar", headers=h).status_code == 404


def test_subir_ver_y_borrar(client):
    h = register(client, "ana")
    png = tiny_png()
    r = put(client, h, png)
    assert r.status_code == 200, r.text
    assert r.json()["avatar_updated_at"] is not None

    img = client.get("/auth/me/avatar", headers=h)
    assert img.status_code == 200
    assert img.headers["content-type"] == "image/png"
    assert img.content == png

    assert client.delete("/auth/me/avatar", headers=h).status_code == 204
    assert client.get("/auth/me/avatar", headers=h).status_code == 404
    assert client.get("/auth/me", headers=h).json()["avatar_updated_at"] is None


def test_reemplazar_foto(client):
    h = register(client, "ana")
    put(client, h, tiny_png())
    jpg = b"\xff\xd8\xff\xe0" + b"0" * 50
    assert put(client, h, jpg, "a.jpg").status_code == 200
    assert client.get("/auth/me/avatar", headers=h).headers["content-type"] == "image/jpeg"


def test_rechaza_svg_y_texto(client):
    h = register(client, "ana")
    svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    r = put(client, h, svg, "a.svg")
    assert r.status_code == 415
    assert r.json()["detail"]["code"] == "avatar_bad_type"


def test_rechaza_imagen_enorme(client):
    h = register(client, "ana")
    r = put(client, h, b"\xff\xd8\xff" + b"0" * (600 * 1024))
    assert r.status_code == 413
    assert r.json()["detail"]["code"] == "avatar_too_large"


def test_cada_usuario_tiene_su_foto(client):
    a = register(client, "ana")
    b = register(client, "beto")
    put(client, a, tiny_png())
    assert client.get("/auth/me/avatar", headers=b).status_code == 404


def test_requiere_sesion(client):
    assert client.get("/auth/me/avatar").status_code == 401
    assert client.put("/auth/me/avatar", files={"archivo": ("a.png", tiny_png())}).status_code == 401
