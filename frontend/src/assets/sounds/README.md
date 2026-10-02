# Sonidos del juego

El juego ya trae todos estos sonidos **sintetizados por código** (no hace falta ningún archivo).
Para usar uno propio, deja aquí un archivo con **exactamente** el nombre de la tabla
(`.mp3`, `.ogg`, `.wav`, `.m4a` o `.webm`). Si existe, sustituye al sintetizado; si lo borras,
vuelve el de por defecto. Con el servidor de desarrollo (`npm run dev`) se detecta solo; si
no, reinícialo.

| Nombre del archivo | Cuándo suena | Duración recomendada |
| --- | --- | --- |
| `tick`        | Cada vez que un país se apaga en la ruleta (se repite ~25 veces; cada vez un poco más agudo, y por eso conviene corto) | < 0,1 s |
| `land`        | La ruleta se para en el país elegido | 0,5 – 1 s |
| `countdown`   | Cada número del 3-2-1 | 0,2 – 0,4 s |
| `go`          | "Go!" al empezar la partida | 0,4 – 1 s |
| `match-found` | Se encuentra rival en la partida rápida | 0,5 – 1 s |
| `correct`     | Aciertas una región (también suena al activar el botón de sonido) | < 0,4 s |
| `wrong`       | Intento fallido (no suena mientras el juego prueba solo lo que vas escribiendo) | < 0,4 s |
| `rival-point` | El rival acierta una región | < 0,3 s |
| `win`         | Ganas la partida | 1 – 3 s |
| `lose`        | Pierdes la partida | 1 – 3 s |
| `draw`        | Empate | 1 – 2 s |

Consejos:
- Archivos pequeños (unos KB) y con el volumen ya equilibrado entre sí: el juego aplica un
  volumen general de 0,6 (ver `MASTER_VOLUME` en `src/lib/sound.js`).
- Sin silencios al principio del archivo, para que el sonido salga justo en el momento.
- Usa solo sonidos libres de derechos o creados por ti (por ejemplo, de licencia CC0).
