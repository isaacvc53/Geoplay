import unicodedata

def normalizar(texto: str) -> str:
    """minúsculas + sin tildes + sin espacios extra, para comparar nombres"""
    texto = texto.strip().lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return " ".join(texto.split())