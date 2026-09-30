"""
Borra países, regiones y nombres de regiones de la base de datos, para poder
volver a sembrarlos con seed_mundo.py.

SEGURO POR DEFECTO:
- Sin --confirmar solo MUESTRA lo que se borraría (países, regiones, nombres
  y partidas guardadas afectadas). No toca nada.
- Con --confirmar te pide escribir BORRAR antes de ejecutar.
- Todo el borrado va en una sola transacción: si algo falla, no se borra nada.
- Si hay partidas guardadas (game_sessions) de esos países, se niega a borrar,
  salvo que añadas --borrar-progreso (eso SÍ elimina el historial de los
  usuarios en esos países).

Va en backend/, junto a seed_mundo.py.

USO:
    python borrar_geografia.py --continente "Europa"              # solo informe
    python borrar_geografia.py --continente "Europa" --confirmar  # borra Europa
    python borrar_geografia.py --paises Chile España --confirmar
    python borrar_geografia.py --todo --confirmar                 # TODO el mundo
    python borrar_geografia.py --continente "Europa" --confirmar --borrar-progreso
"""

import argparse
import json
from pathlib import Path

from database.connection import SessionLocal
from models.country_db import Country
from models.region_db import Region
from models.region_name_db import RegionName
from models.progress_db import GameSession, GameSessionAnswer
import models.user_db  # noqa: F401  (registra la tabla users para las FK de game_sessions)

AQUI = Path(__file__).parent


def seleccionar_paises(db, args):
    """Países de la BD que coinciden con la selección (por nombre o por slug)."""
    todos = db.query(Country).all()
    if args.todo:
        return todos

    with open(AQUI / "paises_meta.json", encoding="utf-8") as f:
        metas = json.load(f)

    nombres, slugs = set(), set()
    for nombre, m in metas.items():
        if args.continente and m["continente"] != args.continente:
            continue
        if args.paises and nombre not in args.paises:
            continue
        nombres.add(nombre)
        slugs.update({m["slug_archivo"], m["slug_front"]})

    return [c for c in todos if c.nombre in nombres or c.slug in slugs]


def contar(db, model, *criterios):
    return db.query(model).filter(*criterios).count()


def main():
    ap = argparse.ArgumentParser(description="Borra países/regiones de la BD para resembrarlos.")
    ap.add_argument("--paises", nargs="+", help="Nombre (es) tal cual en paises_meta.json.")
    ap.add_argument("--continente", help="Borra los países de un continente (Europa, Asia, África, ...).")
    ap.add_argument("--todo", action="store_true", help="Todos los países de la BD.")
    ap.add_argument("--confirmar", action="store_true", help="Ejecuta el borrado (sin esto, solo informe).")
    ap.add_argument("--borrar-progreso", action="store_true",
                    help="Borra también las partidas guardadas (game_sessions) de esos países.")
    args = ap.parse_args()

    if not (args.todo or args.paises or args.continente):
        ap.error("indica qué borrar: --continente, --paises o --todo")

    db = SessionLocal()
    try:
        paises = seleccionar_paises(db, args)
        if not paises:
            print("Ningún país de la BD coincide con la selección. No hay nada que borrar.")
            return

        country_ids = [c.id for c in paises]
        region_ids = [r for (r,) in db.query(Region.id).filter(Region.country_id.in_(country_ids)).all()]
        sesion_ids = [s for (s,) in db.query(GameSession.id).filter(GameSession.country_id.in_(country_ids)).all()]

        n_nombres = contar(db, RegionName, RegionName.region_id.in_(region_ids)) if region_ids else 0
        n_resp = (
            contar(db, GameSessionAnswer,
                   GameSessionAnswer.session_id.in_(sesion_ids) | GameSessionAnswer.region_id.in_(region_ids))
            if (sesion_ids or region_ids) else 0
        )

        print(f"Países seleccionados ({len(paises)}): {', '.join(sorted(c.nombre for c in paises))}\n")
        print("Se borraría:")
        print(f"  países:                {len(country_ids)}")
        print(f"  regiones:              {len(region_ids)}")
        print(f"  nombres de regiones:   {n_nombres}")
        print(f"  partidas guardadas:    {len(sesion_ids)}")
        print(f"  respuestas guardadas:  {n_resp}")

        if sesion_ids and not args.borrar_progreso:
            print("\nHay partidas guardadas de estos países. Para borrar sin perder el historial no hay "
                  "forma limpia (los ids de región cambian al resembrar).")
            print("Si son solo pruebas, repite con --borrar-progreso. Si son de usuarios reales, "
                  "mejor NO borres y usa seed_mundo.py, que enriquece sin borrar.")
            return

        if not args.confirmar:
            print("\nSolo informe: no se ha borrado nada. Añade --confirmar para ejecutar.")
            return

        if args.borrar_progreso and sesion_ids:
            print("\nATENCIÓN: se eliminará también el historial de partidas de los usuarios en estos países.")
        if input("\nEscribe BORRAR para continuar: ").strip() != "BORRAR":
            print("Cancelado. No se ha borrado nada.")
            return

        # Orden respetando las claves foráneas: hijos primero.
        if sesion_ids or region_ids:
            db.query(GameSessionAnswer).filter(
                GameSessionAnswer.session_id.in_(sesion_ids) | GameSessionAnswer.region_id.in_(region_ids)
            ).delete(synchronize_session=False)
        if sesion_ids:
            db.query(GameSession).filter(GameSession.id.in_(sesion_ids)).delete(synchronize_session=False)
        if region_ids:
            db.query(RegionName).filter(RegionName.region_id.in_(region_ids)).delete(synchronize_session=False)
            db.query(Region).filter(Region.id.in_(region_ids)).delete(synchronize_session=False)
        db.query(Country).filter(Country.id.in_(country_ids)).delete(synchronize_session=False)

        db.commit()
        print("\nBorrado completado.")
        print("Siguiente paso: python seed_mundo.py --dry-run  (y luego sin --dry-run)")
        print("Después: vuelve a pasar fill_region_ids.py, porque los region_id de los .js han cambiado.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}\nNo se ha borrado nada (rollback).")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
