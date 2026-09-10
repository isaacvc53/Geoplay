import unicodedata
import re


def normalizar(texto: str) -> str:
    """Minúsculas, sin tildes, signos innecesarios y espacios extra."""
    texto = (texto or "").strip().lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[-_/.,'’()]+", " ", texto)
    return " ".join(texto.split())
